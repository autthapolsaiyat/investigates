"""
Case Model
Investigation case management
"""
from datetime import datetime
from enum import Enum as PyEnum
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Enum, Text, Float
from sqlalchemy.orm import relationship
from app.database import Base


class CaseStatus(str, PyEnum):
    """Case status workflow"""
    DRAFT = "draft"
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    PENDING_REVIEW = "pending_review"
    CLOSED = "closed"
    ARCHIVED = "archived"


class CasePriority(str, PyEnum):
    """Case priority levels"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class CaseType(str, PyEnum):
    """Types of cases"""
    ONLINE_GAMBLING = "online_gambling"
    MONEY_LAUNDERING = "money_laundering"
    FRAUD = "fraud"
    CALL_CENTER_SCAM = "call_center_scam"
    ROMANCE_SCAM = "romance_scam"
    INVESTMENT_SCAM = "investment_scam"
    OTHER = "other"


class Case(Base):
    """Investigation case model"""
    
    __tablename__ = "cases"
    
    id = Column(Integer, primary_key=True, index=True)
    case_number = Column(String(50), unique=True, index=True, nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    # Classification
    case_type = Column(Enum(CaseType), default=CaseType.OTHER, nullable=False)
    status = Column(Enum(CaseStatus), default=CaseStatus.DRAFT, nullable=False)
    priority = Column(Enum(CasePriority), default=CasePriority.MEDIUM, nullable=False)
    
    # Financial Summary
    total_amount = Column(Float, default=0.0)  # Total money involved
    currency = Column(String(10), default="THB")
    victims_count = Column(Integer, default=0)
    suspects_count = Column(Integer, default=0)
    
    # Organization & Assignment
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    assigned_to = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Dates
    incident_date = Column(DateTime, nullable=True)
    reported_date = Column(DateTime, nullable=True)
    closed_date = Column(DateTime, nullable=True)
    
    # Tags & Notes
    tags = Column(String(500), nullable=True)  # Comma-separated tags
    internal_notes = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships (Evidence relationship removed to avoid circular import)
    organization = relationship("Organization", back_populates="cases")
    created_by_user = relationship("User", back_populates="cases_created", foreign_keys=[created_by])
    assigned_to_user = relationship("User", back_populates="cases_assigned", foreign_keys=[assigned_to])
    money_flow_nodes = relationship("MoneyFlowNode", back_populates="case", cascade="all, delete-orphan")
    money_flow_edges = relationship("MoneyFlowEdge", back_populates="case", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Case {self.case_number}: {self.title}>"
