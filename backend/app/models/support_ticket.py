"""
Support Ticket Model
User issue reporting and tracking system
"""
from datetime import datetime
from enum import Enum as PyEnum
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class TicketStatus(str, PyEnum):
    """Ticket status workflow"""
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CLOSED = "closed"


class TicketPriority(str, PyEnum):
    """Ticket priority levels"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class TicketCategory(str, PyEnum):
    """Ticket categories"""
    BUG = "bug"
    FEATURE = "feature"
    QUESTION = "question"
    OTHER = "other"


class SupportTicket(Base):
    """Support ticket model for user issue reporting"""
    
    __tablename__ = "support_tickets"
    
    id = Column(Integer, primary_key=True, index=True)
    ticket_number = Column(String(20), unique=True, index=True, nullable=False)
    
    # Reporter
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Ticket Details
    subject = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(50), default=TicketCategory.BUG.value, nullable=False)
    
    # Screenshot (Base64)
    screenshot_data = Column(Text, nullable=True)
    screenshot_filename = Column(String(255), nullable=True)
    
    # Status & Priority
    status = Column(String(20), default=TicketStatus.OPEN.value, nullable=False, index=True)
    priority = Column(String(20), default=TicketPriority.MEDIUM.value, nullable=False)
    
    # Admin Response
    admin_response = Column(Text, nullable=True)
    resolved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    
    # Notification tracking
    user_read_at = Column(DateTime, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id], backref="support_tickets")
    resolver = relationship("User", foreign_keys=[resolved_by])
    
    def __repr__(self):
        return f"<SupportTicket {self.ticket_number}: {self.subject}>"
