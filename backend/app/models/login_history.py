"""
Login History Model
Track user login activity with device and location info
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Numeric
from sqlalchemy.orm import relationship
from app.database import Base


class LoginHistory(Base):
    """Track login history with device and location information"""
    
    __tablename__ = "login_history"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # Timestamp
    login_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Device Info
    ip_address = Column(String(45), nullable=True)  # Support IPv6
    user_agent = Column(String(500), nullable=True)
    device_type = Column(String(20), nullable=True)  # mobile/desktop/tablet
    browser = Column(String(50), nullable=True)
    os = Column(String(50), nullable=True)
    
    # Location from IP
    country = Column(String(100), nullable=True)
    country_code = Column(String(10), nullable=True)
    region = Column(String(100), nullable=True)
    city = Column(String(100), nullable=True)
    latitude = Column(Numeric(10, 6), nullable=True)
    longitude = Column(Numeric(10, 6), nullable=True)
    isp = Column(String(200), nullable=True)
    
    # Login Status
    login_success = Column(Boolean, default=True)
    failure_reason = Column(String(100), nullable=True)
    
    # Relationships
    user = relationship("User", backref="login_history")
    
    def __repr__(self):
        return f"<LoginHistory user_id={self.user_id} at {self.login_at}>"
