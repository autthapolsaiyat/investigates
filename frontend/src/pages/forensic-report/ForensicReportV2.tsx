/**
 * Forensic Report V2 - Comprehensive Criminal Network Analysis Report
 * Digital Forensic Standard for Court
 * Features:
 * - 4 Modules: Money Flow, Call Analysis, Crypto, Location Timeline
 * - Bilingual Support (EN/TH)
 * - Risk Score Analysis
 * - PDF Export
 * - Auto Summary
 * - Network Graph
 * - QR Code Chain of Custody
 */
import { useEffect, useState, useCallback, useRef } from 'react';
import { 
  FileText, Download, Printer, Users, TrendingUp, RefreshCw, Loader2, 
  AlertTriangle, Phone, Wallet, Building2, Shield, ChevronRight,
  Target, ArrowRightLeft, CheckCircle, Network, Lock, Fingerprint, MapPin
} from 'lucide-react';
import { Button, Card, Badge } from '../../components/ui';
import { casesAPI, moneyFlowAPI, evidenceAPI } from '../../services/api';
import type { Case, MoneyFlowNode, MoneyFlowEdge, Evidence } from '../../services/api';
import { ForensicReportGraph } from './ForensicReportGraph';

const API_BASE = import.meta.env.VITE_API_URL || 'https://investigates-api.azurewebsites.net/api/v1';

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

// Call Analysis Types
interface CallEntity {
  id: number;
  label: string;
  phone_number?: string;
  person_name?: string;
  total_calls: number;
  total_duration: number;
  risk_level: string;
  risk_score: number;
}

// Location Types
interface LocationPoint {
  id: number;
  suspect_name?: string;
  latitude: number;
  longitude: number;
  source: string;
  location_name?: string;
  location_type?: string;
  timestamp?: string;
}

// Crypto Types
interface CryptoTransaction {
  id: number;
  blockchain: string;
  from_wallet: string;
  to_wallet: string;
  amount: number;
  amount_usd?: number;
  risk_flag?: string;
  tx_date?: string;
}

// Language Type
type Language = 'en' | 'th';

// Bilingual Labels
const labels: Record<string, Record<Language, string>> = {
  reportTitle: { en: 'Criminal Network Analysis Report', th: 'รายงานวิเคราะห์เครือข่ายอาชญากรรม' },
  subtitle: { en: 'Royal Thai Police - Digital Forensic Standard', th: 'สำนักงานตำรวจแห่งชาติ - มาตรฐานนิติวิทยาศาสตร์ดิจิทัล' },
  caseNumber: { en: 'Case Number', th: 'หมายเลขคดี' },
  caseTitle: { en: 'Case Title', th: 'ชื่อคดี' },
  analysisDate: { en: 'Analysis Date', th: 'วันที่วิเคราะห์' },
  analyst: { en: 'Analyst', th: 'ผู้วิเคราะห์' },
  analysisSummary: { en: 'Analysis Summary', th: 'สรุปผลการวิเคราะห์' },
  relatedPersons: { en: 'Related Persons', th: 'บุคคลที่เกี่ยวข้อง' },
  bankAccounts: { en: 'Bank Accounts', th: 'บัญชีธนาคาร' },
  totalTransactions: { en: 'Total Transactions', th: 'ธุรกรรมทั้งหมด' },
  totalValue: { en: 'Total Value', th: 'มูลค่ารวม' },
  moneyFlowAnalysis: { en: 'Money Flow Analysis', th: 'การวิเคราะห์กระแสเงิน' },
  highRiskPersons: { en: 'High Risk Persons', th: 'บุคคลความเสี่ยงสูง' },
  keyTransactions: { en: 'Key Transactions', th: 'ธุรกรรมสำคัญ' },
  callAnalysis: { en: 'Call Analysis', th: 'การวิเคราะห์การโทร' },
  topCallers: { en: 'Top Callers', th: 'ผู้โทรสูงสุด' },
  totalCalls: { en: 'Total Calls', th: 'จำนวนการโทร' },
  totalDuration: { en: 'Total Duration', th: 'ระยะเวลารวม' },
  uniqueNumbers: { en: 'Unique Numbers', th: 'หมายเลขไม่ซ้ำ' },
  cryptoAnalysis: { en: 'Crypto Analysis', th: 'การวิเคราะห์คริปโต' },
  cryptoTransactions: { en: 'Crypto Transactions', th: 'ธุรกรรมคริปโต' },
  riskFlags: { en: 'Risk Flags', th: 'สัญญาณเตือนภัย' },
  locationAnalysis: { en: 'Location Analysis', th: 'การวิเคราะห์ตำแหน่ง' },
  locationPoints: { en: 'Location Points', th: 'จุดตำแหน่ง' },
  keyLocations: { en: 'Key Locations', th: 'สถานที่สำคัญ' },
  observations: { en: 'Observations from Analysis', th: 'ข้อสังเกตจากการวิเคราะห์' },
  requiresInvestigation: { en: '(Requires Further Investigation)', th: '(ต้องสอบสวนเพิ่มเติม)' },
  chainOfCustody: { en: 'Chain of Custody - Digital Evidence', th: 'ห่วงโซ่การครอบครอง - หลักฐานดิจิทัล' },
  recordedEvidence: { en: 'Recorded Evidence', th: 'หลักฐานที่บันทึก' },
  items: { en: 'items', th: 'รายการ' },
  filename: { en: 'Filename', th: 'ชื่อไฟล์' },
  sha256Hash: { en: 'SHA-256 Hash', th: 'SHA-256 แฮช' },
  dateRecorded: { en: 'Date Recorded', th: 'วันที่บันทึก' },
  allEvidenceVerified: { en: 'All evidence recorded with SHA-256 Hash for court verification', th: 'หลักฐานทั้งหมดบันทึกด้วย SHA-256 Hash สำหรับการยืนยันในศาล' },
  scanToVerify: { en: 'Scan to verify evidence', th: 'สแกนเพื่อยืนยันหลักฐาน' },
  signature: { en: 'Signature', th: 'ลายมือชื่อ' },
  investigator: { en: 'Investigator', th: 'พนักงานสอบสวน' },
  supervisor: { en: 'Supervisor', th: 'ผู้บังคับบัญชา' },
  reportGenerated: { en: 'Report generated by InvestiGate', th: 'รายงานสร้างโดย InvestiGate' },
  name: { en: 'Name', th: 'ชื่อ' },
  riskScore: { en: 'Risk Score', th: 'คะแนนความเสี่ยง' },
  riskFactors: { en: 'Risk Factors', th: 'ปัจจัยเสี่ยง' },
  from: { en: 'From', th: 'จาก' },
  to: { en: 'To', th: 'ถึง' },
  amount: { en: 'Amount', th: 'จำนวนเงิน' },
  date: { en: 'Date', th: 'วันที่' },
  notes: { en: 'Notes', th: 'หมายเหตุ' },
  phoneNumber: { en: 'Phone Number', th: 'หมายเลขโทรศัพท์' },
  calls: { en: 'Calls', th: 'สาย' },
  duration: { en: 'Duration', th: 'ระยะเวลา' },
  blockchain: { en: 'Blockchain', th: 'บล็อกเชน' },
  location: { en: 'Location', th: 'ตำแหน่ง' },
  time: { en: 'Time', th: 'เวลา' },
  source: { en: 'Source', th: 'แหล่งที่มา' },
  notSpecified: { en: 'Not specified', th: 'ไม่ระบุ' },
  noData: { en: 'No data found', th: 'ไม่พบข้อมูล' },
  disclaimer: { 
    en: 'This is a preliminary analysis from transaction patterns only. This is not a case conclusion. Further investigation and evidence collection should be conducted.',
    th: 'นี่เป็นการวิเคราะห์เบื้องต้นจากรูปแบบธุรกรรมเท่านั้น ไม่ใช่ข้อสรุปของคดี ควรดำเนินการสอบสวนและรวบรวมหลักฐานเพิ่มเติม'
  }
};

// ==================== HELPERS ====================
const formatCurrency = (amount: number): string => {
  if (amount >= 1000000) return `฿${(amount / 1000000).toFixed(2)}M`;
  if (amount >= 1000) return `฿${(amount / 1000).toFixed(1)}K`;
  return `฿${amount.toLocaleString()}`;
};

const formatDate = (date: string | null | undefined, lang: Language = 'en'): string => {
  if (!date) return lang === 'en' ? 'Not specified' : 'ไม่ระบุ';
  return new Date(date).toLocaleDateString(lang === 'en' ? 'en-US' : 'th-TH', {
    year: 'numeric', month: 'short', day: 'numeric'
  });
};

const formatDuration = (seconds: number, lang: Language = 'en'): string => {
  const mins = Math.floor(seconds / 60);
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60);
    const remainMins = mins % 60;
    return lang === 'en' ? `${hrs}h ${remainMins}m` : `${hrs}ชม. ${remainMins}น.`;
  }
  return lang === 'en' ? `${mins} min` : `${mins} นาที`;
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
  // Base states
  const [cases, setCases] = useState<Case[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<number | null>(null);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [language, setLanguage] = useState<Language>('en');
  const reportRef = useRef<HTMLDivElement>(null);
  
  // Money Flow states
  const [nodes, setNodes] = useState<MoneyFlowNode[]>([]);
  const [edges, setEdges] = useState<MoneyFlowEdge[]>([]);
  const [stats, setStats] = useState<Statistics | null>(null);
  const [highRiskPersons, setHighRiskPersons] = useState<HighRiskPerson[]>([]);
  const [keyTransactions, setKeyTransactions] = useState<KeyTransaction[]>([]);
  
  // Call Analysis states
  const [callEntities, setCallEntities] = useState<CallEntity[]>([]);
  
  // Location states
  const [locationPoints, setLocationPoints] = useState<LocationPoint[]>([]);
  
  // Crypto states
  const [cryptoTransactions, setCryptoTransactions] = useState<CryptoTransaction[]>([]);
  
  // Evidence states
  const [evidences, setEvidences] = useState<Evidence[]>([]);
  
  // UI states
  const [showGraph, setShowGraph] = useState(true);
  const [showChainOfCustody, setShowChainOfCustody] = useState(true);

  // Helper to get label
  const t = (key: string): string => labels[key]?.[language] || key;

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

  // Fetch all data for the case
  const fetchData = useCallback(async () => {
    if (!selectedCaseId || !selectedCase) return;
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      
      // 1. Fetch Money Flow data
      const [nodesRes, edgesRes] = await Promise.all([
        moneyFlowAPI.listNodes(selectedCaseId),
        moneyFlowAPI.listEdges(selectedCaseId)
      ]);
      setNodes(nodesRes);
      setEdges(edgesRes);
      analyzeData(nodesRes, edgesRes);
      
      // 2. Fetch Evidence for Chain of Custody
      try {
        const evidencesRes = await evidenceAPI.listByCase(selectedCaseId);
        setEvidences(evidencesRes);
      } catch {
        setEvidences([]);
      }
      
      // 3. Fetch Call Analysis data
      try {
        const callRes = await fetch(`${API_BASE}/call-analysis/case/${selectedCaseId}/network`, { headers });
        if (callRes.ok) {
          const callData = await callRes.json();
          setCallEntities(callData.entities || []);
        }
      } catch {
        setCallEntities([]);
      }
      
      // 4. Fetch Location data
      try {
        const locRes = await fetch(`${API_BASE}/locations/case/${selectedCaseId}/timeline`, { headers });
        if (locRes.ok) {
          const locData = await locRes.json();
          setLocationPoints(locData.points || []);
        }
      } catch {
        setLocationPoints([]);
      }
      
      // 5. Fetch Crypto data (if endpoint exists)
      try {
        const cryptoRes = await fetch(`${API_BASE}/crypto/case/${selectedCaseId}/transactions`, { headers });
        if (cryptoRes.ok) {
          const cryptoData = await cryptoRes.json();
          setCryptoTransactions(cryptoData || []);
        }
      } catch {
        setCryptoTransactions([]);
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

  // Analyze Money Flow data
  const analyzeData = (nodeList: MoneyFlowNode[], edgeList: MoneyFlowEdge[]) => {
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
    const keyTxs: KeyTransaction[] = edgeList
      .filter(e => (e.amount || 0) > 0)
      .sort((a, b) => (b.amount || 0) - (a.amount || 0))
      .slice(0, 10)
      .map(edge => {
        const fromNode = nodeList.find(n => n.id === edge.from_node_id);
        const toNode = nodeList.find(n => n.id === edge.to_node_id);
        const amount = edge.amount || 0;
        let importance: 'critical' | 'high' | 'medium' = 'medium';
        let reason = language === 'en' ? 'Normal transaction' : 'ธุรกรรมปกติ';
        
        if (amount >= 500000) {
          importance = 'critical';
          reason = language === 'en' ? 'Abnormally high amount' : 'จำนวนเงินสูงผิดปกติ';
        } else if (amount >= 100000) {
          importance = 'high';
          reason = language === 'en' ? 'High amount' : 'จำนวนเงินสูง';
        }
        
        return { edge, fromNode, toNode, importance, reason };
      });
    setKeyTransactions(keyTxs);
  };

  // Generate summary
  const generateSummary = (): string => {
    if (!stats || !highRiskPersons.length) {
      return language === 'en' 
        ? 'Insufficient data for analysis. Please import more data.'
        : 'ข้อมูลไม่เพียงพอสำหรับการวิเคราะห์ กรุณานำเข้าข้อมูลเพิ่มเติม';
    }
    
    const topPerson = highRiskPersons[0];
    
    if (language === 'en') {
      let summary = `From preliminary transaction pattern analysis, interesting observations show that "${topPerson.node.label}" (Risk Score: ${topPerson.riskScore}) may have a key role in this network. `;
      summary += `Total transaction value approximately ${formatCurrency(stats.totalAmount)}. `;
      if (callEntities.length > 0) {
        const totalCalls = callEntities.reduce((sum, e) => sum + e.total_calls, 0);
        summary += `Call analysis shows ${callEntities.length} unique phone numbers with ${totalCalls} total calls. `;
      }
      if (locationPoints.length > 0) {
        const uniqueLocations = new Set(locationPoints.map(p => p.location_name)).size;
        summary += `Location tracking identified ${uniqueLocations} unique locations visited. `;
      }
      summary += `However, this data is only an analysis from transaction patterns. Further investigation and evidence collection is recommended to confirm the facts.`;
      return summary;
    } else {
      let summary = `จากการวิเคราะห์รูปแบบธุรกรรมเบื้องต้น พบข้อสังเกตที่น่าสนใจว่า "${topPerson.node.label}" (คะแนนความเสี่ยง: ${topPerson.riskScore}) อาจมีบทบาทสำคัญในเครือข่ายนี้ `;
      summary += `มูลค่าธุรกรรมรวมประมาณ ${formatCurrency(stats.totalAmount)} `;
      if (callEntities.length > 0) {
        const totalCalls = callEntities.reduce((sum, e) => sum + e.total_calls, 0);
        summary += `การวิเคราะห์การโทรพบหมายเลขโทรศัพท์ ${callEntities.length} หมายเลข รวม ${totalCalls} สาย `;
      }
      if (locationPoints.length > 0) {
        const uniqueLocations = new Set(locationPoints.map(p => p.location_name)).size;
        summary += `การติดตามตำแหน่งพบสถานที่ ${uniqueLocations} แห่ง `;
      }
      summary += `อย่างไรก็ตาม ข้อมูลนี้เป็นการวิเคราะห์จากรูปแบบธุรกรรมเท่านั้น แนะนำให้ดำเนินการสอบสวนและรวบรวมหลักฐานเพิ่มเติมเพื่อยืนยันข้อเท็จจริง`;
      return summary;
    }
  };

  // Export to PDF with all modules
  const exportToPDF = async () => {
    setExporting(true);
    try {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('Please allow popup');
        return;
      }
      
      // Calculate stats for each module
      const totalCalls = callEntities.reduce((sum, e) => sum + e.total_calls, 0);
      const totalCallDuration = callEntities.reduce((sum, e) => sum + e.total_duration, 0);
      const topCallers = [...callEntities].sort((a, b) => b.total_calls - a.total_calls).slice(0, 5);
      const uniqueLocations = new Set(locationPoints.map(p => p.location_name)).size;
      
      const content = `
<!DOCTYPE html>
<html lang="${language}">
<head>
  <meta charset="UTF-8">
  <title>${t('reportTitle')} - ${selectedCase?.case_number}</title>
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
    .stats-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 25px; }
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
    .section { margin-bottom: 30px; page-break-inside: avoid; }
    .section-header { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 12px 15px; border-radius: 6px 6px 0 0; }
    .section-header h2 { color: white; border: none; margin: 0; padding: 0; }
    .section-content { background: #f8fafc; padding: 15px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 6px 6px; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
    .badge-red { background: #fef2f2; color: #dc2626; }
    .badge-yellow { background: #fffbeb; color: #d97706; }
    .badge-green { background: #ecfdf5; color: #059669; }
    .badge-blue { background: #eff6ff; color: #2563eb; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #6b7280; }
    .signature { display: grid; grid-template-columns: repeat(2, 1fr); gap: 40px; margin-top: 40px; }
    .signature-box { text-align: center; padding-top: 60px; border-top: 1px solid #374151; }
    @media print {
      body { padding: 20px; }
      .no-print { display: none; }
      .section { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🔍 ${t('reportTitle')}</h1>
    <p>${t('subtitle')}</p>
  </div>

  <div class="meta">
    <div class="meta-item"><span class="meta-label">${t('caseNumber')}:</span> ${selectedCase?.case_number || '-'}</div>
    <div class="meta-item"><span class="meta-label">${t('caseTitle')}:</span> ${selectedCase?.title || '-'}</div>
    <div class="meta-item"><span class="meta-label">${t('analysisDate')}:</span> ${formatDate(new Date().toISOString(), language)}</div>
    <div class="meta-item"><span class="meta-label">${t('analyst')}:</span> ${localStorage.getItem('user_email') || t('notSpecified')}</div>
  </div>

  <h2>📊 ${t('analysisSummary')}</h2>
  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-value">${stats?.persons || 0}</div>
      <div class="stat-label">${t('relatedPersons')}</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${stats?.bankAccounts || 0}</div>
      <div class="stat-label">${t('bankAccounts')}</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${stats?.totalTransactions || 0}</div>
      <div class="stat-label">${t('totalTransactions')}</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${formatCurrency(stats?.totalAmount || 0)}</div>
      <div class="stat-label">${t('totalValue')}</div>
    </div>
  </div>

  <!-- MONEY FLOW SECTION -->
  <div class="section">
    <div class="section-header">
      <h2>💰 ${t('moneyFlowAnalysis')}</h2>
    </div>
    <div class="section-content">
      <h3>🔴 ${t('highRiskPersons')}</h3>
      <table>
        <thead>
          <tr>
            <th style="width: 5%">#</th>
            <th style="width: 25%">${t('name')}</th>
            <th style="width: 12%">${t('riskScore')}</th>
            <th>${t('riskFactors')}</th>
          </tr>
        </thead>
        <tbody>
          ${highRiskPersons.length > 0 ? highRiskPersons.map((p, i) => `
            <tr>
              <td>${i + 1}</td>
              <td><strong>${p.node.label}</strong></td>
              <td class="${p.riskScore >= 70 ? 'risk-high' : p.riskScore >= 40 ? 'risk-medium' : 'risk-low'}">${p.riskScore}</td>
              <td>${p.riskFactors.map(f => `• ${f.factor}`).join('<br>') || '-'}</td>
            </tr>
          `).join('') : `<tr><td colspan="4" style="text-align: center; color: #9ca3af;">${t('noData')}</td></tr>`}
        </tbody>
      </table>

      <h3>💵 ${t('keyTransactions')}</h3>
      <table>
        <thead>
          <tr>
            <th style="width: 5%">#</th>
            <th style="width: 20%">${t('from')}</th>
            <th style="width: 20%">${t('to')}</th>
            <th style="width: 15%">${t('amount')}</th>
            <th style="width: 15%">${t('date')}</th>
            <th>${t('notes')}</th>
          </tr>
        </thead>
        <tbody>
          ${keyTransactions.length > 0 ? keyTransactions.slice(0, 10).map((tx, i) => `
            <tr class="${tx.importance}">
              <td>${i + 1}</td>
              <td>${tx.fromNode?.label || '-'}</td>
              <td>${tx.toNode?.label || '-'}</td>
              <td><strong>${formatCurrency(tx.edge.amount || 0)}</strong></td>
              <td>${formatDate(tx.edge.transaction_date, language)}</td>
              <td>${tx.reason}</td>
            </tr>
          `).join('') : `<tr><td colspan="6" style="text-align: center; color: #9ca3af;">${t('noData')}</td></tr>`}
        </tbody>
      </table>
    </div>
  </div>

  <!-- CALL ANALYSIS SECTION -->
  ${callEntities.length > 0 ? `
  <div class="section">
    <div class="section-header">
      <h2>📞 ${t('callAnalysis')}</h2>
    </div>
    <div class="section-content">
      <div class="stats-grid-3">
        <div class="stat-card">
          <div class="stat-value">${totalCalls}</div>
          <div class="stat-label">${t('totalCalls')}</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${formatDuration(totalCallDuration, language)}</div>
          <div class="stat-label">${t('totalDuration')}</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${callEntities.length}</div>
          <div class="stat-label">${t('uniqueNumbers')}</div>
        </div>
      </div>

      <h3>📱 ${t('topCallers')}</h3>
      <table>
        <thead>
          <tr>
            <th style="width: 5%">#</th>
            <th style="width: 30%">${t('name')}</th>
            <th style="width: 25%">${t('phoneNumber')}</th>
            <th style="width: 15%">${t('calls')}</th>
            <th style="width: 15%">${t('duration')}</th>
            <th>${t('riskScore')}</th>
          </tr>
        </thead>
        <tbody>
          ${topCallers.map((caller, i) => `
            <tr>
              <td>${i + 1}</td>
              <td><strong>${caller.label || caller.person_name || '-'}</strong></td>
              <td>${caller.phone_number || '-'}</td>
              <td>${caller.total_calls}</td>
              <td>${formatDuration(caller.total_duration, language)}</td>
              <td class="${caller.risk_score >= 70 ? 'risk-high' : caller.risk_score >= 40 ? 'risk-medium' : 'risk-low'}">${caller.risk_score}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  </div>
  ` : ''}

  <!-- CRYPTO ANALYSIS SECTION -->
  ${cryptoTransactions.length > 0 ? `
  <div class="section">
    <div class="section-header">
      <h2>🪙 ${t('cryptoAnalysis')}</h2>
    </div>
    <div class="section-content">
      <h3>💳 ${t('cryptoTransactions')}</h3>
      <table>
        <thead>
          <tr>
            <th style="width: 5%">#</th>
            <th style="width: 12%">${t('blockchain')}</th>
            <th style="width: 25%">${t('from')}</th>
            <th style="width: 25%">${t('to')}</th>
            <th style="width: 15%">${t('amount')}</th>
            <th>${t('riskFlags')}</th>
          </tr>
        </thead>
        <tbody>
          ${cryptoTransactions.slice(0, 10).map((tx, i) => `
            <tr>
              <td>${i + 1}</td>
              <td><span class="badge badge-blue">${tx.blockchain || '-'}</span></td>
              <td style="font-family: monospace; font-size: 10px;">${tx.from_wallet ? tx.from_wallet.substring(0, 16) + '...' : '-'}</td>
              <td style="font-family: monospace; font-size: 10px;">${tx.to_wallet ? tx.to_wallet.substring(0, 16) + '...' : '-'}</td>
              <td><strong>$${(tx.amount_usd || tx.amount || 0).toLocaleString()}</strong></td>
              <td>${tx.risk_flag ? `<span class="badge ${tx.risk_flag.includes('MIXER') || tx.risk_flag.includes('TORNADO') ? 'badge-red' : 'badge-yellow'}">${tx.risk_flag}</span>` : '-'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  </div>
  ` : ''}

  <!-- LOCATION ANALYSIS SECTION -->
  ${locationPoints.length > 0 ? `
  <div class="section">
    <div class="section-header">
      <h2>📍 ${t('locationAnalysis')}</h2>
    </div>
    <div class="section-content">
      <div class="stats-grid-3">
        <div class="stat-card">
          <div class="stat-value">${locationPoints.length}</div>
          <div class="stat-label">${t('locationPoints')}</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${uniqueLocations}</div>
          <div class="stat-label">${t('keyLocations')}</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${new Set(locationPoints.map(p => p.suspect_name)).size}</div>
          <div class="stat-label">${t('relatedPersons')}</div>
        </div>
      </div>

      <h3>🗺️ ${t('keyLocations')}</h3>
      <table>
        <thead>
          <tr>
            <th style="width: 5%">#</th>
            <th style="width: 30%">${t('location')}</th>
            <th style="width: 15%">${language === 'en' ? 'Type' : 'ประเภท'}</th>
            <th style="width: 25%">${language === 'en' ? 'Visitor' : 'ผู้เยี่ยมชม'}</th>
            <th>${t('time')}</th>
          </tr>
        </thead>
        <tbody>
          ${locationPoints.slice(0, 10).map((loc, i) => `
            <tr>
              <td>${i + 1}</td>
              <td><strong>${loc.location_name || (loc.latitude && loc.longitude ? `${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}` : '-')}</strong></td>
              <td><span class="badge badge-green">${loc.location_type || loc.source || '-'}</span></td>
              <td>${loc.suspect_name || '-'}</td>
              <td>${loc.timestamp ? formatDate(loc.timestamp, language) : '-'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  </div>
  ` : ''}

  <!-- OBSERVATIONS -->
  <h2>📝 ${t('observations')} ${t('requiresInvestigation')}</h2>
  <div class="summary">
    <p>${generateSummary()}</p>
    <p style="font-size: 11px; color: #6b7280; margin-top: 15px; font-style: italic;">* ${t('disclaimer')}</p>
  </div>

  <!-- CHAIN OF CUSTODY -->
  <h2>🔐 ${t('chainOfCustody')}</h2>
  <div style="display: grid; grid-template-columns: 180px 1fr; gap: 20px; margin-bottom: 20px;">
    <div style="text-align: center; padding: 15px; background: #fff; border: 2px solid #e2e8f0; border-radius: 12px;">
      <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`https://wonderful-wave-0486dd100.6.azurestaticapps.net/verify?case=${selectedCase?.case_number}`)}" alt="QR Code" style="width: 140px; height: 140px;" />
      <p style="font-size: 10px; color: #6b7280; margin-top: 8px;">${t('scanToVerify')}</p>
    </div>
    <div>
      <h3 style="margin-bottom: 10px;">${t('recordedEvidence')} (${evidences.length} ${t('items')})</h3>
      <table style="font-size: 11px;">
        <thead>
          <tr>
            <th style="width: 5%">#</th>
            <th style="width: 35%">${t('filename')}</th>
            <th style="width: 45%">${t('sha256Hash')}</th>
            <th style="width: 15%">${t('dateRecorded')}</th>
          </tr>
        </thead>
        <tbody>
          ${evidences.length > 0 ? evidences.map((ev, i) => `
            <tr>
              <td>${i + 1}</td>
              <td>${ev.file_name}</td>
              <td style="font-family: monospace; font-size: 9px;">${ev.sha256_hash}</td>
              <td>${formatDate(ev.collected_at, language)}</td>
            </tr>
          `).join('') : `<tr><td colspan="4" style="text-align: center; color: #9ca3af;">${t('noData')}</td></tr>`}
        </tbody>
      </table>
      ${evidences.length > 0 ? `
        <div style="margin-top: 10px; padding: 10px; background: #ecfdf5; border: 1px solid #10b981; border-radius: 6px; font-size: 11px; color: #047857;">
          ✅ ${t('allEvidenceVerified')}
        </div>
      ` : ''}
    </div>
  </div>

  <div class="footer">
    <p>${t('reportGenerated')} - ${formatDate(new Date().toISOString(), language)}</p>
  </div>

  <div class="signature">
    <div class="signature-box">
      <p>${t('signature')} ........................................</p>
      <p>( ......................................... )</p>
      <p>${t('investigator')}</p>
    </div>
    <div class="signature-box">
      <p>${t('signature')} ........................................</p>
      <p>( ......................................... )</p>
      <p>${t('supervisor')}</p>
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
          {/* Language Toggle */}
          <div className="flex items-center gap-1 bg-dark-800 rounded-lg p-1">
            <button
              onClick={() => setLanguage('en')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                language === 'en' ? 'bg-primary-500 text-white' : 'text-dark-400 hover:text-white'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLanguage('th')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                language === 'th' ? 'bg-primary-500 text-white' : 'text-dark-400 hover:text-white'
              }`}
            >
              TH
            </button>
          </div>
          <Button variant="ghost" onClick={fetchData} disabled={loading}>
            <RefreshCw size={18} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="secondary" onClick={exportToPDF} disabled={exporting || !stats}>
            <Printer size={18} className="mr-2" />
            Print
          </Button>
          <Button variant="primary" onClick={exportToPDF} disabled={exporting || !stats}>
            <Download size={18} className="mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Case Selection */}
      <Card className="mb-6 p-4">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-3">
            <span className="text-dark-400">Select Case:</span>
            <select
              value={selectedCaseId || ''}
              onChange={(e) => setSelectedCaseId(Number(e.target.value))}
              className="bg-dark-700 border border-dark-600 rounded-lg px-4 py-2 text-white min-w-[300px]"
            >
              {cases.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.case_number} - {c.title}
                </option>
              ))}
            </select>
            <Badge variant={selectedCase?.status === 'active' ? 'success' : 'default'}>
              {selectedCase?.status || 'draft'}
            </Badge>
          </div>
          <div className="text-dark-400 text-sm">
            Created: {formatDate(selectedCase?.created_at, language)}
          </div>
        </div>
      </Card>

      {/* Statistics Overview */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-6">
          <Card className="p-4 text-center">
            <Users className="w-6 h-6 text-blue-400 mx-auto mb-2" />
            <div className="text-2xl font-bold">{stats.persons}</div>
            <div className="text-xs text-dark-400">Person</div>
          </Card>
          <Card className="p-4 text-center">
            <Building2 className="w-6 h-6 text-green-400 mx-auto mb-2" />
            <div className="text-2xl font-bold">{stats.bankAccounts}</div>
            <div className="text-xs text-dark-400">Accounts</div>
          </Card>
          <Card className="p-4 text-center">
            <Phone className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
            <div className="text-2xl font-bold">{callEntities.length}</div>
            <div className="text-xs text-dark-400">Phone</div>
          </Card>
          <Card className="p-4 text-center">
            <Wallet className="w-6 h-6 text-purple-400 mx-auto mb-2" />
            <div className="text-2xl font-bold">{cryptoTransactions.length}</div>
            <div className="text-xs text-dark-400">Crypto</div>
          </Card>
          <Card className="p-4 text-center">
            <AlertTriangle className="w-6 h-6 text-red-400 mx-auto mb-2" />
            <div className="text-2xl font-bold">{stats.suspects}</div>
            <div className="text-xs text-dark-400">Suspect</div>
          </Card>
          <Card className="p-4 text-center">
            <Shield className="w-6 h-6 text-pink-400 mx-auto mb-2" />
            <div className="text-2xl font-bold">{stats.victims}</div>
            <div className="text-xs text-dark-400">Victim</div>
          </Card>
          <Card className="p-4 text-center">
            <ArrowRightLeft className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
            <div className="text-2xl font-bold">{stats.totalTransactions}</div>
            <div className="text-xs text-dark-400">Transactions</div>
          </Card>
          <Card className="p-4 text-center">
            <AlertTriangle className="w-6 h-6 text-orange-400 mx-auto mb-2" />
            <div className="text-2xl font-bold">{stats.highRiskCount}</div>
            <div className="text-xs text-dark-400">High Risk</div>
          </Card>
        </div>
      )}

      {/* Total Value */}
      {stats && (
        <Card className="mb-6 p-4 bg-gradient-to-r from-primary-900/50 to-primary-800/30 border-primary-500/30">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-primary-400" />
            <div>
              <div className="text-dark-400 text-sm">Total Transaction Value</div>
              <div className="text-3xl font-bold text-primary-400">{formatCurrency(stats.totalAmount)}</div>
            </div>
          </div>
        </Card>
      )}

      {/* Network Graph */}
      <Card className="mb-6">
        <div className="flex items-center justify-between p-4 border-b border-dark-700">
          <h3 className="font-semibold flex items-center gap-2">
            <Network className="w-5 h-5 text-primary-400" />
            Network Diagram (Network Diagram)
          </h3>
          <Button variant="ghost" size="sm" onClick={() => setShowGraph(!showGraph)}>
            {showGraph ? 'Hide' : 'Show'}
          </Button>
        </div>
        {showGraph && nodes.length > 0 && (
          <div className="p-4">
            <ForensicReportGraph nodes={nodes} edges={edges} />
          </div>
        )}
      </Card>

      {/* Chain of Custody */}
      <Card className="mb-6">
        <div className="flex items-center justify-between p-4 border-b border-dark-700">
          <h3 className="font-semibold flex items-center gap-2">
            <Lock className="w-5 h-5 text-green-400" />
            {t('chainOfCustody')}
          </h3>
          <Button variant="ghost" size="sm" onClick={() => setShowChainOfCustody(!showChainOfCustody)}>
            {showChainOfCustody ? 'Hide' : 'Show'}
          </Button>
        </div>
        {showChainOfCustody && (
          <div className="p-4 grid md:grid-cols-3 gap-6">
            {/* QR Code */}
            <div className="flex flex-col items-center justify-center p-6 bg-white rounded-xl">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`https://wonderful-wave-0486dd100.6.azurestaticapps.net/verify?case=${selectedCase?.case_number}`)}`}
                alt="QR Code"
                className="w-36 h-36"
              />
              <p className="text-dark-900 text-sm mt-3">{t('scanToVerify')}</p>
            </div>
            
            {/* Evidence List */}
            <div className="md:col-span-2">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Fingerprint className="w-4 h-4 text-primary-400" />
                {t('recordedEvidence')} ({evidences.length} {t('items')})
              </h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {evidences.length > 0 ? evidences.map((ev, i) => (
                  <div key={ev.id} className="flex items-center gap-3 p-3 bg-dark-800 rounded-lg text-sm">
                    <span className="text-dark-500 w-6">{i + 1}.</span>
                    <FileText className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{ev.file_name}</div>
                      <div className="text-xs text-dark-500 font-mono truncate">🔒 {ev.sha256_hash}</div>
                    </div>
                    <div className="text-xs text-dark-400 flex-shrink-0">
                      {ev.records_count} records<br />
                      {formatDate(ev.collected_at, language)}
                    </div>
                  </div>
                )) : (
                  <div className="text-center text-dark-500 py-8">{t('noData')}</div>
                )}
              </div>
              {evidences.length > 0 && (
                <div className="mt-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-2 text-green-400 text-sm">
                  <CheckCircle className="w-4 h-4" />
                  {t('allEvidenceVerified')}
                </div>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* High Risk Persons */}
      <Card className="mb-6">
        <div className="p-4 border-b border-dark-700">
          <h3 className="font-semibold flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            {t('highRiskPersons')}
          </h3>
        </div>
        <div className="p-4">
          {highRiskPersons.length > 0 ? (
            <div className="space-y-3">
              {highRiskPersons.slice(0, 5).map((p, i) => (
                <div 
                  key={p.node.id} 
                  className={`flex items-center gap-4 p-4 rounded-lg border ${getRiskColor(p.riskScore)}`}
                >
                  <div className="w-8 h-8 rounded-full bg-dark-700 flex items-center justify-center font-bold">
                    #{i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {getNodeTypeIcon(p.node.node_type)}
                      <span className="font-semibold">{p.node.label}</span>
                    </div>
                    <div className="text-sm text-dark-400 mt-1">
                      {p.riskFactors.map(f => f.factor).join(' • ') || 'High transaction volume'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">Risk: {p.riskScore}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-dark-500 py-8">{t('noData')}</div>
          )}
        </div>
      </Card>

      {/* Key Transactions */}
      <Card className="mb-6">
        <div className="p-4 border-b border-dark-700">
          <h3 className="font-semibold flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-yellow-400" />
            {t('keyTransactions')}
          </h3>
        </div>
        <div className="p-4">
          {keyTransactions.length > 0 ? (
            <div className="space-y-2">
              {keyTransactions.slice(0, 5).map((tx, i) => (
                <div 
                  key={tx.edge.id} 
                  className={`flex items-center gap-4 p-4 rounded-lg border ${
                    tx.importance === 'critical' ? 'bg-red-500/10 border-red-500/30' :
                    tx.importance === 'high' ? 'bg-yellow-500/10 border-yellow-500/30' :
                    'bg-dark-800 border-dark-700'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-dark-700 flex items-center justify-center font-bold text-sm">
                    #{i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">{tx.fromNode?.label || '-'}</span>
                      <ChevronRight className="w-4 h-4 text-dark-500" />
                      <span className="font-medium">{tx.toNode?.label || '-'}</span>
                    </div>
                    <div className="text-xs text-dark-400 mt-1">
                      {formatDate(tx.edge.transaction_date, language)} • {tx.reason}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-primary-400">{formatCurrency(tx.edge.amount || 0)}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-dark-500 py-8">{t('noData')}</div>
          )}
        </div>
      </Card>

      {/* Module Stats Summary */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        {/* Call Analysis Summary */}
        <Card className="p-4">
          <h4 className="font-semibold flex items-center gap-2 mb-3">
            <Phone className="w-5 h-5 text-yellow-400" />
            {t('callAnalysis')}
          </h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-dark-400">{t('totalCalls')}</div>
              <div className="text-xl font-bold">{callEntities.reduce((sum, e) => sum + e.total_calls, 0)}</div>
            </div>
            <div>
              <div className="text-dark-400">{t('uniqueNumbers')}</div>
              <div className="text-xl font-bold">{callEntities.length}</div>
            </div>
          </div>
        </Card>

        {/* Crypto Summary */}
        <Card className="p-4">
          <h4 className="font-semibold flex items-center gap-2 mb-3">
            <Wallet className="w-5 h-5 text-purple-400" />
            {t('cryptoAnalysis')}
          </h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-dark-400">{t('cryptoTransactions')}</div>
              <div className="text-xl font-bold">{cryptoTransactions.length}</div>
            </div>
            <div>
              <div className="text-dark-400">High Risk</div>
              <div className="text-xl font-bold text-red-400">
                {cryptoTransactions.filter(t => t.risk_flag?.includes('MIXER') || t.risk_flag?.includes('TORNADO')).length}
              </div>
            </div>
          </div>
        </Card>

        {/* Location Summary */}
        <Card className="p-4">
          <h4 className="font-semibold flex items-center gap-2 mb-3">
            <MapPin className="w-5 h-5 text-green-400" />
            {t('locationAnalysis')}
          </h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-dark-400">{t('locationPoints')}</div>
              <div className="text-xl font-bold">{locationPoints.length}</div>
            </div>
            <div>
              <div className="text-dark-400">{t('keyLocations')}</div>
              <div className="text-xl font-bold">{new Set(locationPoints.map(p => p.location_name)).size}</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ForensicReportV2;
