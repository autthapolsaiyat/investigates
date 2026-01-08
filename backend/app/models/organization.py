"""
Organization Model
Multi-tenant support for different agencies/departments
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text
from sqlalchemy.orm import relationship
from app.database import Base


class Organization(Base):
    """Organization/Agency model for multi-tenant support"""
    
    __tablename__ = "organizations"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, unique=True)
    code = Column(String(50), nullable=False, unique=True)  # e.g., "DSI", "AMLO"
    description = Column(Text, nullable=True)
    
    # Contact Info
    address = Column(Text, nullable=True)
    phone = Column(String(50), nullable=True)
    email = Column(String(255), nullable=True)
    
    # Settings
    is_active = Column(Boolean, default=True)
    max_users = Column(Integer, default=50)
    
    # License
    license_key = Column(String(255), nullable=True)
    license_expires_at = Column(DateTime, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    users = relationship("User", back_populates="organization")
    cases = relationship("Case", back_populates="organization")
    
    def __repr__(self):
        return f"<Organization {self.code}: {self.name}>"
