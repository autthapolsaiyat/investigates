/**
 * CryptoGraph - Professional Transaction Flow Visualization
 * Using Cytoscape.js - Industry Standard (like FBI/CIA tools)
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
import type { WalletInfo, Transaction, KnownEntity } from '../../services/blockchainApi';
// @ts-ignore
import cytoscape from 'cytoscape';
// @ts-ignore
import cytoscapeSvg from 'cytoscape-svg';

cytoscape.use(cytoscapeSvg);

interface CryptoGraphProps {
  walletInfo: WalletInfo;
  transactions: Transaction[];
  getKnownEntity: (address: string) => KnownEntity | null;
}

type LayoutType = 'cose' | 'circle' | 'grid' | 'breadthfirst' | 'concentric';

// Entity type config - FBI/i2 Style with light bg + dark border
const ENTITY_CONFIG: Record<string, { emoji: string; color: string; borderColor: string; label: string; riskLevel: number }> = {
  main: { emoji: '💎', color: '#DBEAFE', borderColor: '#2563EB', label: 'Main Wallet', riskLevel: 0 },
  exchange: { emoji: '🏦', color: '#D1FAE5', borderColor: '#059669', label: 'Exchange', riskLevel: 0 },
  mixer: { emoji: '🌀', color: '#FEE2E2', borderColor: '#DC2626', label: 'Mixer', riskLevel: 80 },
  defi: { emoji: '📊', color: '#EDE9FE', borderColor: '#7C3AED', label: 'DeFi', riskLevel: 20 },
  bridge: { emoji: '🌉', color: '#FEF3C7', borderColor: '#D97706', label: 'Bridge', riskLevel: 30 },
  scam: { emoji: '⚠️', color: '#FEE2E2', borderColor: '#DC2626', label: 'Scam', riskLevel: 100 },
  gambling: { emoji: '🎰', color: '#FFEDD5', borderColor: '#EA580C', label: 'Gambling', riskLevel: 60 },
  nft: { emoji: '🎨', color: '#FCE7F3', borderColor: '#DB2777', label: 'NFT', riskLevel: 10 },
  darknet: { emoji: '🕵️', color: '#FEE2E2', borderColor: '#991B1B', label: 'Darknet', riskLevel: 100 },
  unknown: { emoji: '❓', color: '#F3F4F6', borderColor: '#6B7280', label: 'Unknown', riskLevel: 40 },
};

// Get entity config
const getEntityConfig = (type: string) => {
  return ENTITY_CONFIG[type] || ENTITY_CONFIG.unknown;
};

// Entity type to emoji
const getEntityEmoji = (type: string): string => {
  return getEntityConfig(type).emoji;
};

// Entity type to color - now returns border color for backward compat
const getEntityColor = (type: string): string => {
  return getEntityConfig(type).borderColor;
};

// Format address
const formatAddress = (addr: string, length: number = 6): string => {
  if (!addr) return '';
  return `${addr.slice(0, length)}...${addr.slice(-length)}`;
};

// Format USD
const formatUSD = (amount: number): string => {
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(2)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}K`;
  return `$${amount.toFixed(2)}`;
};

export const CryptoGraph = ({ walletInfo, transactions, getKnownEntity }: CryptoGraphProps) => {
  const [cyInstance, setCyInstance] = useState<Core | null>(null);
  const [layoutType, setLayoutType] = useState<LayoutType>('cose');
  const [darkMode, setDarkMode] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
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

  // Listen for fullscreen change (when user presses ESC)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Build nodes and edges from transactions
  const elements = useMemo(() => {
    const nodeMap = new Map<string, { id: string; label: string; type: string; value: number }>();

    // Add main wallet
    nodeMap.set(walletInfo.address, {
      id: walletInfo.address,
      label: formatAddress(walletInfo.address),
      type: 'main',
      value: walletInfo.balanceUSD
    });

    // Add counterparties from transactions
    transactions.slice(0, 100).forEach(tx => {
      const counterparty = tx.type === 'in' ? tx.from : tx.to;
      if (!nodeMap.has(counterparty)) {
        const entity = getKnownEntity(counterparty);
        nodeMap.set(counterparty, {
          id: counterparty,
          label: entity?.name || formatAddress(counterparty),
          type: entity?.type || 'unknown',
          value: tx.valueUSD
        });
      }
    });

    // Create Cytoscape nodes with FBI-style visual hierarchy
    const nodes = Array.from(nodeMap.values()).map(n => {
      const config = getEntityConfig(n.type);
      const riskLevel = config.riskLevel;
      
      // Size based on importance
      let size = 50;
      if (n.type === 'main') {
        size = 80;
      } else if (riskLevel >= 80) {
        size = 70; // High risk = big
      } else if (riskLevel >= 50) {
        size = 60;
      }
      
      // Border width based on risk
      let borderWidth = 2;
      if (riskLevel >= 80) borderWidth = 4;
      else if (riskLevel >= 50) borderWidth = 3;
      
      // Background color - darker for high risk
      let bgColor = config.color;
      if (riskLevel >= 80) {
        bgColor = '#FCA5A5'; // Red tint
      } else if (riskLevel >= 50) {
        bgColor = '#FDE68A'; // Orange tint
      }
      
      return {
        data: {
          id: n.id,
          label: `${config.emoji}\n${n.label}`,
          type: n.type,
          color: bgColor,
          borderColor: config.borderColor,
          borderWidth: borderWidth,
          size: size,
          riskLevel: riskLevel,
        }
      };
    });

    // Create Cytoscape edges
    const edges = transactions.slice(0, 100).map(tx => ({
      data: {
        id: tx.hash,
        source: tx.from,
        target: tx.to,
        label: formatUSD(tx.valueUSD),
        color: tx.type === 'in' ? '#22c55e' : '#ef4444',
        width: Math.min(Math.max(tx.valueUSD / 5000, 1), 8),
      }
    }));

    return [...nodes, ...edges];
  }, [walletInfo, transactions, getKnownEntity]);

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
      selector: 'node[riskLevel >= 50]',
      style: {
        'font-size': 10,
        'font-weight': 700,
      }
    },
    {
      selector: 'node[riskLevel >= 80]',
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
  const layoutConfig = useMemo(() => ({
    name: layoutType,
    animate: false,
    fit: true,
    padding: 50,
    ...(layoutType === 'cose' ? {
      nodeRepulsion: 10000,
      idealEdgeLength: 120,
      gravity: 0.3,
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
    });

    // Background click - reset
    cy.on('tap', (evt) => {
      if (evt.target === cy) {
        cy.elements().removeClass('highlighted faded');
      }
    });
  }, []);

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
        ...(newLayout === 'cose' ? { nodeRepulsion: 10000, idealEdgeLength: 120, gravity: 0.3 } : {}),
      }).run();
    }
  }, [cyInstance]);

  // Export PNG
  const handleExportPNG = useCallback(() => {
    if (!cyInstance) return;
    const png = cyInstance.png({ full: true, scale: 2, bg: darkMode ? '#0f172a' : '#ffffff' });
    const link = document.createElement('a');
    link.download = `crypto-flow-${walletInfo.address.slice(0, 10)}-${new Date().toISOString().slice(0, 10)}.png`;
    link.href = png;
    link.click();
  }, [cyInstance, darkMode, walletInfo.address]);

  // Export SVG
  const handleExportSVG = useCallback(() => {
    if (!cyInstance) return;
    const svg = (cyInstance as any).svg({ full: true, scale: 2, bg: darkMode ? '#0f172a' : '#ffffff' });
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `crypto-flow-${walletInfo.address.slice(0, 10)}-${new Date().toISOString().slice(0, 10)}.svg`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  }, [cyInstance, darkMode, walletInfo.address]);

  // Reset
  const handleReset = useCallback(() => {
    if (cyInstance) {
      cyInstance.fit();
      cyInstance.elements().removeClass('highlighted faded');
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
    ENTITY_CONFIG.main,
    ENTITY_CONFIG.exchange,
    ENTITY_CONFIG.mixer,
    ENTITY_CONFIG.defi,
    ENTITY_CONFIG.bridge,
    ENTITY_CONFIG.gambling,
    ENTITY_CONFIG.nft,
    ENTITY_CONFIG.darknet,
    ENTITY_CONFIG.unknown,
  ];

  return (
    <div 
      ref={containerRef}
      className={`rounded-xl border ${darkMode ? 'bg-dark-900 border-dark-700' : 'bg-white border-gray-300'} ${isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''}`}
    >
      {/* Toolbar */}
      <div className={`p-3 border-b ${darkMode ? 'border-dark-700' : 'border-gray-200'} flex items-center justify-between flex-wrap gap-2`}>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${darkMode ? 'text-dark-300' : 'text-gray-600'}`}>Layout:</span>
          <div className={`flex items-center rounded-lg p-1 ${darkMode ? 'bg-dark-800' : 'bg-gray-100'}`}>
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
        className={`relative ${darkMode ? 'bg-dark-950' : 'bg-gray-50'} ${isFullscreen ? 'flex-1' : ''}`} 
        style={{ height: isFullscreen ? 'calc(100vh - 120px)' : '500px' }}
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

        {/* Stats overlay */}
        <div className={`absolute top-3 left-3 px-3 py-2 rounded-lg text-xs ${darkMode ? 'bg-dark-900/90 text-dark-300' : 'bg-white/90 text-gray-600'}`}>
          <div><strong>{elements.filter(e => "source" in e.data === false).length}</strong> Wallets</div>
          <div><strong>{elements.filter(e => "source" in e.data).length}</strong> Transactions</div>
        </div>

        {/* Instructions */}
        <div className={`absolute bottom-3 left-3 flex items-center gap-3 text-xs px-3 py-2 rounded-lg ${darkMode ? 'bg-dark-900/90 text-dark-400' : 'bg-white/90 text-gray-500'}`}>
          <span>🖱️ Drag Node</span>
          <span>🔍 Scroll Zoom</span>
          <span>👆 Click to View Connections</span>
        </div>
      </div>

      {/* Legend */}
      <div className={`p-3 border-t ${darkMode ? 'border-dark-700' : 'border-gray-200'}`}>
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
        <div className="flex items-center gap-6 mt-2 pt-2 border-t border-dark-700">
          <div className="flex items-center gap-2 text-xs">
            <div className="w-6 h-0.5 bg-green-500 rounded" />
            <span className={darkMode ? 'text-dark-400' : 'text-gray-500'}>Incoming</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-6 h-0.5 bg-red-500 rounded" />
            <span className={darkMode ? 'text-dark-400' : 'text-gray-500'}>Outgoing</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CryptoGraph;
