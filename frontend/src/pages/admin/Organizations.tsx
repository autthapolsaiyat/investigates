/**
 * Organizations Page
 * Admin panel for managing organizations
 */
import { useEffect, useState } from 'react';
import { 
  Plus, 
  Search, 
  Building2,
  Users,
  Briefcase,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Button, Input, Card, Badge } from '../../components/ui';
import { organizationsAPI } from '../../services/api';
import type { Organization } from '../../services/api';

export const Organizations = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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
        <Button onClick={() => alert('Create organization coming soon!')}>
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
              <Button variant="ghost" size="sm" className="flex-1" onClick={() => alert('Edit coming soon!')}>
                <Edit size={16} className="mr-1" />
                Edit
              </Button>
              <Button variant="ghost" size="sm" className="flex-1 text-red-400 hover:text-red-300" onClick={() => alert('Delete coming soon!')}>
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
          {!searchQuery && (
            <Button onClick={() => alert('Create organization coming soon!')}>
              <Plus size={20} className="mr-2" />
              Create First Organization
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export { Organizations as OrganizationsPage };
export default Organizations;
