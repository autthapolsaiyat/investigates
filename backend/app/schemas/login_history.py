"""
Login History Schemas
Pydantic models for login tracking
"""
from datetime import datetime
from typing import Optional, List
from decimal import Decimal
from pydantic import BaseModel


class LoginHistoryBase(BaseModel):
    """Base login history schema"""
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    device_type: Optional[str] = None
    browser: Optional[str] = None
    os: Optional[str] = None
    country: Optional[str] = None
    country_code: Optional[str] = None
    region: Optional[str] = None
    city: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    isp: Optional[str] = None
    login_success: bool = True
    failure_reason: Optional[str] = None


class LoginHistoryCreate(LoginHistoryBase):
    """Schema for creating login history"""
    user_id: int


class LoginHistoryResponse(LoginHistoryBase):
    """Schema for login history response"""
    id: int
    user_id: int
    login_at: datetime
    
    # User info (optional, for admin view)
    user_email: Optional[str] = None
    user_name: Optional[str] = None
    
    class Config:
        from_attributes = True


class LoginHistoryListResponse(BaseModel):
    """Paginated login history list"""
    items: List[LoginHistoryResponse]
    total: int
    page: int
    page_size: int
    pages: int


# ============== Map Data Schemas ==============

class LoginMapPoint(BaseModel):
    """Single point for map display"""
    id: int
    user_id: int
    user_email: str
    user_name: str
    login_at: datetime
    ip_address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    city: Optional[str] = None
    country: Optional[str] = None
    device_type: Optional[str] = None
    browser: Optional[str] = None
    os: Optional[str] = None
    is_online: bool = False


class LoginMapResponse(BaseModel):
    """Response for map data"""
    points: List[LoginMapPoint]
    total_logins: int
    unique_users: int
    unique_locations: int


# ============== Stats Schemas ==============

class LoginStats(BaseModel):
    """Login statistics"""
    total_logins_today: int
    total_logins_week: int
    total_logins_month: int
    unique_users_today: int
    failed_logins_today: int
    top_locations: List[dict]
    top_devices: List[dict]
