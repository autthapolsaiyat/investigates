"""
Case Schemas
Pydantic models for case management
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from app.models.case import CaseStatus, CasePriority, CaseType
from app.schemas.user import UserBrief


# ============== Base Schemas ==============

class CaseBase(BaseModel):
    """Base case schema"""
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    case_type: CaseType = CaseType.OTHER
    priority: CasePriority = CasePriority.MEDIUM


# ============== Create Schemas ==============

class CaseCreate(CaseBase):
    """Schema for creating a case"""
    incident_date: Optional[datetime] = None
    reported_date: Optional[datetime] = None
    total_amount: float = 0.0
    currency: str = "THB"
    victims_count: int = 0
    suspects_count: int = 0
    tags: Optional[str] = None
    assigned_to: Optional[int] = None


# ============== Update Schemas ==============

class CaseUpdate(BaseModel):
    """Schema for updating a case"""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    case_type: Optional[CaseType] = None
    status: Optional[CaseStatus] = None
    priority: Optional[CasePriority] = None
    incident_date: Optional[datetime] = None
    reported_date: Optional[datetime] = None
    total_amount: Optional[float] = None
    currency: Optional[str] = None
    victims_count: Optional[int] = None
    suspects_count: Optional[int] = None
    tags: Optional[str] = None
    internal_notes: Optional[str] = None
    assigned_to: Optional[int] = None


class CaseStatusUpdate(BaseModel):
    """Quick status update"""
    status: CaseStatus
    notes: Optional[str] = None


# ============== Response Schemas ==============

class CaseResponse(CaseBase):
    """Full case response"""
    id: int
    case_number: str
    status: CaseStatus
    
    # Financial
    total_amount: float
    currency: str
    victims_count: int
    suspects_count: int
    
    # Assignment
    organization_id: int
    created_by: int
    assigned_to: Optional[int]
    
    # Users (optional expansion)
    created_by_user: Optional[UserBrief] = None
    assigned_to_user: Optional[UserBrief] = None
    
    # Dates
    incident_date: Optional[datetime]
    reported_date: Optional[datetime]
    closed_date: Optional[datetime]
    
    # Meta
    tags: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    # Soft Delete
    is_active: bool = True
    deleted_at: Optional[datetime] = None
    deleted_by: Optional[int] = None
    
    # Computed
    nodes_count: Optional[int] = None
    edges_count: Optional[int] = None
    
    class Config:
        from_attributes = True


class DeletedCaseResponse(BaseModel):
    """Deleted case info for admin restore"""
    id: int
    case_number: str
    title: str
    case_type: CaseType
    status: CaseStatus
    priority: CasePriority
    total_amount: float
    organization_id: int
    created_at: datetime
    deleted_at: Optional[datetime]
    deleted_by: Optional[int]
    deleted_by_email: Optional[str] = None
    
    class Config:
        from_attributes = True


class CaseBrief(BaseModel):
    """Brief case info for lists"""
    id: int
    case_number: str
    title: str
    case_type: CaseType
    status: CaseStatus
    priority: CasePriority
    total_amount: float
    created_at: datetime
    
    class Config:
        from_attributes = True


# ============== List Response ==============

class CaseListResponse(BaseModel):
    """Paginated case list"""
    items: list[CaseResponse]
    total: int
    page: int
    page_size: int
    pages: int


# ============== Statistics ==============

class CaseStatistics(BaseModel):
    """Case statistics for dashboard"""
    total_cases: int
    open_cases: int
    closed_cases: int
    total_amount: float
    total_victims: int
    by_type: dict[str, int]
    by_status: dict[str, int]
    by_priority: dict[str, int]
