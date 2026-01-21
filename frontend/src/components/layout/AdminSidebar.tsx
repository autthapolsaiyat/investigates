/**
 * Admin Sidebar Component
 * Navigation sidebar for Admin Panel
 */
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard,
  UserPlus,
  Building2,
  Users,
  Settings,
  LogOut,
  ArrowLeft,
  Shield,
  Activity,
  CreditCard,
  FileText,
  Bell,
  Trash2,
  Bug,
  Map,
  Key
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

const adminNavSections = [
  {
    title: 'OVERVIEW',
    items: [
      { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
      { to: '/admin/activity', icon: Activity, label: 'Activity Log' },
      { to: '/admin/login-map', icon: Map, label: 'Login Map' },
    ]
  },
  {
    title: 'USER MANAGEMENT',
    items: [
      { to: '/admin/registrations', icon: UserPlus, label: 'Registrations' },
      { to: '/admin/users', icon: Users, label: 'Users' },
      { to: '/admin/subscriptions', icon: CreditCard, label: 'Subscriptions' },
      { to: '/admin/licenses', icon: Key, label: 'License Keys' },
    ]
  },
  {
    title: 'ORGANIZATION',
    items: [
      { to: '/admin/organizations', icon: Building2, label: 'Organizations' },
    ]
  },
  {
    title: 'DATA MANAGEMENT',
    items: [
      { to: '/admin/deleted-cases', icon: Trash2, label: 'Deleted Cases' },
    ]
  },
  {
    title: 'SUPPORT',
    items: [
      { to: '/admin/support-tickets', icon: Bug, label: 'Support Tickets' },
    ]
  },
  {
    title: 'SYSTEM',
    items: [
      { to: '/admin/notifications', icon: Bell, label: 'Notifications' },
      { to: '/admin/reports', icon: FileText, label: 'System Reports' },
      { to: '/admin/settings', icon: Settings, label: 'Settings' },
    ]
  },
];

export const AdminSidebar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleBackToApp = () => {
    navigate('/app/dashboard');
  };

  return (
    <aside className="w-64 bg-dark-800 border-r border-dark-700 flex flex-col">
      {/* Logo & Title */}
      <div className="p-4 border-b border-dark-700">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Admin Panel</h1>
            <p className="text-xs text-dark-400">ระบบจัดการ</p>
          </div>
        </div>
        
        {/* Back to App Button */}
        <button
          onClick={handleBackToApp}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-dark-300 hover:text-white hover:bg-dark-700 rounded-lg transition-colors"
        >
          <ArrowLeft size={16} />
          <span>กลับไปหน้าแอป</span>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {adminNavSections.map((section, sectionIndex) => (
          <div key={section.title} className={sectionIndex > 0 ? 'mt-6' : ''}>
            <p className="text-xs text-dark-500 uppercase tracking-wider mb-2 px-3">
              {section.title}
            </p>
            {section.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-red-500/20 text-red-400'
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
      </nav>

      {/* User Info */}
      <div className="p-4 border-t border-dark-700">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
            {user?.email?.charAt(0).toUpperCase() || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.email || 'Admin'}</p>
            <p className="text-xs text-red-400 truncate capitalize">{user?.role?.replace('_', ' ') || 'Super Admin'}</p>
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

export default AdminSidebar;
