"""
Money Flow Models
Nodes and Edges for money flow graph visualization
"""
from datetime import datetime
from enum import Enum as PyEnum
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Enum, Text, Float
from sqlalchemy.orm import relationship
from app.database import Base


class NodeType(str, PyEnum):
    """Types of nodes in money flow graph"""
    PERSON = "person"
    BANK_ACCOUNT = "bank_account"
    PHONE = "phone"
    CRYPTO_WALLET = "crypto_wallet"
    COMPANY = "company"
    MULE_ACCOUNT = "mule_account"
    GAMBLING_SITE = "gambling_site"
    EXCHANGE = "exchange"
    PROMPTPAY = "promptpay"
    TRUEMONEY = "truemoney"
    UNKNOWN = "unknown"


class MoneyFlowNode(Base):
    """
    Node in money flow graph
    Represents entities like persons, accounts, wallets
    """
    
    __tablename__ = "money_flow_nodes"
    
    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id", ondelete="CASCADE"), nullable=False)
    
    # Node Identity
    node_type = Column(Enum(NodeType), nullable=False)
    label = Column(String(255), nullable=False)  # Display name
    identifier = Column(String(255), nullable=True)  # Account number, wallet address, etc.
    
    # Details based on type
    bank_name = Column(String(100), nullable=True)
    account_name = Column(String(255), nullable=True)
    phone_number = Column(String(50), nullable=True)
    id_card = Column(String(20), nullable=True)
    
    # For crypto
    blockchain = Column(String(50), nullable=True)  # BTC, ETH, USDT, etc.
    wallet_address = Column(String(255), nullable=True)
    
    # Risk Assessment
    risk_score = Column(Integer, default=0)  # 0-100
    is_suspect = Column(Boolean, default=False)
    is_victim = Column(Boolean, default=False)
    
    # Visual properties (for graph)
    x_position = Column(Float, nullable=True)
    y_position = Column(Float, nullable=True)
    color = Column(String(20), nullable=True)
    size = Column(Integer, default=25)
    
    # Metadata
    notes = Column(Text, nullable=True)
    source = Column(String(100), nullable=True)  # Where this data came from
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    case = relationship("Case", back_populates="money_flow_nodes")
    outgoing_edges = relationship("MoneyFlowEdge", back_populates="from_node", foreign_keys="MoneyFlowEdge.from_node_id")
    incoming_edges = relationship("MoneyFlowEdge", back_populates="to_node", foreign_keys="MoneyFlowEdge.to_node_id")
    
    def __repr__(self):
        return f"<Node {self.node_type}: {self.label}>"




class MoneyFlowEdge(Base):
    """
    Edge in money flow graph
    Represents transactions/transfers between nodes
    """
    
    __tablename__ = "money_flow_edges"
    
    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id", ondelete="CASCADE"), nullable=False)
    
    # Connection
    from_node_id = Column(Integer, ForeignKey("money_flow_nodes.id", ondelete="CASCADE"), nullable=False)
    to_node_id = Column(Integer, ForeignKey("money_flow_nodes.id", ondelete="CASCADE"), nullable=False)
    
    # Transaction Details
    amount = Column(Float, nullable=True)
    currency = Column(String(10), default="THB")
    transaction_date = Column(DateTime, nullable=True)
    transaction_ref = Column(String(100), nullable=True)
    
    # Edge properties
    label = Column(String(255), nullable=True)  # Description
    edge_type = Column(String(50), default="transfer")  # transfer, withdrawal, deposit
    
    # Visual properties
    color = Column(String(20), nullable=True)
    width = Column(Integer, default=1)
    dashes = Column(Boolean, default=False)  # Dashed line for uncertain
    
    # Evidence
    evidence_url = Column(String(500), nullable=True)
    notes = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    case = relationship("Case", back_populates="money_flow_edges")
    from_node = relationship("MoneyFlowNode", back_populates="outgoing_edges", foreign_keys=[from_node_id])
    to_node = relationship("MoneyFlowNode", back_populates="incoming_edges", foreign_keys=[to_node_id])
    
    def __repr__(self):
        return f"<Edge {self.from_node_id} -> {self.to_node_id}: {self.amount}>"
