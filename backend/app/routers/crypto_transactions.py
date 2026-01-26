"""
Crypto Transactions Router
API for Crypto Tracker data
"""
from datetime import datetime
from typing import List, Optional
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
