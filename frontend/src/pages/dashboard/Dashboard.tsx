/**
 * Dashboard V2 - Complete Investigation Dashboard
 * Features:
 * 1. Stats Cards with animations
 * 2. Charts (Cases, Risk, Timeline)
 * 3. Recent Activities
 * 4. Quick Actions
 * 5. Active Cases Overview
 * 6. Team Performance
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  Briefcase,
  Users,
  DollarSign,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  ArrowRight,
  Plus,
  Search,
  FileText,
  Shield,
  Activity,
  Wallet,
  Phone,
  Globe,
  Eye,
  Calendar,
  BarChart3,
  PieChart,
  Target,
  Zap,
  Bell,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { Button, Card } from '../../components/ui';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPie,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts';

// ============================================
// MOCK DATA - Replace with API calls
// ============================================

const STATS = [
  {
    id: 'total-cases',
    label: 'คดีทั้งหมด',
    value: 156,
    change: +12,
    changePercent: 8.3,
    trend: 'up',
    icon: Briefcase,
    color: 'primary',
    bgColor: 'bg-primary-500/20',
    textColor: 'text-primary-400'
  },
  {
    id: 'active-cases',
    label: 'คดีที่กำลังดำเนินการ',
    value: 42,
    change: +5,
    changePercent: 13.5,
    trend: 'up',
    icon: Activity,
    color: 'amber',
    bgColor: 'bg-amber-500/20',
    textColor: 'text-amber-400'
  },
  {
    id: 'seized-amount',
    label: 'มูลค่ายึดทรัพย์',
    value: '฿847M',
    change: +127,
    changePercent: 17.6,
    trend: 'up',
    icon: DollarSign,
    color: 'green',
    bgColor: 'bg-green-500/20',
    textColor: 'text-green-400'
  },
  {
    id: 'suspects',
    label: 'ผู้ต้องหา',
    value: 89,
    change: +7,
    changePercent: 8.5,
    trend: 'up',
    icon: Users,
    color: 'red',
    bgColor: 'bg-red-500/20',
    textColor: 'text-red-400'
  }
];

const CASE_TREND_DATA = [
  { month: 'ก.ค.', cases: 12, closed: 8, seized: 45 },
  { month: 'ส.ค.', cases: 19, closed: 12, seized: 78 },
  { month: 'ก.ย.', cases: 15, closed: 14, seized: 62 },
  { month: 'ต.ค.', cases: 25, closed: 18, seized: 124 },
  { month: 'พ.ย.', cases: 32, closed: 22, seized: 189 },
  { month: 'ธ.ค.', cases: 28, closed: 25, seized: 156 },
  { month: 'ม.ค.', cases: 35, closed: 20, seized: 203 }
];

const CASE_STATUS_DATA = [
  { name: 'กำลังสืบสวน', value: 42, color: '#3b82f6' },
  { name: 'รอพนักงานอัยการ', value: 28, color: '#f59e0b' },
  { name: 'อยู่ในชั้นศาล', value: 35, color: '#8b5cf6' },
  { name: 'ปิดคดี', value: 51, color: '#22c55e' }
];

const RISK_LEVEL_DATA = [
  { level: 'Critical', count: 12, color: '#ef4444' },
  { level: 'High', count: 28, color: '#f97316' },
  { level: 'Medium', count: 45, color: '#eab308' },
  { level: 'Low', count: 71, color: '#22c55e' }
];

const RECENT_ACTIVITIES = [
  {
    id: 1,
    type: 'case_created',
    title: 'สร้างคดีใหม่',
    description: 'CASE-20260111-ABC123 - คดีฟอกเงินผ่าน Crypto',
    user: 'พ.ต.ท. สมชาย',
    time: '5 นาทีที่แล้ว',
    icon: Plus,
    color: 'text-green-400',
    bgColor: 'bg-green-500/20'
  },
  {
    id: 2,
    type: 'evidence_added',
    title: 'เพิ่มหลักฐาน',
    description: 'อัพโหลด 3 ไฟล์ พร้อม Hash verification',
    user: 'ร.ต.อ. สมหญิง',
    time: '15 นาทีที่แล้ว',
    icon: Shield,
    color: 'text-primary-400',
    bgColor: 'bg-primary-500/20'
  },
  {
    id: 3,
    type: 'wallet_traced',
    title: 'ติดตาม Wallet สำเร็จ',
    description: 'พบเส้นทางเงิน 5.2 BTC → Exchange → KYC',
    user: 'พ.ต.ต. วิชัย',
    time: '32 นาทีที่แล้ว',
    icon: Wallet,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/20'
  },
  {
    id: 4,
    type: 'suspect_identified',
    title: 'ระบุตัวผู้ต้องหา',
    description: 'ได้ข้อมูล KYC จาก Bitkub Exchange',
    user: 'พ.ต.ท. สมชาย',
    time: '1 ชั่วโมงที่แล้ว',
    icon: Users,
    color: 'text-red-400',
    bgColor: 'bg-red-500/20'
  },
  {
    id: 5,
    type: 'report_generated',
    title: 'สร้างรายงานศาล',
    description: 'CASE-20260110-XYZ789 พร้อมยื่นอัยการ',
    user: 'ร.ต.อ. สมหญิง',
    time: '2 ชั่วโมงที่แล้ว',
    icon: FileText,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20'
  }
];

const ACTIVE_CASES = [
  {
    id: 'CASE-20260111-001',
    name: 'คดี Silk Road Thailand',
    type: 'Cryptocurrency Fraud',
    status: 'investigating',
    progress: 75,
    amount: '฿156M',
    suspects: 3,
    dueDate: '2026-02-15',
    priority: 'critical'
  },
  {
    id: 'CASE-20260110-002',
    name: 'คดีแชร์ลูกโซ่ออนไลน์',
    type: 'Ponzi Scheme',
    status: 'investigating',
    progress: 45,
    amount: '฿89M',
    suspects: 5,
    dueDate: '2026-01-30',
    priority: 'high'
  },
  {
    id: 'CASE-20260109-003',
    name: 'คดีฟอกเงินคาสิโน',
    type: 'Money Laundering',
    status: 'prosecutor',
    progress: 90,
    amount: '฿234M',
    suspects: 8,
    dueDate: '2026-01-20',
    priority: 'high'
  },
  {
    id: 'CASE-20260108-004',
    name: 'คดีหลอกลงทุน Forex',
    type: 'Investment Fraud',
    status: 'investigating',
    progress: 30,
    amount: '฿45M',
    suspects: 2,
    dueDate: '2026-03-01',
    priority: 'medium'
  }
];

const QUICK_ACTIONS = [
  { id: 'new-case', label: 'สร้างคดีใหม่', icon: Plus, color: 'primary', path: '/cases' },
  { id: 'trace-wallet', label: 'ติดตาม Wallet', icon: Wallet, color: 'amber', path: '/crypto' },
  { id: 'money-flow', label: 'วิเคราะห์ Money Flow', icon: Activity, color: 'green', path: '/money-flow' },
  { id: 'import-data', label: 'นำเข้าข้อมูล', icon: FileText, color: 'purple', path: '/import' },
  { id: 'call-analysis', label: 'วิเคราะห์ CDR', icon: Phone, color: 'blue', path: '/call-analysis' },
  { id: 'generate-report', label: 'สร้างรายงาน', icon: FileText, color: 'red', path: '/report' }
];

// ============================================
// COMPONENTS
// ============================================

const StatCard = ({ stat, index }: { stat: typeof STATS[0]; index: number }) => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), index * 100);
    return () => clearTimeout(timer);
  }, [index]);

  const Icon = stat.icon;
  
  return (
    <div 
      className={`bg-dark-800 rounded-xl border border-dark-700 p-6 transition-all duration-500 hover:border-dark-600 hover:shadow-lg ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-dark-400 text-sm mb-1">{stat.label}</p>
          <p className="text-3xl font-bold text-white">{stat.value}</p>
          <div className={`flex items-center gap-1 mt-2 text-sm ${
            stat.trend === 'up' ? 'text-green-400' : 'text-red-400'
          }`}>
            {stat.trend === 'up' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            <span>+{stat.change} ({stat.changePercent}%)</span>
            <span className="text-dark-500 ml-1">จากเดือนก่อน</span>
          </div>
        </div>
        <div className={`w-14 h-14 ${stat.bgColor} rounded-xl flex items-center justify-center`}>
          <Icon size={28} className={stat.textColor} />
        </div>
      </div>
    </div>
  );
};

const CaseTrendChart = () => (
  <div className="bg-dark-800 rounded-xl border border-dark-700 p-6">
    <div className="flex items-center justify-between mb-6">
      <div>
        <h3 className="text-lg font-semibold text-white">แนวโน้มคดี</h3>
        <p className="text-sm text-dark-400">จำนวนคดีและมูลค่ายึดทรัพย์รายเดือน</p>
      </div>
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-primary-500 rounded-full" />
          <span className="text-dark-400">คดีใหม่</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full" />
          <span className="text-dark-400">ปิดคดี</span>
        </div>
      </div>
    </div>
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={CASE_TREND_DATA}>
        <defs>
          <linearGradient id="colorCases" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="colorClosed" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
        <YAxis stroke="#9ca3af" fontSize={12} />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: '#1f2937', 
            border: '1px solid #374151',
            borderRadius: '8px'
          }}
        />
        <Area type="monotone" dataKey="cases" stroke="#3b82f6" fillOpacity={1} fill="url(#colorCases)" name="คดีใหม่" />
        <Area type="monotone" dataKey="closed" stroke="#22c55e" fillOpacity={1} fill="url(#colorClosed)" name="ปิดคดี" />
      </AreaChart>
    </ResponsiveContainer>
  </div>
);

const CaseStatusChart = () => (
  <div className="bg-dark-800 rounded-xl border border-dark-700 p-6">
    <div className="flex items-center justify-between mb-6">
      <div>
        <h3 className="text-lg font-semibold text-white">สถานะคดี</h3>
        <p className="text-sm text-dark-400">การกระจายตามสถานะ</p>
      </div>
      <PieChart size={20} className="text-dark-400" />
    </div>
    <div className="flex items-center justify-center">
      <ResponsiveContainer width="100%" height={250}>
        <RechartsPie>
          <Pie
            data={CASE_STATUS_DATA}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
          >
            {CASE_STATUS_DATA.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#1f2937', 
              border: '1px solid #374151',
              borderRadius: '8px'
            }}
          />
        </RechartsPie>
      </ResponsiveContainer>
    </div>
    <div className="grid grid-cols-2 gap-3 mt-4">
      {CASE_STATUS_DATA.map((item) => (
        <div key={item.name} className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
          <span className="text-sm text-dark-400">{item.name}</span>
          <span className="text-sm font-semibold text-white ml-auto">{item.value}</span>
        </div>
      ))}
    </div>
  </div>
);

const RiskLevelChart = () => (
  <div className="bg-dark-800 rounded-xl border border-dark-700 p-6">
    <div className="flex items-center justify-between mb-6">
      <div>
        <h3 className="text-lg font-semibold text-white">ระดับความเสี่ยง</h3>
        <p className="text-sm text-dark-400">การจำแนกตามความรุนแรง</p>
      </div>
      <BarChart3 size={20} className="text-dark-400" />
    </div>
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={RISK_LEVEL_DATA} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis type="number" stroke="#9ca3af" fontSize={12} />
        <YAxis dataKey="level" type="category" stroke="#9ca3af" fontSize={12} width={60} />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: '#1f2937', 
            border: '1px solid #374151',
            borderRadius: '8px'
          }}
        />
        <Bar dataKey="count" radius={[0, 4, 4, 0]}>
          {RISK_LEVEL_DATA.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  </div>
);

const RecentActivities = () => (
  <div className="bg-dark-800 rounded-xl border border-dark-700 p-6">
    <div className="flex items-center justify-between mb-6">
      <div>
        <h3 className="text-lg font-semibold text-white">กิจกรรมล่าสุด</h3>
        <p className="text-sm text-dark-400">อัพเดตจากทีม</p>
      </div>
      <Button variant="ghost" size="sm">
        ดูทั้งหมด <ChevronRight size={16} />
      </Button>
    </div>
    <div className="space-y-4">
      {RECENT_ACTIVITIES.map((activity) => {
        const Icon = activity.icon;
        return (
          <div key={activity.id} className="flex items-start gap-4 p-3 rounded-lg hover:bg-dark-700/50 transition-colors">
            <div className={`w-10 h-10 ${activity.bgColor} rounded-lg flex items-center justify-center flex-shrink-0`}>
              <Icon size={20} className={activity.color} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium">{activity.title}</p>
              <p className="text-sm text-dark-400 truncate">{activity.description}</p>
              <div className="flex items-center gap-2 mt-1 text-xs text-dark-500">
                <span>{activity.user}</span>
                <span>•</span>
                <span>{activity.time}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

const QuickActions = () => {
  const navigate = useNavigate();
  
  return (
    <div className="bg-dark-800 rounded-xl border border-dark-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">Quick Actions</h3>
          <p className="text-sm text-dark-400">ทางลัดการทำงาน</p>
        </div>
        <Zap size={20} className="text-amber-400" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {QUICK_ACTIONS.map((action) => {
          const Icon = action.icon;
          const bgColors: Record<string, string> = {
            primary: 'bg-primary-500/20 hover:bg-primary-500/30',
            amber: 'bg-amber-500/20 hover:bg-amber-500/30',
            green: 'bg-green-500/20 hover:bg-green-500/30',
            purple: 'bg-purple-500/20 hover:bg-purple-500/30',
            blue: 'bg-blue-500/20 hover:bg-blue-500/30',
            red: 'bg-red-500/20 hover:bg-red-500/30'
          };
          const textColors: Record<string, string> = {
            primary: 'text-primary-400',
            amber: 'text-amber-400',
            green: 'text-green-400',
            purple: 'text-purple-400',
            blue: 'text-blue-400',
            red: 'text-red-400'
          };
          
          return (
            <button
              key={action.id}
              onClick={() => navigate(action.path)}
              className={`${bgColors[action.color]} p-4 rounded-xl transition-all flex flex-col items-center gap-2 group`}
            >
              <Icon size={24} className={textColors[action.color]} />
              <span className="text-sm text-dark-300 group-hover:text-white transition-colors">{action.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

const ActiveCasesTable = () => {
  const navigate = useNavigate();
  
  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string; label: string }> = {
      investigating: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'กำลังสืบสวน' },
      prosecutor: { bg: 'bg-amber-500/20', text: 'text-amber-400', label: 'รอพนักงานอัยการ' },
      court: { bg: 'bg-purple-500/20', text: 'text-purple-400', label: 'อยู่ในชั้นศาล' },
      closed: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'ปิดคดี' }
    };
    const style = styles[status] || styles.investigating;
    return (
      <span className={`px-2 py-1 rounded-full text-xs ${style.bg} ${style.text}`}>
        {style.label}
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const styles: Record<string, { bg: string; text: string }> = {
      critical: { bg: 'bg-red-500/20', text: 'text-red-400' },
      high: { bg: 'bg-orange-500/20', text: 'text-orange-400' },
      medium: { bg: 'bg-yellow-500/20', text: 'text-yellow-400' },
      low: { bg: 'bg-green-500/20', text: 'text-green-400' }
    };
    const style = styles[priority] || styles.medium;
    return (
      <span className={`px-2 py-1 rounded text-xs ${style.bg} ${style.text} uppercase`}>
        {priority}
      </span>
    );
  };

  return (
    <div className="bg-dark-800 rounded-xl border border-dark-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">คดีที่กำลังดำเนินการ</h3>
          <p className="text-sm text-dark-400">คดีสำคัญที่ต้องติดตาม</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => navigate('/cases')}>
          ดูทั้งหมด <ChevronRight size={16} />
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-dark-700">
              <th className="text-left py-3 px-4 text-sm font-medium text-dark-400">คดี</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-dark-400">สถานะ</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-dark-400">ความคืบหน้า</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-dark-400">มูลค่า</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-dark-400">Priority</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-dark-400">กำหนด</th>
            </tr>
          </thead>
          <tbody>
            {ACTIVE_CASES.map((case_) => (
              <tr key={case_.id} className="border-b border-dark-700/50 hover:bg-dark-700/30 transition-colors cursor-pointer" onClick={() => navigate('/cases')}>
                <td className="py-4 px-4">
                  <div>
                    <p className="text-white font-medium">{case_.name}</p>
                    <p className="text-xs text-dark-500">{case_.id}</p>
                  </div>
                </td>
                <td className="py-4 px-4">
                  {getStatusBadge(case_.status)}
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-dark-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary-500 rounded-full transition-all"
                        style={{ width: `${case_.progress}%` }}
                      />
                    </div>
                    <span className="text-sm text-dark-400 w-10">{case_.progress}%</span>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <span className="text-amber-400 font-semibold">{case_.amount}</span>
                </td>
                <td className="py-4 px-4">
                  {getPriorityBadge(case_.priority)}
                </td>
                <td className="py-4 px-4 text-right">
                  <span className="text-sm text-dark-400">{new Date(case_.dueDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

export const Dashboard = () => {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex-1 p-6 space-y-6 bg-dark-900 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-dark-400 mt-1">
            ยินดีต้อนรับกลับ! นี่คือภาพรวมของวันนี้
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-dark-400">วันที่</p>
            <p className="text-white font-medium">
              {currentTime.toLocaleDateString('th-TH', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
          <Button variant="primary" onClick={() => navigate('/cases')}>
            <Plus size={18} className="mr-2" />
            สร้างคดีใหม่
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {STATS.map((stat, index) => (
          <StatCard key={stat.id} stat={stat} index={index} />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <CaseTrendChart />
        </div>
        <CaseStatusChart />
      </div>

      {/* Middle Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ActiveCasesTable />
        </div>
        <div className="space-y-6">
          <QuickActions />
          <RiskLevelChart />
        </div>
      </div>

      {/* Recent Activities */}
      <RecentActivities />
    </div>
  );
};

export { Dashboard as DashboardPage };
export default Dashboard;
