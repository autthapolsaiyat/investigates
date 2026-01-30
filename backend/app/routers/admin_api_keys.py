"""
Admin API Keys Router
Manage external API keys (Chainalysis, Etherscan, etc.)
Stores keys securely in database with encryption
"""
from datetime import datetime
from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text
from app.database import get_db, Base
from app.models.user import User
from app.routers.auth import get_current_user
import os
import hashlib
import base64
import httpx
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin/api-keys", tags=["admin-api-keys"])


# ==================== DATABASE MODEL ====================

class SystemApiKey(Base):
    """Store encrypted API keys in database"""
    __tablename__ = "system_api_keys"
    
    id = Column(Integer, primary_key=True, index=True)
    key_name = Column(String(100), unique=True, nullable=False)  # e.g., CHAINALYSIS_SANCTIONS_API_KEY
    key_value_encrypted = Column(Text, nullable=False)  # Encrypted value
    key_hash = Column(String(64), nullable=False)  # For quick validation without decryption
    provider = Column(String(50))  # e.g., chainalysis, etherscan
    is_active = Column(Boolean, default=True)
    last_tested = Column(DateTime, nullable=True)
    test_status = Column(String(20), default='unknown')  # active, invalid, unknown
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(Integer, nullable=True)


# ==================== SCHEMAS ====================

class ApiKeyCreate(BaseModel):
    key_name: str
    key_value: str


class ApiKeyResponse(BaseModel):
    key_name: str
    is_set: bool
    provider: Optional[str]
    last_tested: Optional[datetime]
    test_status: str
    created_at: Optional[datetime]


class ApiKeyTestResult(BaseModel):
    success: bool
    message: str
    provider: Optional[str]


# ==================== ENCRYPTION HELPERS ====================

def get_encryption_key() -> bytes:
    """Get or generate encryption key from environment"""
    key = os.getenv("API_KEY_ENCRYPTION_SECRET", "investigates-default-key-change-in-production")
    return hashlib.sha256(key.encode()).digest()


def encrypt_api_key(plain_text: str) -> str:
    """Simple XOR encryption (for demo - use proper encryption in production)"""
    key = get_encryption_key()
    encrypted = bytes([plain_text.encode()[i % len(plain_text.encode())] ^ key[i % len(key)] 
                       for i in range(len(plain_text.encode()))])
    return base64.b64encode(encrypted).decode()


def decrypt_api_key(encrypted_text: str) -> str:
    """Decrypt API key"""
    key = get_encryption_key()
    encrypted = base64.b64decode(encrypted_text.encode())
    decrypted = bytes([encrypted[i] ^ key[i % len(key)] for i in range(len(encrypted))])
    return decrypted.decode()


def hash_api_key(api_key: str) -> str:
    """Create hash for quick comparison"""
    return hashlib.sha256(api_key.encode()).hexdigest()[:16]


# ==================== API KEY TESTERS ====================

async def test_chainalysis_sanctions(api_key: str) -> tuple[bool, str]:
    """Test Chainalysis Sanctions API"""
    try:
        # Test with a known sanctioned address (Tornado Cash)
        test_address = "0x8589427373D6D84E98730D7795D8f6f8731FDA16"
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"https://public.chainalysis.com/api/v1/address/{test_address}",
                headers={
                    "X-API-Key": api_key,
                    "Accept": "application/json"
                }
            )
            
            if response.status_code == 200:
                return True, "API key is valid and working"
            elif response.status_code == 401:
                return False, "Invalid API key"
            elif response.status_code == 403:
                return False, "API key forbidden - check permissions"
            else:
                return False, f"Unexpected response: {response.status_code}"
                
    except Exception as e:
        logger.error(f"Chainalysis test error: {e}")
        return False, f"Connection error: {str(e)}"


async def test_etherscan(api_key: str) -> tuple[bool, str]:
    """Test Etherscan API"""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"https://api.etherscan.io/api?module=account&action=balance&address=0x0000000000000000000000000000000000000000&tag=latest&apikey={api_key}"
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "1" or data.get("message") == "OK":
                    return True, "API key is valid"
                elif "Invalid API Key" in str(data):
                    return False, "Invalid API key"
                else:
                    return True, "API key appears valid"
            else:
                return False, f"HTTP error: {response.status_code}"
                
    except Exception as e:
        return False, f"Connection error: {str(e)}"


async def test_blockchair(api_key: str) -> tuple[bool, str]:
    """Test Blockchair API"""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"https://api.blockchair.com/bitcoin/stats?key={api_key}"
            )
            
            if response.status_code == 200:
                return True, "API key is valid"
            elif response.status_code == 402:
                return False, "API key invalid or quota exceeded"
            else:
                return False, f"HTTP error: {response.status_code}"
                
    except Exception as e:
        return False, f"Connection error: {str(e)}"


API_TESTERS = {
    "CHAINALYSIS_SANCTIONS_API_KEY": test_chainalysis_sanctions,
    "CHAINALYSIS_KYT_API_KEY": test_chainalysis_sanctions,  # Same endpoint for basic test
    "ETHERSCAN_API_KEY": test_etherscan,
    "BLOCKCHAIR_API_KEY": test_blockchair,
}


# ==================== ENDPOINTS ====================

@router.get("/status")
async def get_api_keys_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Get status of all configured API keys"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Get all keys from database
    db_keys = db.query(SystemApiKey).filter(SystemApiKey.is_active == True).all()
    
    result = {}
    for key in db_keys:
        result[key.key_name] = {
            "isSet": True,
            "status": key.test_status,
            "lastTested": key.last_tested.isoformat() if key.last_tested else None,
            "provider": key.provider
        }
    
    # Also check environment variables as fallback
    env_keys = [
        "CHAINALYSIS_SANCTIONS_API_KEY",
        "CHAINALYSIS_KYT_API_KEY", 
        "ETHERSCAN_API_KEY",
        "BLOCKCHAIR_API_KEY"
    ]
    
    for key_name in env_keys:
        if key_name not in result:
            env_value = os.getenv(key_name)
            if env_value:
                result[key_name] = {
                    "isSet": True,
                    "status": "unknown",
                    "lastTested": None,
                    "provider": key_name.split("_")[0].lower()
                }
    
    return result


@router.post("")
async def save_api_key(
    data: ApiKeyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, str]:
    """Save a new API key (encrypted)"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Check if key already exists
    existing = db.query(SystemApiKey).filter(
        SystemApiKey.key_name == data.key_name
    ).first()
    
    if existing:
        # Update existing
        existing.key_value_encrypted = encrypt_api_key(data.key_value)
        existing.key_hash = hash_api_key(data.key_value)
        existing.updated_at = datetime.utcnow()
        existing.test_status = "unknown"
        existing.is_active = True
    else:
        # Create new
        provider = data.key_name.split("_")[0].lower()
        new_key = SystemApiKey(
            key_name=data.key_name,
            key_value_encrypted=encrypt_api_key(data.key_value),
            key_hash=hash_api_key(data.key_value),
            provider=provider,
            created_by=current_user.id
        )
        db.add(new_key)
    
    db.commit()
    
    # Also set as environment variable for immediate use
    os.environ[data.key_name] = data.key_value
    
    return {"message": f"API key {data.key_name} saved successfully"}


@router.post("/test/{key_name}")
async def test_api_key(
    key_name: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> ApiKeyTestResult:
    """Test if an API key is working"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Get key value (from DB or env)
    db_key = db.query(SystemApiKey).filter(
        SystemApiKey.key_name == key_name,
        SystemApiKey.is_active == True
    ).first()
    
    if db_key:
        api_key = decrypt_api_key(db_key.key_value_encrypted)
    else:
        api_key = os.getenv(key_name)
    
    if not api_key:
        return ApiKeyTestResult(
            success=False,
            message="API key not configured",
            provider=None
        )
    
    # Get tester function
    tester = API_TESTERS.get(key_name)
    if not tester:
        return ApiKeyTestResult(
            success=False,
            message=f"No test available for {key_name}",
            provider=key_name.split("_")[0].lower()
        )
    
    # Run test
    success, message = await tester(api_key)
    
    # Update status in DB
    if db_key:
        db_key.last_tested = datetime.utcnow()
        db_key.test_status = "active" if success else "invalid"
        db.commit()
    
    return ApiKeyTestResult(
        success=success,
        message=message,
        provider=key_name.split("_")[0].lower()
    )


@router.delete("/{key_name}")
async def delete_api_key(
    key_name: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, str]:
    """Delete/deactivate an API key"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    db_key = db.query(SystemApiKey).filter(
        SystemApiKey.key_name == key_name
    ).first()
    
    if db_key:
        db_key.is_active = False
        db_key.updated_at = datetime.utcnow()
        db.commit()
    
    # Remove from environment
    if key_name in os.environ:
        del os.environ[key_name]
    
    return {"message": f"API key {key_name} deleted"}


@router.get("/decrypt/{key_name}")
async def get_decrypted_key(
    key_name: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, str]:
    """Get decrypted API key value (internal use only)"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # First check database
    db_key = db.query(SystemApiKey).filter(
        SystemApiKey.key_name == key_name,
        SystemApiKey.is_active == True
    ).first()
    
    if db_key:
        return {"value": decrypt_api_key(db_key.key_value_encrypted)}
    
    # Fallback to environment
    env_value = os.getenv(key_name)
    if env_value:
        return {"value": env_value}
    
    raise HTTPException(status_code=404, detail="API key not found")
