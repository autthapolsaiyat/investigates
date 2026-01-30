"""
Notification Schemas
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from enum import Enum


class NotificationType(str, Enum):
    SYSTEM = "system"
    TICKET = "ticket"
    REGISTRATION = "registration"
    LICENSE = "license"
    ALERT = "alert"


class NotificationPriority(str, Enum):
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    URGENT = "urgent"


class TargetAudience(str, Enum):
    ALL = "all"
    ADMIN = "admin"
    USERS = "users"


# ============== Request Schemas ==============

class NotificationCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    message: str = Field(..., min_length=1)
    notification_type: NotificationType = NotificationType.SYSTEM
    target_audience: TargetAudience = TargetAudience.ALL
    priority: NotificationPriority = NotificationPriority.NORMAL


class NotificationUpdate(BaseModel):
    title: Optional[str] = None
    message: Optional[str] = None
    notification_type: Optional[NotificationType] = None
    target_audience: Optional[TargetAudience] = None
    priority: Optional[NotificationPriority] = None
    is_active: Optional[bool] = None


# ============== Response Schemas ==============

class NotificationResponse(BaseModel):
    id: int
    title: str
    message: str
    notification_type: str
    target_audience: str
    priority: str
    is_active: bool
    created_by: Optional[int]
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True


class NotificationListResponse(BaseModel):
    items: List[NotificationResponse]
    total: int
    page: int
    page_size: int
    pages: int


class UserNotificationResponse(BaseModel):
    id: int
    title: str
    message: str
    notification_type: str
    priority: str
    related_type: Optional[str]
    related_id: Optional[int]
    is_read: bool
    read_at: Optional[datetime]
    is_dismissed: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class UserNotificationListResponse(BaseModel):
    items: List[UserNotificationResponse]
    unread_count: int


class UnreadCountResponse(BaseModel):
    count: int


class NotificationStats(BaseModel):
    total: int
    active: int
    inactive: int
    by_type: dict
    sent_count: int
    read_rate: float


class NotificationTemplate(BaseModel):
    id: str
    name: str
    title: str
    message: str
    notification_type: str
