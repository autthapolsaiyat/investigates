/**
 * MoneyFlowGraph V3 - With Analytics Panel
 * Professional Forensic Money Flow with Analysis Features
 */
import { useCallback, useMemo, useState, useEffect } from 'react';
import type { Node, Edge } from 'reactflow';
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
  ConnectionMode,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { 
  Building2, 
  Wallet, 
  User, 
  Building, 
  ArrowLeftRight,
  AlertTriangle,
  Shield,
  ChevronDown,
  ChevronUp,
  X,
  TrendingUp,
  CircleDot,
  ArrowDownLeft,
  ArrowUpRight,
  Copy,
  Hash
} from 'lucide-react';
import type { MoneyFlowNode, MoneyFlowEdge } from './types';
import { AnalyticsPanel } from './AnalyticsPanel';

// Color mapping for node types
const NODE_COLORS: Record<string, string> = {
  bank_account: '#3B82F6',
  crypto_wallet: '#F59E0B',
  person: '#10B981',
  company: '#8B5CF6',
  exchange: '#EC4899',
  suspect: '#EF4444',
  victim: '#06B6D4',
  unknown: '#6B7280',
};

const NODE_LABELS: Record<string, string> = {
  bank_account: 'บัญชีธนาคาร',
  crypto_wallet: 'Crypto',
  person: 'บุคคล',
  company: 'บริษัท',
  exchange: 'Exchange',
  unknown: 'อื่นๆ',
};

// Get icon component
const getNodeIcon = (nodeType: string) => {
  switch (nodeType) {
    case 'bank_account': return Building2;
    case 'crypto_wallet': return Wallet;
    case 'person': return User;
    case 'company': return Building;
    case 'exchange': return ArrowLeftRight;
    default: return CircleDot;
  }
};

interface MoneyFlowGraphProps {
  nodes: MoneyFlowNode[];
  edges: MoneyFlowEdge[];
  onNodeClick?: (node: MoneyFlowNode) => void;
}

// Hierarchical layout calculation
const calculateHierarchicalLayout = (
  nodes: MoneyFlowNode[], 
  edges: MoneyFlowEdge[]
): Map<number, { x: number; y: number; level: number }> => {
  const positions = new Map<number, { x: number; y: number; level: number }>();
  
  if (nodes.length === 0) return positions;

  const outgoing = new Map<number, number[]>();
  const incoming = new Map<number, number[]>();
  
  nodes.forEach(n => {
    outgoing.set(n.id, []);
    incoming.set(n.id, []);
  });
  
  edges.forEach(e => {
    outgoing.get(e.from_node_id)?.push(e.to_node_id);
    incoming.get(e.to_node_id)?.push(e.from_node_id);
  });

  const roots = nodes.filter(n => incoming.get(n.id)?.length === 0);
  const startNodes = roots.length > 0 ? roots : [nodes[0]];

  const levels = new Map<number, number>();
  const queue: number[] = startNodes.map(n => n.id);
  startNodes.forEach(n => levels.set(n.id, 0));

  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentLevel = levels.get(current) || 0;
    
    outgoing.get(current)?.forEach(target => {
      if (!levels.has(target)) {
        levels.set(target, currentLevel + 1);
        queue.push(target);
      }
    });
  }

  nodes.forEach(n => {
    if (!levels.has(n.id)) levels.set(n.id, 0);
  });

  const levelGroups = new Map<number, number[]>();
  nodes.forEach(n => {
    const level = levels.get(n.id) || 0;
    if (!levelGroups.has(level)) levelGroups.set(level, []);
    levelGroups.get(level)!.push(n.id);
  });

  const levelWidth = 350;
  const nodeHeight = 140;
  const startX = 100;
  const startY = 50;

  levelGroups.forEach((nodeIds, level) => {
    nodeIds.forEach((nodeId, index) => {
      positions.set(nodeId, {
        x: startX + level * levelWidth,
        y: startY + index * nodeHeight,
        level
      });
    });
  });

  return positions;
};

// Custom Node Component
const CustomNodeComponent = ({ data }: { data: MoneyFlowNode & { color: string } }) => {
  const Icon = data.is_suspect ? AlertTriangle : 
               data.is_victim ? Shield : 
               getNodeIcon(data.node_type);
  
  const bgColor = data.is_suspect ? NODE_COLORS.suspect :
                  data.is_victim ? NODE_COLORS.victim :
                  data.color;

  return (
    <div 
      className="relative bg-dark-800 rounded-xl border-2 shadow-xl p-4 min-w-[180px]"
      style={{ borderColor: bgColor }}
    >
      {(data.risk_score || 0) > 0 && (
        <div 
          className="absolute -top-3 -right-3 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-lg"
          style={{ 
            backgroundColor: data.risk_score! >= 70 ? '#EF4444' : 
                            data.risk_score! >= 40 ? '#F59E0B' : '#10B981' 
          }}
        >
          {data.risk_score}
        </div>
      )}

      {(data.is_suspect || data.is_victim) && (
        <div 
          className={`absolute -top-3 -left-3 px-2 py-1 rounded-full text-xs font-bold text-white shadow-lg ${
            data.is_suspect ? 'bg-red-500' : 'bg-cyan-500'
          }`}
        >
          {data.is_suspect ? '⚠️ ผู้ต้องสงสัย' : '🛡️ ผู้เสียหาย'}
        </div>
      )}

      <div className="flex items-center gap-3 mb-3">
        <div 
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: bgColor }}
        >
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-white truncate">
            {data.label}
          </div>
          <div className="text-xs text-dark-400">
            {NODE_LABELS[data.node_type] || data.node_type}
          </div>
        </div>
      </div>

      {data.bank_name && (
        <div className="text-xs text-dark-300 mb-1">
          🏦 {data.bank_name}
        </div>
      )}
      
      {data.identifier && (
        <div className="text-xs text-dark-400 font-mono truncate">
          {data.identifier.slice(0, 12)}...
        </div>
      )}

      <div className="absolute left-0 top-1/2 -translate-x-1/2 w-3 h-3 bg-dark-600 border-2 border-dark-400 rounded-full" />
      <div className="absolute right-0 top-1/2 translate-x-1/2 w-3 h-3 bg-dark-600 border-2 border-dark-400 rounded-full" />
    </div>
  );
};

const nodeTypes = { custom: CustomNodeComponent };

const convertToReactFlowNodes = (
  nodes: MoneyFlowNode[], 
  positions: Map<number, { x: number; y: number; level: number }>
): Node[] => {
  return nodes.map((node) => {
    const pos = positions.get(node.id) || { x: 100, y: 100 };
    return {
      id: String(node.id),
      type: 'custom',
      position: { x: pos.x, y: pos.y },
      data: { ...node, color: NODE_COLORS[node.node_type] || NODE_COLORS.unknown },
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
    label: edge.amount ? `฿${edge.amount.toLocaleString()}` : '',
    labelStyle: { fill: '#fff', fontWeight: 700, fontSize: 11 },
    labelBgStyle: { fill: '#1F2937', fillOpacity: 0.95 },
    labelBgPadding: [8, 4] as [number, number],
    labelBgBorderRadius: 6,
    style: { 
      stroke: edge.edge_type === 'crypto_transfer' ? '#F59E0B' : '#3B82F6',
      strokeWidth: 2,
    },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: edge.edge_type === 'crypto_transfer' ? '#F59E0B' : '#3B82F6',
      width: 20,
      height: 20,
    },
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
  const [showSummary, setShowSummary] = useState(true);
  const [showLegend, setShowLegend] = useState(false);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);

  useEffect(() => {
    if (apiNodes.length > 0) {
      const positions = calculateHierarchicalLayout(apiNodes, apiEdges);
      setNodes(convertToReactFlowNodes(apiNodes, positions));
    }
    if (apiEdges.length > 0) {
      setEdges(convertToReactFlowEdges(apiEdges));
    }
  }, [apiNodes, apiEdges, setNodes, setEdges]);

  const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    const originalNode = apiNodes.find(n => String(n.id) === node.id);
    if (originalNode) {
      setSelectedNode(originalNode);
      onNodeClick?.(originalNode);
    }
  }, [apiNodes, onNodeClick]);

  // Focus on node when selected from Analytics
  const handleNodeSelect = useCallback((nodeId: number) => {
    const node = apiNodes.find(n => n.id === nodeId);
    if (node) {
      setSelectedNode(node);
      // Focus view on selected node
      if (reactFlowInstance) {
        const rfNode = nodes.find(n => n.id === String(nodeId));
        if (rfNode) {
          reactFlowInstance.setCenter(rfNode.position.x + 100, rfNode.position.y + 50, { zoom: 1, duration: 500 });
        }
      }
    }
  }, [apiNodes, reactFlowInstance, nodes]);

  const summary = useMemo(() => {
    const totalFlow = apiEdges.reduce((sum, e) => sum + (e.amount || 0), 0);
    const suspectCount = apiNodes.filter(n => n.is_suspect).length;
    const victimCount = apiNodes.filter(n => n.is_victim).length;
    const highRiskCount = apiNodes.filter(n => (n.risk_score || 0) >= 70).length;
    return { nodeCount: apiNodes.length, edgeCount: apiEdges.length, totalFlow, suspectCount, victimCount, highRiskCount };
  }, [apiNodes, apiEdges]);

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) return `฿${(amount / 1000000).toFixed(2)}M`;
    if (amount >= 1000) return `฿${(amount / 1000).toFixed(1)}K`;
    return `฿${amount.toLocaleString()}`;
  };

  const getNodeTransactions = (node: MoneyFlowNode) => {
    const incoming = apiEdges.filter(e => e.to_node_id === node.id);
    const outgoing = apiEdges.filter(e => e.from_node_id === node.id);
    const totalIn = incoming.reduce((sum, e) => sum + (e.amount || 0), 0);
    const totalOut = outgoing.reduce((sum, e) => sum + (e.amount || 0), 0);
    return { incoming, outgoing, totalIn, totalOut };
  };

  return (
    <div className="w-full h-full relative bg-dark-900">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        onInit={setReactFlowInstance}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.2}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Controls className="bg-dark-800 border border-dark-600 rounded-lg" showInteractive={false} />
        <Background color="#374151" gap={30} size={1} />

        {/* Summary Panel - Top Left */}
        <Panel position="top-left" className="m-3">
          <div className="bg-dark-800/95 backdrop-blur-sm border border-dark-600 rounded-xl shadow-xl overflow-hidden">
            <button 
              onClick={() => setShowSummary(!showSummary)}
              className="w-full flex items-center justify-between p-3 hover:bg-dark-700 transition-colors"
            >
              <span className="flex items-center gap-2 text-sm font-semibold text-white">
                <TrendingUp size={16} className="text-primary-400" />
                สรุปภาพรวม
              </span>
              {showSummary ? <ChevronUp size={16} className="text-dark-400" /> : <ChevronDown size={16} className="text-dark-400" />}
            </button>

            {showSummary && (
              <div className="px-4 pb-4 space-y-2">
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-2 bg-dark-900 rounded-lg">
                    <div className="text-lg font-bold text-white">{summary.nodeCount}</div>
                    <div className="text-xs text-dark-400">Nodes</div>
                  </div>
                  <div className="text-center p-2 bg-dark-900 rounded-lg">
                    <div className="text-lg font-bold text-white">{summary.edgeCount}</div>
                    <div className="text-xs text-dark-400">ธุรกรรม</div>
                  </div>
                  <div className="text-center p-2 bg-dark-900 rounded-lg">
                    <div className="text-lg font-bold text-amber-400">{formatCurrency(summary.totalFlow)}</div>
                    <div className="text-xs text-dark-400">มูลค่า</div>
                  </div>
                </div>
                
                {(summary.suspectCount > 0 || summary.highRiskCount > 0) && (
                  <div className="flex gap-2 pt-2 border-t border-dark-700">
                    {summary.suspectCount > 0 && (
                      <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs">
                        ⚠️ {summary.suspectCount} ผู้ต้องสงสัย
                      </span>
                    )}
                    {summary.highRiskCount > 0 && (
                      <span className="px-2 py-1 bg-amber-500/20 text-amber-400 rounded text-xs">
                        🔥 {summary.highRiskCount} ความเสี่ยงสูง
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </Panel>

        {/* Analytics Panel - Bottom Left */}
        <Panel position="bottom-left" className="m-3">
          <AnalyticsPanel 
            nodes={apiNodes} 
            edges={apiEdges}
            onNodeSelect={handleNodeSelect}
          />
        </Panel>

        {/* Legend Toggle */}
        <Panel position="top-center" className="m-3">
          <button 
            onClick={() => setShowLegend(!showLegend)}
            className="bg-dark-800/95 backdrop-blur-sm border border-dark-600 rounded-lg px-3 py-2 text-sm text-white hover:bg-dark-700 transition-colors flex items-center gap-2"
          >
            <CircleDot size={14} />
            สัญลักษณ์
            {showLegend ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {showLegend && (
            <div className="mt-2 bg-dark-800/95 backdrop-blur-sm border border-dark-600 rounded-xl p-3 shadow-xl">
              <div className="flex flex-wrap gap-3">
                {Object.entries(NODE_LABELS).map(([key, label]) => (
                  <div key={key} className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: NODE_COLORS[key] }} />
                    <span className="text-xs text-dark-300">{label}</span>
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-red-500" />
                  <span className="text-xs text-dark-300">ผู้ต้องสงสัย</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-cyan-500" />
                  <span className="text-xs text-dark-300">ผู้เสียหาย</span>
                </div>
              </div>
            </div>
          )}
        </Panel>

        {/* Node Detail Panel - Right */}
        {selectedNode && (
          <Panel position="top-right" className="m-3">
            <div className="bg-dark-800/95 backdrop-blur-sm border border-dark-600 rounded-xl shadow-xl w-72 max-h-[80vh] overflow-hidden">
              <div className="flex items-center justify-between p-3 border-b border-dark-700">
                <span className="text-sm font-semibold text-white">รายละเอียด</span>
                <button onClick={() => setSelectedNode(null)} className="p-1 hover:bg-dark-700 rounded">
                  <X size={16} className="text-dark-400" />
                </button>
              </div>

              <div className="p-4 space-y-4 overflow-y-auto max-h-[60vh]">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: NODE_COLORS[selectedNode.node_type] }}
                  >
                    {(() => {
                      const Icon = getNodeIcon(selectedNode.node_type);
                      return <Icon className="w-6 h-6 text-white" />;
                    })()}
                  </div>
                  <div>
                    <div className="font-semibold text-white">{selectedNode.label}</div>
                    <div className="text-xs text-dark-400">{NODE_LABELS[selectedNode.node_type]}</div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {selectedNode.is_suspect && (
                    <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs flex items-center gap-1">
                      <AlertTriangle size={12} /> ผู้ต้องสงสัย
                    </span>
                  )}
                  {selectedNode.is_victim && (
                    <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded text-xs flex items-center gap-1">
                      <Shield size={12} /> ผู้เสียหาย
                    </span>
                  )}
                  {(selectedNode.risk_score || 0) > 0 && (
                    <span className={`px-2 py-1 rounded text-xs ${
                      selectedNode.risk_score! >= 70 ? 'bg-red-500/20 text-red-400' :
                      selectedNode.risk_score! >= 40 ? 'bg-amber-500/20 text-amber-400' :
                      'bg-green-500/20 text-green-400'
                    }`}>
                      Risk: {selectedNode.risk_score}
                    </span>
                  )}
                </div>

                {selectedNode.bank_name && (
                  <div>
                    <div className="text-xs text-dark-400 mb-1">สถาบัน</div>
                    <div className="text-sm text-white">{selectedNode.bank_name}</div>
                  </div>
                )}

                {selectedNode.identifier && (
                  <div>
                    <div className="text-xs text-dark-400 mb-1 flex items-center gap-1">
                      <Hash size={10} /> Identifier
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="text-xs text-primary-400 bg-dark-900 px-2 py-1 rounded truncate flex-1">
                        {selectedNode.identifier}
                      </code>
                      <button 
                        onClick={() => navigator.clipboard.writeText(selectedNode.identifier || '')}
                        className="p-1 hover:bg-dark-700 rounded"
                      >
                        <Copy size={12} className="text-dark-400" />
                      </button>
                    </div>
                  </div>
                )}

                {(() => {
                  const { totalIn, totalOut, incoming, outgoing } = getNodeTransactions(selectedNode);
                  return (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                        <div className="flex items-center gap-1 text-green-400 mb-1">
                          <ArrowDownLeft size={14} />
                          <span className="text-xs">รับเข้า</span>
                        </div>
                        <div className="text-sm font-semibold text-white">{formatCurrency(totalIn)}</div>
                        <div className="text-xs text-dark-400">{incoming.length} รายการ</div>
                      </div>
                      <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                        <div className="flex items-center gap-1 text-red-400 mb-1">
                          <ArrowUpRight size={14} />
                          <span className="text-xs">ส่งออก</span>
                        </div>
                        <div className="text-sm font-semibold text-white">{formatCurrency(totalOut)}</div>
                        <div className="text-xs text-dark-400">{outgoing.length} รายการ</div>
                      </div>
                    </div>
                  );
                })()}

                {selectedNode.notes && (
                  <div>
                    <div className="text-xs text-dark-400 mb-1">หมายเหตุ</div>
                    <div className="text-sm text-dark-300 bg-dark-900 p-2 rounded">{selectedNode.notes}</div>
                  </div>
                )}
              </div>
            </div>
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
};

export default MoneyFlowGraph;
