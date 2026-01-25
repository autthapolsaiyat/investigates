"""
License Key Schemas
Pydantic models for API validation
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from enum import Enum


class LicensePlanType(str, Enum):
    BASIC = "basic"
    PROFESSIONAL = "professional"
    ENTERPRISE = "enterprise"


class LicenseStatus(str, Enum):
    UNUSED = "unused"
    ACTIVATED = "activated"
    EXPIRED = "expired"
    REVOKED = "revoked"


# ========== Request Schemas ==========

class LicenseCreate(BaseModel):
    """Create new license key"""
    plan_type: LicensePlanType = LicensePlanType.PROFESSIONAL
    days_valid: int = Field(default=365, ge=1, le=3650, description="Days valid (1-3650)")
    max_users: int = Field(default=5, ge=1, le=1000)
    customer_name: Optional[str] = None
    customer_contact: Optional[str] = None
    notes: Optional[str] = None


class LicenseActivate(BaseModel):
    """Activate license key"""
    license_key: str
    organization_id: Optional[int] = None


# ========== Response Schemas ==========

class LicenseResponse(BaseModel):
    """License key response"""
    id: int
    license_key: str
    plan_type: str
    plan_name: Optional[str]
    days_valid: int
    max_users: int
    status: str
    
    # Customer info
    customer_name: Optional[str]
    customer_contact: Optional[str]
    notes: Optional[str]
    
    # Activation info
    organization_id: Optional[int]
    organization_name: Optional[str] = None
    activated_by_email: Optional[str] = None
    activated_at: Optional[datetime]
    expires_at: Optional[datetime]
    days_remaining: Optional[int] = None
    
    # Admin info
    created_by_email: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class LicenseListResponse(BaseModel):
    """Paginated license list"""
    items: List[LicenseResponse]
    total: int
    page: int
    page_size: int
    pages: int
    
    # Stats
    total_unused: int = 0
    total_activated: int = 0
    total_expired: int = 0
    total_revoked: int = 0


class LicenseActivationResult(BaseModel):
    """Result of license activation"""
    success: bool
    message: str
    license: Optional[LicenseResponse] = None
    subscription_start: Optional[datetime] = None
    subscription_end: Optional[datetime] = None
