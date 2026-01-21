"""
Users Router
User management CRUD endpoints
"""
from math import ceil
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database import get_db
from app.models.user import User, UserRole
from app.schemas.user import (
    UserCreate,
    UserUpdate,
    UserUpdatePassword,
    UserResponse,
    UserListResponse,
    RenewSubscriptionRequest,
    RenewSubscriptionResponse,
    ResetPasswordResponse
)
import secrets
import string
from app.utils.security import (
    get_current_user,
    get_password_hash,
    verify_password,
    require_roles
)

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("", response_model=UserListResponse)
async def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str = Query(None),
    role: UserRole = Query(None),
    organization_id: int = Query(None),
    is_active: bool = Query(None),
    current_user: User = Depends(require_roles("super_admin", "org_admin")),
    db: Session = Depends(get_db)
):
    """
    List all users with pagination and filters
    Requires: super_admin or org_admin role
    """
    query = db.query(User)
    
    # Org admins can only see users in their organization
    if current_user.role == UserRole.ORG_ADMIN:
        query = query.filter(User.organization_id == current_user.organization_id)
    elif organization_id:
        query = query.filter(User.organization_id == organization_id)
    
    # Search filter
    if search:
        query = query.filter(
            or_(
                User.email.ilike(f"%{search}%"),
                User.first_name.ilike(f"%{search}%"),
                User.last_name.ilike(f"%{search}%")
            )
        )
    
    # Role filter
    if role:
        query = query.filter(User.role == role)
    
    # Active filter
    if is_active is not None:
        query = query.filter(User.is_active == is_active)
    
    # Count total
    total = query.count()
    
    # Paginate
    users = query.order_by(User.created_at.desc()) \
                 .offset((page - 1) * page_size) \
                 .limit(page_size) \
                 .all()
    
    return UserListResponse(
        items=[UserResponse.model_validate(u) for u in users],
        total=total,
        page=page,
        page_size=page_size,
        pages=ceil(total / page_size) if total > 0 else 1
    )


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    request: UserCreate,
    current_user: User = Depends(require_roles("super_admin", "org_admin")),
    db: Session = Depends(get_db)
):
    """
    Create a new user (admin only)
    """
    # Check email uniqueness
    existing = db.query(User).filter(User.email == request.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already exists"
        )
    
    # Org admin can only create users in their org
    org_id = request.organization_id
    if current_user.role == UserRole.ORG_ADMIN:
        org_id = current_user.organization_id
    
    # Create user
    user = User(
        email=request.email,
        hashed_password=get_password_hash(request.password),
        first_name=request.first_name,
        last_name=request.last_name,
        phone=request.phone,
        role=request.role,
        organization_id=org_id,
        is_active=True
    )
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return UserResponse.model_validate(user)


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get user by ID
    """
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check permission
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN]:
        if current_user.id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
    
    # Org admin can only see users in their org
    if current_user.role == UserRole.ORG_ADMIN:
        if user.organization_id != current_user.organization_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
    
    return UserResponse.model_validate(user)


@router.patch("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    request: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update user
    """
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Permission check
    is_self = current_user.id == user_id
    is_admin = current_user.role in [UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN]
    
    if not is_self and not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Non-admin can only update basic info
    if not is_admin:
        allowed_fields = {"first_name", "last_name", "phone", "avatar_url"}
        update_data = request.model_dump(exclude_unset=True)
        for key in list(update_data.keys()):
            if key not in allowed_fields:
                del update_data[key]
    else:
        update_data = request.model_dump(exclude_unset=True)
    
    # Update fields
    for key, value in update_data.items():
        setattr(user, key, value)
    
    db.commit()
    db.refresh(user)
    
    return UserResponse.model_validate(user)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: int,
    current_user: User = Depends(require_roles("super_admin")),
    db: Session = Depends(get_db)
):
    """
    Delete user (super admin only)
    """
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Can't delete yourself
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete yourself"
        )
    
    db.delete(user)
    db.commit()


@router.post("/{user_id}/change-password")
async def change_password(
    user_id: int,
    request: UserUpdatePassword,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Change user password
    """
    # Can only change own password
    if current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Can only change your own password"
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    
    # Verify current password
    if not verify_password(request.current_password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    # Update password
    user.hashed_password = get_password_hash(request.new_password)
    db.commit()
    
    return {"message": "Password changed successfully"}


# ============== Admin Actions ==============

def generate_temp_password(length: int = 12) -> str:
    """Generate a secure temporary password"""
    # At least: 1 uppercase, 1 lowercase, 1 digit, 1 special char
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    while True:
        password = ''.join(secrets.choice(alphabet) for _ in range(length))
        # Check requirements
        if (any(c.islower() for c in password)
            and any(c.isupper() for c in password)
            and any(c.isdigit() for c in password)
            and any(c in "!@#$%^&*" for c in password)):
            return password


@router.post("/{user_id}/reset-password", response_model=ResetPasswordResponse)
async def admin_reset_password(
    user_id: int,
    current_user: User = Depends(require_roles("super_admin", "org_admin")),
    db: Session = Depends(get_db)
):
    """
    Admin resets user password with a randomly generated temporary password.
    User should change this password on next login.
    """
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Org admin can only reset users in their org
    if current_user.role == UserRole.ORG_ADMIN:
        if user.organization_id != current_user.organization_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot reset password for users outside your organization"
            )
    
    # Cannot reset your own password via this endpoint
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Use change-password endpoint for your own password"
        )
    
    # Generate new password
    temp_password = generate_temp_password()
    user.hashed_password = get_password_hash(temp_password)
    
    db.commit()
    
    return ResetPasswordResponse(
        message="Password has been reset successfully",
        user_id=user.id,
        temporary_password=temp_password
    )


@router.post("/{user_id}/renew-subscription", response_model=RenewSubscriptionResponse)
async def renew_subscription(
    user_id: int,
    request: RenewSubscriptionRequest,
    current_user: User = Depends(require_roles("super_admin")),
    db: Session = Depends(get_db)
):
    """
    Renew/extend user subscription.
    - If no subscription exists, starts from today
    - If subscription already exists, adds days from current end date (or today if expired)
    """
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    now = datetime.utcnow()
    
    # Determine start date
    if user.subscription_end and user.subscription_end > now:
        # Still valid: extend from current end date
        base_date = user.subscription_end
    else:
        # Expired or no subscription: start from today
        base_date = now
        if not user.subscription_start:
            user.subscription_start = now
    
    # Calculate new end date
    new_end_date = base_date + timedelta(days=request.days)
    user.subscription_end = new_end_date
    
    # Ensure user is active
    user.is_active = True
    
    db.commit()
    db.refresh(user)
    
    return RenewSubscriptionResponse(
        message="Subscription renewed successfully",
        user_id=user.id,
        subscription_start=user.subscription_start,
        subscription_end=user.subscription_end,
        days_added=request.days
    )


@router.post("/{user_id}/cancel-subscription")
async def cancel_subscription(
    user_id: int,
    current_user: User = Depends(require_roles("super_admin")),
    db: Session = Depends(get_db)
):
    """
    Cancel user subscription (set end date to now).
    User will be marked as inactive.
    """
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Cannot cancel your own subscription
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot cancel your own subscription"
        )
    
    # Set subscription end to now
    user.subscription_end = datetime.utcnow()
    user.is_active = False
    
    db.commit()
    
    return {
        "message": "Subscription cancelled successfully",
        "user_id": user.id
    }
