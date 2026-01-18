"""
Evidence Model
Digital Evidence Chain of Custody for Court-Ready Documentation
"""
from datetime import datetime
from enum import Enum as PyEnum
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, BigInteger
from sqlalchemy.orm import relationship
from app.database import Base


class EvidenceType(str, PyEnum):
    """Types of digital evidence"""
    CSV_FILE = "csv_file"
    IMAGE = "image"
    DOCUMENT = "document"
    DATABASE = "database"
    SCREENSHOT = "screenshot"
    EXPORT_FILE = "export_file"
    OTHER = "other"


class EvidenceSource(str, PyEnum):
    """Source of evidence"""
    SMART_IMPORT = "smart_import"
    MANUAL_UPLOAD = "manual_upload"
    CELLEBRITE = "cellebrite"
    UFED = "ufed"
    XRY = "xry"
    API_FETCH = "api_fetch"
    OTHER = "other"


class Evidence(Base):
    """Digital Evidence with SHA-256 Hash for Chain of Custody"""
    
    __tablename__ = "evidences"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Case Reference
    case_id = Column(Integer, ForeignKey("cases.id"), nullable=False, index=True)
    
    # File Information
    file_name = Column(String(255), nullable=False)
    file_type = Column(String(50), nullable=True)  # csv, png, pdf, etc.
    file_size = Column(BigInteger, nullable=True)  # bytes
    
    # Chain of Custody - SHA-256 Hash
    sha256_hash = Column(String(64), nullable=False, index=True)
    
    # Classification
    evidence_type = Column(String(50), default=EvidenceType.OTHER.value)
    evidence_source = Column(String(50), default=EvidenceSource.OTHER.value)
    
    # Metadata from import
    records_count = Column(Integer, nullable=True)  # จำนวน records ที่ import
    columns_info = Column(Text, nullable=True)  # JSON: column names and types
    
    # Description
    description = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    
    # Who collected
    collected_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    collected_at = Column(DateTime, default=datetime.utcnow)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # No back_populates to avoid circular import
    # Use direct queries instead
    
    def __repr__(self):
        return f"<Evidence {self.id}: {self.file_name} ({self.sha256_hash[:16]}...)>"
