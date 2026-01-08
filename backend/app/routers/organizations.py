"""
Organizations Router
Organization management CRUD endpoints
"""
from math import ceil
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.organization import Organization
from app.models.user import User, UserRole
from app.models.case import Case
from app.schemas.organization import (
    OrganizationCreate,
    OrganizationUpdate,
    OrganizationLicenseUpdate,
    OrganizationResponse,
    OrganizationListResponse
)
from app.utils.security import get_current_user, require_roles

router = APIRouter(prefix="/organizations", tags=["Organizations"])


@router.get("", response_model=OrganizationListResponse)
async def list_organizations(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str = Query(None),
    is_active: bool = Query(None),
    current_user: User = Depends(require_roles("super_admin")),
    db: Session = Depends(get_db)
):
    """
    List all organizations (super admin only)
    """
    query = db.query(Organization)
    
    # Search filter
    if search:
        query = query.filter(
            Organization.name.ilike(f"%{search}%") |
            Organization.code.ilike(f"%{search}%")
        )
    
    # Active filter
    if is_active is not None:
        query = query.filter(Organization.is_active == is_active)
    
    # Count total
    total = query.count()
    
    # Paginate
    orgs = query.order_by(Organization.created_at.desc()) \
                .offset((page - 1) * page_size) \
                .limit(page_size) \
                .all()
    
    # Add computed fields
    items = []
    for org in orgs:
        org_response = OrganizationResponse.model_validate(org)
        org_response.users_count = db.query(User).filter(User.organization_id == org.id).count()
        org_response.cases_count = db.query(Case).filter(Case.organization_id == org.id).count()
        items.append(org_response)
    
    return OrganizationListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        pages=ceil(total / page_size) if total > 0 else 1
    )


@router.post("", response_model=OrganizationResponse, status_code=status.HTTP_201_CREATED)
async def create_organization(
    request: OrganizationCreate,
    current_user: User = Depends(require_roles("super_admin")),
    db: Session = Depends(get_db)
):
    """
    Create a new organization (super admin only)
    """
    # Check code uniqueness
    existing = db.query(Organization).filter(Organization.code == request.code).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Organization code already exists"
        )
    
    # Check name uniqueness
    existing_name = db.query(Organization).filter(Organization.name == request.name).first()
    if existing_name:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Organization name already exists"
        )
    
    # Create organization
    org = Organization(
        name=request.name,
        code=request.code.upper(),
        description=request.description,
        address=request.address,
        phone=request.phone,
        email=request.email,
        max_users=request.max_users,
        is_active=True
    )
    
    db.add(org)
    db.commit()
    db.refresh(org)
    
    return OrganizationResponse.model_validate(org)


@router.get("/{org_id}", response_model=OrganizationResponse)
async def get_organization(
    org_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get organization by ID
    """
    org = db.query(Organization).filter(Organization.id == org_id).first()
    
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found"
        )
    
    # Permission check
    if current_user.role != UserRole.SUPER_ADMIN:
        if current_user.organization_id != org_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
    
    response = OrganizationResponse.model_validate(org)
    response.users_count = db.query(User).filter(User.organization_id == org_id).count()
    response.cases_count = db.query(Case).filter(Case.organization_id == org_id).count()
    
    return response


@router.patch("/{org_id}", response_model=OrganizationResponse)
async def update_organization(
    org_id: int,
    request: OrganizationUpdate,
    current_user: User = Depends(require_roles("super_admin", "org_admin")),
    db: Session = Depends(get_db)
):
    """
    Update organization
    """
    org = db.query(Organization).filter(Organization.id == org_id).first()
    
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found"
        )
    
    # Org admin can only update their own org
    if current_user.role == UserRole.ORG_ADMIN:
        if current_user.organization_id != org_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        # Org admin can't change certain fields
        allowed_fields = {"name", "description", "address", "phone", "email"}
        update_data = request.model_dump(exclude_unset=True)
        for key in list(update_data.keys()):
            if key not in allowed_fields:
                del update_data[key]
    else:
        update_data = request.model_dump(exclude_unset=True)
    
    # Update fields
    for key, value in update_data.items():
        setattr(org, key, value)
    
    db.commit()
    db.refresh(org)
    
    return OrganizationResponse.model_validate(org)


@router.delete("/{org_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_organization(
    org_id: int,
    current_user: User = Depends(require_roles("super_admin")),
    db: Session = Depends(get_db)
):
    """
    Delete organization (super admin only)
    Warning: This will orphan users and cases
    """
    org = db.query(Organization).filter(Organization.id == org_id).first()
    
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found"
        )
    
    # Check if org has users
    users_count = db.query(User).filter(User.organization_id == org_id).count()
    if users_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete organization with {users_count} users. Remove users first."
        )
    
    db.delete(org)
    db.commit()


@router.patch("/{org_id}/license", response_model=OrganizationResponse)
async def update_license(
    org_id: int,
    request: OrganizationLicenseUpdate,
    current_user: User = Depends(require_roles("super_admin")),
    db: Session = Depends(get_db)
):
    """
    Update organization license (super admin only)
    """
    org = db.query(Organization).filter(Organization.id == org_id).first()
    
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found"
        )
    
    org.license_key = request.license_key
    org.license_expires_at = request.license_expires_at
    
    db.commit()
    db.refresh(org)
    
    return OrganizationResponse.model_validate(org)


@router.get("/{org_id}/stats")
async def get_organization_stats(
    org_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get organization statistics
    """
    # Permission check
    if current_user.role != UserRole.SUPER_ADMIN:
        if current_user.organization_id != org_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
    
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found"
        )
    
    # Calculate stats
    users_count = db.query(User).filter(User.organization_id == org_id).count()
    cases_count = db.query(Case).filter(Case.organization_id == org_id).count()
    
    # Total amount from cases
    total_amount = db.query(func.sum(Case.total_amount)) \
                     .filter(Case.organization_id == org_id) \
                     .scalar() or 0
    
    return {
        "organization_id": org_id,
        "users_count": users_count,
        "max_users": org.max_users,
        "cases_count": cases_count,
        "total_amount_investigated": total_amount,
        "license_expires_at": org.license_expires_at,
        "is_active": org.is_active
    }
