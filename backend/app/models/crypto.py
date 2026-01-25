"""
Crypto Transaction Models
Store cryptocurrency transaction data from imported files
"""
from datetime import datetime
from enum import Enum as PyEnum
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Enum, Text, Float
from sqlalchemy.orm import relationship
from app.database import Base


class BlockchainType(str, PyEnum):
    """Supported blockchains"""
    BTC = "btc"
    ETH = "eth"
    USDT_TRC20 = "usdt_trc20"
    USDT_ERC20 = "usdt_erc20"
    BNB = "bnb"
    MATIC = "matic"
    TRX = "trx"
    OTHER = "other"


class RiskFlag(str, PyEnum):
    """Risk flags for crypto transactions"""
    NONE = "none"
    MIXER_DETECTED = "mixer_detected"
    TORNADO_CASH = "tornado_cash"
    HIGH_VALUE = "high_value"
    EXCHANGE = "exchange"
    FROM_MIXER = "from_mixer"
    SANCTIONED = "sanctioned"
    GAMBLING = "gambling"
    DARKNET = "darknet"
    UNKNOWN = "unknown"


class CryptoTransaction(Base):
    """
    Individual crypto transaction from imported data
    """
    
    __tablename__ = "crypto_transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id", ondelete="CASCADE"), nullable=False)
    evidence_id = Column(Integer, ForeignKey("evidences.id", ondelete="SET NULL"), nullable=True)
    
    # Blockchain Info
    blockchain = Column(Enum(BlockchainType), default=BlockchainType.OTHER)
    tx_hash = Column(String(255), nullable=True, index=True)
    block_number = Column(Integer, nullable=True)
    
    # Transaction Details
    from_address = Column(String(255), nullable=False)
    from_label = Column(String(255), nullable=True)  # Known label
    to_address = Column(String(255), nullable=False)
    to_label = Column(String(255), nullable=True)
    
    # Value
    amount = Column(Float, nullable=True)  # In native token
    amount_usd = Column(Float, nullable=True)  # USD value at time
    fee = Column(Float, nullable=True)
    
    # Timing
    timestamp = Column(DateTime, nullable=True)
    confirmations = Column(Integer, nullable=True)
    
    # Risk Assessment
    risk_flag = Column(Enum(RiskFlag), default=RiskFlag.NONE)
    risk_score = Column(Integer, default=0)  # 0-100
    
    # Analysis
    is_incoming = Column(Boolean, default=True)  # To suspect wallet
    is_contract_interaction = Column(Boolean, default=False)
    method_name = Column(String(100), nullable=True)  # Contract method
    
    # Notes
    notes = Column(Text, nullable=True)
    raw_data = Column(Text, nullable=True)  # JSON of original row
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    case = relationship("Case", back_populates="crypto_transactions")
    
    def __repr__(self):
        return f"<CryptoTransaction {self.blockchain}: {self.from_address[:10]}... -> {self.to_address[:10]}...>"


class CryptoWallet(Base):
    """
    Aggregated wallet information from case data
    """
    
    __tablename__ = "crypto_wallets"
    
    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id", ondelete="CASCADE"), nullable=False)
    
    # Wallet Info
    address = Column(String(255), nullable=False, index=True)
    blockchain = Column(Enum(BlockchainType), default=BlockchainType.OTHER)
    label = Column(String(255), nullable=True)  # User-assigned label
    
    # Owner (if known)
    owner_name = Column(String(255), nullable=True)
    owner_type = Column(String(50), nullable=True)  # suspect, victim, exchange, mixer
    
    # Aggregated Stats
    total_received = Column(Float, default=0)
    total_sent = Column(Float, default=0)
    total_received_usd = Column(Float, default=0)
    total_sent_usd = Column(Float, default=0)
    transaction_count = Column(Integer, default=0)
    
    # Risk
    risk_score = Column(Integer, default=0)
    risk_flags = Column(Text, nullable=True)  # JSON array of flags
    is_suspect = Column(Boolean, default=False)
    is_exchange = Column(Boolean, default=False)
    is_mixer = Column(Boolean, default=False)
    
    # Timestamps
    first_tx_date = Column(DateTime, nullable=True)
    last_tx_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    case = relationship("Case", back_populates="crypto_wallets")
    
    def __repr__(self):
        return f"<CryptoWallet {self.blockchain}: {self.address[:15]}...>"
