"""
Support Ticket Router
API endpoints for support ticket management
"""
from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_

from app.database import get_db
from app.models.support_ticket import SupportTicket
from app.models.user import User
from app.models.notification import UserNotification
from app.schemas.support_ticket import (
    TicketCreate,
    TicketAdminUpdate,
    TicketResponse,
    TicketListItem,
    TicketListResponse,
    TicketDetailResponse,
    AdminTicketListResponse,
    TicketStats,
    UnreadCountResponse,
    TicketStatus,
    TicketUserInfo
)
from app.utils.security import get_current_user, require_admin

router = APIRouter(prefix="/support", tags=["Support Tickets"])


# ============== Helper Functions ==============

def generate_ticket_number(db: Session) -> str:
    """Generate unique ticket number: SUP-YYYY-NNNNN"""
    year = datetime.utcnow().year
    prefix = f"SUP-{year}-"
    
    # Get the latest ticket number for this year
    latest = db.query(SupportTicket).filter(
        SupportTicket.ticket_number.like(f"{prefix}%")
    ).order_by(SupportTicket.id.desc()).first()
    
    if latest:
        # Extract number and increment
        try:
            num = int(latest.ticket_number.split("-")[-1])
            new_num = num + 1
        except:
            new_num = 1
    else:
        new_num = 1
    
    return f"{prefix}{new_num:05d}"


def ticket_to_list_item(ticket: SupportTicket, user_id: int = None) -> TicketListItem:
    """Convert ticket to list item"""
    has_admin_response = ticket.admin_response is not None and ticket.admin_response.strip() != ""
    
    # Check if unread: has admin response but user hasn't read it
    is_unread = False
    if has_admin_response and user_id:
        if ticket.user_read_at is None:
            is_unread = True
        elif ticket.updated_at and ticket.user_read_at < ticket.updated_at:
            is_unread = True
    
    return TicketListItem(
        id=ticket.id,
        ticket_number=ticket.ticket_number,
        subject=ticket.subject,
        category=ticket.category,
        status=ticket.status,
        priority=ticket.priority,
        has_screenshot=ticket.screenshot_data is not None,
        has_admin_response=has_admin_response,
        is_unread=is_unread,
        created_at=ticket.created_at,
        resolved_at=ticket.resolved_at
    )


def ticket_to_detail(ticket: SupportTicket) -> TicketDetailResponse:
    """Convert ticket to detail response"""
    user_info = None
    if ticket.user:
        user_info = TicketUserInfo(
            id=ticket.user.id,
            email=ticket.user.email,
            first_name=ticket.user.first_name,
            last_name=ticket.user.last_name
        )
    
    resolver_info = None
    if ticket.resolver:
        resolver_info = TicketUserInfo(
            id=ticket.resolver.id,
            email=ticket.resolver.email,
            first_name=ticket.resolver.first_name,
            last_name=ticket.resolver.last_name
        )
    
    return TicketDetailResponse(
        id=ticket.id,
        ticket_number=ticket.ticket_number,
        user_id=ticket.user_id,
        user=user_info,
        subject=ticket.subject,
        description=ticket.description,
        category=ticket.category,
        status=ticket.status,
        priority=ticket.priority,
        screenshot_data=ticket.screenshot_data,
        screenshot_filename=ticket.screenshot_filename,
        admin_response=ticket.admin_response,
        resolved_by=ticket.resolved_by,
        resolver=resolver_info,
        resolved_at=ticket.resolved_at,
        user_read_at=ticket.user_read_at,
        created_at=ticket.created_at,
        updated_at=ticket.updated_at
    )


# ============== User Endpoints ==============

@router.post("/tickets", response_model=TicketResponse, status_code=status.HTTP_201_CREATED)
async def create_ticket(
    ticket_data: TicketCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new support ticket"""
    
    # Generate ticket number
    ticket_number = generate_ticket_number(db)
    
    # Create ticket
    ticket = SupportTicket(
        ticket_number=ticket_number,
        user_id=current_user.id,
        subject=ticket_data.subject,
        description=ticket_data.description,
        category=ticket_data.category.value,
        screenshot_data=ticket_data.screenshot_base64,
        screenshot_filename=ticket_data.screenshot_filename
    )
    
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    
    # Send notification to all admins
    admins = db.query(User).filter(User.role == "admin", User.is_active == True).all()
    for admin in admins:
        admin_notif = UserNotification(
            user_id=admin.id,
            title=f"🎫 New Support Ticket: {ticket_number}",
            message=f"[{ticket_data.category.value.upper()}] {ticket_data.subject}\nFrom: {current_user.email}",
            notification_type="ticket",
            priority="high" if ticket_data.category.value == "bug" else "normal",
            related_type="ticket",
            related_id=ticket.id
        )
        db.add(admin_notif)
    db.commit()
    
    return TicketResponse(
        id=ticket.id,
        ticket_number=ticket.ticket_number,
        user_id=ticket.user_id,
        subject=ticket.subject,
        description=ticket.description,
        category=ticket.category,
        status=ticket.status,
        priority=ticket.priority,
        has_screenshot=ticket.screenshot_data is not None,
        admin_response=ticket.admin_response,
        resolved_by=ticket.resolved_by,
        resolved_at=ticket.resolved_at,
        user_read_at=ticket.user_read_at,
        created_at=ticket.created_at,
        updated_at=ticket.updated_at,
        is_unread=False
    )


@router.get("/tickets", response_model=TicketListResponse)
async def list_my_tickets(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List current user's tickets"""
    
    query = db.query(SupportTicket).filter(SupportTicket.user_id == current_user.id)
    
    # Filter by status
    if status:
        query = query.filter(SupportTicket.status == status)
    
    # Count total
    total = query.count()
    
    # Count unread
    unread_query = db.query(SupportTicket).filter(
        SupportTicket.user_id == current_user.id,
        SupportTicket.admin_response.isnot(None),
        or_(
            SupportTicket.user_read_at.is_(None),
            SupportTicket.user_read_at < SupportTicket.updated_at
        )
    )
    unread_count = unread_query.count()
    
    # Paginate
    tickets = query.order_by(SupportTicket.created_at.desc()).offset(
        (page - 1) * page_size
    ).limit(page_size).all()
    
    # Convert to list items
    items = [ticket_to_list_item(t, current_user.id) for t in tickets]
    
    return TicketListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        pages=(total + page_size - 1) // page_size,
        unread_count=unread_count
    )


@router.get("/tickets/unread/count", response_model=UnreadCountResponse)
async def get_unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get count of unread tickets (tickets with new admin response)"""
    
    count = db.query(SupportTicket).filter(
        SupportTicket.user_id == current_user.id,
        SupportTicket.admin_response.isnot(None),
        or_(
            SupportTicket.user_read_at.is_(None),
            SupportTicket.user_read_at < SupportTicket.updated_at
        )
    ).count()
    
    return UnreadCountResponse(unread_count=count)


@router.get("/tickets/{ticket_id}", response_model=TicketDetailResponse)
async def get_my_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific ticket (owner only)"""
    
    ticket = db.query(SupportTicket).filter(
        SupportTicket.id == ticket_id,
        SupportTicket.user_id == current_user.id
    ).first()
    
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found"
        )
    
    return ticket_to_detail(ticket)


@router.post("/tickets/{ticket_id}/read")
async def mark_ticket_read(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark a ticket as read by user"""
    
    ticket = db.query(SupportTicket).filter(
        SupportTicket.id == ticket_id,
        SupportTicket.user_id == current_user.id
    ).first()
    
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found"
        )
    
    ticket.user_read_at = datetime.utcnow()
    db.commit()
    
    return {"message": "Ticket marked as read"}


# ============== Admin Endpoints ==============

@router.get("/admin/tickets", response_model=AdminTicketListResponse)
async def admin_list_tickets(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    status: Optional[str] = None,
    category: Optional[str] = None,
    priority: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """List all tickets (admin only)"""
    
    query = db.query(SupportTicket)
    
    # Filters
    if status:
        query = query.filter(SupportTicket.status == status)
    if category:
        query = query.filter(SupportTicket.category == category)
    if priority:
        query = query.filter(SupportTicket.priority == priority)
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                SupportTicket.ticket_number.ilike(search_term),
                SupportTicket.subject.ilike(search_term),
                SupportTicket.description.ilike(search_term)
            )
        )
    
    # Count total
    total = query.count()
    
    # Paginate with eager loading
    tickets = query.order_by(SupportTicket.created_at.desc()).offset(
        (page - 1) * page_size
    ).limit(page_size).all()
    
    # Convert to detail responses
    items = [ticket_to_detail(t) for t in tickets]
    
    return AdminTicketListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        pages=(total + page_size - 1) // page_size
    )


@router.get("/admin/stats", response_model=TicketStats)
async def admin_get_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Get ticket statistics (admin only)"""
    
    now = datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = today_start - timedelta(days=now.weekday())
    
    # Total
    total = db.query(SupportTicket).count()
    
    # By status
    open_count = db.query(SupportTicket).filter(SupportTicket.status == "open").count()
    in_progress_count = db.query(SupportTicket).filter(SupportTicket.status == "in_progress").count()
    resolved_count = db.query(SupportTicket).filter(SupportTicket.status == "resolved").count()
    closed_count = db.query(SupportTicket).filter(SupportTicket.status == "closed").count()
    
    # Today & This week
    today_count = db.query(SupportTicket).filter(SupportTicket.created_at >= today_start).count()
    week_count = db.query(SupportTicket).filter(SupportTicket.created_at >= week_start).count()
    
    # By category
    bugs = db.query(SupportTicket).filter(SupportTicket.category == "bug").count()
    features = db.query(SupportTicket).filter(SupportTicket.category == "feature").count()
    questions = db.query(SupportTicket).filter(SupportTicket.category == "question").count()
    others = db.query(SupportTicket).filter(SupportTicket.category == "other").count()
    
    return TicketStats(
        total=total,
        open=open_count,
        in_progress=in_progress_count,
        resolved=resolved_count,
        closed=closed_count,
        today=today_count,
        this_week=week_count,
        bugs=bugs,
        features=features,
        questions=questions,
        others=others
    )


@router.get("/admin/tickets/{ticket_id}", response_model=TicketDetailResponse)
async def admin_get_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Get a specific ticket (admin only)"""
    
    ticket = db.query(SupportTicket).filter(SupportTicket.id == ticket_id).first()
    
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found"
        )
    
    return ticket_to_detail(ticket)


@router.patch("/admin/tickets/{ticket_id}", response_model=TicketDetailResponse)
async def admin_update_ticket(
    ticket_id: int,
    update_data: TicketAdminUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Update a ticket (admin only) - status, priority, response"""
    
    ticket = db.query(SupportTicket).filter(SupportTicket.id == ticket_id).first()
    
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found"
        )
    
    # Track if we need to notify user
    should_notify_user = False
    notification_message = ""
    
    # Update fields
    if update_data.status is not None:
        ticket.status = update_data.status.value
        
        # If resolved, set resolved_by and resolved_at
        if update_data.status == TicketStatus.RESOLVED:
            ticket.resolved_by = current_user.id
            ticket.resolved_at = datetime.utcnow()
            should_notify_user = True
            notification_message = f"Your ticket {ticket.ticket_number} has been resolved."
    
    if update_data.priority is not None:
        ticket.priority = update_data.priority.value
    
    if update_data.admin_response is not None:
        ticket.admin_response = update_data.admin_response
        # Reset user_read_at so they see the new response
        ticket.user_read_at = None
        should_notify_user = True
        notification_message = f"Admin has responded to your ticket {ticket.ticket_number}"
    
    ticket.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(ticket)
    
    # Send notification to ticket owner
    if should_notify_user:
        user_notif = UserNotification(
            user_id=ticket.user_id,
            title=f"📬 Ticket Update: {ticket.ticket_number}",
            message=notification_message,
            notification_type="ticket",
            priority="normal",
            related_type="ticket",
            related_id=ticket.id
        )
        db.add(user_notif)
        db.commit()
    
    return ticket_to_detail(ticket)
