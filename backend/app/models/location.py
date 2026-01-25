"""
Location Models
Store GPS, Cell Tower, WiFi location data from forensic extraction
"""
from datetime import datetime
from enum import Enum as PyEnum
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Enum, Text, Float
from sqlalchemy.orm import relationship
from app.database import Base


class LocationSource(str, PyEnum):
    """Source of location data"""
    GPS = "gps"
    CELL_TOWER = "cell_tower"
    WIFI = "wifi"
    PHOTO_EXIF = "photo_exif"
    MANUAL = "manual"
    APP_DATA = "app_data"
    UNKNOWN = "unknown"


class LocationPoint(Base):
    """
    Individual location point from device extraction
    """
    
    __tablename__ = "location_points"
    
    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id", ondelete="CASCADE"), nullable=False)
    evidence_id = Column(Integer, ForeignKey("evidences.id", ondelete="SET NULL"), nullable=True)
    
    # Person/Device
    suspect_id = Column(String(100), nullable=True)  # SUSPECT_001
    suspect_name = Column(String(255), nullable=True)
    device_id = Column(String(100), nullable=True)
    
    # Location
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    altitude = Column(Float, nullable=True)
    accuracy_meters = Column(Float, nullable=True)
    
    # Source
    source = Column(Enum(LocationSource), default=LocationSource.UNKNOWN)
    
    # Cell Tower specific
    cell_id = Column(String(50), nullable=True)
    cell_lac = Column(String(50), nullable=True)  # Location Area Code
    cell_mcc = Column(String(10), nullable=True)  # Mobile Country Code
    cell_mnc = Column(String(10), nullable=True)  # Mobile Network Code
    
    # WiFi specific
    wifi_bssid = Column(String(50), nullable=True)
    wifi_ssid = Column(String(255), nullable=True)
    
    # Location Details
    location_name = Column(String(255), nullable=True)  # Place name
    location_type = Column(String(100), nullable=True)  # residence, cafe, border, etc.
    address = Column(Text, nullable=True)
    
    # Timing
    timestamp = Column(DateTime, nullable=True)
    duration_minutes = Column(Integer, nullable=True)  # How long at location
    
    # Flags
    is_significant = Column(Boolean, default=False)  # Important location
    is_frequent = Column(Boolean, default=False)  # Frequently visited
    
    # Notes
    notes = Column(Text, nullable=True)
    raw_data = Column(Text, nullable=True)  # JSON of original row
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    case = relationship("Case", back_populates="location_points")
    
    def __repr__(self):
        return f"<LocationPoint {self.suspect_name} @ {self.latitude},{self.longitude}>"


class LocationCluster(Base):
    """
    Clustered locations (frequent places)
    """
    
    __tablename__ = "location_clusters"
    
    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id", ondelete="CASCADE"), nullable=False)
    
    # Cluster Info
    name = Column(String(255), nullable=False)
    cluster_type = Column(String(100), nullable=True)  # home, work, meeting_point, etc.
    
    # Center point
    center_lat = Column(Float, nullable=False)
    center_lon = Column(Float, nullable=False)
    radius_meters = Column(Float, default=100)
    
    # Stats
    visit_count = Column(Integer, default=0)
    total_duration_minutes = Column(Integer, default=0)
    unique_visitors = Column(Integer, default=0)
    
    # Significance
    is_suspicious = Column(Boolean, default=False)
    risk_score = Column(Integer, default=0)
    notes = Column(Text, nullable=True)
    
    # Timestamps
    first_visit = Column(DateTime, nullable=True)
    last_visit = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    case = relationship("Case", back_populates="location_clusters")
    
    def __repr__(self):
        return f"<LocationCluster {self.name}>"
