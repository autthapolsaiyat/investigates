"""
Notification Models
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
import enum

from app.database import Base


class NotificationType(str, enum.Enum):
    SYSTEM = "system"
    TICKET = "ticket"
    REGISTRATION = "registration"
    LICENSE = "license"
    ALERT = "alert"


class Notification(Base):
    """System notification template (created by admin)"""
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(String(50), default="system")
    target_audience = Column(String(50), default="all")  # all, admin, users
    priority = Column(String(20), default="normal")  # low, normal, high, urgent
    is_active = Column(Boolean, default=True)
    
    # Metadata
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    creator = relationship("User", foreign_keys=[created_by])
    user_notifications = relationship("UserNotification", back_populates="notification")


class UserNotification(Base):
    """Individual notification sent to a user"""
    __tablename__ = "user_notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    notification_id = Column(Integer, ForeignKey("notifications.id"), nullable=True)
    
    # Direct notification fields (when not linked to template)
    title = Column(String(255), nullable=True)
    message = Column(Text, nullable=True)
    notification_type = Column(String(50), default="system")
    priority = Column(String(20), default="normal")
    
    # Link to related entity
    related_type = Column(String(50), nullable=True)  # ticket, registration, case
    related_id = Column(Integer, nullable=True)
    
    # Status
    is_read = Column(Boolean, default=False)
    read_at = Column(DateTime, nullable=True)
    is_dismissed = Column(Boolean, default=False)
    dismissed_at = Column(DateTime, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id])
    notification = relationship("Notification", back_populates="user_notifications")
