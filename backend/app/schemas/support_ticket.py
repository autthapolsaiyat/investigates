"""
Support Ticket Schemas
Pydantic models for request/response validation
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from enum import Enum


class TicketStatus(str, Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CLOSED = "closed"


class TicketPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class TicketCategory(str, Enum):
    BUG = "bug"
    FEATURE = "feature"
    QUESTION = "question"
    OTHER = "other"


# ============== Create Ticket ==============

class TicketCreate(BaseModel):
    """Schema for creating a new support ticket"""
    subject: str = Field(..., min_length=5, max_length=255, description="Ticket subject")
    description: str = Field(..., min_length=10, description="Detailed description of the issue")
    category: TicketCategory = Field(default=TicketCategory.BUG, description="Ticket category")
    screenshot_base64: Optional[str] = Field(None, description="Screenshot as Base64 data URL")
    screenshot_filename: Optional[str] = Field(None, max_length=255, description="Screenshot filename")


# ============== Update Ticket (Admin) ==============

class TicketAdminUpdate(BaseModel):
    """Schema for admin to update a ticket"""
    status: Optional[TicketStatus] = None
    priority: Optional[TicketPriority] = None
    admin_response: Optional[str] = None


# ============== Response Schemas ==============

class TicketUserInfo(BaseModel):
    """Basic user info for ticket display"""
    id: int
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    
    class Config:
        from_attributes = True


class TicketResponse(BaseModel):
    """Full ticket response"""
    id: int
    ticket_number: str
    user_id: int
    subject: str
    description: str
    category: str
    status: str
    priority: str
    has_screenshot: bool = False
    admin_response: Optional[str] = None
    resolved_by: Optional[int] = None
    resolved_at: Optional[datetime] = None
    user_read_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    # Computed fields
    is_unread: bool = False
    
    class Config:
        from_attributes = True


class TicketListItem(BaseModel):
    """Ticket list item (lighter than full response)"""
    id: int
    ticket_number: str
    subject: str
    category: str
    status: str
    priority: str
    has_screenshot: bool = False
    has_admin_response: bool = False
    is_unread: bool = False
    created_at: datetime
    resolved_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class TicketDetailResponse(BaseModel):
    """Full ticket detail with user info (for admin)"""
    id: int
    ticket_number: str
    user_id: int
    user: Optional[TicketUserInfo] = None
    subject: str
    description: str
    category: str
    status: str
    priority: str
    screenshot_data: Optional[str] = None
    screenshot_filename: Optional[str] = None
    admin_response: Optional[str] = None
    resolved_by: Optional[int] = None
    resolver: Optional[TicketUserInfo] = None
    resolved_at: Optional[datetime] = None
    user_read_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# ============== List Response ==============

class TicketListResponse(BaseModel):
    """Paginated ticket list"""
    items: List[TicketListItem]
    total: int
    page: int
    page_size: int
    pages: int
    unread_count: int = 0


class AdminTicketListResponse(BaseModel):
    """Paginated ticket list for admin"""
    items: List[TicketDetailResponse]
    total: int
    page: int
    page_size: int
    pages: int


# ============== Stats ==============

class TicketStats(BaseModel):
    """Ticket statistics for admin dashboard"""
    total: int = 0
    open: int = 0
    in_progress: int = 0
    resolved: int = 0
    closed: int = 0
    today: int = 0
    this_week: int = 0
    
    # By category
    bugs: int = 0
    features: int = 0
    questions: int = 0
    others: int = 0


# ============== Unread Count ==============

class UnreadCountResponse(BaseModel):
    """Unread ticket count for user"""
    unread_count: int = 0
