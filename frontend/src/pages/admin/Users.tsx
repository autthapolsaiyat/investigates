/**
 * Users Page - Complete CRUD
 */
import { useEffect, useState } from 'react';
import { 
  Plus, Search, User, Mail, Shield, Edit, Trash2, 
  Loader2, AlertCircle, CheckCircle, XCircle, Clock, X
} from 'lucide-react';
import { Button, Input, Card, Badge } from '../../components/ui';
import { usersAPI, organizationsAPI } from '../../services/api';
import type { User as UserType, Organization } from '../../services/api';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title: string;
}

const Modal = ({ isOpen, onClose, children, title }: ModalProps) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-dark-800 rounded-xl p-6 w-full max-w-md mx-4 border border-dark-700 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button onClick={onClose} className="text-dark-400 hover:text-white">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

const getRoleBadgeVariant = (role: string): 'danger' | 'warning' | 'info' | 'default' => {
  switch (role) {
    case 'super_admin': return 'danger';
    case 'admin': return 'warning';
    case 'investigator': return 'info';
    default: return 'default';
  }
};

const getRoleLabel = (role: string) => {
  switch (role) {
    case 'super_admin': return 'Super Admin';
    case 'admin': return 'Admin';
    case 'investigator': return 'Investigator';
    case 'viewer': return 'Viewer';
    default: return role;
  }
};

const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return 'Never';
  return new Date(dateString).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const Users = () => {
  const [users, setUsers] = useState<UserType[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone: '',
    role: 'viewer',
    organization_id: 0,
    is_active: true
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [usersRes, orgsRes] = await Promise.all([
        usersAPI.list({ page: 1, page_size: 50 }),
        organizationsAPI.list({ page: 1, page_size: 50 })
      ]);
      setUsers(usersRes.items);
      setOrganizations(orgsRes.items);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      setSaving(true);
      await usersAPI.create({
        ...formData,
        organization_id: formData.organization_id || undefined
      });
      setShowCreateModal(false);
      resetForm();
      fetchData();
    } catch (err) {
      console.error('Failed to create user:', err);
      alert('Failed to create user');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedUser) return;
    try {
      setSaving(true);
      const updateData: Record<string, unknown> = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone || undefined,
        role: formData.role,
        is_active: formData.is_active
      };
      if (formData.organization_id) {
        updateData.organization_id = formData.organization_id;
      }
      await usersAPI.update(selectedUser.id, updateData);
      setShowEditModal(false);
      setSelectedUser(null);
      resetForm();
      fetchData();
    } catch (err) {
      console.error('Failed to update user:', err);
      alert('Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    try {
      setSaving(true);
      await usersAPI.delete(selectedUser.id);
      setShowDeleteModal(false);
      setSelectedUser(null);
      fetchData();
    } catch (err) {
      console.error('Failed to delete user:', err);
      alert('Failed to delete user');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      first_name: '',
      last_name: '',
      phone: '',
      role: 'viewer',
      organization_id: organizations[0]?.id || 0,
      is_active: true
    });
  };

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const openEditModal = (user: UserType) => {
    setSelectedUser(user);
    setFormData({
      email: user.email,
      password: '',
      first_name: user.first_name,
      last_name: user.last_name,
      phone: user.phone || '',
      role: user.role,
      organization_id: user.organization_id || 0,
      is_active: user.is_active
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (user: UserType) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.last_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        <Button onClick={openCreateModal}>
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
                        <p className="font-medium">{user.first_name} {user.last_name}</p>
                        {user.phone && <p className="text-sm text-dark-400">{user.phone}</p>}
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
                      {formatDate(user.last_login_at)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openEditModal(user)}>
                        <Edit size={16} />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300" onClick={() => openDeleteModal(user)}>
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
        </div>
      )}

      {/* Create Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="New User">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">First Name</label>
              <Input
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                placeholder="First name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Last Name</label>
              <Input
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                placeholder="Last name"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="user@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <Input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Phone</label>
            <Input
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="Optional"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Role</label>
            <select
              className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            >
              <option value="viewer">Viewer</option>
              <option value="investigator">Investigator</option>
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Organization</label>
            <select
              className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white"
              value={formData.organization_id}
              onChange={(e) => setFormData({ ...formData, organization_id: Number(e.target.value) })}
            >
              <option value={0}>Select organization</option>
              {organizations.map(org => (
                <option key={org.id} value={org.id}>{org.name}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-4">
            <Button variant="ghost" className="flex-1" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button className="flex-1" onClick={handleCreate} disabled={saving || !formData.email || !formData.password}>
              {saving ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
              Create
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit User">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">First Name</label>
              <Input
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Last Name</label>
              <Input
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <Input value={formData.email} disabled className="opacity-50" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Phone</label>
            <Input
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Role</label>
            <select
              className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            >
              <option value="viewer">Viewer</option>
              <option value="investigator">Investigator</option>
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="rounded"
            />
            <label htmlFor="is_active" className="text-sm">Active</label>
          </div>
          <div className="flex gap-3 pt-4">
            <Button variant="ghost" className="flex-1" onClick={() => setShowEditModal(false)}>Cancel</Button>
            <Button className="flex-1" onClick={handleEdit} disabled={saving}>
              {saving ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete User">
        <div className="space-y-4">
          <p className="text-dark-300">
            Are you sure you want to delete <strong>{selectedUser?.first_name} {selectedUser?.last_name}</strong>? This action cannot be undone.
          </p>
          <div className="flex gap-3 pt-4">
            <Button variant="ghost" className="flex-1" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
            <Button variant="danger" className="flex-1" onClick={handleDelete} disabled={saving}>
              {saving ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export { Users as UsersPage };
export default Users;
