"""
Authentication Router
Login, Register, Token refresh endpoints with login tracking
"""
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.config import settings
from app.models.user import User, UserRole
from app.models.organization import Organization
from app.models.login_history import LoginHistory
from app.schemas.auth import (
    LoginRequest, 
    LoginResponse, 
    TokenResponse, 
    TokenRefreshRequest
)
from app.schemas.user import UserRegister, UserResponse
from app.utils.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    decode_token,
    get_current_user
)
from app.utils.login_tracking import parse_user_agent, get_ip_geolocation, get_client_ip

router = APIRouter(prefix="/auth", tags=["Authentication"])


async def log_login_attempt(
    db: Session,
    user_id: int,
    request: Request,
    success: bool = True,
    failure_reason: str = None
):
    """Log login attempt with device and location info"""
    try:
        # Get client info
        ip_address = get_client_ip(request)
        user_agent = request.headers.get("User-Agent", "")
        
        # Parse user agent
        ua_info = parse_user_agent(user_agent)
        
        # Get IP geolocation
        geo_info = await get_ip_geolocation(ip_address)
        
        # Create login history record
        login_record = LoginHistory(
            user_id=user_id,
            login_at=datetime.utcnow(),
            ip_address=ip_address,
            user_agent=user_agent[:500] if user_agent else None,
            device_type=ua_info["device_type"],
            browser=ua_info["browser"],
            os=ua_info["os"],
            country=geo_info.get("country"),
            country_code=geo_info.get("country_code"),
            region=geo_info.get("region"),
            city=geo_info.get("city"),
            latitude=geo_info.get("latitude"),
            longitude=geo_info.get("longitude"),
            isp=geo_info.get("isp"),
            login_success=success,
            failure_reason=failure_reason
        )
        
        db.add(login_record)
        db.commit()
    except Exception as e:
        print(f"Error logging login: {e}")
        # Don't fail the login if logging fails


@router.post("/seed-admin")
async def seed_admin(db: Session = Depends(get_db)):
    """
    Create or reset admin user for development/testing
    Creates: admin@test.com / admin123
    """
    admin_email = "admin@test.com"
    admin_password = "admin123"
    
    # Check if admin exists
    existing = db.query(User).filter(User.email == admin_email).first()
    
    if existing:
        # Update password
        existing.hashed_password = get_password_hash(admin_password)
        existing.role = UserRole.SUPER_ADMIN
        existing.is_active = True
        existing.failed_login_attempts = 0
        existing.locked_until = None
        db.commit()
        return {"message": "Admin user password reset", "email": admin_email, "password": admin_password}
    else:
        # Create new admin
        user = User(
            email=admin_email,
            hashed_password=get_password_hash(admin_password),
            first_name="Admin",
            last_name="User",
            role=UserRole.SUPER_ADMIN,
            is_active=True,
            is_verified=True
        )
        db.add(user)
        db.commit()
        return {"message": "Admin user created", "email": admin_email, "password": admin_password}


@router.post("/login", response_model=LoginResponse)
async def login(
    request: LoginRequest,
    fastapi_request: Request,
    db: Session = Depends(get_db)
):
    """
    Login with email and password
    Returns access token, refresh token, and user info
    Logs login attempt with device and location info
    """
    # Find user
    user = db.query(User).filter(User.email == request.email).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Check if locked
    if user.locked_until and user.locked_until > datetime.utcnow():
        # Log failed attempt
        await log_login_attempt(db, user.id, fastapi_request, False, "Account locked")
        raise HTTPException(
            status_code=status.HTTP_423_LOCKED,
            detail="Account is temporarily locked. Please try again later."
        )
    
    # Verify password
    if not verify_password(request.password, user.hashed_password):
        # Increment failed attempts
        user.failed_login_attempts += 1
        if user.failed_login_attempts >= 5:
            user.locked_until = datetime.utcnow() + timedelta(minutes=30)
        db.commit()
        
        # Log failed attempt
        await log_login_attempt(db, user.id, fastapi_request, False, "Invalid password")
        
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Check if active
    if not user.is_active:
        # Log failed attempt
        await log_login_attempt(db, user.id, fastapi_request, False, "Account disabled")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is disabled"
        )
    
    # Reset failed attempts and update last login
    user.failed_login_attempts = 0
    user.locked_until = None
    user.last_login_at = datetime.utcnow()
    db.commit()
    
    # Log successful login
    await log_login_attempt(db, user.id, fastapi_request, True)
    
    # Create tokens
    token_data = {"sub": str(user.id), "email": user.email, "role": user.role.value}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)
    
    return LoginResponse(
        user=UserResponse.model_validate(user),
        tokens=TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        )
    )


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    request: UserRegister,
    db: Session = Depends(get_db)
):
    """
    Register a new user
    Optionally join an organization by code
    """
    # Check if email exists
    existing = db.query(User).filter(User.email == request.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered"
        )
    
    # Find organization by code if provided
    organization_id = None
    if request.organization_code:
        org = db.query(Organization).filter(
            Organization.code == request.organization_code,
            Organization.is_active == True
        ).first()
        if not org:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Organization not found or inactive"
            )
        organization_id = org.id
    
    # Create user
    user = User(
        email=request.email,
        hashed_password=get_password_hash(request.password),
        first_name=request.first_name,
        last_name=request.last_name,
        phone=request.phone,
        role=UserRole.VIEWER,  # Default role
        organization_id=organization_id,
        is_active=True,
        is_verified=False
    )
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return UserResponse.model_validate(user)


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    request: TokenRefreshRequest,
    db: Session = Depends(get_db)
):
    """
    Get new access token using refresh token
    """
    payload = decode_token(request.refresh_token)
    
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )
    
    # Create new tokens
    token_data = {"sub": str(user.id), "email": user.email, "role": user.role.value}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """
    Get current authenticated user info
    """
    return UserResponse.model_validate(current_user)


@router.patch("/profile", response_model=UserResponse)
async def update_profile(
    first_name: str = None,
    last_name: str = None,
    phone: str = None,
    department: str = None,
    position: str = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update current user's profile
    """
    # Update allowed fields
    if first_name is not None:
        current_user.first_name = first_name
    if last_name is not None:
        current_user.last_name = last_name
    if phone is not None:
        current_user.phone = phone
    if department is not None:
        current_user.department = department
    if position is not None:
        current_user.position = position
    
    db.commit()
    db.refresh(current_user)
    
    return UserResponse.model_validate(current_user)


@router.post("/logout")
async def logout(
    current_user: User = Depends(get_current_user)
):
    """
    Logout current user
    Note: Client should discard tokens
    """
    # In a production system, you might want to:
    # - Add token to a blacklist
    # - Clear refresh tokens from database
    return {"message": "Logged out successfully"}
