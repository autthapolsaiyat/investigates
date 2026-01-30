"""
Crypto Transactions Router
API for Crypto Tracker data
"""
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.crypto import CryptoTransaction, CryptoWallet, BlockchainType, RiskFlag
from app.models.case import Case
from app.models.user import User
from app.routers.auth import get_current_user
import json
import httpx
import asyncio
import time
import logging

logger = logging.getLogger(__name__)

# ==================== BLOCKCHAIN API CACHE ====================
# Simple in-memory cache with TTL
_wallet_cache: Dict[str, Dict[str, Any]] = {}
_cache_ttl = 300  # 5 minutes
_last_api_call = 0
_rate_limit_delay = 0.5  # 500ms between API calls

router = APIRouter(prefix="/crypto", tags=["crypto"])


# ==================== SCHEMAS ====================

class CryptoTransactionCreate(BaseModel):
    blockchain: Optional[str] = "other"
    tx_hash: Optional[str] = None
    block_number: Optional[int] = None
    from_address: str
    from_label: Optional[str] = None
    to_address: str
    to_label: Optional[str] = None
    amount: Optional[float] = None
    amount_usd: Optional[float] = None
    fee: Optional[float] = None
    timestamp: Optional[datetime] = None
    confirmations: Optional[int] = None
    risk_flag: Optional[str] = "none"
    risk_score: Optional[int] = 0
    is_incoming: Optional[bool] = True
    is_contract_interaction: Optional[bool] = False
    method_name: Optional[str] = None
    notes: Optional[str] = None
    raw_data: Optional[str] = None


class CryptoTransactionResponse(BaseModel):
    id: int
    case_id: int
    blockchain: str
    tx_hash: Optional[str]
    from_address: str
    from_label: Optional[str]
    to_address: str
    to_label: Optional[str]
    amount: Optional[float]
    amount_usd: Optional[float]
    timestamp: Optional[datetime]
    risk_flag: str
    risk_score: int
    created_at: datetime

    class Config:
        from_attributes = True


class CryptoWalletCreate(BaseModel):
    address: str
    blockchain: Optional[str] = "other"
    label: Optional[str] = None
    owner_name: Optional[str] = None
    owner_type: Optional[str] = None
    total_received: Optional[float] = 0
    total_sent: Optional[float] = 0
    total_received_usd: Optional[float] = 0
    total_sent_usd: Optional[float] = 0
    transaction_count: Optional[int] = 0
    risk_score: Optional[int] = 0
    risk_flags: Optional[str] = None
    is_suspect: Optional[bool] = False
    is_exchange: Optional[bool] = False
    is_mixer: Optional[bool] = False
    first_tx_date: Optional[datetime] = None
    last_tx_date: Optional[datetime] = None


class CryptoWalletResponse(BaseModel):
    id: int
    case_id: int
    address: str
    blockchain: str
    label: Optional[str]
    owner_name: Optional[str]
    owner_type: Optional[str]
    total_received: float
    total_sent: float
    total_received_usd: float
    total_sent_usd: float
    transaction_count: int
    risk_score: int
    is_suspect: bool
    is_exchange: bool
    is_mixer: bool
    first_tx_date: Optional[datetime]
    last_tx_date: Optional[datetime]

    class Config:
        from_attributes = True


class BulkImportTransactionsRequest(BaseModel):
    transactions: List[CryptoTransactionCreate]
    evidence_id: Optional[int] = None


class BulkImportWalletsRequest(BaseModel):
    wallets: List[CryptoWalletCreate]


class CryptoDataResponse(BaseModel):
    """Full crypto data for visualization"""
    transactions: List[dict]
    wallets: List[dict]
    summary: dict


# ==================== CRYPTO TRANSACTIONS ENDPOINTS ====================

@router.post("/case/{case_id}/transactions", response_model=CryptoTransactionResponse)
async def create_crypto_transaction(
    case_id: int,
    transaction: CryptoTransactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a single crypto transaction"""
    case = db.query(Case).filter(Case.id == case_id, Case.is_active == True).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    # Map blockchain string to enum
    blockchain_map = {
        "btc": BlockchainType.BTC,
        "bitcoin": BlockchainType.BTC,
        "eth": BlockchainType.ETH,
        "ethereum": BlockchainType.ETH,
        "usdt_trc20": BlockchainType.USDT_TRC20,
        "usdt-trc20": BlockchainType.USDT_TRC20,
        "usdt_erc20": BlockchainType.USDT_ERC20,
        "usdt-erc20": BlockchainType.USDT_ERC20,
        "bnb": BlockchainType.BNB,
        "bsc": BlockchainType.BNB,
        "matic": BlockchainType.MATIC,
        "polygon": BlockchainType.MATIC,
        "trx": BlockchainType.TRX,
        "tron": BlockchainType.TRX,
    }
    blockchain_enum = blockchain_map.get((transaction.blockchain or "").lower(), BlockchainType.OTHER)
    
    # Map risk flag
    risk_flag_map = {
        "none": RiskFlag.NONE,
        "mixer_detected": RiskFlag.MIXER_DETECTED,
        "tornado_cash": RiskFlag.TORNADO_CASH,
        "high_value": RiskFlag.HIGH_VALUE,
        "exchange": RiskFlag.EXCHANGE,
        "from_mixer": RiskFlag.FROM_MIXER,
        "sanctioned": RiskFlag.SANCTIONED,
        "gambling": RiskFlag.GAMBLING,
        "darknet": RiskFlag.DARKNET,
    }
    risk_flag_enum = risk_flag_map.get((transaction.risk_flag or "").lower(), RiskFlag.UNKNOWN)
    
    db_tx = CryptoTransaction(
        case_id=case_id,
        blockchain=blockchain_enum,
        tx_hash=transaction.tx_hash,
        block_number=transaction.block_number,
        from_address=transaction.from_address,
        from_label=transaction.from_label,
        to_address=transaction.to_address,
        to_label=transaction.to_label,
        amount=transaction.amount,
        amount_usd=transaction.amount_usd,
        fee=transaction.fee,
        timestamp=transaction.timestamp,
        confirmations=transaction.confirmations,
        risk_flag=risk_flag_enum,
        risk_score=transaction.risk_score or 0,
        is_incoming=transaction.is_incoming,
        is_contract_interaction=transaction.is_contract_interaction or False,
        method_name=transaction.method_name,
        notes=transaction.notes,
        raw_data=transaction.raw_data
    )
    
    db.add(db_tx)
    db.commit()
    db.refresh(db_tx)
    
    return db_tx


@router.post("/case/{case_id}/transactions/bulk")
async def bulk_import_crypto_transactions(
    case_id: int,
    request: BulkImportTransactionsRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Bulk import crypto transactions"""
    case = db.query(Case).filter(Case.id == case_id, Case.is_active == True).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    blockchain_map = {
        "btc": BlockchainType.BTC,
        "bitcoin": BlockchainType.BTC,
        "eth": BlockchainType.ETH,
        "ethereum": BlockchainType.ETH,
        "usdt_trc20": BlockchainType.USDT_TRC20,
        "usdt-trc20": BlockchainType.USDT_TRC20,
        "usdt_erc20": BlockchainType.USDT_ERC20,
        "usdt-erc20": BlockchainType.USDT_ERC20,
        "bnb": BlockchainType.BNB,
        "bsc": BlockchainType.BNB,
        "matic": BlockchainType.MATIC,
        "polygon": BlockchainType.MATIC,
        "trx": BlockchainType.TRX,
        "tron": BlockchainType.TRX,
    }
    
    risk_flag_map = {
        "none": RiskFlag.NONE,
        "mixer_detected": RiskFlag.MIXER_DETECTED,
        "tornado_cash": RiskFlag.TORNADO_CASH,
        "high_value": RiskFlag.HIGH_VALUE,
        "exchange": RiskFlag.EXCHANGE,
        "from_mixer": RiskFlag.FROM_MIXER,
        "sanctioned": RiskFlag.SANCTIONED,
        "gambling": RiskFlag.GAMBLING,
        "darknet": RiskFlag.DARKNET,
    }
    
    created_count = 0
    for tx in request.transactions:
        blockchain_enum = blockchain_map.get((tx.blockchain or "").lower(), BlockchainType.OTHER)
        risk_flag_enum = risk_flag_map.get((tx.risk_flag or "").lower(), RiskFlag.UNKNOWN)
        
        db_tx = CryptoTransaction(
            case_id=case_id,
            evidence_id=request.evidence_id,
            blockchain=blockchain_enum,
            tx_hash=tx.tx_hash,
            block_number=tx.block_number,
            from_address=tx.from_address,
            from_label=tx.from_label,
            to_address=tx.to_address,
            to_label=tx.to_label,
            amount=tx.amount,
            amount_usd=tx.amount_usd,
            fee=tx.fee,
            timestamp=tx.timestamp,
            confirmations=tx.confirmations,
            risk_flag=risk_flag_enum,
            risk_score=tx.risk_score or 0,
            is_incoming=tx.is_incoming,
            is_contract_interaction=tx.is_contract_interaction or False,
            method_name=tx.method_name,
            notes=tx.notes,
            raw_data=tx.raw_data
        )
        db.add(db_tx)
        created_count += 1
    
    db.commit()
    
    return {"message": f"Imported {created_count} crypto transactions", "count": created_count}


@router.get("/case/{case_id}/transactions", response_model=List[CryptoTransactionResponse])
async def list_crypto_transactions(
    case_id: int,
    blockchain: Optional[str] = None,
    skip: int = 0,
    limit: int = 1000,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all crypto transactions for a case"""
    query = db.query(CryptoTransaction).filter(CryptoTransaction.case_id == case_id)
    
    if blockchain:
        query = query.filter(CryptoTransaction.blockchain == blockchain)
    
    transactions = query.order_by(CryptoTransaction.timestamp.desc()).offset(skip).limit(limit).all()
    
    return transactions


@router.delete("/case/{case_id}/transactions")
async def delete_all_crypto_transactions(
    case_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete all crypto transactions for a case"""
    deleted = db.query(CryptoTransaction).filter(CryptoTransaction.case_id == case_id).delete()
    db.commit()
    return {"message": f"Deleted {deleted} crypto transactions"}


# ==================== CRYPTO WALLETS ENDPOINTS ====================

@router.post("/case/{case_id}/wallets", response_model=CryptoWalletResponse)
async def create_crypto_wallet(
    case_id: int,
    wallet: CryptoWalletCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a crypto wallet"""
    blockchain_map = {
        "btc": BlockchainType.BTC,
        "bitcoin": BlockchainType.BTC,
        "eth": BlockchainType.ETH,
        "ethereum": BlockchainType.ETH,
        "usdt_trc20": BlockchainType.USDT_TRC20,
        "usdt-trc20": BlockchainType.USDT_TRC20,
        "usdt_erc20": BlockchainType.USDT_ERC20,
        "usdt-erc20": BlockchainType.USDT_ERC20,
        "bnb": BlockchainType.BNB,
        "bsc": BlockchainType.BNB,
        "matic": BlockchainType.MATIC,
        "polygon": BlockchainType.MATIC,
        "trx": BlockchainType.TRX,
        "tron": BlockchainType.TRX,
    }
    blockchain_enum = blockchain_map.get((wallet.blockchain or "").lower(), BlockchainType.OTHER)
    
    db_wallet = CryptoWallet(
        case_id=case_id,
        address=wallet.address,
        blockchain=blockchain_enum,
        label=wallet.label,
        owner_name=wallet.owner_name,
        owner_type=wallet.owner_type,
        total_received=wallet.total_received or 0,
        total_sent=wallet.total_sent or 0,
        total_received_usd=wallet.total_received_usd or 0,
        total_sent_usd=wallet.total_sent_usd or 0,
        transaction_count=wallet.transaction_count or 0,
        risk_score=wallet.risk_score or 0,
        risk_flags=wallet.risk_flags,
        is_suspect=wallet.is_suspect or False,
        is_exchange=wallet.is_exchange or False,
        is_mixer=wallet.is_mixer or False,
        first_tx_date=wallet.first_tx_date,
        last_tx_date=wallet.last_tx_date
    )
    
    db.add(db_wallet)
    db.commit()
    db.refresh(db_wallet)
    
    return db_wallet


@router.post("/case/{case_id}/wallets/bulk")
async def bulk_import_crypto_wallets(
    case_id: int,
    request: BulkImportWalletsRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Bulk import crypto wallets"""
    blockchain_map = {
        "btc": BlockchainType.BTC,
        "bitcoin": BlockchainType.BTC,
        "eth": BlockchainType.ETH,
        "ethereum": BlockchainType.ETH,
        "usdt_trc20": BlockchainType.USDT_TRC20,
        "usdt-trc20": BlockchainType.USDT_TRC20,
        "usdt_erc20": BlockchainType.USDT_ERC20,
        "usdt-erc20": BlockchainType.USDT_ERC20,
        "bnb": BlockchainType.BNB,
        "bsc": BlockchainType.BNB,
        "matic": BlockchainType.MATIC,
        "polygon": BlockchainType.MATIC,
        "trx": BlockchainType.TRX,
        "tron": BlockchainType.TRX,
    }
    
    created_count = 0
    for wallet in request.wallets:
        blockchain_enum = blockchain_map.get((wallet.blockchain or "").lower(), BlockchainType.OTHER)
        
        db_wallet = CryptoWallet(
            case_id=case_id,
            address=wallet.address,
            blockchain=blockchain_enum,
            label=wallet.label,
            owner_name=wallet.owner_name,
            owner_type=wallet.owner_type,
            total_received=wallet.total_received or 0,
            total_sent=wallet.total_sent or 0,
            total_received_usd=wallet.total_received_usd or 0,
            total_sent_usd=wallet.total_sent_usd or 0,
            transaction_count=wallet.transaction_count or 0,
            risk_score=wallet.risk_score or 0,
            risk_flags=wallet.risk_flags,
            is_suspect=wallet.is_suspect or False,
            is_exchange=wallet.is_exchange or False,
            is_mixer=wallet.is_mixer or False,
            first_tx_date=wallet.first_tx_date,
            last_tx_date=wallet.last_tx_date
        )
        db.add(db_wallet)
        created_count += 1
    
    db.commit()
    
    return {"message": f"Created {created_count} wallets", "count": created_count}


@router.get("/case/{case_id}/wallets", response_model=List[CryptoWalletResponse])
async def list_crypto_wallets(
    case_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all crypto wallets for a case"""
    wallets = db.query(CryptoWallet).filter(
        CryptoWallet.case_id == case_id
    ).all()
    
    return wallets


@router.delete("/case/{case_id}/wallets")
async def delete_all_crypto_wallets(
    case_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete all crypto wallets for a case"""
    deleted = db.query(CryptoWallet).filter(CryptoWallet.case_id == case_id).delete()
    db.commit()
    return {"message": f"Deleted {deleted} crypto wallets"}


@router.delete("/case/{case_id}/wallets/{wallet_id}")
async def delete_crypto_wallet(
    case_id: int,
    wallet_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a single crypto wallet"""
    wallet = db.query(CryptoWallet).filter(
        CryptoWallet.id == wallet_id,
        CryptoWallet.case_id == case_id
    ).first()
    
    if not wallet:
        raise HTTPException(status_code=404, detail="Wallet not found")
    
    db.delete(wallet)
    db.commit()
    return {"message": "Wallet deleted successfully"}


# ==================== CRYPTO DATA ENDPOINT ====================

@router.get("/case/{case_id}/data", response_model=CryptoDataResponse)
async def get_crypto_data(
    case_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get complete crypto data for visualization"""
    
    # Get transactions
    transactions = db.query(CryptoTransaction).filter(
        CryptoTransaction.case_id == case_id
    ).order_by(CryptoTransaction.timestamp.desc()).all()
    
    # Get wallets
    wallets = db.query(CryptoWallet).filter(
        CryptoWallet.case_id == case_id
    ).all()
    
    # Build transaction list
    tx_list = []
    for tx in transactions:
        tx_list.append({
            "id": tx.id,
            "blockchain": tx.blockchain.value if tx.blockchain else "other",
            "txHash": tx.tx_hash,
            "from": tx.from_address,
            "fromLabel": tx.from_label,
            "to": tx.to_address,
            "toLabel": tx.to_label,
            "amount": tx.amount,
            "amountUSD": tx.amount_usd,
            "timestamp": tx.timestamp.isoformat() if tx.timestamp else None,
            "riskFlag": tx.risk_flag.value if tx.risk_flag else "unknown",
            "riskScore": tx.risk_score
        })
    
    # Build wallet list
    wallet_list = []
    for w in wallets:
        wallet_list.append({
            "id": w.id,
            "address": w.address,
            "blockchain": w.blockchain.value if w.blockchain else "other",
            "label": w.label,
            "ownerName": w.owner_name,
            "ownerType": w.owner_type,
            "totalReceived": w.total_received,
            "totalSent": w.total_sent,
            "totalReceivedUSD": w.total_received_usd,
            "totalSentUSD": w.total_sent_usd,
            "txCount": w.transaction_count,
            "riskScore": w.risk_score,
            "isSuspect": w.is_suspect,
            "isExchange": w.is_exchange,
            "isMixer": w.is_mixer
        })
    
    # Summary
    total_usd = sum(tx.amount_usd or 0 for tx in transactions)
    high_risk = sum(1 for tx in transactions if tx.risk_score >= 70)
    
    summary = {
        "totalTransactions": len(transactions),
        "totalWallets": len(wallets),
        "totalValueUSD": total_usd,
        "highRiskTransactions": high_risk,
        "blockchains": list(set(tx.blockchain.value for tx in transactions if tx.blockchain))
    }
    
    return CryptoDataResponse(
        transactions=tx_list,
        wallets=wallet_list,
        summary=summary
    )


# ==================== STATISTICS ENDPOINT ====================

@router.get("/case/{case_id}/stats")
async def get_crypto_stats(
    case_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get crypto statistics for a case"""
    
    total_transactions = db.query(func.count(CryptoTransaction.id)).filter(
        CryptoTransaction.case_id == case_id
    ).scalar() or 0
    
    total_wallets = db.query(func.count(CryptoWallet.id)).filter(
        CryptoWallet.case_id == case_id
    ).scalar() or 0
    
    total_value_usd = db.query(func.sum(CryptoTransaction.amount_usd)).filter(
        CryptoTransaction.case_id == case_id
    ).scalar() or 0
    
    # Count by blockchain
    blockchain_counts = db.query(
        CryptoTransaction.blockchain,
        func.count(CryptoTransaction.id)
    ).filter(
        CryptoTransaction.case_id == case_id
    ).group_by(CryptoTransaction.blockchain).all()
    
    blockchains = {str(b[0].value) if b[0] else "unknown": b[1] for b in blockchain_counts}
    
    # Count high risk
    high_risk = db.query(func.count(CryptoTransaction.id)).filter(
        CryptoTransaction.case_id == case_id,
        CryptoTransaction.risk_score >= 70
    ).scalar() or 0
    
    return {
        "total_transactions": total_transactions,
        "total_wallets": total_wallets,
        "total_value_usd": total_value_usd,
        "high_risk_count": high_risk,
        "blockchains": blockchains
    }


# ==================== BLOCKCHAIN LOOKUP API ====================
# Proxy for Blockchair, Tronscan, etc. to avoid CORS and rate limits

# Known entities database
KNOWN_ENTITIES = {
    # Tornado Cash (OFAC Sanctioned) - CRITICAL RISK
    "0x8589427373d6d84e98730d7795d8f6f8731fda16": {"name": "Tornado Cash", "type": "mixer", "risk": "critical"},
    "0x722122df12d4e14e13ac3b6895a86e84145b6967": {"name": "Tornado Cash Router", "type": "mixer", "risk": "critical"},
    "0xd90e2f925da726b50c4ed8d0fb90ad053324f31b": {"name": "Tornado Cash 0.1 ETH", "type": "mixer", "risk": "critical"},
    "0x910cbd523d972eb0a6f4cae4618ad62622b39dbf": {"name": "Tornado Cash 10 ETH", "type": "mixer", "risk": "critical"},
    "0xa160cdab225685da1d56aa342ad8841c3b53f291": {"name": "Tornado Cash 100 ETH", "type": "mixer", "risk": "critical"},
    "0x098b716b8aaf21512996dc57eb0615e2383e2f96": {"name": "Ronin Exploiter (Lazarus)", "type": "scam", "risk": "critical"},
    # Exchanges
    "0x28c6c06298d514db089934071355e5743bf21d60": {"name": "Binance Hot Wallet", "type": "exchange", "risk": "low"},
    "0xdfd5293d8e347dfe59e90efd55b2956a1343963d": {"name": "Binance", "type": "exchange", "risk": "low"},
    "0x56eddb7aa87536c09ccc2793473599fd21a8b17f": {"name": "Huobi", "type": "exchange", "risk": "low"},
    "0x6cc5f688a315f3dc28a7781717a9a798a59fda7b": {"name": "OKX", "type": "exchange", "risk": "low"},
    "0x503828976d22510aad0201ac7ec88293211d23da": {"name": "Coinbase", "type": "exchange", "risk": "low"},
    # DeFi
    "0x7a250d5630b4cf539739df2c5dacb4c659f2488d": {"name": "Uniswap V2 Router", "type": "defi", "risk": "low"},
    "0xe592427a0aece92de3edee1f18e0157c05861564": {"name": "Uniswap V3 Router", "type": "defi", "risk": "low"},
}

# Crypto prices cache
_price_cache: Dict[str, Dict[str, Any]] = {}

# Chainalysis sanctions cache
_sanctions_cache: Dict[str, Dict[str, Any]] = {}


async def check_chainalysis_sanctions(address: str) -> Optional[Dict]:
    """
    Check if address is on OFAC sanctions list using Chainalysis API.
    Returns sanctions info if sanctioned, None otherwise.
    """
    import os
    api_key = os.getenv("CHAINALYSIS_SANCTIONS_API_KEY")
    
    if not api_key:
        logger.debug("Chainalysis API key not configured")
        return None
    
    # Check cache first (1 hour TTL for sanctions)
    cache_key = address.lower()
    if cache_key in _sanctions_cache:
        cached = _sanctions_cache[cache_key]
        if time.time() - cached["timestamp"] < 3600:  # 1 hour cache
            logger.info(f"Sanctions cache hit for {address[:16]}...")
            return cached["data"]
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            url = f"https://public.chainalysis.com/api/v1/address/{address}"
            resp = await client.get(
                url,
                headers={
                    "X-API-Key": api_key,
                    "Accept": "application/json"
                }
            )
            
            if resp.status_code == 200:
                data = resp.json()
                identifications = data.get("identifications", [])
                
                result = None
                if identifications:
                    # Address is sanctioned!
                    result = {
                        "isSanctioned": True,
                        "identifications": identifications,
                        "category": identifications[0].get("category", "Unknown"),
                        "name": identifications[0].get("name", "Sanctioned Entity"),
                        "description": identifications[0].get("description", ""),
                        "url": identifications[0].get("url", "")
                    }
                    logger.warning(f"SANCTIONED ADDRESS DETECTED: {address}")
                else:
                    result = {"isSanctioned": False}
                
                # Cache result
                _sanctions_cache[cache_key] = {"data": result, "timestamp": time.time()}
                return result
                
            elif resp.status_code == 404:
                # Not found = not sanctioned
                result = {"isSanctioned": False}
                _sanctions_cache[cache_key] = {"data": result, "timestamp": time.time()}
                return result
            else:
                logger.warning(f"Chainalysis API returned {resp.status_code}")
                return None
                
    except Exception as e:
        logger.error(f"Chainalysis sanctions check error: {e}")
        return None


async def get_crypto_price(symbol: str) -> float:
    """Get crypto price from CoinGecko with caching"""
    global _price_cache
    
    cache_key = symbol.lower()
    if cache_key in _price_cache:
        cached = _price_cache[cache_key]
        if time.time() - cached["timestamp"] < 300:  # 5 min cache
            return cached["price"]
    
    coin_ids = {
        "eth": "ethereum", "btc": "bitcoin", "bnb": "binancecoin",
        "matic": "matic-network", "trx": "tron", "usdt": "tether"
    }
    coin_id = coin_ids.get(cache_key, cache_key)
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                f"https://api.coingecko.com/api/v3/simple/price?ids={coin_id}&vs_currencies=usd"
            )
            if resp.status_code == 200:
                data = resp.json()
                price = data.get(coin_id, {}).get("usd", 0)
                _price_cache[cache_key] = {"price": price, "timestamp": time.time()}
                return price
    except Exception as e:
        logger.warning(f"Price fetch failed for {symbol}: {e}")
    
    # Fallback prices
    fallback = {"eth": 3100, "btc": 95000, "bnb": 600, "matic": 0.5, "trx": 0.12, "usdt": 1}
    return fallback.get(cache_key, 0)


async def _rate_limit():
    """Ensure minimum delay between API calls"""
    global _last_api_call
    now = time.time()
    elapsed = now - _last_api_call
    if elapsed < _rate_limit_delay:
        await asyncio.sleep(_rate_limit_delay - elapsed)
    _last_api_call = time.time()


def _get_cache_key(blockchain: str, address: str) -> str:
    return f"{blockchain}:{address.lower()}"


def _get_cached_wallet(blockchain: str, address: str) -> Optional[Dict]:
    key = _get_cache_key(blockchain, address)
    if key in _wallet_cache:
        cached = _wallet_cache[key]
        if time.time() - cached["timestamp"] < _cache_ttl:
            logger.info(f"Cache hit for {address[:16]}...")
            return cached["data"]
    return None


def _set_cached_wallet(blockchain: str, address: str, data: Dict):
    key = _get_cache_key(blockchain, address)
    _wallet_cache[key] = {"data": data, "timestamp": time.time()}


async def fetch_blockchair_wallet(blockchain: str, address: str) -> Optional[Dict]:
    """Fetch wallet from Blockchair API"""
    await _rate_limit()
    
    chain_map = {"bitcoin": "bitcoin", "ethereum": "ethereum", "bsc": "bnb", "polygon": "polygon"}
    chain = chain_map.get(blockchain)
    if not chain:
        return None
    
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            url = f"https://api.blockchair.com/{chain}/dashboards/address/{address}?limit=100"
            logger.info(f"Fetching Blockchair: {url[:80]}...")
            
            resp = await client.get(url)
            
            if resp.status_code != 200:
                logger.warning(f"Blockchair returned {resp.status_code}")
                return None
            
            data = resp.json()
            
            if not data.get("data") or address.lower() not in [k.lower() for k in data["data"].keys()]:
                return None
            
            # Get address data (handle case sensitivity)
            addr_key = next((k for k in data["data"].keys() if k.lower() == address.lower()), None)
            if not addr_key:
                return None
                
            addr_data = data["data"][addr_key]
            address_info = addr_data.get("address", {})
            
            # Calculate balance based on blockchain
            if blockchain == "bitcoin":
                balance = address_info.get("balance", 0) / 1e8  # satoshi to BTC
                received = address_info.get("received", 0) / 1e8
                sent = address_info.get("spent", 0) / 1e8
            else:
                balance = address_info.get("balance", 0) / 1e18  # wei to ETH
                received = address_info.get("received", 0) / 1e18
                sent = address_info.get("spent", 0) / 1e18
            
            return {
                "balance": balance,
                "totalReceived": received,
                "totalSent": sent,
                "txCount": address_info.get("transaction_count", 0),
                "firstSeen": address_info.get("first_seen_receiving"),
                "lastSeen": address_info.get("last_seen_receiving"),
            }
            
    except Exception as e:
        logger.error(f"Blockchair fetch error: {e}")
        return None


async def fetch_tron_wallet(address: str) -> Optional[Dict]:
    """Fetch wallet from Tronscan API"""
    await _rate_limit()
    
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            url = f"https://apilist.tronscanapi.com/api/account?address={address}"
            logger.info(f"Fetching Tronscan: {url[:60]}...")
            
            resp = await client.get(url)
            
            if resp.status_code != 200:
                logger.warning(f"Tronscan returned {resp.status_code}")
                return None
            
            data = resp.json()
            
            trx_balance = (data.get("balance", 0)) / 1e6
            
            # Get USDT-TRC20 balance
            usdt_balance = 0
            trc20_balances = data.get("trc20token_balances", [])
            for token in trc20_balances:
                if token.get("tokenName") == "Tether USD":
                    usdt_balance = float(token.get("balance", 0)) / 1e6
                    break
            
            return {
                "balance": trx_balance,
                "usdtBalance": usdt_balance,
                "txCount": data.get("transactions", 0),
                "totalReceived": 0,
                "totalSent": 0,
            }
            
    except Exception as e:
        logger.error(f"Tronscan fetch error: {e}")
        return None


def calculate_risk_score(wallet_data: Dict, address: str, blockchain: str, sanctions_result: Optional[Dict] = None) -> tuple:
    """Calculate risk score based on wallet data, known entities, and sanctions"""
    score = 0
    factors = []
    
    # OFAC Sanctions - Highest priority (automatic 100 score)
    if sanctions_result and sanctions_result.get("isSanctioned"):
        score = 100
        factors.append({
            "type": "ofac_sanctioned", 
            "severity": "critical", 
            "description": f"OFAC Sanctioned: {sanctions_result.get('name', 'Unknown Entity')}", 
            "score": 100
        })
        return score, factors  # No need to check more - maximum risk
    
    # Check known entities
    known = KNOWN_ENTITIES.get(address.lower())
    if known:
        if known["risk"] == "critical":
            # Mixers and sanctioned entities - very high risk
            score += 90
            factors.append({"type": "mixer_sanctioned", "severity": "critical", "description": f"Known Mixer/Sanctioned: {known['name']}", "score": 90})
        elif known["risk"] == "high":
            score += 60
            factors.append({"type": "mixer", "severity": "high", "description": f"Known High Risk: {known['name']}", "score": 60})
        elif known["risk"] == "medium":
            score += 30
            factors.append({"type": "risky_service", "severity": "medium", "description": f"Known: {known['name']}", "score": 30})
    
    # High value
    total_value = wallet_data.get("totalReceived", 0) + wallet_data.get("totalSent", 0)
    if total_value > 100000:
        score += 15
        factors.append({"type": "high_value", "severity": "medium", "description": "High transaction volume (>$100K)", "score": 15})
    
    # High transaction count
    if wallet_data.get("txCount", 0) > 500:
        score += 10
        factors.append({"type": "high_activity", "severity": "low", "description": "High transaction count (>500)", "score": 10})
    
    return min(score, 100), factors


class WalletLookupResponse(BaseModel):
    address: str
    blockchain: str
    balance: float
    balanceUSD: float
    totalReceived: float
    totalSent: float
    txCount: int
    firstTxDate: Optional[str] = None
    lastTxDate: Optional[str] = None
    isContract: bool = False
    isSanctioned: bool = False
    sanctionsData: Optional[Dict[str, Any]] = None
    labels: List[str] = []
    riskScore: int = 0
    riskFactors: List[Dict[str, Any]] = []
    source: str = "api"  # "api" or "cache"


@router.get("/lookup/{blockchain}/{address}", response_model=WalletLookupResponse)
async def lookup_wallet(
    blockchain: str,
    address: str,
    current_user: User = Depends(get_current_user)
):
    """
    Lookup wallet information from blockchain APIs.
    
    Supported blockchains:
    - bitcoin (BTC)
    - ethereum (ETH)
    - tron (TRX/USDT-TRC20)
    - bsc (BNB)
    - polygon (MATIC)
    
    Features:
    - Caching (5 min TTL)
    - Rate limiting (500ms between calls)
    - Known entity detection
    - Risk scoring
    """
    blockchain = blockchain.lower()
    
    # Validate blockchain
    valid_blockchains = ["bitcoin", "ethereum", "tron", "bsc", "polygon"]
    if blockchain not in valid_blockchains:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid blockchain. Supported: {', '.join(valid_blockchains)}"
        )
    
    # Check cache first
    cached = _get_cached_wallet(blockchain, address)
    if cached:
        cached["source"] = "cache"
        return cached
    
    # Check Chainalysis sanctions FIRST (before blockchain data)
    sanctions_result = await check_chainalysis_sanctions(address)
    is_sanctioned = sanctions_result and sanctions_result.get("isSanctioned", False)
    
    # Fetch from blockchain API
    wallet_data = None
    
    if blockchain == "tron":
        wallet_data = await fetch_tron_wallet(address)
        symbol = "trx"
    else:
        wallet_data = await fetch_blockchair_wallet(blockchain, address)
        symbol = {"bitcoin": "btc", "ethereum": "eth", "bsc": "bnb", "polygon": "matic"}.get(blockchain, "eth")
    
    # If sanctioned but no blockchain data, create minimal response
    if not wallet_data:
        # Check if it's a known entity (like Tornado Cash)
        known = KNOWN_ENTITIES.get(address.lower())
        
        if is_sanctioned or known:
            # Return data for sanctioned or known entities even without blockchain data
            logger.warning(f"Known/Sanctioned address without blockchain data: {address}")
            wallet_data = {
                "balance": 0,
                "totalReceived": 0,
                "totalSent": 0,
                "txCount": 0,
                "firstSeen": None,
                "lastSeen": None
            }
        else:
            raise HTTPException(
                status_code=404,
                detail=f"Wallet not found or API unavailable for {address}"
            )
    
    # Get price
    price = await get_crypto_price(symbol)
    
    # Calculate values
    balance = wallet_data.get("balance", 0)
    balance_usd = balance * price
    
    if blockchain == "tron" and wallet_data.get("usdtBalance", 0) > 0:
        balance_usd += wallet_data["usdtBalance"]  # USDT is already in USD
    
    # Calculate risk (pass sanctions info)
    risk_score, risk_factors = calculate_risk_score(wallet_data, address, blockchain, sanctions_result)
    
    # Build labels
    labels = []
    
    # OFAC Sanctioned - highest priority label
    if is_sanctioned:
        labels.append("⚠️ OFAC SANCTIONED")
        if sanctions_result.get("name"):
            labels.append(sanctions_result["name"])
    
    known = KNOWN_ENTITIES.get(address.lower())
    if known:
        labels.append(known["name"])
    if risk_score >= 70:
        labels.append("High Risk")
    if wallet_data.get("txCount", 0) > 100:
        labels.append("High Activity")
    if balance_usd > 100000:
        labels.append("High Value")
    
    result = {
        "address": address,
        "blockchain": blockchain,
        "balance": balance,
        "balanceUSD": balance_usd,
        "totalReceived": wallet_data.get("totalReceived", 0),
        "totalSent": wallet_data.get("totalSent", 0),
        "txCount": wallet_data.get("txCount", 0),
        "firstTxDate": wallet_data.get("firstSeen"),
        "lastTxDate": wallet_data.get("lastSeen"),
        "isContract": False,
        "isSanctioned": is_sanctioned,
        "sanctionsData": sanctions_result if is_sanctioned else None,
        "labels": labels,
        "riskScore": risk_score,
        "riskFactors": risk_factors,
        "source": "api"
    }
    
    # Cache result
    _set_cached_wallet(blockchain, address, result)
    
    return result


@router.post("/lookup/bulk")
async def bulk_lookup_wallets(
    wallets: List[Dict[str, str]],
    current_user: User = Depends(get_current_user)
):
    """
    Bulk lookup multiple wallets.
    
    Request body:
    [
        {"blockchain": "ethereum", "address": "0x..."},
        {"blockchain": "bitcoin", "address": "bc1..."}
    ]
    
    Returns results for each wallet with success/error status.
    """
    results = []
    
    for wallet in wallets[:50]:  # Limit to 50 wallets per request
        blockchain = wallet.get("blockchain", "").lower()
        address = wallet.get("address", "")
        
        if not blockchain or not address:
            results.append({
                "address": address,
                "blockchain": blockchain,
                "success": False,
                "error": "Missing blockchain or address"
            })
            continue
        
        try:
            result = await lookup_wallet(blockchain, address, current_user)
            result_dict = result.dict() if hasattr(result, 'dict') else result
            results.append({
                **result_dict,
                "success": True
            })
        except HTTPException as e:
            results.append({
                "address": address,
                "blockchain": blockchain,
                "success": False,
                "error": e.detail
            })
        except Exception as e:
            results.append({
                "address": address,
                "blockchain": blockchain,
                "success": False,
                "error": str(e)
            })
    
    return {
        "total": len(wallets),
        "processed": len(results),
        "results": results
    }
