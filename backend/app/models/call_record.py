"""
Call Record Models
Store call logs imported from forensic tools (Cellebrite, UFED, XRY)
"""
from datetime import datetime
from enum import Enum as PyEnum
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Enum, Text, Float
from sqlalchemy.orm import relationship
from app.database import Base


class CallType(str, PyEnum):
    """Type of call"""
    INCOMING = "incoming"
    OUTGOING = "outgoing"
    MISSED = "missed"
    BLOCKED = "blocked"
    UNKNOWN = "unknown"


class CallRecord(Base):
    """
    Individual call record from phone extraction
    """
    
    __tablename__ = "call_records"
    
    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id", ondelete="CASCADE"), nullable=False)
    evidence_id = Column(Integer, ForeignKey("evidences.id", ondelete="SET NULL"), nullable=True)
    
    # Device Info
    device_id = Column(String(100), nullable=True)  # PHONE_001, etc.
    device_imei = Column(String(50), nullable=True)
    device_owner = Column(String(255), nullable=True)
    device_number = Column(String(50), nullable=True)
    
    # Call Details
    partner_number = Column(String(50), nullable=False)  # The other party
    partner_name = Column(String(255), nullable=True)
    call_type = Column(Enum(CallType), default=CallType.UNKNOWN)
    
    # Timing
    start_time = Column(DateTime, nullable=True)
    end_time = Column(DateTime, nullable=True)
    duration_seconds = Column(Integer, default=0)
    
    # Location (if available)
    cell_id = Column(String(50), nullable=True)
    cell_tower_location = Column(String(255), nullable=True)
    gps_lat = Column(Float, nullable=True)
    gps_lon = Column(Float, nullable=True)
    
    # Flags
    is_suspect_call = Column(Boolean, default=False)  # Flagged as suspicious
    is_deleted = Column(Boolean, default=False)  # Was deleted on device
    
    # Analysis
    risk_score = Column(Integer, default=0)  # 0-100
    notes = Column(Text, nullable=True)
    
    # Raw data reference
    raw_data = Column(Text, nullable=True)  # JSON of original row
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    case = relationship("Case", back_populates="call_records")
    
    def __repr__(self):
        return f"<CallRecord {self.device_number} -> {self.partner_number}>"


class CallEntity(Base):
    """
    Aggregated entity from call analysis (person/phone)
    Used for network visualization
    """
    
    __tablename__ = "call_entities"
    
    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id", ondelete="CASCADE"), nullable=False)
    
    # Entity Info
    entity_type = Column(String(50), nullable=False)  # person, phone
    label = Column(String(255), nullable=False)  # Display name
    phone_number = Column(String(50), nullable=True)
    person_name = Column(String(255), nullable=True)
    
    # Aggregated Stats
    total_calls = Column(Integer, default=0)
    total_duration = Column(Integer, default=0)  # seconds
    incoming_calls = Column(Integer, default=0)
    outgoing_calls = Column(Integer, default=0)
    unique_contacts = Column(Integer, default=0)
    
    # Risk & Classification
    risk_level = Column(String(20), default="unknown")  # critical, high, medium, low, unknown
    risk_score = Column(Integer, default=0)
    cluster_id = Column(Integer, nullable=True)  # For grouping
    role = Column(String(100), nullable=True)  # boss, coordinator, dealer, etc.
    
    # Visual
    color = Column(String(20), nullable=True)
    
    # Timestamps
    first_seen = Column(DateTime, nullable=True)
    last_seen = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    case = relationship("Case", back_populates="call_entities")
    
    def __repr__(self):
        return f"<CallEntity {self.entity_type}: {self.label}>"


class CallLink(Base):
    """
    Link between call entities (for network graph)
    """
    
    __tablename__ = "call_links"
    
    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id", ondelete="CASCADE"), nullable=False)
    
    # Connection
    source_entity_id = Column(Integer, ForeignKey("call_entities.id", ondelete="CASCADE"), nullable=False)
    target_entity_id = Column(Integer, ForeignKey("call_entities.id", ondelete="CASCADE"), nullable=False)
    
    # Link Details
    link_type = Column(String(50), default="call")  # call, sms
    call_count = Column(Integer, default=0)
    total_duration = Column(Integer, default=0)
    
    # Timestamps
    first_contact = Column(DateTime, nullable=True)
    last_contact = Column(DateTime, nullable=True)
    
    # Visual
    weight = Column(Integer, default=1)
    color = Column(String(20), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    case = relationship("Case", back_populates="call_links")
    source_entity = relationship("CallEntity", foreign_keys=[source_entity_id])
    target_entity = relationship("CallEntity", foreign_keys=[target_entity_id])
    
    def __repr__(self):
        return f"<CallLink {self.source_entity_id} -> {self.target_entity_id}>"
