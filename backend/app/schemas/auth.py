"""
Authentication Schemas
Login, Token, and related schemas
"""
from typing import Optional
from pydantic import BaseModel, EmailStr
from app.schemas.user import UserResponse


class LoginRequest(BaseModel):
    """Login request schema"""
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """Token response after login"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds


class TokenRefreshRequest(BaseModel):
    """Refresh token request"""
    refresh_token: str


class LoginResponse(BaseModel):
    """Complete login response with user info"""
    user: UserResponse
    tokens: TokenResponse


class PasswordResetRequest(BaseModel):
    """Password reset request"""
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    """Confirm password reset with token"""
    token: str
    new_password: str


class VerifyEmailRequest(BaseModel):
    """Email verification"""
    token: str
