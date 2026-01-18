"""
Session Model
Tracks active user sessions for single-device policy
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base


class UserSession(Base):
    """Active user session for single-device enforcement"""
    
    __tablename__ = "user_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # User Reference
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # Session Info
    session_token = Column(String(255), unique=True, index=True, nullable=False)
    device_id = Column(String(255), nullable=True)  # Browser fingerprint
    
    # Device Details (JSON-like storage)
    device_info = Column(Text, nullable=True)  # {"browser": "Chrome", "os": "Windows", "ip": "..."}
    ip_address = Column(String(50), nullable=True)
    user_agent = Column(String(500), nullable=True)
    
    # Status
    is_active = Column(Boolean, default=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    last_active_at = Column(DateTime, default=datetime.utcnow)
    expired_at = Column(DateTime, nullable=True)  # When session was invalidated
    
    # Relationships
    user = relationship("User", back_populates="sessions")
    
    def __repr__(self):
        return f"<UserSession user_id={self.user_id} active={self.is_active}>"
