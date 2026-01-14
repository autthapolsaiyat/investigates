/**
 * Cases V2 - Complete Case Management
 * Features:
 * 1. Case List with filters
 * 2. Case Detail Modal
 * 3. Timeline view
 * 4. Evidence linking
 * 5. Team assignment
 * 6. Status workflow
 * 7. Create/Edit case
 */
import { useState } from 'react';
import {
  Plus,
  Search,

  Briefcase,
  Calendar,
  Users,
  DollarSign,
  Clock,


  Edit,

  Eye,
  X,
  CheckCircle,
  AlertTriangle,
  FileText,
  Shield,


  Globe,

  User,






  Flag,
  Target,
  Activity
} from 'lucide-react';
import { Button, Input } from '../../components/ui';

// ============================================
// TYPES
// ============================================

interface CaseItem {
  id: string;
  caseNumber: string;
  name: string;
  description: string;
  type: string;
  status: 'draft' | 'investigating' | 'prosecutor' | 'court' | 'closed';
  priority: 'critical' | 'high' | 'medium' | 'low';
  amount: number;
  currency: string;
  suspects: Suspect[];
  team: TeamMember[];
  evidence: Evidence[];
  timeline: TimelineItem[];
  createdAt: string;
  updatedAt: string;
  dueDate: string;
  progress: number;
  tags: string[];
}

interface Suspect {
  id: string;
  name: string;
  idNumber?: string;
  nationality?: string;
  role: string;
  status: 'identified' | 'wanted' | 'arrested' | 'charged';
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar?: string;
}

interface Evidence {
  id: string;
  name: string;
  type: string;
  hash?: string;
  addedAt: string;
}

interface TimelineItem {
  id: string;
  date: string;
  title: string;
  description: string;
  type: 'created' | 'updated' | 'evidence' | 'suspect' | 'milestone' | 'status';
  user: string;
}

// ============================================
// MOCK DATA
// ============================================

const MOCK_CASES: CaseItem[] = [
  {
    id: '1',
    caseNumber: 'CASE-20260111-001',
    name: 'คดี Silk Road Thailand',
    description: 'การสืบสวนเครือข่ายค้ายาเสพติดผ่าน Cryptocurrency บน Dark Web',
    type: 'Cryptocurrency Fraud',
    status: 'investigating',
    priority: 'critical',
    amount: 156000000,
    currency: 'THB',
    suspects: [
      { id: '1', name: 'นาย ก.', idNumber: '1-XXXX-XXXXX-XX-X', nationality: 'Thai', role: 'หัวหน้าเครือข่าย', status: 'wanted' },
      { id: '2', name: 'นาย ข.', nationality: 'Thai', role: 'ผู้ดูแลกระเป๋า', status: 'identified' },
      { id: '3', name: 'James Z.', nationality: 'American', role: 'Hacker', status: 'arrested' }
    ],
    team: [
      { id: '1', name: 'พ.ต.ท. สมชาย', role: 'หัวหน้าคดี' },
      { id: '2', name: 'ร.ต.อ. สมหญิง', role: 'นักวิเคราะห์' },
      { id: '3', name: 'พ.ต.ต. วิชัย', role: 'ผู้ช่วย' }
    ],
    evidence: [
      { id: '1', name: 'Screenshot_wallet.png', type: 'image', hash: 'd2eaa769...', addedAt: '2026-01-11' },
      { id: '2', name: 'Transaction_log.pdf', type: 'document', hash: 'a1b2c3d4...', addedAt: '2026-01-10' },
      { id: '3', name: 'KYC_data.xlsx', type: 'spreadsheet', addedAt: '2026-01-09' }
    ],
    timeline: [
      { id: '1', date: '2026-01-11', title: 'เพิ่มหลักฐาน', description: 'อัพโหลด Screenshot wallet', type: 'evidence', user: 'ร.ต.อ. สมหญิง' },
      { id: '2', date: '2026-01-10', title: 'ระบุผู้ต้องหา', description: 'พบข้อมูล KYC ของ James Z.', type: 'suspect', user: 'พ.ต.ท. สมชาย' },
      { id: '3', date: '2026-01-09', title: 'สร้างคดี', description: 'เริ่มต้นการสืบสวน', type: 'created', user: 'พ.ต.ท. สมชาย' }
    ],
    createdAt: '2026-01-09',
    updatedAt: '2026-01-11',
    dueDate: '2026-02-15',
    progress: 75,
    tags: ['crypto', 'dark-web', 'international']
  },
  {
    id: '2',
    caseNumber: 'CASE-20260110-002',
    name: 'คดีแชร์ลูกโซ่ออนไลน์',
    description: 'การหลอกลวงลงทุนผ่านแอพพลิเคชั่น',
    type: 'Ponzi Scheme',
    status: 'investigating',
    priority: 'high',
    amount: 89000000,
    currency: 'THB',
    suspects: [
      { id: '1', name: 'นาง ค.', role: 'ผู้ก่อตั้ง', status: 'wanted' },
      { id: '2', name: 'นาย ง.', role: 'ผู้ร่วมก่อตั้ง', status: 'arrested' }
    ],
    team: [
      { id: '1', name: 'พ.ต.ท. สมศักดิ์', role: 'หัวหน้าคดี' }
    ],
    evidence: [
      { id: '1', name: 'Bank_statement.pdf', type: 'document', addedAt: '2026-01-10' }
    ],
    timeline: [
      { id: '1', date: '2026-01-10', title: 'สร้างคดี', description: 'รับแจ้งความจากผู้เสียหาย', type: 'created', user: 'พ.ต.ท. สมศักดิ์' }
    ],
    createdAt: '2026-01-10',
    updatedAt: '2026-01-10',
    dueDate: '2026-01-30',
    progress: 45,
    tags: ['ponzi', 'online']
  },
  {
    id: '3',
    caseNumber: 'CASE-20260109-003',
    name: 'คดีฟอกเงินคาสิโน',
    description: 'การฟอกเงินผ่านคาสิโนออนไลน์และ Cryptocurrency',
    type: 'Money Laundering',
    status: 'prosecutor',
    priority: 'high',
    amount: 234000000,
    currency: 'THB',
    suspects: [
      { id: '1', name: 'บริษัท ABC', role: 'นิติบุคคล', status: 'charged' }
    ],
    team: [
      { id: '1', name: 'พ.ต.ท. สุชาติ', role: 'หัวหน้าคดี' },
      { id: '2', name: 'ร.ต.อ. มานี', role: 'นักวิเคราะห์' }
    ],
    evidence: [],
    timeline: [],
    createdAt: '2026-01-09',
    updatedAt: '2026-01-11',
    dueDate: '2026-01-20',
    progress: 90,
    tags: ['casino', 'money-laundering']
  },
  {
    id: '4',
    caseNumber: 'CASE-20260108-004',
    name: 'คดีหลอกลงทุน Forex',
    description: 'แอบอ้างเป็นบริษัทลงทุน Forex ที่ไม่มีใบอนุญาต',
    type: 'Investment Fraud',
    status: 'investigating',
    priority: 'medium',
    amount: 45000000,
    currency: 'THB',
    suspects: [],
    team: [
      { id: '1', name: 'ร.ต.อ. ประยุทธ์', role: 'หัวหน้าคดี' }
    ],
    evidence: [],
    timeline: [],
    createdAt: '2026-01-08',
    updatedAt: '2026-01-08',
    dueDate: '2026-03-01',
    progress: 30,
    tags: ['forex', 'fraud']
  },
  {
    id: '5',
    caseNumber: 'CASE-20260105-005',
    name: 'คดีโจรกรรม NFT',
    description: 'การโจรกรรม NFT มูลค่าสูงจาก Marketplace',
    type: 'NFT Theft',
    status: 'closed',
    priority: 'low',
    amount: 12000000,
    currency: 'THB',
    suspects: [
      { id: '1', name: 'นาย จ.', role: 'แฮกเกอร์', status: 'arrested' }
    ],
    team: [],
    evidence: [],
    timeline: [],
    createdAt: '2026-01-05',
    updatedAt: '2026-01-10',
    dueDate: '2026-01-15',
    progress: 100,
    tags: ['nft', 'theft']
  }
];

const CASE_TYPES = [
  'ทั้งหมด',
  'Cryptocurrency Fraud',
  'Ponzi Scheme',
  'Money Laundering',
  'Investment Fraud',
  'NFT Theft'
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'ทุกสถานะ' },
  { value: 'draft', label: 'ร่าง' },
  { value: 'investigating', label: 'กำลังสืบสวน' },
  { value: 'prosecutor', label: 'รอพนักงานอัยการ' },
  { value: 'court', label: 'อยู่ในชั้นศาล' },
  { value: 'closed', label: 'ปิดคดี' }
];

// ============================================
// HELPER FUNCTIONS
// ============================================

const formatCurrency = (amount: number, currency: string = 'THB') => {
  if (currency === 'THB') {
    if (amount >= 1000000) {
      return `฿${(amount / 1000000).toFixed(1)}M`;
    }
    return `฿${amount.toLocaleString()}`;
  }
  return `${amount.toLocaleString()} ${currency}`;
};

const getStatusStyle = (status: string) => {
  const styles: Record<string, { bg: string; text: string; label: string }> = {
    draft: { bg: 'bg-dark-600', text: 'text-dark-300', label: 'ร่าง' },
    investigating: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'กำลังสืบสวน' },
    prosecutor: { bg: 'bg-amber-500/20', text: 'text-amber-400', label: 'รอพนักงานอัยการ' },
    court: { bg: 'bg-purple-500/20', text: 'text-purple-400', label: 'อยู่ในชั้นศาล' },
    closed: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'ปิดคดี' }
  };
  return styles[status] || styles.draft;
};

const getPriorityStyle = (priority: "critical" | "high" | "medium" | "low") => {
  const styles: Record<string, { bg: string; text: string; icon: typeof AlertTriangle }> = {
    critical: { bg: 'bg-red-500/20', text: 'text-red-400', icon: AlertTriangle },
    high: { bg: 'bg-orange-500/20', text: 'text-orange-400', icon: Flag },
    medium: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', icon: Target },
    low: { bg: 'bg-green-500/20', text: 'text-green-400', icon: CheckCircle }
  };
  return styles[priority] || styles.medium;
};

const getSuspectStatusStyle = (status: string) => {
  const styles: Record<string, { bg: string; text: string; label: string }> = {
    identified: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'ระบุตัวแล้ว' },
    wanted: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'ออกหมายจับ' },
    arrested: { bg: 'bg-amber-500/20', text: 'text-amber-400', label: 'ถูกจับกุม' },
    charged: { bg: 'bg-purple-500/20', text: 'text-purple-400', label: 'ถูกฟ้อง' }
  };
  return styles[status] || styles.identified;
};

// ============================================
// COMPONENTS
// ============================================

const CaseCard = ({ case_, onClick }: { case_: CaseItem; onClick: () => void }) => {
  const statusStyle = getStatusStyle(case_.status);
  const priorityStyle = getPriorityStyle(case_.priority);
  const PriorityIcon = priorityStyle.icon;

  return (
    <div 
      onClick={onClick}
      className="bg-dark-800 rounded-xl border border-dark-700 p-5 hover:border-dark-600 hover:shadow-lg transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 ${priorityStyle.bg} rounded-lg flex items-center justify-center`}>
            <PriorityIcon size={20} className={priorityStyle.text} />
          </div>
          <div>
            <p className="text-xs text-dark-500">{case_.caseNumber}</p>
            <h3 className="text-white font-semibold group-hover:text-primary-400 transition-colors">
              {case_.name}
            </h3>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs ${statusStyle.bg} ${statusStyle.text}`}>
          {statusStyle.label}
        </span>
      </div>

      <p className="text-sm text-dark-400 mb-4 line-clamp-2">{case_.description}</p>

      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-1 text-sm">
          <DollarSign size={14} className="text-amber-400" />
          <span className="text-amber-400 font-semibold">{formatCurrency(case_.amount)}</span>
        </div>
        <div className="flex items-center gap-1 text-sm text-dark-400">
          <Users size={14} />
          <span>{case_.suspects.length} ผู้ต้องหา</span>
        </div>
        <div className="flex items-center gap-1 text-sm text-dark-400">
          <FileText size={14} />
          <span>{case_.evidence.length} หลักฐาน</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 w-24 bg-dark-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary-500 rounded-full"
              style={{ width: `${case_.progress}%` }}
            />
          </div>
          <span className="text-xs text-dark-400">{case_.progress}%</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-dark-500">
          <Calendar size={12} />
          <span>กำหนด: {new Date(case_.dueDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}</span>
        </div>
      </div>

      {case_.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-dark-700">
          {case_.tags.map(tag => (
            <span key={tag} className="px-2 py-0.5 bg-dark-700 rounded text-xs text-dark-400">
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

const CaseDetailModal = ({ case_, onClose }: { case_: CaseItem; onClose: () => void }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'evidence' | 'suspects' | 'team'>('overview');
  const statusStyle = getStatusStyle(case_.status);
  const priorityStyle = getPriorityStyle(case_.priority);

  const tabs = [
    { id: 'overview', label: 'ภาพรวม', icon: Eye },
    { id: 'timeline', label: 'Timeline', icon: Clock },
    { id: 'evidence', label: 'หลักฐาน', icon: Shield },
    { id: 'suspects', label: 'ผู้ต้องหา', icon: Users },
    { id: 'team', label: 'ทีม', icon: User }
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-dark-800 rounded-2xl border border-dark-700 w-full max-w-5xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-dark-700">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 ${priorityStyle.bg} rounded-xl flex items-center justify-center`}>
                <Briefcase size={28} className={priorityStyle.text} />
              </div>
              <div>
                <p className="text-sm text-dark-400">{case_.caseNumber}</p>
                <h2 className="text-xl font-bold text-white">{case_.name}</h2>
                <div className="flex items-center gap-3 mt-2">
                  <span className={`px-3 py-1 rounded-full text-xs ${statusStyle.bg} ${statusStyle.text}`}>
                    {statusStyle.label}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs ${priorityStyle.bg} ${priorityStyle.text} uppercase`}>
                    {case_.priority}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm">
                <Edit size={16} className="mr-1" /> แก้ไข
              </Button>
              <button onClick={onClose} className="p-2 hover:bg-dark-700 rounded-lg">
                <X size={20} className="text-dark-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-dark-700 px-6">
          <div className="flex gap-1">
            {tabs.map(tab => {
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
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 220px)' }}>
          {activeTab === 'overview' && (
            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-2 space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-dark-400 mb-2">รายละเอียด</h3>
                  <p className="text-dark-300">{case_.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-dark-900 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign size={16} className="text-amber-400" />
                      <span className="text-sm text-dark-400">มูลค่าความเสียหาย</span>
                    </div>
                    <p className="text-2xl font-bold text-amber-400">{formatCurrency(case_.amount)}</p>
                  </div>
                  <div className="bg-dark-900 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity size={16} className="text-primary-400" />
                      <span className="text-sm text-dark-400">ความคืบหน้า</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-3 bg-dark-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary-500 rounded-full"
                          style={{ width: `${case_.progress}%` }}
                        />
                      </div>
                      <span className="text-lg font-bold text-white">{case_.progress}%</span>
                    </div>
                  </div>
                </div>

                <div className="bg-dark-900 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-dark-400 mb-3">ข้อมูลคดี</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Globe size={14} className="text-dark-500" />
                      <span className="text-dark-400">ประเภท:</span>
                      <span className="text-white">{case_.type}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-dark-500" />
                      <span className="text-dark-400">สร้างเมื่อ:</span>
                      <span className="text-white">{new Date(case_.createdAt).toLocaleDateString('th-TH')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-dark-500" />
                      <span className="text-dark-400">อัพเดตล่าสุด:</span>
                      <span className="text-white">{new Date(case_.updatedAt).toLocaleDateString('th-TH')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Flag size={14} className="text-dark-500" />
                      <span className="text-dark-400">กำหนดส่ง:</span>
                      <span className="text-white">{new Date(case_.dueDate).toLocaleDateString('th-TH')}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-dark-900 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-dark-400 mb-3">Quick Stats</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-dark-400">ผู้ต้องหา</span>
                      <span className="text-white font-semibold">{case_.suspects.length} คน</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-dark-400">หลักฐาน</span>
                      <span className="text-white font-semibold">{case_.evidence.length} รายการ</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-dark-400">ทีมงาน</span>
                      <span className="text-white font-semibold">{case_.team.length} คน</span>
                    </div>
                  </div>
                </div>

                {case_.tags.length > 0 && (
                  <div className="bg-dark-900 rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-dark-400 mb-3">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {case_.tags.map(tag => (
                        <span key={tag} className="px-3 py-1 bg-dark-700 rounded-full text-xs text-dark-300">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'timeline' && (
            <div className="space-y-4">
              {case_.timeline.length === 0 ? (
                <div className="text-center py-12">
                  <Clock size={48} className="text-dark-600 mx-auto mb-4" />
                  <p className="text-dark-400">ยังไม่มี Timeline</p>
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-dark-700" />
                  {case_.timeline.map((item, _index) => (
                    <div key={item.id} className="relative flex gap-4 pb-6">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center z-10 ${
                        item.type === 'created' ? 'bg-green-500/20' :
                        item.type === 'evidence' ? 'bg-blue-500/20' :
                        item.type === 'suspect' ? 'bg-red-500/20' :
                        'bg-dark-700'
                      }`}>
                        {item.type === 'created' && <Plus size={20} className="text-green-400" />}
                        {item.type === 'evidence' && <Shield size={20} className="text-blue-400" />}
                        {item.type === 'suspect' && <Users size={20} className="text-red-400" />}
                        {item.type === 'updated' && <Edit size={20} className="text-dark-400" />}
                      </div>
                      <div className="flex-1 bg-dark-900 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-white font-medium">{item.title}</h4>
                          <span className="text-xs text-dark-500">{new Date(item.date).toLocaleDateString('th-TH')}</span>
                        </div>
                        <p className="text-sm text-dark-400">{item.description}</p>
                        <p className="text-xs text-dark-500 mt-2">โดย {item.user}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'evidence' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <p className="text-dark-400">{case_.evidence.length} รายการ</p>
                <Button variant="primary" size="sm">
                  <Plus size={16} className="mr-1" /> เพิ่มหลักฐาน
                </Button>
              </div>
              {case_.evidence.length === 0 ? (
                <div className="text-center py-12">
                  <Shield size={48} className="text-dark-600 mx-auto mb-4" />
                  <p className="text-dark-400">ยังไม่มีหลักฐาน</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {case_.evidence.map(item => (
                    <div key={item.id} className="bg-dark-900 rounded-xl p-4 flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary-500/20 rounded-lg flex items-center justify-center">
                        <FileText size={24} className="text-primary-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium">{item.name}</p>
                        {item.hash && (
                          <p className="text-xs text-dark-500 font-mono">SHA-256: {item.hash}</p>
                        )}
                        <p className="text-xs text-dark-400 mt-1">เพิ่มเมื่อ {item.addedAt}</p>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Eye size={16} />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'suspects' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <p className="text-dark-400">{case_.suspects.length} คน</p>
                <Button variant="primary" size="sm">
                  <Plus size={16} className="mr-1" /> เพิ่มผู้ต้องหา
                </Button>
              </div>
              {case_.suspects.length === 0 ? (
                <div className="text-center py-12">
                  <Users size={48} className="text-dark-600 mx-auto mb-4" />
                  <p className="text-dark-400">ยังไม่มีผู้ต้องหา</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {case_.suspects.map(suspect => {
                    const statusStyle = getSuspectStatusStyle(suspect.status);
                    return (
                      <div key={suspect.id} className="bg-dark-900 rounded-xl p-4 flex items-center gap-4">
                        <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                          <User size={24} className="text-red-400" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-white font-semibold">{suspect.name}</p>
                            <span className={`px-2 py-0.5 rounded text-xs ${statusStyle.bg} ${statusStyle.text}`}>
                              {statusStyle.label}
                            </span>
                          </div>
                          <p className="text-sm text-dark-400">{suspect.role}</p>
                          {suspect.idNumber && (
                            <p className="text-xs text-dark-500">ID: {suspect.idNumber}</p>
                          )}
                        </div>
                        {suspect.nationality && (
                          <span className="text-xs text-dark-400">{suspect.nationality}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'team' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <p className="text-dark-400">{case_.team.length} คน</p>
                <Button variant="primary" size="sm">
                  <Plus size={16} className="mr-1" /> เพิ่มสมาชิก
                </Button>
              </div>
              {case_.team.length === 0 ? (
                <div className="text-center py-12">
                  <Users size={48} className="text-dark-600 mx-auto mb-4" />
                  <p className="text-dark-400">ยังไม่มีทีมงาน</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {case_.team.map(member => (
                    <div key={member.id} className="bg-dark-900 rounded-xl p-4 flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary-500/20 rounded-full flex items-center justify-center">
                        <span className="text-primary-400 font-semibold">
                          {member.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="text-white font-medium">{member.name}</p>
                        <p className="text-sm text-dark-400">{member.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const CreateCaseModal = ({ onClose, onSave }: { onClose: () => void; onSave: (case_: Partial<CaseItem>) => void }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'Cryptocurrency Fraud',
    priority: 'medium',
    amount: '',
    dueDate: ''
  });

  const handleSubmit = () => {
    if (!formData.name) {
      alert('กรุณากรอกชื่อคดี');
      return;
    }
    onSave({
      ...formData,
      amount: parseFloat(formData.amount) || 0
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-dark-800 rounded-2xl border border-dark-700 w-full max-w-lg">
        <div className="p-6 border-b border-dark-700 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">สร้างคดีใหม่</h2>
          <button onClick={onClose} className="p-2 hover:bg-dark-700 rounded-lg">
            <X size={20} className="text-dark-400" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-sm text-dark-400 mb-1 block">ชื่อคดี *</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="เช่น คดีฟอกเงินผ่าน Crypto"
            />
          </div>
          <div>
            <label className="text-sm text-dark-400 mb-1 block">รายละเอียด</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="รายละเอียดคดี..."
              rows={3}
              className="w-full bg-dark-900 border border-dark-700 rounded-lg p-3 text-white resize-none focus:outline-none focus:border-primary-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-dark-400 mb-1 block">ประเภทคดี</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full bg-dark-900 border border-dark-700 rounded-lg p-3 text-white focus:outline-none focus:border-primary-500"
              >
                {CASE_TYPES.filter(t => t !== 'ทั้งหมด').map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-dark-400 mb-1 block">ความสำคัญ</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full bg-dark-900 border border-dark-700 rounded-lg p-3 text-white focus:outline-none focus:border-primary-500"
              >
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-dark-400 mb-1 block">มูลค่าความเสียหาย (บาท)</label>
              <Input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0"
              />
            </div>
            <div>
              <label className="text-sm text-dark-400 mb-1 block">กำหนดส่ง</label>
              <Input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              />
            </div>
          </div>
        </div>
        <div className="p-6 border-t border-dark-700 flex gap-3">
          <Button variant="ghost" className="flex-1" onClick={onClose}>ยกเลิก</Button>
          <Button variant="primary" className="flex-1" onClick={handleSubmit}>
            <Plus size={18} className="mr-1" /> สร้างคดี
          </Button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

export const Cases = () => {
  const [cases, setCases] = useState<CaseItem[]>(MOCK_CASES);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('ทั้งหมด');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedCase, setSelectedCase] = useState<CaseItem | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [_viewMode, _setViewMode] = useState<'grid' | 'list'>('grid');

  const filteredCases = cases.filter(case_ => {
    const matchesSearch = case_.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         case_.caseNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'ทั้งหมด' || case_.type === selectedType;
    const matchesStatus = selectedStatus === 'all' || case_.status === selectedStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const handleCreateCase = (newCase: Partial<CaseItem>) => {
    const caseNumber = `CASE-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(Date.now()).slice(-3)}`;
    const fullCase: CaseItem = {
      id: String(Date.now()),
      caseNumber,
      name: newCase.name || '',
      description: newCase.description || '',
      type: newCase.type || 'Other',
      status: 'draft',
      priority: (newCase.priority as CaseItem['priority']) || 'medium',
      amount: newCase.amount || 0,
      currency: 'THB',
      suspects: [],
      team: [],
      evidence: [],
      timeline: [
        {
          id: '1',
          date: new Date().toISOString().slice(0, 10),
          title: 'สร้างคดี',
          description: 'เริ่มต้นการสืบสวน',
          type: 'created',
          user: 'Current User'
        }
      ],
      createdAt: new Date().toISOString().slice(0, 10),
      updatedAt: new Date().toISOString().slice(0, 10),
      dueDate: newCase.dueDate || '',
      progress: 0,
      tags: []
    };
    setCases([fullCase, ...cases]);
  };

  return (
    <div className="flex-1 p-6 space-y-6 bg-dark-900 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">คดีทั้งหมด</h1>
          <p className="text-dark-400 mt-1">{filteredCases.length} คดี</p>
        </div>
        <Button variant="primary" onClick={() => setShowCreateModal(true)}>
          <Plus size={18} className="mr-2" />
          สร้างคดีใหม่
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" size={20} />
          <Input
            placeholder="ค้นหาคดี..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="bg-dark-800 border border-dark-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-500"
        >
          {CASE_TYPES.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="bg-dark-800 border border-dark-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-500"
        >
          {STATUS_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Cases Grid */}
      {filteredCases.length === 0 ? (
        <div className="text-center py-16">
          <Briefcase size={64} className="text-dark-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">ไม่พบคดี</h3>
          <p className="text-dark-400 mb-6">
            {searchQuery ? 'ลองค้นหาด้วยคำอื่น' : 'สร้างคดีใหม่เพื่อเริ่มต้น'}
          </p>
          {!searchQuery && (
            <Button variant="primary" onClick={() => setShowCreateModal(true)}>
              <Plus size={18} className="mr-2" />
              สร้างคดีใหม่
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredCases.map(case_ => (
            <CaseCard
              key={case_.id}
              case_={case_}
              onClick={() => setSelectedCase(case_)}
            />
          ))}
        </div>
      )}

      {/* Case Detail Modal */}
      {selectedCase && (
        <CaseDetailModal
          case_={selectedCase}
          onClose={() => setSelectedCase(null)}
        />
      )}

      {/* Create Case Modal */}
      {showCreateModal && (
        <CreateCaseModal
          onClose={() => setShowCreateModal(false)}
          onSave={handleCreateCase}
        />
      )}
    </div>
  );
};

export { Cases as CasesPage };
export default Cases;
