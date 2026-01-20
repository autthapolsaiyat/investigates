/**
 * Sidebar Component
 * Navigation sidebar organized by workflow
 */
import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Briefcase, 
  DollarSign, 
  Phone, 
  Wallet,
  Settings,
  LogOut,
  FileText,
  MapPin,
  FileSearch,
  Link2,
  Sparkles,
  ChevronDown,
  Loader2,
  RefreshCw,
  BookOpen,
  Bug
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useCaseStore } from '../../store/caseStore';
import { casesAPI, supportAPI, type Case } from '../../services/api';
import { CreateTicketModal } from '../../pages/support/CreateTicketModal';

// Map routes to count keys
const routeCountMap: Record<string, 'moneyFlow' | 'crypto' | 'calls' | 'locations'> = {
  '/app/money-flow': 'moneyFlow',
  '/app/crypto': 'crypto',
  '/app/call-analysis': 'calls',
  '/app/location-timeline': 'locations',
};

// จัดเรียงตาม Flow: สร้างคดี → นำเข้าข้อมูล → วิเคราะห์ → ขอข้อมูลเพิ่ม → สรุปผล → รายงาน

const navSections = [
  {
    title: 'OVERVIEW',
    items: [
      { to: '/app/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    ]
  },
  {
    title: 'CASE',
    items: [
      { to: '/app/cases', icon: Briefcase, label: 'Cases' },
    ]
  },
  {
    title: 'INPUT',
    items: [
      { to: '/app/smart-import', icon: Sparkles, label: 'Smart Import' },
    ]
  },
  {
    title: 'ANALYSIS',
    items: [
      { to: '/app/money-flow', icon: DollarSign, label: 'Money Flow' },
      { to: '/app/crypto', icon: Wallet, label: 'Crypto Tracker' },
      { to: '/app/call-analysis', icon: Phone, label: 'Call Analysis' },
      { to: '/app/location-timeline', icon: MapPin, label: 'Location Timeline' },
    ]
  },
  {
    title: 'INVESTIGATE',
    items: [
      { to: '/app/kyc-request', icon: FileSearch, label: 'KYC Request' },
    ]
  },
  {
    title: 'REPORTS',
    items: [
      { to: '/app/forensic-report', icon: FileText, label: 'Forensic Report' },
    ]
  },
  {
    title: 'DEMO',
    items: [
      { to: '/app/silk-road-demo', icon: Link2, label: 'Silk Road Demo' },
    ]
  },
];

// Admin roles that can see admin panel link
const ADMIN_ROLES = ['super_admin', 'admin'];

export const Sidebar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { dataCounts, selectedCaseId, selectedCase, setSelectedCase, fetchDataCounts, isLoadingCounts } = useCaseStore();
  
  // Case selector state
  const [cases, setCases] = useState<Case[]>([]);
  const [isLoadingCases, setIsLoadingCases] = useState(true);
  const [isCaseDropdownOpen, setIsCaseDropdownOpen] = useState(false);
  
  // Support ticket state
  const [unreadTickets, setUnreadTickets] = useState(0);
  const [isCreateTicketOpen, setIsCreateTicketOpen] = useState(false);

  // Fetch unread ticket count
  const fetchUnreadTickets = async () => {
    try {
      const response = await supportAPI.getUnreadCount();
      setUnreadTickets(response.unread_count);
    } catch (error) {
      console.error('Error fetching unread tickets:', error);
    }
  };

  // Fetch unread count on mount and periodically
  useEffect(() => {
    fetchUnreadTickets();
    const interval = setInterval(fetchUnreadTickets, 60000); // Every minute
    return () => clearInterval(interval);
  }, []);

  // Refresh counts
  const handleRefreshCounts = () => {
    if (selectedCaseId) {
      fetchDataCounts(selectedCaseId);
    }
  };

  // Fetch cases on mount
  useEffect(() => {
    const fetchCases = async () => {
      try {
        const response = await casesAPI.list({ page: 1, page_size: 100 });
        setCases(response.items);
        
        // Auto-select first case if none selected
        if (response.items.length > 0 && !selectedCaseId) {
          setSelectedCase(response.items[0].id, response.items[0]);
        } else if (selectedCaseId && !selectedCase) {
          // Restore case from ID
          const found = response.items.find(c => c.id === selectedCaseId);
          if (found) setSelectedCase(found.id, found);
        }
      } catch (err) {
        console.error('Error fetching cases:', err);
      } finally {
        setIsLoadingCases(false);
      }
    };
    fetchCases();
  }, []);

  const handleCaseSelect = (caseItem: Case) => {
    setSelectedCase(caseItem.id, caseItem);
    setIsCaseDropdownOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Get count for a route
  const getCount = (route: string): number | null => {
    const countKey = routeCountMap[route];
    if (!countKey || !selectedCaseId) return null;
    return dataCounts[countKey];
  };

  // Format count for display
  const formatCount = (count: number | null): string | null => {
    if (count === null) return null;
    if (count === 0) return null;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
    return count.toString();
  };

  return (
    <aside className="w-64 bg-dark-800 border-r border-dark-700 flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-dark-700 flex justify-center">
        <img src="/images/logo.png" alt="InvestiGate" className="h-28 w-auto" />
      </div>

      {/* Case Selector */}
      <div className="p-3 border-b border-dark-700">
        <p className="text-xs text-dark-500 uppercase tracking-wider mb-2 px-1">เลือกคดี</p>
        <div className="relative">
          <button
            onClick={() => setIsCaseDropdownOpen(!isCaseDropdownOpen)}
            disabled={isLoadingCases}
            className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg hover:border-primary-500/50 transition-colors text-left"
          >
            {isLoadingCases ? (
              <div className="flex items-center gap-2 text-dark-400">
                <Loader2 size={14} className="animate-spin" />
                <span className="text-sm">กำลังโหลด...</span>
              </div>
            ) : selectedCase ? (
              <div className="flex-1 min-w-0">
                <p className="text-xs text-primary-400 font-medium truncate">{selectedCase.case_number}</p>
                <p className="text-xs text-dark-400 truncate">{selectedCase.title}</p>
              </div>
            ) : (
              <span className="text-sm text-dark-400">-- เลือกคดี --</span>
            )}
            <ChevronDown size={14} className={`text-dark-400 transition-transform flex-shrink-0 ${isCaseDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown */}
          {isCaseDropdownOpen && (
            <div className="absolute z-50 w-full mt-1 bg-dark-800 border border-dark-600 rounded-lg shadow-xl max-h-[300px] overflow-y-auto">
              {cases.length > 0 ? cases.map(c => (
                <button
                  key={c.id}
                  onClick={() => handleCaseSelect(c)}
                  className={`w-full flex flex-col px-3 py-2 hover:bg-dark-700 transition-colors text-left ${
                    selectedCase?.id === c.id ? 'bg-primary-500/10 border-l-2 border-primary-500' : ''
                  }`}
                >
                  <span className="text-xs font-medium text-white truncate">{c.case_number}</span>
                  <span className="text-xs text-dark-400 truncate">{c.title}</span>
                </button>
              )) : (
                <div className="p-3 text-center text-dark-400 text-sm">
                  ไม่มีคดีในระบบ
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Refresh Button */}
        {selectedCaseId && (
          <button
            onClick={handleRefreshCounts}
            disabled={isLoadingCounts}
            className="mt-2 w-full flex items-center justify-center gap-2 px-3 py-1.5 text-xs text-dark-400 hover:text-white hover:bg-dark-700 rounded transition-colors"
          >
            <RefreshCw size={12} className={isLoadingCounts ? 'animate-spin' : ''} />
            {isLoadingCounts ? 'กำลังโหลด...' : 'รีเฟรชข้อมูล'}
          </button>
        )}
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navSections.map((section, sectionIndex) => (
          <div key={section.title} className={sectionIndex > 0 ? 'mt-4' : ''}>
            <p className="text-xs text-dark-500 uppercase tracking-wider mb-2 px-3">
              {section.title}
            </p>
            {section.items.map((item) => {
              const count = getCount(item.to);
              const displayCount = formatCount(count);
              const hasData = count !== null && count > 0;
              const noData = count === 0;
              
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-primary-500/20 text-primary-400'
                        : noData 
                          ? 'text-dark-500 hover:bg-dark-700 hover:text-dark-300'
                          : 'text-dark-300 hover:bg-dark-700 hover:text-white'
                    }`
                  }
                >
                  <item.icon size={18} />
                  <span className="text-sm flex-1">{item.label}</span>
                  {displayCount && (
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                      hasData 
                        ? 'bg-primary-500/20 text-primary-400' 
                        : 'bg-dark-700 text-dark-500'
                    }`}>
                      {displayCount}
                    </span>
                  )}
                  {noData && routeCountMap[item.to] && (
                    <span className="w-1.5 h-1.5 rounded-full bg-dark-600" title="ไม่มีข้อมูล" />
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}

        {/* Admin Panel Link (Only for admin roles) */}
        {user?.role && ADMIN_ROLES.includes(user.role) && (
          <div className="mt-6">
            <p className="text-xs text-dark-500 uppercase tracking-wider mb-2 px-3">Admin</p>
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-red-500/20 text-red-400'
                    : 'text-dark-300 hover:bg-dark-700 hover:text-white'
                }`
              }
            >
              <Settings size={18} />
              <span className="text-sm">Admin Panel</span>
              <span className="ml-auto text-xs px-1.5 py-0.5 rounded bg-red-500/20 text-red-400">
                Admin
              </span>
            </NavLink>
          </div>
        )}
      </nav>

      {/* Help Button */}
      <div className="px-4 py-2 border-t border-dark-700">
        <button
          onClick={() => window.open('/guide', '_blank')}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-dark-300 hover:bg-dark-700 hover:text-white transition-colors"
        >
          <BookOpen size={18} />
          <span className="text-sm">วิธีการใช้งาน</span>
        </button>
      </div>

      {/* Support Button */}
      <div className="px-4 py-2 border-t border-dark-700">
        <button
          onClick={() => setIsCreateTicketOpen(true)}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-dark-300 hover:bg-dark-700 hover:text-white transition-colors relative"
        >
          <Bug size={18} />
          <span className="text-sm">แจ้งปัญหา</span>
          {unreadTickets > 0 && (
            <span className="ml-auto px-1.5 py-0.5 text-xs bg-red-500 text-white rounded-full min-w-[20px] text-center">
              {unreadTickets}
            </span>
          )}
        </button>
        <NavLink
          to="/app/my-tickets"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 mt-1 rounded-lg transition-colors ${
              isActive
                ? 'bg-primary-500/20 text-primary-400'
                : 'text-dark-400 hover:bg-dark-700 hover:text-dark-300'
            }`
          }
        >
          <span className="text-sm ml-7">ดู Tickets ทั้งหมด</span>
        </NavLink>
      </div>

      {/* User Info */}
      <div className="p-4 border-t border-dark-700">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
            {user?.email?.charAt(0) || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.email || 'Admin User'}</p>
            <p className="text-xs text-dark-400 truncate">{user?.role || 'super_admin'}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-dark-400 hover:text-white transition-colors w-full"
        >
          <LogOut size={16} />
          <span className="text-sm">Logout</span>
        </button>
      </div>

      {/* Create Ticket Modal */}
      <CreateTicketModal
        isOpen={isCreateTicketOpen}
        onClose={() => setIsCreateTicketOpen(false)}
        onSuccess={fetchUnreadTickets}
      />
    </aside>
  );
};

export default Sidebar;
