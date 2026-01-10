/**
 * MoneyFlowGraph - Professional Forensic Money Flow Visualization
 * Using React Flow for court-ready financial investigation
 */
import { useCallback, useMemo, useState, useEffect } from 'react';
import type { Node, Edge } from 'reactflow';
import ReactFlow, {
  Controls,
  MiniMap,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
  ConnectionMode,
  Panel,
} from 'reactflow';

import { CustomNode } from './CustomNode';
import { SummaryPanel } from './SummaryPanel';
import { NodeDetailPanel } from './NodeDetailPanel';
import { Legend } from './Legend';
import type { MoneyFlowNode, MoneyFlowEdge } from './types';

// Node types registration
const nodeTypes = {
  custom: CustomNode,
};

interface MoneyFlowGraphProps {
  nodes: MoneyFlowNode[];
  edges: MoneyFlowEdge[];
  onNodeClick?: (node: MoneyFlowNode) => void;
}

// Color mapping for node types
const NODE_COLORS: Record<string, string> = {
  bank_account: '#3B82F6',      // Blue
  crypto_wallet: '#F59E0B',     // Orange/Amber
  person: '#10B981',            // Green
  company: '#8B5CF6',           // Purple
  exchange: '#EC4899',          // Pink
  suspect: '#EF4444',           // Red
  victim: '#06B6D4',            // Cyan
  unknown: '#6B7280',           // Gray
};

// Convert API data to React Flow format
const convertToReactFlowNodes = (nodes: MoneyFlowNode[]): Node[] => {
  // Calculate positions using force-directed-like layout
  const nodeCount = nodes.length;
  const radius = Math.max(300, nodeCount * 40);
  
  return nodes.map((node, index) => {
    // Arrange in circle for initial layout
    const angle = (2 * Math.PI * index) / nodeCount;
    const x = 400 + radius * Math.cos(angle);
    const y = 300 + radius * Math.sin(angle);
    
    return {
      id: String(node.id),
      type: 'custom',
      position: { x, y },
      data: {
        ...node,
        color: node.is_suspect 
          ? NODE_COLORS.suspect 
          : node.is_victim 
            ? NODE_COLORS.victim 
            : NODE_COLORS[node.node_type] || NODE_COLORS.unknown,
      },
    };
  });
};

const convertToReactFlowEdges = (edges: MoneyFlowEdge[]): Edge[] => {
  return edges.map((edge) => ({
    id: String(edge.id),
    source: String(edge.from_node_id),
    target: String(edge.to_node_id),
    type: 'smoothstep',
    animated: true,
    label: edge.amount ? `฿${edge.amount.toLocaleString()}` : edge.label,
    labelStyle: { 
      fill: '#fff', 
      fontWeight: 600,
      fontSize: 11,
    },
    labelBgStyle: { 
      fill: '#1F2937', 
      fillOpacity: 0.9,
    },
    labelBgPadding: [8, 4] as [number, number],
    labelBgBorderRadius: 4,
    style: { 
      stroke: edge.edge_type === 'crypto_transfer' ? '#F59E0B' : '#3B82F6',
      strokeWidth: Math.min(Math.max(1, (edge.amount || 0) / 100000), 5),
    },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: edge.edge_type === 'crypto_transfer' ? '#F59E0B' : '#3B82F6',
    },
    data: edge,
  }));
};

export const MoneyFlowGraph = ({ 
  nodes: apiNodes, 
  edges: apiEdges,
  onNodeClick,
}: MoneyFlowGraphProps) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<MoneyFlowNode | null>(null);

  // Convert API data to React Flow format
  useEffect(() => {
    if (apiNodes.length > 0) {
      setNodes(convertToReactFlowNodes(apiNodes));
    }
    if (apiEdges.length > 0) {
      setEdges(convertToReactFlowEdges(apiEdges));
    }
  }, [apiNodes, apiEdges, setNodes, setEdges]);

  // Handle node click
  const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    const originalNode = apiNodes.find(n => String(n.id) === node.id);
    if (originalNode) {
      setSelectedNode(originalNode);
      onNodeClick?.(originalNode);
    }
  }, [apiNodes, onNodeClick]);

  // Calculate summary statistics
  const summary = useMemo(() => {
    const totalIn = apiEdges.reduce((sum, e) => sum + (e.amount || 0), 0);
    // const totalOut = apiEdges.reduce((sum, e) => sum + (e.amount || 0), 0);
    const suspectCount = apiNodes.filter(n => n.is_suspect).length;
    const victimCount = apiNodes.filter(n => n.is_victim).length;
    const highRiskCount = apiNodes.filter(n => (n.risk_score || 0) >= 70).length;
    
    return {
      nodeCount: apiNodes.length,
      edgeCount: apiEdges.length,
      totalFlow: totalIn,
      suspectCount,
      victimCount,
      highRiskCount,
    };
  }, [apiNodes, apiEdges]);

  // MiniMap node color
  const nodeColor = useCallback((node: Node) => {
    return node.data?.color || '#6B7280';
  }, []);

  return (
    <div className="w-full h-full relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2}
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: true,
        }}
      >
        {/* Controls */}
        <Controls 
          className="bg-dark-800 border border-dark-600 rounded-lg"
          showInteractive={false}
        />
        
        {/* MiniMap */}
        <MiniMap 
          nodeColor={nodeColor}
          maskColor="rgba(0, 0, 0, 0.8)"
          className="bg-dark-900 border border-dark-600 rounded-lg"
          pannable
          zoomable
        />
        
        {/* Background Grid */}
        <Background color="#374151" gap={20} size={1} />

        {/* Summary Panel - Top Left */}
        <Panel position="top-left" className="m-2">
          <SummaryPanel summary={summary} />
        </Panel>

        {/* Legend - Bottom Left */}
        <Panel position="bottom-left" className="m-2">
          <Legend />
        </Panel>

        {/* Node Detail Panel - Top Right */}
        {selectedNode && (
          <Panel position="top-right" className="m-2">
            <NodeDetailPanel 
              node={selectedNode} 
              onClose={() => setSelectedNode(null)}
              edges={apiEdges}
            />
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
};

export default MoneyFlowGraph;
