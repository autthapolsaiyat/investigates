/**
 * Sidebar Component
 * Navigation sidebar organized by workflow
 */
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Briefcase, 
  DollarSign, 
  Phone, 
  Wallet,
  Building2,
  Users,
  Settings,
  LogOut,
  Search,
  FileText,
  Upload,
  FileCheck,
  MapPin,
  FileSearch,
  Link2,
  Sparkles
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

// จัดเรียงตาม Flow: สร้างคดี → นำเข้าข้อมูล → วิเคราะห์ → ขอข้อมูลเพิ่ม → สรุปผล → รายงาน

const navSections = [
  {
    title: 'OVERVIEW',
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    ]
  },
  {
    title: 'CASE',
    items: [
      { to: '/cases', icon: Briefcase, label: 'Cases' },
    ]
  },
  {
    title: 'INPUT',
    items: [
      { to: '/import', icon: Upload, label: 'นำเข้าข้อมูล' },
      { to: '/smart-import', icon: Sparkles, label: 'Smart Import' },
    ]
  },
  {
    title: 'ANALYSIS',
    items: [
      { to: '/money-flow', icon: DollarSign, label: 'Money Flow' },
      { to: '/crypto', icon: Wallet, label: 'Crypto Tracker' },
      { to: '/call-analysis', icon: Phone, label: 'Call Analysis' },
      { to: '/location-timeline', icon: MapPin, label: 'Location Timeline' },
    ]
  },
  {
    title: 'INVESTIGATE',
    items: [
      { to: '/kyc-request', icon: FileSearch, label: 'KYC Request' },
    ]
  },
  {
    title: 'REPORTS',
    items: [
      { to: '/forensic-report', icon: FileText, label: 'Forensic Report' },
      { to: '/report', icon: FileCheck, label: 'รายงานศาล' },
    ]
  },
  {
    title: 'DEMO',
    items: [
      { to: '/silk-road-demo', icon: Link2, label: 'Silk Road Demo' },
    ]
  },
];

const adminNavItems = [
  { to: '/admin/organizations', icon: Building2, label: 'Organizations' },
  { to: '/admin/users', icon: Users, label: 'Users' },
  { to: '/admin/settings', icon: Settings, label: 'Settings' },
];

export const Sidebar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="w-64 bg-dark-800 border-r border-dark-700 flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-dark-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center">
            <Search className="text-white" size={20} />
          </div>
          <div>
            <h1 className="font-bold text-white">InvestiGate</h1>
            <p className="text-xs text-dark-400">Investigation Platform</p>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navSections.map((section, sectionIndex) => (
          <div key={section.title} className={sectionIndex > 0 ? 'mt-4' : ''}>
            <p className="text-xs text-dark-500 uppercase tracking-wider mb-2 px-3">
              {section.title}
            </p>
            {section.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary-500/20 text-primary-400'
                      : 'text-dark-300 hover:bg-dark-700 hover:text-white'
                  }`
                }
              >
                <item.icon size={18} />
                <span className="text-sm">{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}

        {/* Admin Section */}
        <div className="mt-4">
          <p className="text-xs text-dark-500 uppercase tracking-wider mb-2 px-3">Admin</p>
          {adminNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary-500/20 text-primary-400'
                    : 'text-dark-300 hover:bg-dark-700 hover:text-white'
                }`
              }
            >
              <item.icon size={18} />
              <span className="text-sm">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

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
    </aside>
  );
};

export default Sidebar;
