"""
Registration Router
Handle registration requests and admin approval
"""
from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import func, and_

from app.database import get_db
from app.models.user import User, UserRole, UserStatus
from app.models.registration import RegistrationRequest, RegistrationStatus
from app.schemas.registration import (
    RegistrationCreate,
    RegistrationResponse,
    RegistrationListResponse,
    RegistrationApprove,
    RegistrationReject,
    RegistrationStats
)
from app.utils.security import get_password_hash, get_current_user

router = APIRouter(prefix="/registrations", tags=["Registration"])


# ============== Public Endpoints ==============

@router.post("/", response_model=RegistrationResponse, status_code=status.HTTP_201_CREATED)
async def submit_registration(
    request: RegistrationCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Submit a new registration request (public endpoint)
    The request will be pending until approved by admin
    """
    # Check if email already exists in users
    existing_user = db.query(User).filter(User.email == request.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered"
        )
    
    # Check if email already has a pending registration
    existing_request = db.query(RegistrationRequest).filter(
        RegistrationRequest.email == request.email,
        RegistrationRequest.status == RegistrationStatus.PENDING
    ).first()
    if existing_request:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Registration request already submitted and pending approval"
        )
    
    # Create registration request
    registration = RegistrationRequest(
        email=request.email,
        hashed_password=get_password_hash(request.password),
        first_name=request.first_name,
        last_name=request.last_name,
        phone=request.phone,
        organization_name=request.organization_name,
        position=request.position,
        status=RegistrationStatus.PENDING
    )
    
    db.add(registration)
    db.commit()
    db.refresh(registration)
    
    # TODO: Send notification to admin (email/LINE)
    # background_tasks.add_task(notify_admin_new_registration, registration)
    
    return registration


@router.get("/status/{email}")
async def check_registration_status(
    email: str,
    db: Session = Depends(get_db)
):
    """
    Check registration status by email (public endpoint)
    Used by the pending approval page
    """
    registration = db.query(RegistrationRequest).filter(
        RegistrationRequest.email == email
    ).order_by(RegistrationRequest.created_at.desc()).first()
    
    if not registration:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No registration found for this email"
        )
    
    return {
        "email": registration.email,
        "status": registration.status,
        "created_at": registration.created_at,
        "rejection_reason": registration.rejection_reason if registration.status == RegistrationStatus.REJECTED else None
    }


# ============== Admin Endpoints ==============

@router.get("/", response_model=RegistrationListResponse)
async def list_registrations(
    status: Optional[RegistrationStatus] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List all registration requests (admin only)
    """
    # Check admin permission
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    # Build query
    query = db.query(RegistrationRequest)
    
    if status:
        query = query.filter(RegistrationRequest.status == status)
    
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (RegistrationRequest.email.ilike(search_filter)) |
            (RegistrationRequest.first_name.ilike(search_filter)) |
            (RegistrationRequest.last_name.ilike(search_filter)) |
            (RegistrationRequest.organization_name.ilike(search_filter))
        )
    
    # Get total count
    total = query.count()
    
    # Pagination
    pages = (total + page_size - 1) // page_size
    offset = (page - 1) * page_size
    
    registrations = query.order_by(RegistrationRequest.created_at.desc()) \
        .offset(offset).limit(page_size).all()
    
    return RegistrationListResponse(
        items=registrations,
        total=total,
        page=page,
        page_size=page_size,
        pages=pages
    )


@router.get("/stats", response_model=RegistrationStats)
async def get_registration_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get registration statistics (admin only)
    """
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    now = datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = today_start - timedelta(days=now.weekday())
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    total = db.query(RegistrationRequest).count()
    pending = db.query(RegistrationRequest).filter(
        RegistrationRequest.status == RegistrationStatus.PENDING
    ).count()
    approved = db.query(RegistrationRequest).filter(
        RegistrationRequest.status == RegistrationStatus.APPROVED
    ).count()
    rejected = db.query(RegistrationRequest).filter(
        RegistrationRequest.status == RegistrationStatus.REJECTED
    ).count()
    today = db.query(RegistrationRequest).filter(
        RegistrationRequest.created_at >= today_start
    ).count()
    this_week = db.query(RegistrationRequest).filter(
        RegistrationRequest.created_at >= week_start
    ).count()
    this_month = db.query(RegistrationRequest).filter(
        RegistrationRequest.created_at >= month_start
    ).count()
    
    return RegistrationStats(
        total=total,
        pending=pending,
        approved=approved,
        rejected=rejected,
        today=today,
        this_week=this_week,
        this_month=this_month
    )


@router.get("/{registration_id}", response_model=RegistrationResponse)
async def get_registration(
    registration_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get a specific registration request (admin only)
    """
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    registration = db.query(RegistrationRequest).filter(
        RegistrationRequest.id == registration_id
    ).first()
    
    if not registration:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Registration not found"
        )
    
    return registration


@router.post("/{registration_id}/approve", response_model=RegistrationResponse)
async def approve_registration(
    registration_id: int,
    request: RegistrationApprove,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Approve a registration request and create user account (admin only)
    """
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    registration = db.query(RegistrationRequest).filter(
        RegistrationRequest.id == registration_id
    ).first()
    
    if not registration:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Registration not found"
        )
    
    if registration.status != RegistrationStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Registration already {registration.status}"
        )
    
    # Check if email is now taken (rare but possible)
    existing_user = db.query(User).filter(User.email == registration.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered to another user"
        )
    
    # Calculate subscription dates
    now = datetime.utcnow()
    subscription_end = now + timedelta(days=request.subscription_days)
    
    # Map role string to enum
    role_map = {
        "super_admin": UserRole.SUPER_ADMIN,
        "org_admin": UserRole.ORG_ADMIN,
        "investigator": UserRole.INVESTIGATOR,
        "analyst": UserRole.ANALYST,
        "viewer": UserRole.VIEWER
    }
    user_role = role_map.get(request.role, UserRole.VIEWER)
    
    # Create user account
    user = User(
        email=registration.email,
        hashed_password=registration.hashed_password,
        first_name=registration.first_name,
        last_name=registration.last_name,
        phone=registration.phone,
        position=registration.position,
        organization_name=registration.organization_name,
        role=user_role,
        status=UserStatus.ACTIVE,
        is_active=True,
        is_verified=True,
        subscription_start=now,
        subscription_end=subscription_end,
        approved_by=current_user.id,
        approved_at=now
    )
    
    db.add(user)
    
    # Update registration status
    registration.status = RegistrationStatus.APPROVED
    registration.processed_by = current_user.id
    registration.processed_at = now
    registration.subscription_days = request.subscription_days
    
    db.commit()
    db.refresh(registration)
    
    # TODO: Send notification to user (email)
    # background_tasks.add_task(notify_user_approved, user, subscription_end)
    
    return registration


@router.post("/{registration_id}/reject", response_model=RegistrationResponse)
async def reject_registration(
    registration_id: int,
    request: RegistrationReject,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Reject a registration request (admin only)
    """
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    registration = db.query(RegistrationRequest).filter(
        RegistrationRequest.id == registration_id
    ).first()
    
    if not registration:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Registration not found"
        )
    
    if registration.status != RegistrationStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Registration already {registration.status}"
        )
    
    # Update registration status
    now = datetime.utcnow()
    registration.status = RegistrationStatus.REJECTED
    registration.processed_by = current_user.id
    registration.processed_at = now
    registration.rejection_reason = request.reason
    
    db.commit()
    db.refresh(registration)
    
    # TODO: Send notification to user (email)
    # background_tasks.add_task(notify_user_rejected, registration.email, request.reason)
    
    return registration


@router.delete("/{registration_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_registration(
    registration_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a registration request (admin only, for cleanup)
    """
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super admin access required"
        )
    
    registration = db.query(RegistrationRequest).filter(
        RegistrationRequest.id == registration_id
    ).first()
    
    if not registration:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Registration not found"
        )
    
    db.delete(registration)
    db.commit()
