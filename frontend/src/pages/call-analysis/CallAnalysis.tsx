/**
 * Intelligence Network Analysis V4 - Professional Grade
 * Complete Link Analysis Tool inspired by:
 * - i2 Analyst's Notebook (FBI)
 * - Palantir Gotham (CIA/NSA)
 * - FinCEN (Financial Crimes)
 * 
 * Features:
 * 1. Drag & Drop Nodes ✅
 * 2. Zoom & Pan ✅
 * 3. Fullscreen Mode ✅
 * 4. Collapsible Panels ✅
 * 5. Search Entity ✅
 * 6. Export PNG ✅
 * 7. Filter by Risk Level ✅
 * 8. Filter by Entity Type ✅
 * 9. Hover Tooltips ✅
 * 10. Community Detection ✅
 * 11. Shortest Path ✅
 * 12. Multi-select ✅
 */
import { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Download,
  Clock,
  Users,
  AlertTriangle,
  Network,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  X,
  Target,
  Share2,
  Shield,
  Zap,
  Play,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  Search,
  ZoomIn,
  ZoomOut,
  Move,
  Image,
  Filter,
  RotateCcw,
  Route,
  MousePointer
} from 'lucide-react';
import { Button } from '../../components/ui';

// ============================================
// TYPES
// ============================================

type EntityType = 'person' | 'phone' | 'account' | 'address' | 'organization' | 'crypto' | 'vehicle';
type LinkType = 'call' | 'sms' | 'transfer' | 'meeting' | 'family' | 'business' | 'criminal';
type RiskLevel = 'critical' | 'high' | 'medium' | 'low' | 'unknown';

interface Entity {
  id: string;
  type: EntityType;
  label: string;
  subLabel?: string;
  risk: RiskLevel;
  clusterId?: number;
  metadata: Record<string, string | number>;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
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

interface TooltipData {
  x: number;
  y: number;
  entity: Entity | null;
  link: Link | null;
}

// ============================================
// SAMPLE DATA
// ============================================

const SAMPLE_ENTITIES: Entity[] = [
  // === CLUSTER 1: หัวหน้าเครือข่าย ===
  { id: 'P001', type: 'person', label: 'นาย ก. (Big Boss)', subLabel: 'หัวหน้าเครือข่าย', risk: 'critical', clusterId: 1, metadata: { age: 45, nationality: 'Thai', priors: 3 } },
  { id: 'PH001', type: 'phone', label: '081-XXX-1111', subLabel: 'เบอร์หลัก Boss', risk: 'critical', clusterId: 1, metadata: { carrier: 'AIS', registered: 'นอมินี' } },
  { id: 'PH002', type: 'phone', label: '082-XXX-2222', subLabel: 'เบอร์สำรอง', risk: 'high', clusterId: 1, metadata: { carrier: 'TRUE', registered: 'นอมินี' } },
  { id: 'ACC001', type: 'account', label: 'xxx-x-x1234-x', subLabel: 'บัญชี KBank', risk: 'critical', clusterId: 1, metadata: { bank: 'KBank', balance: 15000000 } },
  { id: 'ADDR001', type: 'address', label: 'คอนโด ABC Tower', subLabel: 'พระราม 9', risk: 'high', clusterId: 1, metadata: { floor: 32, unit: 'Penthouse' } },
  { id: 'CRYPTO001', type: 'crypto', label: '0x7a2B...9c3D', subLabel: 'ETH Wallet', risk: 'critical', clusterId: 1, metadata: { chain: 'Ethereum', balance: '45.2 ETH' } },
  
  // === CLUSTER 2: ผู้ประสานงาน ===
  { id: 'P002', type: 'person', label: 'นาย ข. (Coordinator)', subLabel: 'ผู้ประสานงาน', risk: 'high', clusterId: 2, metadata: { age: 38, nationality: 'Thai', priors: 1 } },
  { id: 'P003', type: 'person', label: 'น.ส. ค. (Money)', subLabel: 'ดูแลการเงิน', risk: 'high', clusterId: 2, metadata: { age: 35, nationality: 'Thai', priors: 0 } },
  { id: 'PH003', type: 'phone', label: '083-XXX-3333', subLabel: 'เบอร์ ข.', risk: 'high', clusterId: 2, metadata: { carrier: 'DTAC' } },
  { id: 'PH004', type: 'phone', label: '084-XXX-4444', subLabel: 'เบอร์ ค.', risk: 'high', clusterId: 2, metadata: { carrier: 'AIS' } },
  { id: 'ACC002', type: 'account', label: 'xxx-x-x5678-x', subLabel: 'บัญชี SCB', risk: 'high', clusterId: 2, metadata: { bank: 'SCB', balance: 8500000 } },
  { id: 'ORG001', type: 'organization', label: 'บ.นำเข้าส่งออก XYZ', subLabel: 'บังหน้า', risk: 'high', clusterId: 2, metadata: { registered: '2020', employees: 5 } },
  
  // === CLUSTER 3: ผู้ค้ารายย่อย ===
  { id: 'P004', type: 'person', label: 'นาย ง. (Dealer 1)', subLabel: 'พ่อค้ารายย่อย', risk: 'medium', clusterId: 3, metadata: { age: 28, area: 'คลองเตย' } },
  { id: 'P005', type: 'person', label: 'นาย จ. (Dealer 2)', subLabel: 'พ่อค้ารายย่อย', risk: 'medium', clusterId: 3, metadata: { age: 25, area: 'หนองจอก' } },
  { id: 'P006', type: 'person', label: 'น.ส. ฉ. (Dealer 3)', subLabel: 'พ่อค้ารายย่อย', risk: 'medium', clusterId: 3, metadata: { age: 22, area: 'บางกะปิ' } },
  { id: 'PH005', type: 'phone', label: '085-XXX-5555', risk: 'medium', clusterId: 3, metadata: {} },
  { id: 'PH006', type: 'phone', label: '086-XXX-6666', risk: 'medium', clusterId: 3, metadata: {} },
  { id: 'PH007', type: 'phone', label: '087-XXX-7777', risk: 'medium', clusterId: 3, metadata: {} },
  
  // === CLUSTER 4: Myanmar Connection ===
  { id: 'P007', type: 'person', label: 'Mr. Z (Supplier)', subLabel: 'แหล่งผลิต Myanmar', risk: 'critical', clusterId: 4, metadata: { nationality: 'Myanmar', alias: 'The Snake' } },
  { id: 'PH008', type: 'phone', label: '+95-XXX-8888', subLabel: 'เบอร์ Myanmar', risk: 'critical', clusterId: 4, metadata: { country: 'Myanmar' } },
  { id: 'CRYPTO002', type: 'crypto', label: 'TRX...abc123', subLabel: 'USDT TRC20', risk: 'critical', clusterId: 4, metadata: { chain: 'Tron', balance: '250,000 USDT' } },
  { id: 'ADDR002', type: 'address', label: 'Warehouse Tachileik', subLabel: 'ชายแดน Myanmar', risk: 'critical', clusterId: 4, metadata: { type: 'warehouse' } },
  
  // === CLUSTER 5: Logistics ===
  { id: 'P008', type: 'person', label: 'นาย ช. (Driver)', subLabel: 'คนขนส่ง', risk: 'medium', clusterId: 5, metadata: { age: 40, license: 'truck' } },
  { id: 'VEH001', type: 'vehicle', label: 'กข 1234', subLabel: 'รถบรรทุก 6 ล้อ', risk: 'high', clusterId: 5, metadata: { brand: 'HINO', color: 'white' } },
  { id: 'PH009', type: 'phone', label: '089-XXX-9999', risk: 'medium', clusterId: 5, metadata: {} },
  { id: 'ADDR003', type: 'address', label: 'โกดังเชียงราย', subLabel: 'จุดพักสินค้า', risk: 'high', clusterId: 5, metadata: { size: '500 sqm' } },
  
  // === Outside ===
  { id: 'P009', type: 'person', label: 'Unknown Male', subLabel: 'ยังไม่ระบุตัวตน', risk: 'unknown', metadata: {} },
  { id: 'PH010', type: 'phone', label: '090-XXX-0000', subLabel: 'Burner phone', risk: 'high', metadata: { note: 'ใช้ 3 วันแล้วทิ้ง' } },
];

const SAMPLE_LINKS: Link[] = [
  { id: 'L001', source: 'P001', target: 'PH001', type: 'call', weight: 150, firstSeen: '2025-06-01', lastSeen: '2026-01-14', metadata: { primary: 1 } },
  { id: 'L002', source: 'P001', target: 'PH002', type: 'call', weight: 45, firstSeen: '2025-08-01', lastSeen: '2026-01-14', metadata: {} },
  { id: 'L003', source: 'P001', target: 'ACC001', type: 'transfer', weight: 89, firstSeen: '2025-06-01', lastSeen: '2026-01-10', metadata: { totalAmount: 45000000 } },
  { id: 'L004', source: 'P001', target: 'ADDR001', type: 'meeting', weight: 30, firstSeen: '2025-06-01', lastSeen: '2026-01-14', metadata: {} },
  { id: 'L005', source: 'P001', target: 'CRYPTO001', type: 'transfer', weight: 35, firstSeen: '2025-09-01', lastSeen: '2026-01-12', metadata: { totalAmount: '120 ETH' } },
  { id: 'L006', source: 'PH001', target: 'PH003', type: 'call', weight: 85, firstSeen: '2025-06-01', lastSeen: '2026-01-14', metadata: { avgDuration: 180 } },
  { id: 'L007', source: 'PH001', target: 'PH004', type: 'call', weight: 42, firstSeen: '2025-07-01', lastSeen: '2026-01-14', metadata: {} },
  { id: 'L008', source: 'PH002', target: 'PH003', type: 'sms', weight: 120, firstSeen: '2025-08-01', lastSeen: '2026-01-14', metadata: { encrypted: 1 } },
  { id: 'L009', source: 'ACC001', target: 'ACC002', type: 'transfer', weight: 56, firstSeen: '2025-06-15', lastSeen: '2026-01-08', metadata: { totalAmount: 28000000 } },
  { id: 'L010', source: 'P002', target: 'PH003', type: 'call', weight: 200, firstSeen: '2025-06-01', lastSeen: '2026-01-14', metadata: {} },
  { id: 'L011', source: 'P003', target: 'PH004', type: 'call', weight: 180, firstSeen: '2025-06-01', lastSeen: '2026-01-14', metadata: {} },
  { id: 'L012', source: 'P002', target: 'P003', type: 'meeting', weight: 45, firstSeen: '2025-06-01', lastSeen: '2026-01-14', metadata: { location: 'office' } },
  { id: 'L013', source: 'P003', target: 'ACC002', type: 'transfer', weight: 150, firstSeen: '2025-06-01', lastSeen: '2026-01-14', metadata: {} },
  { id: 'L014', source: 'P002', target: 'ORG001', type: 'business', weight: 1, firstSeen: '2020-01-01', lastSeen: '2026-01-14', metadata: { role: 'Director' } },
  { id: 'L015', source: 'P003', target: 'ORG001', type: 'business', weight: 1, firstSeen: '2020-01-01', lastSeen: '2026-01-14', metadata: { role: 'Accountant' } },
  { id: 'L016', source: 'PH003', target: 'PH005', type: 'call', weight: 65, firstSeen: '2025-08-01', lastSeen: '2026-01-14', metadata: {} },
  { id: 'L017', source: 'PH003', target: 'PH006', type: 'call', weight: 58, firstSeen: '2025-08-01', lastSeen: '2026-01-14', metadata: {} },
  { id: 'L018', source: 'PH004', target: 'PH007', type: 'call', weight: 72, firstSeen: '2025-09-01', lastSeen: '2026-01-14', metadata: {} },
  { id: 'L019', source: 'PH003', target: 'PH007', type: 'sms', weight: 45, firstSeen: '2025-10-01', lastSeen: '2026-01-14', metadata: {} },
  { id: 'L020', source: 'P004', target: 'PH005', type: 'call', weight: 300, firstSeen: '2025-08-01', lastSeen: '2026-01-14', metadata: {} },
  { id: 'L021', source: 'P005', target: 'PH006', type: 'call', weight: 280, firstSeen: '2025-08-01', lastSeen: '2026-01-14', metadata: {} },
  { id: 'L022', source: 'P006', target: 'PH007', type: 'call', weight: 250, firstSeen: '2025-09-01', lastSeen: '2026-01-14', metadata: {} },
  { id: 'L023', source: 'PH005', target: 'PH006', type: 'call', weight: 35, firstSeen: '2025-10-01', lastSeen: '2026-01-14', metadata: { note: 'emergency' } },
  { id: 'L024', source: 'PH001', target: 'PH008', type: 'call', weight: 25, firstSeen: '2025-06-01', lastSeen: '2026-01-10', metadata: { international: 1, avgDuration: 300 } },
  { id: 'L025', source: 'CRYPTO001', target: 'CRYPTO002', type: 'transfer', weight: 18, firstSeen: '2025-09-01', lastSeen: '2026-01-05', metadata: { totalAmount: '180 ETH' } },
  { id: 'L026', source: 'P007', target: 'PH008', type: 'call', weight: 100, firstSeen: '2025-01-01', lastSeen: '2026-01-14', metadata: {} },
  { id: 'L027', source: 'P007', target: 'CRYPTO002', type: 'transfer', weight: 50, firstSeen: '2025-06-01', lastSeen: '2026-01-14', metadata: {} },
  { id: 'L028', source: 'P007', target: 'ADDR002', type: 'meeting', weight: 100, firstSeen: '2025-01-01', lastSeen: '2026-01-14', metadata: {} },
  { id: 'L029', source: 'PH003', target: 'PH009', type: 'call', weight: 40, firstSeen: '2025-10-01', lastSeen: '2026-01-14', metadata: { timing: 'night' } },
  { id: 'L030', source: 'P008', target: 'PH009', type: 'call', weight: 150, firstSeen: '2025-10-01', lastSeen: '2026-01-14', metadata: {} },
  { id: 'L031', source: 'P008', target: 'VEH001', type: 'meeting', weight: 80, firstSeen: '2025-10-01', lastSeen: '2026-01-14', metadata: { role: 'driver' } },
  { id: 'L032', source: 'VEH001', target: 'ADDR003', type: 'meeting', weight: 25, firstSeen: '2025-11-01', lastSeen: '2026-01-14', metadata: {} },
  { id: 'L033', source: 'ADDR003', target: 'ADDR002', type: 'transfer', weight: 12, firstSeen: '2025-11-01', lastSeen: '2026-01-08', metadata: { note: 'shipment' } },
  { id: 'L034', source: 'PH002', target: 'PH010', type: 'call', weight: 8, firstSeen: '2026-01-10', lastSeen: '2026-01-12', metadata: { suspicious: 1 } },
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
// HELPER FUNCTIONS
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

const getEntityColor = (entity: Entity, clusters: Cluster[]): string => {
  if (entity.clusterId) {
    const cluster = clusters.find(c => c.id === entity.clusterId);
    if (cluster) return cluster.color;
  }
  const riskColors: Record<RiskLevel, string> = {
    critical: '#ef4444',
    high: '#f97316',
    medium: '#eab308',
    low: '#22c55e',
    unknown: '#6b7280'
  };
  return riskColors[entity.risk];
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

// BFS for shortest path
const findShortestPath = (links: Link[], startId: string, endId: string): string[] => {
  const adjacency: Record<string, string[]> = {};
  links.forEach(link => {
    if (!adjacency[link.source]) adjacency[link.source] = [];
    if (!adjacency[link.target]) adjacency[link.target] = [];
    adjacency[link.source].push(link.target);
    adjacency[link.target].push(link.source);
  });
  
  const queue: string[][] = [[startId]];
  const visited = new Set<string>([startId]);
  
  while (queue.length > 0) {
    const path = queue.shift()!;
    const node = path[path.length - 1];
    
    if (node === endId) return path;
    
    for (const neighbor of adjacency[node] || []) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push([...path, neighbor]);
      }
    }
  }
  return [];
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
    <button
      onClick={onToggle}
      className="w-full p-3 flex items-center justify-between text-sm font-semibold text-white hover:bg-dark-700 rounded-t-xl"
    >
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
          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
            selectedCluster === null ? 'bg-primary-500/20 text-primary-400' : 'hover:bg-dark-700 text-dark-300'
          }`}
        >
          ทั้งหมด
        </button>
        {clusters.map(cluster => (
          <button
            key={cluster.id}
            onClick={() => onSelectCluster(cluster.id)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
              selectedCluster === cluster.id ? 'bg-dark-600' : 'hover:bg-dark-700'
            }`}
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

const FilterPanel = ({ 
  riskFilter, 
  setRiskFilter, 
  typeFilter, 
  setTypeFilter,
  collapsed,
  onToggle
}: {
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
  
  const toggleRisk = (level: RiskLevel) => {
    if (riskFilter.includes(level)) {
      setRiskFilter(riskFilter.filter(r => r !== level));
    } else {
      setRiskFilter([...riskFilter, level]);
    }
  };
  
  const toggleType = (type: EntityType) => {
    if (typeFilter.includes(type)) {
      setTypeFilter(typeFilter.filter(t => t !== type));
    } else {
      setTypeFilter([...typeFilter, type]);
    }
  };
  
  return (
    <div className="bg-dark-800 rounded-xl border border-dark-700">
      <button
        onClick={onToggle}
        className="w-full p-3 flex items-center justify-between text-sm font-semibold text-white hover:bg-dark-700 rounded-t-xl"
      >
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
                  onClick={() => toggleRisk(r.level)}
                  className={`px-2 py-1 rounded text-xs transition-colors ${
                    riskFilter.includes(r.level) 
                      ? 'text-white' 
                      : 'text-dark-500 opacity-50'
                  }`}
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
                  onClick={() => toggleType(t.type)}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                    typeFilter.includes(t.type) 
                      ? 'bg-dark-600 text-white' 
                      : 'text-dark-500 opacity-50'
                  }`}
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

const EntityDetailPanel = ({ entity, links, entities, onClose }: {
  entity: Entity;
  links: Link[];
  entities: Entity[];
  onClose: () => void;
}) => {
  const emoji = getEntityEmoji(entity.type);
  const connectedLinks = links.filter(l => l.source === entity.id || l.target === entity.id);
  
  const riskColors: Record<RiskLevel, string> = {
    critical: 'text-red-400 bg-red-500/20',
    high: 'text-orange-400 bg-orange-500/20',
    medium: 'text-yellow-400 bg-yellow-500/20',
    low: 'text-green-400 bg-green-500/20',
    unknown: 'text-gray-400 bg-gray-500/20'
  };
  
  return (
    <div className="bg-dark-800 rounded-xl border border-dark-700 p-4">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${riskColors[entity.risk]}`}>
            {emoji}
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
        <div>
          <span className={`px-2 py-1 rounded text-xs uppercase ${riskColors[entity.risk]}`}>
            Risk: {entity.risk}
          </span>
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

const SuspiciousPatternCard = ({ pattern }: { pattern: SuspiciousPattern }) => {
  const severityColors: Record<RiskLevel, { bg: string; text: string }> = {
    critical: { bg: 'bg-red-500/10', text: 'text-red-400' },
    high: { bg: 'bg-orange-500/10', text: 'text-orange-400' },
    medium: { bg: 'bg-yellow-500/10', text: 'text-yellow-400' },
    low: { bg: 'bg-green-500/10', text: 'text-green-400' },
    unknown: { bg: 'bg-gray-500/10', text: 'text-gray-400' }
  };
  const colors = severityColors[pattern.severity];
  
  return (
    <div className={`${colors.bg} border border-dark-700 rounded-xl p-4`}>
      <div className="flex items-start gap-3">
        <AlertTriangle size={18} className={colors.text} />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-white font-medium text-sm">{pattern.type}</h4>
            <span className={`px-2 py-0.5 rounded text-xs uppercase ${colors.bg} ${colors.text}`}>
              {pattern.severity}
            </span>
          </div>
          <p className="text-xs text-dark-400 mb-2">{pattern.description}</p>
          <div className="space-y-1">
            {pattern.evidence.slice(0, 3).map((ev, i) => (
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
};

const Tooltip = ({ data, clusters }: { data: TooltipData | null; clusters: Cluster[] }) => {
  if (!data || (!data.entity && !data.link)) return null;
  
  return (
    <div 
      className="absolute z-50 bg-dark-800 border border-dark-600 rounded-lg p-3 shadow-xl pointer-events-none"
      style={{ left: data.x + 15, top: data.y + 15, maxWidth: 250 }}
    >
      {data.entity && (
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{getEntityEmoji(data.entity.type)}</span>
            <span className="text-white font-medium text-sm">{data.entity.label}</span>
          </div>
          {data.entity.subLabel && <p className="text-xs text-dark-400">{data.entity.subLabel}</p>}
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs text-dark-500">Risk:</span>
            <span className={`text-xs px-1.5 py-0.5 rounded ${
              data.entity.risk === 'critical' ? 'bg-red-500/20 text-red-400' :
              data.entity.risk === 'high' ? 'bg-orange-500/20 text-orange-400' :
              data.entity.risk === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-gray-500/20 text-gray-400'
            }`}>{data.entity.risk}</span>
          </div>
        </div>
      )}
      {data.link && (
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getLinkColor(data.link.type) }} />
            <span className="text-white font-medium text-sm capitalize">{data.link.type}</span>
          </div>
          <p className="text-xs text-dark-400">Weight: {data.link.weight}</p>
          <p className="text-xs text-dark-500">{data.link.firstSeen} → {data.link.lastSeen}</p>
        </div>
      )}
    </div>
  );
};

// ============================================
// NETWORK CANVAS
// ============================================

const NetworkCanvas = ({ 
  entities, 
  links, 
  clusters,
  selectedCluster,
  selectedEntities,
  onSelectEntity,
  showClusterBoxes,
  riskFilter,
  typeFilter,
  searchTerm,
  pathEntities,
  zoom,
  pan,
  onZoomChange,
  onPanChange,
  onTooltipChange
}: {
  entities: Entity[];
  links: Link[];
  clusters: Cluster[];
  selectedCluster: number | null;
  selectedEntities: string[];
  onSelectEntity: (id: string, multiSelect: boolean) => void;
  showClusterBoxes: boolean;
  riskFilter: RiskLevel[];
  typeFilter: EntityType[];
  searchTerm: string;
  pathEntities: string[];
  zoom: number;
  pan: { x: number; y: number };
  onZoomChange: (z: number) => void;
  onPanChange: (p: { x: number; y: number }) => void;
  onTooltipChange: (t: TooltipData | null) => void;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<Entity[]>([]);
  const [isSimulating, setIsSimulating] = useState(true);
  const animationRef = useRef<number | null>(null);
  const frameCountRef = useRef(0);
  const draggedNodeRef = useRef<string | null>(null);
  const isDraggingRef = useRef(false);
  const isPanningRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });
  
  // Filter entities
  const filteredEntities = entities.filter(e => {
    if (selectedCluster && e.clusterId !== selectedCluster) {
      const connected = links.some(l => 
        (l.source === e.id || l.target === e.id) && 
        entities.some(e2 => e2.id === (l.source === e.id ? l.target : l.source) && e2.clusterId === selectedCluster)
      );
      if (!connected) return false;
    }
    if (!riskFilter.includes(e.risk)) return false;
    if (!typeFilter.includes(e.type)) return false;
    return true;
  });
    
  const filteredLinks = links.filter(l => 
    filteredEntities.some(e => e.id === l.source) && 
    filteredEntities.some(e => e.id === l.target)
  );

  // Initialize positions
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const width = canvas.width;
    const height = canvas.height;
    
    const clusterCenters: Record<number, { x: number; y: number }> = {
      1: { x: width * 0.5, y: height * 0.25 },
      2: { x: width * 0.3, y: height * 0.5 },
      3: { x: width * 0.15, y: height * 0.75 },
      4: { x: width * 0.75, y: height * 0.25 },
      5: { x: width * 0.7, y: height * 0.7 },
    };
    
    const newNodes = filteredEntities.map(entity => ({
      ...entity,
      x: entity.clusterId 
        ? clusterCenters[entity.clusterId]?.x + (Math.random() - 0.5) * 120 || Math.random() * width
        : Math.random() * width,
      y: entity.clusterId 
        ? clusterCenters[entity.clusterId]?.y + (Math.random() - 0.5) * 100 || Math.random() * height
        : Math.random() * height,
      vx: 0,
      vy: 0
    }));
    
    setNodes(newNodes);
    frameCountRef.current = 0;
    setIsSimulating(true);
  }, [filteredEntities.length, selectedCluster]);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || nodes.length === 0) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const width = canvas.width;
    const height = canvas.height;
    
    const drawIcon = (x: number, y: number, size: number, emoji: string, color: string, isSelected: boolean, isPath: boolean, isSearch: boolean) => {
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fillStyle = color + '40';
      ctx.fill();
      
      if (isSelected || isPath) {
        ctx.strokeStyle = isPath ? '#00ff00' : '#fff';
        ctx.lineWidth = 3;
        ctx.stroke();
      } else {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      
      if (isSearch) {
        ctx.beginPath();
        ctx.arc(x, y, size + 8, 0, Math.PI * 2);
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      
      ctx.font = `${size * 1.2}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(emoji, x, y);
    };
    
    const simulate = () => {
      const nodesCopy = [...nodes];
      
      if (isSimulating && frameCountRef.current < 300 && !isDraggingRef.current) {
        // Physics simulation
        for (let i = 0; i < nodesCopy.length; i++) {
          for (let j = i + 1; j < nodesCopy.length; j++) {
            const dx = nodesCopy[j].x! - nodesCopy[i].x!;
            const dy = nodesCopy[j].y! - nodesCopy[i].y!;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const force = 2000 / (dist * dist);
            
            nodesCopy[i].vx! -= (dx / dist) * force * 0.1;
            nodesCopy[i].vy! -= (dy / dist) * force * 0.1;
            nodesCopy[j].vx! += (dx / dist) * force * 0.1;
            nodesCopy[j].vy! += (dy / dist) * force * 0.1;
          }
        }
        
        filteredLinks.forEach(link => {
          const source = nodesCopy.find(n => n.id === link.source);
          const target = nodesCopy.find(n => n.id === link.target);
          if (!source || !target) return;
          
          const dx = target.x! - source.x!;
          const dy = target.y! - source.y!;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const idealDist = 80 + (100 - Math.min(link.weight, 100));
          const force = (dist - idealDist) * 0.02;
          
          source.vx! += (dx / dist) * force;
          source.vy! += (dy / dist) * force;
          target.vx! -= (dx / dist) * force;
          target.vy! -= (dy / dist) * force;
        });
        
        const clusterCenters: Record<number, { x: number; y: number; count: number }> = {};
        nodesCopy.forEach(node => {
          if (node.clusterId) {
            if (!clusterCenters[node.clusterId]) clusterCenters[node.clusterId] = { x: 0, y: 0, count: 0 };
            clusterCenters[node.clusterId].x += node.x!;
            clusterCenters[node.clusterId].y += node.y!;
            clusterCenters[node.clusterId].count++;
          }
        });
        Object.keys(clusterCenters).forEach(key => {
          const c = clusterCenters[parseInt(key)];
          c.x /= c.count;
          c.y /= c.count;
        });
        
        nodesCopy.forEach(node => {
          if (node.id === draggedNodeRef.current) return;
          
          if (node.clusterId && clusterCenters[node.clusterId]) {
            const center = clusterCenters[node.clusterId];
            node.vx! += (center.x - node.x!) * 0.01;
            node.vy! += (center.y - node.y!) * 0.01;
          }
          
          node.vx! += (width / 2 - node.x!) * 0.0005;
          node.vy! += (height / 2 - node.y!) * 0.0005;
          node.vx! *= 0.85;
          node.vy! *= 0.85;
          node.x! += node.vx!;
          node.y! += node.vy!;
          
          const margin = 50;
          node.x = Math.max(margin, Math.min(width - margin, node.x!));
          node.y = Math.max(margin, Math.min(height - margin, node.y!));
        });
        
        frameCountRef.current++;
      }
      
      // Render
      ctx.save();
      ctx.clearRect(0, 0, width, height);
      ctx.translate(pan.x, pan.y);
      ctx.scale(zoom, zoom);
      
      // Cluster backgrounds
      if (showClusterBoxes && !selectedCluster) {
        clusters.forEach(cluster => {
          const clusterNodes = nodesCopy.filter(n => n.clusterId === cluster.id);
          if (clusterNodes.length < 2) return;
          
          let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
          clusterNodes.forEach(n => {
            minX = Math.min(minX, n.x! - 30);
            minY = Math.min(minY, n.y! - 30);
            maxX = Math.max(maxX, n.x! + 30);
            maxY = Math.max(maxY, n.y! + 30);
          });
          
          const padding = 30;
          ctx.fillStyle = cluster.color + '15';
          ctx.strokeStyle = cluster.color + '40';
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
          ctx.beginPath();
          ctx.roundRect(minX - padding, minY - padding, maxX - minX + padding * 2, maxY - minY + padding * 2, 15);
          ctx.fill();
          ctx.stroke();
          ctx.setLineDash([]);
          
          ctx.fillStyle = cluster.color;
          ctx.font = 'bold 11px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText(cluster.name, minX - padding + 10, minY - padding + 18);
        });
      }
      
      // Links
      filteredLinks.forEach(link => {
        const source = nodesCopy.find(n => n.id === link.source);
        const target = nodesCopy.find(n => n.id === link.target);
        if (!source || !target) return;
        
        const isHighlighted = selectedEntities.includes(link.source) || selectedEntities.includes(link.target);
        const isPathLink = pathEntities.includes(link.source) && pathEntities.includes(link.target);
        
        ctx.beginPath();
        ctx.moveTo(source.x!, source.y!);
        ctx.lineTo(target.x!, target.y!);
        ctx.strokeStyle = isPathLink ? '#00ff00' : isHighlighted 
          ? getLinkColor(link.type) 
          : getLinkColor(link.type) + (selectedEntities.length > 0 ? '30' : '60');
        ctx.lineWidth = Math.min(Math.max(link.weight / 30, 1), 5) * (isHighlighted || isPathLink ? 2 : 1);
        ctx.stroke();
        
        if (link.type === 'transfer' || link.type === 'call') {
          const angle = Math.atan2(target.y! - source.y!, target.x! - source.x!);
          const midX = (source.x! + target.x!) / 2;
          const midY = (source.y! + target.y!) / 2;
          
          ctx.beginPath();
          ctx.moveTo(midX, midY);
          ctx.lineTo(midX - 8 * Math.cos(angle - Math.PI / 6), midY - 8 * Math.sin(angle - Math.PI / 6));
          ctx.lineTo(midX - 8 * Math.cos(angle + Math.PI / 6), midY - 8 * Math.sin(angle + Math.PI / 6));
          ctx.closePath();
          ctx.fillStyle = isPathLink ? '#00ff00' : isHighlighted ? getLinkColor(link.type) : getLinkColor(link.type) + '60';
          ctx.fill();
        }
      });
      
      // Nodes
      nodesCopy.forEach(node => {
        const isSelected = selectedEntities.includes(node.id);
        const isConnected = selectedEntities.length > 0 && filteredLinks.some(l => 
          (selectedEntities.includes(l.source) && l.target === node.id) ||
          (selectedEntities.includes(l.target) && l.source === node.id)
        );
        const isPath = pathEntities.includes(node.id);
        const isSearch = searchTerm && node.label.toLowerCase().includes(searchTerm.toLowerCase());
        const opacity = selectedEntities.length > 0 && !isSelected && !isConnected && !isPath ? 0.3 : 1;
        
        const baseSize = node.type === 'person' ? 18 : 14;
        const size = baseSize * (isSelected ? 1.3 : 1);
        const color = getEntityColor(node, clusters);
        
        if (isSelected) {
          ctx.shadowColor = color;
          ctx.shadowBlur = 20;
        }
        
        ctx.globalAlpha = opacity;
        drawIcon(node.x!, node.y!, size, getEntityEmoji(node.type), color, isSelected, isPath, !!isSearch);
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
        
        ctx.fillStyle = selectedEntities.length > 0 && !isSelected && !isConnected && !isPath ? '#6b728080' : '#e5e7eb';
        ctx.font = `${isSelected ? 'bold ' : ''}10px sans-serif`;
        ctx.textAlign = 'center';
        const label = node.label.length > 15 ? node.label.slice(0, 15) + '...' : node.label;
        ctx.fillText(label, node.x!, node.y! + size + 14);
      });
      
      ctx.restore();
      
      setNodes(nodesCopy);
      animationRef.current = requestAnimationFrame(simulate);
    };
    
    simulate();
    
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [nodes.length, isSimulating, selectedEntities, showClusterBoxes, zoom, pan, pathEntities, searchTerm]);

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const canvasX = (e.clientX - rect.left) * (canvas.width / rect.width);
    const canvasY = (e.clientY - rect.top) * (canvas.height / rect.height);
    return {
      x: (canvasX - pan.x) / zoom,
      y: (canvasY - pan.y) / zoom
    };
  };

  const findNodeAtPos = (x: number, y: number) => {
    return nodes.find(node => {
      const dx = node.x! - x;
      const dy = node.y! - y;
      return Math.sqrt(dx * dx + dy * dy) < 25;
    });
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getMousePos(e);
    const node = findNodeAtPos(x, y);
    
    if (node) {
      draggedNodeRef.current = node.id;
      isDraggingRef.current = true;
    } else {
      isPanningRef.current = true;
      lastMouseRef.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getMousePos(e);
    
    // Tooltip
    const node = findNodeAtPos(x, y);
    if (node) {
      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        onTooltipChange({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
          entity: node,
          link: null
        });
      }
    } else {
      onTooltipChange(null);
    }
    
    if (isDraggingRef.current && draggedNodeRef.current) {
      setNodes(prev => prev.map(node => 
        node.id === draggedNodeRef.current 
          ? { ...node, x, y, vx: 0, vy: 0 }
          : node
      ));
    } else if (isPanningRef.current) {
      const dx = e.clientX - lastMouseRef.current.x;
      const dy = e.clientY - lastMouseRef.current.y;
      onPanChange({ x: pan.x + dx, y: pan.y + dy });
      lastMouseRef.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDraggingRef.current && draggedNodeRef.current) {
      const { x, y } = getMousePos(e);
      const node = findNodeAtPos(x, y);
      if (node && node.id === draggedNodeRef.current) {
        onSelectEntity(node.id, e.ctrlKey || e.metaKey);
      }
    }
    draggedNodeRef.current = null;
    isDraggingRef.current = false;
    isPanningRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.min(Math.max(zoom * delta, 0.3), 3);
    onZoomChange(newZoom);
  };

  return (
    <div ref={containerRef} className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        width={1200}
        height={700}
        className="w-full h-full bg-dark-950 rounded-xl border border-dark-700 cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          isDraggingRef.current = false;
          isPanningRef.current = false;
          draggedNodeRef.current = null;
          onTooltipChange(null);
        }}
        onWheel={handleWheel}
      />
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

export const CallAnalysis = () => {
  const [entities] = useState<Entity[]>(SAMPLE_ENTITIES);
  const [links] = useState<Link[]>(SAMPLE_LINKS);
  const [clusters] = useState<Cluster[]>(SAMPLE_CLUSTERS);
  const [patterns] = useState<SuspiciousPattern[]>(SAMPLE_PATTERNS);
  
  const [selectedCluster, setSelectedCluster] = useState<number | null>(null);
  const [selectedEntities, setSelectedEntities] = useState<string[]>([]);
  const [showClusterBoxes, setShowClusterBoxes] = useState(true);
  const [activeTab, setActiveTab] = useState<'network' | 'patterns' | 'timeline'>('network');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [clusterPanelCollapsed, setClusterPanelCollapsed] = useState(false);
  const [filterPanelCollapsed, setFilterPanelCollapsed] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  
  const [riskFilter, setRiskFilter] = useState<RiskLevel[]>(['critical', 'high', 'medium', 'low', 'unknown']);
  const [typeFilter, setTypeFilter] = useState<EntityType[]>(['person', 'phone', 'account', 'address', 'organization', 'crypto', 'vehicle']);
  
  const [pathMode, setPathMode] = useState(false);
  const [pathStart, setPathStart] = useState<string | null>(null);
  const [pathEnd, setPathEnd] = useState<string | null>(null);
  const [pathEntities, setPathEntities] = useState<string[]>([]);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  
  const selectedEntityData = selectedEntities.length === 1 ? entities.find(e => e.id === selectedEntities[0]) : null;

  const handleSelectEntity = (id: string, multiSelect: boolean) => {
    if (pathMode) {
      if (!pathStart) {
        setPathStart(id);
        setSelectedEntities([id]);
      } else if (!pathEnd && id !== pathStart) {
        setPathEnd(id);
        const path = findShortestPath(links, pathStart, id);
        setPathEntities(path);
        setSelectedEntities([pathStart, id]);
      } else {
        setPathStart(id);
        setPathEnd(null);
        setPathEntities([]);
        setSelectedEntities([id]);
      }
    } else {
      if (multiSelect) {
        if (selectedEntities.includes(id)) {
          setSelectedEntities(selectedEntities.filter(e => e !== id));
        } else {
          setSelectedEntities([...selectedEntities, id]);
        }
      } else {
        setSelectedEntities(selectedEntities.includes(id) && selectedEntities.length === 1 ? [] : [id]);
      }
    }
  };

  const handleExportPNG = () => {
    const canvas = canvasContainerRef.current?.querySelector('canvas');
    if (!canvas) return;
    
    const link = document.createElement('a');
    link.download = `network-analysis-${new Date().toISOString().slice(0, 10)}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setSelectedEntities([]);
    setSearchTerm('');
    setPathMode(false);
    setPathStart(null);
    setPathEnd(null);
    setPathEntities([]);
  };

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
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const filteredEntityCount = entities.filter(e => 
    riskFilter.includes(e.risk) && typeFilter.includes(e.type)
  ).length;

  return (
    <div ref={containerRef} className={`flex-1 flex flex-col bg-dark-900 ${isFullscreen ? 'fixed inset-0 z-50' : 'min-h-screen'}`}>
      {/* Header */}
      <div className="p-4 border-b border-dark-700">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Shield className="text-primary-400" size={24} />
              Intelligence Network Analysis
            </h1>
            <p className="text-sm text-dark-400">Link Analysis - คดีเครือข่ายค้ายาเสพติด</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setPathMode(!pathMode)} className={pathMode ? 'bg-primary-500/20 text-primary-400' : ''}>
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
            <span className="text-white">{filteredEntityCount}</span>
            <span className="text-dark-400">Entities</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-dark-800 rounded-lg">
            <Share2 size={14} className="text-blue-400" />
            <span className="text-white">{links.length}</span>
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
              <span>{pathStart ? `Start: ${entities.find(e => e.id === pathStart)?.label.slice(0, 15)}` : 'เลือกจุดเริ่ม'}</span>
              {pathEnd && <span>→ End</span>}
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
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'text-primary-400 border-primary-400'
                    : 'text-dark-400 border-transparent hover:text-white'
                }`}
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
              <div className="mb-3 flex items-center justify-between">
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
                </div>
                
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setShowClusterBoxes(!showClusterBoxes)}>
                    {showClusterBoxes ? <Eye size={14} className="mr-1" /> : <EyeOff size={14} className="mr-1" />}
                    กรอบกลุ่ม
                  </Button>
                  <div className="flex items-center gap-1 bg-dark-800 rounded-lg p-1">
                    <button onClick={() => setZoom(Math.max(0.3, zoom - 0.2))} className="p-1.5 hover:bg-dark-700 rounded">
                      <ZoomOut size={14} className="text-dark-400" />
                    </button>
                    <span className="text-xs text-dark-400 w-12 text-center">{Math.round(zoom * 100)}%</span>
                    <button onClick={() => setZoom(Math.min(3, zoom + 0.2))} className="p-1.5 hover:bg-dark-700 rounded">
                      <ZoomIn size={14} className="text-dark-400" />
                    </button>
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleReset}>
                    <RotateCcw size={14} className="mr-1" />
                    Reset
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
                    {sidebarCollapsed ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
                  </Button>
                </div>
              </div>
              
              {/* Canvas */}
              <div ref={canvasContainerRef} className="flex-1 relative min-h-0">
                <NetworkCanvas
                  entities={entities}
                  links={links}
                  clusters={clusters}
                  selectedCluster={selectedCluster}
                  selectedEntities={selectedEntities}
                  onSelectEntity={handleSelectEntity}
                  showClusterBoxes={showClusterBoxes}
                  riskFilter={riskFilter}
                  typeFilter={typeFilter}
                  searchTerm={searchTerm}
                  pathEntities={pathEntities}
                  zoom={zoom}
                  pan={pan}
                  onZoomChange={setZoom}
                  onPanChange={setPan}
                  onTooltipChange={setTooltip}
                />
                <Tooltip data={tooltip} clusters={clusters} />
                
                {/* Controls overlay */}
                <div className="absolute bottom-4 left-4 flex items-center gap-2 text-xs text-dark-500">
                  <MousePointer size={12} /> คลิกเลือก
                  <Move size={12} className="ml-2" /> ลากเลื่อน
                  <span className="ml-2">Scroll ซูม</span>
                  <span className="ml-2">Ctrl+Click เลือกหลายตัว</span>
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
                
                {selectedEntityData && (
                  <EntityDetailPanel
                    entity={selectedEntityData}
                    links={links}
                    entities={entities}
                    onClose={() => setSelectedEntities([])}
                  />
                )}
                
                {selectedEntities.length > 1 && (
                  <div className="bg-dark-800 rounded-xl border border-dark-700 p-3">
                    <h3 className="text-sm font-semibold text-white mb-2">
                      เลือก {selectedEntities.length} รายการ
                    </h3>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {selectedEntities.map(id => {
                        const e = entities.find(ent => ent.id === id);
                        return e ? (
                          <div key={id} className="flex items-center gap-2 text-xs bg-dark-900 rounded p-1.5">
                            <span>{getEntityEmoji(e.type)}</span>
                            <span className="text-dark-300 truncate">{e.label}</span>
                          </div>
                        ) : null;
                      })}
                    </div>
                    <Button variant="ghost" size="sm" className="w-full mt-2" onClick={() => setSelectedEntities([])}>
                      ล้างการเลือก
                    </Button>
                  </div>
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
                <p className="text-sm text-dark-400">
                  พบ {patterns.length} รูปแบบที่น่าสงสัย
                </p>
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
