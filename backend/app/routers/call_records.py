"""
Call Records Router
API for Call Analysis data
"""
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.call_record import CallRecord, CallEntity, CallLink, CallType
from app.models.case import Case
from app.models.user import User
from app.routers.auth import get_current_user
import json

router = APIRouter(prefix="/call-analysis", tags=["call-analysis"])


# ==================== SCHEMAS ====================

class CallRecordCreate(BaseModel):
    device_id: Optional[str] = None
    device_imei: Optional[str] = None
    device_owner: Optional[str] = None
    device_number: Optional[str] = None
    partner_number: str
    partner_name: Optional[str] = None
    call_type: Optional[str] = "unknown"
    start_time: Optional[datetime] = None
    duration_seconds: Optional[int] = 0
    cell_id: Optional[str] = None
    gps_lat: Optional[float] = None
    gps_lon: Optional[float] = None
    is_suspect_call: Optional[bool] = False
    notes: Optional[str] = None
    raw_data: Optional[str] = None


class CallRecordResponse(BaseModel):
    id: int
    case_id: int
    device_id: Optional[str]
    device_owner: Optional[str]
    device_number: Optional[str]
    partner_number: str
    partner_name: Optional[str]
    call_type: str
    start_time: Optional[datetime]
    duration_seconds: int
    is_suspect_call: bool
    risk_score: int
    created_at: datetime

    class Config:
        from_attributes = True


class CallEntityCreate(BaseModel):
    entity_type: str  # person, phone
    label: str
    phone_number: Optional[str] = None
    person_name: Optional[str] = None
    total_calls: Optional[int] = 0
    total_duration: Optional[int] = 0
    risk_level: Optional[str] = "unknown"
    risk_score: Optional[int] = 0
    cluster_id: Optional[int] = None
    role: Optional[str] = None
    color: Optional[str] = None
    first_seen: Optional[datetime] = None
    last_seen: Optional[datetime] = None


class CallEntityResponse(BaseModel):
    id: int
    case_id: int
    entity_type: str
    label: str
    phone_number: Optional[str]
    person_name: Optional[str]
    total_calls: int
    total_duration: int
    risk_level: str
    risk_score: int
    cluster_id: Optional[int]
    role: Optional[str]
    color: Optional[str]
    first_seen: Optional[datetime]
    last_seen: Optional[datetime]

    class Config:
        from_attributes = True


class CallLinkCreate(BaseModel):
    source_entity_id: int
    target_entity_id: int
    link_type: Optional[str] = "call"
    call_count: Optional[int] = 0
    total_duration: Optional[int] = 0
    first_contact: Optional[datetime] = None
    last_contact: Optional[datetime] = None
    weight: Optional[int] = 1
    color: Optional[str] = None


class CallLinkResponse(BaseModel):
    id: int
    case_id: int
    source_entity_id: int
    target_entity_id: int
    link_type: str
    call_count: int
    total_duration: int
    first_contact: Optional[datetime]
    last_contact: Optional[datetime]
    weight: int

    class Config:
        from_attributes = True


class BulkImportRequest(BaseModel):
    records: List[CallRecordCreate]
    evidence_id: Optional[int] = None


class NetworkDataResponse(BaseModel):
    """Full network data for visualization"""
    entities: List[dict]
    links: List[dict]
    clusters: List[dict]
    summary: dict


# ==================== CALL RECORDS ENDPOINTS ====================

@router.post("/case/{case_id}/records", response_model=CallRecordResponse)
async def create_call_record(
    case_id: int,
    record: CallRecordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a single call record"""
    case = db.query(Case).filter(Case.id == case_id, Case.is_active == True).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    # Map call_type string to enum
    call_type_map = {
        "incoming": CallType.INCOMING,
        "outgoing": CallType.OUTGOING,
        "missed": CallType.MISSED,
        "blocked": CallType.BLOCKED,
    }
    call_type_enum = call_type_map.get(record.call_type.lower(), CallType.UNKNOWN)
    
    db_record = CallRecord(
        case_id=case_id,
        device_id=record.device_id,
        device_imei=record.device_imei,
        device_owner=record.device_owner,
        device_number=record.device_number,
        partner_number=record.partner_number,
        partner_name=record.partner_name,
        call_type=call_type_enum,
        start_time=record.start_time,
        duration_seconds=record.duration_seconds or 0,
        cell_id=record.cell_id,
        gps_lat=record.gps_lat,
        gps_lon=record.gps_lon,
        is_suspect_call=record.is_suspect_call or False,
        notes=record.notes,
        raw_data=record.raw_data
    )
    
    db.add(db_record)
    db.commit()
    db.refresh(db_record)
    
    return db_record


@router.post("/case/{case_id}/records/bulk")
async def bulk_import_call_records(
    case_id: int,
    request: BulkImportRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Bulk import call records"""
    case = db.query(Case).filter(Case.id == case_id, Case.is_active == True).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    call_type_map = {
        "incoming": CallType.INCOMING,
        "outgoing": CallType.OUTGOING,
        "missed": CallType.MISSED,
        "blocked": CallType.BLOCKED,
    }
    
    created_count = 0
    for record in request.records:
        call_type_enum = call_type_map.get((record.call_type or "").lower(), CallType.UNKNOWN)
        
        db_record = CallRecord(
            case_id=case_id,
            evidence_id=request.evidence_id,
            device_id=record.device_id,
            device_imei=record.device_imei,
            device_owner=record.device_owner,
            device_number=record.device_number,
            partner_number=record.partner_number,
            partner_name=record.partner_name,
            call_type=call_type_enum,
            start_time=record.start_time,
            duration_seconds=record.duration_seconds or 0,
            cell_id=record.cell_id,
            gps_lat=record.gps_lat,
            gps_lon=record.gps_lon,
            is_suspect_call=record.is_suspect_call or False,
            notes=record.notes,
            raw_data=record.raw_data
        )
        db.add(db_record)
        created_count += 1
    
    db.commit()
    
    return {"message": f"Imported {created_count} call records", "count": created_count}


@router.get("/case/{case_id}/records", response_model=List[CallRecordResponse])
async def list_call_records(
    case_id: int,
    skip: int = 0,
    limit: int = 1000,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all call records for a case"""
    records = db.query(CallRecord).filter(
        CallRecord.case_id == case_id
    ).order_by(CallRecord.start_time.desc()).offset(skip).limit(limit).all()
    
    return records


@router.delete("/case/{case_id}/records")
async def delete_all_call_records(
    case_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete all call records for a case"""
    deleted = db.query(CallRecord).filter(CallRecord.case_id == case_id).delete()
    db.commit()
    return {"message": f"Deleted {deleted} call records"}


# ==================== CALL ENTITIES ENDPOINTS ====================

@router.post("/case/{case_id}/entities", response_model=CallEntityResponse)
async def create_call_entity(
    case_id: int,
    entity: CallEntityCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a call entity"""
    db_entity = CallEntity(
        case_id=case_id,
        entity_type=entity.entity_type,
        label=entity.label,
        phone_number=entity.phone_number,
        person_name=entity.person_name,
        total_calls=entity.total_calls or 0,
        total_duration=entity.total_duration or 0,
        risk_level=entity.risk_level or "unknown",
        risk_score=entity.risk_score or 0,
        cluster_id=entity.cluster_id,
        role=entity.role,
        color=entity.color,
        first_seen=entity.first_seen,
        last_seen=entity.last_seen
    )
    
    db.add(db_entity)
    db.commit()
    db.refresh(db_entity)
    
    return db_entity


@router.post("/case/{case_id}/entities/bulk")
async def bulk_import_call_entities(
    case_id: int,
    entities: List[CallEntityCreate],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Bulk import call entities"""
    created_count = 0
    entity_map = {}  # To return IDs for linking
    
    for entity in entities:
        db_entity = CallEntity(
            case_id=case_id,
            entity_type=entity.entity_type,
            label=entity.label,
            phone_number=entity.phone_number,
            person_name=entity.person_name,
            total_calls=entity.total_calls or 0,
            total_duration=entity.total_duration or 0,
            risk_level=entity.risk_level or "unknown",
            risk_score=entity.risk_score or 0,
            cluster_id=entity.cluster_id,
            role=entity.role,
            color=entity.color,
            first_seen=entity.first_seen,
            last_seen=entity.last_seen
        )
        db.add(db_entity)
        db.flush()  # Get ID without committing
        entity_map[entity.label] = db_entity.id
        created_count += 1
    
    db.commit()
    
    return {"message": f"Created {created_count} entities", "count": created_count, "entity_map": entity_map}


@router.get("/case/{case_id}/entities", response_model=List[CallEntityResponse])
async def list_call_entities(
    case_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all call entities for a case"""
    entities = db.query(CallEntity).filter(
        CallEntity.case_id == case_id
    ).all()
    
    return entities


@router.delete("/case/{case_id}/entities")
async def delete_all_call_entities(
    case_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete all call entities for a case"""
    # First delete links
    db.query(CallLink).filter(CallLink.case_id == case_id).delete()
    # Then delete entities
    deleted = db.query(CallEntity).filter(CallEntity.case_id == case_id).delete()
    db.commit()
    return {"message": f"Deleted {deleted} call entities"}


# ==================== CALL LINKS ENDPOINTS ====================

@router.post("/case/{case_id}/links", response_model=CallLinkResponse)
async def create_call_link(
    case_id: int,
    link: CallLinkCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a call link"""
    db_link = CallLink(
        case_id=case_id,
        source_entity_id=link.source_entity_id,
        target_entity_id=link.target_entity_id,
        link_type=link.link_type or "call",
        call_count=link.call_count or 0,
        total_duration=link.total_duration or 0,
        first_contact=link.first_contact,
        last_contact=link.last_contact,
        weight=link.weight or 1,
        color=link.color
    )
    
    db.add(db_link)
    db.commit()
    db.refresh(db_link)
    
    return db_link


@router.post("/case/{case_id}/links/bulk")
async def bulk_import_call_links(
    case_id: int,
    links: List[CallLinkCreate],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Bulk import call links"""
    created_count = 0
    
    for link in links:
        db_link = CallLink(
            case_id=case_id,
            source_entity_id=link.source_entity_id,
            target_entity_id=link.target_entity_id,
            link_type=link.link_type or "call",
            call_count=link.call_count or 0,
            total_duration=link.total_duration or 0,
            first_contact=link.first_contact,
            last_contact=link.last_contact,
            weight=link.weight or 1,
            color=link.color
        )
        db.add(db_link)
        created_count += 1
    
    db.commit()
    
    return {"message": f"Created {created_count} links", "count": created_count}


@router.get("/case/{case_id}/links", response_model=List[CallLinkResponse])
async def list_call_links(
    case_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all call links for a case"""
    links = db.query(CallLink).filter(
        CallLink.case_id == case_id
    ).all()
    
    return links


# ==================== NETWORK DATA ENDPOINT ====================

@router.get("/case/{case_id}/network", response_model=NetworkDataResponse)
async def get_network_data(
    case_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get complete network data for visualization"""
    
    # Get entities
    entities = db.query(CallEntity).filter(CallEntity.case_id == case_id).all()
    
    # Get links
    links = db.query(CallLink).filter(CallLink.case_id == case_id).all()
    
    # Build entity list for frontend
    entity_list = []
    for e in entities:
        entity_list.append({
            "id": f"E{e.id}",
            "type": e.entity_type,
            "label": e.label,
            "subLabel": e.role,
            "risk": e.risk_level,
            "clusterId": e.cluster_id,
            "metadata": {
                "phone": e.phone_number,
                "calls": e.total_calls,
                "duration": e.total_duration
            }
        })
    
    # Build links list for frontend
    link_list = []
    for l in links:
        link_list.append({
            "id": f"L{l.id}",
            "source": f"E{l.source_entity_id}",
            "target": f"E{l.target_entity_id}",
            "type": l.link_type,
            "weight": l.weight,
            "firstSeen": l.first_contact.isoformat() if l.first_contact else None,
            "lastSeen": l.last_contact.isoformat() if l.last_contact else None,
            "metadata": {
                "calls": l.call_count,
                "duration": l.total_duration
            }
        })
    
    # Build clusters from entity cluster_ids
    cluster_ids = set(e.cluster_id for e in entities if e.cluster_id)
    cluster_colors = ['#ef4444', '#f97316', '#22c55e', '#8b5cf6', '#3b82f6', '#ec4899']
    cluster_names = ['Network Boss', 'Coordinator', 'Small Dealers', 'Myanmar Production', 'Transport/Logistics', 'Unknown']
    
    cluster_list = []
    for i, cid in enumerate(sorted(cluster_ids)):
        cluster_list.append({
            "id": cid,
            "name": cluster_names[i] if i < len(cluster_names) else f"Cluster {cid}",
            "color": cluster_colors[i % len(cluster_colors)],
            "entities": [f"E{e.id}" for e in entities if e.cluster_id == cid],
            "risk": "high" if i < 2 else "medium",
            "description": ""
        })
    
    # Summary
    summary = {
        "totalEntities": len(entities),
        "totalLinks": len(links),
        "totalClusters": len(cluster_list),
        "highRiskCount": sum(1 for e in entities if e.risk_level in ['critical', 'high'])
    }
    
    return NetworkDataResponse(
        entities=entity_list,
        links=link_list,
        clusters=cluster_list,
        summary=summary
    )


# ==================== STATISTICS ENDPOINT ====================

@router.get("/case/{case_id}/stats")
async def get_call_stats(
    case_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get call statistics for a case"""
    
    total_records = db.query(func.count(CallRecord.id)).filter(
        CallRecord.case_id == case_id
    ).scalar() or 0
    
    total_entities = db.query(func.count(CallEntity.id)).filter(
        CallEntity.case_id == case_id
    ).scalar() or 0
    
    total_links = db.query(func.count(CallLink.id)).filter(
        CallLink.case_id == case_id
    ).scalar() or 0
    
    total_duration = db.query(func.sum(CallRecord.duration_seconds)).filter(
        CallRecord.case_id == case_id
    ).scalar() or 0
    
    return {
        "total_records": total_records,
        "total_entities": total_entities,
        "total_links": total_links,
        "total_duration_seconds": total_duration,
        "total_duration_hours": round(total_duration / 3600, 2)
    }
