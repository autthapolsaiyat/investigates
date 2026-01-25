"""
Locations Router
API for Location Timeline data
"""
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.location import LocationPoint, LocationCluster, LocationSource
from app.models.case import Case
from app.models.user import User
from app.routers.auth import get_current_user
import json

router = APIRouter(prefix="/locations", tags=["locations"])


# ==================== SCHEMAS ====================

class LocationPointCreate(BaseModel):
    suspect_id: Optional[str] = None
    suspect_name: Optional[str] = None
    device_id: Optional[str] = None
    latitude: float
    longitude: float
    altitude: Optional[float] = None
    accuracy_meters: Optional[float] = None
    source: Optional[str] = "unknown"
    cell_id: Optional[str] = None
    wifi_bssid: Optional[str] = None
    wifi_ssid: Optional[str] = None
    location_name: Optional[str] = None
    location_type: Optional[str] = None
    address: Optional[str] = None
    timestamp: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    is_significant: Optional[bool] = False
    notes: Optional[str] = None
    raw_data: Optional[str] = None


class LocationPointResponse(BaseModel):
    id: int
    case_id: int
    suspect_id: Optional[str]
    suspect_name: Optional[str]
    latitude: float
    longitude: float
    accuracy_meters: Optional[float]
    source: str
    location_name: Optional[str]
    location_type: Optional[str]
    address: Optional[str]
    timestamp: Optional[datetime]
    is_significant: bool
    notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class LocationClusterCreate(BaseModel):
    name: str
    cluster_type: Optional[str] = None
    center_lat: float
    center_lon: float
    radius_meters: Optional[float] = 100
    visit_count: Optional[int] = 0
    total_duration_minutes: Optional[int] = 0
    unique_visitors: Optional[int] = 0
    is_suspicious: Optional[bool] = False
    risk_score: Optional[int] = 0
    notes: Optional[str] = None
    first_visit: Optional[datetime] = None
    last_visit: Optional[datetime] = None


class LocationClusterResponse(BaseModel):
    id: int
    case_id: int
    name: str
    cluster_type: Optional[str]
    center_lat: float
    center_lon: float
    radius_meters: float
    visit_count: int
    total_duration_minutes: int
    unique_visitors: int
    is_suspicious: bool
    risk_score: int
    first_visit: Optional[datetime]
    last_visit: Optional[datetime]

    class Config:
        from_attributes = True


class BulkImportRequest(BaseModel):
    points: List[LocationPointCreate]
    evidence_id: Optional[int] = None


class TimelineDataResponse(BaseModel):
    """Full timeline data for visualization"""
    points: List[dict]
    clusters: List[dict]
    persons: List[str]
    summary: dict


# ==================== LOCATION POINTS ENDPOINTS ====================

@router.post("/case/{case_id}/points", response_model=LocationPointResponse)
async def create_location_point(
    case_id: int,
    point: LocationPointCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a single location point"""
    case = db.query(Case).filter(Case.id == case_id, Case.is_active == True).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    # Map source string to enum
    source_map = {
        "gps": LocationSource.GPS,
        "cell_tower": LocationSource.CELL_TOWER,
        "wifi": LocationSource.WIFI,
        "photo_exif": LocationSource.PHOTO_EXIF,
        "manual": LocationSource.MANUAL,
        "app_data": LocationSource.APP_DATA,
    }
    source_enum = source_map.get((point.source or "").lower(), LocationSource.UNKNOWN)
    
    db_point = LocationPoint(
        case_id=case_id,
        suspect_id=point.suspect_id,
        suspect_name=point.suspect_name,
        device_id=point.device_id,
        latitude=point.latitude,
        longitude=point.longitude,
        altitude=point.altitude,
        accuracy_meters=point.accuracy_meters,
        source=source_enum,
        cell_id=point.cell_id,
        wifi_bssid=point.wifi_bssid,
        wifi_ssid=point.wifi_ssid,
        location_name=point.location_name,
        location_type=point.location_type,
        address=point.address,
        timestamp=point.timestamp,
        duration_minutes=point.duration_minutes,
        is_significant=point.is_significant or False,
        notes=point.notes,
        raw_data=point.raw_data
    )
    
    db.add(db_point)
    db.commit()
    db.refresh(db_point)
    
    return db_point


@router.post("/case/{case_id}/points/bulk")
async def bulk_import_location_points(
    case_id: int,
    request: BulkImportRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Bulk import location points"""
    case = db.query(Case).filter(Case.id == case_id, Case.is_active == True).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    source_map = {
        "gps": LocationSource.GPS,
        "cell_tower": LocationSource.CELL_TOWER,
        "wifi": LocationSource.WIFI,
        "photo_exif": LocationSource.PHOTO_EXIF,
        "manual": LocationSource.MANUAL,
        "app_data": LocationSource.APP_DATA,
    }
    
    created_count = 0
    for point in request.points:
        source_enum = source_map.get((point.source or "").lower(), LocationSource.UNKNOWN)
        
        db_point = LocationPoint(
            case_id=case_id,
            evidence_id=request.evidence_id,
            suspect_id=point.suspect_id,
            suspect_name=point.suspect_name,
            device_id=point.device_id,
            latitude=point.latitude,
            longitude=point.longitude,
            altitude=point.altitude,
            accuracy_meters=point.accuracy_meters,
            source=source_enum,
            cell_id=point.cell_id,
            wifi_bssid=point.wifi_bssid,
            wifi_ssid=point.wifi_ssid,
            location_name=point.location_name,
            location_type=point.location_type,
            address=point.address,
            timestamp=point.timestamp,
            duration_minutes=point.duration_minutes,
            is_significant=point.is_significant or False,
            notes=point.notes,
            raw_data=point.raw_data
        )
        db.add(db_point)
        created_count += 1
    
    db.commit()
    
    return {"message": f"Imported {created_count} location points", "count": created_count}


@router.get("/case/{case_id}/points", response_model=List[LocationPointResponse])
async def list_location_points(
    case_id: int,
    suspect_id: Optional[str] = None,
    source: Optional[str] = None,
    skip: int = 0,
    limit: int = 1000,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all location points for a case"""
    query = db.query(LocationPoint).filter(LocationPoint.case_id == case_id)
    
    if suspect_id:
        query = query.filter(LocationPoint.suspect_id == suspect_id)
    if source:
        query = query.filter(LocationPoint.source == source)
    
    points = query.order_by(LocationPoint.timestamp.asc()).offset(skip).limit(limit).all()
    
    return points


@router.delete("/case/{case_id}/points")
async def delete_all_location_points(
    case_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete all location points for a case"""
    deleted = db.query(LocationPoint).filter(LocationPoint.case_id == case_id).delete()
    db.commit()
    return {"message": f"Deleted {deleted} location points"}


# ==================== LOCATION CLUSTERS ENDPOINTS ====================

@router.post("/case/{case_id}/clusters", response_model=LocationClusterResponse)
async def create_location_cluster(
    case_id: int,
    cluster: LocationClusterCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a location cluster"""
    db_cluster = LocationCluster(
        case_id=case_id,
        name=cluster.name,
        cluster_type=cluster.cluster_type,
        center_lat=cluster.center_lat,
        center_lon=cluster.center_lon,
        radius_meters=cluster.radius_meters or 100,
        visit_count=cluster.visit_count or 0,
        total_duration_minutes=cluster.total_duration_minutes or 0,
        unique_visitors=cluster.unique_visitors or 0,
        is_suspicious=cluster.is_suspicious or False,
        risk_score=cluster.risk_score or 0,
        notes=cluster.notes,
        first_visit=cluster.first_visit,
        last_visit=cluster.last_visit
    )
    
    db.add(db_cluster)
    db.commit()
    db.refresh(db_cluster)
    
    return db_cluster


@router.get("/case/{case_id}/clusters", response_model=List[LocationClusterResponse])
async def list_location_clusters(
    case_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all location clusters for a case"""
    clusters = db.query(LocationCluster).filter(
        LocationCluster.case_id == case_id
    ).all()
    
    return clusters


@router.delete("/case/{case_id}/clusters")
async def delete_all_location_clusters(
    case_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete all location clusters for a case"""
    deleted = db.query(LocationCluster).filter(LocationCluster.case_id == case_id).delete()
    db.commit()
    return {"message": f"Deleted {deleted} location clusters"}


# ==================== TIMELINE DATA ENDPOINT ====================

@router.get("/case/{case_id}/timeline", response_model=TimelineDataResponse)
async def get_timeline_data(
    case_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get complete timeline data for visualization"""
    
    # Get all points
    points = db.query(LocationPoint).filter(
        LocationPoint.case_id == case_id
    ).order_by(LocationPoint.timestamp.asc()).all()
    
    # Get clusters
    clusters = db.query(LocationCluster).filter(
        LocationCluster.case_id == case_id
    ).all()
    
    # Build points list for frontend
    point_list = []
    for p in points:
        point_list.append({
            "id": str(p.id),
            "lat": p.latitude,
            "lng": p.longitude,
            "timestamp": p.timestamp.isoformat() if p.timestamp else None,
            "label": p.location_name or f"Point {p.id}",
            "source": p.source.value if p.source else "unknown",
            "accuracy": p.accuracy_meters,
            "address": p.address,
            "notes": p.notes,
            "personId": p.suspect_id,
            "personName": p.suspect_name,
            "locationType": p.location_type
        })
    
    # Build clusters list for frontend
    cluster_list = []
    for c in clusters:
        cluster_list.append({
            "id": c.id,
            "name": c.name,
            "type": c.cluster_type,
            "lat": c.center_lat,
            "lng": c.center_lon,
            "radius": c.radius_meters,
            "visits": c.visit_count,
            "duration": c.total_duration_minutes,
            "isSuspicious": c.is_suspicious,
            "riskScore": c.risk_score
        })
    
    # Get unique persons
    persons = list(set(p.suspect_name for p in points if p.suspect_name))
    
    # Summary
    summary = {
        "totalPoints": len(points),
        "totalClusters": len(clusters),
        "totalPersons": len(persons),
        "dateRange": {
            "start": points[0].timestamp.isoformat() if points and points[0].timestamp else None,
            "end": points[-1].timestamp.isoformat() if points and points[-1].timestamp else None
        }
    }
    
    return TimelineDataResponse(
        points=point_list,
        clusters=cluster_list,
        persons=persons,
        summary=summary
    )


# ==================== STATISTICS ENDPOINT ====================

@router.get("/case/{case_id}/stats")
async def get_location_stats(
    case_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get location statistics for a case"""
    
    total_points = db.query(func.count(LocationPoint.id)).filter(
        LocationPoint.case_id == case_id
    ).scalar() or 0
    
    total_clusters = db.query(func.count(LocationCluster.id)).filter(
        LocationCluster.case_id == case_id
    ).scalar() or 0
    
    unique_suspects = db.query(func.count(func.distinct(LocationPoint.suspect_id))).filter(
        LocationPoint.case_id == case_id,
        LocationPoint.suspect_id.isnot(None)
    ).scalar() or 0
    
    # Count by source
    source_counts = db.query(
        LocationPoint.source,
        func.count(LocationPoint.id)
    ).filter(
        LocationPoint.case_id == case_id
    ).group_by(LocationPoint.source).all()
    
    sources = {str(s[0].value) if s[0] else "unknown": s[1] for s in source_counts}
    
    return {
        "total_points": total_points,
        "total_clusters": total_clusters,
        "unique_suspects": unique_suspects,
        "sources": sources
    }
