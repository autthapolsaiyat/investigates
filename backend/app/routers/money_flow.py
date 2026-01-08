"""
Money Flow Router
Graph nodes and edges management
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.case import Case
from app.models.user import User, UserRole
from app.models.money_flow import MoneyFlowNode, MoneyFlowEdge
from app.schemas.money_flow import (
    NodeCreate,
    NodeUpdate,
    NodeResponse,
    EdgeCreate,
    EdgeUpdate,
    EdgeResponse,
    MoneyFlowGraph,
    BulkNodesCreate,
    BulkEdgesCreate,
    NodePositionsUpdate
)
from app.utils.security import get_current_user

router = APIRouter(prefix="/cases/{case_id}/money-flow", tags=["Money Flow"])


def check_case_access(case_id: int, current_user: User, db: Session) -> Case:
    """Helper to check case access permissions"""
    case = db.query(Case).filter(Case.id == case_id).first()
    
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Case not found"
        )
    
    if current_user.role != UserRole.SUPER_ADMIN:
        if case.organization_id != current_user.organization_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
    
    return case


# ============== Graph ==============

@router.get("", response_model=MoneyFlowGraph)
async def get_money_flow_graph(
    case_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get complete money flow graph for a case
    """
    case = check_case_access(case_id, current_user, db)
    
    # Get all nodes
    nodes = db.query(MoneyFlowNode).filter(MoneyFlowNode.case_id == case_id).all()
    
    # Get all edges
    edges = db.query(MoneyFlowEdge).filter(MoneyFlowEdge.case_id == case_id).all()
    
    # Calculate statistics
    total_amount = db.query(func.sum(MoneyFlowEdge.amount)) \
                     .filter(MoneyFlowEdge.case_id == case_id) \
                     .scalar() or 0
    
    suspects_count = db.query(MoneyFlowNode) \
                       .filter(MoneyFlowNode.case_id == case_id, MoneyFlowNode.is_suspect == True) \
                       .count()
    
    victims_count = db.query(MoneyFlowNode) \
                      .filter(MoneyFlowNode.case_id == case_id, MoneyFlowNode.is_victim == True) \
                      .count()
    
    return MoneyFlowGraph(
        case_id=case_id,
        nodes=[NodeResponse.model_validate(n) for n in nodes],
        edges=[EdgeResponse.model_validate(e) for e in edges],
        total_amount=total_amount,
        node_count=len(nodes),
        edge_count=len(edges),
        suspects_count=suspects_count,
        victims_count=victims_count
    )


# ============== Nodes ==============

@router.get("/nodes", response_model=list[NodeResponse])
async def list_nodes(
    case_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List all nodes in a case
    """
    check_case_access(case_id, current_user, db)
    
    nodes = db.query(MoneyFlowNode).filter(MoneyFlowNode.case_id == case_id).all()
    return [NodeResponse.model_validate(n) for n in nodes]


@router.post("/nodes", response_model=NodeResponse, status_code=status.HTTP_201_CREATED)
async def create_node(
    case_id: int,
    request: NodeCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new node
    """
    case = check_case_access(case_id, current_user, db)
    
    # Check edit permission
    if current_user.role in [UserRole.VIEWER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions"
        )
    
    node = MoneyFlowNode(
        case_id=case_id,
        **request.model_dump()
    )
    
    db.add(node)
    db.commit()
    db.refresh(node)
    
    return NodeResponse.model_validate(node)


@router.post("/nodes/bulk", response_model=list[NodeResponse], status_code=status.HTTP_201_CREATED)
async def create_nodes_bulk(
    case_id: int,
    request: BulkNodesCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create multiple nodes at once
    """
    check_case_access(case_id, current_user, db)
    
    if current_user.role in [UserRole.VIEWER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions"
        )
    
    created_nodes = []
    for node_data in request.nodes:
        node = MoneyFlowNode(
            case_id=case_id,
            **node_data.model_dump()
        )
        db.add(node)
        created_nodes.append(node)
    
    db.commit()
    
    for node in created_nodes:
        db.refresh(node)
    
    return [NodeResponse.model_validate(n) for n in created_nodes]


@router.get("/nodes/{node_id}", response_model=NodeResponse)
async def get_node(
    case_id: int,
    node_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get node by ID
    """
    check_case_access(case_id, current_user, db)
    
    node = db.query(MoneyFlowNode).filter(
        MoneyFlowNode.id == node_id,
        MoneyFlowNode.case_id == case_id
    ).first()
    
    if not node:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Node not found"
        )
    
    return NodeResponse.model_validate(node)


@router.patch("/nodes/{node_id}", response_model=NodeResponse)
async def update_node(
    case_id: int,
    node_id: int,
    request: NodeUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update node
    """
    check_case_access(case_id, current_user, db)
    
    if current_user.role in [UserRole.VIEWER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions"
        )
    
    node = db.query(MoneyFlowNode).filter(
        MoneyFlowNode.id == node_id,
        MoneyFlowNode.case_id == case_id
    ).first()
    
    if not node:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Node not found"
        )
    
    update_data = request.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(node, key, value)
    
    db.commit()
    db.refresh(node)
    
    return NodeResponse.model_validate(node)


@router.delete("/nodes/{node_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_node(
    case_id: int,
    node_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete node (also deletes connected edges)
    """
    check_case_access(case_id, current_user, db)
    
    if current_user.role in [UserRole.VIEWER, UserRole.ANALYST]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions"
        )
    
    node = db.query(MoneyFlowNode).filter(
        MoneyFlowNode.id == node_id,
        MoneyFlowNode.case_id == case_id
    ).first()
    
    if not node:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Node not found"
        )
    
    db.delete(node)
    db.commit()


@router.patch("/nodes/positions", response_model=list[NodeResponse])
async def update_node_positions(
    case_id: int,
    request: NodePositionsUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update positions for multiple nodes (after drag in UI)
    """
    check_case_access(case_id, current_user, db)
    
    updated_nodes = []
    for pos in request.positions:
        node = db.query(MoneyFlowNode).filter(
            MoneyFlowNode.id == pos["id"],
            MoneyFlowNode.case_id == case_id
        ).first()
        
        if node:
            node.x_position = pos.get("x")
            node.y_position = pos.get("y")
            updated_nodes.append(node)
    
    db.commit()
    
    return [NodeResponse.model_validate(n) for n in updated_nodes]


# ============== Edges ==============

@router.get("/edges", response_model=list[EdgeResponse])
async def list_edges(
    case_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List all edges in a case
    """
    check_case_access(case_id, current_user, db)
    
    edges = db.query(MoneyFlowEdge).filter(MoneyFlowEdge.case_id == case_id).all()
    return [EdgeResponse.model_validate(e) for e in edges]


@router.post("/edges", response_model=EdgeResponse, status_code=status.HTTP_201_CREATED)
async def create_edge(
    case_id: int,
    request: EdgeCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new edge
    """
    check_case_access(case_id, current_user, db)
    
    if current_user.role in [UserRole.VIEWER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions"
        )
    
    # Verify nodes exist
    from_node = db.query(MoneyFlowNode).filter(
        MoneyFlowNode.id == request.from_node_id,
        MoneyFlowNode.case_id == case_id
    ).first()
    
    to_node = db.query(MoneyFlowNode).filter(
        MoneyFlowNode.id == request.to_node_id,
        MoneyFlowNode.case_id == case_id
    ).first()
    
    if not from_node or not to_node:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Source or target node not found"
        )
    
    edge = MoneyFlowEdge(
        case_id=case_id,
        **request.model_dump()
    )
    
    db.add(edge)
    db.commit()
    db.refresh(edge)
    
    return EdgeResponse.model_validate(edge)


@router.post("/edges/bulk", response_model=list[EdgeResponse], status_code=status.HTTP_201_CREATED)
async def create_edges_bulk(
    case_id: int,
    request: BulkEdgesCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create multiple edges at once
    """
    check_case_access(case_id, current_user, db)
    
    if current_user.role in [UserRole.VIEWER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions"
        )
    
    created_edges = []
    for edge_data in request.edges:
        edge = MoneyFlowEdge(
            case_id=case_id,
            **edge_data.model_dump()
        )
        db.add(edge)
        created_edges.append(edge)
    
    db.commit()
    
    for edge in created_edges:
        db.refresh(edge)
    
    return [EdgeResponse.model_validate(e) for e in created_edges]


@router.get("/edges/{edge_id}", response_model=EdgeResponse)
async def get_edge(
    case_id: int,
    edge_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get edge by ID
    """
    check_case_access(case_id, current_user, db)
    
    edge = db.query(MoneyFlowEdge).filter(
        MoneyFlowEdge.id == edge_id,
        MoneyFlowEdge.case_id == case_id
    ).first()
    
    if not edge:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Edge not found"
        )
    
    return EdgeResponse.model_validate(edge)


@router.patch("/edges/{edge_id}", response_model=EdgeResponse)
async def update_edge(
    case_id: int,
    edge_id: int,
    request: EdgeUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update edge
    """
    check_case_access(case_id, current_user, db)
    
    if current_user.role in [UserRole.VIEWER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions"
        )
    
    edge = db.query(MoneyFlowEdge).filter(
        MoneyFlowEdge.id == edge_id,
        MoneyFlowEdge.case_id == case_id
    ).first()
    
    if not edge:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Edge not found"
        )
    
    update_data = request.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(edge, key, value)
    
    db.commit()
    db.refresh(edge)
    
    return EdgeResponse.model_validate(edge)


@router.delete("/edges/{edge_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_edge(
    case_id: int,
    edge_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete edge
    """
    check_case_access(case_id, current_user, db)
    
    if current_user.role in [UserRole.VIEWER, UserRole.ANALYST]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions"
        )
    
    edge = db.query(MoneyFlowEdge).filter(
        MoneyFlowEdge.id == edge_id,
        MoneyFlowEdge.case_id == case_id
    ).first()
    
    if not edge:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Edge not found"
        )
    
    db.delete(edge)
    db.commit()
