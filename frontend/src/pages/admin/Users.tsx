/**
 * Users Page
 * Admin panel for managing users
 */
import { useEffect, useState } from 'react';
import { 
  Plus, 
  Search, 
  User,
  Mail,
  Shield,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { Button, Input, Card, Badge } from '../../components/ui';
import { usersAPI } from '../../services/api';
import type { User as UserType } from '../../services/api';

const getRoleBadgeVariant = (role: string) => {
  switch (role) {
    case 'super_admin':
      return 'danger';
    case 'admin':
      return 'warning';
    case 'investigator':
      return 'info';
    default:
      return 'default';
  }
};

const getRoleLabel = (role: string) => {
  switch (role) {
    case 'super_admin':
      return 'Super Admin';
    case 'admin':
      return 'Admin';
    case 'investigator':
      return 'Investigator';
    case 'viewer':
      return 'Viewer';
    default:
      return role;
  }
};

export const Users = () => {
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await usersAPI.list({ page: 1, page_size: 50 });
      setUsers(response.items);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.last_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-dark-400 mt-1">Manage users in the system</p>
        </div>
        <Button onClick={() => alert('Create user coming soon!')}>
          <Plus size={20} className="mr-2" />
          New User
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" size={20} />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-center gap-3 text-red-400">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Users Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-dark-800 border-b border-dark-700">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-medium text-dark-300">USER</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-dark-300">EMAIL</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-dark-300">ROLE</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-dark-300">STATUS</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-dark-300">LAST LOGIN</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-dark-300">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-dark-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-500/20 rounded-full flex items-center justify-center">
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt="" className="w-10 h-10 rounded-full" />
                        ) : (
                          <span className="text-primary-500 font-medium">
                            {user.first_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="font-medium">
                          {user.first_name} {user.last_name}
                        </p>
                        {user.phone && (
                          <p className="text-sm text-dark-400">{user.phone}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-dark-300">
                      <Mail size={16} className="text-dark-400" />
                      {user.email}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={getRoleBadgeVariant(user.role)}>
                      <Shield size={12} className="mr-1" />
                      {getRoleLabel(user.role)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={user.is_active ? 'success' : 'danger'}>
                      {user.is_active ? (
                        <><CheckCircle size={12} className="mr-1" /> Active</>
                      ) : (
                        <><XCircle size={12} className="mr-1" /> Inactive</>
                      )}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-dark-400">
                      <Clock size={14} />
                      {formatDate(user.last_login_at || null)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => alert('Edit coming soon!')}>
                        <Edit size={16} />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300" onClick={() => alert('Delete coming soon!')}>
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Empty State */}
      {filteredUsers.length === 0 && !loading && !error && (
        <div className="text-center py-12">
          <User className="w-12 h-12 text-dark-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No users found</h3>
          <p className="text-dark-400 mb-4">
            {searchQuery ? 'Try a different search term' : 'Create your first user to get started'}
          </p>
          {!searchQuery && (
            <Button onClick={() => alert('Create user coming soon!')}>
              <Plus size={20} className="mr-2" />
              Create First User
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export { Users as UsersPage };
export default Users;
