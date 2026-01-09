/**
 * Forensic Report Page
 * Interactive visualization for court submission
 */
import { useEffect, useState, useRef, useCallback } from 'react';
import { 
  FileText, Download, Printer, Share2, Filter, Search,
  Users, DollarSign, AlertTriangle, Building, Wallet,
  TrendingUp, Calendar, RefreshCw, Loader2, ZoomIn, ZoomOut,
  Maximize2, ChevronLeft, ChevronRight, Clock, MapPin
} from 'lucide-react';
import { Button, Input, Card, Badge } from '../../components/ui';
import { casesAPI, moneyFlowAPI } from '../../services/api';
import type { Case, MoneyFlowNode, MoneyFlowEdge } from '../../services/api';

// Declare vis-network types
declare global {
  interface Window {
    vis: {
      Network: new (container: HTMLElement, data: object, options: object) => VisNetwork;
      DataSet: new <T>(data: T[]) => VisDataSet<T>;
    };
  }
}

interface VisNetwork {
  setOptions: (options: object) => void;
  fit: () => void;
  stabilize: () => void;
  getSelectedNodes: () => number[];
  focus: (nodeId: number, options?: object) => void;
  destroy: () => void;
  on: (event: string, callback: (params: { nodes: number[] }) => void) => void;
}

interface VisDataSet<T> {
  add: (data: T | T[]) => void;
  update: (data: T | T[]) => void;
  remove: (id: number | number[]) => void;
  get: (id?: number) => T | T[];
}

interface VisNode {
  id: number;
  label: string;
  group: string;
  size: number;
  title: string;
  x?: number;
  y?: number;
}

interface VisEdge {
  id: number;
  from: number;
  to: number;
  label?: string;
  width: number;
  title: string;
  arrows: string;
}

interface Statistics {
  totalNodes: number;
  suspects: number;
  victims: number;
  muleAccounts: number;
  cryptoWallets: number;
  totalTransactions: number;
  totalAmount: number;
  avgTransactionSize: number;
}

const nodeColors: Record<string, { background: string; border: string; highlight: string }> = {
  boss: { background: '#DC2626', border: '#991B1B', highlight: '#EF4444' },
  suspect: { background: '#F97316', border: '#C2410C', highlight: '#FB923C' },
  victim: { background: '#22C55E', border: '#15803D', highlight: '#4ADE80' },
  mule: { background: '#F59E0B', border: '#B45309', highlight: '#FBBF24' },
  crypto: { background: '#8B5CF6', border: '#6D28D9', highlight: '#A78BFA' },
  exchange: { background: '#3B82F6', border: '#1D4ED8', highlight: '#60A5FA' },
  bank_account: { background: '#F59E0B', border: '#B45309', highlight: '#FBBF24' },
  person: { background: '#6B7280', border: '#374151', highlight: '#9CA3AF' },
  crypto_wallet: { background: '#8B5CF6', border: '#6D28D9', highlight: '#A78BFA' },
};

export const ForensicReport = () => {
  const [cases, setCases] = useState<Case[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<number | null>(null);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [nodes, setNodes] = useState<MoneyFlowNode[]>([]);
  const [edges, setEdges] = useState<MoneyFlowEdge[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Statistics | null>(null);
  const [selectedNode, setSelectedNode] = useState<MoneyFlowNode | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'graph' | 'timeline' | 'accounts' | 'transactions'>('graph');
  
  const networkRef = useRef<VisNetwork | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchCases();
    loadVisNetwork();
  }, []);

  const loadVisNetwork = () => {
    if (typeof window !== 'undefined' && !window.vis) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/vis-network@9.1.6/standalone/umd/vis-network.min.js';
      script.async = true;
      document.body.appendChild(script);
    }
  };

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

  useEffect(() => {
    if (nodes.length > 0 && containerRef.current && window.vis && activeTab === 'graph') {
      renderNetwork();
    }
  }, [nodes, edges, activeTab, filterType]);

  const calculateStats = (nodeList: MoneyFlowNode[], edgeList: MoneyFlowEdge[]) => {
    const totalAmount = edgeList.reduce((sum, e) => sum + (e.amount || 0), 0);
    setStats({
      totalNodes: nodeList.length,
      suspects: nodeList.filter(n => n.is_suspect).length,
      victims: nodeList.filter(n => n.is_victim).length,
      muleAccounts: nodeList.filter(n => n.node_type === 'bank_account' && !n.is_suspect).length,
      cryptoWallets: nodeList.filter(n => n.node_type === 'crypto_wallet').length,
      totalTransactions: edgeList.length,
      totalAmount,
      avgTransactionSize: edgeList.length > 0 ? totalAmount / edgeList.length : 0
    });
  };

  const getNodeGroup = (node: MoneyFlowNode): string => {
    if (node.is_suspect && node.label?.includes('หัวหน้า')) return 'boss';
    if (node.is_suspect) return 'suspect';
    if (node.is_victim) return 'victim';
    if (node.node_type === 'crypto_wallet') return 'crypto';
    if (node.node_type === 'exchange') return 'exchange';
    if (node.node_type === 'bank_account') return 'mule';
    return 'person';
  };

  const renderNetwork = () => {
    if (!containerRef.current || !window.vis) return;

    // Filter nodes
    let filteredNodes = nodes;
    if (filterType !== 'all') {
      filteredNodes = nodes.filter(n => {
        if (filterType === 'suspects') return n.is_suspect;
        if (filterType === 'victims') return n.is_victim;
        if (filterType === 'mules') return n.node_type === 'bank_account';
        if (filterType === 'crypto') return n.node_type === 'crypto_wallet';
        return true;
      });
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredNodes = filteredNodes.filter(n => 
        n.label?.toLowerCase().includes(query) ||
        n.identifier?.toLowerCase().includes(query)
      );
    }

    const filteredNodeIds = new Set(filteredNodes.map(n => n.id));
    const filteredEdges = edges.filter(e => 
      filteredNodeIds.has(e.from_node_id) && filteredNodeIds.has(e.to_node_id)
    );

    const visNodes: VisNode[] = filteredNodes.map(n => ({
      id: n.id,
      label: n.label || 'Unknown',
      group: getNodeGroup(n),
      size: n.size || 30,
      title: `${n.label}\n${n.identifier || ''}\n${n.notes || ''}`,
      x: n.x_position,
      y: n.y_position
    }));

    const visEdges: VisEdge[] = filteredEdges.map(e => ({
      id: e.id,
      from: e.from_node_id,
      to: e.to_node_id,
      label: e.amount ? `฿${e.amount.toLocaleString()}` : '',
      width: Math.min(Math.max((e.amount || 0) / 100000, 1), 10),
      title: `${e.label || ''}\n฿${(e.amount || 0).toLocaleString()}\n${e.transaction_ref || ''}`,
      arrows: 'to'
    }));

    const data = {
      nodes: new window.vis.DataSet(visNodes),
      edges: new window.vis.DataSet(visEdges)
    };

    const options = {
      groups: Object.fromEntries(
        Object.entries(nodeColors).map(([key, colors]) => [
          key,
          { color: colors, font: { color: '#ffffff' } }
        ])
      ),
      nodes: {
        shape: 'dot',
        font: { size: 12, color: '#ffffff', strokeWidth: 2, strokeColor: '#000000' },
        borderWidth: 2,
        shadow: true
      },
      edges: {
        font: { size: 10, color: '#ffffff', strokeWidth: 1, strokeColor: '#000000', align: 'middle' },
        smooth: { type: 'curvedCW', roundness: 0.2 },
        shadow: true,
        color: { color: '#6B7280', highlight: '#3B82F6', hover: '#3B82F6' }
      },
      physics: {
        enabled: true,
        barnesHut: {
          gravitationalConstant: -3000,
          springLength: 150,
          springConstant: 0.04,
          damping: 0.09
        },
        stabilization: { iterations: 150 }
      },
      interaction: {
        hover: true,
        tooltipDelay: 100,
        hideEdgesOnDrag: true,
        navigationButtons: true,
        keyboard: true
      }
    };

    if (networkRef.current) {
      networkRef.current.destroy();
    }

    networkRef.current = new window.vis.Network(containerRef.current, data, options);

    networkRef.current.on('click', (params: { nodes: number[] }) => {
      if (params.nodes.length > 0) {
        const node = nodes.find(n => n.id === params.nodes[0]);
        setSelectedNode(node || null);
      }
    });
  };

  const handleZoomIn = () => networkRef.current?.focus(0, { scale: 1.5 });
  const handleZoomOut = () => networkRef.current?.focus(0, { scale: 0.5 });
  const handleFit = () => networkRef.current?.fit();

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) return `฿${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `฿${(amount / 1000).toFixed(0)}K`;
    return `฿${amount.toLocaleString()}`;
  };

  const handleExportPDF = () => {
    alert('PDF Export - Coming soon! Will generate forensic-grade report.');
  };

  if (loading && cases.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 space-y-6 bg-dark-900">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <FileText className="text-primary-500" />
            Forensic Investigation Report
          </h1>
          <p className="text-dark-400 mt-1">รายงานสรุปสำหรับส่งศาล - Digital Forensic Standard</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={fetchMoneyFlow}>
            <RefreshCw size={18} className="mr-2" />
            Refresh
          </Button>
          <Button variant="secondary" onClick={handleExportPDF}>
            <Printer size={18} className="mr-2" />
            Print
          </Button>
          <Button onClick={handleExportPDF}>
            <Download size={18} className="mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Case Selector */}
      <Card className="p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium whitespace-nowrap">Select Case:</label>
            <select
              className="bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white min-w-[400px]"
              value={selectedCaseId || ''}
              onChange={(e) => setSelectedCaseId(Number(e.target.value))}
            >
              {cases.map(c => (
                <option key={c.id} value={c.id}>
                  {c.case_number} - {c.title} ({c.nodes_count || 0} nodes)
                </option>
              ))}
            </select>
          </div>
          {selectedCase && (
            <div className="flex items-center gap-4 text-sm">
              <Badge variant={selectedCase.priority === 'critical' ? 'danger' : 'warning'}>
                {selectedCase.priority?.toUpperCase()}
              </Badge>
              <span className="text-dark-400">
                <Calendar size={14} className="inline mr-1" />
                {new Date(selectedCase.created_at).toLocaleDateString('th-TH')}
              </span>
            </div>
          )}
        </div>
      </Card>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          <Card className="p-4 text-center bg-gradient-to-br from-dark-800 to-dark-900 border-dark-700">
            <div className="text-3xl font-bold text-white">{stats.totalNodes}</div>
            <div className="text-xs text-dark-400 mt-1">Total Nodes</div>
          </Card>
          <Card className="p-4 text-center bg-gradient-to-br from-red-900/30 to-dark-900 border-red-800/50">
            <div className="text-3xl font-bold text-red-400">{stats.suspects}</div>
            <div className="text-xs text-dark-400 mt-1">Suspects</div>
          </Card>
          <Card className="p-4 text-center bg-gradient-to-br from-green-900/30 to-dark-900 border-green-800/50">
            <div className="text-3xl font-bold text-green-400">{stats.victims}</div>
            <div className="text-xs text-dark-400 mt-1">Victims</div>
          </Card>
          <Card className="p-4 text-center bg-gradient-to-br from-yellow-900/30 to-dark-900 border-yellow-800/50">
            <div className="text-3xl font-bold text-yellow-400">{stats.muleAccounts}</div>
            <div className="text-xs text-dark-400 mt-1">Mule Accounts</div>
          </Card>
          <Card className="p-4 text-center bg-gradient-to-br from-purple-900/30 to-dark-900 border-purple-800/50">
            <div className="text-3xl font-bold text-purple-400">{stats.cryptoWallets}</div>
            <div className="text-xs text-dark-400 mt-1">Crypto Wallets</div>
          </Card>
          <Card className="p-4 text-center bg-gradient-to-br from-blue-900/30 to-dark-900 border-blue-800/50">
            <div className="text-3xl font-bold text-blue-400">{stats.totalTransactions}</div>
            <div className="text-xs text-dark-400 mt-1">Transactions</div>
          </Card>
          <Card className="p-4 text-center bg-gradient-to-br from-emerald-900/30 to-dark-900 border-emerald-800/50 col-span-2">
            <div className="text-3xl font-bold text-emerald-400">{formatCurrency(stats.totalAmount)}</div>
            <div className="text-xs text-dark-400 mt-1">Total Amount</div>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-dark-700 pb-2">
        {[
          { id: 'graph', label: 'Network Graph', icon: Share2 },
          { id: 'timeline', label: 'Timeline', icon: Clock },
          { id: 'accounts', label: 'Accounts', icon: Building },
          { id: 'transactions', label: 'Transactions', icon: TrendingUp }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors ${
              activeTab === tab.id 
                ? 'bg-dark-700 text-white border-b-2 border-primary-500' 
                : 'text-dark-400 hover:text-white hover:bg-dark-800'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Graph View */}
      {activeTab === 'graph' && (
        <Card className="p-4">
          {/* Graph Controls */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" size={16} />
                <Input
                  placeholder="Search nodes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              <select
                className="bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="all">All Nodes</option>
                <option value="suspects">Suspects Only</option>
                <option value="victims">Victims Only</option>
                <option value="mules">Mule Accounts</option>
                <option value="crypto">Crypto Wallets</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleZoomIn}><ZoomIn size={16} /></Button>
              <Button variant="ghost" size="sm" onClick={handleZoomOut}><ZoomOut size={16} /></Button>
              <Button variant="ghost" size="sm" onClick={handleFit}><Maximize2 size={16} /></Button>
            </div>
          </div>

          {/* Network Container */}
          <div className="flex gap-4">
            <div 
              ref={containerRef} 
              className="flex-1 bg-dark-900 rounded-lg border border-dark-700"
              style={{ height: '600px' }}
            />
            
            {/* Node Detail Panel */}
            {selectedNode && (
              <Card className="w-80 p-4 bg-dark-800">
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  {selectedNode.is_suspect ? (
                    <AlertTriangle className="text-red-400" size={20} />
                  ) : selectedNode.is_victim ? (
                    <Users className="text-green-400" size={20} />
                  ) : (
                    <Building className="text-yellow-400" size={20} />
                  )}
                  Node Details
                </h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-dark-400">Label:</span>
                    <p className="font-medium">{selectedNode.label}</p>
                  </div>
                  <div>
                    <span className="text-dark-400">Type:</span>
                    <p className="font-medium capitalize">{selectedNode.node_type?.replace('_', ' ')}</p>
                  </div>
                  {selectedNode.identifier && (
                    <div>
                      <span className="text-dark-400">Identifier:</span>
                      <p className="font-mono text-xs bg-dark-700 p-2 rounded">{selectedNode.identifier}</p>
                    </div>
                  )}
                  {selectedNode.bank_name && (
                    <div>
                      <span className="text-dark-400">Bank:</span>
                      <p className="font-medium">{selectedNode.bank_name}</p>
                    </div>
                  )}
                  {selectedNode.phone_number && (
                    <div>
                      <span className="text-dark-400">Phone:</span>
                      <p className="font-medium">{selectedNode.phone_number}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-dark-400">Risk Score:</span>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 bg-dark-700 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            selectedNode.risk_score > 70 ? 'bg-red-500' : 
                            selectedNode.risk_score > 40 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${selectedNode.risk_score}%` }}
                        />
                      </div>
                      <span className="font-medium">{selectedNode.risk_score}</span>
                    </div>
                  </div>
                  {selectedNode.notes && (
                    <div>
                      <span className="text-dark-400">Notes:</span>
                      <p className="text-xs bg-dark-700 p-2 rounded mt-1">{selectedNode.notes}</p>
                    </div>
                  )}
                  <div className="flex gap-2 pt-2">
                    {selectedNode.is_suspect && <Badge variant="danger">Suspect</Badge>}
                    {selectedNode.is_victim && <Badge variant="success">Victim</Badge>}
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 mt-4 text-sm">
            {[
              { color: '#DC2626', label: 'Boss/Leader' },
              { color: '#F97316', label: 'Suspect' },
              { color: '#22C55E', label: 'Victim' },
              { color: '#F59E0B', label: 'Mule Account' },
              { color: '#8B5CF6', label: 'Crypto Wallet' },
              { color: '#3B82F6', label: 'Exchange' }
            ].map(item => (
              <div key={item.label} className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-dark-300">{item.label}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Timeline View */}
      {activeTab === 'timeline' && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Transaction Timeline</h3>
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-dark-600" />
            <div className="space-y-4">
              {edges.slice(0, 50).sort((a, b) => 
                new Date(b.transaction_date || 0).getTime() - new Date(a.transaction_date || 0).getTime()
              ).map((edge, i) => {
                const fromNode = nodes.find(n => n.id === edge.from_node_id);
                const toNode = nodes.find(n => n.id === edge.to_node_id);
                return (
                  <div key={edge.id} className="relative pl-10">
                    <div className={`absolute left-2.5 w-3 h-3 rounded-full ${
                      (edge.amount || 0) > 500000 ? 'bg-red-500' : 
                      (edge.amount || 0) > 100000 ? 'bg-yellow-500' : 'bg-blue-500'
                    }`} />
                    <div className="bg-dark-800 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-dark-400">
                          {edge.transaction_date ? new Date(edge.transaction_date).toLocaleString('th-TH') : 'Unknown date'}
                        </span>
                        <Badge variant={
                          (edge.amount || 0) > 500000 ? 'danger' : 
                          (edge.amount || 0) > 100000 ? 'warning' : 'info'
                        }>
                          {formatCurrency(edge.amount || 0)}
                        </Badge>
                      </div>
                      <p className="font-medium">
                        {fromNode?.label || 'Unknown'} → {toNode?.label || 'Unknown'}
                      </p>
                      {edge.label && <p className="text-sm text-dark-400 mt-1">{edge.label}</p>}
                      {edge.transaction_ref && (
                        <p className="text-xs text-dark-500 mt-1 font-mono">Ref: {edge.transaction_ref}</p>
                      )}
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
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-800 border-b border-dark-700">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-dark-300">#</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-dark-300">Label</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-dark-300">Type</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-dark-300">Identifier</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-dark-300">Bank</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-dark-300">Risk</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-dark-300">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700">
                {nodes.slice(0, 100).map((node, i) => (
                  <tr key={node.id} className="hover:bg-dark-800/50">
                    <td className="px-4 py-3 text-sm text-dark-400">{i + 1}</td>
                    <td className="px-4 py-3 font-medium">{node.label}</td>
                    <td className="px-4 py-3">
                      <Badge variant="default">{node.node_type}</Badge>
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
            <p className="text-center text-dark-400 text-sm mt-4">
              Showing 100 of {nodes.length} nodes
            </p>
          )}
        </Card>
      )}

      {/* Transactions View */}
      {activeTab === 'transactions' && (
        <Card className="p-4 overflow-hidden">
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
                        {edge.transaction_date ? new Date(edge.transaction_date).toLocaleDateString('th-TH') : '-'}
                      </td>
                      <td className="px-4 py-3">{fromNode?.label || '-'}</td>
                      <td className="px-4 py-3">{toNode?.label || '-'}</td>
                      <td className="px-4 py-3 text-right font-medium">
                        <span className={
                          (edge.amount || 0) > 500000 ? 'text-red-400' : 
                          (edge.amount || 0) > 100000 ? 'text-yellow-400' : ''
                        }>
                          ฿{(edge.amount || 0).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={edge.edge_type === 'crypto_purchase' ? 'info' : 'default'}>
                          {edge.edge_type || 'transfer'}
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
            <p className="text-center text-dark-400 text-sm mt-4">
              Showing 100 of {edges.length} transactions
            </p>
          )}
        </Card>
      )}
    </div>
  );
};

export { ForensicReport as ForensicReportPage };
export default ForensicReport;
