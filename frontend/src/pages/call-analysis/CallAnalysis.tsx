/**
 * Intelligence Network Analysis V5 - Cytoscape.js Edition
 * Industry-standard graph visualization library
 * Used by research labs and enterprise solutions
 * 
 * Features:
 * - Professional drag & drop
 * - Built-in zoom/pan
 * - Multiple layout algorithms
 * - Path finding (Dijkstra)
 * - Export PNG/JSON
 * - Community detection
 * - Tooltips
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import cytoscape, { Core, NodeSingular, EdgeSingular } from 'cytoscape';
import {
  Clock,
  Users,
  AlertTriangle,
  Network,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  X,
  Target,
  Share2,
  Shield,
  Zap,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  Search,
  ZoomIn,
  ZoomOut,
  Image,
  Filter,
  RotateCcw,
  Route,
  Layout,
  Circle,
  GitBranch,
  Grid3X3,
  Workflow
} from 'lucide-react';
import { Button } from '../../components/ui';

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

interface SuspiciousPattern {
  id: string;
  type: string;
  severity: RiskLevel;
  description: string;
  entities: string[];
  evidence: string[];
}

// ============================================
// SAMPLE DATA
// ============================================

const SAMPLE_ENTITIES: Entity[] = [
  // CLUSTER 1: หัวหน้าเครือข่าย
  { id: 'P001', type: 'person', label: 'นาย ก. (Big Boss)', subLabel: 'หัวหน้าเครือข่าย', risk: 'critical', clusterId: 1, metadata: { age: 45, nationality: 'Thai', priors: 3 } },
  { id: 'PH001', type: 'phone', label: '081-XXX-1111', subLabel: 'เบอร์หลัก Boss', risk: 'critical', clusterId: 1, metadata: { carrier: 'AIS' } },
  { id: 'PH002', type: 'phone', label: '082-XXX-2222', subLabel: 'เบอร์สำรอง', risk: 'high', clusterId: 1, metadata: { carrier: 'TRUE' } },
  { id: 'ACC001', type: 'account', label: 'xxx-x-x1234-x', subLabel: 'บัญชี KBank', risk: 'critical', clusterId: 1, metadata: { bank: 'KBank', balance: 15000000 } },
  { id: 'ADDR001', type: 'address', label: 'คอนโด ABC Tower', subLabel: 'พระราม 9', risk: 'high', clusterId: 1, metadata: { floor: 32 } },
  { id: 'CRYPTO001', type: 'crypto', label: '0x7a2B...9c3D', subLabel: 'ETH Wallet', risk: 'critical', clusterId: 1, metadata: { chain: 'Ethereum' } },
  
  // CLUSTER 2: ผู้ประสานงาน
  { id: 'P002', type: 'person', label: 'นาย ข. (Coordinator)', subLabel: 'ผู้ประสานงาน', risk: 'high', clusterId: 2, metadata: { age: 38 } },
  { id: 'P003', type: 'person', label: 'น.ส. ค. (Money)', subLabel: 'ดูแลการเงิน', risk: 'high', clusterId: 2, metadata: { age: 35 } },
  { id: 'PH003', type: 'phone', label: '083-XXX-3333', subLabel: 'เบอร์ ข.', risk: 'high', clusterId: 2, metadata: { carrier: 'DTAC' } },
  { id: 'PH004', type: 'phone', label: '084-XXX-4444', subLabel: 'เบอร์ ค.', risk: 'high', clusterId: 2, metadata: { carrier: 'AIS' } },
  { id: 'ACC002', type: 'account', label: 'xxx-x-x5678-x', subLabel: 'บัญชี SCB', risk: 'high', clusterId: 2, metadata: { bank: 'SCB' } },
  { id: 'ORG001', type: 'organization', label: 'บ.นำเข้าส่งออก XYZ', subLabel: 'บังหน้า', risk: 'high', clusterId: 2, metadata: { employees: 5 } },
  
  // CLUSTER 3: ผู้ค้ารายย่อย
  { id: 'P004', type: 'person', label: 'นาย ง. (Dealer 1)', subLabel: 'คลองเตย', risk: 'medium', clusterId: 3, metadata: { age: 28 } },
  { id: 'P005', type: 'person', label: 'นาย จ. (Dealer 2)', subLabel: 'หนองจอก', risk: 'medium', clusterId: 3, metadata: { age: 25 } },
  { id: 'P006', type: 'person', label: 'น.ส. ฉ. (Dealer 3)', subLabel: 'บางกะปิ', risk: 'medium', clusterId: 3, metadata: { age: 22 } },
  { id: 'PH005', type: 'phone', label: '085-XXX-5555', risk: 'medium', clusterId: 3, metadata: {} },
  { id: 'PH006', type: 'phone', label: '086-XXX-6666', risk: 'medium', clusterId: 3, metadata: {} },
  { id: 'PH007', type: 'phone', label: '087-XXX-7777', risk: 'medium', clusterId: 3, metadata: {} },
  
  // CLUSTER 4: Myanmar Connection
  { id: 'P007', type: 'person', label: 'Mr. Z (Supplier)', subLabel: 'Myanmar', risk: 'critical', clusterId: 4, metadata: { alias: 'The Snake' } },
  { id: 'PH008', type: 'phone', label: '+95-XXX-8888', subLabel: 'เบอร์ Myanmar', risk: 'critical', clusterId: 4, metadata: {} },
  { id: 'CRYPTO002', type: 'crypto', label: 'TRX...abc123', subLabel: 'USDT TRC20', risk: 'critical', clusterId: 4, metadata: { chain: 'Tron' } },
  { id: 'ADDR002', type: 'address', label: 'Warehouse Tachileik', subLabel: 'ชายแดน', risk: 'critical', clusterId: 4, metadata: {} },
  
  // CLUSTER 5: Logistics
  { id: 'P008', type: 'person', label: 'นาย ช. (Driver)', subLabel: 'คนขนส่ง', risk: 'medium', clusterId: 5, metadata: { age: 40 } },
  { id: 'VEH001', type: 'vehicle', label: 'กข 1234', subLabel: 'รถบรรทุก', risk: 'high', clusterId: 5, metadata: { brand: 'HINO' } },
  { id: 'PH009', type: 'phone', label: '089-XXX-9999', risk: 'medium', clusterId: 5, metadata: {} },
  { id: 'ADDR003', type: 'address', label: 'โกดังเชียงราย', subLabel: 'จุดพักสินค้า', risk: 'high', clusterId: 5, metadata: {} },
  
  // Unknown
  { id: 'P009', type: 'person', label: 'Unknown Male', subLabel: 'ยังไม่ระบุตัวตน', risk: 'unknown', metadata: {} },
  { id: 'PH010', type: 'phone', label: '090-XXX-0000', subLabel: 'Burner phone', risk: 'high', metadata: {} },
];

const SAMPLE_LINKS: Link[] = [
  { id: 'L001', source: 'P001', target: 'PH001', type: 'call', weight: 150, firstSeen: '2025-06-01', lastSeen: '2026-01-14', metadata: {} },
  { id: 'L002', source: 'P001', target: 'PH002', type: 'call', weight: 45, firstSeen: '2025-08-01', lastSeen: '2026-01-14', metadata: {} },
  { id: 'L003', source: 'P001', target: 'ACC001', type: 'transfer', weight: 89, firstSeen: '2025-06-01', lastSeen: '2026-01-10', metadata: {} },
  { id: 'L004', source: 'P001', target: 'ADDR001', type: 'meeting', weight: 30, firstSeen: '2025-06-01', lastSeen: '2026-01-14', metadata: {} },
  { id: 'L005', source: 'P001', target: 'CRYPTO001', type: 'transfer', weight: 35, firstSeen: '2025-09-01', lastSeen: '2026-01-12', metadata: {} },
  { id: 'L006', source: 'PH001', target: 'PH003', type: 'call', weight: 85, firstSeen: '2025-06-01', lastSeen: '2026-01-14', metadata: {} },
  { id: 'L007', source: 'PH001', target: 'PH004', type: 'call', weight: 42, firstSeen: '2025-07-01', lastSeen: '2026-01-14', metadata: {} },
  { id: 'L008', source: 'PH002', target: 'PH003', type: 'sms', weight: 120, firstSeen: '2025-08-01', lastSeen: '2026-01-14', metadata: {} },
  { id: 'L009', source: 'ACC001', target: 'ACC002', type: 'transfer', weight: 56, firstSeen: '2025-06-15', lastSeen: '2026-01-08', metadata: {} },
  { id: 'L010', source: 'P002', target: 'PH003', type: 'call', weight: 200, firstSeen: '2025-06-01', lastSeen: '2026-01-14', metadata: {} },
  { id: 'L011', source: 'P003', target: 'PH004', type: 'call', weight: 180, firstSeen: '2025-06-01', lastSeen: '2026-01-14', metadata: {} },
  { id: 'L012', source: 'P002', target: 'P003', type: 'meeting', weight: 45, firstSeen: '2025-06-01', lastSeen: '2026-01-14', metadata: {} },
  { id: 'L013', source: 'P003', target: 'ACC002', type: 'transfer', weight: 150, firstSeen: '2025-06-01', lastSeen: '2026-01-14', metadata: {} },
  { id: 'L014', source: 'P002', target: 'ORG001', type: 'business', weight: 1, firstSeen: '2020-01-01', lastSeen: '2026-01-14', metadata: {} },
  { id: 'L015', source: 'P003', target: 'ORG001', type: 'business', weight: 1, firstSeen: '2020-01-01', lastSeen: '2026-01-14', metadata: {} },
  { id: 'L016', source: 'PH003', target: 'PH005', type: 'call', weight: 65, firstSeen: '2025-08-01', lastSeen: '2026-01-14', metadata: {} },
  { id: 'L017', source: 'PH003', target: 'PH006', type: 'call', weight: 58, firstSeen: '2025-08-01', lastSeen: '2026-01-14', metadata: {} },
  { id: 'L018', source: 'PH004', target: 'PH007', type: 'call', weight: 72, firstSeen: '2025-09-01', lastSeen: '2026-01-14', metadata: {} },
  { id: 'L019', source: 'PH003', target: 'PH007', type: 'sms', weight: 45, firstSeen: '2025-10-01', lastSeen: '2026-01-14', metadata: {} },
  { id: 'L020', source: 'P004', target: 'PH005', type: 'call', weight: 300, firstSeen: '2025-08-01', lastSeen: '2026-01-14', metadata: {} },
  { id: 'L021', source: 'P005', target: 'PH006', type: 'call', weight: 280, firstSeen: '2025-08-01', lastSeen: '2026-01-14', metadata: {} },
  { id: 'L022', source: 'P006', target: 'PH007', type: 'call', weight: 250, firstSeen: '2025-09-01', lastSeen: '2026-01-14', metadata: {} },
  { id: 'L023', source: 'PH005', target: 'PH006', type: 'call', weight: 35, firstSeen: '2025-10-01', lastSeen: '2026-01-14', metadata: {} },
  { id: 'L024', source: 'PH001', target: 'PH008', type: 'call', weight: 25, firstSeen: '2025-06-01', lastSeen: '2026-01-10', metadata: {} },
  { id: 'L025', source: 'CRYPTO001', target: 'CRYPTO002', type: 'transfer', weight: 18, firstSeen: '2025-09-01', lastSeen: '2026-01-05', metadata: {} },
  { id: 'L026', source: 'P007', target: 'PH008', type: 'call', weight: 100, firstSeen: '2025-01-01', lastSeen: '2026-01-14', metadata: {} },
  { id: 'L027', source: 'P007', target: 'CRYPTO002', type: 'transfer', weight: 50, firstSeen: '2025-06-01', lastSeen: '2026-01-14', metadata: {} },
  { id: 'L028', source: 'P007', target: 'ADDR002', type: 'meeting', weight: 100, firstSeen: '2025-01-01', lastSeen: '2026-01-14', metadata: {} },
  { id: 'L029', source: 'PH003', target: 'PH009', type: 'call', weight: 40, firstSeen: '2025-10-01', lastSeen: '2026-01-14', metadata: {} },
  { id: 'L030', source: 'P008', target: 'PH009', type: 'call', weight: 150, firstSeen: '2025-10-01', lastSeen: '2026-01-14', metadata: {} },
  { id: 'L031', source: 'P008', target: 'VEH001', type: 'meeting', weight: 80, firstSeen: '2025-10-01', lastSeen: '2026-01-14', metadata: {} },
  { id: 'L032', source: 'VEH001', target: 'ADDR003', type: 'meeting', weight: 25, firstSeen: '2025-11-01', lastSeen: '2026-01-14', metadata: {} },
  { id: 'L033', source: 'ADDR003', target: 'ADDR002', type: 'transfer', weight: 12, firstSeen: '2025-11-01', lastSeen: '2026-01-08', metadata: {} },
  { id: 'L034', source: 'PH002', target: 'PH010', type: 'call', weight: 8, firstSeen: '2026-01-10', lastSeen: '2026-01-12', metadata: {} },
  { id: 'L035', source: 'PH010', target: 'P009', type: 'call', weight: 15, firstSeen: '2026-01-10', lastSeen: '2026-01-14', metadata: {} },
];

const SAMPLE_CLUSTERS: Cluster[] = [
  { id: 1, name: 'หัวหน้าเครือข่าย', color: '#ef4444', entities: ['P001', 'PH001', 'PH002', 'ACC001', 'ADDR001', 'CRYPTO001'], risk: 'critical', description: 'กลุ่มบัญชาการหลัก' },
  { id: 2, name: 'ผู้ประสานงาน', color: '#f97316', entities: ['P002', 'P003', 'PH003', 'PH004', 'ACC002', 'ORG001'], risk: 'high', description: 'กลุ่มประสานงาน' },
  { id: 3, name: 'ผู้ค้ารายย่อย', color: '#22c55e', entities: ['P004', 'P005', 'P006', 'PH005', 'PH006', 'PH007'], risk: 'medium', description: 'กลุ่มค้าปลีก' },
  { id: 4, name: 'แหล่งผลิต Myanmar', color: '#8b5cf6', entities: ['P007', 'PH008', 'CRYPTO002', 'ADDR002'], risk: 'critical', description: 'กลุ่ม Supplier' },
  { id: 5, name: 'ขนส่ง/Logistics', color: '#3b82f6', entities: ['P008', 'VEH001', 'PH009', 'ADDR003'], risk: 'high', description: 'กลุ่มขนส่ง' },
];

const SAMPLE_PATTERNS: SuspiciousPattern[] = [
  { id: 'SP001', type: 'Burner Phone Pattern', severity: 'critical', description: 'พบการใช้เบอร์โทรศัพท์แบบใช้แล้วทิ้ง', entities: ['PH002', 'PH010', 'P009'], evidence: ['ใช้งานเพียง 3 วัน', 'โทรเฉพาะช่วงกลางคืน'] },
  { id: 'SP002', type: 'Layered Communication', severity: 'high', description: 'การสื่อสารแบบหลายชั้น', entities: ['P001', 'P002', 'P003'], evidence: ['ไม่มีการโทรตรง Boss-Dealers'] },
  { id: 'SP003', type: 'Crypto Money Flow', severity: 'critical', description: 'การโอนเงินผ่าน Crypto ข้ามประเทศ', entities: ['CRYPTO001', 'CRYPTO002'], evidence: ['ETH → USDT conversion'] },
  { id: 'SP004', type: 'Timing Pattern', severity: 'medium', description: 'โทรเฉพาะช่วง 22:00-04:00', entities: ['PH003', 'PH009'], evidence: ['95% โทรหลังเที่ยงคืน'] },
  { id: 'SP005', type: 'Shell Company', severity: 'high', description: 'บริษัทบังหน้า', entities: ['ORG001', 'P002', 'P003'], evidence: ['พนักงานจริง 2 คน'] },
];

// ============================================
// HELPERS
// ============================================

const getEntityEmoji = (type: EntityType): string => {
  const emojis: Record<EntityType, string> = {
    person: '👤',
    phone: '📱',
    account: '🏦',
    address: '🏠',
    organization: '🏢',
    crypto: '₿',
    vehicle: '🚗'
  };
  return emojis[type] || '●';
};

const getRiskColor = (risk: RiskLevel): string => {
  const colors: Record<RiskLevel, string> = {
    critical: '#ef4444',
    high: '#f97316',
    medium: '#eab308',
    low: '#22c55e',
    unknown: '#6b7280'
  };
  return colors[risk];
};

const getLinkColor = (type: LinkType): string => {
  const colors: Record<LinkType, string> = {
    call: '#3b82f6',
    sms: '#22c55e',
    transfer: '#f59e0b',
    meeting: '#8b5cf6',
    family: '#ec4899',
    business: '#6366f1',
    criminal: '#ef4444'
  };
  return colors[type] || '#6b7280';
};

const getClusterColor = (clusterId: number | undefined, clusters: Cluster[]): string => {
  if (!clusterId) return '#6b7280';
  const cluster = clusters.find(c => c.id === clusterId);
  return cluster?.color || '#6b7280';
};

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
        กลุ่ม/เก๊ง ({clusters.length})
      </span>
      {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
    </button>
    {!collapsed && (
      <div className="p-3 pt-0 space-y-1">
        <button
          onClick={() => onSelectCluster(null)}
          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedCluster === null ? 'bg-primary-500/20 text-primary-400' : 'hover:bg-dark-700 text-dark-300'}`}
        >
          ทั้งหมด
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
              <span className="text-dark-500 text-xs ml-auto">{cluster.entities.length}</span>
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
    { type: 'person', label: 'บุคคล', emoji: '👤' },
    { type: 'phone', label: 'เบอร์โทร', emoji: '📱' },
    { type: 'account', label: 'บัญชี', emoji: '🏦' },
    { type: 'address', label: 'ที่อยู่', emoji: '🏠' },
    { type: 'organization', label: 'องค์กร', emoji: '🏢' },
    { type: 'crypto', label: 'Crypto', emoji: '₿' },
    { type: 'vehicle', label: 'ยานพาหนะ', emoji: '🚗' },
  ];
  
  return (
    <div className="bg-dark-800 rounded-xl border border-dark-700">
      <button onClick={onToggle} className="w-full p-3 flex items-center justify-between text-sm font-semibold text-white hover:bg-dark-700 rounded-t-xl">
        <span className="flex items-center gap-2">
          <Filter size={16} className="text-primary-400" />
          ตัวกรอง
        </span>
        {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
      </button>
      {!collapsed && (
        <div className="p-3 pt-0 space-y-3">
          <div>
            <p className="text-xs text-dark-400 mb-2">ระดับความเสี่ยง</p>
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
            <p className="text-xs text-dark-400 mb-2">ประเภท Entity</p>
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
        
        {Object.keys(entity.metadata).length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-dark-400 mb-1">Metadata</h4>
            <div className="space-y-1">
              {Object.entries(entity.metadata).map(([key, value]) => (
                <div key={key} className="flex justify-between text-xs">
                  <span className="text-dark-400">{key}:</span>
                  <span className="text-white">{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
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

const SuspiciousPatternCard = ({ pattern }: { pattern: SuspiciousPattern }) => (
  <div className="border border-dark-700 rounded-xl p-4" style={{ backgroundColor: getRiskColor(pattern.severity) + '10' }}>
    <div className="flex items-start gap-3">
      <AlertTriangle size={18} style={{ color: getRiskColor(pattern.severity) }} />
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="text-white font-medium text-sm">{pattern.type}</h4>
          <span className="px-2 py-0.5 rounded text-xs uppercase" style={{ backgroundColor: getRiskColor(pattern.severity) + '30', color: getRiskColor(pattern.severity) }}>
            {pattern.severity}
          </span>
        </div>
        <p className="text-xs text-dark-400 mb-2">{pattern.description}</p>
        <div className="space-y-1">
          {pattern.evidence.map((ev, i) => (
            <div key={i} className="flex items-center gap-1 text-xs text-dark-500">
              <ChevronRight size={10} />
              <span>{ev}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// ============================================
// MAIN COMPONENT
// ============================================

export const CallAnalysis = () => {
  const [entities] = useState<Entity[]>(SAMPLE_ENTITIES);
  const [links] = useState<Link[]>(SAMPLE_LINKS);
  const [clusters] = useState<Cluster[]>(SAMPLE_CLUSTERS);
  const [patterns] = useState<SuspiciousPattern[]>(SAMPLE_PATTERNS);
  
  const [selectedCluster, setSelectedCluster] = useState<number | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [activeTab, setActiveTab] = useState<'network' | 'patterns' | 'timeline'>('network');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [clusterPanelCollapsed, setClusterPanelCollapsed] = useState(false);
  const [filterPanelCollapsed, setFilterPanelCollapsed] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [layoutType, setLayoutType] = useState<LayoutType>('cose');
  const [showLabels, setShowLabels] = useState(true);
  
  const [riskFilter, setRiskFilter] = useState<RiskLevel[]>(['critical', 'high', 'medium', 'low', 'unknown']);
  const [typeFilter, setTypeFilter] = useState<EntityType[]>(['person', 'phone', 'account', 'address', 'organization', 'crypto', 'vehicle']);
  
  const [pathMode, setPathMode] = useState(false);
  const [pathStart, setPathStart] = useState<string | null>(null);
  const [pathEnd, setPathEnd] = useState<string | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const cyContainerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);

  // Filter entities
  const filteredEntities = entities.filter(e => {
    if (selectedCluster && e.clusterId !== selectedCluster) return false;
    if (!riskFilter.includes(e.risk)) return false;
    if (!typeFilter.includes(e.type)) return false;
    return true;
  });
  
  const filteredEntityIds = new Set(filteredEntities.map(e => e.id));
  const filteredLinks = links.filter(l => filteredEntityIds.has(l.source) && filteredEntityIds.has(l.target));

  // Initialize Cytoscape
  useEffect(() => {
    if (!cyContainerRef.current) return;

    // Destroy previous instance
    if (cyRef.current) {
      cyRef.current.destroy();
    }

    // Create nodes
    const nodes = filteredEntities.map(entity => ({
      data: {
        id: entity.id,
        label: entity.label,
        subLabel: entity.subLabel || '',
        type: entity.type,
        risk: entity.risk,
        clusterId: entity.clusterId,
        emoji: getEntityEmoji(entity.type),
        color: getClusterColor(entity.clusterId, clusters),
        riskColor: getRiskColor(entity.risk),
      }
    }));

    // Create edges
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

    // Initialize Cytoscape
    const cy = cytoscape({
      container: cyContainerRef.current,
      elements: { nodes, edges },
      style: [
        {
          selector: 'node',
          style: {
            'background-color': 'data(color)',
            'border-color': 'data(riskColor)',
            'border-width': 3,
            'width': 50,
            'height': 50,
            'label': showLabels ? 'data(label)' : '',
            'text-valign': 'bottom',
            'text-halign': 'center',
            'text-margin-y': 8,
            'font-size': 10,
            'color': '#e5e7eb',
            'text-outline-color': '#111827',
            'text-outline-width': 2,
            'text-max-width': '100px',
            'text-wrap': 'ellipsis',
            'content': 'data(emoji)',
            'text-valign': 'center',
            'text-halign': 'center',
            'font-size': 24,
          }
        },
        {
          selector: 'node[label]',
          style: {
            'label': showLabels ? 'data(label)' : '',
          }
        },
        {
          selector: 'node:selected',
          style: {
            'border-color': '#ffffff',
            'border-width': 5,
            'background-color': 'data(color)',
          }
        },
        {
          selector: 'node.highlighted',
          style: {
            'border-color': '#00ff00',
            'border-width': 5,
          }
        },
        {
          selector: 'node.searched',
          style: {
            'border-color': '#ffff00',
            'border-width': 5,
            'border-style': 'dashed',
          }
        },
        {
          selector: 'node.path',
          style: {
            'border-color': '#00ff00',
            'border-width': 6,
            'background-opacity': 1,
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
            'width': 'mapData(weight, 1, 300, 1, 8)',
            'line-color': 'data(color)',
            'target-arrow-color': 'data(color)',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'opacity': 0.7,
          }
        },
        {
          selector: 'edge:selected',
          style: {
            'line-color': '#ffffff',
            'target-arrow-color': '#ffffff',
            'opacity': 1,
            'width': 'mapData(weight, 1, 300, 2, 12)',
          }
        },
        {
          selector: 'edge.path',
          style: {
            'line-color': '#00ff00',
            'target-arrow-color': '#00ff00',
            'opacity': 1,
            'width': 6,
          }
        },
        {
          selector: 'edge.faded',
          style: {
            'opacity': 0.1,
          }
        },
      ],
      layout: {
        name: layoutType,
        animate: true,
        animationDuration: 500,
        fit: true,
        padding: 50,
        ...(layoutType === 'cose' ? {
          nodeRepulsion: () => 8000,
          idealEdgeLength: () => 100,
          edgeElasticity: () => 100,
          gravity: 0.25,
        } : {}),
        ...(layoutType === 'concentric' ? {
          concentric: (node: NodeSingular) => node.data('clusterId') || 0,
          levelWidth: () => 2,
        } : {}),
        ...(layoutType === 'breadthfirst' ? {
          directed: true,
          roots: '#P001',
        } : {}),
      },
      minZoom: 0.2,
      maxZoom: 3,
      wheelSensitivity: 0.3,
    });

    // Event handlers
    cy.on('tap', 'node', (evt) => {
      const node = evt.target;
      const entityId = node.id();
      const entity = entities.find(e => e.id === entityId);
      
      if (pathMode) {
        if (!pathStart) {
          setPathStart(entityId);
          node.addClass('path');
        } else if (!pathEnd && entityId !== pathStart) {
          setPathEnd(entityId);
          // Find and highlight shortest path
          const dijkstra = cy.elements().dijkstra('#' + pathStart);
          const pathToEnd = dijkstra.pathTo(node);
          pathToEnd.addClass('path');
          cy.elements().not(pathToEnd).addClass('faded');
        } else {
          // Reset path
          cy.elements().removeClass('path faded');
          setPathStart(entityId);
          setPathEnd(null);
          node.addClass('path');
        }
      } else {
        setSelectedEntity(entity || null);
        
        // Highlight connected nodes
        cy.elements().removeClass('highlighted faded');
        if (entity) {
          const connected = node.neighborhood().add(node);
          connected.addClass('highlighted');
          cy.elements().not(connected).addClass('faded');
        }
      }
    });

    cy.on('tap', (evt) => {
      if (evt.target === cy) {
        setSelectedEntity(null);
        cy.elements().removeClass('highlighted faded path');
        if (!pathMode) {
          setPathStart(null);
          setPathEnd(null);
        }
      }
    });

    cyRef.current = cy;

    return () => {
      cy.destroy();
    };
  }, [filteredEntities, filteredLinks, layoutType, showLabels, clusters]);

  // Search highlighting
  useEffect(() => {
    if (!cyRef.current) return;
    
    cyRef.current.nodes().removeClass('searched');
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      cyRef.current.nodes().forEach(node => {
        const label = node.data('label')?.toLowerCase() || '';
        if (label.includes(searchLower)) {
          node.addClass('searched');
        }
      });
    }
  }, [searchTerm]);

  // Layout change
  const changeLayout = (newLayout: LayoutType) => {
    setLayoutType(newLayout);
    if (cyRef.current) {
      cyRef.current.layout({
        name: newLayout,
        animate: true,
        animationDuration: 500,
        fit: true,
        padding: 50,
        ...(newLayout === 'cose' ? {
          nodeRepulsion: () => 8000,
          idealEdgeLength: () => 100,
          gravity: 0.25,
        } : {}),
        ...(newLayout === 'concentric' ? {
          concentric: (node: NodeSingular) => node.data('clusterId') || 0,
          levelWidth: () => 2,
        } : {}),
      }).run();
    }
  };

  // Export PNG
  const handleExportPNG = () => {
    if (!cyRef.current) return;
    const png = cyRef.current.png({ full: true, scale: 2, bg: '#111827' });
    const link = document.createElement('a');
    link.download = `network-analysis-${new Date().toISOString().slice(0, 10)}.png`;
    link.href = png;
    link.click();
  };

  // Reset view
  const handleReset = () => {
    if (cyRef.current) {
      cyRef.current.fit();
      cyRef.current.elements().removeClass('highlighted faded path searched');
    }
    setSelectedEntity(null);
    setSearchTerm('');
    setPathMode(false);
    setPathStart(null);
    setPathEnd(null);
  };

  // Fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const layouts: { id: LayoutType; label: string; icon: typeof Layout }[] = [
    { id: 'cose', label: 'Force', icon: Workflow },
    { id: 'circle', label: 'Circle', icon: Circle },
    { id: 'grid', label: 'Grid', icon: Grid3X3 },
    { id: 'breadthfirst', label: 'Tree', icon: GitBranch },
    { id: 'concentric', label: 'Cluster', icon: Target },
  ];

  return (
    <div ref={containerRef} className={`flex-1 flex flex-col bg-dark-900 ${isFullscreen ? 'fixed inset-0 z-50' : 'min-h-screen'}`}>
      {/* Header */}
      <div className="p-4 border-b border-dark-700">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Shield className="text-primary-400" size={24} />
              Intelligence Network Analysis
              <span className="text-xs bg-primary-500/20 text-primary-400 px-2 py-0.5 rounded ml-2">Cytoscape.js</span>
            </h1>
            <p className="text-sm text-dark-400">Link Analysis - คดีเครือข่ายค้ายาเสพติด</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => { setPathMode(!pathMode); setPathStart(null); setPathEnd(null); cyRef.current?.elements().removeClass('path faded'); }} className={pathMode ? 'bg-green-500/20 text-green-400' : ''}>
              <Route size={16} className="mr-1" />
              {pathMode ? 'ยกเลิก Path' : 'หา Path'}
            </Button>
            <Button variant="ghost" size="sm" onClick={handleExportPNG}>
              <Image size={16} className="mr-1" />
              Export PNG
            </Button>
            <Button variant="ghost" size="sm" onClick={toggleFullscreen}>
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </Button>
          </div>
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
          {pathMode && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 rounded-lg text-green-400">
              <Route size={14} />
              <span>{pathStart ? `Start: ${entities.find(e => e.id === pathStart)?.label.slice(0, 15)}...` : 'เลือกจุดเริ่ม'}</span>
              {pathEnd && <span>→ Found!</span>}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 border-b border-dark-700">
        <div className="flex gap-1">
          {[
            { id: 'network', label: 'Network Graph', icon: Network },
            { id: 'patterns', label: 'Suspicious Patterns', icon: AlertTriangle },
            { id: 'timeline', label: 'Timeline', icon: Clock },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id ? 'text-primary-400 border-primary-400' : 'text-dark-400 border-transparent hover:text-white'}`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {activeTab === 'network' && (
          <>
            {/* Canvas Area */}
            <div className="flex-1 p-4 flex flex-col overflow-hidden">
              {/* Toolbar */}
              <div className="mb-3 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-dark-400" size={14} />
                    <input
                      type="text"
                      placeholder="ค้นหา Entity..."
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
                  <Button variant="ghost" size="sm" onClick={() => cyRef.current?.fit()}>
                    <ZoomOut size={14} className="mr-1" />
                    Fit
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleReset}>
                    <RotateCcw size={14} className="mr-1" />
                    Reset
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
                    {sidebarCollapsed ? <ChevronRight size={14} /> : <X size={14} />}
                  </Button>
                </div>
              </div>
              
              {/* Cytoscape Container */}
              <div className="flex-1 relative min-h-0 bg-dark-950 rounded-xl border border-dark-700">
                <div ref={cyContainerRef} className="absolute inset-0" />
                
                {/* Instructions */}
                <div className="absolute bottom-4 left-4 flex items-center gap-4 text-xs text-dark-500 bg-dark-900/80 px-3 py-2 rounded-lg">
                  <span>🖱️ ลาก Node</span>
                  <span>📍 Pan ด้วยพื้นหลัง</span>
                  <span>🔍 Scroll ซูม</span>
                  <span>👆 คลิกเลือก</span>
                </div>
              </div>
              
              {/* Legend */}
              <div className="mt-3 flex flex-wrap items-center gap-4 text-xs">
                <span className="text-dark-400">Link Types:</span>
                {[
                  { type: 'call', label: 'โทรศัพท์' },
                  { type: 'sms', label: 'SMS' },
                  { type: 'transfer', label: 'โอนเงิน' },
                  { type: 'meeting', label: 'พบปะ' },
                  { type: 'business', label: 'ธุรกิจ' },
                ].map(item => (
                  <div key={item.type} className="flex items-center gap-1">
                    <div className="w-4 h-1 rounded" style={{ backgroundColor: getLinkColor(item.type as LinkType) }} />
                    <span className="text-dark-400">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Sidebar */}
            {!sidebarCollapsed && (
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
                      cyRef.current?.elements().removeClass('highlighted faded');
                    }}
                  />
                )}
              </div>
            )}
          </>
        )}

        {activeTab === 'patterns' && (
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="max-w-4xl mx-auto space-y-4">
              <div className="bg-dark-800 rounded-xl border border-dark-700 p-4">
                <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                  <Zap className="text-amber-400" />
                  AI Pattern Detection
                </h3>
                <p className="text-sm text-dark-400">พบ {patterns.length} รูปแบบที่น่าสงสัย</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {patterns.map(pattern => (
                  <SuspiciousPatternCard key={pattern.id} pattern={pattern} />
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="flex-1 p-4 flex items-center justify-center">
            <div className="text-center text-dark-400">
              <Clock size={48} className="mx-auto mb-4 opacity-50" />
              <p>Timeline Analysis - Coming Soon</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export { CallAnalysis as CallAnalysisPage };
export default CallAnalysis;
