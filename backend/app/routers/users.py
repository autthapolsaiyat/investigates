"""
Users Router
User management CRUD endpoints
"""
from math import ceil
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
    UserListResponse
)
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
