"""
Login History Router
Admin endpoints for viewing login history and map data
"""
from math import ceil
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from app.database import get_db
from app.models.user import User
from app.models.login_history import LoginHistory
from app.schemas.login_history import (
    LoginHistoryResponse,
    LoginHistoryListResponse,
    LoginMapPoint,
    LoginMapResponse,
    LoginStats
)
from app.utils.security import require_admin

router = APIRouter(prefix="/login-history", tags=["Login History"])


@router.get("", response_model=LoginHistoryListResponse)
async def list_login_history(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    user_id: int = Query(None),
    success_only: bool = Query(None),
    days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    List login history with filters
    """
    # Base query
    query = db.query(LoginHistory).join(User)
    
    # Filter by date range
    start_date = datetime.utcnow() - timedelta(days=days)
    query = query.filter(LoginHistory.login_at >= start_date)
    
    # Filter by user
    if user_id:
        query = query.filter(LoginHistory.user_id == user_id)
    
    # Filter by success
    if success_only is not None:
        query = query.filter(LoginHistory.login_success == success_only)
    
    # Count total
    total = query.count()
    
    # Paginate
    records = query.order_by(desc(LoginHistory.login_at)) \
                   .offset((page - 1) * page_size) \
                   .limit(page_size) \
                   .all()
    
    # Convert to response
    items = []
    for record in records:
        user = record.user
        items.append(LoginHistoryResponse(
            id=record.id,
            user_id=record.user_id,
            login_at=record.login_at,
            ip_address=record.ip_address,
            user_agent=record.user_agent,
            device_type=record.device_type,
            browser=record.browser,
            os=record.os,
            country=record.country,
            country_code=record.country_code,
            region=record.region,
            city=record.city,
            latitude=float(record.latitude) if record.latitude else None,
            longitude=float(record.longitude) if record.longitude else None,
            isp=record.isp,
            login_success=record.login_success,
            failure_reason=record.failure_reason,
            user_email=user.email if user else None,
            user_name=f"{user.first_name} {user.last_name}" if user else None
        ))
    
    return LoginHistoryListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        pages=ceil(total / page_size) if total > 0 else 1
    )


@router.get("/map", response_model=LoginMapResponse)
async def get_login_map_data(
    days: int = Query(7, ge=1, le=90),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Get login data for map display
    Returns points with lat/long for the specified time period
    """
    # Get logins with location data
    start_date = datetime.utcnow() - timedelta(days=days)
    
    records = db.query(LoginHistory).join(User) \
        .filter(
            LoginHistory.login_at >= start_date,
            LoginHistory.login_success == True,
            LoginHistory.latitude.isnot(None),
            LoginHistory.longitude.isnot(None)
        ) \
        .order_by(desc(LoginHistory.login_at)) \
        .limit(500) \
        .all()
    
    # Check who is online (logged in within last 30 minutes)
    online_threshold = datetime.utcnow() - timedelta(minutes=30)
    
    # Get latest login per user
    latest_logins = db.query(
        LoginHistory.user_id,
        func.max(LoginHistory.login_at).label('last_login')
    ).filter(
        LoginHistory.login_success == True
    ).group_by(LoginHistory.user_id).subquery()
    
    online_users = db.query(latest_logins.c.user_id).filter(
        latest_logins.c.last_login >= online_threshold
    ).all()
    online_user_ids = {u[0] for u in online_users}
    
    # Convert to map points
    points = []
    seen_locations = set()
    
    for record in records:
        user = record.user
        
        # Create unique key for deduplication
        loc_key = f"{record.user_id}_{record.latitude}_{record.longitude}"
        if loc_key in seen_locations:
            continue
        seen_locations.add(loc_key)
        
        points.append(LoginMapPoint(
            id=record.id,
            user_id=record.user_id,
            user_email=user.email if user else "Unknown",
            user_name=f"{user.first_name} {user.last_name}" if user else "Unknown",
            login_at=record.login_at,
            ip_address=record.ip_address,
            latitude=float(record.latitude) if record.latitude else None,
            longitude=float(record.longitude) if record.longitude else None,
            city=record.city,
            country=record.country,
            device_type=record.device_type,
            browser=record.browser,
            os=record.os,
            is_online=record.user_id in online_user_ids
        ))
    
    # Get unique counts
    unique_users = len(set(p.user_id for p in points))
    unique_locations = len(set((p.latitude, p.longitude) for p in points if p.latitude and p.longitude))
    
    return LoginMapResponse(
        points=points,
        total_logins=len(points),
        unique_users=unique_users,
        unique_locations=unique_locations
    )


@router.get("/stats", response_model=LoginStats)
async def get_login_stats(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Get login statistics
    """
    now = datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = today_start - timedelta(days=7)
    month_start = today_start - timedelta(days=30)
    
    # Total logins
    total_today = db.query(LoginHistory).filter(
        LoginHistory.login_at >= today_start,
        LoginHistory.login_success == True
    ).count()
    
    total_week = db.query(LoginHistory).filter(
        LoginHistory.login_at >= week_start,
        LoginHistory.login_success == True
    ).count()
    
    total_month = db.query(LoginHistory).filter(
        LoginHistory.login_at >= month_start,
        LoginHistory.login_success == True
    ).count()
    
    # Unique users today
    unique_today = db.query(func.count(func.distinct(LoginHistory.user_id))).filter(
        LoginHistory.login_at >= today_start,
        LoginHistory.login_success == True
    ).scalar() or 0
    
    # Failed logins today
    failed_today = db.query(LoginHistory).filter(
        LoginHistory.login_at >= today_start,
        LoginHistory.login_success == False
    ).count()
    
    # Top locations (last 7 days)
    top_locations = db.query(
        LoginHistory.city,
        LoginHistory.country,
        func.count(LoginHistory.id).label('count')
    ).filter(
        LoginHistory.login_at >= week_start,
        LoginHistory.login_success == True,
        LoginHistory.city.isnot(None)
    ).group_by(
        LoginHistory.city,
        LoginHistory.country
    ).order_by(desc('count')).limit(5).all()
    
    # Top devices (last 7 days)
    top_devices = db.query(
        LoginHistory.device_type,
        LoginHistory.browser,
        func.count(LoginHistory.id).label('count')
    ).filter(
        LoginHistory.login_at >= week_start,
        LoginHistory.login_success == True
    ).group_by(
        LoginHistory.device_type,
        LoginHistory.browser
    ).order_by(desc('count')).limit(5).all()
    
    return LoginStats(
        total_logins_today=total_today,
        total_logins_week=total_week,
        total_logins_month=total_month,
        unique_users_today=unique_today,
        failed_logins_today=failed_today,
        top_locations=[
            {"city": loc[0], "country": loc[1], "count": loc[2]}
            for loc in top_locations
        ],
        top_devices=[
            {"device_type": dev[0], "browser": dev[1], "count": dev[2]}
            for dev in top_devices
        ]
    )


@router.get("/user/{user_id}")
async def get_user_login_history(
    user_id: int,
    limit: int = Query(10, ge=1, le=50),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Get login history for a specific user
    """
    records = db.query(LoginHistory).filter(
        LoginHistory.user_id == user_id
    ).order_by(desc(LoginHistory.login_at)).limit(limit).all()
    
    return [
        {
            "id": r.id,
            "login_at": r.login_at,
            "ip_address": r.ip_address,
            "device_type": r.device_type,
            "browser": r.browser,
            "os": r.os,
            "city": r.city,
            "country": r.country,
            "login_success": r.login_success
        }
        for r in records
    ]
