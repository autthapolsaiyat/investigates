/**
 * Cases Page
 * Case listing with CRUD operations
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter,
  
  Eye,
  Edit,
  Trash2,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Button, Input, Card, Badge } from '../../components/ui';
import { casesAPI } from '../../services/api';
import type { Case, CaseListParams } from '../../services/api';

const STATUS_COLORS: Record<string, string> = {
  draft: 'gray',
  open: 'blue',
  in_progress: 'yellow',
  pending_review: 'purple',
  closed: 'green',
  archived: 'gray',
};

const PRIORITY_COLORS: Record<string, string> = {
  low: 'green',
  medium: 'yellow',
  high: 'orange',
  critical: 'red',
};

const TYPE_LABELS: Record<string, string> = {
  online_gambling: 'Online Gambling',
  money_laundering: 'Money Laundering',
  fraud: 'Fraud',
  call_center_scam: 'Call Center Scam',
  romance_scam: 'Romance Scam',
  investment_scam: 'Investment Scam',
  other: 'Other',
};

export default function Cases() {
  const navigate = useNavigate();
  const [cases, setCases] = useState<Case[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    pages: 1,
  });

  useEffect(() => {
    loadCases();
  }, [pagination.page, statusFilter]);

  const loadCases = async () => {
    try {
      setIsLoading(true);
      const params: CaseListParams = {
        page: pagination.page,
        page_size: pagination.pageSize,
      };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;

      const data = await casesAPI.list(params);
      setCases(data.items);
      setPagination((prev) => ({
        ...prev,
        total: data.total,
        pages: data.pages,
      }));
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load cases');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    loadCases();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this case?')) return;
    
    try {
      await casesAPI.delete(id);
      loadCases();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to delete case');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Cases</h1>
          <p className="text-gray-400 mt-1">Manage investigation cases</p>
        </div>
        <Button onClick={() => navigate('/cases/new')}>
          <Plus className="w-4 h-4 mr-2" />
          New Case
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search cases..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="pending_review">Pending Review</option>
            <option value="closed">Closed</option>
          </select>
          <Button type="submit" variant="secondary">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </form>
      </Card>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Loading */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
        </div>
      ) : cases.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-gray-400">No cases found</p>
          <Button onClick={() => navigate('/cases/new')} className="mt-4">
            <Plus className="w-4 h-4 mr-2" />
            Create First Case
          </Button>
        </Card>
      ) : (
        <>
          {/* Cases Table */}
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-dark-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Case
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-700">
                  {cases.map((case_) => (
                    <tr key={case_.id} className="hover:bg-dark-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-white font-medium">{case_.title}</p>
                          <p className="text-gray-500 text-sm">{case_.case_number}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-300">
                          {TYPE_LABELS[case_.case_type] || case_.case_type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Badge color={STATUS_COLORS[case_.status] || 'gray'}>
                          {case_.status.replace(/_/g, ' ')}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge color={PRIORITY_COLORS[case_.priority] || 'gray'}>
                          {case_.priority}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-white">
                        {formatCurrency(case_.total_amount)}
                      </td>
                      <td className="px-6 py-4 text-gray-400">
                        {formatDate(case_.created_at)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => navigate(`/cases/${case_.id}`)}
                            className="p-2 text-gray-400 hover:text-white hover:bg-dark-700 rounded-lg transition-colors"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => navigate(`/cases/${case_.id}/edit`)}
                            className="p-2 text-gray-400 hover:text-white hover:bg-dark-700 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(case_.id)}
                            className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-gray-400 text-sm">
                Showing {(pagination.page - 1) * pagination.pageSize + 1} to{' '}
                {Math.min(pagination.page * pagination.pageSize, pagination.total)} of{' '}
                {pagination.total} cases
              </p>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                  disabled={pagination.page <= 1}
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                  disabled={pagination.page >= pagination.pages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export { Cases as CasesPage };
