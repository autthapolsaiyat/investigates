/**
 * Intelligence Network Analysis V3
 * Professional-grade link analysis inspired by:
 * - i2 Analyst's Notebook (FBI standard)
 * - Palantir Gotham (CIA/NSA)
 * - FinCEN (Financial Crimes)
 * 
 * Features:
 * 1. Community/Cluster Detection
 * 2. Multiple Entity Types
 * 3. Link Strength Visualization
 * 4. Suspicious Pattern Detection
 * 5. Timeline Analysis
 * 6. Sample Drug Trafficking Case
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Upload,
  Download,
  Search,
  Clock,
  Users,
  BarChart3,
  Calendar,
  FileText,
  AlertTriangle,
  TrendingUp,
  Network,
  List,
  ChevronRight,
  X,
  Eye,
  Target,
  Share2,
  User,
  Building2,
  CreditCard,
  MapPin,
  Smartphone,
  Globe,
  Shield,
  Zap,
  Filter,
  Play,
  Pause,
  SkipForward,
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react';
import { Button, Input } from '../../components/ui';

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
  fixed?: boolean;
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
// SAMPLE CASE: DRUG TRAFFICKING NETWORK
// ============================================

const SAMPLE_ENTITIES: Entity[] = [
  // === CLUSTER 1: หัวหน้าเครือข่าย (Boss Network) ===
  { id: 'P001', type: 'person', label: 'นาย ก. (Big Boss)', subLabel: 'หัวหน้าเครือข่าย', risk: 'critical', clusterId: 1, metadata: { age: 45, nationality: 'Thai', priors: 3 } },
  { id: 'PH001', type: 'phone', label: '081-XXX-1111', subLabel: 'เบอร์หลัก Boss', risk: 'critical', clusterId: 1, metadata: { carrier: 'AIS', registered: 'นอมินี' } },
  { id: 'PH002', type: 'phone', label: '082-XXX-2222', subLabel: 'เบอร์สำรอง', risk: 'high', clusterId: 1, metadata: { carrier: 'TRUE', registered: 'นอมินี' } },
  { id: 'ACC001', type: 'account', label: 'xxx-x-x1234-x', subLabel: 'บัญชี KBank', risk: 'critical', clusterId: 1, metadata: { bank: 'KBank', balance: 15000000 } },
  { id: 'ADDR001', type: 'address', label: 'คอนโด ABC Tower', subLabel: 'พระราม 9', risk: 'high', clusterId: 1, metadata: { floor: 32, unit: 'Penthouse' } },
  { id: 'CRYPTO001', type: 'crypto', label: '0x7a2B...9c3D', subLabel: 'ETH Wallet', risk: 'critical', clusterId: 1, metadata: { chain: 'Ethereum', balance: '45.2 ETH' } },
  
  // === CLUSTER 2: ผู้ประสานงาน (Coordinators) ===
  { id: 'P002', type: 'person', label: 'นาย ข. (Coordinator)', subLabel: 'ผู้ประสานงาน', risk: 'high', clusterId: 2, metadata: { age: 38, nationality: 'Thai', priors: 1 } },
  { id: 'P003', type: 'person', label: 'น.ส. ค. (Money)', subLabel: 'ดูแลการเงิน', risk: 'high', clusterId: 2, metadata: { age: 35, nationality: 'Thai', priors: 0 } },
  { id: 'PH003', type: 'phone', label: '083-XXX-3333', subLabel: 'เบอร์ ข.', risk: 'high', clusterId: 2, metadata: { carrier: 'DTAC' } },
  { id: 'PH004', type: 'phone', label: '084-XXX-4444', subLabel: 'เบอร์ ค.', risk: 'high', clusterId: 2, metadata: { carrier: 'AIS' } },
  { id: 'ACC002', type: 'account', label: 'xxx-x-x5678-x', subLabel: 'บัญชี SCB', risk: 'high', clusterId: 2, metadata: { bank: 'SCB', balance: 8500000 } },
  { id: 'ORG001', type: 'organization', label: 'บ.นำเข้าส่งออก XYZ', subLabel: 'บังหน้า', risk: 'high', clusterId: 2, metadata: { registered: '2020', employees: 5 } },
  
  // === CLUSTER 3: ผู้ค้ารายย่อย (Street Dealers) ===
  { id: 'P004', type: 'person', label: 'นาย ง. (Dealer 1)', subLabel: 'พ่อค้ารายย่อย', risk: 'medium', clusterId: 3, metadata: { age: 28, area: 'คลองเตย' } },
  { id: 'P005', type: 'person', label: 'นาย จ. (Dealer 2)', subLabel: 'พ่อค้ารายย่อย', risk: 'medium', clusterId: 3, metadata: { age: 25, area: 'หนองจอก' } },
  { id: 'P006', type: 'person', label: 'น.ส. ฉ. (Dealer 3)', subLabel: 'พ่อค้ารายย่อย', risk: 'medium', clusterId: 3, metadata: { age: 22, area: 'บางกะปิ' } },
  { id: 'PH005', type: 'phone', label: '085-XXX-5555', risk: 'medium', clusterId: 3, metadata: {} },
  { id: 'PH006', type: 'phone', label: '086-XXX-6666', risk: 'medium', clusterId: 3, metadata: {} },
  { id: 'PH007', type: 'phone', label: '087-XXX-7777', risk: 'medium', clusterId: 3, metadata: {} },
  
  // === CLUSTER 4: ผู้ผลิต/Supplier (Myanmar Connection) ===
  { id: 'P007', type: 'person', label: 'Mr. Z (Supplier)', subLabel: 'แหล่งผลิต Myanmar', risk: 'critical', clusterId: 4, metadata: { nationality: 'Myanmar', alias: 'The Snake' } },
  { id: 'PH008', type: 'phone', label: '+95-XXX-8888', subLabel: 'เบอร์ Myanmar', risk: 'critical', clusterId: 4, metadata: { country: 'Myanmar' } },
  { id: 'CRYPTO002', type: 'crypto', label: 'TRX...abc123', subLabel: 'USDT TRC20', risk: 'critical', clusterId: 4, metadata: { chain: 'Tron', balance: '250,000 USDT' } },
  { id: 'ADDR002', type: 'address', label: 'Warehouse Tachileik', subLabel: 'ชายแดน Myanmar', risk: 'critical', clusterId: 4, metadata: { type: 'warehouse' } },
  
  // === CLUSTER 5: ขนส่ง/Logistics ===
  { id: 'P008', type: 'person', label: 'นาย ช. (Driver)', subLabel: 'คนขนส่ง', risk: 'medium', clusterId: 5, metadata: { age: 40, license: 'truck' } },
  { id: 'VEH001', type: 'vehicle', label: 'กข 1234', subLabel: 'รถบรรทุก 6 ล้อ', risk: 'high', clusterId: 5, metadata: { brand: 'HINO', color: 'white' } },
  { id: 'PH009', type: 'phone', label: '089-XXX-9999', risk: 'medium', clusterId: 5, metadata: {} },
  { id: 'ADDR003', type: 'address', label: 'โกดังเชียงราย', subLabel: 'จุดพักสินค้า', risk: 'high', clusterId: 5, metadata: { size: '500 sqm' } },
  
  // === Outside Entities ===
  { id: 'P009', type: 'person', label: 'Unknown Male', subLabel: 'ยังไม่ระบุตัวตน', risk: 'unknown', metadata: {} },
  { id: 'PH010', type: 'phone', label: '090-XXX-0000', subLabel: 'Burner phone', risk: 'high', metadata: { note: 'ใช้ 3 วันแล้วทิ้ง' } },
];

const SAMPLE_LINKS: Link[] = [
  // Boss Network internal
  { id: 'L001', source: 'P001', target: 'PH001', type: 'call', weight: 150, firstSeen: '2025-06-01', lastSeen: '2026-01-14', metadata: { primary: true } },
  { id: 'L002', source: 'P001', target: 'PH002', type: 'call', weight: 45, firstSeen: '2025-08-01', lastSeen: '2026-01-14', metadata: {} },
  { id: 'L003', source: 'P001', target: 'ACC001', type: 'transfer', weight: 89, firstSeen: '2025-06-01', lastSeen: '2026-01-10', metadata: { totalAmount: 45000000 } },
  { id: 'L004', source: 'P001', target: 'ADDR001', type: 'meeting', weight: 30, firstSeen: '2025-06-01', lastSeen: '2026-01-14', metadata: {} },
  { id: 'L005', source: 'P001', target: 'CRYPTO001', type: 'transfer', weight: 35, firstSeen: '2025-09-01', lastSeen: '2026-01-12', metadata: { totalAmount: '120 ETH' } },
  
  // Boss to Coordinators
  { id: 'L006', source: 'PH001', target: 'PH003', type: 'call', weight: 85, firstSeen: '2025-06-01', lastSeen: '2026-01-14', metadata: { avgDuration: 180 } },
  { id: 'L007', source: 'PH001', target: 'PH004', type: 'call', weight: 42, firstSeen: '2025-07-01', lastSeen: '2026-01-14', metadata: {} },
  { id: 'L008', source: 'PH002', target: 'PH003', type: 'sms', weight: 120, firstSeen: '2025-08-01', lastSeen: '2026-01-14', metadata: { encrypted: true } },
  { id: 'L009', source: 'ACC001', target: 'ACC002', type: 'transfer', weight: 56, firstSeen: '2025-06-15', lastSeen: '2026-01-08', metadata: { totalAmount: 28000000 } },
  
  // Coordinators internal
  { id: 'L010', source: 'P002', target: 'PH003', type: 'call', weight: 200, firstSeen: '2025-06-01', lastSeen: '2026-01-14', metadata: {} },
  { id: 'L011', source: 'P003', target: 'PH004', type: 'call', weight: 180, firstSeen: '2025-06-01', lastSeen: '2026-01-14', metadata: {} },
  { id: 'L012', source: 'P002', target: 'P003', type: 'meeting', weight: 45, firstSeen: '2025-06-01', lastSeen: '2026-01-14', metadata: { location: 'office' } },
  { id: 'L013', source: 'P003', target: 'ACC002', type: 'transfer', weight: 150, firstSeen: '2025-06-01', lastSeen: '2026-01-14', metadata: {} },
  { id: 'L014', source: 'P002', target: 'ORG001', type: 'business', weight: 1, firstSeen: '2020-01-01', lastSeen: '2026-01-14', metadata: { role: 'Director' } },
  { id: 'L015', source: 'P003', target: 'ORG001', type: 'business', weight: 1, firstSeen: '2020-01-01', lastSeen: '2026-01-14', metadata: { role: 'Accountant' } },
  
  // Coordinators to Dealers
  { id: 'L016', source: 'PH003', target: 'PH005', type: 'call', weight: 65, firstSeen: '2025-08-01', lastSeen: '2026-01-14', metadata: {} },
  { id: 'L017', source: 'PH003', target: 'PH006', type: 'call', weight: 58, firstSeen: '2025-08-01', lastSeen: '2026-01-14', metadata: {} },
  { id: 'L018', source: 'PH004', target: 'PH007', type: 'call', weight: 72, firstSeen: '2025-09-01', lastSeen: '2026-01-14', metadata: {} },
  { id: 'L019', source: 'PH003', target: 'PH007', type: 'sms', weight: 45, firstSeen: '2025-10-01', lastSeen: '2026-01-14', metadata: {} },
  
  // Dealers internal
  { id: 'L020', source: 'P004', target: 'PH005', type: 'call', weight: 300, firstSeen: '2025-08-01', lastSeen: '2026-01-14', metadata: {} },
  { id: 'L021', source: 'P005', target: 'PH006', type: 'call', weight: 280, firstSeen: '2025-08-01', lastSeen: '2026-01-14', metadata: {} },
  { id: 'L022', source: 'P006', target: 'PH007', type: 'call', weight: 250, firstSeen: '2025-09-01', lastSeen: '2026-01-14', metadata: {} },
  { id: 'L023', source: 'PH005', target: 'PH006', type: 'call', weight: 35, firstSeen: '2025-10-01', lastSeen: '2026-01-14', metadata: { note: 'emergency contact' } },
  
  // Myanmar Connection
  { id: 'L024', source: 'PH001', target: 'PH008', type: 'call', weight: 25, firstSeen: '2025-06-01', lastSeen: '2026-01-10', metadata: { international: true, avgDuration: 300 } },
  { id: 'L025', source: 'CRYPTO001', target: 'CRYPTO002', type: 'transfer', weight: 18, firstSeen: '2025-09-01', lastSeen: '2026-01-05', metadata: { totalAmount: '180 ETH → USDT' } },
  { id: 'L026', source: 'P007', target: 'PH008', type: 'call', weight: 100, firstSeen: '2025-01-01', lastSeen: '2026-01-14', metadata: {} },
  { id: 'L027', source: 'P007', target: 'CRYPTO002', type: 'transfer', weight: 50, firstSeen: '2025-06-01', lastSeen: '2026-01-14', metadata: {} },
  { id: 'L028', source: 'P007', target: 'ADDR002', type: 'meeting', weight: 100, firstSeen: '2025-01-01', lastSeen: '2026-01-14', metadata: {} },
  
  // Logistics
  { id: 'L029', source: 'PH003', target: 'PH009', type: 'call', weight: 40, firstSeen: '2025-10-01', lastSeen: '2026-01-14', metadata: { timing: 'night only' } },
  { id: 'L030', source: 'P008', target: 'PH009', type: 'call', weight: 150, firstSeen: '2025-10-01', lastSeen: '2026-01-14', metadata: {} },
  { id: 'L031', source: 'P008', target: 'VEH001', type: 'meeting', weight: 80, firstSeen: '2025-10-01', lastSeen: '2026-01-14', metadata: { role: 'driver' } },
  { id: 'L032', source: 'VEH001', target: 'ADDR003', type: 'meeting', weight: 25, firstSeen: '2025-11-01', lastSeen: '2026-01-14', metadata: {} },
  { id: 'L033', source: 'ADDR003', target: 'ADDR002', type: 'transfer', weight: 12, firstSeen: '2025-11-01', lastSeen: '2026-01-08', metadata: { note: 'shipment route' } },
  
  // Unknown connections
  { id: 'L034', source: 'PH002', target: 'PH010', type: 'call', weight: 8, firstSeen: '2026-01-10', lastSeen: '2026-01-12', metadata: { suspicious: true } },
  { id: 'L035', source: 'PH010', target: 'P009', type: 'call', weight: 15, firstSeen: '2026-01-10', lastSeen: '2026-01-14', metadata: {} },
];

const SAMPLE_CLUSTERS: Cluster[] = [
  { id: 1, name: 'หัวหน้าเครือข่าย', color: '#ef4444', entities: ['P001', 'PH001', 'PH002', 'ACC001', 'ADDR001', 'CRYPTO001'], risk: 'critical', description: 'กลุ่มบัญชาการหลัก - ควบคุมการเงินและการสื่อสารระดับสูง' },
  { id: 2, name: 'ผู้ประสานงาน', color: '#f97316', entities: ['P002', 'P003', 'PH003', 'PH004', 'ACC002', 'ORG001'], risk: 'high', description: 'กลุ่มประสานงาน - เชื่อมต่อระหว่างหัวหน้าและผู้ค้ารายย่อย' },
  { id: 3, name: 'ผู้ค้ารายย่อย', color: '#22c55e', entities: ['P004', 'P005', 'P006', 'PH005', 'PH006', 'PH007'], risk: 'medium', description: 'กลุ่มค้าปลีก - จำหน่ายสินค้าในพื้นที่ต่างๆ' },
  { id: 4, name: 'แหล่งผลิต Myanmar', color: '#8b5cf6', entities: ['P007', 'PH008', 'CRYPTO002', 'ADDR002'], risk: 'critical', description: 'กลุ่มผู้ผลิต/Supplier - ฐานปฏิบัติการในเมียนมา' },
  { id: 5, name: 'ขนส่ง/Logistics', color: '#3b82f6', entities: ['P008', 'VEH001', 'PH009', 'ADDR003'], risk: 'high', description: 'กลุ่มขนส่ง - รับผิดชอบการเคลื่อนย้ายสินค้า' },
];

const SAMPLE_PATTERNS: SuspiciousPattern[] = [
  {
    id: 'SP001',
    type: 'Burner Phone Pattern',
    severity: 'critical',
    description: 'พบการใช้เบอร์โทรศัพท์แบบใช้แล้วทิ้ง (Burner) ติดต่อกับหัวหน้าเครือข่าย',
    entities: ['PH002', 'PH010', 'P009'],
    evidence: ['ใช้งานเพียง 3 วัน', 'โทรเฉพาะช่วงกลางคืน', 'ลงทะเบียนด้วยข้อมูลปลอม']
  },
  {
    id: 'SP002',
    type: 'Layered Communication',
    severity: 'high',
    description: 'การสื่อสารแบบหลายชั้น - หัวหน้าไม่ติดต่อผู้ค้าโดยตรง ผ่านผู้ประสานงานเท่านั้น',
    entities: ['P001', 'P002', 'P003', 'P004', 'P005', 'P006'],
    evidence: ['ไม่มีการโทรตรงระหว่าง Boss กับ Dealers', 'ทุกการสื่อสารผ่าน Coordinator']
  },
  {
    id: 'SP003',
    type: 'Crypto Money Flow',
    severity: 'critical',
    description: 'การโอนเงินผ่าน Cryptocurrency ระหว่างประเทศ - หลบเลี่ยงระบบธนาคาร',
    entities: ['CRYPTO001', 'CRYPTO002', 'P001', 'P007'],
    evidence: ['ETH → USDT conversion', 'โอนข้ามประเทศไม่ผ่านธนาคาร', 'ใช้ Mixer/Tumbler']
  },
  {
    id: 'SP004',
    type: 'Timing Pattern',
    severity: 'medium',
    description: 'รูปแบบเวลาการติดต่อผิดปกติ - โทรเฉพาะช่วง 22:00-04:00',
    entities: ['PH003', 'PH009', 'P008'],
    evidence: ['95% ของการโทรเกิดขึ้นหลังเที่ยงคืน', 'สอดคล้องกับเวลาขนส่งสินค้า']
  },
  {
    id: 'SP005',
    type: 'Shell Company',
    severity: 'high',
    description: 'บริษัทบังหน้า - ใช้สำหรับฟอกเงินและปกปิดกิจกรรมผิดกฎหมาย',
    entities: ['ORG001', 'P002', 'P003', 'ACC002'],
    evidence: ['พนักงานจริงเพียง 2 คน', 'รายได้ไม่สอดคล้องกับธุรกิจ', 'การโอนเงินผิดปกติ']
  },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

const getEntityIcon = (type: EntityType) => {
  const icons: Record<EntityType, typeof User> = {
    person: User,
    phone: Smartphone,
    account: CreditCard,
    address: MapPin,
    organization: Building2,
    crypto: Globe,
    vehicle: Target
  };
  return icons[type] || User;
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

const getEntityShape = (type: EntityType): 'circle' | 'diamond' | 'square' | 'triangle' => {
  const shapes: Record<EntityType, 'circle' | 'diamond' | 'square' | 'triangle'> = {
    person: 'circle',
    phone: 'diamond',
    account: 'square',
    address: 'triangle',
    organization: 'square',
    crypto: 'diamond',
    vehicle: 'triangle'
  };
  return shapes[type] || 'circle';
};

// ============================================
// COMPONENTS
// ============================================

const ClusterLegend = ({ clusters, selectedCluster, onSelectCluster }: {
  clusters: Cluster[];
  selectedCluster: number | null;
  onSelectCluster: (id: number | null) => void;
}) => (
  <div className="bg-dark-800 rounded-xl border border-dark-700 p-4">
    <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
      <Users size={16} className="text-primary-400" />
      กลุ่ม/เก๊ง (Clusters)
    </h3>
    <div className="space-y-2">
      <button
        onClick={() => onSelectCluster(null)}
        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
          selectedCluster === null ? 'bg-dark-600' : 'hover:bg-dark-700'
        }`}
      >
        <span className="text-dark-300">ทั้งหมด</span>
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
            <span className="text-white">{cluster.name}</span>
            <span className="text-dark-500 text-xs ml-auto">{cluster.entities.length}</span>
          </div>
        </button>
      ))}
    </div>
  </div>
);

const EntityTypeLegend = () => (
  <div className="bg-dark-800 rounded-xl border border-dark-700 p-4">
    <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
      <Target size={16} className="text-primary-400" />
      ประเภท Entity
    </h3>
    <div className="grid grid-cols-2 gap-2 text-xs">
      {[
        { type: 'person', label: 'บุคคล', icon: User },
        { type: 'phone', label: 'เบอร์โทร', icon: Smartphone },
        { type: 'account', label: 'บัญชี', icon: CreditCard },
        { type: 'address', label: 'ที่อยู่', icon: MapPin },
        { type: 'organization', label: 'องค์กร', icon: Building2 },
        { type: 'crypto', label: 'Crypto', icon: Globe },
        { type: 'vehicle', label: 'ยานพาหนะ', icon: Target },
      ].map(item => {
        const Icon = item.icon;
        return (
          <div key={item.type} className="flex items-center gap-2 text-dark-400">
            <Icon size={14} />
            <span>{item.label}</span>
          </div>
        );
      })}
    </div>
  </div>
);

const SuspiciousPatternCard = ({ pattern }: { pattern: SuspiciousPattern }) => {
  const severityColors: Record<RiskLevel, { bg: string; text: string; border: string }> = {
    critical: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30' },
    high: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30' },
    medium: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/30' },
    low: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/30' },
    unknown: { bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/30' }
  };
  const colors = severityColors[pattern.severity];
  
  return (
    <div className={`${colors.bg} ${colors.border} border rounded-xl p-4`}>
      <div className="flex items-start gap-3">
        <AlertTriangle size={20} className={colors.text} />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-white font-medium">{pattern.type}</h4>
            <span className={`px-2 py-0.5 rounded text-xs uppercase ${colors.bg} ${colors.text}`}>
              {pattern.severity}
            </span>
          </div>
          <p className="text-sm text-dark-400 mb-2">{pattern.description}</p>
          <div className="space-y-1">
            {pattern.evidence.map((ev, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-dark-500">
                <ChevronRight size={12} />
                <span>{ev}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const NetworkCanvas = ({ 
  entities, 
  links, 
  clusters,
  selectedCluster,
  selectedEntity,
  onSelectEntity 
}: {
  entities: Entity[];
  links: Link[];
  clusters: Cluster[];
  selectedCluster: number | null;
  selectedEntity: string | null;
  onSelectEntity: (id: string | null) => void;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [nodes, setNodes] = useState<Entity[]>([]);
  const [isSimulating, setIsSimulating] = useState(true);
  const animationRef = useRef<number | null>(null);
  const frameCountRef = useRef(0);
  
  // Filter entities based on selected cluster
  const filteredEntities = selectedCluster 
    ? entities.filter(e => e.clusterId === selectedCluster || 
        links.some(l => 
          (l.source === e.id || l.target === e.id) && 
          entities.some(e2 => e2.id === (l.source === e.id ? l.target : l.source) && e2.clusterId === selectedCluster)
        ))
    : entities;
    
  const filteredLinks = links.filter(l => 
    filteredEntities.some(e => e.id === l.source) && 
    filteredEntities.some(e => e.id === l.target)
  );

  useEffect(() => {
    // Initialize node positions
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const width = canvas.width;
    const height = canvas.height;
    
    // Position nodes in cluster groups
    const clusterCenters: Record<number, { x: number; y: number }> = {
      1: { x: width * 0.5, y: height * 0.3 },  // Boss - top center
      2: { x: width * 0.35, y: height * 0.5 }, // Coordinators - middle left
      3: { x: width * 0.2, y: height * 0.75 }, // Dealers - bottom left
      4: { x: width * 0.75, y: height * 0.3 }, // Myanmar - top right
      5: { x: width * 0.7, y: height * 0.7 },  // Logistics - bottom right
    };
    
    const newNodes = filteredEntities.map(entity => ({
      ...entity,
      x: entity.clusterId 
        ? clusterCenters[entity.clusterId]?.x + (Math.random() - 0.5) * 100 || Math.random() * width
        : Math.random() * width,
      y: entity.clusterId 
        ? clusterCenters[entity.clusterId]?.y + (Math.random() - 0.5) * 80 || Math.random() * height
        : Math.random() * height,
      vx: 0,
      vy: 0
    }));
    
    setNodes(newNodes);
    frameCountRef.current = 0;
    setIsSimulating(true);
  }, [filteredEntities.length, selectedCluster]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || nodes.length === 0) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const width = canvas.width;
    const height = canvas.height;
    
    const drawShape = (x: number, y: number, size: number, shape: string, color: string, isSelected: boolean) => {
      ctx.fillStyle = color;
      ctx.strokeStyle = isSelected ? '#fff' : color;
      ctx.lineWidth = isSelected ? 3 : 1;
      
      ctx.beginPath();
      switch (shape) {
        case 'diamond':
          ctx.moveTo(x, y - size);
          ctx.lineTo(x + size, y);
          ctx.lineTo(x, y + size);
          ctx.lineTo(x - size, y);
          ctx.closePath();
          break;
        case 'square':
          ctx.rect(x - size * 0.8, y - size * 0.8, size * 1.6, size * 1.6);
          break;
        case 'triangle':
          ctx.moveTo(x, y - size);
          ctx.lineTo(x + size, y + size * 0.7);
          ctx.lineTo(x - size, y + size * 0.7);
          ctx.closePath();
          break;
        default: // circle
          ctx.arc(x, y, size, 0, Math.PI * 2);
      }
      ctx.fill();
      if (isSelected) ctx.stroke();
    };
    
    const simulate = () => {
      if (!isSimulating || frameCountRef.current > 150) {
        // Just render without simulation
        render();
        return;
      }
      
      const nodesCopy = [...nodes];
      
      // Repulsion between nodes
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
      
      // Attraction along links
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
      
      // Cluster cohesion
      const clusterCenters: Record<number, { x: number; y: number; count: number }> = {};
      nodesCopy.forEach(node => {
        if (node.clusterId) {
          if (!clusterCenters[node.clusterId]) {
            clusterCenters[node.clusterId] = { x: 0, y: 0, count: 0 };
          }
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
        if (node.clusterId && clusterCenters[node.clusterId]) {
          const center = clusterCenters[node.clusterId];
          node.vx! += (center.x - node.x!) * 0.01;
          node.vy! += (center.y - node.y!) * 0.01;
        }
        
        // Center gravity
        node.vx! += (width / 2 - node.x!) * 0.0005;
        node.vy! += (height / 2 - node.y!) * 0.0005;
        
        // Damping
        node.vx! *= 0.85;
        node.vy! *= 0.85;
        
        // Update position
        node.x! += node.vx!;
        node.y! += node.vy!;
        
        // Bounds
        const margin = 50;
        node.x = Math.max(margin, Math.min(width - margin, node.x!));
        node.y = Math.max(margin, Math.min(height - margin, node.y!));
      });
      
      setNodes(nodesCopy);
      frameCountRef.current++;
      
      render();
      animationRef.current = requestAnimationFrame(simulate);
    };
    
    const render = () => {
      ctx.clearRect(0, 0, width, height);
      
      // Draw cluster backgrounds
      if (!selectedCluster) {
        clusters.forEach(cluster => {
          const clusterNodes = nodes.filter(n => n.clusterId === cluster.id);
          if (clusterNodes.length < 2) return;
          
          // Calculate convex hull / bounding area
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
          
          // Cluster label
          ctx.fillStyle = cluster.color;
          ctx.font = 'bold 11px sans-serif';
          ctx.fillText(cluster.name, minX - padding + 10, minY - padding + 18);
        });
      }
      
      // Draw links
      filteredLinks.forEach(link => {
        const source = nodes.find(n => n.id === link.source);
        const target = nodes.find(n => n.id === link.target);
        if (!source || !target) return;
        
        const isHighlighted = selectedEntity && (link.source === selectedEntity || link.target === selectedEntity);
        
        ctx.beginPath();
        ctx.moveTo(source.x!, source.y!);
        ctx.lineTo(target.x!, target.y!);
        ctx.strokeStyle = isHighlighted 
          ? getLinkColor(link.type) 
          : getLinkColor(link.type) + (selectedEntity ? '30' : '60');
        ctx.lineWidth = Math.min(Math.max(link.weight / 30, 1), 5) * (isHighlighted ? 2 : 1);
        ctx.stroke();
        
        // Arrow for direction
        if (link.type === 'transfer' || link.type === 'call') {
          const angle = Math.atan2(target.y! - source.y!, target.x! - source.x!);
          const midX = (source.x! + target.x!) / 2;
          const midY = (source.y! + target.y!) / 2;
          
          ctx.beginPath();
          ctx.moveTo(midX, midY);
          ctx.lineTo(midX - 8 * Math.cos(angle - Math.PI / 6), midY - 8 * Math.sin(angle - Math.PI / 6));
          ctx.lineTo(midX - 8 * Math.cos(angle + Math.PI / 6), midY - 8 * Math.sin(angle + Math.PI / 6));
          ctx.closePath();
          ctx.fillStyle = isHighlighted ? getLinkColor(link.type) : getLinkColor(link.type) + '60';
          ctx.fill();
        }
      });
      
      // Draw nodes
      nodes.forEach(node => {
        const isSelected = node.id === selectedEntity;
        const isConnected = selectedEntity && filteredLinks.some(l => 
          (l.source === selectedEntity && l.target === node.id) ||
          (l.target === selectedEntity && l.source === node.id)
        );
        const opacity = selectedEntity && !isSelected && !isConnected ? 0.3 : 1;
        
        const baseSize = node.type === 'person' ? 18 : 14;
        const size = baseSize * (isSelected ? 1.3 : 1);
        const color = getEntityColor(node, clusters);
        
        // Glow effect for selected
        if (isSelected) {
          ctx.shadowColor = color;
          ctx.shadowBlur = 20;
        }
        
        ctx.globalAlpha = opacity;
        drawShape(node.x!, node.y!, size, getEntityShape(node.type), color, isSelected);
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
        
        // Label
        ctx.fillStyle = selectedEntity && !isSelected && !isConnected ? '#6b728080' : '#e5e7eb';
        ctx.font = `${isSelected ? 'bold ' : ''}10px sans-serif`;
        ctx.textAlign = 'center';
        
        const label = node.label.length > 15 ? node.label.slice(0, 15) + '...' : node.label;
        ctx.fillText(label, node.x!, node.y! + size + 14);
      });
    };
    
    simulate();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [nodes.length, isSimulating, selectedEntity]);
  
  // Handle click
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    
    // Find clicked node
    const clickedNode = nodes.find(node => {
      const dx = node.x! - x;
      const dy = node.y! - y;
      return Math.sqrt(dx * dx + dy * dy) < 25;
    });
    
    onSelectEntity(clickedNode?.id || null);
  };

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={900}
        height={600}
        className="w-full bg-dark-950 rounded-xl border border-dark-700 cursor-pointer"
        onClick={handleCanvasClick}
      />
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            frameCountRef.current = 0;
            setIsSimulating(true);
          }}
        >
          <Play size={16} className="mr-1" /> Simulate
        </Button>
      </div>
    </div>
  );
};

const EntityDetailPanel = ({ entity, links, entities, onClose }: {
  entity: Entity;
  links: Link[];
  entities: Entity[];
  onClose: () => void;
}) => {
  const Icon = getEntityIcon(entity.type);
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
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${riskColors[entity.risk]}`}>
            <Icon size={24} />
          </div>
          <div>
            <h3 className="text-white font-semibold">{entity.label}</h3>
            {entity.subLabel && <p className="text-sm text-dark-400">{entity.subLabel}</p>}
          </div>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-dark-700 rounded">
          <X size={16} className="text-dark-400" />
        </button>
      </div>
      
      <div className="space-y-4">
        <div>
          <span className={`px-2 py-1 rounded text-xs uppercase ${riskColors[entity.risk]}`}>
            Risk: {entity.risk}
          </span>
        </div>
        
        {Object.keys(entity.metadata).length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-dark-400 mb-2">Metadata</h4>
            <div className="space-y-1">
              {Object.entries(entity.metadata).map(([key, value]) => (
                <div key={key} className="flex justify-between text-sm">
                  <span className="text-dark-400">{key}:</span>
                  <span className="text-white">{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div>
          <h4 className="text-xs font-semibold text-dark-400 mb-2">Connections ({connectedLinks.length})</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {connectedLinks.map(link => {
              const otherId = link.source === entity.id ? link.target : link.source;
              const other = entities.find(e => e.id === otherId);
              if (!other) return null;
              
              return (
                <div key={link.id} className="flex items-center gap-2 text-sm bg-dark-900 rounded-lg p-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getLinkColor(link.type) }} />
                  <span className="text-dark-300 flex-1">{other.label}</span>
                  <span className="text-dark-500 text-xs">{link.type}</span>
                  <span className="text-dark-400 text-xs">×{link.weight}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatsOverview = ({ entities, links, clusters }: {
  entities: Entity[];
  links: Link[];
  clusters: Cluster[];
}) => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
    <div className="bg-dark-800 rounded-xl border border-dark-700 p-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary-500/20 rounded-lg flex items-center justify-center">
          <Users size={20} className="text-primary-400" />
        </div>
        <div>
          <p className="text-2xl font-bold text-white">{entities.length}</p>
          <p className="text-xs text-dark-400">Entities</p>
        </div>
      </div>
    </div>
    <div className="bg-dark-800 rounded-xl border border-dark-700 p-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
          <Share2 size={20} className="text-blue-400" />
        </div>
        <div>
          <p className="text-2xl font-bold text-white">{links.length}</p>
          <p className="text-xs text-dark-400">Connections</p>
        </div>
      </div>
    </div>
    <div className="bg-dark-800 rounded-xl border border-dark-700 p-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
          <Target size={20} className="text-amber-400" />
        </div>
        <div>
          <p className="text-2xl font-bold text-white">{clusters.length}</p>
          <p className="text-xs text-dark-400">Clusters</p>
        </div>
      </div>
    </div>
    <div className="bg-dark-800 rounded-xl border border-dark-700 p-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
          <AlertTriangle size={20} className="text-red-400" />
        </div>
        <div>
          <p className="text-2xl font-bold text-white">
            {entities.filter(e => e.risk === 'critical' || e.risk === 'high').length}
          </p>
          <p className="text-xs text-dark-400">High Risk</p>
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
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'network' | 'patterns' | 'timeline'>('network');
  
  const selectedEntityData = selectedEntity ? entities.find(e => e.id === selectedEntity) : null;

  return (
    <div className="flex-1 p-6 space-y-6 bg-dark-900 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Shield className="text-primary-400" />
            Intelligence Network Analysis
          </h1>
          <p className="text-dark-400 mt-1">
            Link Analysis แบบ FBI/CIA - คดีเครือข่ายค้ายาเสพติดข้ามชาติ
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost">
            <Upload size={18} className="mr-2" />
            Import Data
          </Button>
          <Button variant="primary">
            <Download size={18} className="mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Stats */}
      <StatsOverview entities={entities} links={links} clusters={clusters} />

      {/* Tabs */}
      <div className="border-b border-dark-700">
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
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
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
      {activeTab === 'network' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <NetworkCanvas
              entities={entities}
              links={links}
              clusters={clusters}
              selectedCluster={selectedCluster}
              selectedEntity={selectedEntity}
              onSelectEntity={setSelectedEntity}
            />
            
            {/* Link Type Legend */}
            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs">
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
          
          <div className="space-y-4">
            <ClusterLegend
              clusters={clusters}
              selectedCluster={selectedCluster}
              onSelectCluster={setSelectedCluster}
            />
            <EntityTypeLegend />
            
            {selectedEntityData && (
              <EntityDetailPanel
                entity={selectedEntityData}
                links={links}
                entities={entities}
                onClose={() => setSelectedEntity(null)}
              />
            )}
          </div>
        </div>
      )}

      {activeTab === 'patterns' && (
        <div className="space-y-4">
          <div className="bg-dark-800 rounded-xl border border-dark-700 p-4">
            <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
              <Zap className="text-amber-400" />
              AI Pattern Detection
            </h3>
            <p className="text-sm text-dark-400">
              ระบบตรวจจับรูปแบบพฤติกรรมผิดปกติอัตโนมัติ พบ {patterns.length} รูปแบบที่น่าสงสัย
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {patterns.map(pattern => (
              <SuspiciousPatternCard key={pattern.id} pattern={pattern} />
            ))}
          </div>
        </div>
      )}

      {activeTab === 'timeline' && (
        <div className="bg-dark-800 rounded-xl border border-dark-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Timeline Analysis</h3>
          <p className="text-dark-400">Coming soon - แสดงลำดับเหตุการณ์ตามเวลา</p>
        </div>
      )}
    </div>
  );
};

export { CallAnalysis as CallAnalysisPage };
export default CallAnalysis;
