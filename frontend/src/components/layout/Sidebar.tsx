import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FolderOpen, DollarSign, Phone, Bitcoin, Building2, Users, Settings, LogOut, Search } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { clsx } from 'clsx';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: FolderOpen, label: 'Cases', path: '/cases' },
  { icon: DollarSign, label: 'Money Flow', path: '/money-flow' },
  { icon: Phone, label: 'Call Analysis', path: '/call-analysis' },
  { icon: Bitcoin, label: 'Crypto', path: '/crypto' },
];

const adminItems = [
  { icon: Building2, label: 'Organizations', path: '/admin/organizations' },
  { icon: Users, label: 'Users', path: '/admin/users' },
  { icon: Settings, label: 'Settings', path: '/admin/settings' },
];

export const Sidebar = () => {
  const { user, logout } = useAuthStore();
  const isAdmin = user?.role === 'super_admin' || user?.role === 'org_admin';

  return (
    <aside className="w-64 h-screen bg-dark-900 border-r border-dark-800 flex flex-col">
      <div className="h-16 flex items-center gap-3 px-4 border-b border-dark-800">
        <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
          <Search className="w-5 h-5 text-white" />
        </div>
        <div>
          <span className="font-bold text-lg">InvestiGate</span>
          <p className="text-xs text-dark-500">Investigation Platform</p>
        </div>
      </div>

      <nav className="flex-1 py-4 overflow-y-auto">
        <div className="px-3 space-y-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all',
                isActive ? 'bg-primary-600/20 text-primary-400' : 'text-dark-400 hover:bg-dark-800 hover:text-dark-100'
              )}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>

        {isAdmin && (
          <>
            <div className="my-4 mx-3 border-t border-dark-800" />
            <div className="px-4 mb-2">
              <span className="text-xs font-medium text-dark-500 uppercase">Admin</span>
            </div>
            <div className="px-3 space-y-1">
              {adminItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => clsx(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all',
                    isActive ? 'bg-primary-600/20 text-primary-400' : 'text-dark-400 hover:bg-dark-800 hover:text-dark-100'
                  )}
                >
                  <item.icon size={20} />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          </>
        )}
      </nav>

      <div className="p-3 border-t border-dark-800">
        <div className="flex items-center gap-3 p-2 rounded-lg bg-dark-800">
          <div className="w-9 h-9 bg-primary-600 rounded-full flex items-center justify-center text-white font-medium">
            {user?.first_name?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{`${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'User'}</p>
            <p className="text-xs text-dark-500 truncate">{user?.role || 'viewer'}</p>
          </div>
          <button onClick={logout} className="p-1.5 hover:bg-dark-700 rounded-lg text-dark-400 hover:text-red-400">
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
};
