"""
Evidence Router
Digital Evidence Chain of Custody API
"""
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session, joinedload
from app.database import get_db
from app.models import Evidence, Case, User
from app.routers.auth import get_current_user

router = APIRouter(prefix="/evidences", tags=["evidences"])


# ==================== SCHEMAS ====================
class EvidenceCreate(BaseModel):
    case_id: int
    file_name: str
    file_type: Optional[str] = None
    file_size: Optional[int] = None
    sha256_hash: str
    evidence_type: Optional[str] = "other"
    evidence_source: Optional[str] = "smart_import"
    records_count: Optional[int] = None
    columns_info: Optional[str] = None
    description: Optional[str] = None
    notes: Optional[str] = None


class EvidenceResponse(BaseModel):
    id: int
    case_id: int
    file_name: str
    file_type: Optional[str]
    file_size: Optional[int]
    sha256_hash: str
    evidence_type: str
    evidence_source: str
    records_count: Optional[int]
    columns_info: Optional[str]
    description: Optional[str]
    notes: Optional[str]
    collected_by: int
    collected_at: datetime
    created_at: datetime
    updated_at: datetime
    
    # Additional fields for display
    collector_name: Optional[str] = None
    case_number: Optional[str] = None
    case_title: Optional[str] = None

    class Config:
        from_attributes = True


class EvidenceVerifyResponse(BaseModel):
    """Response for public verification endpoint"""
    verified: bool
    file_name: str
    sha256_hash: str
    case_number: str
    case_title: str
    collected_at: datetime
    collector_name: str
    message: str


class CaseEvidencesResponse(BaseModel):
    """Response for all evidences in a case (public)"""
    case_number: str
    case_title: str
    evidences_count: int
    evidences: List[dict]


# ==================== ENDPOINTS ====================

@router.post("/", response_model=EvidenceResponse)
async def create_evidence(
    evidence: EvidenceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create new evidence record (Chain of Custody)"""
    # Verify case exists and user has access
    case = db.query(Case).filter(Case.id == evidence.case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    # Check if hash already exists for this case
    existing = db.query(Evidence).filter(
        Evidence.case_id == evidence.case_id,
        Evidence.sha256_hash == evidence.sha256_hash
    ).first()
    
    if existing:
        # Return existing evidence instead of creating duplicate
        return existing
    
    # Create evidence
    db_evidence = Evidence(
        case_id=evidence.case_id,
        file_name=evidence.file_name,
        file_type=evidence.file_type,
        file_size=evidence.file_size,
        sha256_hash=evidence.sha256_hash,
        evidence_type=evidence.evidence_type,
        evidence_source=evidence.evidence_source,
        records_count=evidence.records_count,
        columns_info=evidence.columns_info,
        description=evidence.description,
        notes=evidence.notes,
        collected_by=current_user.id,
        collected_at=datetime.utcnow()
    )
    
    db.add(db_evidence)
    db.commit()
    db.refresh(db_evidence)
    
    return db_evidence


@router.get("/case/{case_id}", response_model=List[EvidenceResponse])
async def list_case_evidences(
    case_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all evidences for a case"""
    evidences = db.query(Evidence).options(
        joinedload(Evidence.case),
        joinedload(Evidence.collected_by_user)
    ).filter(Evidence.case_id == case_id).order_by(Evidence.collected_at.desc()).all()
    
    result = []
    for e in evidences:
        resp = EvidenceResponse.model_validate(e)
        resp.collector_name = e.collected_by_user.full_name if e.collected_by_user else None
        resp.case_number = e.case.case_number if e.case else None
        resp.case_title = e.case.title if e.case else None
        result.append(resp)
    
    return result


@router.get("/hash/{sha256_hash}", response_model=EvidenceResponse)
async def get_evidence_by_hash(
    sha256_hash: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get evidence by SHA-256 hash"""
    evidence = db.query(Evidence).options(
        joinedload(Evidence.case),
        joinedload(Evidence.collected_by_user)
    ).filter(Evidence.sha256_hash == sha256_hash).first()
    
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence not found")
    
    resp = EvidenceResponse.model_validate(evidence)
    resp.collector_name = evidence.collected_by_user.full_name if evidence.collected_by_user else None
    resp.case_number = evidence.case.case_number if evidence.case else None
    resp.case_title = evidence.case.title if evidence.case else None
    
    return resp


@router.delete("/{evidence_id}")
async def delete_evidence(
    evidence_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete evidence (admin only)"""
    evidence = db.query(Evidence).filter(Evidence.id == evidence_id).first()
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence not found")
    
    db.delete(evidence)
    db.commit()
    
    return {"message": "Evidence deleted"}


# ==================== PUBLIC ENDPOINTS (No Auth) ====================

@router.get("/public/verify/{sha256_hash}", response_model=EvidenceVerifyResponse)
async def verify_evidence_public(
    sha256_hash: str,
    db: Session = Depends(get_db)
):
    """
    Public endpoint to verify evidence by hash
    Used by QR Code scanning
    """
    evidence = db.query(Evidence).options(
        joinedload(Evidence.case),
        joinedload(Evidence.collected_by_user)
    ).filter(Evidence.sha256_hash == sha256_hash).first()
    
    if not evidence:
        raise HTTPException(
            status_code=404, 
            detail="ไม่พบหลักฐานในระบบ - Hash นี้ยังไม่ได้ลงทะเบียน"
        )
    
    return EvidenceVerifyResponse(
        verified=True,
        file_name=evidence.file_name,
        sha256_hash=evidence.sha256_hash,
        case_number=evidence.case.case_number if evidence.case else "N/A",
        case_title=evidence.case.title if evidence.case else "N/A",
        collected_at=evidence.collected_at,
        collector_name=evidence.collected_by_user.full_name if evidence.collected_by_user else "Unknown",
        message="หลักฐานถูกต้อง - Hash ตรงกับที่บันทึกในระบบ"
    )


@router.get("/public/case/{case_number}", response_model=CaseEvidencesResponse)
async def get_case_evidences_public(
    case_number: str,
    db: Session = Depends(get_db)
):
    """
    Public endpoint to get all evidences for a case
    Used by QR Code scanning with case parameter
    """
    case = db.query(Case).filter(Case.case_number == case_number).first()
    
    if not case:
        raise HTTPException(
            status_code=404,
            detail="ไม่พบคดีในระบบ"
        )
    
    evidences = db.query(Evidence).options(
        joinedload(Evidence.collected_by_user)
    ).filter(Evidence.case_id == case.id).order_by(Evidence.collected_at.desc()).all()
    
    evidence_list = []
    for e in evidences:
        evidence_list.append({
            "id": e.id,
            "file_name": e.file_name,
            "file_type": e.file_type,
            "file_size": e.file_size,
            "sha256_hash": e.sha256_hash,
            "evidence_type": e.evidence_type,
            "evidence_source": e.evidence_source,
            "records_count": e.records_count,
            "collected_at": e.collected_at.isoformat() if e.collected_at else None,
            "collector_name": e.collected_by_user.full_name if e.collected_by_user else "Unknown"
        })
    
    return CaseEvidencesResponse(
        case_number=case.case_number,
        case_title=case.title,
        evidences_count=len(evidence_list),
        evidences=evidence_list
    )
