"""
Money Flow Schemas
Pydantic models for money flow graph
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from app.models.money_flow import NodeType


# ============== Node Schemas ==============

class NodeBase(BaseModel):
    """Base node schema"""
    node_type: NodeType
    label: str = Field(..., min_length=1, max_length=255)
    identifier: Optional[str] = Field(None, max_length=255)


class NodeCreate(NodeBase):
    """Create node schema"""
    # Details
    bank_name: Optional[str] = None
    account_name: Optional[str] = None
    phone_number: Optional[str] = None
    id_card: Optional[str] = None
    
    # Crypto
    blockchain: Optional[str] = None
    wallet_address: Optional[str] = None
    
    # Assessment
    risk_score: int = Field(default=0, ge=0, le=100)
    is_suspect: bool = False
    is_victim: bool = False
    
    # Visual
    x_position: Optional[float] = None
    y_position: Optional[float] = None
    color: Optional[str] = None
    size: int = 25
    
    # Meta
    notes: Optional[str] = None
    source: Optional[str] = None


class NodeUpdate(BaseModel):
    """Update node schema"""
    node_type: Optional[NodeType] = None
    label: Optional[str] = Field(None, min_length=1, max_length=255)
    identifier: Optional[str] = None
    bank_name: Optional[str] = None
    account_name: Optional[str] = None
    phone_number: Optional[str] = None
    id_card: Optional[str] = None
    blockchain: Optional[str] = None
    wallet_address: Optional[str] = None
    risk_score: Optional[int] = Field(None, ge=0, le=100)
    is_suspect: Optional[bool] = None
    is_victim: Optional[bool] = None
    x_position: Optional[float] = None
    y_position: Optional[float] = None
    color: Optional[str] = None
    size: Optional[int] = None
    notes: Optional[str] = None


class NodeResponse(NodeBase):
    """Node response"""
    id: int
    case_id: int
    
    # Details
    bank_name: Optional[str]
    account_name: Optional[str]
    phone_number: Optional[str]
    id_card: Optional[str]
    blockchain: Optional[str]
    wallet_address: Optional[str]
    
    # Assessment
    risk_score: int
    is_suspect: bool
    is_victim: bool
    
    # Visual
    x_position: Optional[float]
    y_position: Optional[float]
    color: Optional[str]
    size: int
    
    # Meta
    notes: Optional[str]
    source: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# ============== Edge Schemas ==============

class EdgeBase(BaseModel):
    """Base edge schema"""
    from_node_id: int
    to_node_id: int
    label: Optional[str] = None


class EdgeCreate(EdgeBase):
    """Create edge schema"""
    amount: Optional[float] = None
    currency: str = "THB"
    transaction_date: Optional[datetime] = None
    transaction_ref: Optional[str] = None
    edge_type: str = "transfer"
    
    # Visual
    color: Optional[str] = None
    width: int = 1
    dashes: bool = False
    
    # Evidence
    evidence_url: Optional[str] = None
    notes: Optional[str] = None


class EdgeUpdate(BaseModel):
    """Update edge schema"""
    from_node_id: Optional[int] = None
    to_node_id: Optional[int] = None
    amount: Optional[float] = None
    currency: Optional[str] = None
    transaction_date: Optional[datetime] = None
    transaction_ref: Optional[str] = None
    label: Optional[str] = None
    edge_type: Optional[str] = None
    color: Optional[str] = None
    width: Optional[int] = None
    dashes: Optional[bool] = None
    evidence_url: Optional[str] = None
    notes: Optional[str] = None


class EdgeResponse(EdgeBase):
    """Edge response"""
    id: int
    case_id: int
    amount: Optional[float]
    currency: str
    transaction_date: Optional[datetime]
    transaction_ref: Optional[str]
    edge_type: str
    color: Optional[str]
    width: int
    dashes: bool
    evidence_url: Optional[str]
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# ============== Graph Schema ==============

class MoneyFlowGraph(BaseModel):
    """Complete graph data for visualization"""
    case_id: int
    nodes: list[NodeResponse]
    edges: list[EdgeResponse]
    
    # Statistics
    total_amount: float
    node_count: int
    edge_count: int
    suspects_count: int
    victims_count: int


# ============== Bulk Operations ==============

class BulkNodesCreate(BaseModel):
    """Create multiple nodes at once"""
    nodes: list[NodeCreate]


class BulkEdgesCreate(BaseModel):
    """Create multiple edges at once"""
    edges: list[EdgeCreate]


class NodePositionsUpdate(BaseModel):
    """Update positions for multiple nodes (after drag)"""
    positions: list[dict]  # [{id: 1, x: 100, y: 200}, ...]
