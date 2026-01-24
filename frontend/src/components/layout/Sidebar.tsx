/**
 * Sidebar Component
 * Navigation sidebar organized by workflow
 */
import { useState, useEffect, useRef } from 'react';
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
  Bug,
  CreditCard,
  Bell,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useCaseStore } from '../../store/caseStore';
import { casesAPI, supportAPI, notificationsAPI, type Case, type UserNotificationItem } from '../../services/api';
import { CreateTicketModal } from '../../pages/support/CreateTicketModal';


// Subscription Badge Component
const SubscriptionBadge = ({ subscriptionEnd }: { subscriptionEnd: string }) => {
  const endDate = new Date(subscriptionEnd);
  const now = new Date();
  const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  let status: 'active' | 'expiring' | 'expired';
  let bgColor: string;
  let textColor: string;
  
  if (daysLeft < 0) {
    status = 'expired';
    bgColor = 'bg-red-500/10';
    textColor = 'text-red-400';
  } else if (daysLeft <= 7) {
    status = 'expiring';
    bgColor = 'bg-yellow-500/10';
    textColor = 'text-yellow-400';
  } else {
    status = 'active';
    bgColor = 'bg-green-500/10';
    textColor = 'text-green-400';
  }
  
  return (
    <div className={`${bgColor} rounded-lg p-2`}>
      <div className="flex items-center gap-2 mb-1">
        <CreditCard size={12} className={textColor} />
        <span className={`text-xs font-medium ${textColor}`}>
          {status === 'expired' ? 'หมดอายุแล้ว' : status === 'expiring' ? 'ใกล้หมดอายุ' : 'Subscription'}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-dark-400">
          {status === 'expired' 
            ? `หมด ${Math.abs(daysLeft)} วันที่แล้ว`
            : `เหลือ ${daysLeft} วัน`
          }
        </span>
        <span className="text-xs text-dark-500">
          {endDate.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}
        </span>
      </div>
    </div>
  );
};


// Notification Bell Component
const NotificationBell = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<UserNotificationItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchUnreadCount = async () => {
    try {
      const response = await notificationsAPI.getUnreadCount();
      setUnreadCount(response.unread_count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await notificationsAPI.getMyNotifications(10);
      setNotifications(response.items || []);
      setUnreadCount(response.unread_count || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await notificationsAPI.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isOpen) fetchNotifications();
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg hover:bg-dark-700 transition-colors relative"
        title="การแจ้งเตือน"
      >
        <Bell size={18} className="text-dark-400" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-80 bg-dark-800 border border-dark-600 rounded-lg shadow-xl z-50">
          <div className="p-3 border-b border-dark-700 flex items-center justify-between">
            <h3 className="text-sm font-medium text-white">การแจ้งเตือน</h3>
            {unreadCount > 0 && (
              <span className="text-xs text-primary-400">{unreadCount} ยังไม่อ่าน</span>
            )}
          </div>
          <div className="max-h-64 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-dark-400 text-sm">ไม่มีการแจ้งเตือน</div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  onClick={() => !n.is_read && handleMarkAsRead(n.id)}
                  className={`p-3 border-b border-dark-700 cursor-pointer hover:bg-dark-700 ${!n.is_read ? 'bg-primary-500/5' : ''}`}
                >
                  <p className={`text-sm ${!n.is_read ? 'text-white font-medium' : 'text-dark-300'}`}>{n.title}</p>
                  <p className="text-xs text-dark-400 mt-1 line-clamp-2">{n.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};


// Map routes to count keys
const routeCountMap: Record<string, 'moneyFlow' | 'crypto' | 'calls' | 'locations'> = {
  '/app/money-flow': 'moneyFlow',
  '/app/crypto': 'crypto',
  '/app/call-analysis': 'calls',
  '/app/location-timeline': 'locations',
};

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

const ADMIN_ROLES = ['super_admin', 'admin'];

export const Sidebar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { dataCounts, selectedCaseId, selectedCase, setSelectedCase, fetchDataCounts, isLoadingCounts } = useCaseStore();
  
  const [cases, setCases] = useState<Case[]>([]);
  const [isLoadingCases, setIsLoadingCases] = useState(true);
  const [isCaseDropdownOpen, setIsCaseDropdownOpen] = useState(false);
  
  const [unreadTickets, setUnreadTickets] = useState(0);
  const [isCreateTicketOpen, setIsCreateTicketOpen] = useState(false);

  const fetchUnreadTickets = async () => {
    try {
      const response = await supportAPI.getUnreadCount();
      setUnreadTickets(response.unread_count);
    } catch (error) {
      console.error('Error fetching unread tickets:', error);
    }
  };

  useEffect(() => {
    fetchUnreadTickets();
    const interval = setInterval(fetchUnreadTickets, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleRefreshCounts = () => {
    if (selectedCaseId) {
      fetchDataCounts(selectedCaseId);
    }
  };

  useEffect(() => {
    const fetchCases = async () => {
      try {
        const response = await casesAPI.list({ page: 1, page_size: 100 });
        setCases(response.items);
        
        if (response.items.length > 0 && !selectedCaseId) {
          setSelectedCase(response.items[0].id, response.items[0]);
        } else if (selectedCaseId && !selectedCase) {
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

  const getCount = (route: string): number | null => {
    const countKey = routeCountMap[route];
    if (!countKey || !selectedCaseId) return null;
    return dataCounts[countKey];
  };

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
        <NavLink
          to="/app/guide"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 w-full rounded-lg transition-colors ${
              isActive
                ? 'bg-primary-500/20 text-primary-400'
                : 'text-dark-300 hover:bg-dark-700 hover:text-white'
            }`
          }
        >
          <BookOpen size={18} />
          <span className="text-sm">วิธีการใช้งาน</span>
        </NavLink>
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

      {/* User Info with Notification Bell */}
      <div className="p-4 border-t border-dark-700">
        <div className="flex items-center gap-2 mb-3">
          <NavLink
            to="/app/profile"
            className={({ isActive }) =>
              `flex-1 flex items-center gap-3 p-2 rounded-lg transition-colors ${
                isActive ? 'bg-primary-500/20' : 'hover:bg-dark-700'
              }`
            }
          >
            <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
              {user?.email?.charAt(0) || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.full_name || user?.email || 'User'}</p>
              <p className="text-xs text-dark-400 truncate">{user?.role || 'investigator'}</p>
            </div>
          </NavLink>
          <NotificationBell />
        </div>
        
        {user?.subscription_end && (
          <div className="mb-3 p-2 bg-dark-700/50 rounded-lg">
            <SubscriptionBadge subscriptionEnd={user.subscription_end} />
          </div>
        )}
        
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-dark-400 hover:text-white transition-colors w-full"
        >
          <LogOut size={16} />
          <span className="text-sm">Logout</span>
        </button>
      </div>

      <CreateTicketModal
        isOpen={isCreateTicketOpen}
        onClose={() => setIsCreateTicketOpen(false)}
        onSuccess={fetchUnreadTickets}
      />
    </aside>
  );
};

export default Sidebar;
