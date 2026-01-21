"""
Cases Router
Case management CRUD endpoints with Soft Delete support
"""
from math import ceil
from datetime import datetime
import uuid
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, or_
from typing import Optional

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
    CaseStatistics,
    DeletedCaseResponse
)
from app.schemas.user import UserBrief
from app.utils.security import get_current_user, require_roles

router = APIRouter(prefix="/cases", tags=["Cases"])


def generate_case_number() -> str:
    """Generate unique case number"""
    timestamp = datetime.utcnow().strftime("%Y%m%d")
    unique_id = uuid.uuid4().hex[:6].upper()
    return f"CASE-{timestamp}-{unique_id}"


# ============================================
# REGULAR ENDPOINTS (Filter is_active=True)
# ============================================

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
    List active cases with pagination and filters
    Only returns is_active=True cases
    - Super Admin: sees all cases
    - Org Admin: sees all cases in their organization
    - Investigator: sees only cases they created or are assigned to
    - Analyst/Viewer: sees only cases assigned to them
    """
    query = db.query(Case).options(
        joinedload(Case.created_by_user),
        joinedload(Case.assigned_to_user)
    )
    
    # ★ SOFT DELETE: Only show active cases
    query = query.filter(Case.is_active == True)
    
    # ★ ROLE-BASED FILTERING
    if current_user.role == UserRole.SUPER_ADMIN:
        # Super Admin sees all cases
        pass
    elif current_user.role == UserRole.ORG_ADMIN:
        # Org Admin sees all cases in their organization
        query = query.filter(Case.organization_id == current_user.organization_id)
    else:
        # Investigator, Analyst, Viewer: see only their own cases
        # (cases they created OR cases assigned to them)
        query = query.filter(
            Case.organization_id == current_user.organization_id,
            or_(
                Case.created_by == current_user.id,
                Case.assigned_to == current_user.id
            )
        )
    
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
    
    # Create case (is_active defaults to True)
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
        assigned_to=request.assigned_to or current_user.id,
        is_active=True  # Explicitly set
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
    Only counts active cases visible to the user
    """
    query = db.query(Case)
    
    # ★ SOFT DELETE: Only count active cases
    query = query.filter(Case.is_active == True)
    
    # ★ ROLE-BASED FILTERING (same as list_cases)
    if current_user.role == UserRole.SUPER_ADMIN:
        pass
    elif current_user.role == UserRole.ORG_ADMIN:
        query = query.filter(Case.organization_id == current_user.organization_id)
    else:
        # Investigator, Analyst, Viewer: see only their own cases
        query = query.filter(
            Case.organization_id == current_user.organization_id,
            or_(
                Case.created_by == current_user.id,
                Case.assigned_to == current_user.id
            )
        )
    
    # Total cases
    total_cases = query.count()
    
    # Open cases - need fresh subquery with same filters
    open_query = db.query(Case).filter(Case.is_active == True)
    if current_user.role == UserRole.SUPER_ADMIN:
        pass
    elif current_user.role == UserRole.ORG_ADMIN:
        open_query = open_query.filter(Case.organization_id == current_user.organization_id)
    else:
        open_query = open_query.filter(
            Case.organization_id == current_user.organization_id,
            or_(Case.created_by == current_user.id, Case.assigned_to == current_user.id)
        )
    
    open_cases = open_query.filter(Case.status.in_([
        CaseStatus.OPEN, 
        CaseStatus.IN_PROGRESS, 
        CaseStatus.PENDING_REVIEW
    ])).count()
    
    # Closed cases
    closed_cases = open_query.filter(Case.status.in_([
        CaseStatus.CLOSED,
        CaseStatus.ARCHIVED
    ])).count()
    
    # Total amount
    amount_query = db.query(func.sum(Case.total_amount)).filter(Case.is_active == True)
    if current_user.role == UserRole.SUPER_ADMIN:
        pass
    elif current_user.role == UserRole.ORG_ADMIN:
        amount_query = amount_query.filter(Case.organization_id == current_user.organization_id)
    else:
        amount_query = amount_query.filter(
            Case.organization_id == current_user.organization_id,
            or_(Case.created_by == current_user.id, Case.assigned_to == current_user.id)
        )
    total_amount = amount_query.scalar() or 0
    
    # Total victims
    victims_query = db.query(func.sum(Case.victims_count)).filter(Case.is_active == True)
    if current_user.role == UserRole.SUPER_ADMIN:
        pass
    elif current_user.role == UserRole.ORG_ADMIN:
        victims_query = victims_query.filter(Case.organization_id == current_user.organization_id)
    else:
        victims_query = victims_query.filter(
            Case.organization_id == current_user.organization_id,
            or_(Case.created_by == current_user.id, Case.assigned_to == current_user.id)
        )
    total_victims = victims_query.scalar() or 0
    
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


# ============================================
# ★ ADMIN ENDPOINTS - DELETED CASES MANAGEMENT
# ============================================
# NOTE: These must come BEFORE /{case_id} routes to avoid path conflicts

@router.get("/admin/deleted", response_model=list[DeletedCaseResponse])
async def list_deleted_cases(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str = Query(None),
    current_user: User = Depends(require_roles("super_admin", "org_admin")),
    db: Session = Depends(get_db)
):
    """
    List deleted cases (Admin only)
    For restore functionality
    """
    query = db.query(Case).filter(Case.is_active == False)
    
    # Org admin can only see their org's deleted cases
    if current_user.role != UserRole.SUPER_ADMIN:
        query = query.filter(Case.organization_id == current_user.organization_id)
    
    # Search filter
    if search:
        query = query.filter(
            or_(
                Case.case_number.ilike(f"%{search}%"),
                Case.title.ilike(f"%{search}%")
            )
        )
    
    # Order by deleted_at desc (most recently deleted first)
    cases = query.order_by(Case.deleted_at.desc()) \
                 .offset((page - 1) * page_size) \
                 .limit(page_size) \
                 .all()
    
    # Build response with deleted_by email
    result = []
    for case in cases:
        item = DeletedCaseResponse.model_validate(case)
        
        # Get deleted_by user email
        if case.deleted_by:
            deleted_user = db.query(User).filter(User.id == case.deleted_by).first()
            if deleted_user:
                item.deleted_by_email = deleted_user.email
        
        result.append(item)
    
    return result


@router.get("/admin/deleted/count")
async def count_deleted_cases(
    current_user: User = Depends(require_roles("super_admin", "org_admin")),
    db: Session = Depends(get_db)
):
    """
    Get count of deleted cases
    """
    query = db.query(Case).filter(Case.is_active == False)
    
    if current_user.role != UserRole.SUPER_ADMIN:
        query = query.filter(Case.organization_id == current_user.organization_id)
    
    count = query.count()
    
    return {"deleted_count": count}


# ============================================
# SINGLE CASE ENDPOINTS
# ============================================

@router.get("/{case_id}", response_model=CaseResponse)
async def get_case(
    case_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get case by ID (only active cases)
    """
    case = db.query(Case).options(
        joinedload(Case.created_by_user),
        joinedload(Case.assigned_to_user)
    ).filter(
        Case.id == case_id,
        Case.is_active == True  # ★ SOFT DELETE: Only get active cases
    ).first()
    
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
    Update case (only active cases)
    """
    case = db.query(Case).filter(
        Case.id == case_id,
        Case.is_active == True  # ★ SOFT DELETE
    ).first()
    
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
    case = db.query(Case).filter(
        Case.id == case_id,
        Case.is_active == True  # ★ SOFT DELETE
    ).first()
    
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


# ============================================
# ★ SOFT DELETE ENDPOINT
# ============================================

@router.delete("/{case_id}", status_code=status.HTTP_200_OK)
async def delete_case(
    case_id: int,
    current_user: User = Depends(require_roles("super_admin", "org_admin", "investigator")),
    db: Session = Depends(get_db)
):
    """
    Soft delete case (set is_active=False)
    Data is preserved and can be restored by admin
    """
    case = db.query(Case).filter(
        Case.id == case_id,
        Case.is_active == True  # Can only delete active cases
    ).first()
    
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Case not found"
        )
    
    # Permission check: org users can only delete their org's cases
    if current_user.role != UserRole.SUPER_ADMIN:
        if case.organization_id != current_user.organization_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
    
    # ★ SOFT DELETE: Set flags instead of deleting
    case.is_active = False
    case.deleted_at = datetime.utcnow()
    case.deleted_by = current_user.id
    
    db.commit()
    
    return {
        "message": "Case deleted successfully",
        "case_id": case_id,
        "case_number": case.case_number,
        "deleted_by": current_user.email,
        "deleted_at": case.deleted_at.isoformat()
    }


@router.post("/{case_id}/restore", response_model=CaseResponse)
async def restore_case(
    case_id: int,
    current_user: User = Depends(require_roles("super_admin", "org_admin")),
    db: Session = Depends(get_db)
):
    """
    Restore a deleted case (Admin only)
    Sets is_active back to True
    """
    case = db.query(Case).filter(
        Case.id == case_id,
        Case.is_active == False  # Can only restore deleted cases
    ).first()
    
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deleted case not found"
        )
    
    # Permission check
    if current_user.role != UserRole.SUPER_ADMIN:
        if case.organization_id != current_user.organization_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
    
    # ★ RESTORE: Set is_active back to True and clear delete info
    case.is_active = True
    case.deleted_at = None
    case.deleted_by = None
    
    # Add note about restoration
    restore_note = f"\n[{datetime.utcnow()}] Case restored by {current_user.email}"
    case.internal_notes = (case.internal_notes or "") + restore_note
    
    db.commit()
    db.refresh(case)
    
    return CaseResponse.model_validate(case)


@router.delete("/{case_id}/permanent", status_code=status.HTTP_204_NO_CONTENT)
async def permanent_delete_case(
    case_id: int,
    current_user: User = Depends(require_roles("super_admin")),
    db: Session = Depends(get_db)
):
    """
    Permanently delete a case (Super Admin only)
    WARNING: This cannot be undone!
    """
    case = db.query(Case).filter(
        Case.id == case_id,
        Case.is_active == False  # Can only permanently delete already soft-deleted cases
    ).first()
    
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deleted case not found. Case must be soft-deleted first."
        )
    
    # Actually delete from database
    db.delete(case)
    db.commit()
