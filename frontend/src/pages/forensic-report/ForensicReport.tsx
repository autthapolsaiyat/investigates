/**
 * Forensic Report Page - Court Summary Report
 * Digital Forensic Standard
 */
import { useEffect, useState, useCallback, useRef } from 'react';
import { 
  FileText, Download, Printer, Users, 
  TrendingUp, RefreshCw, Loader2, Clock, ChevronRight,
  List, BarChart3, Volume2, VolumeX, Lightbulb
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
  
  // Summary and TTS states
  const [callCount, setCallCount] = useState(0);
  const [uniquePhones, setUniquePhones] = useState(0);
  const [locationCount, setLocationCount] = useState(0);
  const [uniqueLocations, setUniqueLocations] = useState(0);
  const [cryptoCount, setCryptoCount] = useState(0);
  const [cryptoTransactions, setCryptoTransactions] = useState<any[]>([]);
  const [highRiskCrypto, setHighRiskCrypto] = useState<any[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

  const API_BASE = import.meta.env.VITE_API_URL || 'https://investigates-api.azurewebsites.net/api/v1';

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

  // Fetch additional data for summary
  const fetchSummaryData = useCallback(async () => {
    if (!selectedCaseId) return;
    const token = localStorage.getItem('access_token');
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // Fetch Call Analysis data
    try {
      const callRes = await fetch(`${API_BASE}/call-analysis/case/${selectedCaseId}/network`, { headers });
      if (callRes.ok) {
        const callData = await callRes.json();
        const entities = callData.entities || [];
        const totalCalls = entities.reduce((sum: number, e: { metadata?: { calls?: number } }) => sum + (e.metadata?.calls || 0), 0);
        setCallCount(totalCalls);
        setUniquePhones(entities.length);
      }
    } catch {
      setCallCount(0);
      setUniquePhones(0);
    }

    // Fetch Location data
    try {
      const locRes = await fetch(`${API_BASE}/locations/case/${selectedCaseId}/timeline`, { headers });
      if (locRes.ok) {
        const locData = await locRes.json();
        const validSources = ['gps', 'cell_tower', 'wifi', 'photo'];
        const points = (locData.points || []).filter((p: { source?: string }) => validSources.includes(p.source || ''));
        setLocationCount(points.length);
        const uniqueLocs = new Set(points.map((p: { address?: string; label?: string }) => p.address || p.label)).size;
        setUniqueLocations(uniqueLocs);
      }
    } catch {
      setLocationCount(0);
      setUniqueLocations(0);
    }

    // Fetch Crypto data
    try {
      const cryptoRes = await fetch(`${API_BASE}/crypto/case/${selectedCaseId}/wallets`, { headers });
      if (cryptoRes.ok) {
        const cryptoData = await cryptoRes.json();
        setCryptoCount(cryptoData.length || 0);
      }
      
      // Fetch crypto transactions
      const txRes = await fetch(`${API_BASE}/crypto/case/${selectedCaseId}/transactions`, { headers });
      if (txRes.ok) {
        const txData = await txRes.json();
        setCryptoTransactions(txData || []);
        
        // Filter high-risk (sanctioned, mixer, high score)
        const highRisk = txData.filter((tx: any) => 
          tx.risk_score >= 70 || 
          tx.risk_flag === 'mixer_detected' || 
          tx.risk_flag === 'tornado_cash' ||
          tx.from_label?.toLowerCase().includes('sanction') ||
          tx.to_label?.toLowerCase().includes('sanction') ||
          tx.from_label?.toLowerCase().includes('tornado') ||
          tx.to_label?.toLowerCase().includes('tornado') ||
          tx.from_label?.toLowerCase().includes('mixer') ||
          tx.to_label?.toLowerCase().includes('mixer')
        );
        setHighRiskCrypto(highRisk);
      }
    } catch {
      setCryptoCount(0);
      setCryptoTransactions([]);
      setHighRiskCrypto([]);
    }
  }, [selectedCaseId, API_BASE]);

  useEffect(() => {
    if (selectedCaseId) {
      fetchMoneyFlow();
      fetchSummaryData();
      const selectedCaseData = cases.find(c => c.id === selectedCaseId);
      setSelectedCase(selectedCaseData || null);
    }
  }, [selectedCaseId, cases, fetchMoneyFlow, fetchSummaryData]);

  // Generate summary text
  const generateSummary = (): string => {
    const hasMoneyFlow = stats && (stats.totalNodes > 0 || stats.totalTransactions > 0);
    const hasCalls = callCount > 0;
    const hasLocations = locationCount > 0;
    const hasCrypto = cryptoCount > 0;

    if (!hasMoneyFlow && !hasCalls && !hasLocations && !hasCrypto) {
      return 'ข้อมูลไม่เพียงพอสำหรับการวิเคราะห์ กรุณานำเข้าข้อมูลเพิ่มเติม';
    }

    let summary = 'จากการวิเคราะห์เบื้องต้น: ';

    if (hasMoneyFlow && stats) {
      const highRisk = nodes.filter(n => n.is_suspect);
      if (highRisk.length > 0) {
        summary += `พบผู้ต้องสงสัย ${highRisk.length} ราย `;
      }
      summary += `มี ${stats.totalNodes} บัญชี ${stats.totalTransactions} ธุรกรรม มูลค่ารวม ${formatCurrency(stats.totalAmount)} `;
    }

    if (hasCalls) {
      summary += `การวิเคราะห์การโทรพบ ${uniquePhones} หมายเลข รวม ${callCount} สาย `;
    }

    if (hasLocations) {
      summary += `การติดตามตำแหน่งพบ ${uniqueLocations} สถานที่ จาก ${locationCount} จุดข้อมูล `;
    }

    if (hasCrypto) {
      summary += `ติดตาม ${cryptoCount} กระเป๋าคริปโต `;
      if (highRiskCrypto.length > 0) {
        summary += `⚠️ พบ ${highRiskCrypto.length} รายการเสี่ยงสูง (Mixer/Sanctioned) `;
      }
    }

    summary += 'อย่างไรก็ตาม นี่เป็นการวิเคราะห์เบื้องต้นเท่านั้น แนะนำให้สอบสวนและรวบรวมหลักฐานเพิ่มเติม';
    return summary;
  };

  // Text-to-Speech functions
  const speakSummary = () => {
    if (!('speechSynthesis' in window)) {
      alert('Browser ไม่รองรับ Text-to-Speech');
      return;
    }

    // Stop if already speaking
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const summary = generateSummary();
    const utterance = new SpeechSynthesisUtterance(summary);
    utterance.lang = 'th-TH';
    utterance.rate = 0.9;
    utterance.pitch = 1;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    speechRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  // Cleanup speech on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

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

      {/* High Risk Crypto Alert */}
      {highRiskCrypto.length > 0 && (
        <Card className="p-4 bg-red-500/10 border-red-500/30 border-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-red-400">⚠️ High Risk Crypto Transactions Detected</h3>
              <p className="text-sm text-dark-400">Found {highRiskCrypto.length} transactions involving sanctioned addresses or mixers</p>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-red-500/30">
                  <th className="text-left py-2 px-2 text-red-400">Blockchain</th>
                  <th className="text-left py-2 px-2 text-red-400">From</th>
                  <th className="text-left py-2 px-2 text-red-400">To</th>
                  <th className="text-right py-2 px-2 text-red-400">Amount (USD)</th>
                  <th className="text-center py-2 px-2 text-red-400">Risk</th>
                  <th className="text-left py-2 px-2 text-red-400">Flag</th>
                </tr>
              </thead>
              <tbody>
                {highRiskCrypto.slice(0, 10).map((tx, idx) => (
                  <tr key={idx} className="border-b border-dark-700 hover:bg-red-500/5">
                    <td className="py-2 px-2">
                      <span className="uppercase text-xs px-2 py-1 bg-dark-700 rounded">
                        {tx.blockchain}
                      </span>
                    </td>
                    <td className="py-2 px-2">
                      <div className="flex flex-col">
                        <span className="font-mono text-xs">
                          {tx.from_address?.substring(0, 10)}...
                        </span>
                        {tx.from_label && (
                          <span className={`text-xs ${
                            tx.from_label.toLowerCase().includes('sanction') || 
                            tx.from_label.toLowerCase().includes('tornado') ||
                            tx.from_label.toLowerCase().includes('mixer')
                              ? 'text-red-400 font-bold' : 'text-primary-400'
                          }`}>
                            {tx.from_label}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2 px-2">
                      <div className="flex flex-col">
                        <span className="font-mono text-xs">
                          {tx.to_address?.substring(0, 10)}...
                        </span>
                        {tx.to_label && (
                          <span className={`text-xs ${
                            tx.to_label.toLowerCase().includes('sanction') || 
                            tx.to_label.toLowerCase().includes('tornado') ||
                            tx.to_label.toLowerCase().includes('mixer')
                              ? 'text-red-400 font-bold' : 'text-primary-400'
                          }`}>
                            {tx.to_label}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2 px-2 text-right text-green-400 font-medium">
                      ${(tx.amount_usd || 0).toLocaleString()}
                    </td>
                    <td className="py-2 px-2 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        tx.risk_score >= 90 ? 'bg-red-500 text-white' :
                        tx.risk_score >= 70 ? 'bg-red-500/50 text-red-200' :
                        'bg-yellow-500/50 text-yellow-200'
                      }`}>
                        {tx.risk_score || 0}
                      </span>
                    </td>
                    <td className="py-2 px-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        tx.risk_flag === 'mixer_detected' || tx.risk_flag === 'tornado_cash' 
                          ? 'bg-purple-500/30 text-purple-300' 
                          : tx.risk_flag === 'sanctioned'
                          ? 'bg-red-500/30 text-red-300'
                          : 'bg-yellow-500/30 text-yellow-300'
                      }`}>
                        {tx.risk_flag === 'mixer_detected' ? '🌀 Mixer' :
                         tx.risk_flag === 'tornado_cash' ? '🌪️ Tornado Cash' :
                         tx.risk_flag === 'sanctioned' ? '🚨 OFAC' :
                         '⚠️ High Risk'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {highRiskCrypto.length > 10 && (
            <p className="text-sm text-dark-400 mt-3 text-center">
              ... and {highRiskCrypto.length - 10} more high-risk transactions
            </p>
          )}
        </Card>
      )}

      {/* AI Summary Card */}
      {selectedCaseId && (
        <Card className="p-4 bg-gradient-to-r from-primary-500/10 to-purple-500/10 border-primary-500/30">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-primary-500/20 rounded-lg">
              <Lightbulb size={24} className="text-primary-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-primary-400 flex items-center gap-2">
                  📝 ข้อสังเกตจากการวิเคราะห์
                </h3>
                <Button
                  variant={isSpeaking ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={speakSummary}
                  className="flex items-center gap-2"
                >
                  {isSpeaking ? (
                    <>
                      <VolumeX size={16} />
                      <span>หยุด</span>
                    </>
                  ) : (
                    <>
                      <Volume2 size={16} />
                      <span>ฟังสรุป</span>
                    </>
                  )}
                </Button>
              </div>
              <p className="text-dark-300 leading-relaxed">
                {generateSummary()}
              </p>
              <p className="text-xs text-dark-500 mt-3 italic">
                * นี่เป็นการวิเคราะห์เบื้องต้นจากรูปแบบธุรกรรมเท่านั้น ไม่ใช่ข้อสรุปของคดี
              </p>
            </div>
          </div>
        </Card>
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
