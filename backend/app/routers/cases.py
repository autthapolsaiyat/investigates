"""
Cases Router
Case management CRUD endpoints
"""
from math import ceil
from datetime import datetime
import uuid
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, or_

from app.database import get_db
from app.models.case import Case, CaseStatus, CaseType, CasePriority
from app.models.user import User, UserRole
from app.models.money_flow import MoneyFlowNode, MoneyFlowEdge
from app.schemas.case import (
    CaseCreate,
    CaseUpdate,
    CaseStatusUpdate,
    CaseResponse,
    CaseListResponse,
    CaseStatistics
)
from app.schemas.user import UserBrief
from app.utils.security import get_current_user, require_roles

router = APIRouter(prefix="/cases", tags=["Cases"])


def generate_case_number() -> str:
    """Generate unique case number"""
    timestamp = datetime.utcnow().strftime("%Y%m%d")
    unique_id = uuid.uuid4().hex[:6].upper()
    return f"CASE-{timestamp}-{unique_id}"


@router.get("", response_model=CaseListResponse)
async def list_cases(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str = Query(None),
    case_type: CaseType = Query(None),
    status: CaseStatus = Query(None),
    priority: CasePriority = Query(None),
    assigned_to: int = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List cases with pagination and filters
    """
    query = db.query(Case).options(
        joinedload(Case.created_by_user),
        joinedload(Case.assigned_to_user)
    )
    
    # Filter by organization (non-super-admin can only see their org's cases)
    if current_user.role != UserRole.SUPER_ADMIN:
        query = query.filter(Case.organization_id == current_user.organization_id)
    
    # Search filter
    if search:
        query = query.filter(
            or_(
                Case.case_number.ilike(f"%{search}%"),
                Case.title.ilike(f"%{search}%"),
                Case.description.ilike(f"%{search}%")
            )
        )
    
    # Type filter
    if case_type:
        query = query.filter(Case.case_type == case_type)
    
    # Status filter
    if status:
        query = query.filter(Case.status == status)
    
    # Priority filter
    if priority:
        query = query.filter(Case.priority == priority)
    
    # Assigned to filter
    if assigned_to:
        query = query.filter(Case.assigned_to == assigned_to)
    
    # Count total
    total = query.count()
    
    # Paginate
    cases = query.order_by(Case.created_at.desc()) \
                 .offset((page - 1) * page_size) \
                 .limit(page_size) \
                 .all()
    
    # Build response with computed fields
    items = []
    for case in cases:
        case_response = CaseResponse.model_validate(case)
        
        # Add user info
        if case.created_by_user:
            case_response.created_by_user = UserBrief.model_validate(case.created_by_user)
        if case.assigned_to_user:
            case_response.assigned_to_user = UserBrief.model_validate(case.assigned_to_user)
        
        # Add node/edge counts
        case_response.nodes_count = db.query(MoneyFlowNode).filter(MoneyFlowNode.case_id == case.id).count()
        case_response.edges_count = db.query(MoneyFlowEdge).filter(MoneyFlowEdge.case_id == case.id).count()
        
        items.append(case_response)
    
    return CaseListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        pages=ceil(total / page_size) if total > 0 else 1
    )


@router.post("", response_model=CaseResponse, status_code=status.HTTP_201_CREATED)
async def create_case(
    request: CaseCreate,
    current_user: User = Depends(require_roles("super_admin", "org_admin", "investigator")),
    db: Session = Depends(get_db)
):
    """
    Create a new case
    """
    # Must have organization
    if not current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User must belong to an organization to create cases"
        )
    
    # Generate case number
    case_number = generate_case_number()
    
    # Create case
    case = Case(
        case_number=case_number,
        title=request.title,
        description=request.description,
        case_type=request.case_type,
        status=CaseStatus.DRAFT,
        priority=request.priority,
        total_amount=request.total_amount,
        currency=request.currency,
        victims_count=request.victims_count,
        suspects_count=request.suspects_count,
        incident_date=request.incident_date,
        reported_date=request.reported_date,
        tags=request.tags,
        organization_id=current_user.organization_id,
        created_by=current_user.id,
        assigned_to=request.assigned_to or current_user.id
    )
    
    db.add(case)
    db.commit()
    db.refresh(case)
    
    return CaseResponse.model_validate(case)


@router.get("/statistics", response_model=CaseStatistics)
async def get_case_statistics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get case statistics for dashboard
    """
    query = db.query(Case)
    
    # Filter by organization
    if current_user.role != UserRole.SUPER_ADMIN:
        query = query.filter(Case.organization_id == current_user.organization_id)
    
    # Total cases
    total_cases = query.count()
    
    # Open cases
    open_cases = query.filter(Case.status.in_([
        CaseStatus.OPEN, 
        CaseStatus.IN_PROGRESS, 
        CaseStatus.PENDING_REVIEW
    ])).count()
    
    # Closed cases
    closed_cases = query.filter(Case.status.in_([
        CaseStatus.CLOSED,
        CaseStatus.ARCHIVED
    ])).count()
    
    # Total amount
    total_amount = db.query(func.sum(Case.total_amount))
    if current_user.role != UserRole.SUPER_ADMIN:
        total_amount = total_amount.filter(Case.organization_id == current_user.organization_id)
    total_amount = total_amount.scalar() or 0
    
    # Total victims
    total_victims = db.query(func.sum(Case.victims_count))
    if current_user.role != UserRole.SUPER_ADMIN:
        total_victims = total_victims.filter(Case.organization_id == current_user.organization_id)
    total_victims = total_victims.scalar() or 0
    
    # By type
    by_type = {}
    for case_type in CaseType:
        count = query.filter(Case.case_type == case_type).count()
        if count > 0:
            by_type[case_type.value] = count
    
    # By status
    by_status = {}
    for case_status in CaseStatus:
        count = query.filter(Case.status == case_status).count()
        if count > 0:
            by_status[case_status.value] = count
    
    # By priority
    by_priority = {}
    for case_priority in CasePriority:
        count = query.filter(Case.priority == case_priority).count()
        if count > 0:
            by_priority[case_priority.value] = count
    
    return CaseStatistics(
        total_cases=total_cases,
        open_cases=open_cases,
        closed_cases=closed_cases,
        total_amount=total_amount,
        total_victims=total_victims,
        by_type=by_type,
        by_status=by_status,
        by_priority=by_priority
    )


@router.get("/{case_id}", response_model=CaseResponse)
async def get_case(
    case_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get case by ID
    """
    case = db.query(Case).options(
        joinedload(Case.created_by_user),
        joinedload(Case.assigned_to_user)
    ).filter(Case.id == case_id).first()
    
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Case not found"
        )
    
    # Permission check
    if current_user.role != UserRole.SUPER_ADMIN:
        if case.organization_id != current_user.organization_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
    
    response = CaseResponse.model_validate(case)
    
    # Add user info
    if case.created_by_user:
        response.created_by_user = UserBrief.model_validate(case.created_by_user)
    if case.assigned_to_user:
        response.assigned_to_user = UserBrief.model_validate(case.assigned_to_user)
    
    # Add counts
    response.nodes_count = db.query(MoneyFlowNode).filter(MoneyFlowNode.case_id == case_id).count()
    response.edges_count = db.query(MoneyFlowEdge).filter(MoneyFlowEdge.case_id == case_id).count()
    
    return response


@router.patch("/{case_id}", response_model=CaseResponse)
async def update_case(
    case_id: int,
    request: CaseUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update case
    """
    case = db.query(Case).filter(Case.id == case_id).first()
    
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Case not found"
        )
    
    # Permission check
    if current_user.role != UserRole.SUPER_ADMIN:
        if case.organization_id != current_user.organization_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
    
    # Viewers and analysts can't edit
    if current_user.role in [UserRole.VIEWER, UserRole.ANALYST]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to edit cases"
        )
    
    # Update fields
    update_data = request.model_dump(exclude_unset=True)
    
    # Handle status change
    if "status" in update_data:
        if update_data["status"] in [CaseStatus.CLOSED, CaseStatus.ARCHIVED]:
            case.closed_date = datetime.utcnow()
    
    for key, value in update_data.items():
        setattr(case, key, value)
    
    db.commit()
    db.refresh(case)
    
    return CaseResponse.model_validate(case)


@router.patch("/{case_id}/status", response_model=CaseResponse)
async def update_case_status(
    case_id: int,
    request: CaseStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Quick status update
    """
    case = db.query(Case).filter(Case.id == case_id).first()
    
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Case not found"
        )
    
    # Permission check
    if current_user.role != UserRole.SUPER_ADMIN:
        if case.organization_id != current_user.organization_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
    
    # Update status
    case.status = request.status
    
    if request.notes:
        case.internal_notes = (case.internal_notes or "") + f"\n[{datetime.utcnow()}] {request.notes}"
    
    if request.status in [CaseStatus.CLOSED, CaseStatus.ARCHIVED]:
        case.closed_date = datetime.utcnow()
    
    db.commit()
    db.refresh(case)
    
    return CaseResponse.model_validate(case)


@router.delete("/{case_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_case(
    case_id: int,
    current_user: User = Depends(require_roles("super_admin", "org_admin")),
    db: Session = Depends(get_db)
):
    """
    Delete case (admin only)
    """
    case = db.query(Case).filter(Case.id == case_id).first()
    
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Case not found"
        )
    
    # Org admin can only delete their org's cases
    if current_user.role == UserRole.ORG_ADMIN:
        if case.organization_id != current_user.organization_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
    
    db.delete(case)
    db.commit()
