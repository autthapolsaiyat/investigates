"""
User Model
Authentication and authorization
"""
from datetime import datetime
from enum import Enum as PyEnum
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.database import Base


class UserRole(str, PyEnum):
    """User roles for authorization"""
    SUPER_ADMIN = "super_admin"  # System administrator
    ORG_ADMIN = "org_admin"      # Organization administrator
    INVESTIGATOR = "investigator" # Can create/edit cases
    ANALYST = "analyst"          # Can analyze data
    VIEWER = "viewer"            # Read-only access


class User(Base):
    """User model for authentication"""
    
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    
    # Profile
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    phone = Column(String(50), nullable=True)
    avatar_url = Column(String(500), nullable=True)
    
    # Role & Organization
    role = Column(Enum(UserRole), default=UserRole.VIEWER, nullable=False)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)
    
    # Status
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    
    # Security
    last_login_at = Column(DateTime, nullable=True)
    failed_login_attempts = Column(Integer, default=0)
    locked_until = Column(DateTime, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships (evidences_collected removed to avoid circular import)
    organization = relationship("Organization", back_populates="users")
    cases_created = relationship("Case", back_populates="created_by_user", foreign_keys="Case.created_by")
    cases_assigned = relationship("Case", back_populates="assigned_to_user", foreign_keys="Case.assigned_to")
    
    @property
    def full_name(self) -> str:
        """Get user's full name"""
        return f"{self.first_name} {self.last_name}"
    
    def __repr__(self):
        return f"<User {self.email}>"
