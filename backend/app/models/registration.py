"""
Registration Request Model
Stores pending registration requests awaiting admin approval
"""
from datetime import datetime
from enum import Enum as PyEnum
from sqlalchemy import Column, Integer, String, DateTime, Text, Enum, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class RegistrationStatus(str, PyEnum):
    """Registration request status"""
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class RegistrationRequest(Base):
    """Registration request awaiting admin approval"""
    
    __tablename__ = "registration_requests"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Applicant Info
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    phone = Column(String(50), nullable=True)
    organization_name = Column(String(255), nullable=True)  # Free text if no org
    position = Column(String(100), nullable=True)  # Job title
    
    # Status
    status = Column(Enum(RegistrationStatus), default=RegistrationStatus.PENDING, nullable=False)
    
    # Processing Info
    processed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    processed_at = Column(DateTime, nullable=True)
    rejection_reason = Column(Text, nullable=True)
    subscription_days = Column(Integer, nullable=True)  # Days granted on approval
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    processor = relationship("User", foreign_keys=[processed_by])
    
    @property
    def full_name(self) -> str:
        """Get applicant's full name"""
        return f"{self.first_name} {self.last_name}"
    
    def __repr__(self):
        return f"<RegistrationRequest {self.email} - {self.status}>"
