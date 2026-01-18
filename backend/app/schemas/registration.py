"""
Registration Schemas
Pydantic models for registration request/response validation
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field
from app.models.registration import RegistrationStatus


# ============== Create Schemas ==============

class RegistrationCreate(BaseModel):
    """Schema for submitting a registration request"""
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=100)
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    phone: Optional[str] = Field(None, max_length=50)
    organization_name: Optional[str] = Field(None, max_length=255)
    position: Optional[str] = Field(None, max_length=100)


# ============== Response Schemas ==============

class RegistrationResponse(BaseModel):
    """Schema for registration request response"""
    id: int
    email: str
    first_name: str
    last_name: str
    phone: Optional[str]
    organization_name: Optional[str]
    position: Optional[str]
    status: RegistrationStatus
    created_at: datetime
    updated_at: datetime
    
    # Processing info (only for admin)
    processed_by: Optional[int] = None
    processed_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    subscription_days: Optional[int] = None
    
    class Config:
        from_attributes = True


class RegistrationBrief(BaseModel):
    """Brief registration info for lists"""
    id: int
    email: str
    full_name: str
    organization_name: Optional[str]
    position: Optional[str]
    status: RegistrationStatus
    created_at: datetime
    
    class Config:
        from_attributes = True


# ============== Admin Action Schemas ==============

class RegistrationApprove(BaseModel):
    """Schema for approving a registration"""
    subscription_days: int = Field(..., ge=1, le=3650)  # 1 day to 10 years
    role: Optional[str] = "viewer"  # Default role for new user
    notes: Optional[str] = None


class RegistrationReject(BaseModel):
    """Schema for rejecting a registration"""
    reason: str = Field(..., min_length=1, max_length=500)


# ============== List Response ==============

class RegistrationListResponse(BaseModel):
    """Paginated registration list response"""
    items: list[RegistrationResponse]
    total: int
    page: int
    page_size: int
    pages: int


# ============== Statistics ==============

class RegistrationStats(BaseModel):
    """Registration statistics for admin dashboard"""
    total: int
    pending: int
    approved: int
    rejected: int
    today: int
    this_week: int
    this_month: int
