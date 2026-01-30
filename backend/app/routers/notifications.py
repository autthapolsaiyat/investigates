"""
Notifications Router
API endpoints for notification management
"""
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_

from app.database import get_db
from app.models.notification import Notification, UserNotification
from app.models.user import User
from app.schemas.notification import (
    NotificationCreate,
    NotificationUpdate,
    NotificationResponse,
    NotificationListResponse,
    UserNotificationResponse,
    UserNotificationListResponse,
    UnreadCountResponse,
    NotificationStats,
    NotificationTemplate
)
from app.utils.security import get_current_user, require_admin

router = APIRouter(prefix="/notifications", tags=["Notifications"])


# ============== Helper Functions ==============

def create_user_notification(
    db: Session,
    user_id: int,
    title: str,
    message: str,
    notification_type: str = "system",
    priority: str = "normal",
    related_type: str = None,
    related_id: int = None
) -> UserNotification:
    """Create a notification for a specific user"""
    notif = UserNotification(
        user_id=user_id,
        title=title,
        message=message,
        notification_type=notification_type,
        priority=priority,
        related_type=related_type,
        related_id=related_id
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return notif


def notify_admins(
    db: Session,
    title: str,
    message: str,
    notification_type: str = "system",
    priority: str = "normal",
    related_type: str = None,
    related_id: int = None
):
    """Send notification to all admin users"""
    admins = db.query(User).filter(User.role == "admin", User.is_active == True).all()
    
    for admin in admins:
        create_user_notification(
            db=db,
            user_id=admin.id,
            title=title,
            message=message,
            notification_type=notification_type,
            priority=priority,
            related_type=related_type,
            related_id=related_id
        )


# ============== Admin Endpoints ==============

@router.post("", response_model=NotificationResponse, status_code=status.HTTP_201_CREATED)
async def create_notification(
    data: NotificationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Create a new notification template (admin only)"""
    
    notification = Notification(
        title=data.title,
        message=data.message,
        notification_type=data.notification_type.value,
        target_audience=data.target_audience.value,
        priority=data.priority.value,
        created_by=current_user.id
    )
    
    db.add(notification)
    db.commit()
    db.refresh(notification)
    
    return notification


@router.post("/{notification_id}/send")
async def send_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Send notification to target users (admin only)"""
    
    notification = db.query(Notification).filter(Notification.id == notification_id).first()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    # Get target users
    query = db.query(User).filter(User.is_active == True)
    
    if notification.target_audience == "admin":
        query = query.filter(User.role == "admin")
    elif notification.target_audience == "users":
        query = query.filter(User.role != "admin")
    
    users = query.all()
    sent_count = 0
    
    for user in users:
        user_notif = UserNotification(
            user_id=user.id,
            notification_id=notification.id,
            title=notification.title,
            message=notification.message,
            notification_type=notification.notification_type,
            priority=notification.priority
        )
        db.add(user_notif)
        sent_count += 1
    
    db.commit()
    
    return {"message": f"Notification sent to {sent_count} users", "sent_count": sent_count}


@router.get("", response_model=NotificationListResponse)
async def list_notifications(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """List all notification templates (admin only)"""
    
    query = db.query(Notification)
    total = query.count()
    
    notifications = query.order_by(Notification.created_at.desc()).offset(
        (page - 1) * page_size
    ).limit(page_size).all()
    
    return NotificationListResponse(
        items=notifications,
        total=total,
        page=page,
        page_size=page_size,
        pages=(total + page_size - 1) // page_size
    )


@router.get("/stats", response_model=NotificationStats)
async def get_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Get notification statistics (admin only)"""
    
    total = db.query(Notification).count()
    active = db.query(Notification).filter(Notification.is_active == True).count()
    inactive = total - active
    
    # By type
    by_type = {}
    types = db.query(Notification.notification_type, func.count(Notification.id)).group_by(
        Notification.notification_type
    ).all()
    for t, count in types:
        by_type[t] = count
    
    # Sent count
    sent_count = db.query(UserNotification).count()
    
    # Read rate
    read_count = db.query(UserNotification).filter(UserNotification.is_read == True).count()
    read_rate = (read_count / sent_count * 100) if sent_count > 0 else 0
    
    return NotificationStats(
        total=total,
        active=active,
        inactive=inactive,
        by_type=by_type,
        sent_count=sent_count,
        read_rate=round(read_rate, 1)
    )


@router.get("/templates", response_model=List[NotificationTemplate])
async def get_templates(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Get predefined notification templates"""
    
    return [
        NotificationTemplate(
            id="welcome",
            name="Welcome Message",
            title="Welcome to InvestiGate!",
            message="Your account has been approved. Start by importing your first case data.",
            notification_type="system"
        ),
        NotificationTemplate(
            id="license_expiring",
            name="License Expiring",
            title="License Expiring Soon",
            message="Your license will expire in {days} days. Please renew to continue using the service.",
            notification_type="license"
        ),
        NotificationTemplate(
            id="new_feature",
            name="New Feature",
            title="New Feature Available",
            message="We've added new features! Check out {feature_name} in your dashboard.",
            notification_type="system"
        ),
        NotificationTemplate(
            id="maintenance",
            name="Scheduled Maintenance",
            title="Scheduled Maintenance",
            message="System maintenance scheduled for {date}. Service may be temporarily unavailable.",
            notification_type="alert"
        )
    ]


@router.patch("/{notification_id}", response_model=NotificationResponse)
async def update_notification(
    notification_id: int,
    data: NotificationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Update a notification template (admin only)"""
    
    notification = db.query(Notification).filter(Notification.id == notification_id).first()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        if hasattr(value, 'value'):  # Enum
            value = value.value
        setattr(notification, key, value)
    
    notification.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(notification)
    
    return notification


@router.delete("/{notification_id}")
async def delete_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Delete a notification template (admin only)"""
    
    notification = db.query(Notification).filter(Notification.id == notification_id).first()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    # Also delete user notifications
    db.query(UserNotification).filter(UserNotification.notification_id == notification_id).delete()
    db.delete(notification)
    db.commit()
    
    return {"message": "Notification deleted"}


# ============== User Endpoints ==============

@router.get("/my", response_model=UserNotificationListResponse)
async def get_my_notifications(
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get current user's notifications"""
    
    notifications = db.query(UserNotification).filter(
        UserNotification.user_id == current_user.id,
        UserNotification.is_dismissed == False
    ).order_by(UserNotification.created_at.desc()).limit(limit).all()
    
    unread_count = db.query(UserNotification).filter(
        UserNotification.user_id == current_user.id,
        UserNotification.is_read == False,
        UserNotification.is_dismissed == False
    ).count()
    
    items = []
    for n in notifications:
        items.append(UserNotificationResponse(
            id=n.id,
            title=n.title or "",
            message=n.message or "",
            notification_type=n.notification_type or "system",
            priority=n.priority or "normal",
            related_type=n.related_type,
            related_id=n.related_id,
            is_read=n.is_read,
            read_at=n.read_at,
            is_dismissed=n.is_dismissed,
            created_at=n.created_at
        ))
    
    return UserNotificationListResponse(items=items, unread_count=unread_count)


@router.get("/my/unread-count", response_model=UnreadCountResponse)
async def get_unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get count of unread notifications"""
    
    count = db.query(UserNotification).filter(
        UserNotification.user_id == current_user.id,
        UserNotification.is_read == False,
        UserNotification.is_dismissed == False
    ).count()
    
    return UnreadCountResponse(count=count)


@router.post("/my/{notification_id}/read")
async def mark_as_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark notification as read"""
    
    notification = db.query(UserNotification).filter(
        UserNotification.id == notification_id,
        UserNotification.user_id == current_user.id
    ).first()
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    notification.is_read = True
    notification.read_at = datetime.utcnow()
    db.commit()
    
    return {"message": "Marked as read"}


@router.post("/my/{notification_id}/dismiss")
async def dismiss_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Dismiss notification"""
    
    notification = db.query(UserNotification).filter(
        UserNotification.id == notification_id,
        UserNotification.user_id == current_user.id
    ).first()
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    notification.is_dismissed = True
    notification.dismissed_at = datetime.utcnow()
    db.commit()
    
    return {"message": "Notification dismissed"}


@router.post("/my/read-all")
async def mark_all_as_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark all notifications as read"""
    
    db.query(UserNotification).filter(
        UserNotification.user_id == current_user.id,
        UserNotification.is_read == False
    ).update({
        UserNotification.is_read: True,
        UserNotification.read_at: datetime.utcnow()
    })
    
    db.commit()
    
    return {"message": "All notifications marked as read"}
