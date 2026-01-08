"""
Organization Schemas
Pydantic models for organization management
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field


# ============== Base Schemas ==============

class OrganizationBase(BaseModel):
    """Base organization schema"""
    name: str = Field(..., min_length=2, max_length=255)
    code: str = Field(..., min_length=2, max_length=50, pattern="^[A-Z0-9_]+$")
    description: Optional[str] = None


# ============== Create Schemas ==============

class OrganizationCreate(OrganizationBase):
    """Schema for creating organization"""
    address: Optional[str] = None
    phone: Optional[str] = Field(None, max_length=50)
    email: Optional[EmailStr] = None
    max_users: int = Field(default=50, ge=1, le=1000)


# ============== Update Schemas ==============

class OrganizationUpdate(BaseModel):
    """Schema for updating organization"""
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    description: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = Field(None, max_length=50)
    email: Optional[EmailStr] = None
    is_active: Optional[bool] = None
    max_users: Optional[int] = Field(None, ge=1, le=1000)


class OrganizationLicenseUpdate(BaseModel):
    """Schema for updating license"""
    license_key: str
    license_expires_at: datetime


# ============== Response Schemas ==============

class OrganizationResponse(OrganizationBase):
    """Organization response"""
    id: int
    address: Optional[str]
    phone: Optional[str]
    email: Optional[str]
    is_active: bool
    max_users: int
    license_expires_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    
    # Computed
    users_count: Optional[int] = None
    cases_count: Optional[int] = None
    
    class Config:
        from_attributes = True


class OrganizationBrief(BaseModel):
    """Brief org info"""
    id: int
    name: str
    code: str
    is_active: bool
    
    class Config:
        from_attributes = True


# ============== List Response ==============

class OrganizationListResponse(BaseModel):
    """Paginated organization list"""
    items: list[OrganizationResponse]
    total: int
    page: int
    page_size: int
    pages: int
