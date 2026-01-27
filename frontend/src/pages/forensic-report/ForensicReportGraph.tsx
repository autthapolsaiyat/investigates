/**
 * ForensicReportGraph - Professional Forensic Network Visualization
 * Using Cytoscape.js - Industry Standard (like FBI/CIA tools)
 * 
 * Features:
 * - Multiple layouts including Hierarchical
 * - Risk scoring with color coding
 * - Suspect/Victim/Mule markers
 * - Transaction flow visualization
 * - Fullscreen mode
 * - PNG/SVG export
 * - Click to highlight connections
 * - Search & Filter
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
  Circle,
  GitBranch,
  Grid3X3,
  Workflow,
  Target,
  Maximize2,
  Minimize2,
  Search,
  Filter
} from 'lucide-react';
import { Button } from '../../components/ui';
import type { MoneyFlowNode, MoneyFlowEdge } from '../../services/api';
// @ts-ignore
import cytoscape from 'cytoscape';
// @ts-ignore
import cytoscapeSvg from 'cytoscape-svg';

cytoscape.use(cytoscapeSvg);

type LayoutType = 'breadthfirst' | 'cose' | 'circle' | 'grid' | 'concentric';

// Node type configuration - FBI/i2 Style
const NODE_CONFIG: Record<string, { emoji: string; color: string; borderColor: string; label: string; riskLevel: number }> = {
  boss: { emoji: '👑', color: '#FEE2E2', borderColor: '#DC2626', label: 'Network Boss', riskLevel: 100 },
  suspect: { emoji: '⚠️', color: '#FFEDD5', borderColor: '#EA580C', label: 'Suspect', riskLevel: 80 },
  victim: { emoji: '🛡️', color: '#D1FAE5', borderColor: '#059669', label: 'Victim', riskLevel: 0 },
  mule: { emoji: '🏦', color: '#FEF3C7', borderColor: '#D97706', label: 'Mule Account', riskLevel: 60 },
  crypto: { emoji: '₿', color: '#EDE9FE', borderColor: '#7C3AED', label: 'Crypto Wallet', riskLevel: 40 },
  exchange: { emoji: '🔄', color: '#DBEAFE', borderColor: '#2563EB', label: 'Exchange', riskLevel: 20 },
  person: { emoji: '👤', color: '#F3F4F6', borderColor: '#6B7280', label: 'Person', riskLevel: 10 },
};

// Edge type colors - Professional thin lines
const EDGE_COLORS: Record<string, string> = {
  bank_transfer: '#2563EB',
  crypto_transfer: '#7C3AED',
  crypto_purchase: '#DB2777',
  deposit: '#0891B2',
  transfer: '#059669',
  other: '#6B7280',
};

// Format currency
const formatCurrency = (amount: number | undefined): string => {
  if (!amount) return '฿0';
  if (amount >= 1000000) return `฿${(amount / 1000000).toFixed(2)}M`;
  if (amount >= 1000) return `฿${(amount / 1000).toFixed(1)}K`;
  return `฿${amount.toLocaleString()}`;
};

// Get node group/type
const getNodeGroup = (node: MoneyFlowNode): string => {
  if (node.is_suspect && node.label?.includes('Boss')) return 'boss';
  if (node.is_suspect) return 'suspect';
  if (node.is_victim) return 'victim';
  if (node.node_type === 'crypto_wallet') return 'crypto';
  if (node.node_type === 'exchange') return 'exchange';
  if (node.node_type === 'bank_account') return 'mule';
  return 'person';
};

// Get node display properties
const getNodeDisplay = (node: MoneyFlowNode) => {
  const group = getNodeGroup(node);
  return NODE_CONFIG[group] || NODE_CONFIG.person;
};

// Format node label
const formatNodeLabel = (node: MoneyFlowNode): string => {
  const display = getNodeDisplay(node);
  const riskBadge = node.risk_score && node.risk_score > 0 ? ` [${node.risk_score}]` : '';
  return `${display.emoji}\n${node.label}${riskBadge}`;
};

interface ForensicReportGraphProps {
  nodes: MoneyFlowNode[];
  edges: MoneyFlowEdge[];
  onNodeClick?: (node: MoneyFlowNode) => void;
}

export const ForensicReportGraph = ({ nodes, edges, onNodeClick }: ForensicReportGraphProps) => {
  const [cyInstance, setCyInstance] = useState<Core | null>(null);
  const [layoutType, setLayoutType] = useState<LayoutType>('breadthfirst');
  const [darkMode, setDarkMode] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<MoneyFlowNode | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
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

  // Filter nodes
  const filteredNodes = useMemo(() => {
    let result = nodes;
    
    // Apply type filter
    if (filterType !== 'all') {
      result = result.filter(n => {
        if (filterType === 'suspects') return n.is_suspect;
        if (filterType === 'victims') return n.is_victim;
        if (filterType === 'mules') return n.node_type === 'bank_account' && !n.is_suspect;
        if (filterType === 'crypto') return n.node_type === 'crypto_wallet';
        return true;
      });
    }
    
    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(n => 
        n.label?.toLowerCase().includes(query) ||
        n.identifier?.toLowerCase().includes(query)
      );
    }
    
    return result;
  }, [nodes, filterType, searchQuery]);

  // Filter edges based on filtered nodes
  const filteredEdges = useMemo(() => {
    const nodeIds = new Set(filteredNodes.map(n => n.id));
    return edges.filter(e => nodeIds.has(e.from_node_id) && nodeIds.has(e.to_node_id));
  }, [edges, filteredNodes]);

  // Calculate summary
  const summary = useMemo(() => {
    const totalFlow = filteredEdges.reduce((sum, e) => sum + (e.amount || 0), 0);
    const suspectCount = filteredNodes.filter(n => n.is_suspect).length;
    const victimCount = filteredNodes.filter(n => n.is_victim).length;
    const highRiskCount = filteredNodes.filter(n => (n.risk_score || 0) >= 70).length;
    return {
      nodeCount: filteredNodes.length,
      edgeCount: filteredEdges.length,
      totalFlow,
      suspectCount,
      victimCount,
      highRiskCount,
    };
  }, [filteredNodes, filteredEdges]);

  // Build Cytoscape elements
  const elements = useMemo(() => {
    // Create nodes - FBI/i2 style with visual hierarchy
    const cyNodes = filteredNodes.map(node => {
      const display = getNodeDisplay(node);
      const riskScore = node.risk_score || 0;
      
      // Size based on importance
      let size = 55;
      const group = getNodeGroup(node);
      if (group === 'boss') {
        size = 90;
      } else if (group === 'suspect') {
        size = 75;
      } else if (group === 'victim') {
        size = 70;
      } else if (riskScore >= 50) {
        size = 65;
      }
      
      // Border color and width based on risk
      let borderColor = display.borderColor;
      let borderWidth = 2;
      
      if (group === 'boss') {
        borderWidth = 5;
      } else if (group === 'suspect') {
        borderWidth = 4;
      } else if (group === 'victim') {
        borderWidth = 3;
      } else if (riskScore >= 50) {
        borderWidth = 3;
        borderColor = '#DC2626';
      }
      
      // Background color - darker for high risk
      let bgColor = display.color;
      if (group === 'boss') {
        bgColor = '#FCA5A5';
      } else if (riskScore >= 70) {
        bgColor = '#FECACA';
      } else if (riskScore >= 40) {
        bgColor = '#FDE68A';
      }
      
      return {
        data: {
          id: String(node.id),
          label: formatNodeLabel(node),
          type: group,
          color: bgColor,
          borderColor: borderColor,
          borderWidth: borderWidth,
          size: size,
          riskScore: riskScore,
          nodeData: node,
        }
      };
    });

    // Create edges - thin professional lines
    const cyEdges = filteredEdges.map(edge => ({
      data: {
        id: `edge-${edge.id}`,
        source: String(edge.from_node_id),
        target: String(edge.to_node_id),
        label: edge.amount ? formatCurrency(edge.amount) : '',
        color: EDGE_COLORS[edge.edge_type || 'transfer'] || EDGE_COLORS.other,
        width: Math.min(Math.max((edge.amount || 0) / 100000, 1.5), 4),
        edgeData: edge,
      }
    }));

    return [...cyNodes, ...cyEdges];
  }, [filteredNodes, filteredEdges]);

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
        'text-valign': 'center',
        'text-halign': 'center',
        'font-size': 9,
        'font-weight': 600,
        'color': '#1F2937',
        'text-outline-color': '#ffffff',
        'text-outline-width': 1.5,
        'text-wrap': 'wrap',
        'text-max-width': '75px',
      }
    },
    {
      selector: 'node[riskScore >= 50]',
      style: {
        'font-size': 10,
        'font-weight': 700,
      }
    },
    {
      selector: 'node[type = "boss"]',
      style: {
        'font-size': 11,
        'font-weight': 700,
      }
    },
    {
      selector: 'node:selected',
      style: {
        'border-color': '#7C3AED',
        'border-width': 5,
        'overlay-color': '#7C3AED',
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
        'line-opacity': 0.75,
        'target-arrow-color': 'data(color)',
        'target-arrow-shape': 'triangle',
        'arrow-scale': 0.8,
        'curve-style': 'bezier',
        'label': 'data(label)',
        'font-size': 9,
        'font-weight': 600,
        'color': darkMode ? '#E5E7EB' : '#374151',
        'text-outline-color': darkMode ? '#0f172a' : '#ffffff',
        'text-outline-width': 2,
        'text-rotation': 'autorotate',
        'text-margin-y': -8,
      }
    },
    {
      selector: 'edge:selected',
      style: {
        'line-color': '#7C3AED',
        'target-arrow-color': '#7C3AED',
        'line-opacity': 1,
        'width': 3,
      }
    },
    {
      selector: 'edge.highlighted',
      style: {
        'line-color': '#10B981',
        'target-arrow-color': '#10B981',
        'line-opacity': 1,
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
  const layoutConfig = useMemo(() => {
    const baseConfig = {
      name: layoutType,
      animate: false,
      fit: true,
      padding: 50,
    };

    switch (layoutType) {
      case 'cose':
        return {
          ...baseConfig,
          nodeRepulsion: 15000,
          idealEdgeLength: 150,
          gravity: 0.25,
          numIter: 1000,
        };
      case 'breadthfirst':
        return {
          ...baseConfig,
          directed: true,
          spacingFactor: 1.5,
          circle: false,
        };
      case 'concentric':
        return {
          ...baseConfig,
          minNodeSpacing: 80,
        };
      default:
        return baseConfig;
    }
  }, [layoutType]);

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
      const config: any = {
        name: newLayout,
        animate: true,
        animationDuration: 500,
        fit: true,
        padding: 50,
      };

      if (newLayout === 'cose') {
        config.nodeRepulsion = 15000;
        config.idealEdgeLength = 150;
        config.gravity = 0.25;
      } else if (newLayout === 'breadthfirst') {
        config.directed = true;
        config.spacingFactor = 1.5;
        config.circle = false;
      } else if (newLayout === 'concentric') {
        config.minNodeSpacing = 80;
      }

      cyInstance.layout(config).run();
    }
  }, [cyInstance]);

  // Export PNG
  const handleExportPNG = useCallback(() => {
    if (!cyInstance) return;
    const png = cyInstance.png({ full: true, scale: 2, bg: darkMode ? '#0f172a' : '#ffffff' });
    const link = document.createElement('a');
    link.download = `forensic-report-${new Date().toISOString().slice(0, 10)}.png`;
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
    link.download = `forensic-report-${new Date().toISOString().slice(0, 10)}.svg`;
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

  const layouts: { id: LayoutType; label: string; icon: typeof Workflow }[] = [
    { id: 'breadthfirst', label: 'Hierarchy', icon: GitBranch },
    { id: 'cose', label: 'Force', icon: Workflow },
    { id: 'circle', label: 'Circle', icon: Circle },
    { id: 'grid', label: 'Grid', icon: Grid3X3 },
    { id: 'concentric', label: 'Radial', icon: Target },
  ];

  const filterOptions = [
    { id: 'all', label: 'All' },
    { id: 'suspects', label: 'Suspect' },
    { id: 'victims', label: 'Victim' },
    { id: 'mules', label: 'Mule Account' },
    { id: 'crypto', label: 'Crypto' },
  ];

  const legends = [
    NODE_CONFIG.boss,
    NODE_CONFIG.suspect,
    NODE_CONFIG.victim,
    NODE_CONFIG.mule,
    NODE_CONFIG.crypto,
    NODE_CONFIG.exchange,
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

          {/* Filter */}
          <div className="flex items-center gap-2">
            <Filter size={14} className={darkMode ? 'text-dark-400' : 'text-gray-500'} />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className={`text-sm rounded-lg px-2 py-1 ${darkMode ? 'bg-dark-700 text-white border-dark-600' : 'bg-white text-gray-900 border-gray-200'} border`}
            >
              {filterOptions.map(opt => (
                <option key={opt.id} value={opt.id}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={14} className={`absolute left-2 top-1/2 -translate-y-1/2 ${darkMode ? 'text-dark-400' : 'text-gray-500'}`} />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`text-sm rounded-lg pl-7 pr-3 py-1 w-40 ${darkMode ? 'bg-dark-700 text-white border-dark-600 placeholder-dark-400' : 'bg-white text-gray-900 border-gray-200'} border`}
            />
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
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          {legends.map(item => (
            <div key={item.label} className="flex items-center gap-2 text-xs">
              <div 
                className="w-6 h-6 rounded-full flex items-center justify-center text-sm"
                style={{ 
                  backgroundColor: item.color, 
                  border: `2px solid ${item.borderColor}`,
                }}
              >
                {item.emoji}
              </div>
              <span className={darkMode ? 'text-dark-300' : 'text-gray-600'}>{item.label}</span>
            </div>
          ))}
        </div>
        <div className={`flex items-center gap-6 mt-2 pt-2 border-t ${darkMode ? 'border-dark-700' : 'border-gray-200'}`}>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-6 h-0.5 rounded" style={{ backgroundColor: EDGE_COLORS.bank_transfer }} />
            <span className={darkMode ? 'text-dark-400' : 'text-gray-500'}>Transfer</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-6 h-0.5 rounded" style={{ backgroundColor: EDGE_COLORS.crypto_transfer }} />
            <span className={darkMode ? 'text-dark-400' : 'text-gray-500'}>Crypto</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-6 h-0.5 rounded" style={{ backgroundColor: EDGE_COLORS.crypto_purchase }} />
            <span className={darkMode ? 'text-dark-400' : 'text-gray-500'}>Purchase</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForensicReportGraph;
