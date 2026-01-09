/**
 * Organizations Page - Complete CRUD
 */
import { useEffect, useState } from 'react';
import { 
  Plus, Search, Building2, Users, Briefcase, Edit, Trash2, 
  Loader2, AlertCircle, CheckCircle, XCircle, X
} from 'lucide-react';
import { Button, Input, Card, Badge } from '../../components/ui';
import { organizationsAPI } from '../../services/api';
import type { Organization } from '../../services/api';

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
      <div className="relative bg-dark-800 rounded-xl p-6 w-full max-w-md mx-4 border border-dark-700">
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

export const Organizations = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [formData, setFormData] = useState({ name: '', code: '', description: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await organizationsAPI.list({ page: 1, page_size: 50 });
      setOrganizations(response.items);
    } catch (err) {
      console.error('Failed to fetch organizations:', err);
      setError('Failed to load organizations');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      setSaving(true);
      await organizationsAPI.create(formData);
      setShowCreateModal(false);
      setFormData({ name: '', code: '', description: '' });
      fetchOrganizations();
    } catch (err) {
      console.error('Failed to create organization:', err);
      alert('Failed to create organization');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedOrg) return;
    try {
      setSaving(true);
      await organizationsAPI.update(selectedOrg.id, formData);
      setShowEditModal(false);
      setSelectedOrg(null);
      setFormData({ name: '', code: '', description: '' });
      fetchOrganizations();
    } catch (err) {
      console.error('Failed to update organization:', err);
      alert('Failed to update organization');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedOrg) return;
    try {
      setSaving(true);
      await organizationsAPI.delete(selectedOrg.id);
      setShowDeleteModal(false);
      setSelectedOrg(null);
      fetchOrganizations();
    } catch (err) {
      console.error('Failed to delete organization:', err);
      alert('Failed to delete organization');
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (org: Organization) => {
    setSelectedOrg(org);
    setFormData({ name: org.name, code: org.code, description: org.description || '' });
    setShowEditModal(true);
  };

  const openDeleteModal = (org: Organization) => {
    setSelectedOrg(org);
    setShowDeleteModal(true);
  };

  const filteredOrganizations = organizations.filter(org =>
    org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    org.code.toLowerCase().includes(searchQuery.toLowerCase())
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
          <h1 className="text-2xl font-bold">Organizations</h1>
          <p className="text-dark-400 mt-1">Manage organizations in the system</p>
        </div>
        <Button onClick={() => { setFormData({ name: '', code: '', description: '' }); setShowCreateModal(true); }}>
          <Plus size={20} className="mr-2" />
          New Organization
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" size={20} />
          <Input
            placeholder="Search organizations..."
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

      {/* Organizations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredOrganizations.map((org) => (
          <Card key={org.id} className="p-5 hover:border-primary-500/50 transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary-500/20 rounded-lg flex items-center justify-center">
                  <Building2 className="text-primary-500" size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{org.name}</h3>
                  <p className="text-dark-400 text-sm">{org.code}</p>
                </div>
              </div>
              <Badge variant={org.is_active ? 'success' : 'danger'}>
                {org.is_active ? (
                  <><CheckCircle size={12} className="mr-1" /> Active</>
                ) : (
                  <><XCircle size={12} className="mr-1" /> Inactive</>
                )}
              </Badge>
            </div>

            {org.description && (
              <p className="text-dark-400 text-sm mb-4 line-clamp-2">{org.description}</p>
            )}

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="flex items-center gap-2 text-sm">
                <Users size={16} className="text-dark-400" />
                <span>{org.users_count || 0} Users</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Briefcase size={16} className="text-dark-400" />
                <span>{org.cases_count || 0} Cases</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-4 border-t border-dark-700">
              <Button variant="ghost" size="sm" className="flex-1" onClick={() => openEditModal(org)}>
                <Edit size={16} className="mr-1" />
                Edit
              </Button>
              <Button variant="ghost" size="sm" className="flex-1 text-red-400 hover:text-red-300" onClick={() => openDeleteModal(org)}>
                <Trash2 size={16} className="mr-1" />
                Delete
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredOrganizations.length === 0 && !loading && !error && (
        <div className="text-center py-12">
          <Building2 className="w-12 h-12 text-dark-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No organizations found</h3>
          <p className="text-dark-400 mb-4">
            {searchQuery ? 'Try a different search term' : 'Create your first organization to get started'}
          </p>
        </div>
      )}

      {/* Create Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="New Organization">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Organization name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Code</label>
            <Input
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '') })}
              placeholder="ORG_CODE"
            />
            <p className="text-xs text-dark-400 mt-1">Uppercase letters, numbers, and underscores only</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <Input
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional description"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button variant="ghost" className="flex-1" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button className="flex-1" onClick={handleCreate} disabled={saving || !formData.name || !formData.code}>
              {saving ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
              Create
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Organization">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Organization name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Code</label>
            <Input
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '') })}
              placeholder="ORG_CODE"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <Input
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional description"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button variant="ghost" className="flex-1" onClick={() => setShowEditModal(false)}>Cancel</Button>
            <Button className="flex-1" onClick={handleEdit} disabled={saving || !formData.name || !formData.code}>
              {saving ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Organization">
        <div className="space-y-4">
          <p className="text-dark-300">
            Are you sure you want to delete <strong>{selectedOrg?.name}</strong>? This action cannot be undone.
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

export { Organizations as OrganizationsPage };
export default Organizations;
