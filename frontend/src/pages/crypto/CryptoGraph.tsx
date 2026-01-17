/**
 * CryptoGraph - Professional Transaction Flow Visualization
 * Using Cytoscape.js - Industry Standard (like FBI/CIA tools)
 */
// @ts-ignore
import CytoscapeComponent from 'react-cytoscapejs';
import type { Core } from 'cytoscape';
import { useState, useMemo, useCallback } from 'react';
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
  Target
} from 'lucide-react';
import { Button } from '../../components/ui';
// @ts-ignore
import cytoscape from 'cytoscape';
// @ts-ignore
import cytoscapeSvg from 'cytoscape-svg';

cytoscape.use(cytoscapeSvg);

interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: number;
  valueUSD: number;
  type: 'in' | 'out';
  timestamp: number;
}

interface WalletInfo {
  address: string;
  balanceUSD: number;
}

interface KnownEntity {
  name: string;
  type: 'exchange' | 'mixer' | 'defi' | 'bridge' | 'scam' | 'gambling' | 'nft' | 'unknown';
}

interface CryptoGraphProps {
  walletInfo: WalletInfo;
  transactions: Transaction[];
  getKnownEntity: (address: string) => KnownEntity | null;
}

type LayoutType = 'cose' | 'circle' | 'grid' | 'breadthfirst' | 'concentric';

// Entity type to emoji
const getEntityEmoji = (type: string): string => {
  const emojis: Record<string, string> = {
    main: '💎',
    exchange: '🏦',
    mixer: '🌀',
    defi: '📊',
    bridge: '🌉',
    scam: '⚠️',
    gambling: '🎰',
    nft: '🎨',
    unknown: '❓'
  };
  return emojis[type] || '❓';
};

// Entity type to color
const getEntityColor = (type: string): string => {
  const colors: Record<string, string> = {
    main: '#3b82f6',
    exchange: '#22c55e',
    mixer: '#ef4444',
    defi: '#8b5cf6',
    bridge: '#f59e0b',
    scam: '#dc2626',
    gambling: '#f97316',
    nft: '#ec4899',
    unknown: '#6b7280'
  };
  return colors[type] || '#6b7280';
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

    // Create Cytoscape nodes
    const nodes = Array.from(nodeMap.values()).map(n => ({
      data: {
        id: n.id,
        label: `${getEntityEmoji(n.type)}\n${n.label}`,
        type: n.type,
        color: getEntityColor(n.type),
        size: n.type === 'main' ? 70 : 50,
      }
    }));

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

  // Cytoscape stylesheet
  const stylesheet: any[] = [
    {
      selector: 'node',
      style: {
        'background-color': 'data(color)',
        'border-color': '#ffffff',
        'border-width': 2,
        'width': 'data(size)',
        'height': 'data(size)',
        'label': 'data(label)',
        'text-valign': 'center',
        'text-halign': 'center',
        'font-size': 12,
        'color': '#ffffff',
        'text-outline-color': '#000000',
        'text-outline-width': 2,
        'text-wrap': 'wrap',
        'text-max-width': '80px',
      }
    },
    {
      selector: 'node:selected',
      style: {
        'border-color': '#fbbf24',
        'border-width': 4,
      }
    },
    {
      selector: 'node.highlighted',
      style: {
        'border-color': '#00ff00',
        'border-width': 4,
      }
    },
    {
      selector: 'node.faded',
      style: {
        'opacity': 0.3,
      }
    },
    {
      selector: 'edge',
      style: {
        'width': 'data(width)',
        'line-color': 'data(color)',
        'target-arrow-color': 'data(color)',
        'target-arrow-shape': 'triangle',
        'curve-style': 'bezier',
        'opacity': 0.8,
        'label': 'data(label)',
        'font-size': 8,
        'color': '#ffffff',
        'text-outline-color': '#000000',
        'text-outline-width': 1,
        'text-rotation': 'autorotate',
      }
    },
    {
      selector: 'edge:selected',
      style: {
        'line-color': '#fbbf24',
        'target-arrow-color': '#fbbf24',
        'width': 4,
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
    { emoji: '💎', label: 'Wallet หลัก', color: '#3b82f6' },
    { emoji: '🏦', label: 'Exchange', color: '#22c55e' },
    { emoji: '🌀', label: 'Mixer (High Risk)', color: '#ef4444' },
    { emoji: '📊', label: 'DeFi', color: '#8b5cf6' },
    { emoji: '🌉', label: 'Bridge', color: '#f59e0b' },
    { emoji: '🎰', label: 'Gambling', color: '#f97316' },
    { emoji: '🎨', label: 'NFT', color: '#ec4899' },
    { emoji: '❓', label: 'Unknown', color: '#6b7280' },
  ];

  return (
    <div className={`rounded-xl border ${darkMode ? 'bg-dark-900 border-dark-700' : 'bg-white border-gray-300'}`}>
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
        </div>
      </div>

      {/* Graph */}
      <div className={`relative ${darkMode ? 'bg-dark-950' : 'bg-gray-50'}`} style={{ height: '500px' }}>
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
          <span>🖱️ ลาก Node</span>
          <span>🔍 Scroll ซูม</span>
          <span>👆 คลิกดู Connections</span>
        </div>
      </div>

      {/* Legend */}
      <div className={`p-3 border-t ${darkMode ? 'border-dark-700' : 'border-gray-200'}`}>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {legends.map(item => (
            <div key={item.label} className="flex items-center gap-2 text-xs">
              <span className="text-lg">{item.emoji}</span>
              <span className={darkMode ? 'text-dark-300' : 'text-gray-600'}>{item.label}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 mt-2 pt-2 border-t border-dark-700">
          <div className="flex items-center gap-2 text-xs">
            <div className="w-8 h-1 bg-green-500 rounded" />
            <span className={darkMode ? 'text-dark-400' : 'text-gray-500'}>เงินเข้า (Receive)</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-8 h-1 bg-red-500 rounded" />
            <span className={darkMode ? 'text-dark-400' : 'text-gray-500'}>เงินออก (Send)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CryptoGraph;
