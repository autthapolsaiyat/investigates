/**
 * MoneyFlowGraph - Professional Forensic Money Flow Visualization
 * Using Cytoscape.js - Industry Standard (like FBI/CIA tools)
 * 
 * Features:
 * - Multiple layouts (Force, Circle, Grid, Tree, Radial)
 * - Risk scoring with color coding
 * - Suspect/Victim markers
 * - Transaction flow visualization
 * - Fullscreen mode
 * - PNG/SVG export
 * - Click to highlight connections
 */
// @ts-ignore
import CytoscapeComponent from 'react-cytoscapejs';
import type { Core } from 'cytoscape';
import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  ZoomOut,
  RotateCcw,
  Download,
  Sun,
  Moon,
  Layout,
  Circle,
  GitBranch,
  Grid3X3,
  Workflow,
  Target,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { Button } from '../../components/ui';
// @ts-ignore
import cytoscape from 'cytoscape';
// @ts-ignore
import cytoscapeSvg from 'cytoscape-svg';
import type { MoneyFlowNode, MoneyFlowEdge } from './types';

cytoscape.use(cytoscapeSvg);

type LayoutType = 'cose' | 'circle' | 'grid' | 'breadthfirst' | 'concentric';

// Node type configuration - FBI/i2 Analyst's Notebook Style
// Using muted professional colors with clear icons
const NODE_CONFIG: Record<string, { emoji: string; color: string; borderColor: string; label: string }> = {
  bank_account: { emoji: '🏦', color: '#DBEAFE', borderColor: '#2563EB', label: 'Bank Account' },
  crypto_wallet: { emoji: '₿', color: '#FEF3C7', borderColor: '#D97706', label: 'Crypto Wallet' },
  person: { emoji: '👤', color: '#D1FAE5', borderColor: '#059669', label: 'Person' },
  company: { emoji: '🏢', color: '#EDE9FE', borderColor: '#7C3AED', label: 'Company' },
  exchange: { emoji: '🔄', color: '#FCE7F3', borderColor: '#DB2777', label: 'Exchange' },
  suspect: { emoji: '⚠️', color: '#FEE2E2', borderColor: '#DC2626', label: 'Suspect' },
  victim: { emoji: '🛡️', color: '#CFFAFE', borderColor: '#0891B2', label: 'Victim' },
  unknown: { emoji: '❓', color: '#F3F4F6', borderColor: '#6B7280', label: 'Unknown' },
};

// Edge type colors - Professional thin lines
const EDGE_COLORS: Record<string, string> = {
  bank_transfer: '#2563EB',    // Blue - bank transfers
  crypto_transfer: '#D97706',  // Amber - crypto transfers  
  cash: '#059669',             // Green - cash
  other: '#6B7280',            // Gray - other
};

// Format currency
const formatCurrency = (amount: number | undefined): string => {
  if (!amount) return '฿0';
  if (amount >= 1000000) return `฿${(amount / 1000000).toFixed(2)}M`;
  if (amount >= 1000) return `฿${(amount / 1000).toFixed(1)}K`;
  return `฿${amount.toLocaleString()}`;
};

// Get node display properties
const getNodeDisplay = (node: MoneyFlowNode) => {
  if (node.is_suspect) return NODE_CONFIG.suspect;
  if (node.is_victim) return NODE_CONFIG.victim;
  return NODE_CONFIG[node.node_type] || NODE_CONFIG.unknown;
};

// Format node label - cleaner without emoji for professional look
const formatNodeLabel = (node: MoneyFlowNode): string => {
  const riskBadge = node.risk_score && node.risk_score > 0 ? `\n[${node.risk_score}]` : '';
  return `${node.label}${riskBadge}`;
};

interface MoneyFlowGraphProps {
  nodes: MoneyFlowNode[];
  edges: MoneyFlowEdge[];
  onNodeClick?: (node: MoneyFlowNode) => void;
}

export const MoneyFlowGraph = ({ nodes, edges, onNodeClick }: MoneyFlowGraphProps) => {
  const [cyInstance, setCyInstance] = useState<Core | null>(null);
  const [layoutType, setLayoutType] = useState<LayoutType>('cose');
  const [darkMode, setDarkMode] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<MoneyFlowNode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  // Listen for fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Calculate summary
  const summary = useMemo(() => {
    const totalFlow = edges.reduce((sum, e) => sum + (e.amount || 0), 0);
    const suspectCount = nodes.filter(n => n.is_suspect).length;
    const victimCount = nodes.filter(n => n.is_victim).length;
    const highRiskCount = nodes.filter(n => (n.risk_score || 0) >= 70).length;
    return {
      nodeCount: nodes.length,
      edgeCount: edges.length,
      totalFlow,
      suspectCount,
      victimCount,
      highRiskCount,
    };
  }, [nodes, edges]);

  // Build Cytoscape elements
  const elements = useMemo(() => {
    // Create nodes - FBI/i2 style with light fill and dark border
    const cyNodes = nodes.map(node => {
      const display = getNodeDisplay(node);
      
      // Border color: Red for suspect, Cyan for victim, otherwise type color
      const borderColor = node.is_suspect ? '#DC2626' : 
                         node.is_victim ? '#0891B2' : 
                         display.borderColor;
      
      // Border width: thicker for suspect/victim
      const borderWidth = node.is_suspect ? 4 : node.is_victim ? 3 : 2;
      
      return {
        data: {
          id: String(node.id),
          label: formatNodeLabel(node),
          type: node.node_type,
          emoji: display.emoji,
          color: display.color,
          borderColor: borderColor,
          borderWidth: borderWidth,
          size: 55,
          isSuspect: node.is_suspect || false,
          isVictim: node.is_victim || false,
          nodeData: node,
        }
      };
    });

    // Create edges - thin professional lines
    const cyEdges = edges.map(edge => ({
      data: {
        id: `edge-${edge.id}`,
        source: String(edge.from_node_id),
        target: String(edge.to_node_id),
        label: edge.amount ? formatCurrency(edge.amount) : '',
        color: EDGE_COLORS[edge.edge_type] || EDGE_COLORS.other,
        width: Math.min(Math.max((edge.amount || 0) / 100000, 1.5), 4),
        edgeData: edge,
      }
    }));

    return [...cyNodes, ...cyEdges];
  }, [nodes, edges]);

  // Cytoscape stylesheet - FBI/i2 Analyst's Notebook Style
  const stylesheet: any[] = [
    {
      selector: 'node',
      style: {
        'background-color': 'data(color)',
        'background-opacity': 1,
        'border-color': 'data(borderColor)',
        'border-width': 'data(borderWidth)',
        'border-opacity': 1,
        'width': 'data(size)',
        'height': 'data(size)',
        'label': 'data(label)',
        'text-valign': 'bottom',
        'text-halign': 'center',
        'text-margin-y': 5,
        'font-size': 9,
        'font-weight': 600,
        'color': darkMode ? '#E5E7EB' : '#1F2937',
        'text-outline-color': darkMode ? '#0f172a' : '#ffffff',
        'text-outline-width': 1.5,
        'text-wrap': 'wrap',
        'text-max-width': '80px',
      }
    },
    {
      selector: 'node[?isSuspect]',
      style: {
        'border-color': '#DC2626',
        'border-width': 4,
        'border-style': 'solid',
        'background-color': '#FEE2E2',
      }
    },
    {
      selector: 'node[?isVictim]',
      style: {
        'border-color': '#0891B2',
        'border-width': 3,
        'border-style': 'solid',
        'background-color': '#CFFAFE',
      }
    },
    {
      selector: 'node:selected',
      style: {
        'border-color': '#F59E0B',
        'border-width': 4,
        'overlay-color': '#F59E0B',
        'overlay-opacity': 0.2,
      }
    },
    {
      selector: 'node.highlighted',
      style: {
        'border-color': '#10B981',
        'border-width': 4,
        'overlay-color': '#10B981',
        'overlay-opacity': 0.15,
      }
    },
    {
      selector: 'node.faded',
      style: {
        'opacity': 0.2,
      }
    },
    {
      selector: 'edge',
      style: {
        'width': 'data(width)',
        'line-color': 'data(color)',
        'line-opacity': 0.7,
        'target-arrow-color': 'data(color)',
        'target-arrow-shape': 'triangle',
        'arrow-scale': 0.8,
        'curve-style': 'bezier',
        'label': 'data(label)',
        'font-size': 8,
        'font-weight': 500,
        'color': darkMode ? '#9CA3AF' : '#4B5563',
        'text-outline-color': darkMode ? '#0f172a' : '#ffffff',
        'text-outline-width': 1,
        'text-rotation': 'autorotate',
        'text-margin-y': -6,
      }
    },
    {
      selector: 'edge:selected',
      style: {
        'line-color': '#F59E0B',
        'target-arrow-color': '#F59E0B',
        'width': 3,
        'line-opacity': 1,
      }
    },
    {
      selector: 'edge.highlighted',
      style: {
        'line-color': '#10B981',
        'target-arrow-color': '#10B981',
        'line-opacity': 1,
        'width': 2.5,
      }
    },
    {
      selector: 'edge.faded',
      style: {
        'opacity': 0.1,
      }
    },
  ];

  // Layout config
  const layoutConfig = useMemo(() => ({
    name: layoutType,
    animate: false,
    fit: true,
    padding: 50,
    ...(layoutType === 'cose' ? {
      nodeRepulsion: 15000,
      idealEdgeLength: 150,
      gravity: 0.25,
      numIter: 1000,
    } : {}),
    ...(layoutType === 'breadthfirst' ? {
      directed: true,
      spacingFactor: 1.5,
    } : {}),
    ...(layoutType === 'concentric' ? {
      minNodeSpacing: 80,
    } : {}),
  }), [layoutType]);

  // Cytoscape ready handler
  const handleCyReady = useCallback((cy: Core) => {
    setCyInstance(cy);

    // Node click - highlight connections
    cy.on('tap', 'node', (evt) => {
      cy.elements().removeClass('highlighted faded');
      const node = evt.target;
      const connected = node.neighborhood().add(node);
      connected.addClass('highlighted');
      cy.elements().not(connected).addClass('faded');
      
      // Get node data
      const nodeData = node.data('nodeData') as MoneyFlowNode;
      setSelectedNode(nodeData);
      if (onNodeClick) onNodeClick(nodeData);
    });

    // Background click - reset
    cy.on('tap', (evt) => {
      if (evt.target === cy) {
        cy.elements().removeClass('highlighted faded');
        setSelectedNode(null);
      }
    });
  }, [onNodeClick]);

  // Change layout
  const changeLayout = useCallback((newLayout: LayoutType) => {
    setLayoutType(newLayout);
    if (cyInstance) {
      cyInstance.layout({
        name: newLayout,
        animate: true,
        animationDuration: 500,
        fit: true,
        padding: 50,
        ...(newLayout === 'cose' ? { nodeRepulsion: 15000, idealEdgeLength: 150, gravity: 0.25 } : {}),
        ...(newLayout === 'breadthfirst' ? { directed: true, spacingFactor: 1.5 } : {}),
        ...(newLayout === 'concentric' ? { minNodeSpacing: 80 } : {}),
      }).run();
    }
  }, [cyInstance]);

  // Export PNG
  const handleExportPNG = useCallback(() => {
    if (!cyInstance) return;
    const png = cyInstance.png({ full: true, scale: 2, bg: darkMode ? '#0f172a' : '#ffffff' });
    const link = document.createElement('a');
    link.download = `money-flow-${new Date().toISOString().slice(0, 10)}.png`;
    link.href = png;
    link.click();
  }, [cyInstance, darkMode]);

  // Export SVG
  const handleExportSVG = useCallback(() => {
    if (!cyInstance) return;
    const svg = (cyInstance as any).svg({ full: true, scale: 2, bg: darkMode ? '#0f172a' : '#ffffff' });
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `money-flow-${new Date().toISOString().slice(0, 10)}.svg`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  }, [cyInstance, darkMode]);

  // Reset view
  const handleReset = useCallback(() => {
    if (cyInstance) {
      cyInstance.fit();
      cyInstance.elements().removeClass('highlighted faded');
      setSelectedNode(null);
    }
  }, [cyInstance]);

  const layouts: { id: LayoutType; label: string; icon: typeof Layout }[] = [
    { id: 'cose', label: 'Force', icon: Workflow },
    { id: 'circle', label: 'Circle', icon: Circle },
    { id: 'grid', label: 'Grid', icon: Grid3X3 },
    { id: 'breadthfirst', label: 'Tree', icon: GitBranch },
    { id: 'concentric', label: 'Radial', icon: Target },
  ];

  const legends = [
    { ...NODE_CONFIG.bank_account },
    { ...NODE_CONFIG.crypto_wallet },
    { ...NODE_CONFIG.person },
    { ...NODE_CONFIG.company },
    { ...NODE_CONFIG.exchange },
    { ...NODE_CONFIG.suspect },
    { ...NODE_CONFIG.victim },
  ];

  return (
    <div 
      ref={containerRef}
      className={`h-full flex flex-col ${darkMode ? 'bg-dark-900' : 'bg-gray-100'} ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}
    >
      {/* Toolbar */}
      <div className={`p-3 border-b ${darkMode ? 'border-dark-700 bg-dark-800' : 'border-gray-200 bg-white'} flex items-center justify-between flex-wrap gap-2`}>
        <div className="flex items-center gap-4">
          {/* Layout selector */}
          <div className="flex items-center gap-2">
            <span className={`text-sm font-medium ${darkMode ? 'text-dark-300' : 'text-gray-600'}`}>Layout:</span>
            <div className={`flex items-center rounded-lg p-1 ${darkMode ? 'bg-dark-700' : 'bg-gray-100'}`}>
              {layouts.map(l => {
                const Icon = l.icon;
                return (
                  <button
                    key={l.id}
                    onClick={() => changeLayout(l.id)}
                    className={`p-1.5 rounded transition-colors ${layoutType === l.id ? 'bg-primary-500/20 text-primary-400' : darkMode ? 'text-dark-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}
                    title={l.label}
                  >
                    <Icon size={14} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Summary badges */}
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded text-xs ${darkMode ? 'bg-dark-700 text-dark-300' : 'bg-gray-200 text-gray-600'}`}>
              {summary.nodeCount} Nodes
            </span>
            <span className={`px-2 py-1 rounded text-xs ${darkMode ? 'bg-dark-700 text-dark-300' : 'bg-gray-200 text-gray-600'}`}>
              {summary.edgeCount} transactions
            </span>
            <span className={`px-2 py-1 rounded text-xs bg-amber-500/20 text-amber-400`}>
              {formatCurrency(summary.totalFlow)}
            </span>
            {summary.suspectCount > 0 && (
              <span className="px-2 py-1 rounded text-xs bg-red-500/20 text-red-400">
                ⚠️ {summary.suspectCount} Suspect
              </span>
            )}
            {summary.highRiskCount > 0 && (
              <span className="px-2 py-1 rounded text-xs bg-orange-500/20 text-orange-400">
                🔥 {summary.highRiskCount} High Risk
              </span>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleExportPNG}>
            <Download size={14} className="mr-1" /> PNG
          </Button>
          <Button variant="ghost" size="sm" onClick={handleExportSVG}>
            <Download size={14} className="mr-1" /> SVG
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? <Sun size={14} /> : <Moon size={14} />}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => cyInstance?.fit()}>
            <ZoomOut size={14} />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleReset}>
            <RotateCcw size={14} />
          </Button>
          <Button variant="ghost" size="sm" onClick={toggleFullscreen} title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}>
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </Button>
        </div>
      </div>

      {/* Graph */}
      <div 
        className={`flex-1 relative ${darkMode ? 'bg-dark-950' : 'bg-gray-50'}`}
        style={{ minHeight: isFullscreen ? 'calc(100vh - 120px)' : '500px' }}
      >
        <CytoscapeComponent
          elements={elements}
          stylesheet={stylesheet}
          layout={layoutConfig}
          cy={handleCyReady}
          style={{ width: '100%', height: '100%' }}
          minZoom={0.2}
          maxZoom={3}
          boxSelectionEnabled={true}
          userZoomingEnabled={true}
          userPanningEnabled={true}
        />

        {/* Instructions */}
        <div className={`absolute bottom-3 left-3 flex items-center gap-3 text-xs px-3 py-2 rounded-lg ${darkMode ? 'bg-dark-900/90 text-dark-400' : 'bg-white/90 text-gray-500'}`}>
          <span>🖱️ Drag Node</span>
          <span>🔍 Scroll to Zoom</span>
          <span>👆 Click to view Connections</span>
        </div>

        {/* Selected Node Info */}
        {selectedNode && (
          <div className={`absolute top-3 right-3 w-72 rounded-xl border shadow-xl ${darkMode ? 'bg-dark-800/95 border-dark-600' : 'bg-white/95 border-gray-200'}`}>
            <div className={`p-3 border-b ${darkMode ? 'border-dark-700' : 'border-gray-200'}`}>
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                  style={{ backgroundColor: getNodeDisplay(selectedNode).color }}
                >
                  {getNodeDisplay(selectedNode).emoji}
                </div>
                <div>
                  <div className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedNode.label}</div>
                  <div className={`text-xs ${darkMode ? 'text-dark-400' : 'text-gray-500'}`}>
                    {getNodeDisplay(selectedNode).label}
                  </div>
                </div>
              </div>
            </div>
            <div className="p-3 space-y-2">
              {selectedNode.bank_name && (
                <div className={`text-xs ${darkMode ? 'text-dark-300' : 'text-gray-600'}`}>
                  🏦 {selectedNode.bank_name}
                </div>
              )}
              {selectedNode.identifier && (
                <div className={`text-xs font-mono ${darkMode ? 'text-primary-400' : 'text-blue-600'}`}>
                  {selectedNode.identifier}
                </div>
              )}
              {selectedNode.risk_score !== undefined && selectedNode.risk_score > 0 && (
                <div className={`inline-block px-2 py-1 rounded text-xs ${
                  selectedNode.risk_score >= 70 ? 'bg-red-500/20 text-red-400' :
                  selectedNode.risk_score >= 40 ? 'bg-amber-500/20 text-amber-400' :
                  'bg-green-500/20 text-green-400'
                }`}>
                  Risk Score: {selectedNode.risk_score}
                </div>
              )}
              {selectedNode.notes && (
                <div className={`text-xs ${darkMode ? 'text-dark-400 bg-dark-900' : 'text-gray-500 bg-gray-100'} p-2 rounded`}>
                  {selectedNode.notes}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className={`p-3 border-t ${darkMode ? 'border-dark-700 bg-dark-800' : 'border-gray-200 bg-white'}`}>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {legends.map(item => (
            <div key={item.label} className="flex items-center gap-2 text-xs">
              <span className="text-lg">{item.emoji}</span>
              <span className={darkMode ? 'text-dark-300' : 'text-gray-600'}>{item.label}</span>
            </div>
          ))}
        </div>
        <div className={`flex items-center gap-4 mt-2 pt-2 border-t ${darkMode ? 'border-dark-700' : 'border-gray-200'}`}>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-8 h-1 rounded" style={{ backgroundColor: EDGE_COLORS.bank_transfer }} />
            <span className={darkMode ? 'text-dark-400' : 'text-gray-500'}>Bank Transfer</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-8 h-1 rounded" style={{ backgroundColor: EDGE_COLORS.crypto_transfer }} />
            <span className={darkMode ? 'text-dark-400' : 'text-gray-500'}>Crypto</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-8 h-1 rounded" style={{ backgroundColor: EDGE_COLORS.cash }} />
            <span className={darkMode ? 'text-dark-400' : 'text-gray-500'}>Cash</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MoneyFlowGraph;
