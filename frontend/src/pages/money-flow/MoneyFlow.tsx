/**
 * Money Flow Page - Connected to API
 * Interactive graph visualization for money flow analysis
 */
import { useEffect, useState, useCallback } from 'react';
import { 
  Filter, Download, RefreshCw, Plus, Loader2, AlertCircle,
  Trash2, X, DollarSign, User, Building, Wallet
} from 'lucide-react';
import { Button, Input, Card, Badge } from '../../components/ui';
import { moneyFlowAPI, casesAPI } from '../../services/api';
import type { Case } from '../../services/api';

interface MoneyFlowNode {
  id: number;
  case_id: number;
  node_type: string;
  label: string;
  identifier?: string;
  bank_name?: string;
  account_name?: string;
  phone_number?: string;
  id_card?: string;
  blockchain?: string;
  wallet_address?: string;
  risk_score: number;
  is_suspect: boolean;
  is_victim: boolean;
  x_position: number;
  y_position: number;
  color?: string;
  size: number;
  notes?: string;
  source?: string;
}

interface MoneyFlowEdge {
  id: number;
  case_id: number;
  from_node_id: number;
  to_node_id: number;
  amount?: number;
  currency: string;
  transaction_date?: string;
  transaction_ref?: string;
  label?: string;
  edge_type?: string;
  color?: string;
  width: number;
  notes?: string;
}

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
      <div className="relative bg-dark-800 rounded-xl p-6 w-full max-w-lg mx-4 border border-dark-700 max-h-[90vh] overflow-y-auto">
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

const nodeTypeIcons: Record<string, React.ReactNode> = {
  bank_account: <Building size={16} />,
  person: <User size={16} />,
  crypto_wallet: <Wallet size={16} />,
  exchange: <DollarSign size={16} />,
};

const nodeTypeColors: Record<string, string> = {
  bank_account: '#3B82F6',
  person: '#10B981',
  crypto_wallet: '#F59E0B',
  exchange: '#8B5CF6',
  suspect: '#EF4444',
  victim: '#22C55E',
  mule: '#F97316',
};

export const MoneyFlow = () => {
  const [cases, setCases] = useState<Case[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<number | null>(null);
  const [nodes, setNodes] = useState<MoneyFlowNode[]>([]);
  const [edges, setEdges] = useState<MoneyFlowEdge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddNodeModal, setShowAddNodeModal] = useState(false);
  const [showAddEdgeModal, setShowAddEdgeModal] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [nodeForm, setNodeForm] = useState({
    node_type: 'bank_account',
    label: '',
    identifier: '',
    bank_name: '',
    account_name: '',
    phone_number: '',
    is_suspect: false,
    is_victim: false,
    notes: ''
  });

  const [edgeForm, setEdgeForm] = useState({
    from_node_id: 0,
    to_node_id: 0,
    amount: '',
    currency: 'THB',
    transaction_ref: '',
    label: '',
    notes: ''
  });

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    try {
      const response = await casesAPI.list({ page: 1, page_size: 100 });
      setCases(response.items);
      if (response.items.length > 0) {
        setSelectedCaseId(response.items[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch cases:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMoneyFlow = useCallback(async () => {
    if (!selectedCaseId) return;
    try {
      setLoading(true);
      setError(null);
      const [nodesRes, edgesRes] = await Promise.all([
        moneyFlowAPI.getNodes(selectedCaseId),
        moneyFlowAPI.getEdges(selectedCaseId)
      ]);
      setNodes(nodesRes);
      setEdges(edgesRes);
    } catch (err) {
      console.error('Failed to fetch money flow:', err);
      setError('Failed to load money flow data');
    } finally {
      setLoading(false);
    }
  }, [selectedCaseId]);

  useEffect(() => {
    if (selectedCaseId) {
      fetchMoneyFlow();
    }
  }, [selectedCaseId, fetchMoneyFlow]);

  const handleAddNode = async () => {
    if (!selectedCaseId) return;
    try {
      setSaving(true);
      await moneyFlowAPI.createNode(selectedCaseId, {
        ...nodeForm,
        x_position: Math.random() * 600 + 100,
        y_position: Math.random() * 400 + 100,
        risk_score: nodeForm.is_suspect ? 80 : 0,
        size: 40
      });
      setShowAddNodeModal(false);
      setNodeForm({
        node_type: 'bank_account',
        label: '',
        identifier: '',
        bank_name: '',
        account_name: '',
        phone_number: '',
        is_suspect: false,
        is_victim: false,
        notes: ''
      });
      fetchMoneyFlow();
    } catch (err) {
      console.error('Failed to add node:', err);
      alert('Failed to add node');
    } finally {
      setSaving(false);
    }
  };

  const handleAddEdge = async () => {
    if (!selectedCaseId) return;
    try {
      setSaving(true);
      await moneyFlowAPI.createEdge(selectedCaseId, {
        ...edgeForm,
        from_node_id: Number(edgeForm.from_node_id),
        to_node_id: Number(edgeForm.to_node_id),
        amount: edgeForm.amount ? Number(edgeForm.amount) : undefined,
        width: 2
      });
      setShowAddEdgeModal(false);
      setEdgeForm({
        from_node_id: 0,
        to_node_id: 0,
        amount: '',
        currency: 'THB',
        transaction_ref: '',
        label: '',
        notes: ''
      });
      fetchMoneyFlow();
    } catch (err) {
      console.error('Failed to add edge:', err);
      alert('Failed to add edge');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNode = async (nodeId: number) => {
    if (!selectedCaseId || !confirm('Delete this node?')) return;
    try {
      await moneyFlowAPI.deleteNode(selectedCaseId, nodeId);
      fetchMoneyFlow();
    } catch (err) {
      console.error('Failed to delete node:', err);
      alert('Failed to delete node');
    }
  };

  const getNodeColor = (node: MoneyFlowNode) => {
    if (node.is_suspect) return nodeTypeColors.suspect;
    if (node.is_victim) return nodeTypeColors.victim;
    return nodeTypeColors[node.node_type] || '#6B7280';
  };

  const formatAmount = (amount?: number, currency = 'THB') => {
    if (!amount) return '';
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  if (loading && cases.length === 0) {
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
          <h1 className="text-2xl font-bold">Money Flow</h1>
          <p className="text-dark-400 mt-1">วิเคราะห์เส้นทางการเงิน</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={fetchMoneyFlow}>
            <RefreshCw size={20} className="mr-2" />
            Refresh
          </Button>
          <Button variant="ghost">
            <Filter size={20} className="mr-2" />
            Filter
          </Button>
          <Button variant="ghost">
            <Download size={20} className="mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Case Selector */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium">Select Case:</label>
        <select
          className="bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white min-w-[300px]"
          value={selectedCaseId || ''}
          onChange={(e) => setSelectedCaseId(Number(e.target.value))}
        >
          {cases.map(c => (
            <option key={c.id} value={c.id}>{c.case_number} - {c.title}</option>
          ))}
        </select>
        <Button onClick={() => setShowAddNodeModal(true)}>
          <Plus size={20} className="mr-2" />
          Add Node
        </Button>
        <Button variant="secondary" onClick={() => setShowAddEdgeModal(true)} disabled={nodes.length < 2}>
          <Plus size={20} className="mr-2" />
          Add Edge
        </Button>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-center gap-3 text-red-400">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Graph Area */}
      <Card className="relative min-h-[500px] overflow-hidden">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          </div>
        ) : nodes.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2">Money Flow Graph</h3>
              <p className="text-dark-400 mb-4">No nodes yet. Add nodes to start building the flow.</p>
              <Button onClick={() => setShowAddNodeModal(true)}>
                <Plus size={20} className="mr-2" />
                Add First Node
              </Button>
            </div>
          </div>
        ) : (
          <svg className="w-full h-full min-h-[500px]" viewBox="0 0 800 500">
            {/* Edges */}
            {edges.map(edge => {
              const fromNode = nodes.find(n => n.id === edge.from_node_id);
              const toNode = nodes.find(n => n.id === edge.to_node_id);
              if (!fromNode || !toNode) return null;
              
              const midX = (fromNode.x_position + toNode.x_position) / 2;
              const midY = (fromNode.y_position + toNode.y_position) / 2;
              
              return (
                <g key={edge.id}>
                  <line
                    x1={fromNode.x_position}
                    y1={fromNode.y_position}
                    x2={toNode.x_position}
                    y2={toNode.y_position}
                    stroke={edge.color || '#4B5563'}
                    strokeWidth={edge.width || 2}
                    markerEnd="url(#arrow)"
                  />
                  {edge.amount && (
                    <text
                      x={midX}
                      y={midY - 10}
                      textAnchor="middle"
                      fill="#9CA3AF"
                      fontSize="12"
                    >
                      {formatAmount(edge.amount, edge.currency)}
                    </text>
                  )}
                </g>
              );
            })}
            
            {/* Arrow marker */}
            <defs>
              <marker
                id="arrow"
                viewBox="0 0 10 10"
                refX="9"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#4B5563" />
              </marker>
            </defs>
            
            {/* Nodes */}
            {nodes.map(node => (
              <g key={node.id} className="cursor-pointer">
                <circle
                  cx={node.x_position}
                  cy={node.y_position}
                  r={node.size / 2}
                  fill={getNodeColor(node)}
                  stroke={node.is_suspect ? '#EF4444' : node.is_victim ? '#22C55E' : 'transparent'}
                  strokeWidth="3"
                />
                <text
                  x={node.x_position}
                  y={node.y_position + node.size / 2 + 15}
                  textAnchor="middle"
                  fill="white"
                  fontSize="12"
                  fontWeight="500"
                >
                  {node.label}
                </text>
                {node.identifier && (
                  <text
                    x={node.x_position}
                    y={node.y_position + node.size / 2 + 30}
                    textAnchor="middle"
                    fill="#9CA3AF"
                    fontSize="10"
                  >
                    {node.identifier}
                  </text>
                )}
              </g>
            ))}
          </svg>
        )}
      </Card>

      {/* Legend */}
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: nodeTypeColors.suspect }} />
          <span>Suspect</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: nodeTypeColors.mule }} />
          <span>Mule</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: nodeTypeColors.victim }} />
          <span>Victim</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: nodeTypeColors.exchange }} />
          <span>Exchange</span>
        </div>
      </div>

      {/* Nodes List */}
      {nodes.length > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold mb-4">Nodes ({nodes.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {nodes.map(node => (
              <div key={node.id} className="flex items-center justify-between p-3 bg-dark-700 rounded-lg">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                    style={{ backgroundColor: getNodeColor(node) }}
                  >
                    {nodeTypeIcons[node.node_type] || <User size={16} />}
                  </div>
                  <div>
                    <p className="font-medium">{node.label}</p>
                    <p className="text-xs text-dark-400">{node.identifier || node.node_type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {node.is_suspect && <Badge variant="danger">Suspect</Badge>}
                  {node.is_victim && <Badge variant="success">Victim</Badge>}
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteNode(node.id)}>
                    <Trash2 size={14} className="text-red-400" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Add Node Modal */}
      <Modal isOpen={showAddNodeModal} onClose={() => setShowAddNodeModal(false)} title="Add Node">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Type</label>
            <select
              className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white"
              value={nodeForm.node_type}
              onChange={(e) => setNodeForm({ ...nodeForm, node_type: e.target.value })}
            >
              <option value="bank_account">Bank Account</option>
              <option value="person">Person</option>
              <option value="crypto_wallet">Crypto Wallet</option>
              <option value="exchange">Exchange</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Label *</label>
            <Input
              value={nodeForm.label}
              onChange={(e) => setNodeForm({ ...nodeForm, label: e.target.value })}
              placeholder="Name or identifier"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Identifier</label>
            <Input
              value={nodeForm.identifier}
              onChange={(e) => setNodeForm({ ...nodeForm, identifier: e.target.value })}
              placeholder="Account number, wallet address, etc."
            />
          </div>
          {nodeForm.node_type === 'bank_account' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Bank Name</label>
                <Input
                  value={nodeForm.bank_name}
                  onChange={(e) => setNodeForm({ ...nodeForm, bank_name: e.target.value })}
                  placeholder="Bank name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Account Name</label>
                <Input
                  value={nodeForm.account_name}
                  onChange={(e) => setNodeForm({ ...nodeForm, account_name: e.target.value })}
                  placeholder="Account holder name"
                />
              </div>
            </>
          )}
          {nodeForm.node_type === 'person' && (
            <div>
              <label className="block text-sm font-medium mb-1">Phone Number</label>
              <Input
                value={nodeForm.phone_number}
                onChange={(e) => setNodeForm({ ...nodeForm, phone_number: e.target.value })}
                placeholder="Phone number"
              />
            </div>
          )}
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={nodeForm.is_suspect}
                onChange={(e) => setNodeForm({ ...nodeForm, is_suspect: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm">Suspect</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={nodeForm.is_victim}
                onChange={(e) => setNodeForm({ ...nodeForm, is_victim: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm">Victim</span>
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <Input
              value={nodeForm.notes}
              onChange={(e) => setNodeForm({ ...nodeForm, notes: e.target.value })}
              placeholder="Optional notes"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button variant="ghost" className="flex-1" onClick={() => setShowAddNodeModal(false)}>Cancel</Button>
            <Button className="flex-1" onClick={handleAddNode} disabled={saving || !nodeForm.label}>
              {saving ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
              Add Node
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Edge Modal */}
      <Modal isOpen={showAddEdgeModal} onClose={() => setShowAddEdgeModal(false)} title="Add Transaction">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">From Node *</label>
            <select
              className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white"
              value={edgeForm.from_node_id}
              onChange={(e) => setEdgeForm({ ...edgeForm, from_node_id: Number(e.target.value) })}
            >
              <option value={0}>Select source</option>
              {nodes.map(n => (
                <option key={n.id} value={n.id}>{n.label} ({n.identifier || n.node_type})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">To Node *</label>
            <select
              className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white"
              value={edgeForm.to_node_id}
              onChange={(e) => setEdgeForm({ ...edgeForm, to_node_id: Number(e.target.value) })}
            >
              <option value={0}>Select target</option>
              {nodes.filter(n => n.id !== edgeForm.from_node_id).map(n => (
                <option key={n.id} value={n.id}>{n.label} ({n.identifier || n.node_type})</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Amount</label>
              <Input
                type="number"
                value={edgeForm.amount}
                onChange={(e) => setEdgeForm({ ...edgeForm, amount: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Currency</label>
              <select
                className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white"
                value={edgeForm.currency}
                onChange={(e) => setEdgeForm({ ...edgeForm, currency: e.target.value })}
              >
                <option value="THB">THB</option>
                <option value="USD">USD</option>
                <option value="BTC">BTC</option>
                <option value="USDT">USDT</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Transaction Reference</label>
            <Input
              value={edgeForm.transaction_ref}
              onChange={(e) => setEdgeForm({ ...edgeForm, transaction_ref: e.target.value })}
              placeholder="Reference number"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Label</label>
            <Input
              value={edgeForm.label}
              onChange={(e) => setEdgeForm({ ...edgeForm, label: e.target.value })}
              placeholder="Transaction description"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <Input
              value={edgeForm.notes}
              onChange={(e) => setEdgeForm({ ...edgeForm, notes: e.target.value })}
              placeholder="Optional notes"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button variant="ghost" className="flex-1" onClick={() => setShowAddEdgeModal(false)}>Cancel</Button>
            <Button 
              className="flex-1" 
              onClick={handleAddEdge} 
              disabled={saving || !edgeForm.from_node_id || !edgeForm.to_node_id}
            >
              {saving ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
              Add Transaction
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export { MoneyFlow as MoneyFlowPage };
export default MoneyFlow;
