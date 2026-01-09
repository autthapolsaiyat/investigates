/**
 * Sidebar Component
 * Navigation sidebar with Forensic Report menu
 */
import { Upload, FileText, NavLink, useNavigate } from 'react-router-dom';
import { Upload, FileText, 
  LayoutDashboard, 
  Briefcase, 
  DollarSign, 
  Phone, 
  Bitcoin,
  Building2,
  Users,
  Settings,
  LogOut,
  Search,
  FileText
} from 'lucide-react';
import { Upload, FileText, useAuthStore } from '../../store/authStore';

const mainNavItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/cases', icon: Briefcase, label: 'Cases' },
  { to: '/money-flow', icon: DollarSign, label: 'Money Flow' },
  { to: '/forensic-report', icon: FileText, label: 'Forensic Report' },
  { to: '/call-analysis', icon: Phone, label: 'Call Analysis' },
  { to: '/crypto', icon: Bitcoin, label: 'Crypto' },
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
    <aside className="w-56 bg-dark-800 border-r border-dark-700 flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-dark-700">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary-500 rounded-lg flex items-center justify-center">
            <Search size={20} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-white">InvestiGate</h1>
            <p className="text-xs text-dark-400">Investigation Platform</p>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {mainNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-primary-500/20 text-primary-400 font-medium'
                  : 'text-dark-300 hover:text-white hover:bg-dark-700'
              }`
            }
          >
            <item.icon size={18} />
            <span>{item.label}</span>
          </NavLink>
        ))}

        {/* Admin Section */}
        <div className="pt-4 mt-4 border-t border-dark-700">
          <p className="px-3 text-xs font-medium text-dark-500 uppercase tracking-wider mb-2">
            Admin
          </p>
          {adminNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-primary-500/20 text-primary-400 font-medium'
                    : 'text-dark-300 hover:text-white hover:bg-dark-700'
                }`
              }
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* User Section */}
      <div className="p-3 border-t border-dark-700">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-9 h-9 bg-primary-500/20 rounded-full flex items-center justify-center">
            <span className="text-primary-500 font-medium text-sm">
              {user?.first_name?.charAt(0) || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {`${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'User'}
            </p>
            <p className="text-xs text-dark-400 truncate">{user?.role || 'user'}</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-dark-400 hover:text-red-400 transition-colors"
            title="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
