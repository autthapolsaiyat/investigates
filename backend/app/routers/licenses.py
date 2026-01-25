"""
License Keys Router
Admin interface for creating and managing license keys
"""
import secrets
import string
from math import ceil
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.license import LicenseKey, LicenseStatus, LicensePlanType
from app.models.user import User, UserRole
from app.models.organization import Organization
from app.schemas.license import (
    LicenseCreate,
    LicenseActivate,
    LicenseResponse,
    LicenseListResponse,
    LicenseActivationResult
)
from app.utils.security import get_current_user, require_roles

router = APIRouter(prefix="/licenses", tags=["Licenses"])


def generate_license_key() -> str:
    """Generate a unique license key in format XXXX-XXXX-XXXX-XXXX"""
    chars = string.ascii_uppercase + string.digits
    # Exclude confusing characters
    chars = chars.replace('O', '').replace('0', '').replace('I', '').replace('1', '').replace('L', '')
    
    segments = []
    for _ in range(4):
        segment = ''.join(secrets.choice(chars) for _ in range(4))
        segments.append(segment)
    
    return '-'.join(segments)


def get_plan_name(plan_type: LicensePlanType) -> str:
    """Get display name for plan type"""
    names = {
        LicensePlanType.BASIC: "Basic",
        LicensePlanType.PROFESSIONAL: "Professional",
        LicensePlanType.ENTERPRISE: "Enterprise"
    }
    return names.get(plan_type, "Unknown")


def license_to_response(license: LicenseKey, db: Session) -> LicenseResponse:
    """Convert LicenseKey model to response schema"""
    # Get related data
    activated_by_email = None
    if license.activated_by:
        user = db.query(User).filter(User.id == license.activated_by).first()
        if user:
            activated_by_email = user.email
    
    created_by_email = None
    if license.created_by:
        user = db.query(User).filter(User.id == license.created_by).first()
        if user:
            created_by_email = user.email
    
    organization_name = None
    if license.organization_id:
        org = db.query(Organization).filter(Organization.id == license.organization_id).first()
        if org:
            organization_name = org.name
    
    # Calculate days remaining
    days_remaining = None
    if license.expires_at:
        delta = license.expires_at - datetime.utcnow()
        days_remaining = max(0, delta.days)
    
    return LicenseResponse(
        id=license.id,
        license_key=license.license_key,
        plan_type=license.plan_type.value,
        plan_name=get_plan_name(license.plan_type),
        days_valid=license.days_valid,
        max_users=license.max_users,
        status=license.status.value,
        customer_name=license.customer_name,
        customer_contact=license.customer_contact,
        notes=license.notes,
        organization_id=license.organization_id,
        organization_name=organization_name,
        activated_by_email=activated_by_email,
        activated_at=license.activated_at,
        expires_at=license.expires_at,
        days_remaining=days_remaining,
        created_by_email=created_by_email,
        created_at=license.created_at
    )


@router.get("", response_model=LicenseListResponse)
async def list_licenses(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str = Query(None),
    status_filter: str = Query(None, alias="status"),
    plan_type: str = Query(None),
    current_user: User = Depends(require_roles("super_admin", "org_admin")),
    db: Session = Depends(get_db)
):
    """
    List all license keys (admin only)
    """
    query = db.query(LicenseKey)
    
    # Search filter
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (LicenseKey.license_key.ilike(search_term)) |
            (LicenseKey.customer_name.ilike(search_term)) |
            (LicenseKey.customer_contact.ilike(search_term))
        )
    
    # Status filter
    if status_filter:
        try:
            status_enum = LicenseStatus(status_filter)
            query = query.filter(LicenseKey.status == status_enum)
        except ValueError:
            pass
    
    # Plan type filter
    if plan_type:
        try:
            plan_enum = LicensePlanType(plan_type)
            query = query.filter(LicenseKey.plan_type == plan_enum)
        except ValueError:
            pass
    
    # Count total
    total = query.count()
    
    # Calculate stats
    total_unused = db.query(LicenseKey).filter(LicenseKey.status == LicenseStatus.UNUSED).count()
    total_activated = db.query(LicenseKey).filter(LicenseKey.status == LicenseStatus.ACTIVATED).count()
    total_expired = db.query(LicenseKey).filter(LicenseKey.status == LicenseStatus.EXPIRED).count()
    total_revoked = db.query(LicenseKey).filter(LicenseKey.status == LicenseStatus.REVOKED).count()
    
    # Paginate
    licenses = query.order_by(LicenseKey.created_at.desc()) \
                    .offset((page - 1) * page_size) \
                    .limit(page_size) \
                    .all()
    
    # Convert to response
    items = [license_to_response(lic, db) for lic in licenses]
    
    return LicenseListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        pages=ceil(total / page_size) if total > 0 else 1,
        total_unused=total_unused,
        total_activated=total_activated,
        total_expired=total_expired,
        total_revoked=total_revoked
    )


@router.post("/generate", response_model=LicenseResponse, status_code=status.HTTP_201_CREATED)
async def generate_license(
    request: LicenseCreate,
    current_user: User = Depends(require_roles("super_admin")),
    db: Session = Depends(get_db)
):
    """
    Generate a new license key (super admin only)
    """
    # Generate unique license key
    license_key = generate_license_key()
    
    # Ensure uniqueness
    while db.query(LicenseKey).filter(LicenseKey.license_key == license_key).first():
        license_key = generate_license_key()
    
    # Create license
    license = LicenseKey(
        license_key=license_key,
        plan_type=LicensePlanType(request.plan_type),
        plan_name=get_plan_name(LicensePlanType(request.plan_type)),
        days_valid=request.days_valid,
        max_users=request.max_users,
        customer_name=request.customer_name,
        customer_contact=request.customer_contact,
        notes=request.notes,
        status=LicenseStatus.UNUSED,
        created_by=current_user.id
    )
    
    db.add(license)
    db.commit()
    db.refresh(license)
    
    return license_to_response(license, db)


@router.get("/{license_id}", response_model=LicenseResponse)
async def get_license(
    license_id: int,
    current_user: User = Depends(require_roles("super_admin", "org_admin")),
    db: Session = Depends(get_db)
):
    """
    Get license details by ID
    """
    license = db.query(LicenseKey).filter(LicenseKey.id == license_id).first()
    
    if not license:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="License not found"
        )
    
    return license_to_response(license, db)


@router.post("/{license_id}/revoke", response_model=LicenseResponse)
async def revoke_license(
    license_id: int,
    current_user: User = Depends(require_roles("super_admin")),
    db: Session = Depends(get_db)
):
    """
    Revoke a license key (super admin only)
    """
    license = db.query(LicenseKey).filter(LicenseKey.id == license_id).first()
    
    if not license:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="License not found"
        )
    
    if license.status == LicenseStatus.REVOKED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="License is already revoked"
        )
    
    license.status = LicenseStatus.REVOKED
    license.revoked_by = current_user.id
    license.revoked_at = datetime.utcnow()
    
    db.commit()
    db.refresh(license)
    
    return license_to_response(license, db)


@router.post("/activate", response_model=LicenseActivationResult)
async def activate_license(
    request: LicenseActivate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Activate a license key for the current user
    """
    # Find license
    license = db.query(LicenseKey).filter(
        LicenseKey.license_key == request.license_key.upper().strip()
    ).first()
    
    if not license:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid license key"
        )
    
    if license.status != LicenseStatus.UNUSED:
        status_messages = {
            LicenseStatus.ACTIVATED: "License key has already been activated",
            LicenseStatus.EXPIRED: "License key has expired",
            LicenseStatus.REVOKED: "License key has been revoked"
        }
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=status_messages.get(license.status, "License key is not available")
        )
    
    # Activate license
    now = datetime.utcnow()
    expires_at = now + timedelta(days=license.days_valid)
    
    license.status = LicenseStatus.ACTIVATED
    license.activated_by = current_user.id
    license.activated_at = now
    license.expires_at = expires_at
    
    if request.organization_id:
        license.organization_id = request.organization_id
    elif current_user.organization_id:
        license.organization_id = current_user.organization_id
    
    # Update user subscription
    current_user.subscription_start = now
    current_user.subscription_end = expires_at
    current_user.is_active = True
    
    db.commit()
    db.refresh(license)
    
    return LicenseActivationResult(
        success=True,
        message=f"License activated successfully. Valid for {license.days_valid} days.",
        license=license_to_response(license, db),
        subscription_start=now,
        subscription_end=expires_at
    )


@router.get("/validate/{license_key}")
async def validate_license(
    license_key: str,
    db: Session = Depends(get_db)
):
    """
    Validate a license key (public endpoint)
    Returns basic info about the license status
    """
    license = db.query(LicenseKey).filter(
        LicenseKey.license_key == license_key.upper().strip()
    ).first()
    
    if not license:
        return {
            "valid": False,
            "message": "Invalid license key"
        }
    
    if license.status == LicenseStatus.UNUSED:
        return {
            "valid": True,
            "status": "unused",
            "plan_type": license.plan_type.value,
            "days_valid": license.days_valid,
            "message": "License key is available for activation"
        }
    
    if license.status == LicenseStatus.ACTIVATED:
        return {
            "valid": True,
            "status": "activated",
            "expires_at": license.expires_at.isoformat() if license.expires_at else None,
            "days_remaining": license.days_remaining,
            "message": "License key is currently active"
        }
    
    return {
        "valid": False,
        "status": license.status.value,
        "message": f"License key is {license.status.value}"
    }


@router.delete("/{license_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_license(
    license_id: int,
    current_user: User = Depends(require_roles("super_admin")),
    db: Session = Depends(get_db)
):
    """
    Delete a license key permanently (super admin only)
    Only unused licenses can be deleted
    """
    license = db.query(LicenseKey).filter(LicenseKey.id == license_id).first()
    
    if not license:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="License not found"
        )
    
    if license.status != LicenseStatus.UNUSED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only unused licenses can be deleted"
        )
    
    db.delete(license)
    db.commit()
