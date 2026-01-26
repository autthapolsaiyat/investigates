/**
 * Dashboard V3 - Real Data Dashboard
 * Features:
 * 1. Stats Cards from real cases
 * 2. Active Cases list from API
 * 3. Quick Actions
 * 4. Case Status Distribution
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase,
  Users,
  DollarSign,
  Plus,
  FileText,
  Activity,
  Wallet,
  Phone,
  PieChart,
  Zap,
  ChevronRight,
  Loader2,
  AlertCircle,
  Calendar,
  MapPin
} from 'lucide-react';
import { Button, Card } from '../../components/ui';
import { casesAPI } from '../../services/api';
import type { Case } from '../../services/api';
import {
  PieChart as RechartsPie,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip
} from 'recharts';

// ============================================
// TYPES
// ============================================
interface DashboardStats {
  totalCases: number;
  activeCases: number;
  totalAmount: number;
  totalSuspects: number;
  totalVictims: number;
}

interface StatusCount {
  name: string;
  value: number;
  color: string;
  [key: string]: string | number;  // Index signature for recharts compatibility
}

// ============================================
// QUICK ACTIONS CONFIG
// ============================================
const QUICK_ACTIONS = [
  { id: 'new-case', label: 'Create Case', icon: Plus, color: 'primary', path: '/cases' },
  { id: 'trace-wallet', label: 'Crypto Tracker', icon: Wallet, color: 'amber', path: '/crypto' },
  { id: 'money-flow', label: 'Money Flow', icon: Activity, color: 'green', path: '/money-flow' },
  { id: 'import-data', label: 'Import Data', icon: FileText, color: 'purple', path: '/import' },
  { id: 'call-analysis', label: 'Call Analysis', icon: Phone, color: 'blue', path: '/call-analysis' },
  { id: 'location', label: 'Location', icon: MapPin, color: 'red', path: '/location' }
];

// ============================================
// HELPER FUNCTIONS
// ============================================
const formatCurrency = (amount: number): string => {
  if (amount >= 1000000000) {
    return `฿${(amount / 1000000000).toFixed(1)}B`;
  }
  if (amount >= 1000000) {
    return `฿${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `฿${(amount / 1000).toFixed(0)}K`;
  }
  return `฿${amount.toLocaleString()}`;
};

const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    'open': 'Open',
    'investigating': 'Investigating',
    'pending_review': 'Pending Review',
    'closed': 'Closed',
    'archived': 'Archived'
  };
  return labels[status] || status;
};

const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    'open': '#3b82f6',
    'investigating': '#f59e0b',
    'pending_review': '#8b5cf6',
    'closed': '#22c55e',
    'archived': '#6b7280'
  };
  return colors[status] || '#6b7280';
};

// ============================================
// COMPONENTS
// ============================================

const StatCard = ({ 
  icon: Icon, 
  label, 
  value, 
  bgColor, 
  textColor 
}: { 
  icon: any; 
  label: string; 
  value: string | number;
  bgColor: string;
  textColor: string;
}) => (
  <Card className="p-6">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-dark-400 text-sm mb-1">{label}</p>
        <p className="text-3xl font-bold text-white">{value}</p>
      </div>
      <div className={`w-14 h-14 ${bgColor} rounded-xl flex items-center justify-center`}>
        <Icon size={28} className={textColor} />
      </div>
    </div>
  </Card>
);

const QuickActions = () => {
  const navigate = useNavigate();
  
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
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Quick Actions</h3>
        <Zap size={20} className="text-amber-400" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        {QUICK_ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              onClick={() => navigate(action.path)}
              className={`${bgColors[action.color]} p-4 rounded-xl transition-all flex flex-col items-center gap-2 group`}
            >
              <Icon size={24} className={textColors[action.color]} />
              <span className="text-xs text-dark-300 group-hover:text-white transition-colors text-center">{action.label}</span>
            </button>
          );
        })}
      </div>
    </Card>
  );
};

const CaseStatusChart = ({ data }: { data: StatusCount[] }) => {
  if (data.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Case Status</h3>
          <PieChart size={20} className="text-dark-400" />
        </div>
        <div className="h-[200px] flex items-center justify-center text-dark-400">
          No case data
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Case Status</h3>
        <PieChart size={20} className="text-dark-400" />
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <RechartsPie>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((entry, index) => (
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
      <div className="grid grid-cols-2 gap-2 mt-4">
        {data.map((item) => (
          <div key={item.name} className="flex items-center gap-2 text-sm">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: item.color }}
            />
            <span className="text-dark-400">{item.name}</span>
            <span className="text-white ml-auto">{item.value}</span>
          </div>
        ))}
      </div>
    </Card>
  );
};

const ActiveCasesTable = ({ cases }: { cases: Case[] }) => {
  const navigate = useNavigate();

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string }> = {
      open: { bg: 'bg-blue-500/20', text: 'text-blue-400' },
      investigating: { bg: 'bg-amber-500/20', text: 'text-amber-400' },
      pending_review: { bg: 'bg-purple-500/20', text: 'text-purple-400' },
      closed: { bg: 'bg-green-500/20', text: 'text-green-400' },
      archived: { bg: 'bg-gray-500/20', text: 'text-gray-400' }
    };
    const style = styles[status] || styles.open;
    return (
      <span className={`px-2 py-1 rounded-full text-xs ${style.bg} ${style.text}`}>
        {getStatusLabel(status)}
      </span>
    );
  };

  if (cases.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Recent Cases</h3>
          <Button variant="ghost" size="sm" onClick={() => navigate('/cases')}>
            View All <ChevronRight size={16} />
          </Button>
        </div>
        <div className="text-center py-12 text-dark-400">
          <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No cases yet</p>
          <Button variant="primary" className="mt-4" onClick={() => navigate('/cases')}>
            <Plus size={16} className="mr-2" />
            Create First Case
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Recent Cases</h3>
        <Button variant="ghost" size="sm" onClick={() => navigate('/cases')}>
          View All <ChevronRight size={16} />
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-dark-700">
              <th className="text-left py-3 px-4 text-sm font-medium text-dark-400">Case</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-dark-400">Status</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-dark-400">Amount</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-dark-400">Suspects</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-dark-400">Created</th>
            </tr>
          </thead>
          <tbody>
            {cases.slice(0, 5).map((c) => (
              <tr 
                key={c.id} 
                className="border-b border-dark-700/50 hover:bg-dark-700/30 cursor-pointer transition-colors"
                onClick={() => navigate('/cases')}
              >
                <td className="py-3 px-4">
                  <div>
                    <p className="font-medium text-white">{c.title}</p>
                    <p className="text-xs text-dark-400">{c.case_number}</p>
                  </div>
                </td>
                <td className="py-3 px-4">
                  {getStatusBadge(c.status)}
                </td>
                <td className="py-3 px-4 text-right text-white">
                  {formatCurrency(c.total_amount || 0)}
                </td>
                <td className="py-3 px-4 text-right text-dark-300">
                  {c.suspects_count || 0}
                </td>
                <td className="py-3 px-4 text-right text-dark-400 text-sm">
                  {new Date(c.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

export const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cases, setCases] = useState<Case[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalCases: 0,
    activeCases: 0,
    totalAmount: 0,
    totalSuspects: 0,
    totalVictims: 0
  });
  const [statusData, setStatusData] = useState<StatusCount[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Fetch cases and calculate stats
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await casesAPI.list({ page: 1, page_size: 100 });
        const allCases = response.items;
        setCases(allCases);

        // Calculate stats
        const totalCases = allCases.length;
        const activeCases = allCases.filter(c => 
          c.status === 'open' || c.status === 'investigating'
        ).length;
        const totalAmount = allCases.reduce((sum, c) => sum + (c.total_amount || 0), 0);
        const totalSuspects = allCases.reduce((sum, c) => sum + (c.suspects_count || 0), 0);
        const totalVictims = allCases.reduce((sum, c) => sum + (c.victims_count || 0), 0);

        setStats({
          totalCases,
          activeCases,
          totalAmount,
          totalSuspects,
          totalVictims
        });

        // Calculate status distribution
        const statusCounts: Record<string, number> = {};
        allCases.forEach(c => {
          statusCounts[c.status] = (statusCounts[c.status] || 0) + 1;
        });

        const statusChartData: StatusCount[] = Object.entries(statusCounts).map(([status, count]) => ({
          name: getStatusLabel(status),
          value: count,
          color: getStatusColor(status)
        }));
        setStatusData(statusChartData);

      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Update time
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  if (loading) {
    return (
      <div className="flex-1 p-6 bg-dark-900 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary-500 mx-auto mb-4" />
          <p className="text-dark-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 p-6 bg-dark-900 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
          <p className="text-red-400">{error}</p>
          <Button variant="primary" className="mt-4" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 space-y-6 bg-dark-900 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-dark-400 mt-1">
            Welcome back! Here's your investigation overview
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden md:block">
            <p className="text-sm text-dark-400">
              <Calendar size={14} className="inline mr-1" />
              {currentTime.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
          <Button variant="primary" onClick={() => navigate('/cases')}>
            <Plus size={18} className="mr-2" />
            New Case
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Briefcase}
          label="Total Cases"
          value={stats.totalCases}
          bgColor="bg-primary-500/20"
          textColor="text-primary-400"
        />
        <StatCard
          icon={Activity}
          label="Active Cases"
          value={stats.activeCases}
          bgColor="bg-amber-500/20"
          textColor="text-amber-400"
        />
        <StatCard
          icon={DollarSign}
          label="Total Amount"
          value={formatCurrency(stats.totalAmount)}
          bgColor="bg-green-500/20"
          textColor="text-green-400"
        />
        <StatCard
          icon={Users}
          label="Suspects"
          value={stats.totalSuspects}
          bgColor="bg-red-500/20"
          textColor="text-red-400"
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Cases Table */}
        <div className="lg:col-span-2">
          <ActiveCasesTable cases={cases} />
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          <QuickActions />
          <CaseStatusChart data={statusData} />
        </div>
      </div>
    </div>
  );
};

export { Dashboard as DashboardPage };
export default Dashboard;
