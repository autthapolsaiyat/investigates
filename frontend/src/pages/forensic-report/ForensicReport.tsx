/**
 * Forensic Report Page - Court Summary Report
 * Digital Forensic Standard
 */
import { useEffect, useState, useCallback } from 'react';
import { 
  FileText, Download, Printer, Users, 
  TrendingUp, RefreshCw, Loader2, Clock, ChevronRight,
  List, BarChart3
} from 'lucide-react';
import { Button, Card, Badge } from '../../components/ui';
import { casesAPI, moneyFlowAPI } from '../../services/api';
import type { Case, MoneyFlowNode, MoneyFlowEdge } from '../../services/api';

interface Statistics {
  totalNodes: number;
  suspects: number;
  victims: number;
  muleAccounts: number;
  cryptoWallets: number;
  totalTransactions: number;
  totalAmount: number;
}

// Thai labels
const nodeTypeLabels: Record<string, string> = {
  person: 'Person',
  bank_account: 'Bank Account',
  crypto_wallet: 'Crypto Wallet',
  exchange: 'Exchange',
};

export const ForensicReport = () => {
  const [cases, setCases] = useState<Case[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<number | null>(null);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [nodes, setNodes] = useState<MoneyFlowNode[]>([]);
  const [edges, setEdges] = useState<MoneyFlowEdge[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Statistics | null>(null);
  const [, setSelectedNode] = useState<MoneyFlowNode | null>(null);
  const [activeTab, setActiveTab] = useState<'timeline' | 'accounts' | 'transactions'>('timeline');

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    try {
      const response = await casesAPI.list({ page: 1, page_size: 100 });
      setCases(response.items);
      if (response.items.length > 0) {
        const largestCase = response.items.reduce((max, c) => 
          (c.nodes_count || 0) > (max.nodes_count || 0) ? c : max
        );
        setSelectedCaseId(largestCase.id);
        setSelectedCase(largestCase);
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
      const [nodesRes, edgesRes] = await Promise.all([
        moneyFlowAPI.listNodes(selectedCaseId),
        moneyFlowAPI.listEdges(selectedCaseId)
      ]);
      setNodes(nodesRes);
      setEdges(edgesRes);
      calculateStats(nodesRes, edgesRes);
    } catch (err) {
      console.error('Failed to fetch money flow:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedCaseId]);

  useEffect(() => {
    if (selectedCaseId) {
      fetchMoneyFlow();
      const selectedCaseData = cases.find(c => c.id === selectedCaseId);
      setSelectedCase(selectedCaseData || null);
    }
  }, [selectedCaseId, cases, fetchMoneyFlow]);

  const calculateStats = (nodeList: MoneyFlowNode[], edgeList: MoneyFlowEdge[]) => {
    const totalAmount = edgeList.reduce((sum, e) => sum + (e.amount || 0), 0);
    setStats({
      totalNodes: nodeList.length,
      suspects: nodeList.filter(n => n.is_suspect).length,
      victims: nodeList.filter(n => n.is_victim).length,
      muleAccounts: nodeList.filter(n => n.node_type === 'bank_account' && !n.is_suspect).length,
      cryptoWallets: nodeList.filter(n => n.node_type === 'crypto_wallet').length,
      totalTransactions: edgeList.length,
      totalAmount
    });
  };

  const getNodeTypeLabel = (node: MoneyFlowNode): string => {
    if (node.is_suspect && node.label?.includes('Boss')) return 'Network Boss';
    if (node.is_suspect && node.label?.includes('OP-')) return 'System Admin';
    if (node.is_suspect && node.label?.includes('AG-')) return 'Agent';
    if (node.is_suspect) return 'Suspect';
    if (node.is_victim) return 'Victim';
    if (node.node_type === 'bank_account') return 'Mule Account';
    return nodeTypeLabels[node.node_type] || node.node_type;
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) return `฿${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `฿${(amount / 1000).toFixed(0)}K`;
    return `฿${amount.toLocaleString()}`;
  };

  if (loading && cases.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 space-y-4 bg-dark-900">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <FileText className="text-primary-500" />
            Forensic Investigation Report
          </h1>
          <p className="text-dark-400 mt-1">Case Summary Report - Digital Forensic Standard for Court</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={fetchMoneyFlow}>
            <RefreshCw size={18} className="mr-2" />
            Refresh
          </Button>
          <Button variant="secondary">
            <Printer size={18} className="mr-2" />
            Print
          </Button>
          <Button>
            <Download size={18} className="mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Case Selector & Stats */}
      <Card className="p-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-dark-400">Case:</label>
              <select
                className="bg-dark-700 border border-dark-600 rounded-lg px-3 py-2"
                value={selectedCaseId || ''}
                onChange={(e) => setSelectedCaseId(Number(e.target.value))}
              >
                {cases.map(c => (
                  <option key={c.id} value={c.id}>{c.case_number} - {c.title}</option>
                ))}
              </select>
            </div>
            {selectedCase && (
              <Badge variant="info" className="px-3 py-1">
                {selectedCase.status}
              </Badge>
            )}
          </div>
          
          {stats && (
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-primary-400" />
                <span className="text-sm">{stats.totalNodes} Person</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp size={18} className="text-amber-400" />
                <span className="text-sm">{stats.totalTransactions} transactions</span>
              </div>
              <div className="flex items-center gap-2 font-semibold text-amber-400">
                {formatCurrency(stats.totalAmount)}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-5 gap-4">
          <Card className="p-4 bg-red-500/10 border-red-500/20">
            <div className="text-2xl font-bold text-red-400">{stats.suspects}</div>
            <div className="text-sm text-dark-400">Suspect</div>
          </Card>
          <Card className="p-4 bg-green-500/10 border-green-500/20">
            <div className="text-2xl font-bold text-green-400">{stats.victims}</div>
            <div className="text-sm text-dark-400">Victim</div>
          </Card>
          <Card className="p-4 bg-amber-500/10 border-amber-500/20">
            <div className="text-2xl font-bold text-amber-400">{stats.muleAccounts}</div>
            <div className="text-sm text-dark-400">Mule Account</div>
          </Card>
          <Card className="p-4 bg-purple-500/10 border-purple-500/20">
            <div className="text-2xl font-bold text-purple-400">{stats.cryptoWallets}</div>
            <div className="text-sm text-dark-400">Crypto Wallet</div>
          </Card>
          <Card className="p-4 bg-blue-500/10 border-blue-500/20">
            <div className="text-2xl font-bold text-blue-400">{formatCurrency(stats.totalAmount)}</div>
            <div className="text-sm text-dark-400">Total Amount</div>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-dark-700">
        {[
          { id: 'timeline', labelTh: 'Timeline', icon: Clock },
          { id: 'accounts', labelTh: 'Accounts', icon: List },
          { id: 'transactions', labelTh: 'Transactions', icon: BarChart3 }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-[2px] ${
              activeTab === tab.id 
                ? 'border-primary-500 text-primary-400 bg-dark-800' 
                : 'border-transparent text-dark-400 hover:text-white hover:bg-dark-800'
            }`}
          >
            <tab.icon size={16} />
            <span>{tab.labelTh}</span>
          </button>
        ))}
      </div>

      {/* Timeline View */}
      {activeTab === 'timeline' && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock className="text-primary-400" />
            Timelinetransactions
          </h3>
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-dark-600" />
            <div className="space-y-4">
              {edges
                .slice(0, 50)
                .sort((a, b) => new Date(b.transaction_date || 0).getTime() - new Date(a.transaction_date || 0).getTime())
                .map((edge) => {
                  const fromNode = nodes.find(n => n.id === edge.from_node_id);
                  const toNode = nodes.find(n => n.id === edge.to_node_id);
                  return (
                    <div key={edge.id} className="relative pl-10">
                      <div className={`absolute left-2.5 w-3 h-3 rounded-full ${
                        (edge.amount || 0) > 500000 ? 'bg-red-500' : 
                        (edge.amount || 0) > 100000 ? 'bg-yellow-500' : 'bg-blue-500'
                      }`} />
                      <div className="bg-dark-800 rounded-lg p-4 hover:bg-dark-750 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-dark-400">
                            {edge.transaction_date ? new Date(edge.transaction_date).toLocaleString('en-US') : 'Date not specified'}
                          </span>
                          <Badge variant={(edge.amount || 0) > 500000 ? 'danger' : (edge.amount || 0) > 100000 ? 'warning' : 'info'}>
                            ฿{(edge.amount || 0).toLocaleString()}
                          </Badge>
                        </div>
                        <p className="font-medium">
                          {fromNode?.label || 'Unknown'} <ChevronRight className="inline" size={16} /> {toNode?.label || 'Unknown'}
                        </p>
                        {edge.label && <p className="text-sm text-dark-400 mt-1">{edge.label}</p>}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </Card>
      )}

      {/* Accounts View */}
      {activeTab === 'accounts' && (
        <Card className="p-4 overflow-hidden">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <List className="text-primary-400" />
            itemsAccounts ({nodes.length} items)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-800 border-b border-dark-700">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-dark-300">#</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-dark-300">Name</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-dark-300">Type</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-dark-300">ID Number</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-dark-300">Bank</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-dark-300">Risk</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-dark-300">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700">
                {nodes.slice(0, 100).map((node, i) => (
                  <tr 
                    key={node.id} 
                    className="hover:bg-dark-800/50 cursor-pointer"
                    onClick={() => setSelectedNode(node)}
                  >
                    <td className="px-4 py-3 text-sm text-dark-400">{i + 1}</td>
                    <td className="px-4 py-3 font-medium">{node.label}</td>
                    <td className="px-4 py-3">
                      <Badge variant="default">{getNodeTypeLabel(node)}</Badge>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{node.identifier || '-'}</td>
                    <td className="px-4 py-3">{node.bank_name || '-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-dark-700 rounded-full h-1.5">
                          <div 
                            className={`h-1.5 rounded-full ${
                              node.risk_score > 70 ? 'bg-red-500' : 
                              node.risk_score > 40 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${node.risk_score}%` }}
                          />
                        </div>
                        <span className="text-xs">{node.risk_score}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {node.is_suspect && <Badge variant="danger">Suspect</Badge>}
                      {node.is_victim && <Badge variant="success">Victim</Badge>}
                      {!node.is_suspect && !node.is_victim && <Badge variant="default">-</Badge>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {nodes.length > 100 && (
            <p className="text-center text-dark-400 text-sm mt-4">Showing 100 of {nodes.length} items</p>
          )}
        </Card>
      )}

      {/* Transactions View */}
      {activeTab === 'transactions' && (
        <Card className="p-4 overflow-hidden">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="text-primary-400" />
            itemstransactions ({edges.length} items)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-800 border-b border-dark-700">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-dark-300">#</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-dark-300">Date</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-dark-300">From</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-dark-300">To</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-dark-300">Amount</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-dark-300">Type</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-dark-300">Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700">
                {edges.slice(0, 100).map((edge, i) => {
                  const fromNode = nodes.find(n => n.id === edge.from_node_id);
                  const toNode = nodes.find(n => n.id === edge.to_node_id);
                  return (
                    <tr key={edge.id} className="hover:bg-dark-800/50">
                      <td className="px-4 py-3 text-sm text-dark-400">{i + 1}</td>
                      <td className="px-4 py-3 text-sm">
                        {edge.transaction_date ? new Date(edge.transaction_date).toLocaleDateString('en-US') : '-'}
                      </td>
                      <td className="px-4 py-3">{fromNode?.label || '-'}</td>
                      <td className="px-4 py-3">{toNode?.label || '-'}</td>
                      <td className="px-4 py-3 text-right font-medium">
                        <span className={(edge.amount || 0) > 500000 ? 'text-red-400' : (edge.amount || 0) > 100000 ? 'text-yellow-400' : ''}>
                          ฿{(edge.amount || 0).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={edge.edge_type === 'crypto_purchase' ? 'info' : 'default'}>
                          {edge.edge_type === 'deposit' ? 'Deposit' : 
                           edge.edge_type === 'transfer' ? 'Transfer' :
                           edge.edge_type === 'crypto_purchase' ? 'Crypto Purchase' :
                           edge.edge_type === 'crypto_transfer' ? 'Crypto Transfer' :
                           edge.edge_type || 'Transfer'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">{edge.transaction_ref || '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {edges.length > 100 && (
            <p className="text-center text-dark-400 text-sm mt-4">Showing 100 of {edges.length} items</p>
          )}
        </Card>
      )}
    </div>
  );
};

export { ForensicReport as ForensicReportPage };
export default ForensicReport;
