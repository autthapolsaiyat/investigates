/**
 * Forensic Report V2 - รายงานวิเคราะห์เครือข่ายอาชญากรรม
 * มาตรฐาน Digital Forensic สำหรับส่งศาล
 * Features: Risk Score Analysis, PDF Export, Auto Summary, Network Graph
 */
import { useEffect, useState, useCallback, useRef } from 'react';
import { 
  FileText, Download, Printer, Users, TrendingUp, RefreshCw, Loader2, 
  AlertTriangle, Phone, Wallet, Building2, Shield, ChevronRight,
  Target, ArrowRightLeft, Globe, Shuffle, CheckCircle, Network
} from 'lucide-react';
import { Button, Card, Badge } from '../../components/ui';
import { casesAPI, moneyFlowAPI } from '../../services/api';
import type { Case, MoneyFlowNode, MoneyFlowEdge } from '../../services/api';
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
  if (!date) return 'ไม่ระบุ';
  return new Date(date).toLocaleDateString('th-TH', {
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
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [stats, setStats] = useState<Statistics | null>(null);
  const [highRiskPersons, setHighRiskPersons] = useState<HighRiskPerson[]>([]);
  const [keyTransactions, setKeyTransactions] = useState<KeyTransaction[]>([]);
  const [showGraph, setShowGraph] = useState(true);
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

  // Fetch money flow data
  const fetchData = useCallback(async () => {
    if (!selectedCaseId) return;
    try {
      setLoading(true);
      const [nodesRes, edgesRes] = await Promise.all([
        moneyFlowAPI.listNodes(selectedCaseId),
        moneyFlowAPI.listEdges(selectedCaseId)
      ]);
      setNodes(nodesRes);
      setEdges(edgesRes);
      analyzeData(nodesRes, edgesRes);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedCaseId]);

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
        let reason = 'ธุรกรรมปกติ';
        
        if (amount >= 500000) {
          importance = 'critical';
          reason = 'ยอดสูงผิดปกติ';
        } else if (amount >= 200000) {
          importance = 'high';
          reason = 'ยอดสูง';
        }
        
        if (toNode?.label?.includes('Mixer') || toNode?.label?.includes('mixer')) {
          importance = 'critical';
          reason = 'โอนเข้า Mixer (ปกปิดร่องรอย)';
        }
        if (toNode?.label?.includes('Cambodia') || toNode?.label?.includes('Myanmar') || toNode?.label?.includes('Laos')) {
          importance = 'critical';
          reason = 'โอนออกต่างประเทศ';
        }
        if (toNode?.node_type === 'crypto_wallet' && fromNode?.node_type === 'bank_account') {
          importance = 'high';
          reason = 'แลกเป็น Crypto';
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
    const hasForeign = keyTransactions.some(t => t.reason.includes('ต่างประเทศ'));
    
    let summary = `จากการวิเคราะห์ข้อมูลพบว่า "${mainSuspect.node.label}" (Risk Score: ${mainSuspect.riskScore}) เป็นศูนย์กลางของเครือข่าย`;
    
    if (hasNetworkMembers) {
      summary += ` มีผู้ร่วมขบวนการ ${highRiskPersons.length - 1} คน`;
    }
    
    summary += ` มูลค่าธุรกรรมรวม ${formatCurrency(stats.totalAmount)}`;
    
    if (hasCrypto) {
      summary += ` มีการใช้ Crypto ในการโอนเงิน`;
    }
    
    if (hasMixer) {
      summary += ` พบการใช้ Mixer เพื่อปกปิดร่องรอย`;
    }
    
    if (hasForeign) {
      summary += ` และมีการโอนเงินออกนอกประเทศ`;
    }
    
    return summary;
  };

  // Export to PDF
  const exportToPDF = async () => {
    setExporting(true);
    try {
      // Use browser print functionality
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('กรุณาอนุญาตให้เปิด popup');
        return;
      }
      
      const content = `
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <title>รายงานวิเคราะห์เครือข่าย - ${selectedCase?.case_number}</title>
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
    <h1>🔍 รายงานการวิเคราะห์เครือข่ายการเงิน</h1>
    <p>สำนักงานตำรวจแห่งชาติ - มาตรฐาน Digital Forensic</p>
  </div>

  <div class="meta">
    <div class="meta-item"><span class="meta-label">เลขคดี:</span> ${selectedCase?.case_number || '-'}</div>
    <div class="meta-item"><span class="meta-label">ชื่อคดี:</span> ${selectedCase?.title || '-'}</div>
    <div class="meta-item"><span class="meta-label">วันที่วิเคราะห์:</span> ${new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
    <div class="meta-item"><span class="meta-label">ผู้วิเคราะห์:</span> ${localStorage.getItem('user_email') || 'ไม่ระบุ'}</div>
  </div>

  <h2>📊 สรุปผลการวิเคราะห์</h2>
  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-value">${stats?.persons || 0}</div>
      <div class="stat-label">บุคคลที่เกี่ยวข้อง</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${stats?.bankAccounts || 0}</div>
      <div class="stat-label">บัญชีธนาคาร</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${stats?.totalTransactions || 0}</div>
      <div class="stat-label">ธุรกรรมทั้งหมด</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${formatCurrency(stats?.totalAmount || 0)}</div>
      <div class="stat-label">มูลค่ารวม</div>
    </div>
  </div>

  <h2>🔴 บุคคลเสี่ยงสูง</h2>
  <table>
    <thead>
      <tr>
        <th style="width: 5%">#</th>
        <th style="width: 25%">ชื่อ-สกุล</th>
        <th style="width: 12%">Risk Score</th>
        <th>ปัจจัยเสี่ยง</th>
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

  <h2>💰 ธุรกรรมสำคัญ</h2>
  <table>
    <thead>
      <tr>
        <th style="width: 5%">#</th>
        <th style="width: 20%">จาก</th>
        <th style="width: 20%">ถึง</th>
        <th style="width: 15%">จำนวนเงิน</th>
        <th style="width: 15%">วันที่</th>
        <th>หมายเหตุ</th>
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

  <h2>📝 สรุปความเห็น</h2>
  <div class="summary">
    <p>${generateSummary()}</p>
  </div>

  <div class="footer">
    <p>รายงานนี้สร้างโดยระบบ InvestiGate - วันที่ ${new Date().toLocaleString('th-TH')}</p>
  </div>

  <div class="signature">
    <div class="signature-box">
      <p>ลงชื่อ ........................................</p>
      <p>( ......................................... )</p>
      <p>พนักงานสอบสวน</p>
    </div>
    <div class="signature-box">
      <p>ลงชื่อ ........................................</p>
      <p>( ......................................... )</p>
      <p>ผู้บังคับบัญชา</p>
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
      alert('เกิดข้อผิดพลาดในการสร้าง PDF');
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
          <p className="text-dark-400 mt-1">รายงานวิเคราะห์เครือข่าย - มาตรฐาน Digital Forensic</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={fetchData} disabled={loading}>
            <RefreshCw size={18} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
            รีเฟรช
          </Button>
          <Button variant="secondary" onClick={exportToPDF} disabled={exporting || !stats}>
            <Printer size={18} className="mr-2" />
            พิมพ์
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
            <label className="text-sm text-dark-400">เลือกคดี:</label>
            <select
              className="bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 min-w-[300px]"
              value={selectedCaseId || ''}
              onChange={(e) => setSelectedCaseId(Number(e.target.value))}
            >
              <option value="">-- เลือกคดี --</option>
              {cases.map(c => (
                <option key={c.id} value={c.id}>{c.case_number} - {c.title}</option>
              ))}
            </select>
          </div>
          {selectedCase && (
            <>
              <Badge variant="info">{selectedCase.status}</Badge>
              <span className="text-sm text-dark-400">
                สร้างเมื่อ: {formatDate(selectedCase.created_at)}
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
              { label: 'บุคคล', value: stats.persons, icon: Users, color: 'text-blue-400' },
              { label: 'บัญชี', value: stats.bankAccounts, icon: Building2, color: 'text-green-400' },
              { label: 'เบอร์โทร', value: stats.phones, icon: Phone, color: 'text-yellow-400' },
              { label: 'Crypto', value: stats.cryptoWallets, icon: Wallet, color: 'text-purple-400' },
              { label: 'ผู้ต้องสงสัย', value: stats.suspects, icon: Target, color: 'text-red-400' },
              { label: 'ผู้เสียหาย', value: stats.victims, icon: Shield, color: 'text-cyan-400' },
              { label: 'ธุรกรรม', value: stats.totalTransactions, icon: ArrowRightLeft, color: 'text-amber-400' },
              { label: 'เสี่ยงสูง', value: stats.highRiskCount, icon: AlertTriangle, color: 'text-red-400' },
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
                  <p className="text-sm text-dark-400">มูลค่าธุรกรรมรวม</p>
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
                แผนผังเครือข่าย (Network Diagram)
              </h3>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowGraph(!showGraph)}
              >
                {showGraph ? 'ซ่อน' : 'แสดง'}
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
                ไม่มีข้อมูลเครือข่าย
              </div>
            )}
          </Card>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* High Risk Persons */}
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <AlertTriangle className="text-red-400" />
                บุคคลเสี่ยงสูง
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
                  <p className="text-dark-400 text-center py-4">ไม่พบบุคคลเสี่ยงสูง</p>
                )}
              </div>
            </Card>

            {/* Key Transactions */}
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="text-amber-400" />
                ธุรกรรมสำคัญ
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
                  <p className="text-dark-400 text-center py-4">ไม่พบธุรกรรมสำคัญ</p>
                )}
              </div>
            </Card>
          </div>

          {/* Auto Summary */}
          <Card className="p-4 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-blue-500/30">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <CheckCircle className="text-blue-400" />
              สรุปความเห็น (Auto Generated)
            </h3>
            <p className="text-dark-300 leading-relaxed">{generateSummary() || 'กรุณาเลือกคดีที่มีข้อมูลเพื่อสร้างสรุป'}</p>
          </Card>

          {/* Risk Indicators Legend */}
          <Card className="p-4 mt-6">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Shield className="text-primary-400 w-4 h-4" />
              ตัวบ่งชี้ความเสี่ยง (Risk Indicators)
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 text-xs">
              {[
                { icon: Target, label: 'ผู้ต้องสงสัยหลัก', score: '+30' },
                { icon: TrendingUp, label: 'รับเงิน >฿500K', score: '+25' },
                { icon: Shuffle, label: 'ใช้ Crypto Mixer', score: '+20' },
                { icon: Globe, label: 'โอนต่างประเทศ', score: '+15' },
                { icon: ArrowRightLeft, label: 'ธุรกรรมบ่อย (>10)', score: '+10' },
                { icon: Phone, label: 'โทรบ่อย (>20)', score: '+10' },
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
          <p className="text-dark-400">เลือกคดีเพื่อดูรายงาน</p>
        </Card>
      )}
    </div>
  );
};

export default ForensicReportV2;
