/**
 * Intelligence Network Analysis V6 - react-cytoscapejs
 * Proper React integration with Cytoscape.js
 */
import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
// @ts-ignore
import CytoscapeComponent from 'react-cytoscapejs';
import type { Core } from 'cytoscape';
import {
  Users,
  Network,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  X,
  Target,
  Share2,
  Shield,
  Eye,
  EyeOff,
  Loader2,
  RefreshCw,
  Search,
  ZoomOut,
  Maximize2,
  Minimize2,
  Sun,
  Moon,
  Image,
  Filter,
  RotateCcw,
  Layout,
  Circle,
  GitBranch,
  Grid3X3,
  Workflow
} from 'lucide-react';
import { Button, CaseInfoBar } from '../../components/ui';
import { useCaseStore } from '../../store/caseStore';

import cytoscape from "cytoscape";
// @ts-ignore
import cytoscapeSvg from "cytoscape-svg";

// Register SVG extension only once using a global flag
// @ts-ignore
if (typeof window !== 'undefined' && !window.__cytoscapeSvgRegistered) {
  cytoscape.use(cytoscapeSvg);
  // @ts-ignore
  window.__cytoscapeSvgRegistered = true;
}

const API_BASE = import.meta.env.VITE_API_URL || 'https://investigates-api.azurewebsites.net/api/v1';

// ============================================
// TYPES
// ============================================

type EntityType = 'person' | 'phone' | 'account' | 'address' | 'organization' | 'crypto' | 'vehicle';
type LinkType = 'call' | 'sms' | 'transfer' | 'meeting' | 'family' | 'business' | 'criminal';
type RiskLevel = 'critical' | 'high' | 'medium' | 'low' | 'unknown';
type LayoutType = 'cose' | 'circle' | 'grid' | 'breadthfirst' | 'concentric';

interface Entity {
  id: string;
  type: EntityType;
  label: string;
  subLabel?: string;
  risk: RiskLevel;
  clusterId?: number;
  metadata: Record<string, string | number>;
}

interface Link {
  id: string;
  source: string;
  target: string;
  type: LinkType;
  weight: number;
  firstSeen: string;
  lastSeen: string;
  metadata: Record<string, string | number>;
}

interface Cluster {
  id: number;
  name: string;
  color: string;
  entities: string[];
  risk: RiskLevel;
  description: string;
}

// ============================================
// HELPERS
// ============================================

// Entity configuration - FBI/i2 style with background + border colors
const ENTITY_CONFIG: Record<EntityType, { emoji: string; color: string; borderColor: string; label: string }> = {
  person: { emoji: '👤', color: '#D1FAE5', borderColor: '#059669', label: 'Person' },
  phone: { emoji: '📱', color: '#DBEAFE', borderColor: '#2563EB', label: 'Phone' },
  account: { emoji: '🏦', color: '#DBEAFE', borderColor: '#2563EB', label: 'Account' },
  address: { emoji: '🏠', color: '#FEF3C7', borderColor: '#D97706', label: 'Address' },
  organization: { emoji: '🏢', color: '#EDE9FE', borderColor: '#7C3AED', label: 'Organization' },
  crypto: { emoji: '₿', color: '#FEF3C7', borderColor: '#D97706', label: 'Crypto' },
  vehicle: { emoji: '🚗', color: '#F3F4F6', borderColor: '#6B7280', label: 'Vehicle' },
};

const getEntityEmoji = (type: EntityType): string => {
  return ENTITY_CONFIG[type]?.emoji || '●';
};

const getEntityConfig = (type: EntityType) => {
  return ENTITY_CONFIG[type] || { emoji: '●', color: '#F3F4F6', borderColor: '#6B7280', label: 'Unknown' };
};

const getRiskColor = (risk: RiskLevel): string => {
  const colors: Record<RiskLevel, string> = {
    critical: '#DC2626', high: '#F59E0B', medium: '#EAB308',
    low: '#22C55E', unknown: '#6B7280'
  };
  return colors[risk];
};

const getRiskBgColor = (risk: RiskLevel): string => {
  const colors: Record<RiskLevel, string> = {
    critical: '#FCA5A5', high: '#FDE68A', medium: '#FEF9C3',
    low: '#D1FAE5', unknown: '#F3F4F6'
  };
  return colors[risk];
};

const getRiskSize = (risk: RiskLevel): number => {
  const sizes: Record<RiskLevel, number> = {
    critical: 80, high: 70, medium: 60,
    low: 55, unknown: 55
  };
  return sizes[risk];
};

const getRiskBorderWidth = (risk: RiskLevel): number => {
  const widths: Record<RiskLevel, number> = {
    critical: 5, high: 4, medium: 3,
    low: 2, unknown: 2
  };
  return widths[risk];
};

const getLinkColor = (type: LinkType): string => {
  const colors: Record<LinkType, string> = {
    call: '#3b82f6', sms: '#22c55e', transfer: '#f59e0b',
    meeting: '#8b5cf6', family: '#ec4899', business: '#6366f1', criminal: '#ef4444'
  };
  return colors[type] || '#6b7280';
};

const getClusterColor = (clusterId: number | undefined, clusters: Cluster[]): string => {
  if (!clusterId) return '#6b7280';
  const cluster = clusters.find(c => c.id === clusterId);
  return cluster?.color || '#6b7280';
};

// ============================================
// CYTOSCAPE STYLESHEET
// ============================================

const cytoscapeStylesheet: any[] = [
  {
    selector: "node",
    style: {
      "background-color": "data(bgColor)",
      "background-opacity": 1,
      "border-color": "data(riskColor)",
      "border-width": "data(borderWidth)",
      "border-opacity": 1,
      "width": "data(size)",
      "height": "data(size)",
      "label": "data(displayLabel)",
      "font-size": 9,
      "font-weight": 600,
      "text-valign": "center",
      "text-halign": "center",
      "color": "#1F2937",
      "text-outline-color": "#ffffff",
      "text-outline-width": 1.5,
      "text-wrap": "wrap",
      "text-max-width": "70px",
    }
  },
  {
    selector: 'node[risk = "critical"]',
    style: {
      "font-size": 11,
      "font-weight": 700,
    }
  },
  {
    selector: 'node[risk = "high"]',
    style: {
      "font-size": 10,
      "font-weight": 700,
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
    selector: 'node.searched',
    style: {
      'border-color': '#FBBF24',
      'border-width': 5,
      'border-style': 'dashed',
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
      'width': 'mapData(weight, 1, 300, 1.5, 4)',
      'line-color': 'data(color)',
      'line-opacity': 0.75,
      'target-arrow-color': 'data(color)',
      'target-arrow-shape': 'triangle',
      'arrow-scale': 0.8,
      'curve-style': 'bezier',
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

// ============================================
// COMPONENTS
// ============================================

const ClusterLegend = ({ clusters, selectedCluster, onSelectCluster, collapsed, onToggle }: {
  clusters: Cluster[];
  selectedCluster: number | null;
  onSelectCluster: (id: number | null) => void;
  collapsed: boolean;
  onToggle: () => void;
}) => (
  <div className="bg-dark-800 rounded-xl border border-dark-700">
    <button onClick={onToggle} className="w-full p-3 flex items-center justify-between text-sm font-semibold text-white hover:bg-dark-700 rounded-t-xl">
      <span className="flex items-center gap-2">
        <Users size={16} className="text-primary-400" />
        Clusters ({clusters.length})
      </span>
      {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
    </button>
    {!collapsed && (
      <div className="p-3 pt-0 space-y-1">
        <button
          onClick={() => onSelectCluster(null)}
          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedCluster === null ? 'bg-primary-500/20 text-primary-400' : 'hover:bg-dark-700 text-dark-300'}`}
        >
          All
        </button>
        {clusters.map(cluster => (
          <button
            key={cluster.id}
            onClick={() => onSelectCluster(cluster.id)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedCluster === cluster.id ? 'bg-dark-600' : 'hover:bg-dark-700'}`}
          >
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cluster.color }} />
              <span className="text-white truncate">{cluster.name}</span>
            </div>
          </button>
        ))}
      </div>
    )}
  </div>
);

const FilterPanel = ({ riskFilter, setRiskFilter, typeFilter, setTypeFilter, collapsed, onToggle }: {
  riskFilter: RiskLevel[];
  setRiskFilter: (f: RiskLevel[]) => void;
  typeFilter: EntityType[];
  setTypeFilter: (f: EntityType[]) => void;
  collapsed: boolean;
  onToggle: () => void;
}) => {
  const risks: { level: RiskLevel; label: string; color: string }[] = [
    { level: 'critical', label: 'Critical', color: '#ef4444' },
    { level: 'high', label: 'High', color: '#f97316' },
    { level: 'medium', label: 'Medium', color: '#eab308' },
    { level: 'low', label: 'Low', color: '#22c55e' },
    { level: 'unknown', label: 'Unknown', color: '#6b7280' },
  ];
  
  const types: { type: EntityType; label: string; emoji: string }[] = [
    { type: 'person', label: 'Person', emoji: '👤' },
    { type: 'phone', label: 'Phone', emoji: '📱' },
    { type: 'account', label: 'Account', emoji: '🏦' },
    { type: 'address', label: 'Address', emoji: '🏠' },
    { type: 'organization', label: 'Organization', emoji: '🏢' },
    { type: 'crypto', label: 'Crypto', emoji: '₿' },
    { type: 'vehicle', label: 'Vehicle', emoji: '🚗' },
  ];
  
  return (
    <div className="bg-dark-800 rounded-xl border border-dark-700">
      <button onClick={onToggle} className="w-full p-3 flex items-center justify-between text-sm font-semibold text-white hover:bg-dark-700 rounded-t-xl">
        <span className="flex items-center gap-2">
          <Filter size={16} className="text-primary-400" />
          Filters
        </span>
        {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
      </button>
      {!collapsed && (
        <div className="p-3 pt-0 space-y-3">
          <div>
            <p className="text-xs text-dark-400 mb-2">Risk Level</p>
            <div className="flex flex-wrap gap-1">
              {risks.map(r => (
                <button
                  key={r.level}
                  onClick={() => riskFilter.includes(r.level) ? setRiskFilter(riskFilter.filter(x => x !== r.level)) : setRiskFilter([...riskFilter, r.level])}
                  className={`px-2 py-1 rounded text-xs transition-colors ${riskFilter.includes(r.level) ? 'text-white' : 'text-dark-500 opacity-50'}`}
                  style={{ backgroundColor: riskFilter.includes(r.level) ? r.color + '40' : 'transparent' }}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-dark-400 mb-2">Type Entity</p>
            <div className="grid grid-cols-2 gap-1">
              {types.map(t => (
                <button
                  key={t.type}
                  onClick={() => typeFilter.includes(t.type) ? setTypeFilter(typeFilter.filter(x => x !== t.type)) : setTypeFilter([...typeFilter, t.type])}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${typeFilter.includes(t.type) ? 'bg-dark-600 text-white' : 'text-dark-500 opacity-50'}`}
                >
                  <span>{t.emoji}</span>
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const EntityDetailPanel = ({ entity, links, entities, clusters, onClose }: {
  entity: Entity;
  links: Link[];
  entities: Entity[];
  clusters: Cluster[];
  onClose: () => void;
}) => {
  const connectedLinks = links.filter(l => l.source === entity.id || l.target === entity.id);
  const cluster = clusters.find(c => c.id === entity.clusterId);
  
  return (
    <div className="bg-dark-800 rounded-xl border border-dark-700 p-4">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ backgroundColor: getRiskColor(entity.risk) + '30' }}>
            {getEntityEmoji(entity.type)}
          </div>
          <div>
            <h3 className="text-white font-semibold text-sm">{entity.label}</h3>
            {entity.subLabel && <p className="text-xs text-dark-400">{entity.subLabel}</p>}
          </div>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-dark-700 rounded">
          <X size={16} className="text-dark-400" />
        </button>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 rounded text-xs uppercase" style={{ backgroundColor: getRiskColor(entity.risk) + '30', color: getRiskColor(entity.risk) }}>
            Risk: {entity.risk}
          </span>
          {cluster && (
            <span className="px-2 py-1 rounded text-xs" style={{ backgroundColor: cluster.color + '30', color: cluster.color }}>
              {cluster.name}
            </span>
          )}
        </div>
        
        <div>
          <h4 className="text-xs font-semibold text-dark-400 mb-1">Connections ({connectedLinks.length})</h4>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {connectedLinks.slice(0, 10).map(link => {
              const otherId = link.source === entity.id ? link.target : link.source;
              const other = entities.find(e => e.id === otherId);
              if (!other) return null;
              return (
                <div key={link.id} className="flex items-center gap-2 text-xs bg-dark-900 rounded p-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getLinkColor(link.type) }} />
                  <span className="text-dark-300 truncate flex-1">{other.label}</span>
                  <span className="text-dark-500">{link.type}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

export const CallAnalysis = () => {
  // Data state - fetched from API
  const [entities, setEntities] = useState<Entity[]>([]);
  const [links, setLinks] = useState<Link[]>([]);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [recordsCount, setRecordsCount] = useState(0);
  const [_error, setError] = useState<string | null>(null);
  
  const [selectedCluster, setSelectedCluster] = useState<number | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [clusterPanelCollapsed, setClusterPanelCollapsed] = useState(false);
  const [filterPanelCollapsed, setFilterPanelCollapsed] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [layoutType, setLayoutType] = useState<LayoutType>('cose');
  const [showLabels, setShowLabels] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [cyInstance, setCyInstance] = useState<Core | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [riskFilter, setRiskFilter] = useState<RiskLevel[]>(['critical', 'high', 'medium', 'low', 'unknown']);
  const [typeFilter, setTypeFilter] = useState<EntityType[]>(['person', 'phone', 'account', 'address', 'organization', 'crypto', 'vehicle']);
  
  // Use global case store
  const { selectedCaseId } = useCaseStore();

  // Generate network from call records
  const generateNetwork = async () => {
    if (!selectedCaseId) return;
    
    setIsGenerating(true);
    const token = localStorage.getItem('access_token');
    
    try {
      const response = await fetch(
        `${API_BASE}/call-analysis/case/${selectedCaseId}/generate-network`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to generate network');
      }
      
      const result = await response.json();
      console.log('Network generated:', result);
      
      // Refetch network data
      fetchNetworkData();
    } catch (err) {
      console.error('Error generating network:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate network');
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Fetch network data from API
  const fetchNetworkData = async () => {
    if (!selectedCaseId) {
      setIsLoading(false);
      return;
    }
      
    setIsLoading(true);
    setError(null);
    
    const token = localStorage.getItem('access_token');
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    try {
      // First, get the records count to know if we have data to process
      const statsResponse = await fetch(
        `${API_BASE}/call-analysis/case/${selectedCaseId}/stats`,
        { headers }
      );
      if (statsResponse.ok) {
        const stats = await statsResponse.json();
        setRecordsCount(stats.total_records || 0);
      }
      
      // Then fetch network data
      const response = await fetch(
        `${API_BASE}/call-analysis/case/${selectedCaseId}/network`,
        { headers }
      );
      
      if (!response.ok) {
        if (response.status === 404) {
          // No data yet - this is okay
          setEntities([]);
          setLinks([]);
          setClusters([]);
          setIsLoading(false);
          return;
        }
        throw new Error('Failed to fetch network data');
      }
      
      const data = await response.json();
      
      // Transform API data to component format
      const transformedEntities: Entity[] = data.entities.map((e: any) => ({
        id: e.id,
        type: e.type as EntityType,
        label: e.label,
        subLabel: e.subLabel,
        risk: e.risk as RiskLevel,
        clusterId: e.clusterId,
        metadata: e.metadata || {}
      }));
      
      const transformedLinks: Link[] = data.links.map((l: any) => ({
        id: l.id,
        source: l.source,
        target: l.target,
        type: l.type as LinkType,
        weight: l.weight || 1,
        firstSeen: l.firstSeen,
        lastSeen: l.lastSeen,
        metadata: l.metadata || {}
      }));
      
      const transformedClusters: Cluster[] = data.clusters.map((c: any) => ({
        id: c.id,
        name: c.name,
        color: c.color,
        entities: c.entities || [],
        risk: c.risk as RiskLevel,
        description: c.description || ''
      }));
      
      setEntities(transformedEntities);
      setLinks(transformedLinks);
      setClusters(transformedClusters);
      
    } catch (err) {
      console.error('Error fetching network data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };
  
  // useEffect to fetch data when case changes
  useEffect(() => {
    fetchNetworkData();
  }, [selectedCaseId]);

  // Memoized filtered data
  const filteredEntities = useMemo(() => 
    entities.filter(e => {
      if (selectedCluster && e.clusterId !== selectedCluster) return false;
      if (!riskFilter.includes(e.risk)) return false;
      if (!typeFilter.includes(e.type)) return false;
      return true;
    }), [entities, selectedCluster, riskFilter, typeFilter]
  );
  
  const filteredEntityIds = useMemo(() => new Set(filteredEntities.map(e => e.id)), [filteredEntities]);
  
  const filteredLinks = useMemo(() => 
    links.filter(l => filteredEntityIds.has(l.source) && filteredEntityIds.has(l.target)),
    [links, filteredEntityIds]
  );

  // Memoized cytoscape elements
  const elements = useMemo(() => {
    const nodes = filteredEntities.map(entity => {
      const config = getEntityConfig(entity.type);
      const riskBg = getRiskBgColor(entity.risk);
      const size = getRiskSize(entity.risk);
      const borderWidth = getRiskBorderWidth(entity.risk);
      
      // Use risk background color for critical/high, otherwise entity type color
      const bgColor = (entity.risk === 'critical' || entity.risk === 'high') ? riskBg : config.color;
      
      return {
        data: {
          id: entity.id,
          label: entity.label,
          displayLabel: `${config.emoji}\n${entity.label}`,
          type: entity.type,
          risk: entity.risk,
          clusterId: entity.clusterId,
          color: config.color,
          bgColor: bgColor,
          emoji: config.emoji,
          riskColor: getRiskColor(entity.risk),
          size: size,
          borderWidth: borderWidth,
        }
      };
    });

    const edges = filteredLinks.map(link => ({
      data: {
        id: link.id,
        source: link.source,
        target: link.target,
        type: link.type,
        weight: link.weight,
        color: getLinkColor(link.type),
      }
    }));

    return [...nodes, ...edges];
  }, [filteredEntities, filteredLinks, clusters, showLabels]);

  // Layout config
  const layoutConfig = useMemo(() => ({
    name: layoutType,
    animate: false,
    fit: true,
    padding: 50,
    ...(layoutType === 'cose' ? {
      nodeRepulsion: 8000,
      idealEdgeLength: 100,
      gravity: 0.25,
    } : {}),
  }), [layoutType]);

  // Cytoscape ready handler
  const handleCyReady = useCallback((cy: Core) => {
    setCyInstance(cy);
    
    // Node click handler
    cy.on('tap', 'node', (evt) => {
      const nodeId = evt.target.id();
      const entity = entities.find(e => e.id === nodeId);
      setSelectedEntity(entity || null);
      
      // Highlight connections
      cy.elements().removeClass('highlighted faded');
      if (entity) {
        const node = evt.target;
        const connected = node.neighborhood().add(node);
        connected.addClass('highlighted');
        cy.elements().not(connected).addClass('faded');
      }
    });
    
    // Background click
    cy.on('tap', (evt) => {
      if (evt.target === cy) {
        setSelectedEntity(null);
        cy.elements().removeClass('highlighted faded');
      }
    });
  }, [entities]);

  // Search effect
  const handleSearch = useCallback(() => {
    if (!cyInstance) return;
    cyInstance.nodes().removeClass('searched');
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      cyInstance.nodes().forEach(node => {
        if (node.data('label')?.toLowerCase().includes(searchLower)) {
          node.addClass('searched');
        }
      });
    }
  }, [cyInstance, searchTerm]);

  // Run search when term changes
  useMemo(() => handleSearch(), [handleSearch]);

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
        ...(newLayout === 'cose' ? { nodeRepulsion: 8000, idealEdgeLength: 100, gravity: 0.25 } : {}),
      }).run();
    }
  }, [cyInstance, darkMode]);

  // Export PNG
  const handleExportPNG = useCallback(() => {
    if (!cyInstance) return;
    const png = cyInstance.png({ full: true, scale: 2, bg: darkMode ? '#111827' : '#ffffff' });
    const link = document.createElement('a');
    link.download = `network-analysis-${new Date().toISOString().slice(0, 10)}.png`;
    link.href = png;
    link.click();
  }, [cyInstance, darkMode]);

  // Reset
  const handleReset = useCallback(() => {
    if (cyInstance) {
      cyInstance.fit();
      cyInstance.elements().removeClass('highlighted faded searched');
    }
    setSelectedEntity(null);
    setSearchTerm('');
  }, [cyInstance, darkMode]);


  // Fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // Export SVG
  const handleExportSVG = useCallback(() => {
    if (!cyInstance) return;
    const svg = (cyInstance as any).svg({ full: true, scale: 2, bg: darkMode ? "#111827" : "#ffffff" });
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = "network-" + new Date().toISOString().slice(0, 10) + ".svg";
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  }, [cyInstance, darkMode]);

  // Fullscreen listener
  useEffect(() => {
    const h = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", h);
    return () => document.removeEventListener("fullscreenchange", h);
  }, []);
  const layouts: { id: LayoutType; label: string; icon: typeof Layout }[] = [
    { id: 'cose', label: 'Force', icon: Workflow },
    { id: 'circle', label: 'Circle', icon: Circle },
    { id: 'grid', label: 'Grid', icon: Grid3X3 },
    { id: 'breadthfirst', label: 'Tree', icon: GitBranch },
    { id: 'concentric', label: 'Cluster', icon: Target },
  ];

  return (
    <div ref={containerRef} className={`flex-1 flex flex-col min-h-screen ${darkMode ? "bg-dark-900" : "bg-gray-100"}`}>
      {/* Header */}
      <div className="p-4 border-b border-dark-700">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Shield className="text-primary-400" size={24} />
              Intelligence Network Analysis
            </h1>
            <p className="text-sm text-dark-400">Link Analysis - Call Records Network</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleExportPNG} disabled={entities.length === 0}>
              <Image size={16} className="mr-1" />
              Export PNG
            </Button>
            <Button variant="ghost" size="sm" onClick={handleExportSVG} disabled={entities.length === 0}>
              <Image size={16} className="mr-1" />
              Export SVG
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setDarkMode(!darkMode)}>
              {darkMode ? <Sun size={16} className="mr-1" /> : <Moon size={16} className="mr-1" />}
              {darkMode ? "Light" : "Dark"}
            </Button>
            <Button variant="ghost" size="sm" onClick={toggleFullscreen}>
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </Button>
          </div>
        </div>
        
        {/* Case Info */}
        <div className="mt-4">
          <CaseInfoBar />
        </div>
        
        {/* Stats */}
        <div className="mt-3 flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-dark-800 rounded-lg">
            <Users size={14} className="text-primary-400" />
            <span className="text-white">{filteredEntities.length}</span>
            <span className="text-dark-400">Entities</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-dark-800 rounded-lg">
            <Share2 size={14} className="text-blue-400" />
            <span className="text-white">{filteredLinks.length}</span>
            <span className="text-dark-400">Links</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-dark-800 rounded-lg">
            <Target size={14} className="text-amber-400" />
            <span className="text-white">{clusters.length}</span>
            <span className="text-dark-400">Clusters</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        <>
          {/* Graph Area */}
          <div className="flex-1 p-4 flex flex-col overflow-hidden">
            {/* Toolbar */}
            <div className="mb-3 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-dark-400" size={14} />
                  <input
                    type="text"
                    placeholder="Search Entity..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-48 pl-8 pr-3 py-1.5 bg-dark-800 border border-dark-700 rounded-lg text-sm text-white placeholder-dark-500 focus:outline-none focus:border-primary-500"
                  />
                  {searchTerm && (
                    <button onClick={() => setSearchTerm('')} className="absolute right-2 top-1/2 -translate-y-1/2">
                        <X size={12} className="text-dark-400" />
                      </button>
                    )}
                  </div>
                  
                  {/* Layout selector */}
                  <div className="flex items-center bg-dark-800 rounded-lg p-1">
                    {layouts.map(l => {
                      const Icon = l.icon;
                      return (
                        <button
                          key={l.id}
                          onClick={() => changeLayout(l.id)}
                          className={`p-1.5 rounded transition-colors ${layoutType === l.id ? 'bg-primary-500/20 text-primary-400' : 'text-dark-400 hover:text-white'}`}
                          title={l.label}
                        >
                          <Icon size={14} />
                        </button>
                      );
                    })}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setShowLabels(!showLabels)}>
                    {showLabels ? <Eye size={14} className="mr-1" /> : <EyeOff size={14} className="mr-1" />}
                    Labels
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => cyInstance?.fit()}>
                    <ZoomOut size={14} className="mr-1" />
                    Fit
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleReset}>
                    <RotateCcw size={14} className="mr-1" />
                    Reset
                  </Button>
                  {recordsCount > 0 && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={generateNetwork}
                      disabled={isGenerating}
                      title="Regenerate network from call records"
                    >
                      {isGenerating ? (
                        <Loader2 size={14} className="mr-1 animate-spin" />
                      ) : (
                        <RefreshCw size={14} className="mr-1" />
                      )}
                      {isGenerating ? 'Generating...' : 'Regenerate'}
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
                    {sidebarCollapsed ? <ChevronRight size={14} /> : <X size={14} />}
                  </Button>
                </div>
              </div>
              
              {/* Cytoscape Graph */}
              <div className={`flex-1 relative min-h-0 ${darkMode ? "bg-dark-950 border-dark-700" : "bg-white border-gray-300"} rounded-xl border`}>
                {/* Loading State */}
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-dark-950/80 z-10">
                    <div className="text-center">
                      <Loader2 className="w-8 h-8 animate-spin text-primary-400 mx-auto mb-2" />
                      <p className="text-dark-400">Loading network data...</p>
                    </div>
                  </div>
                )}
                
                {/* Empty State */}
                {!isLoading && entities.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <Network className="w-16 h-16 text-dark-600 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-white mb-2">No Network Data</h3>
                      {recordsCount > 0 ? (
                        <>
                          <p className="text-dark-400 max-w-md mb-4">
                            You have <span className="text-primary-400 font-semibold">{recordsCount}</span> call records imported.
                            Click the button below to generate the network visualization.
                          </p>
                          <button
                            onClick={generateNetwork}
                            disabled={isGenerating}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 disabled:bg-primary-500/50 rounded-lg font-medium transition-colors"
                          >
                            {isGenerating ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Generating Network...
                              </>
                            ) : (
                              <>
                                <RefreshCw className="w-4 h-4" />
                                Generate Network
                              </>
                            )}
                          </button>
                        </>
                      ) : (
                        <p className="text-dark-400 max-w-md">
                          Import call logs via Smart Import to visualize communication networks.
                          The system will automatically analyze and create network connections.
                        </p>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Graph - only render if we have data */}
                {!isLoading && entities.length > 0 && (
                  <CytoscapeComponent
                    elements={elements}
                    stylesheet={cytoscapeStylesheet}
                    layout={layoutConfig}
                    cy={handleCyReady}
                    style={{ width: '100%', height: '100%' }}
                    minZoom={0.2}
                    maxZoom={3}
                    boxSelectionEnabled={true}
                    autounselectify={false}
                    userZoomingEnabled={true}
                    userPanningEnabled={true}
                  />
                )}
                
                {/* Instructions */}
                {!isLoading && entities.length > 0 && (
                  <div className="absolute bottom-4 left-4 flex items-center gap-4 text-xs text-dark-500 bg-dark-900/80 px-3 py-2 rounded-lg">
                    <span>🖱️ Drag Node</span>
                    <span>📍 Pan Background</span>
                    <span>🔍 Scroll Zoom</span>
                    <span>👆 Click Select</span>
                  </div>
                )}
              </div>
              
              {/* Legend */}
              <div className="mt-3 flex flex-wrap items-center gap-4 text-xs">
                <span className="text-dark-400">Link Types:</span>
                {[
                  { type: 'call', label: 'Phone' },
                  { type: 'sms', label: 'SMS' },
                  { type: 'transfer', label: 'Transfer' },
                  { type: 'meeting', label: 'Meeting' },
                  { type: 'business', label: 'Business' },
                ].map(item => (
                  <div key={item.type} className="flex items-center gap-1">
                    <div className="w-4 h-1 rounded" style={{ backgroundColor: getLinkColor(item.type as LinkType) }} />
                    <span className="text-dark-400">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Sidebar - hidden in fullscreen */}
            {!sidebarCollapsed && !isFullscreen && (
              <div className="w-72 border-l border-dark-700 p-4 space-y-4 overflow-y-auto">
                <ClusterLegend
                  clusters={clusters}
                  selectedCluster={selectedCluster}
                  onSelectCluster={setSelectedCluster}
                  collapsed={clusterPanelCollapsed}
                  onToggle={() => setClusterPanelCollapsed(!clusterPanelCollapsed)}
                />
                
                <FilterPanel
                  riskFilter={riskFilter}
                  setRiskFilter={setRiskFilter}
                  typeFilter={typeFilter}
                  setTypeFilter={setTypeFilter}
                  collapsed={filterPanelCollapsed}
                  onToggle={() => setFilterPanelCollapsed(!filterPanelCollapsed)}
                />
                
                {selectedEntity && (
                  <EntityDetailPanel
                    entity={selectedEntity}
                    links={links}
                    entities={entities}
                    clusters={clusters}
                    onClose={() => {
                      setSelectedEntity(null);
                      cyInstance?.elements().removeClass('highlighted faded');
                    }}
                  />
                )}
              </div>
            )}
          </>
      </div>
    </div>
  );
};

export { CallAnalysis as CallAnalysisPage };
export default CallAnalysis;
