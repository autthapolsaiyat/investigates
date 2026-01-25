/**
 * Forensic Report V2 - Criminal Network Analysis Report
 * Digital Forensic Standard for Court
 * Features: Risk Score Analysis, PDF Export, Auto Summary, Network Graph, QR Code Chain of Custody
 */
import { useEffect, useState, useCallback, useRef } from 'react';
import { 
  FileText, Download, Printer, Users, TrendingUp, RefreshCw, Loader2, 
  AlertTriangle, Phone, Wallet, Building2, Shield, ChevronRight,
  Target, ArrowRightLeft, Globe, Shuffle, CheckCircle, Network, QrCode, Lock, Fingerprint
} from 'lucide-react';
import { Button, Card, Badge } from '../../components/ui';
import { casesAPI, moneyFlowAPI, evidenceAPI } from '../../services/api';
import type { Case, MoneyFlowNode, MoneyFlowEdge, Evidence } from '../../services/api';
import { ForensicReportGraph } from './ForensicReportGraph';

// ==================== TYPES ====================
interface RiskFactor {
  factor: string;
  score: number;
  description: string;
}

interface ParsedMetadata {
  riskFactors?: RiskFactor[];
  sources?: string[];
  totalReceived?: number;
  totalSent?: number;
  transactionCount?: number;
  callCount?: number;
  callDuration?: number;
  usedMixer?: boolean;
  foreignTransfer?: boolean;
  role?: string;
}

interface HighRiskPerson {
  node: MoneyFlowNode;
  riskScore: number;
  riskFactors: RiskFactor[];
  metadata: ParsedMetadata;
}

interface KeyTransaction {
  edge: MoneyFlowEdge;
  fromNode: MoneyFlowNode | undefined;
  toNode: MoneyFlowNode | undefined;
  importance: 'critical' | 'high' | 'medium';
  reason: string;
}

interface Statistics {
  totalNodes: number;
  persons: number;
  bankAccounts: number;
  phones: number;
  cryptoWallets: number;
  totalTransactions: number;
  totalAmount: number;
  suspects: number;
  victims: number;
  highRiskCount: number;
}

// ==================== HELPERS ====================
const formatCurrency = (amount: number): string => {
  if (amount >= 1000000) return `฿${(amount / 1000000).toFixed(2)}M`;
  if (amount >= 1000) return `฿${(amount / 1000).toFixed(1)}K`;
  return `฿${amount.toLocaleString()}`;
};

const formatDate = (date: string | null | undefined): string => {
  if (!date) return 'Not specified';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  });
};

const parseMetadata = (metadataStr: string | undefined): ParsedMetadata => {
  if (!metadataStr) return {};
  try {
    return JSON.parse(metadataStr);
  } catch {
    return {};
  }
};

const getNodeTypeIcon = (type: string) => {
  switch (type) {
    case 'person': return <Users className="w-4 h-4" />;
    case 'bank_account': return <Building2 className="w-4 h-4" />;
    case 'phone': return <Phone className="w-4 h-4" />;
    case 'crypto_wallet': return <Wallet className="w-4 h-4" />;
    default: return <Target className="w-4 h-4" />;
  }
};

const getRiskColor = (score: number): string => {
  if (score >= 70) return 'text-red-400 bg-red-500/20 border-red-500/30';
  if (score >= 40) return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
  return 'text-green-400 bg-green-500/20 border-green-500/30';
};

// ==================== COMPONENT ====================
export const ForensicReportV2 = () => {
  const [cases, setCases] = useState<Case[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<number | null>(null);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [nodes, setNodes] = useState<MoneyFlowNode[]>([]);
  const [edges, setEdges] = useState<MoneyFlowEdge[]>([]);
  const [evidences, setEvidences] = useState<Evidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [stats, setStats] = useState<Statistics | null>(null);
  const [highRiskPersons, setHighRiskPersons] = useState<HighRiskPerson[]>([]);
  const [keyTransactions, setKeyTransactions] = useState<KeyTransaction[]>([]);
  const [showGraph, setShowGraph] = useState(true);
  const [showChainOfCustody, setShowChainOfCustody] = useState(true);
  const reportRef = useRef<HTMLDivElement>(null);

  // Fetch cases
  useEffect(() => {
    const fetchCases = async () => {
      try {
        const response = await casesAPI.list({ page: 1, page_size: 100 });
        setCases(response.items);
        if (response.items.length > 0) {
          const latestCase = response.items[0];
          setSelectedCaseId(latestCase.id);
          setSelectedCase(latestCase);
        }
      } catch (err) {
        console.error('Failed to fetch cases:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCases();
  }, []);

  // Fetch money flow data and evidences
  const fetchData = useCallback(async () => {
    if (!selectedCaseId || !selectedCase) return;
    try {
      setLoading(true);
      const [nodesRes, edgesRes] = await Promise.all([
        moneyFlowAPI.listNodes(selectedCaseId),
        moneyFlowAPI.listEdges(selectedCaseId)
      ]);
      setNodes(nodesRes);
      setEdges(edgesRes);
      analyzeData(nodesRes, edgesRes);
      
      // Fetch evidences for Chain of Custody
      try {
        const evidencesRes = await evidenceAPI.listByCase(selectedCaseId);
        setEvidences(evidencesRes);
      } catch {
        // If evidences fetch fails, just set empty array
        setEvidences([]);
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedCaseId, selectedCase]);

  useEffect(() => {
    if (selectedCaseId) {
      fetchData();
      const caseData = cases.find(c => c.id === selectedCaseId);
      setSelectedCase(caseData || null);
    }
  }, [selectedCaseId, cases, fetchData]);

  // Analyze data
  const analyzeData = (nodeList: MoneyFlowNode[], edgeList: MoneyFlowEdge[]) => {
    // Calculate statistics
    const totalAmount = edgeList.reduce((sum, e) => sum + (e.amount || 0), 0);
    const newStats: Statistics = {
      totalNodes: nodeList.length,
      persons: nodeList.filter(n => n.node_type === 'person').length,
      bankAccounts: nodeList.filter(n => n.node_type === 'bank_account').length,
      phones: nodeList.filter(n => n.node_type === 'phone').length,
      cryptoWallets: nodeList.filter(n => n.node_type === 'crypto_wallet').length,
      totalTransactions: edgeList.length,
      totalAmount,
      suspects: nodeList.filter(n => n.is_suspect).length,
      victims: nodeList.filter(n => n.is_victim).length,
      highRiskCount: nodeList.filter(n => (n.risk_score || 0) >= 70).length
    };
    setStats(newStats);

    // Find high risk persons
    const highRisk: HighRiskPerson[] = nodeList
      .filter(n => (n.risk_score || 0) >= 40)
      .sort((a, b) => (b.risk_score || 0) - (a.risk_score || 0))
      .slice(0, 10)
      .map(node => {
        const metadata = parseMetadata(node.metadata);
        return {
          node,
          riskScore: node.risk_score || 0,
          riskFactors: metadata.riskFactors || [],
          metadata
        };
      });
    setHighRiskPersons(highRisk);

    // Find key transactions
    const keyTx: KeyTransaction[] = edgeList
      .filter(e => (e.amount || 0) > 50000)
      .sort((a, b) => (b.amount || 0) - (a.amount || 0))
      .slice(0, 15)
      .map(edge => {
        const fromNode = nodeList.find(n => n.id === edge.from_node_id);
        const toNode = nodeList.find(n => n.id === edge.to_node_id);
        const amount = edge.amount || 0;
        
        let importance: 'critical' | 'high' | 'medium' = 'medium';
        let reason = 'Normal transaction';
        
        if (amount >= 500000) {
          importance = 'critical';
          reason = 'Abnormally high amount';
        } else if (amount >= 200000) {
          importance = 'high';
          reason = 'High amount';
        }
        
        if (toNode?.label?.includes('Mixer') || toNode?.label?.includes('mixer')) {
          importance = 'critical';
          reason = 'Transfer to Mixer (hiding trail)';
        }
        if (toNode?.label?.includes('Cambodia') || toNode?.label?.includes('Myanmar') || toNode?.label?.includes('Laos')) {
          importance = 'critical';
          reason = 'Transfer overseas';
        }
        if (toNode?.node_type === 'crypto_wallet' && fromNode?.node_type === 'bank_account') {
          importance = 'high';
          reason = 'Exchange to Crypto';
        }

        return { edge, fromNode, toNode, importance, reason };
      });
    setKeyTransactions(keyTx);
  };

  // Generate auto summary
  const generateSummary = (): string => {
    if (!stats || highRiskPersons.length === 0) return '';
    
    const mainSuspect = highRiskPersons[0];
    const hasNetworkMembers = highRiskPersons.length > 1;
    const hasCrypto = stats.cryptoWallets > 0;
    const hasMixer = keyTransactions.some(t => t.reason.includes('Mixer'));
    const hasForeign = keyTransactions.some(t => t.reason.includes('overseas'));
    
    let summary = `From preliminary transaction pattern analysis, interesting observations show that "${mainSuspect.node.label}" (Risk Score: ${mainSuspect.riskScore}) may have a key role in this network`;
    
    if (hasNetworkMembers) {
      summary += ` with potentially related persons: ${highRiskPersons.length - 1} person(s)`;
    }
    
    summary += ` Total transaction value approximately ${formatCurrency(stats.totalAmount)}`;
    
    if (hasCrypto) {
      summary += ` Cryptocurrency usage observed in transfers`;
    }
    
    if (hasMixer) {
      summary += ` and patterns suggesting Mixer usage`;
    }
    
    if (hasForeign) {
      summary += ` including Transactions possibly involving overseas`;
    }
    
    summary += ` However, this data is only an analysis from transaction patterns. Further investigation and evidence collection is recommended to confirm the facts`;
    
    return summary;
  };

  // Export to PDF
  const exportToPDF = async () => {
    setExporting(true);
    try {
      // Use browser print functionality
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('Please allow popup');
        return;
      }
      
      const content = `
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <title>Network Analysis Report - ${selectedCase?.case_number}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap');
    * { font-family: 'Sarabun', sans-serif; margin: 0; padding: 0; box-sizing: border-box; }
    body { padding: 40px; color: #1a1a1a; line-height: 1.6; }
    h1 { text-align: center; font-size: 24px; margin-bottom: 10px; color: #1e40af; }
    h2 { font-size: 18px; margin: 25px 0 15px; padding-bottom: 5px; border-bottom: 2px solid #3b82f6; color: #1e40af; }
    h3 { font-size: 14px; margin: 15px 0 10px; color: #374151; }
    .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px double #1e40af; }
    .header p { color: #6b7280; font-size: 14px; }
    .meta { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 20px; font-size: 13px; }
    .meta-item { padding: 8px 12px; background: #f3f4f6; border-radius: 4px; }
    .meta-label { color: #6b7280; }
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 25px; }
    .stat-card { text-align: center; padding: 15px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; }
    .stat-value { font-size: 28px; font-weight: 700; color: #1e40af; }
    .stat-label { font-size: 12px; color: #6b7280; margin-top: 5px; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 13px; }
    th, td { padding: 10px; text-align: left; border: 1px solid #e2e8f0; }
    th { background: #f1f5f9; font-weight: 600; }
    tr:nth-child(even) { background: #f8fafc; }
    .risk-high { color: #dc2626; font-weight: 700; }
    .risk-medium { color: #f59e0b; font-weight: 600; }
    .risk-low { color: #16a34a; }
    .critical { background: #fef2f2; border-left: 4px solid #dc2626; }
    .high { background: #fffbeb; border-left: 4px solid #f59e0b; }
    .summary { padding: 20px; background: #eff6ff; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #6b7280; }
    .signature { display: grid; grid-template-columns: repeat(2, 1fr); gap: 40px; margin-top: 40px; }
    .signature-box { text-align: center; padding-top: 60px; border-top: 1px solid #374151; }
    @media print {
      body { padding: 20px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🔍 Financial Network Analysis Report</h1>
    <p>Royal Thai Police - Digital Forensic Standard</p>
  </div>

  <div class="meta">
    <div class="meta-item"><span class="meta-label">Case Number:</span> ${selectedCase?.case_number || '-'}</div>
    <div class="meta-item"><span class="meta-label">Case Title:</span> ${selectedCase?.title || '-'}</div>
    <div class="meta-item"><span class="meta-label">Analysis Date:</span> ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
    <div class="meta-item"><span class="meta-label">Analyst:</span> ${localStorage.getItem('user_email') || 'Not specified'}</div>
  </div>

  <h2>📊 Analysis Summary</h2>
  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-value">${stats?.persons || 0}</div>
      <div class="stat-label">Related Persons</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${stats?.bankAccounts || 0}</div>
      <div class="stat-label">Bank Accounts</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${stats?.totalTransactions || 0}</div>
      <div class="stat-label">Total Transactions</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${formatCurrency(stats?.totalAmount || 0)}</div>
      <div class="stat-label">Total Value</div>
    </div>
  </div>

  <h2>🔴 High Risk Persons</h2>
  <table>
    <thead>
      <tr>
        <th style="width: 5%">#</th>
        <th style="width: 25%">Name</th>
        <th style="width: 12%">Risk Score</th>
        <th>Risk Factors</th>
      </tr>
    </thead>
    <tbody>
      ${highRiskPersons.map((p, i) => `
        <tr>
          <td>${i + 1}</td>
          <td><strong>${p.node.label}</strong></td>
          <td class="${p.riskScore >= 70 ? 'risk-high' : p.riskScore >= 40 ? 'risk-medium' : 'risk-low'}">${p.riskScore}</td>
          <td>${p.riskFactors.map(f => `• ${f.factor}`).join('<br>') || '-'}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <h2>💰 Key Transactions</h2>
  <table>
    <thead>
      <tr>
        <th style="width: 5%">#</th>
        <th style="width: 20%">From</th>
        <th style="width: 20%">To</th>
        <th style="width: 15%">Amount</th>
        <th style="width: 15%">Date</th>
        <th>Notes</th>
      </tr>
    </thead>
    <tbody>
      ${keyTransactions.slice(0, 10).map((t, i) => `
        <tr class="${t.importance}">
          <td>${i + 1}</td>
          <td>${t.fromNode?.label || '-'}</td>
          <td>${t.toNode?.label || '-'}</td>
          <td><strong>${formatCurrency(t.edge.amount || 0)}</strong></td>
          <td>${formatDate(t.edge.transaction_date)}</td>
          <td>${t.reason}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <h2>📝 Observations from Analysis (Requires Further Investigation)</h2>
  <div class="summary">
    <p>${generateSummary()}</p>
    <p style="font-size: 11px; color: #6b7280; margin-top: 15px; font-style: italic;">* This is a preliminary analysis from transaction patterns only. This is not a case conclusion. Further investigation and evidence collection should be conducted</p>
  </div>

  <h2>🔐 Chain of Custody - Digital Evidence</h2>
  <div style="display: grid; grid-template-columns: 180px 1fr; gap: 20px; margin-bottom: 20px;">
    <div style="text-align: center; padding: 15px; background: #fff; border: 2px solid #e2e8f0; border-radius: 12px;">
      <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`https://wonderful-wave-0486dd100.6.azurestaticapps.net/verify?case=${selectedCase?.case_number}`)}" alt="QR Code" style="width: 140px; height: 140px;" />
      <p style="font-size: 10px; color: #6b7280; margin-top: 8px;">Scan to verify evidence</p>
    </div>
    <div>
      <h3 style="margin-bottom: 10px;">Recorded Evidence (${evidences.length} items)</h3>
      <table style="font-size: 11px;">
        <thead>
          <tr>
            <th style="width: 5%">#</th>
            <th style="width: 35%">Filename</th>
            <th style="width: 45%">SHA-256 Hash</th>
            <th style="width: 15%">Date Recorded</th>
          </tr>
        </thead>
        <tbody>
          ${evidences.length > 0 ? evidences.map((ev, i) => `
            <tr>
              <td>${i + 1}</td>
              <td>${ev.file_name}</td>
              <td style="font-family: monospace; font-size: 9px;">${ev.sha256_hash}</td>
              <td>${new Date(ev.collected_at).toLocaleDateString('en-US')}</td>
            </tr>
          `).join('') : '<tr><td colspan="4" style="text-align: center; color: #9ca3af;">No evidence recorded yet</td></tr>'}
        </tbody>
      </table>
      ${evidences.length > 0 ? `
        <div style="margin-top: 10px; padding: 10px; background: #ecfdf5; border: 1px solid #10b981; border-radius: 6px; font-size: 11px; color: #047857;">
          ✅ All evidence recorded with SHA-256 Hash for court verification
        </div>
      ` : ''}
    </div>
  </div>

  <div class="footer">
    <p>Report generated by InvestiGate - Date ${new Date().toLocaleString('en-US')}</p>
  </div>

  <div class="signature">
    <div class="signature-box">
      <p>Signature ........................................</p>
      <p>( ......................................... )</p>
      <p>Investigator</p>
    </div>
    <div class="signature-box">
      <p>Signature ........................................</p>
      <p>( ......................................... )</p>
      <p>Supervisor</p>
    </div>
  </div>

  <script>
    window.onload = function() { window.print(); }
  </script>
</body>
</html>
      `;
      
      printWindow.document.write(content);
      printWindow.document.close();
    } catch (err) {
      console.error('Export failed:', err);
      alert('Error generating PDF');
    } finally {
      setExporting(false);
    }
  };

  if (loading && cases.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-dark-900">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 bg-dark-900 min-h-screen" ref={reportRef}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <FileText className="text-primary-500" />
            Forensic Report
            <span className="px-2 py-0.5 bg-primary-500/20 text-primary-400 text-xs rounded">v2</span>
          </h1>
          <p className="text-dark-400 mt-1">Network Analysis Report - Digital Forensic Standard</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={fetchData} disabled={loading}>
            <RefreshCw size={18} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="secondary" onClick={exportToPDF} disabled={exporting || !stats}>
            <Printer size={18} className="mr-2" />
            Print
          </Button>
          <Button onClick={exportToPDF} disabled={exporting || !stats}>
            {exporting ? <Loader2 size={18} className="mr-2 animate-spin" /> : <Download size={18} className="mr-2" />}
            Export PDF
          </Button>
        </div>
      </div>

      {/* Case Selector */}
      <Card className="p-4 mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-sm text-dark-400">Select Case:</label>
            <select
              className="bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 min-w-[300px]"
              value={selectedCaseId || ''}
              onChange={(e) => setSelectedCaseId(Number(e.target.value))}
            >
              <option value="">-- Select Case --</option>
              {cases.map(c => (
                <option key={c.id} value={c.id}>{c.case_number} - {c.title}</option>
              ))}
            </select>
          </div>
          {selectedCase && (
            <>
              <Badge variant="info">{selectedCase.status}</Badge>
              <span className="text-sm text-dark-400">
                Created: {formatDate(selectedCase.created_at)}
              </span>
            </>
          )}
        </div>
      </Card>

      {stats ? (
        <>
          {/* Statistics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-6">
            {[
              { label: 'Person', value: stats.persons, icon: Users, color: 'text-blue-400' },
              { label: 'Accounts', value: stats.bankAccounts, icon: Building2, color: 'text-green-400' },
              { label: 'Phone', value: stats.phones, icon: Phone, color: 'text-yellow-400' },
              { label: 'Crypto', value: stats.cryptoWallets, icon: Wallet, color: 'text-purple-400' },
              { label: 'Suspect', value: stats.suspects, icon: Target, color: 'text-red-400' },
              { label: 'Victim', value: stats.victims, icon: Shield, color: 'text-cyan-400' },
              { label: 'Transactions', value: stats.totalTransactions, icon: ArrowRightLeft, color: 'text-amber-400' },
              { label: 'High Risk', value: stats.highRiskCount, icon: AlertTriangle, color: 'text-red-400' },
            ].map((stat, i) => (
              <Card key={i} className="p-3 text-center">
                <stat.icon className={`w-5 h-5 mx-auto mb-1 ${stat.color}`} />
                <div className="text-xl font-bold text-white">{stat.value}</div>
                <div className="text-xs text-dark-400">{stat.label}</div>
              </Card>
            ))}
          </div>

          {/* Total Amount */}
          <Card className="p-4 mb-6 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-amber-400" />
                <div>
                  <p className="text-sm text-dark-400">Total Transaction Value</p>
                  <p className="text-3xl font-bold text-amber-400">{formatCurrency(stats.totalAmount)}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Network Graph Section */}
          <Card className="mb-6">
            <div className="flex items-center justify-between p-4 border-b border-dark-700">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Network className="text-primary-400" />
                Network Diagram (Network Diagram)
              </h3>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowGraph(!showGraph)}
              >
                {showGraph ? 'Hide' : 'Show'}
              </Button>
            </div>
            {showGraph && nodes.length > 0 && (
              <div style={{ height: '500px' }}>
                <ForensicReportGraph
                  nodes={nodes}
                  edges={edges}
                  onNodeClick={() => {}}
                />
              </div>
            )}
            {showGraph && nodes.length === 0 && (
              <div className="p-8 text-center text-dark-400">
                No network data
              </div>
            )}
          </Card>

          {/* Chain of Custody - QR Code Section */}
          <Card className="p-4 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Lock className="text-green-400" />
                Chain of Custody - Digital Evidence
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowChainOfCustody(!showChainOfCustody)}
              >
                {showChainOfCustody ? 'Hide' : 'Show'}
              </Button>
            </div>
            
            {showChainOfCustody && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* QR Code */}
                <div className="flex flex-col items-center justify-center p-4 bg-white rounded-xl">
                  {selectedCase && (
                    <>
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`https://wonderful-wave-0486dd100.6.azurestaticapps.net/verify?case=${selectedCase.case_number}`)}`}
                        alt="QR Code"
                        className="w-44 h-44 mb-3"
                      />
                      <p className="text-xs text-gray-600 text-center">
                        Scan to verify evidence
                      </p>
                    </>
                  )}
                </div>
                
                {/* Evidence List */}
                <div className="lg:col-span-2">
                  <div className="flex items-center gap-2 mb-3">
                    <QrCode className="text-primary-400" size={18} />
                    <span className="font-medium">Recorded Evidence ({evidences.length} items)</span>
                  </div>
                  
                  {evidences.length > 0 ? (
                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                      {evidences.map((ev, idx) => (
                        <div key={ev.id} className="flex items-center gap-3 p-2 bg-dark-900/50 rounded-lg border border-dark-700">
                          <span className="text-xs text-dark-500 w-5">{idx + 1}.</span>
                          <FileText size={16} className="text-primary-400 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{ev.file_name}</p>
                            <div className="flex items-center gap-2 text-xs text-dark-400">
                              <Fingerprint size={10} />
                              <code className="truncate">{ev.sha256_hash.substring(0, 24)}...</code>
                            </div>
                          </div>
                          <div className="text-right text-xs text-dark-400">
                            <p>{ev.records_count} records</p>
                            <p>{new Date(ev.collected_at).toLocaleDateString('en-US')}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-dark-400 bg-dark-900/30 rounded-lg">
                      <Shield size={24} className="mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No evidence recorded yet</p>
                      <p className="text-xs mt-1">Import data via Smart Import to record Chain of Custody</p>
                    </div>
                  )}
                  
                  {evidences.length > 0 && (
                    <div className="mt-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                      <div className="flex items-center gap-2 text-green-400 text-sm">
                        <CheckCircle size={16} />
                        <span>All evidence recorded with SHA-256 Hash for verification</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </Card>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* High Risk Persons */}
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <AlertTriangle className="text-red-400" />
                High Risk Persons
              </h3>
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {highRiskPersons.length > 0 ? highRiskPersons.map((person, idx) => (
                  <div key={person.node.id} className={`p-3 rounded-lg border ${getRiskColor(person.riskScore)}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-dark-400">#{idx + 1}</span>
                        {getNodeTypeIcon(person.node.node_type)}
                        <span className="font-semibold">{person.node.label}</span>
                      </div>
                      <Badge variant={person.riskScore >= 70 ? 'danger' : 'warning'}>
                        Risk: {person.riskScore}
                      </Badge>
                    </div>
                    {person.riskFactors.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {person.riskFactors.map((f, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs">
                            <ChevronRight className="w-3 h-3" />
                            <span>{f.factor}</span>
                            <span className="text-dark-500">({f.description})</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )) : (
                  <p className="text-dark-400 text-center py-4">No high-risk persons found</p>
                )}
              </div>
            </Card>

            {/* Key Transactions */}
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="text-amber-400" />
                Key Transactions
              </h3>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {keyTransactions.length > 0 ? keyTransactions.map((tx, idx) => (
                  <div key={tx.edge.id} className={`p-3 rounded-lg border ${
                    tx.importance === 'critical' ? 'bg-red-500/10 border-red-500/30' :
                    tx.importance === 'high' ? 'bg-yellow-500/10 border-yellow-500/30' :
                    'bg-dark-800 border-dark-700'
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-dark-400">#{idx + 1}</span>
                      <span className="font-bold text-amber-400">{formatCurrency(tx.edge.amount || 0)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="truncate max-w-[120px]">{tx.fromNode?.label || '-'}</span>
                      <ChevronRight className="w-4 h-4 text-dark-500 flex-shrink-0" />
                      <span className="truncate max-w-[120px]">{tx.toNode?.label || '-'}</span>
                    </div>
                    <div className="flex items-center justify-between mt-1 text-xs">
                      <span className="text-dark-400">{formatDate(tx.edge.transaction_date)}</span>
                      <span className={tx.importance === 'critical' ? 'text-red-400' : tx.importance === 'high' ? 'text-yellow-400' : 'text-dark-400'}>
                        {tx.reason}
                      </span>
                    </div>
                  </div>
                )) : (
                  <p className="text-dark-400 text-center py-4">No significant transactions found</p>
                )}
              </div>
            </Card>
          </div>

          {/* Auto Summary */}
          <Card className="p-4 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-blue-500/30">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <CheckCircle className="text-blue-400" />
              Observations from Analysis (Auto Generated)
            </h3>
            <p className="text-dark-300 leading-relaxed">{generateSummary() || 'Please select a case with data to generate summary'}</p>
            <p className="text-xs text-dark-500 mt-3 italic">* This is a preliminary analysis from transaction patterns only. This is not a case conclusion. Further investigation and evidence collection should be conducted</p>
          </Card>

          {/* Risk Indicators Legend */}
          <Card className="p-4 mt-6">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Shield className="text-primary-400 w-4 h-4" />
              Risk Indicators (Risk Indicators)
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 text-xs">
              {[
                { icon: Target, label: 'Main Suspect', score: '+30' },
                { icon: TrendingUp, label: 'Received money >฿500K', score: '+25' },
                { icon: Shuffle, label: 'Uses Crypto Mixer', score: '+20' },
                { icon: Globe, label: 'Transfer overseas', score: '+15' },
                { icon: ArrowRightLeft, label: 'Frequent transactions (>10)', score: '+10' },
                { icon: Phone, label: 'Frequent calls (>20)', score: '+10' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 bg-dark-800 rounded-lg p-2">
                  <item.icon className="w-4 h-4 text-primary-400" />
                  <span className="text-dark-300">{item.label}</span>
                  <span className="text-amber-400 ml-auto">{item.score}</span>
                </div>
              ))}
            </div>
          </Card>
        </>
      ) : (
        <Card className="p-8 text-center">
          <FileText className="w-12 h-12 text-dark-600 mx-auto mb-4" />
          <p className="text-dark-400">Select a case to view report</p>
        </Card>
      )}
    </div>
  );
};

export default ForensicReportV2;
