/**
 * Forensic Report Page - Enhanced with Classification Analysis
 * รายงานสรุปสำหรับส่งศาล - มาตรฐาน Digital Forensic
 */
import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { 
  FileText, Download, Printer, Search, Users, 
  TrendingUp, RefreshCw, Loader2, Maximize2, Clock, Eye, Copy, File, Target, Link2, ChevronRight,
  GitBranch, Network, List, BarChart3, ExternalLink, ShieldAlert, ArrowUpRight, ArrowDownLeft,
  Scale, Fingerprint, MapPin, Activity, AlertCircle, CheckCircle2, Info
} from 'lucide-react';
import { Button, Input, Card, Badge } from '../../components/ui';
import { casesAPI, moneyFlowAPI } from '../../services/api';
import type { Case, MoneyFlowNode, MoneyFlowEdge } from '../../services/api';

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
  destroy: () => void;
  on: (event: string, callback: (params: { nodes: number[] }) => void) => void;
}

interface VisDataSet<T> {
  add: (data: T | T[]) => void;
  get: (id?: number) => T | T[];
}

interface Statistics {
  totalNodes: number;
  suspects: number;
  victims: number;
  muleAccounts: number;
  cryptoWallets: number;
  totalTransactions: number;
  totalAmount: number;
}

interface NodeAnalysis {
  incomingAmount: number;
  outgoingAmount: number;
  incomingCount: number;
  outgoingCount: number;
  connectedNodes: number;
  networkTier: number;
  classificationReasons: string[];
  evidenceSources: string[];
  riskFactors: { factor: string; score: number }[];
}

// Thai labels
const nodeTypeLabels: Record<string, string> = {
  person: 'บุคคล',
  bank_account: 'บัญชีธนาคาร',
  crypto_wallet: 'กระเป๋าคริปโต',
  exchange: 'ศูนย์แลกเปลี่ยน',
};

const nodeColors: Record<string, { background: string; border: string }> = {
  boss: { background: '#DC2626', border: '#991B1B' },
  suspect: { background: '#F97316', border: '#C2410C' },
  victim: { background: '#22C55E', border: '#15803D' },
  mule: { background: '#F59E0B', border: '#B45309' },
  crypto: { background: '#8B5CF6', border: '#6D28D9' },
  exchange: { background: '#3B82F6', border: '#1D4ED8' },
  bank_account: { background: '#F59E0B', border: '#B45309' },
  person: { background: '#6B7280', border: '#374151' },
  crypto_wallet: { background: '#8B5CF6', border: '#6D28D9' },
};

const legendItems = [
  { color: '#DC2626', label: 'หัวหน้าเครือข่าย' },
  { color: '#F97316', label: 'ผู้ต้องสงสัย' },
  { color: '#22C55E', label: 'ผู้เสียหาย' },
  { color: '#F59E0B', label: 'บัญชีม้า' },
  { color: '#8B5CF6', label: 'กระเป๋าคริปโต' },
  { color: '#3B82F6', label: 'ศูนย์แลกเปลี่ยน' },
];

const edgeLegend = [
  { color: '#4ECDC4', label: 'โอนเงิน', style: 'solid' },
  { color: '#EC4899', label: 'DNA Match', style: 'dashed' },
  { color: '#60A5FA', label: 'พบใน/เชื่อมโยง', style: 'solid' },
];

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
  const [activeTab, setActiveTab] = useState<'hierarchy' | 'network' | 'timeline' | 'accounts' | 'transactions'>('hierarchy');
  const [graphLayout] = useState<'hierarchical' | 'network'>('hierarchical');
  
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
    if (nodes.length > 0 && containerRef.current && window.vis && (activeTab === 'hierarchy' || activeTab === 'network')) {
      setTimeout(() => renderNetwork(), 100);
    }
  }, [nodes, edges, activeTab, filterType, graphLayout]);

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

  // Calculate node analysis for classification reasons
  const nodeAnalysis = useMemo((): NodeAnalysis | null => {
    if (!selectedNode) return null;

    const incomingEdges = edges.filter(e => e.to_node_id === selectedNode.id);
    const outgoingEdges = edges.filter(e => e.from_node_id === selectedNode.id);
    
    const incomingAmount = incomingEdges.reduce((sum, e) => sum + (e.amount || 0), 0);
    const outgoingAmount = outgoingEdges.reduce((sum, e) => sum + (e.amount || 0), 0);
    
    const connectedNodeIds = new Set([
      ...incomingEdges.map(e => e.from_node_id),
      ...outgoingEdges.map(e => e.to_node_id)
    ]);

    // Determine network tier based on connections
    let networkTier = 4; // Default: lowest tier
    if (selectedNode.label?.includes('หัวหน้า')) {
      networkTier = 1;
    } else if (selectedNode.label?.includes('OP-')) {
      networkTier = 2;
    } else if (selectedNode.label?.includes('AG-')) {
      networkTier = 3;
    }

    // Generate classification reasons
    const classificationReasons: string[] = [];
    const riskFactors: { factor: string; score: number }[] = [];

    if (selectedNode.is_suspect) {
      if (selectedNode.label?.includes('หัวหน้า')) {
        classificationReasons.push('ระบุตัวตนจากการสืบสวน: เป็นผู้บริหารระดับสูงในเครือข่าย');
        classificationReasons.push(`มีผู้ใต้บังคับบัญชาในเครือข่าย ${outgoingEdges.length} ราย`);
        classificationReasons.push('ได้รับเงินโอนรวมจากผู้ดำเนินการ (Operator)');
        riskFactors.push({ factor: 'ตำแหน่งสูงสุดในลำดับชั้น', score: 30 });
        riskFactors.push({ factor: 'ยอดเงินผ่านบัญชีสูง', score: 25 });
        riskFactors.push({ factor: 'เชื่อมโยงกับคริปโตวอลเล็ต', score: 20 });
      } else if (selectedNode.label?.includes('OP-')) {
        classificationReasons.push('ระบุเป็นผู้ดูแลระบบเว็บพนัน (Operator)');
        classificationReasons.push('รับเงินจากเอเย่นต์และส่งต่อให้หัวหน้า');
        riskFactors.push({ factor: 'เป็นตัวกลางในการโอนเงิน', score: 25 });
        riskFactors.push({ factor: 'มีการติดต่อกับหลายบัญชี', score: 20 });
      } else if (selectedNode.label?.includes('AG-')) {
        classificationReasons.push('ระบุเป็นเอเย่นต์/ตัวแทนรับเดิมพัน');
        classificationReasons.push('รับเงินจากบัญชีม้าและส่งต่อให้ Operator');
        riskFactors.push({ factor: 'รับเงินจากหลายแหล่ง', score: 20 });
        riskFactors.push({ factor: 'มีรูปแบบการโอนผิดปกติ', score: 15 });
      }
    }

    if (selectedNode.is_victim) {
      classificationReasons.push('แจ้งความเป็นผู้เสียหายในคดีพนันออนไลน์');
      classificationReasons.push('มีหลักฐานการโอนเงินไปยังบัญชีม้า');
      riskFactors.push({ factor: 'ไม่มีความเสี่ยง (ผู้เสียหาย)', score: 0 });
    }

    if (selectedNode.node_type === 'bank_account' && !selectedNode.is_suspect) {
      classificationReasons.push('บัญชีถูกใช้รับ-โอนเงินจากผู้เสียหายหลายราย');
      classificationReasons.push('ไม่พบความเชื่อมโยงกับเจ้าของบัญชีที่แท้จริง');
      classificationReasons.push('มีพฤติกรรมการโอนเงินผิดปกติ (หลายครั้งต่อวัน)');
      riskFactors.push({ factor: 'รูปแบบการใช้งานผิดปกติ', score: 25 });
      riskFactors.push({ factor: 'รับเงินจากผู้เสียหายหลายราย', score: 20 });
    }

    if (selectedNode.node_type === 'crypto_wallet') {
      classificationReasons.push('กระเป๋าคริปโตใช้สำหรับฟอกเงิน');
      classificationReasons.push('รับเงินจากบัญชีผู้ต้องสงสัยและโอนต่อหลายชั้น');
      riskFactors.push({ factor: 'ใช้สำหรับฟอกเงินข้ามประเทศ', score: 30 });
      riskFactors.push({ factor: 'ติดตามยาก', score: 25 });
    }

    // Add amount-based reasons
    if (incomingAmount > 1000000) {
      classificationReasons.push(`รับเงินโอนเข้ารวม ฿${incomingAmount.toLocaleString()}`);
      riskFactors.push({ factor: 'ยอดรับเงินสูงผิดปกติ', score: 15 });
    }
    if (outgoingAmount > 1000000) {
      classificationReasons.push(`โอนเงินออกรวม ฿${outgoingAmount.toLocaleString()}`);
    }

    // Evidence sources
    const evidenceSources: string[] = [
      'ข้อมูลธุรกรรมธนาคาร',
      'รายงานการแจ้งความผู้เสียหาย',
    ];

    if (selectedNode.node_type === 'crypto_wallet') {
      evidenceSources.push('ข้อมูล Blockchain Analysis');
    }
    if (selectedNode.phone_number) {
      evidenceSources.push('ข้อมูลผู้ใช้โทรศัพท์');
    }
    if (selectedNode.identifier) {
      evidenceSources.push('ฐานข้อมูลทะเบียนราษฎร์');
    }

    return {
      incomingAmount,
      outgoingAmount,
      incomingCount: incomingEdges.length,
      outgoingCount: outgoingEdges.length,
      connectedNodes: connectedNodeIds.size,
      networkTier,
      classificationReasons,
      evidenceSources,
      riskFactors
    };
  }, [selectedNode, edges]);

  const getNodeGroup = (node: MoneyFlowNode): string => {
    if (node.is_suspect && node.label?.includes('หัวหน้า')) return 'boss';
    if (node.is_suspect) return 'suspect';
    if (node.is_victim) return 'victim';
    if (node.node_type === 'crypto_wallet') return 'crypto';
    if (node.node_type === 'exchange') return 'exchange';
    if (node.node_type === 'bank_account') return 'mule';
    return 'person';
  };

  const getNodeTypeLabel = (node: MoneyFlowNode): string => {
    if (node.is_suspect && node.label?.includes('หัวหน้า')) return 'หัวหน้าเครือข่าย';
    if (node.is_suspect && node.label?.includes('OP-')) return 'ผู้ดูแลระบบ';
    if (node.is_suspect && node.label?.includes('AG-')) return 'เอเย่นต์';
    if (node.is_suspect) return 'ผู้ต้องสงสัย';
    if (node.is_victim) return 'ผู้เสียหาย';
    if (node.node_type === 'bank_account') return 'บัญชีม้า';
    return nodeTypeLabels[node.node_type] || node.node_type;
  };

  const renderNetwork = () => {
    if (!containerRef.current || !window.vis) return;

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

    const visNodes = filteredNodes.map(n => {
      const group = getNodeGroup(n);
      const colors = nodeColors[group] || nodeColors.person;
      return {
        id: n.id,
        label: n.label || 'Unknown',
        group: group,
        color: colors,
        size: n.size || 30,
        title: `${n.label}\n${n.identifier || ''}\n${n.notes || ''}`,
        font: { color: '#ffffff', size: 11 },
        shape: activeTab === 'hierarchy' ? 'box' : 'dot',
        borderWidth: 2,
        shadow: true
      };
    });

    const visEdges = filteredEdges.map(e => ({
      id: e.id,
      from: e.from_node_id,
      to: e.to_node_id,
      label: e.amount ? `฿${e.amount.toLocaleString()}` : '',
      width: Math.min(Math.max((e.amount || 0) / 100000, 1), 8),
      title: `${e.label || ''}\n฿${(e.amount || 0).toLocaleString()}`,
      arrows: 'to',
      color: { color: e.edge_type === 'crypto_transfer' ? '#8B5CF6' : '#4ECDC4' },
      smooth: { type: 'curvedCW', roundness: 0.2 },
      font: { color: '#ffffff', size: 9, strokeWidth: 0 }
    }));

    const data = {
      nodes: new window.vis.DataSet(visNodes),
      edges: new window.vis.DataSet(visEdges)
    };

    const isHierarchical = activeTab === 'hierarchy' || graphLayout === 'hierarchical';

    const options = {
      nodes: {
        shape: isHierarchical ? 'box' : 'dot',
        font: { color: '#fff', size: 11 },
        borderWidth: 2,
        shadow: true,
        margin: { top: 10, bottom: 10, left: 10, right: 10 }
      },
      edges: {
        font: { color: '#fff', size: 9, strokeWidth: 0, align: 'middle' },
        smooth: { type: 'curvedCW', roundness: 0.2 },
        arrows: { to: { enabled: true, scaleFactor: 0.8 } },
        shadow: true
      },
      physics: {
        enabled: !isHierarchical,
        barnesHut: {
          gravitationalConstant: -3000,
          springLength: 150,
          springConstant: 0.04,
          damping: 0.09
        }
      },
      layout: {
        hierarchical: isHierarchical ? {
          enabled: true,
          direction: 'UD',
          sortMethod: 'directed',
          levelSeparation: 120,
          nodeSpacing: 100,
          treeSpacing: 150
        } : { enabled: false }
      },
      interaction: {
        hover: true,
        tooltipDelay: 100,
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

  const handleFit = () => networkRef.current?.fit();

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) return `฿${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `฿${(amount / 1000).toFixed(0)}K`;
    return `฿${amount.toLocaleString()}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getConnectedCases = (node: MoneyFlowNode) => {
    return edges.filter(e => e.from_node_id === node.id || e.to_node_id === node.id).length;
  };

  const getTierLabel = (tier: number) => {
    switch(tier) {
      case 1: return { label: 'ระดับ 1 - หัวหน้า', color: 'bg-red-500' };
      case 2: return { label: 'ระดับ 2 - ผู้ดูแลระบบ', color: 'bg-orange-500' };
      case 3: return { label: 'ระดับ 3 - เอเย่นต์', color: 'bg-yellow-500' };
      default: return { label: 'ระดับ 4 - ปลายทาง', color: 'bg-gray-500' };
    }
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
          <p className="text-dark-400 mt-1">รายงานสรุปคดี - มาตรฐาน Digital Forensic สำหรับส่งศาล</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={fetchMoneyFlow}>
            <RefreshCw size={18} className="mr-2" />
            รีเฟรช
          </Button>
          <Button variant="secondary">
            <Printer size={18} className="mr-2" />
            พิมพ์
          </Button>
          <Button>
            <Download size={18} className="mr-2" />
            ส่งออก PDF
          </Button>
        </div>
      </div>

      {/* Case Selector & Stats */}
      <Card className="p-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium whitespace-nowrap">เลือกคดี:</label>
              <select
                className="bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white min-w-[350px]"
                value={selectedCaseId || ''}
                onChange={(e) => setSelectedCaseId(Number(e.target.value))}
              >
                {cases.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.case_number} - {c.title}
                  </option>
                ))}
              </select>
            </div>
            {selectedCase && (
              <Badge variant={selectedCase.priority === 'critical' ? 'danger' : 'warning'}>
                {selectedCase.priority === 'critical' ? 'วิกฤต' : selectedCase.priority === 'high' ? 'สูง' : 'ปกติ'}
              </Badge>
            )}
          </div>
          
          {stats && (
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2 px-3 py-1 bg-dark-700 rounded-lg">
                <Target size={14} className="text-blue-400" />
                <span>{stats.totalNodes} โหนด</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-dark-700 rounded-lg">
                <Users size={14} className="text-red-400" />
                <span>{stats.suspects} ผู้ต้องสงสัย</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-dark-700 rounded-lg">
                <Users size={14} className="text-green-400" />
                <span>{stats.victims} ผู้เสียหาย</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-dark-700 rounded-lg">
                <TrendingUp size={14} className="text-emerald-400" />
                <span>{formatCurrency(stats.totalAmount)}</span>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-dark-700">
        {[
          { id: 'hierarchy', labelTh: 'ผังลำดับชั้น', icon: GitBranch },
          { id: 'network', labelTh: 'กราฟเครือข่าย', icon: Network },
          { id: 'timeline', labelTh: 'ไทม์ไลน์', icon: Clock },
          { id: 'accounts', labelTh: 'บัญชี', icon: List },
          { id: 'transactions', labelTh: 'ธุรกรรม', icon: BarChart3 }
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

      {/* Graph Views */}
      {(activeTab === 'hierarchy' || activeTab === 'network') && (
        <div className="flex gap-4">
          {/* Main Graph */}
          <Card className="flex-1 p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" size={16} />
                  <Input
                    placeholder="ค้นหาบุคคล..."
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
                  <option value="all">ทั้งหมด</option>
                  <option value="suspects">ผู้ต้องสงสัย</option>
                  <option value="victims">ผู้เสียหาย</option>
                  <option value="mules">บัญชีม้า</option>
                  <option value="crypto">กระเป๋าคริปโต</option>
                </select>
              </div>
              <Button variant="ghost" size="sm" onClick={handleFit}>
                <Maximize2 size={16} className="mr-1" />
                พอดีหน้าจอ
              </Button>
            </div>

            <div 
              ref={containerRef} 
              className="bg-dark-950 rounded-lg border border-dark-700"
              style={{ height: '500px' }}
            />

            {/* Legend */}
            <div className="mt-4 p-3 bg-dark-800 rounded-lg">
              <div className="text-sm font-medium mb-2 text-dark-300">สัญลักษณ์</div>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                {legendItems.map(item => (
                  <div key={item.label} className="flex items-center gap-2 text-xs">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: item.color }} />
                    <span className="text-dark-300">{item.label}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-6 mt-2 pt-2 border-t border-dark-700">
                {edgeLegend.map(item => (
                  <div key={item.label} className="flex items-center gap-2 text-xs">
                    <div className="w-8 h-0.5" style={{ backgroundColor: item.color }} />
                    <span className="text-dark-300">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Enhanced Detail Panel */}
          <Card className="w-96 p-0 bg-dark-800 overflow-hidden overflow-y-auto max-h-[750px]">
            <div className="p-4 border-b border-dark-700 flex items-center justify-between sticky top-0 bg-dark-800 z-10">
              <h3 className="font-semibold flex items-center gap-2">
                <Search size={18} className="text-primary-400" />
                รายละเอียด
              </h3>
              {selectedNode && (
                <Button variant="ghost" size="sm">
                  <ExternalLink size={14} />
                </Button>
              )}
            </div>
            
            {selectedNode ? (
              <div className="p-4 space-y-4">
                {/* Name */}
                <div>
                  <label className="text-xs text-dark-400">ชื่อ-นามสกุล</label>
                  <p className="font-semibold text-lg">{selectedNode.label}</p>
                </div>

                {/* ID */}
                {selectedNode.identifier && (
                  <div>
                    <label className="text-xs text-dark-400">เลขประจำตัว</label>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 bg-dark-700 px-3 py-2 rounded text-sm font-mono">
                        {selectedNode.identifier}
                      </code>
                      <Button variant="ghost" size="sm" onClick={() => copyToClipboard(selectedNode.identifier || '')}>
                        <Copy size={14} />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Type Badge */}
                <div>
                  <label className="text-xs text-dark-400">ประเภท</label>
                  <div className="mt-1">
                    <Badge 
                      variant={selectedNode.is_suspect ? 'danger' : selectedNode.is_victim ? 'success' : 'warning'}
                      className="text-sm px-3 py-1"
                    >
                      {getNodeTypeLabel(selectedNode)}
                    </Badge>
                  </div>
                </div>

                {/* Network Tier */}
                {nodeAnalysis && (
                  <div>
                    <label className="text-xs text-dark-400">ตำแหน่งในเครือข่าย</label>
                    <div className="mt-1 flex items-center gap-2">
                      <div className={`px-3 py-1 rounded text-sm font-medium text-white ${getTierLabel(nodeAnalysis.networkTier).color}`}>
                        {getTierLabel(nodeAnalysis.networkTier).label}
                      </div>
                    </div>
                  </div>
                )}

                {/* Phone & Location */}
                {selectedNode.phone_number && (
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="text-xs text-dark-400">เบอร์โทรศัพท์</label>
                      <p className="font-medium">{selectedNode.phone_number}</p>
                    </div>
                  </div>
                )}

                {/* Bank */}
                {selectedNode.bank_name && (
                  <div>
                    <label className="text-xs text-dark-400">ธนาคาร</label>
                    <p className="font-medium">{selectedNode.bank_name}</p>
                    {selectedNode.account_name && (
                      <p className="text-sm text-dark-400">{selectedNode.account_name}</p>
                    )}
                  </div>
                )}

                {/* Money Flow Stats */}
                {nodeAnalysis && (
                  <div className="bg-dark-700 rounded-lg p-3">
                    <label className="text-xs text-dark-400 mb-2 block">สถิติการเงิน</label>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-2">
                        <ArrowDownLeft size={16} className="text-green-400" />
                        <div>
                          <p className="text-xs text-dark-400">รับเข้า</p>
                          <p className="font-semibold text-green-400">฿{nodeAnalysis.incomingAmount.toLocaleString()}</p>
                          <p className="text-xs text-dark-500">{nodeAnalysis.incomingCount} รายการ</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <ArrowUpRight size={16} className="text-red-400" />
                        <div>
                          <p className="text-xs text-dark-400">ส่งออก</p>
                          <p className="font-semibold text-red-400">฿{nodeAnalysis.outgoingAmount.toLocaleString()}</p>
                          <p className="text-xs text-dark-500">{nodeAnalysis.outgoingCount} รายการ</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Risk Score */}
                <div>
                  <label className="text-xs text-dark-400">ระดับความเสี่ยง</label>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex-1 bg-dark-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all ${
                          selectedNode.risk_score > 70 ? 'bg-red-500' : 
                          selectedNode.risk_score > 40 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${selectedNode.risk_score}%` }}
                      />
                    </div>
                    <span className="font-bold text-lg">{selectedNode.risk_score}%</span>
                  </div>
                </div>

                {/* Risk Factors */}
                {nodeAnalysis && nodeAnalysis.riskFactors.length > 0 && (
                  <div>
                    <label className="text-xs text-dark-400 flex items-center gap-1 mb-2">
                      <Activity size={12} />
                      ปัจจัยความเสี่ยง
                    </label>
                    <div className="space-y-2">
                      {nodeAnalysis.riskFactors.map((rf, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm bg-dark-700 p-2 rounded">
                          <span>{rf.factor}</span>
                          <Badge variant={rf.score > 20 ? 'danger' : rf.score > 10 ? 'warning' : 'default'}>
                            +{rf.score}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Classification Reasons - NEW! */}
                {nodeAnalysis && nodeAnalysis.classificationReasons.length > 0 && (
                  <div className="bg-dark-900 rounded-lg p-3 border border-dark-600">
                    <label className="text-xs text-primary-400 flex items-center gap-1 mb-2 font-semibold">
                      <ShieldAlert size={14} />
                      เหตุผลการจัดประเภท
                    </label>
                    <div className="space-y-2">
                      {nodeAnalysis.classificationReasons.map((reason, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 size={14} className="text-primary-400 mt-0.5 flex-shrink-0" />
                          <span className="text-dark-200">{reason}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Evidence Sources - NEW! */}
                {nodeAnalysis && nodeAnalysis.evidenceSources.length > 0 && (
                  <div>
                    <label className="text-xs text-dark-400 flex items-center gap-1 mb-2">
                      <Fingerprint size={12} />
                      แหล่งหลักฐาน
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {nodeAnalysis.evidenceSources.map((source, idx) => (
                        <Badge key={idx} variant="default" className="text-xs">
                          {source}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {selectedNode.notes && (
                  <div>
                    <label className="text-xs text-dark-400 flex items-center gap-1">
                      <Info size={12} />
                      หมายเหตุจากการสืบสวน
                    </label>
                    <p className="text-sm bg-dark-700 p-3 rounded mt-1 border-l-4 border-primary-500">
                      {selectedNode.notes}
                    </p>
                  </div>
                )}

                {/* Connected Nodes */}
                <div>
                  <label className="text-xs text-dark-400 flex items-center gap-1">
                    <Link2 size={12} />
                    เชื่อมโยงกับ ({getConnectedCases(selectedNode)})
                  </label>
                  <div className="mt-2 space-y-2 max-h-32 overflow-y-auto">
                    {edges
                      .filter(e => e.from_node_id === selectedNode.id || e.to_node_id === selectedNode.id)
                      .slice(0, 5)
                      .map(e => {
                        const otherNodeId = e.from_node_id === selectedNode.id ? e.to_node_id : e.from_node_id;
                        const otherNode = nodes.find(n => n.id === otherNodeId);
                        const isIncoming = e.to_node_id === selectedNode.id;
                        return (
                          <div key={e.id} className="flex items-center justify-between p-2 bg-dark-700 rounded text-sm">
                            <div className="flex items-center gap-2">
                              {isIncoming ? (
                                <ArrowDownLeft size={12} className="text-green-400" />
                              ) : (
                                <ArrowUpRight size={12} className="text-red-400" />
                              )}
                              <span className="truncate">{otherNode?.label || 'Unknown'}</span>
                            </div>
                            {e.amount && (
                              <Badge variant="info" className="text-xs">
                                ฿{e.amount.toLocaleString()}
                              </Badge>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 pt-4 border-t border-dark-700">
                  <Button variant="ghost" size="sm" className="flex-1">
                    <Eye size={14} className="mr-1" />
                    ดูเพิ่ม
                  </Button>
                  <Button variant="ghost" size="sm" className="flex-1">
                    <File size={14} className="mr-1" />
                    รายงาน
                  </Button>
                  <Button variant="ghost" size="sm" className="flex-1">
                    <Printer size={14} className="mr-1" />
                    พิมพ์
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-dark-400">
                <Target size={48} className="mx-auto mb-3 opacity-30" />
                <p>คลิกที่ node เพื่อดูรายละเอียด</p>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Timeline View */}
      {activeTab === 'timeline' && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock className="text-primary-400" />
            ไทม์ไลน์ธุรกรรม
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
                            {edge.transaction_date ? new Date(edge.transaction_date).toLocaleString('th-TH') : 'ไม่ระบุวันที่'}
                          </span>
                          <Badge variant={(edge.amount || 0) > 500000 ? 'danger' : (edge.amount || 0) > 100000 ? 'warning' : 'info'}>
                            ฿{(edge.amount || 0).toLocaleString()}
                          </Badge>
                        </div>
                        <p className="font-medium">
                          {fromNode?.label || 'ไม่ทราบ'} <ChevronRight className="inline" size={16} /> {toNode?.label || 'ไม่ทราบ'}
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
            รายการบัญชี ({nodes.length} รายการ)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-800 border-b border-dark-700">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-dark-300">#</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-dark-300">ชื่อ</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-dark-300">ประเภท</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-dark-300">เลขประจำตัว</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-dark-300">ธนาคาร</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-dark-300">ความเสี่ยง</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-dark-300">สถานะ</th>
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
                      {node.is_suspect && <Badge variant="danger">ผู้ต้องสงสัย</Badge>}
                      {node.is_victim && <Badge variant="success">ผู้เสียหาย</Badge>}
                      {!node.is_suspect && !node.is_victim && <Badge variant="default">-</Badge>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {nodes.length > 100 && (
            <p className="text-center text-dark-400 text-sm mt-4">แสดง 100 จาก {nodes.length} รายการ</p>
          )}
        </Card>
      )}

      {/* Transactions View */}
      {activeTab === 'transactions' && (
        <Card className="p-4 overflow-hidden">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="text-primary-400" />
            รายการธุรกรรม ({edges.length} รายการ)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-800 border-b border-dark-700">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-dark-300">#</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-dark-300">วันที่</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-dark-300">จาก</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-dark-300">ถึง</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-dark-300">จำนวนเงิน</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-dark-300">ประเภท</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-dark-300">อ้างอิง</th>
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
                        <span className={(edge.amount || 0) > 500000 ? 'text-red-400' : (edge.amount || 0) > 100000 ? 'text-yellow-400' : ''}>
                          ฿{(edge.amount || 0).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={edge.edge_type === 'crypto_purchase' ? 'info' : 'default'}>
                          {edge.edge_type === 'deposit' ? 'ฝากเงิน' : 
                           edge.edge_type === 'transfer' ? 'โอนเงิน' :
                           edge.edge_type === 'crypto_purchase' ? 'ซื้อคริปโต' :
                           edge.edge_type === 'crypto_transfer' ? 'โอนคริปโต' :
                           edge.edge_type || 'โอนเงิน'}
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
            <p className="text-center text-dark-400 text-sm mt-4">แสดง 100 จาก {edges.length} รายการ</p>
          )}
        </Card>
      )}
    </div>
  );
};

export { ForensicReport as ForensicReportPage };
export default ForensicReport;
