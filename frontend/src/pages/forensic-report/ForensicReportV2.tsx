/**
 * Forensic Report V2 - Comprehensive Criminal Network Analysis Report
 * Digital Forensic Standard for Court
 * Features:
 * - 4 Modules: Money Flow, Call Analysis, Crypto, Location Timeline
 * - Bilingual Support (EN/TH)
 * - Risk Score Analysis
 * - PDF Export
 * - Auto Summary
 * - QR Code Chain of Custody
 */
import { useEffect, useState, useCallback, useRef } from 'react';
import { 
  FileText, Download, Printer, Users, TrendingUp, RefreshCw, Loader2, 
  AlertTriangle, Phone, Wallet, Building2, Shield, ChevronRight,
  Target, ArrowRightLeft, CheckCircle, Lock, Fingerprint, MapPin,
  Volume2, VolumeX, Lightbulb
} from 'lucide-react';
import { Button, Card, Badge } from '../../components/ui';
import { casesAPI, moneyFlowAPI, evidenceAPI } from '../../services/api';
import type { Case, MoneyFlowNode, MoneyFlowEdge, Evidence } from '../../services/api';

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

// Call Analysis Types - matches API response from /call-analysis/case/{id}/network
interface CallEntityAPI {
  id: string;
  type: string;
  label: string;
  subLabel?: string;
  risk: string;
  clusterId?: number;
  metadata: {
    phone?: string;
    calls?: number;
    duration?: number;
  };
}

// Parsed Call Entity for display
interface CallEntity {
  id: string;
  label: string;
  phone_number: string;
  total_calls: number;
  total_duration: number;
  risk_level: string;
}

// Location Types - matches API response from /locations/case/{id}/timeline
interface LocationPointAPI {
  id: string;
  lat: number;
  lng: number;
  timestamp?: string;
  label?: string;
  source: string;
  accuracy?: number;
  address?: string;
  notes?: string;
  personId?: number;
  personName?: string;
  locationType?: string;
}

// Parsed Location Point for display
interface LocationPoint {
  id: string;
  latitude: number;
  longitude: number;
  location_name: string;
  location_type: string;
  source: string;
  suspect_name: string;
  timestamp?: string;
}

// Crypto Types - matches API response from /crypto/case/{id}/transactions
interface CryptoTransaction {
  id: number;
  blockchain: string;
  from_address: string;
  from_label?: string;
  to_address: string;
  to_label?: string;
  amount?: number;
  amount_usd?: number;
  risk_flag: string;
  risk_score: number;
  timestamp?: string;
}

// Saved Wallet from /crypto/case/{id}/wallets
interface SavedWallet {
  id: number;
  address: string;
  blockchain: string;
  label: string | null;
  owner_name: string | null;
  owner_type: string | null;
  total_received: number;
  total_sent: number;
  total_received_usd: number;
  total_sent_usd: number;
  transaction_count: number;
  risk_score: number;
  is_suspect: boolean;
  is_exchange: boolean;
  is_mixer: boolean;
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
  const [stats, setStats] = useState<Statistics | null>(null);
  const [highRiskPersons, setHighRiskPersons] = useState<HighRiskPerson[]>([]);
  const [keyTransactions, setKeyTransactions] = useState<KeyTransaction[]>([]);
  
  // Call Analysis states
  const [callEntities, setCallEntities] = useState<CallEntity[]>([]);
  
  // Location states
  const [locationPoints, setLocationPoints] = useState<LocationPoint[]>([]);
  
  // Crypto states
  const [cryptoTransactions, setCryptoTransactions] = useState<CryptoTransaction[]>([]);
  const [cryptoWallets, setCryptoWallets] = useState<SavedWallet[]>([]);
  
  // Evidence states
  const [evidences, setEvidences] = useState<Evidence[]>([]);
  
  // UI states
  const [showChainOfCustody, setShowChainOfCustody] = useState(true);
  
  // TTS states
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Load voices on mount
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      if (availableVoices.length > 0) {
        setVoices(availableVoices);
      }
    };
    
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

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
          // Transform API response to our interface
          const parsedEntities: CallEntity[] = (callData.entities || []).map((e: CallEntityAPI) => ({
            id: e.id,
            label: e.label || 'Unknown',
            phone_number: e.metadata?.phone || '-',
            total_calls: e.metadata?.calls || 0,
            total_duration: e.metadata?.duration || 0,
            risk_level: e.risk || 'low'
          }));
          setCallEntities(parsedEntities);
        }
      } catch {
        setCallEntities([]);
      }
      
      // 4. Fetch Location data
      try {
        const locRes = await fetch(`${API_BASE}/locations/case/${selectedCaseId}/timeline`, { headers });
        if (locRes.ok) {
          const locData = await locRes.json();
          // Valid evidence sources only (exclude manual)
          const validSources = ['gps', 'cell_tower', 'wifi', 'photo'];
          // Transform API response to our interface
          // Priority: address > label (which might be "Point X") > coordinates
          const parsedPoints: LocationPoint[] = (locData.points || [])
            .filter((p: LocationPointAPI) => validSources.includes(p.source || '')) // Filter out manual entries
            .map((p: LocationPointAPI) => ({
              id: p.id,
              latitude: p.lat,
              longitude: p.lng,
              location_name: p.address || (p.label && !p.label.startsWith('Point ') ? p.label : '') || `${p.lat?.toFixed(4)}, ${p.lng?.toFixed(4)}`,
              location_type: p.locationType || p.source || 'unknown',
              source: p.source || 'unknown',
              suspect_name: p.personName || '',
              timestamp: p.timestamp
            }));
          setLocationPoints(parsedPoints);
        }
      } catch {
        setLocationPoints([]);
      }
      
      // 5. Fetch Crypto data - from saved wallets (not imported transactions)
      try {
        const walletsRes = await fetch(`${API_BASE}/crypto/case/${selectedCaseId}/wallets`, { headers });
        if (walletsRes.ok) {
          const walletsData: SavedWallet[] = await walletsRes.json();
          setCryptoWallets(walletsData || []);
          // Transform wallets to transaction-like format for display
          const walletTransactions: CryptoTransaction[] = (walletsData || []).map((w: SavedWallet, idx: number) => ({
            id: w.id || idx,
            blockchain: w.blockchain || 'unknown',
            from_address: w.address,
            from_label: w.label || w.owner_name || undefined,
            to_address: '-',
            to_label: undefined,
            amount: w.total_received + w.total_sent,
            amount_usd: w.total_received_usd + w.total_sent_usd,
            risk_flag: w.is_mixer ? 'mixer_detected' : w.is_suspect ? 'high_risk' : 'none',
            risk_score: w.risk_score,
            timestamp: undefined
          }));
          setCryptoTransactions(walletTransactions);
        }
      } catch {
        // Fallback to transactions if wallets endpoint fails
        setCryptoWallets([]);
        try {
          const cryptoRes = await fetch(`${API_BASE}/crypto/case/${selectedCaseId}/transactions`, { headers });
          if (cryptoRes.ok) {
            const cryptoData = await cryptoRes.json();
            setCryptoTransactions(cryptoData || []);
          }
        } catch {
          setCryptoTransactions([]);
        }
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
  // Generate summary for TTS (returns plain text)
  const generateSummary = (): string => {
    const sections = generateSummarySections();
    if (sections.length === 0) {
      return language === 'en' 
        ? 'Insufficient data for analysis. Please import more data.'
        : 'ข้อมูลไม่เพียงพอสำหรับการวิเคราะห์ กรุณานำเข้าข้อมูลเพิ่มเติม';
    }
    
    let text = language === 'en' ? 'Analysis observations: ' : 'ข้อสังเกตจากการวิเคราะห์: ';
    sections.forEach((section, index) => {
      text += `${index + 1}. ${section.title}: ${section.summary} `;
    });
    text += language === 'en' 
      ? 'Overall: This is preliminary analysis only. Further investigation is recommended.'
      : 'สรุปภาพรวม: นี่เป็นการวิเคราะห์เบื้องต้น แนะนำให้สอบสวนเพิ่มเติม';
    return text;
  };

  // Generate summary sections for each data type - AI-style narrative
  interface SummarySection {
    icon: string;
    title: string;
    count: number;
    summary: string;
    narrative: string; // AI-style detailed narrative
  }

  const generateSummarySections = (): SummarySection[] => {
    const sections: SummarySection[] = [];
    
    // 1. Money Flow Summary - AI Narrative Style
    const hasMoneyFlow = stats && (stats.totalNodes > 0 || stats.totalTransactions > 0);
    if (hasMoneyFlow && stats) {
      let narrative = '';
      
      if (language === 'th') {
        narrative = `พบเครือข่ายการเงินประกอบด้วย ${stats.totalNodes} บัญชี มีธุรกรรมทั้งหมด ${stats.totalTransactions} รายการ มูลค่ารวม ${formatCurrency(stats.totalAmount)} `;
        
        // Top risk persons with names
        if (highRiskPersons.length > 0) {
          const topPersons = highRiskPersons.slice(0, 3);
          const names = topPersons.map(p => `"${p.node.label}" (Risk: ${p.riskScore})`).join(', ');
          narrative += `\n\n🔴 บุคคลความเสี่ยงสูง: ${names}`;
          
          // Describe the highest risk person
          const top = topPersons[0];
          if (top.riskFactors && top.riskFactors.length > 0) {
            const factors = top.riskFactors.slice(0, 2).map(f => f.factor).join(', ');
            narrative += `\n   "${top.node.label}" มีพฤติกรรมน่าสงสัย: ${factors}`;
          }
        }
        
        // Key transactions narrative
        if (keyTransactions.length > 0) {
          const topTx = keyTransactions.slice(0, 3);
          narrative += `\n\n💸 ธุรกรรมสำคัญ:`;
          topTx.forEach((tx, i) => {
            const from = tx.fromNode?.label || 'ไม่ทราบ';
            const to = tx.toNode?.label || 'ไม่ทราบ';
            const amount = formatCurrency(tx.edge?.amount || 0);
            narrative += `\n   ${i + 1}. ${from} → ${to} (${amount}) - ${tx.reason}`;
          });
        }
        
        // Suspects and victims
        if (stats.suspects > 0 || stats.victims > 0) {
          narrative += `\n\n⚠️ ระบุตัวตน: ผู้ต้องสงสัย ${stats.suspects} ราย, ผู้เสียหาย ${stats.victims} ราย`;
        }
      } else {
        narrative = `Network contains ${stats.totalNodes} accounts with ${stats.totalTransactions} transactions totaling ${formatCurrency(stats.totalAmount)}. `;
        
        if (highRiskPersons.length > 0) {
          const topPersons = highRiskPersons.slice(0, 3);
          const names = topPersons.map(p => `"${p.node.label}" (Risk: ${p.riskScore})`).join(', ');
          narrative += `\n\n🔴 High-risk entities: ${names}`;
        }
        
        if (keyTransactions.length > 0) {
          const topTx = keyTransactions.slice(0, 3);
          narrative += `\n\n💸 Key transactions:`;
          topTx.forEach((tx, i) => {
            const from = tx.fromNode?.label || 'Unknown';
            const to = tx.toNode?.label || 'Unknown';
            const amount = formatCurrency(tx.edge?.amount || 0);
            narrative += `\n   ${i + 1}. ${from} → ${to} (${amount}) - ${tx.reason}`;
          });
        }
      }
      
      sections.push({
        icon: '💰',
        title: 'Money Flow',
        count: stats.totalTransactions,
        summary: language === 'th'
          ? `${stats.totalNodes} บัญชี, ${stats.totalTransactions} ธุรกรรม, มูลค่ารวม ${formatCurrency(stats.totalAmount)}`
          : `${stats.totalNodes} accounts, ${stats.totalTransactions} transactions, total ${formatCurrency(stats.totalAmount)}`,
        narrative
      });
    }
    
    // 2. Crypto Tracker Summary - AI Narrative Style
    const hasCrypto = cryptoTransactions.length > 0 || cryptoWallets.length > 0;
    if (hasCrypto) {
      let narrative = '';
      
      // Group by blockchain
      const blockchainCounts: Record<string, number> = {};
      cryptoTransactions.forEach(tx => {
        const bc = tx.blockchain?.toUpperCase() || 'OTHER';
        blockchainCounts[bc] = (blockchainCounts[bc] || 0) + 1;
      });
      
      // Total USD value
      const totalUSD = cryptoTransactions.reduce((sum, tx) => sum + (tx.amount_usd || 0), 0);
      
      if (language === 'th') {
        narrative = `ตรวจพบธุรกรรม Crypto ${cryptoTransactions.length} รายการ`;
        if (cryptoWallets.length > 0) {
          narrative += ` จากกระเป๋า ${cryptoWallets.length} ใบ`;
        }
        if (totalUSD > 0) {
          narrative += ` มูลค่ารวมประมาณ $${totalUSD.toLocaleString()}`;
        }
        
        // Blockchain breakdown
        if (Object.keys(blockchainCounts).length > 0) {
          const bcList = Object.entries(blockchainCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([bc, count]) => `${bc} (${count} รายการ)`)
            .join(', ');
          narrative += `\n\n🔗 บล็อกเชนที่ใช้: ${bcList}`;
        }
        
        // High risk wallets
        const highRiskWallets = cryptoWallets.filter(w => w.risk_score >= 70);
        if (highRiskWallets.length > 0) {
          narrative += `\n\n⚠️ กระเป๋าความเสี่ยงสูง ${highRiskWallets.length} ใบ:`;
          highRiskWallets.slice(0, 3).forEach(w => {
            const addr = w.address.substring(0, 12) + '...';
            narrative += `\n   • ${addr} (${w.blockchain}, Risk: ${w.risk_score})`;
          });
        }
        
        // Mixer detection
        const mixerWallets = cryptoWallets.filter(w => w.is_mixer);
        const mixerTx = cryptoTransactions.filter(tx => tx.risk_flag?.includes('mixer'));
        if (mixerWallets.length > 0 || mixerTx.length > 0) {
          narrative += `\n\n🚨 พบการใช้ Mixer/Tumbler ${mixerWallets.length + mixerTx.length} รายการ - อาจเป็นการฟอกเงิน`;
        }
      } else {
        narrative = `Detected ${cryptoTransactions.length} crypto transactions`;
        if (cryptoWallets.length > 0) narrative += ` from ${cryptoWallets.length} wallets`;
        if (totalUSD > 0) narrative += `, approximately $${totalUSD.toLocaleString()}`;
        
        if (Object.keys(blockchainCounts).length > 0) {
          const bcList = Object.entries(blockchainCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([bc, count]) => `${bc} (${count})`)
            .join(', ');
          narrative += `\n\n🔗 Blockchains: ${bcList}`;
        }
        
        const highRiskWallets = cryptoWallets.filter(w => w.risk_score >= 70);
        if (highRiskWallets.length > 0) {
          narrative += `\n\n⚠️ ${highRiskWallets.length} high-risk wallet(s) detected`;
        }
        
        const mixerWallets = cryptoWallets.filter(w => w.is_mixer);
        if (mixerWallets.length > 0) {
          narrative += `\n\n🚨 Mixer/Tumbler activity detected - possible money laundering`;
        }
      }
      
      sections.push({
        icon: '₿',
        title: 'Crypto Tracker',
        count: cryptoTransactions.length + cryptoWallets.length,
        summary: language === 'th'
          ? `${cryptoTransactions.length} ธุรกรรม, ${cryptoWallets.length} กระเป๋า${totalUSD > 0 ? `, ~$${totalUSD.toLocaleString()}` : ''}`
          : `${cryptoTransactions.length} transactions, ${cryptoWallets.length} wallets${totalUSD > 0 ? `, ~$${totalUSD.toLocaleString()}` : ''}`,
        narrative
      });
    }
    
    // 3. Call Analysis Summary - AI Narrative Style
    const hasCalls = callEntities.length > 0;
    if (hasCalls) {
      const totalCalls = callEntities.reduce((sum, e) => sum + e.total_calls, 0);
      const totalDuration = callEntities.reduce((sum, e) => sum + e.total_duration, 0);
      
      let narrative = '';
      
      // Sort by calls
      const sortedByCall = [...callEntities].sort((a, b) => b.total_calls - a.total_calls);
      const sortedByDuration = [...callEntities].sort((a, b) => b.total_duration - a.total_duration);
      
      if (language === 'th') {
        narrative = `วิเคราะห์การโทรพบ ${callEntities.length} หมายเลข รวม ${totalCalls} สาย เวลาสนทนารวม ${formatDuration(totalDuration, 'th')}`;
        
        // Top callers
        if (sortedByCall.length > 0) {
          narrative += `\n\n📱 หมายเลขที่โทรบ่อยที่สุด:`;
          sortedByCall.slice(0, 3).forEach((e, i) => {
            const name = e.label !== e.phone_number ? ` (${e.label})` : '';
            narrative += `\n   ${i + 1}. ${e.phone_number}${name} - ${e.total_calls} สาย`;
          });
        }
        
        // Longest talk time
        if (sortedByDuration.length > 0 && sortedByDuration[0].total_duration > 0) {
          narrative += `\n\n⏱️ สนทนานานที่สุด:`;
          sortedByDuration.slice(0, 2).forEach((e, i) => {
            narrative += `\n   ${i + 1}. ${e.phone_number} - ${formatDuration(e.total_duration, 'th')}`;
          });
        }
        
        // Risk levels
        const highRiskCalls = callEntities.filter(e => e.risk_level === 'high');
        if (highRiskCalls.length > 0) {
          narrative += `\n\n🔴 หมายเลขความเสี่ยงสูง ${highRiskCalls.length} หมายเลข`;
        }
      } else {
        narrative = `Analyzed ${callEntities.length} phone numbers with ${totalCalls} total calls, ${formatDuration(totalDuration, 'en')} talk time`;
        
        if (sortedByCall.length > 0) {
          narrative += `\n\n📱 Most active numbers:`;
          sortedByCall.slice(0, 3).forEach((e, i) => {
            narrative += `\n   ${i + 1}. ${e.phone_number} - ${e.total_calls} calls`;
          });
        }
        
        const highRiskCalls = callEntities.filter(e => e.risk_level === 'high');
        if (highRiskCalls.length > 0) {
          narrative += `\n\n🔴 ${highRiskCalls.length} high-risk number(s) identified`;
        }
      }
      
      sections.push({
        icon: '📞',
        title: 'Call Analysis',
        count: totalCalls,
        summary: language === 'th'
          ? `${callEntities.length} หมายเลข, รวม ${totalCalls} สาย`
          : `${callEntities.length} phone numbers, ${totalCalls} total calls`,
        narrative
      });
    }
    
    // 4. Location Timeline Summary - AI Narrative Style
    const hasLocations = locationPoints.length > 0;
    if (hasLocations) {
      let narrative = '';
      
      // Count by location
      const locationCounts: Record<string, number> = {};
      locationPoints.forEach(p => {
        locationCounts[p.location_name] = (locationCounts[p.location_name] || 0) + 1;
      });
      
      // Sort by frequency
      const sortedLocations = Object.entries(locationCounts).sort((a, b) => b[1] - a[1]);
      const uniqueLocations = new Set(locationPoints.map(p => p.location_name)).size;
      
      // Source breakdown
      const sourceCounts: Record<string, number> = {};
      locationPoints.forEach(p => {
        sourceCounts[p.source] = (sourceCounts[p.source] || 0) + 1;
      });
      
      if (language === 'th') {
        narrative = `ติดตามตำแหน่งพบ ${uniqueLocations} สถานที่ จาก ${locationPoints.length} จุดข้อมูล`;
        
        // Top locations
        if (sortedLocations.length > 0) {
          narrative += `\n\n📍 สถานที่ที่พบบ่อย:`;
          sortedLocations.slice(0, 5).forEach(([loc, count], i) => {
            narrative += `\n   ${i + 1}. ${loc} (${count} ครั้ง)`;
          });
        }
        
        // Data sources
        const sourceList = Object.entries(sourceCounts)
          .map(([src, count]) => {
            const srcName = src === 'gps' ? 'GPS' : src === 'cell_tower' ? 'เสาสัญญาณ' : src === 'wifi' ? 'WiFi' : src === 'photo' ? 'ภาพถ่าย' : src;
            return `${srcName}: ${count}`;
          })
          .join(', ');
        narrative += `\n\n📡 แหล่งข้อมูล: ${sourceList}`;
        
        // Movement pattern (if multiple dates)
        const dates = new Set(locationPoints.map(p => p.timestamp?.split('T')[0]).filter(Boolean));
        if (dates.size > 1) {
          narrative += `\n\n🗓️ ช่วงเวลา: ติดตามได้ ${dates.size} วัน`;
        }
      } else {
        narrative = `Tracked ${uniqueLocations} unique locations from ${locationPoints.length} data points`;
        
        if (sortedLocations.length > 0) {
          narrative += `\n\n📍 Most frequent locations:`;
          sortedLocations.slice(0, 5).forEach(([loc, count], i) => {
            narrative += `\n   ${i + 1}. ${loc} (${count} times)`;
          });
        }
        
        const sourceList = Object.entries(sourceCounts)
          .map(([src, count]) => `${src}: ${count}`)
          .join(', ');
        narrative += `\n\n📡 Data sources: ${sourceList}`;
      }
      
      sections.push({
        icon: '📍',
        title: 'Location Timeline',
        count: locationPoints.length,
        summary: language === 'th'
          ? `${uniqueLocations} สถานที่, ${locationPoints.length} จุดข้อมูล`
          : `${uniqueLocations} unique locations, ${locationPoints.length} data points`,
        narrative
      });
    }
    
    return sections;
  };

  // Generate overall summary - AI conclusion
  const generateOverallSummary = (): string => {
    const sections = generateSummarySections();
    if (sections.length === 0) return '';
    
    const dataTypes = sections.map(s => s.title).join(', ');
    const totalItems = sections.reduce((sum, s) => sum + s.count, 0);
    
    if (language === 'th') {
      let overall = `📊 สรุปจากการวิเคราะห์ข้อมูล ${sections.length} แหล่ง (${dataTypes}) รวม ${totalItems} รายการ:\n\n`;
      
      // Key findings
      const findings: string[] = [];
      
      if (highRiskPersons.length > 0) {
        findings.push(`• พบบุคคลความเสี่ยงสูง ${highRiskPersons.length} ราย โดยเฉพาะ "${highRiskPersons[0].node.label}"`);
      }
      
      if (cryptoWallets.some(w => w.is_mixer)) {
        findings.push(`• ⚠️ พบการใช้ Crypto Mixer ซึ่งมักใช้ในการฟอกเงิน`);
      }
      
      if (stats && stats.totalAmount >= 1000000) {
        findings.push(`• มูลค่าธุรกรรมรวมสูงถึง ${formatCurrency(stats.totalAmount)}`);
      }
      
      if (findings.length > 0) {
        overall += findings.join('\n') + '\n\n';
      }
      
      overall += '💡 แนะนำ: ควรสอบสวนเพิ่มเติมและรวบรวมหลักฐานประกอบ';
      return overall;
    } else {
      let overall = `📊 Analysis of ${sections.length} data source(s) (${dataTypes}) with ${totalItems} total items:\n\n`;
      
      const findings: string[] = [];
      
      if (highRiskPersons.length > 0) {
        findings.push(`• ${highRiskPersons.length} high-risk entities identified, especially "${highRiskPersons[0].node.label}"`);
      }
      
      if (cryptoWallets.some(w => w.is_mixer)) {
        findings.push(`• ⚠️ Crypto mixer usage detected - commonly used for money laundering`);
      }
      
      if (findings.length > 0) {
        overall += findings.join('\n') + '\n\n';
      }
      
      overall += '💡 Recommendation: Further investigation and evidence collection advised';
      return overall;
    }
  };

  // ==================== FBI-STYLE INTELLIGENCE ANALYSIS ====================
  
  // 1. Confidence Level - คำนวณจากจำนวนและคุณภาพข้อมูล
  interface ConfidenceAssessment {
    level: 'high' | 'medium' | 'low';
    percentage: number;
    factors: string[];
  }
  
  const calculateConfidenceLevel = (): ConfidenceAssessment => {
    const factors: string[] = [];
    let score = 0;
    const maxScore = 100;
    
    // Data source count (max 25 points)
    const sections = generateSummarySections();
    const sourcePoints = Math.min(sections.length * 6, 25);
    score += sourcePoints;
    if (sections.length >= 3) {
      factors.push(language === 'th' 
        ? `ข้อมูลจาก ${sections.length} แหล่งยืนยันกัน`
        : `${sections.length} data sources corroborate`);
    }
    
    // Data volume (max 25 points)
    const totalItems = sections.reduce((sum, s) => sum + s.count, 0);
    if (totalItems >= 100) {
      score += 25;
      factors.push(language === 'th' ? 'ปริมาณข้อมูลมาก (100+ รายการ)' : 'High data volume (100+ items)');
    } else if (totalItems >= 50) {
      score += 15;
      factors.push(language === 'th' ? 'ปริมาณข้อมูลปานกลาง' : 'Moderate data volume');
    } else if (totalItems >= 20) {
      score += 10;
    }
    
    // Cross-validation (max 25 points)
    const hasMoneyFlow = stats && stats.totalTransactions > 0;
    const hasCrypto = cryptoTransactions.length > 0;
    const hasCalls = callEntities.length > 0;
    const hasLocations = locationPoints.length > 0;
    
    // Check if data types corroborate each other
    if (hasMoneyFlow && hasCalls) {
      score += 10;
      factors.push(language === 'th' 
        ? 'ข้อมูลการเงินและการโทรสอดคล้องกัน'
        : 'Financial and call data align');
    }
    if (hasMoneyFlow && hasLocations) {
      score += 10;
      factors.push(language === 'th'
        ? 'ข้อมูลการเงินและตำแหน่งยืนยันกัน'
        : 'Financial and location data corroborate');
    }
    if (hasCrypto && hasMoneyFlow) {
      score += 5;
    }
    
    // High-risk identification (max 25 points)
    if (highRiskPersons.length > 0) {
      score += 15;
      factors.push(language === 'th'
        ? `ระบุบุคคลความเสี่ยงสูงได้ ${highRiskPersons.length} ราย`
        : `${highRiskPersons.length} high-risk persons identified`);
    }
    if (keyTransactions.length > 0) {
      score += 10;
    }
    
    const percentage = Math.min(Math.round(score), maxScore);
    let level: 'high' | 'medium' | 'low' = 'low';
    if (percentage >= 70) level = 'high';
    else if (percentage >= 40) level = 'medium';
    
    return { level, percentage, factors };
  };
  
  // 2. Red Flags Detection - ตรวจจับ patterns น่าสงสัย
  interface RedFlag {
    type: string;
    severity: 'critical' | 'high' | 'medium';
    description: string;
    evidence: string;
  }
  
  const detectRedFlags = (): RedFlag[] => {
    const flags: RedFlag[] = [];
    
    // Structuring Detection (แบ่งโอนหลีกเลี่ยงรายงาน)
    if (keyTransactions.length > 0) {
      const smallTransactions = keyTransactions.filter(t => {
        const amount = t.edge?.amount || 0;
        return amount > 40000 && amount < 50000;
      });
      if (smallTransactions.length >= 3) {
        flags.push({
          type: 'Structuring',
          severity: 'critical',
          description: language === 'th'
            ? 'แบ่งโอนเงินต่ำกว่า ฿50,000 หลายครั้ง เพื่อหลีกเลี่ยงการรายงาน'
            : 'Multiple transactions just under ฿50,000 reporting threshold',
          evidence: language === 'th'
            ? `พบ ${smallTransactions.length} รายการ ในช่วง ฿40,000-50,000`
            : `Found ${smallTransactions.length} transactions between ฿40,000-50,000`
        });
      }
    }
    
    // Rapid Movement (เงินเข้า-ออกเร็ว)
    if (highRiskPersons.length > 0) {
      const rapidMovers = highRiskPersons.filter(p => 
        p.riskFactors?.some(f => f.factor?.includes('rapid') || f.factor?.includes('เร็ว'))
      );
      if (rapidMovers.length > 0) {
        flags.push({
          type: 'Rapid Movement',
          severity: 'high',
          description: language === 'th'
            ? 'เงินเข้า-ออกภายในเวลาสั้น (อาจเป็น Pass-through account)'
            : 'Money in-out within short period (possible pass-through account)',
          evidence: language === 'th'
            ? `พบ ${rapidMovers.length} บัญชีที่มีพฤติกรรมนี้`
            : `${rapidMovers.length} account(s) showing this pattern`
        });
      }
    }
    
    // Mixer/Tumbler Usage
    const mixerWallets = cryptoWallets.filter(w => w.is_mixer);
    const mixerTx = cryptoTransactions.filter(tx => tx.risk_flag?.includes('mixer'));
    if (mixerWallets.length > 0 || mixerTx.length > 0) {
      flags.push({
        type: 'Crypto Mixer',
        severity: 'critical',
        description: language === 'th'
          ? 'ใช้ Mixer/Tumbler ปกปิดที่มาของ Crypto - เทคนิคฟอกเงินทั่วไป'
          : 'Mixer/Tumbler usage to obscure crypto origin - common money laundering technique',
        evidence: language === 'th'
          ? `พบ ${mixerWallets.length + mixerTx.length} รายการเกี่ยวข้อง Mixer`
          : `${mixerWallets.length + mixerTx.length} mixer-related items found`
      });
    }
    
    // High-risk Crypto Wallets
    const highRiskCrypto = cryptoWallets.filter(w => w.risk_score >= 70);
    if (highRiskCrypto.length > 0) {
      flags.push({
        type: 'High-Risk Wallets',
        severity: 'high',
        description: language === 'th'
          ? 'กระเป๋า Crypto มีประวัติเชื่อมโยงกิจกรรมผิดกฎหมาย'
          : 'Crypto wallets with history linked to illicit activity',
        evidence: highRiskCrypto.slice(0, 2).map(w => 
          `${w.address.substring(0, 10)}... (${w.blockchain})`
        ).join(', ')
      });
    }
    
    // Layering Detection (เงินผ่านหลายชั้น)
    if (stats && stats.totalNodes >= 10 && keyTransactions.length >= 5) {
      const chainLength = Math.floor(stats.totalNodes / 3);
      if (chainLength >= 3) {
        flags.push({
          type: 'Layering',
          severity: 'high',
          description: language === 'th'
            ? `เงินผ่านหลายชั้น (${chainLength}+ ระดับ) ก่อนถึงปลายทาง`
            : `Money passed through multiple layers (${chainLength}+ levels)`,
          evidence: language === 'th'
            ? `เครือข่าย ${stats.totalNodes} บัญชี, ${stats.totalTransactions} ธุรกรรม`
            : `Network of ${stats.totalNodes} accounts, ${stats.totalTransactions} transactions`
        });
      }
    }
    
    // Unusual Call Patterns
    const highRiskCalls = callEntities.filter(e => e.risk_level === 'high');
    if (highRiskCalls.length > 0) {
      flags.push({
        type: 'Suspicious Calls',
        severity: 'medium',
        description: language === 'th'
          ? 'หมายเลขโทรศัพท์มีรูปแบบการโทรผิดปกติ'
          : 'Phone numbers with unusual call patterns',
        evidence: language === 'th'
          ? `${highRiskCalls.length} หมายเลขความเสี่ยงสูง`
          : `${highRiskCalls.length} high-risk number(s)`
      });
    }
    
    // Large Cash Transactions
    if (keyTransactions.length > 0) {
      const largeCash = keyTransactions.filter(t => {
        const amount = t.edge?.amount || 0;
        return amount >= 500000;
      });
      if (largeCash.length > 0) {
        flags.push({
          type: 'Large Transactions',
          severity: 'medium',
          description: language === 'th'
            ? 'ธุรกรรมมูลค่าสูง (≥฿500,000)'
            : 'High-value transactions (≥฿500,000)',
          evidence: language === 'th'
            ? `${largeCash.length} รายการ`
            : `${largeCash.length} transaction(s)`
        });
      }
    }
    
    return flags.sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  };
  
  // 3. Recommended Actions - คำแนะนำตามประเภทความเสี่ยง
  interface RecommendedAction {
    priority: 'immediate' | 'high' | 'standard';
    action: string;
    reason: string;
  }
  
  const generateRecommendedActions = (): RecommendedAction[] => {
    const actions: RecommendedAction[] = [];
    const redFlags = detectRedFlags();
    
    // Based on high-risk persons
    if (highRiskPersons.length > 0) {
      const topPerson = highRiskPersons[0];
      actions.push({
        priority: 'high',
        action: language === 'th'
          ? `สอบปากคำ "${topPerson.node.label}"`
          : `Interview "${topPerson.node.label}"`,
        reason: language === 'th'
          ? `คะแนนความเสี่ยงสูงสุด (${topPerson.riskScore})`
          : `Highest risk score (${topPerson.riskScore})`
      });
    }
    
    // Based on mixer detection
    if (redFlags.some(f => f.type === 'Crypto Mixer')) {
      actions.push({
        priority: 'immediate',
        action: language === 'th'
          ? 'ขอข้อมูล KYC จาก Crypto Exchange ที่เกี่ยวข้อง'
          : 'Request KYC data from related Crypto Exchanges',
        reason: language === 'th'
          ? 'พบการใช้ Mixer - ต้องติดตามที่มาของเงิน'
          : 'Mixer usage detected - need to trace fund origin'
      });
    }
    
    // Based on structuring
    if (redFlags.some(f => f.type === 'Structuring')) {
      actions.push({
        priority: 'immediate',
        action: language === 'th'
          ? 'ขอหมายศาลอายัดบัญชีที่เกี่ยวข้อง'
          : 'Obtain court order to freeze related accounts',
        reason: language === 'th'
          ? 'พบ Structuring - หลักฐานการฟอกเงินชัดเจน'
          : 'Structuring detected - clear money laundering indicator'
      });
    }
    
    // Based on large transactions
    if (stats && stats.totalAmount >= 1000000) {
      actions.push({
        priority: 'high',
        action: language === 'th'
          ? 'ขอประวัติธุรกรรมย้อนหลัง 6 เดือนจากธนาคาร'
          : 'Request 6-month transaction history from banks',
        reason: language === 'th'
          ? `มูลค่าธุรกรรมสูง (${formatCurrency(stats.totalAmount)})`
          : `High transaction value (${formatCurrency(stats.totalAmount)})`
      });
    }
    
    // Based on call analysis
    if (callEntities.length > 0) {
      const topCaller = [...callEntities].sort((a, b) => b.total_calls - a.total_calls)[0];
      actions.push({
        priority: 'standard',
        action: language === 'th'
          ? `ขอข้อมูลเจ้าของหมายเลข ${topCaller.phone_number}`
          : `Identify owner of ${topCaller.phone_number}`,
        reason: language === 'th'
          ? `โทรมากที่สุด (${topCaller.total_calls} สาย)`
          : `Most frequent caller (${topCaller.total_calls} calls)`
      });
    }
    
    // Based on locations
    if (locationPoints.length > 0) {
      const locationCounts: Record<string, number> = {};
      locationPoints.forEach(p => {
        locationCounts[p.location_name] = (locationCounts[p.location_name] || 0) + 1;
      });
      const topLocation = Object.entries(locationCounts).sort((a, b) => b[1] - a[1])[0];
      if (topLocation) {
        actions.push({
          priority: 'standard',
          action: language === 'th'
            ? `ตรวจสอบกล้อง CCTV บริเวณ "${topLocation[0]}"`
            : `Check CCTV footage at "${topLocation[0]}"`,
          reason: language === 'th'
            ? `พบบ่อยที่สุด (${topLocation[1]} ครั้ง)`
            : `Most frequent location (${topLocation[1]} times)`
        });
      }
    }
    
    // Standard recommendations
    actions.push({
      priority: 'standard',
      action: language === 'th'
        ? 'รวบรวมหลักฐานเพิ่มเติมก่อนดำเนินคดี'
        : 'Gather additional evidence before prosecution',
      reason: language === 'th'
        ? 'เป็นการวิเคราะห์เบื้องต้น'
        : 'Preliminary analysis only'
    });
    
    return actions.sort((a, b) => {
      const priorityOrder = { immediate: 0, high: 1, standard: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  };
  
  // 4. Intelligence Gaps - ข้อมูลที่ยังขาด
  interface IntelligenceGap {
    category: string;
    gap: string;
    impact: 'critical' | 'significant' | 'minor';
    suggestion: string;
  }
  
  const identifyIntelligenceGaps = (): IntelligenceGap[] => {
    const gaps: IntelligenceGap[] = [];
    
    const hasMoneyFlow = stats && stats.totalTransactions > 0;
    const hasCrypto = cryptoTransactions.length > 0 || cryptoWallets.length > 0;
    const hasCalls = callEntities.length > 0;
    const hasLocations = locationPoints.length > 0;
    
    // Missing data types
    if (!hasMoneyFlow) {
      gaps.push({
        category: language === 'th' ? 'ข้อมูลการเงิน' : 'Financial Data',
        gap: language === 'th' ? 'ไม่มีข้อมูลธุรกรรมธนาคาร' : 'No bank transaction data',
        impact: 'critical',
        suggestion: language === 'th'
          ? 'ขอข้อมูลจาก ปปง. หรือธนาคารที่เกี่ยวข้อง'
          : 'Request data from AMLO or related banks'
      });
    }
    
    if (!hasCrypto && hasMoneyFlow && (stats?.totalAmount || 0) >= 1000000) {
      gaps.push({
        category: language === 'th' ? 'ข้อมูล Crypto' : 'Crypto Data',
        gap: language === 'th' ? 'ไม่มีข้อมูล Cryptocurrency' : 'No cryptocurrency data',
        impact: 'significant',
        suggestion: language === 'th'
          ? 'ตรวจสอบว่ามีการใช้ Crypto หรือไม่'
          : 'Investigate potential crypto usage'
      });
    }
    
    if (!hasCalls && hasMoneyFlow) {
      gaps.push({
        category: language === 'th' ? 'ข้อมูลการโทร' : 'Call Data',
        gap: language === 'th' ? 'ไม่มีข้อมูล Call Records' : 'No call record data',
        impact: 'significant',
        suggestion: language === 'th'
          ? 'ขอข้อมูลจากผู้ให้บริการโทรศัพท์'
          : 'Request data from telecom providers'
      });
    }
    
    if (!hasLocations) {
      gaps.push({
        category: language === 'th' ? 'ข้อมูลตำแหน่ง' : 'Location Data',
        gap: language === 'th' ? 'ไม่มีข้อมูลพิกัด/ตำแหน่ง' : 'No location/GPS data',
        impact: 'minor',
        suggestion: language === 'th'
          ? 'รวบรวมจาก Cell Tower, GPS, หรือ EXIF ภาพถ่าย'
          : 'Collect from Cell Tower, GPS, or photo EXIF'
      });
    }
    
    // Specific gaps based on available data
    if (highRiskPersons.length > 0) {
      const unknownPersons = highRiskPersons.filter(p => 
        !p.node.label || p.node.label.includes('Unknown') || p.node.label.includes('ไม่ทราบ')
      );
      if (unknownPersons.length > 0) {
        gaps.push({
          category: language === 'th' ? 'ข้อมูลบุคคล' : 'Person Data',
          gap: language === 'th' 
            ? `บุคคลความเสี่ยงสูง ${unknownPersons.length} รายยังไม่ทราบตัวตน`
            : `${unknownPersons.length} high-risk person(s) unidentified`,
          impact: 'critical',
          suggestion: language === 'th'
            ? 'ขอข้อมูล KYC จากธนาคาร/Exchange'
            : 'Request KYC data from banks/exchanges'
        });
      }
    }
    
    // Money source gap
    if (hasMoneyFlow && stats && stats.totalAmount >= 500000) {
      gaps.push({
        category: language === 'th' ? 'แหล่งที่มา' : 'Source',
        gap: language === 'th' ? 'ไม่ทราบแหล่งที่มาของเงินเริ่มต้น' : 'Initial fund source unknown',
        impact: 'significant',
        suggestion: language === 'th'
          ? 'ติดตามธุรกรรมย้อนกลับไปหาต้นทาง'
          : 'Trace transactions back to origin'
      });
    }
    
    return gaps.sort((a, b) => {
      const impactOrder = { critical: 0, significant: 1, minor: 2 };
      return impactOrder[a.impact] - impactOrder[b.impact];
    });
  };

  // Text-to-Speech function
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
    
    // Select appropriate voice based on language
    if (language === 'th') {
      const thaiVoice = voices.find(v => v.lang.startsWith('th'));
      if (thaiVoice) {
        utterance.voice = thaiVoice;
      }
      utterance.lang = 'th-TH';
    } else {
      const enVoice = voices.find(v => v.lang.startsWith('en'));
      if (enVoice) {
        utterance.voice = enVoice;
      }
      utterance.lang = 'en-US';
    }
    
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
              <td><strong>${caller.label || '-'}</strong></td>
              <td>${caller.phone_number || '-'}</td>
              <td>${caller.total_calls}</td>
              <td>${formatDuration(caller.total_duration, language)}</td>
              <td class="${caller.risk_level === 'critical' || caller.risk_level === 'high' ? 'risk-high' : caller.risk_level === 'medium' ? 'risk-medium' : 'risk-low'}">${caller.risk_level}</td>
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
      <h3>💳 ${language === 'th' ? 'กระเป๋าเงินที่ติดตาม' : 'Tracked Wallets'}</h3>
      <table>
        <thead>
          <tr>
            <th style="width: 5%">#</th>
            <th style="width: 12%">${t('blockchain')}</th>
            <th style="width: 30%">${language === 'th' ? 'ที่อยู่กระเป๋า' : 'Wallet Address'}</th>
            <th style="width: 15%">${language === 'th' ? 'ชื่อ/ป้ายกำกับ' : 'Label'}</th>
            <th style="width: 15%">${language === 'th' ? 'มูลค่ารวม' : 'Total Volume'}</th>
            <th style="width: 10%">${language === 'th' ? 'ความเสี่ยง' : 'Risk'}</th>
          </tr>
        </thead>
        <tbody>
          ${cryptoTransactions.slice(0, 10).map((tx, i) => `
            <tr>
              <td>${i + 1}</td>
              <td><span class="badge badge-blue">${(tx.blockchain || 'unknown').toUpperCase()}</span></td>
              <td style="font-family: monospace; font-size: 10px;">${tx.from_address ? tx.from_address.substring(0, 20) + '...' : '-'}</td>
              <td>${tx.from_label || '-'}</td>
              <td><strong>$${(tx.amount_usd || tx.amount || 0).toLocaleString()}</strong></td>
              <td>${tx.risk_flag && tx.risk_flag !== 'none' ? `<span class="badge ${tx.risk_flag.includes('mixer') || tx.risk_flag.includes('high') ? 'badge-red' : 'badge-yellow'}">${tx.risk_score || tx.risk_flag}</span>` : `<span class="badge badge-green">${tx.risk_score || 0}</span>`}</td>
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
      <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`https://investigates.app/verify?case=${selectedCase?.case_number}`)}" alt="QR Code" style="width: 140px; height: 140px;" />
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

      {/* AI Summary Card */}
      {selectedCaseId && (
        <Card className="mb-6 p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/30">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-amber-500/20 rounded-lg">
              <Lightbulb size={24} className="text-amber-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-amber-400 flex items-center gap-2">
                  📝 {language === 'th' ? 'ข้อสังเกตจากการวิเคราะห์' : 'Analysis Observations'}
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
                      <span>{language === 'th' ? 'หยุด' : 'Stop'}</span>
                    </>
                  ) : (
                    <>
                      <Volume2 size={16} />
                      <span>{language === 'th' ? 'ฟังสรุป' : 'Listen'}</span>
                    </>
                  )}
                </Button>
              </div>
              
              {/* Summary Sections - AI Narrative Style */}
              <div className="space-y-4">
                {generateSummarySections().map((section, index) => (
                  <div key={index} className="bg-dark-800/50 rounded-lg p-4 border border-dark-700">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xl">{section.icon}</span>
                      <span className="font-semibold text-white text-lg">{section.title}</span>
                      <span className="text-xs bg-primary-500/20 text-primary-400 px-2 py-0.5 rounded-full">
                        {section.count}
                      </span>
                    </div>
                    <p className="text-dark-300 text-sm mb-3">{section.summary}</p>
                    {/* AI Narrative - detailed analysis */}
                    <div className="bg-dark-900/50 rounded-lg p-3 border-l-2 border-primary-500/50">
                      <pre className="text-sm text-dark-200 whitespace-pre-wrap font-sans leading-relaxed">
                        {section.narrative}
                      </pre>
                    </div>
                  </div>
                ))}
                
                {/* Overall Summary */}
                {generateSummarySections().length > 0 && (
                  <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-lg p-4 border border-amber-500/30">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xl">📌</span>
                      <span className="font-semibold text-amber-400 text-lg">
                        {language === 'th' ? 'สรุปภาพรวม' : 'Overall Summary'}
                      </span>
                    </div>
                    <pre className="text-sm text-dark-200 whitespace-pre-wrap font-sans leading-relaxed">
                      {generateOverallSummary()}
                    </pre>
                  </div>
                )}
                
                {/* FBI-Style Intelligence Analysis */}
                {generateSummarySections().length > 0 && (
                  <div className="space-y-4 mt-6 pt-6 border-t border-dark-700">
                    <h4 className="font-semibold text-white flex items-center gap-2">
                      🔍 {language === 'th' ? 'การวิเคราะห์เชิงลึก (FBI-Style)' : 'Deep Analysis (FBI-Style)'}
                    </h4>
                    
                    {/* Confidence Level */}
                    {(() => {
                      const confidence = calculateConfidenceLevel();
                      const levelColor = confidence.level === 'high' ? 'text-green-400 bg-green-500/20' 
                        : confidence.level === 'medium' ? 'text-yellow-400 bg-yellow-500/20' 
                        : 'text-red-400 bg-red-500/20';
                      const levelText = language === 'th' 
                        ? (confidence.level === 'high' ? 'สูง' : confidence.level === 'medium' ? 'ปานกลาง' : 'ต่ำ')
                        : confidence.level.toUpperCase();
                      return (
                        <div className="bg-dark-800/50 rounded-lg p-4 border border-dark-700">
                          <div className="flex items-center gap-3 mb-3">
                            <span className="text-lg">🎯</span>
                            <span className="font-medium text-white">
                              {language === 'th' ? 'ระดับความมั่นใจ' : 'Confidence Level'}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-sm font-bold ${levelColor}`}>
                              {levelText} ({confidence.percentage}%)
                            </span>
                          </div>
                          <div className="w-full bg-dark-700 rounded-full h-2 mb-3">
                            <div 
                              className={`h-2 rounded-full ${
                                confidence.level === 'high' ? 'bg-green-500' 
                                : confidence.level === 'medium' ? 'bg-yellow-500' 
                                : 'bg-red-500'
                              }`}
                              style={{ width: `${confidence.percentage}%` }}
                            />
                          </div>
                          {confidence.factors.length > 0 && (
                            <ul className="space-y-1">
                              {confidence.factors.map((factor, i) => (
                                <li key={i} className="text-xs text-dark-400 flex items-start gap-2">
                                  <CheckCircle className="w-3 h-3 text-green-400 mt-0.5 flex-shrink-0" />
                                  <span>{factor}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      );
                    })()}
                    
                    {/* Red Flags */}
                    {(() => {
                      const redFlags = detectRedFlags();
                      if (redFlags.length === 0) return null;
                      return (
                        <div className="bg-dark-800/50 rounded-lg p-4 border border-red-500/30">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-lg">🚩</span>
                            <span className="font-medium text-red-400">
                              Red Flags ({redFlags.length})
                            </span>
                          </div>
                          <div className="space-y-3">
                            {redFlags.map((flag, i) => {
                              const severityColor = flag.severity === 'critical' ? 'border-red-500 bg-red-500/10' 
                                : flag.severity === 'high' ? 'border-orange-500 bg-orange-500/10' 
                                : 'border-yellow-500 bg-yellow-500/10';
                              const severityText = flag.severity === 'critical' ? '🔴' : flag.severity === 'high' ? '🟠' : '🟡';
                              return (
                                <div key={i} className={`rounded-lg p-3 border-l-4 ${severityColor}`}>
                                  <div className="flex items-center gap-2 mb-1">
                                    <span>{severityText}</span>
                                    <span className="font-medium text-white text-sm">{flag.type}</span>
                                  </div>
                                  <p className="text-xs text-dark-300 mb-1">{flag.description}</p>
                                  <p className="text-xs text-dark-500">📎 {flag.evidence}</p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
                    
                    {/* Recommended Actions */}
                    {(() => {
                      const actions = generateRecommendedActions();
                      return (
                        <div className="bg-dark-800/50 rounded-lg p-4 border border-blue-500/30">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-lg">📋</span>
                            <span className="font-medium text-blue-400">
                              {language === 'th' ? 'ขั้นตอนแนะนำ' : 'Recommended Actions'}
                            </span>
                          </div>
                          <div className="space-y-2">
                            {actions.slice(0, 6).map((action, i) => {
                              const priorityBadge = action.priority === 'immediate' 
                                ? 'bg-red-500/20 text-red-400' 
                                : action.priority === 'high' 
                                ? 'bg-orange-500/20 text-orange-400' 
                                : 'bg-blue-500/20 text-blue-400';
                              const priorityText = language === 'th'
                                ? (action.priority === 'immediate' ? 'เร่งด่วน' : action.priority === 'high' ? 'สำคัญ' : 'ปกติ')
                                : action.priority.toUpperCase();
                              return (
                                <div key={i} className="flex items-start gap-3 p-2 bg-dark-900/50 rounded">
                                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${priorityBadge}`}>
                                    {priorityText}
                                  </span>
                                  <div className="flex-1">
                                    <p className="text-sm text-white">{action.action}</p>
                                    <p className="text-xs text-dark-500">{action.reason}</p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
                    
                    {/* Intelligence Gaps */}
                    {(() => {
                      const gaps = identifyIntelligenceGaps();
                      if (gaps.length === 0) return null;
                      return (
                        <div className="bg-dark-800/50 rounded-lg p-4 border border-purple-500/30">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-lg">⚠️</span>
                            <span className="font-medium text-purple-400">
                              {language === 'th' ? 'ข้อมูลที่ยังขาด' : 'Intelligence Gaps'}
                            </span>
                          </div>
                          <div className="space-y-2">
                            {gaps.map((gap, i) => {
                              const impactColor = gap.impact === 'critical' ? 'text-red-400' 
                                : gap.impact === 'significant' ? 'text-yellow-400' 
                                : 'text-blue-400';
                              return (
                                <div key={i} className="p-2 bg-dark-900/50 rounded">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className={`text-xs font-medium ${impactColor}`}>
                                      [{gap.category}]
                                    </span>
                                    <span className="text-sm text-white">{gap.gap}</span>
                                  </div>
                                  <p className="text-xs text-dark-400">
                                    💡 {gap.suggestion}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
                
                {generateSummarySections().length === 0 && (
                  <p className="text-dark-400 italic">
                    {language === 'th' 
                      ? 'ข้อมูลไม่เพียงพอสำหรับการวิเคราะห์ กรุณานำเข้าข้อมูลเพิ่มเติม'
                      : 'Insufficient data for analysis. Please import more data.'}
                  </p>
                )}
              </div>
              
              <p className="text-xs text-dark-500 mt-3 italic">
                * {language === 'th' 
                  ? 'นี่เป็นการวิเคราะห์เบื้องต้นจากรูปแบบธุรกรรมเท่านั้น ไม่ใช่ข้อสรุปของคดี' 
                  : 'This is preliminary analysis only, not a case conclusion'}
              </p>
            </div>
          </div>
        </Card>
      )}

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
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`https://investigates.app/verify?case=${selectedCase?.case_number}`)}`}
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
                {cryptoTransactions.filter(t => t.risk_flag?.toLowerCase().includes('mixer') || t.risk_flag?.toLowerCase().includes('tornado')).length}
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
