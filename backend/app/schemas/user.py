"""
User Schemas
Pydantic models for request/response validation
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field
from app.models.user import UserRole


# ============== Base Schemas ==============

class UserBase(BaseModel):
    """Base user schema"""
    email: EmailStr
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    phone: Optional[str] = Field(None, max_length=50)


# ============== Create Schemas ==============

class UserCreate(UserBase):
    """Schema for creating a new user"""
    password: str = Field(..., min_length=8, max_length=100)
    role: UserRole = UserRole.VIEWER
    organization_id: Optional[int] = None


class UserRegister(BaseModel):
    """Schema for user registration (public)"""
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=100)
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    phone: Optional[str] = None
    organization_code: Optional[str] = None  # Join existing org by code


# ============== Update Schemas ==============

class UserUpdate(BaseModel):
    """Schema for updating user"""
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    phone: Optional[str] = Field(None, max_length=50)
    avatar_url: Optional[str] = None
    is_active: Optional[bool] = None
    role: Optional[UserRole] = None
    organization_id: Optional[int] = None


class UserUpdatePassword(BaseModel):
    """Schema for password update"""
    current_password: str
    new_password: str = Field(..., min_length=8, max_length=100)


# ============== Response Schemas ==============

class UserResponse(UserBase):
    """Schema for user response"""
    id: int
    role: UserRole
    organization_id: Optional[int]
    is_active: bool
    is_verified: bool
    avatar_url: Optional[str]
    last_login_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class UserBrief(BaseModel):
    """Brief user info for lists"""
    id: int
    email: str
    first_name: str
    last_name: str
    role: UserRole
    
    class Config:
        from_attributes = True


# ============== List Response ==============

class UserListResponse(BaseModel):
    """Paginated user list response"""
    items: list[UserResponse]
    total: int
    page: int
    page_size: int
    pages: int
