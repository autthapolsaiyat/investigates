"""
License Key Model
For SaaS license key management
"""
from datetime import datetime
from typing import Optional
from enum import Enum as PyEnum
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, Text
from sqlalchemy.orm import relationship
from app.database import Base


class LicensePlanType(str, PyEnum):
    """License plan types"""
    BASIC = "basic"
    PROFESSIONAL = "professional"
    ENTERPRISE = "enterprise"


class LicenseStatus(str, PyEnum):
    """License key status"""
    UNUSED = "unused"        # Not yet activated
    ACTIVATED = "activated"  # Currently in use
    EXPIRED = "expired"      # Subscription expired
    REVOKED = "revoked"      # Manually revoked by admin


class LicenseKey(Base):
    """License key model for SaaS activation"""
    
    __tablename__ = "license_keys"
    
    id = Column(Integer, primary_key=True, index=True)
    license_key = Column(String(50), unique=True, index=True, nullable=False)
    
    # Plan details
    plan_type = Column(Enum(LicensePlanType), default=LicensePlanType.PROFESSIONAL, nullable=False)
    plan_name = Column(String(100), nullable=True)  # Display name
    days_valid = Column(Integer, default=365, nullable=False)  # Subscription duration
    max_users = Column(Integer, default=5, nullable=False)  # Max users allowed
    
    # Status
    status = Column(Enum(LicenseStatus), default=LicenseStatus.UNUSED, nullable=False)
    
    # Customer info (before activation)
    customer_name = Column(String(255), nullable=True)
    customer_contact = Column(String(255), nullable=True)  # LINE ID, Phone, etc.
    notes = Column(Text, nullable=True)
    
    # Activation info
    activated_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    activated_at = Column(DateTime, nullable=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)
    expires_at = Column(DateTime, nullable=True)
    
    # Admin tracking
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    revoked_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    revoked_at = Column(DateTime, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    activated_by_user = relationship("User", foreign_keys=[activated_by], backref="activated_licenses")
    created_by_user = relationship("User", foreign_keys=[created_by], backref="created_licenses")
    revoked_by_user = relationship("User", foreign_keys=[revoked_by], backref="revoked_licenses")
    organization = relationship("Organization", backref="license_keys")
    
    @property
    def is_valid(self) -> bool:
        """Check if license is currently valid"""
        if self.status != LicenseStatus.ACTIVATED:
            return False
        if self.expires_at and datetime.utcnow() > self.expires_at:
            return False
        return True
    
    @property
    def days_remaining(self) -> Optional[int]:
        """Get days remaining until expiry"""
        if not self.expires_at:
            return None
        delta = self.expires_at - datetime.utcnow()
        return max(0, delta.days)
    
    def __repr__(self):
        return f"<LicenseKey {self.license_key} ({self.status.value})>"
