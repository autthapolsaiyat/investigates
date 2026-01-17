import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Upload, 
  FileText, 
  Users, 
  Phone, 
  Wallet,
  CheckCircle,
  AlertCircle,
  Loader2,
  Network,
  ArrowRight,
  Trash2,
  Eye,
  Sparkles,
  Link2
} from 'lucide-react';
import { casesAPI } from '../../services/api';

// Types
interface ParsedFile {
  id: string;
  name: string;
  type: 'bank' | 'person' | 'phone' | 'crypto' | 'unknown';
  typeLabel: string;
  icon: React.ReactNode;
  records: Record<string, string>[];
  columns: string[];
  status: 'pending' | 'parsed' | 'error';
  error?: string;
}

interface LinkedEntity {
  type: 'person' | 'account' | 'phone' | 'wallet';
  value: string;
  label: string;
  sources: string[];
  riskScore?: number;
}

interface NetworkNode {
  id: string;
  label: string;
  type: string;
  amount?: number;
  riskScore?: number;
  metadata?: Record<string, string>;
}

interface NetworkEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  amount?: number;
  date?: string;
}

interface AnalysisResult {
  entities: LinkedEntity[];
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  summary: {
    totalRecords: number;
    totalPersons: number;
    totalAccounts: number;
    totalTransactions: number;
    totalAmount: number;
    linkedEntities: number;
  };
}

// Helper: Detect file type from columns
const detectFileType = (columns: string[]): { type: ParsedFile['type']; typeLabel: string } => {
  const cols = columns.map(c => c.toLowerCase().trim());
  
  // Bank transactions
  if (cols.some(c => c.includes('from_account') || c.includes('to_account')) &&
      cols.some(c => c.includes('amount'))) {
    return { type: 'bank', typeLabel: 'ธุรกรรมธนาคาร' };
  }
  
  // Person data
  if (cols.some(c => c.includes('id_card') || c.includes('first_name') || c.includes('role'))) {
    return { type: 'person', typeLabel: 'บุคคล' };
  }
  
  // Phone records
  if (cols.some(c => c.includes('from_number') || c.includes('to_number')) &&
      cols.some(c => c.includes('duration') || c.includes('call_type'))) {
    return { type: 'phone', typeLabel: 'ข้อมูลโทรศัพท์' };
  }
  
  // Crypto wallets
  if (cols.some(c => c.includes('wallet') || c.includes('tx_hash') || c.includes('currency'))) {
    return { type: 'crypto', typeLabel: 'กระเป๋าคริปโต' };
  }
  
  return { type: 'unknown', typeLabel: 'ไม่ทราบประเภท' };
};

// Helper: Parse CSV
const parseCSV = (text: string): { columns: string[]; records: Record<string, string>[] } => {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return { columns: [], records: [] };
  
  const columns = lines[0].split(',').map(c => c.trim());
  const records = lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim());
    const record: Record<string, string> = {};
    columns.forEach((col, i) => {
      record[col] = values[i] || '';
    });
    return record;
  });
  
  return { columns, records };
};

// Helper: Get icon for file type
const getFileIcon = (type: ParsedFile['type']) => {
  switch (type) {
    case 'bank': return <FileText className="w-5 h-5 text-blue-400" />;
    case 'person': return <Users className="w-5 h-5 text-green-400" />;
    case 'phone': return <Phone className="w-5 h-5 text-yellow-400" />;
    case 'crypto': return <Wallet className="w-5 h-5 text-purple-400" />;
    default: return <FileText className="w-5 h-5 text-gray-400" />;
  }
};

// Main Component
const SmartImport: React.FC = () => {
  const navigate = useNavigate();
  const [files, setFiles] = useState<ParsedFile[]>([]);
  const [cases, setCases] = useState<{ id: number; case_number: string; title: string }[]>([]);
  const [selectedCase, setSelectedCase] = useState<number | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isCreatingNetwork, setIsCreatingNetwork] = useState(false);
  const [step, setStep] = useState<'upload' | 'analyze' | 'result'>('upload');

  // Load cases on mount
  React.useEffect(() => {
    const loadCases = async () => {
      try {
        const response = await casesAPI.list({ page: 1, page_size: 100 });
        setCases(response.items.map((c: any) => ({
          id: c.id,
          case_number: c.case_number,
          title: c.title
        })));
      } catch (error) {
        console.error('Failed to load cases:', error);
      }
    };
    loadCases();
  }, []);

  // Handle file drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      f => f.name.endsWith('.csv')
    );
    processFiles(droppedFiles);
  }, []);

  // Handle file select
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []).filter(
      f => f.name.endsWith('.csv')
    );
    processFiles(selectedFiles);
  };

  // Process uploaded files
  const processFiles = async (newFiles: File[]) => {
    const parsedFiles: ParsedFile[] = [];
    
    for (const file of newFiles) {
      try {
        const text = await file.text();
        const { columns, records } = parseCSV(text);
        const { type, typeLabel } = detectFileType(columns);
        
        parsedFiles.push({
          id: `file-${Date.now()}-${Math.random()}`,
          name: file.name,
          type,
          typeLabel,
          icon: getFileIcon(type),
          records,
          columns,
          status: 'parsed'
        });
      } catch (error) {
        parsedFiles.push({
          id: `file-${Date.now()}-${Math.random()}`,
          name: file.name,
          type: 'unknown',
          typeLabel: 'Error',
          icon: <AlertCircle className="w-5 h-5 text-red-400" />,
          records: [],
          columns: [],
          status: 'error',
          error: 'ไม่สามารถอ่านไฟล์ได้'
        });
      }
    }
    
    setFiles(prev => [...prev, ...parsedFiles]);
  };

  // Remove file
  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
    setAnalysisResult(null);
    setStep('upload');
  };

  // Analyze files and find links
  const analyzeFiles = async () => {
    if (files.length === 0) return;
    
    setIsAnalyzing(true);
    setStep('analyze');
    
    // Simulate analysis delay for UX
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    try {
      const entities: LinkedEntity[] = [];
      const nodes: NetworkNode[] = [];
      const edges: NetworkEdge[] = [];
      const entityMap = new Map<string, LinkedEntity>();
      
      let totalRecords = 0;
      let totalAmount = 0;
      
      // Process each file type
      files.forEach(file => {
        totalRecords += file.records.length;
        
        if (file.type === 'bank') {
          file.records.forEach((record, idx) => {
            const amount = parseFloat(record.amount) || 0;
            totalAmount += amount;
            
            // From account
            const fromKey = `account:${record.from_account}`;
            if (!entityMap.has(fromKey)) {
              entityMap.set(fromKey, {
                type: 'account',
                value: record.from_account,
                label: record.from_name || record.from_account,
                sources: [file.name]
              });
            }
            
            // To account
            const toKey = `account:${record.to_account}`;
            if (!entityMap.has(toKey)) {
              entityMap.set(toKey, {
                type: 'account',
                value: record.to_account,
                label: record.to_name || record.to_account,
                sources: [file.name]
              });
            }
            
            // Create edge
            edges.push({
              id: `edge-bank-${idx}`,
              source: fromKey,
              target: toKey,
              label: record.note || 'โอนเงิน',
              amount,
              date: record.date
            });
          });
        }
        
        if (file.type === 'person') {
          file.records.forEach((record, idx) => {
            const personKey = `person:${record.id_card || record.first_name}`;
            const riskScore = parseInt(record.risk_score) || 0;
            
            entityMap.set(personKey, {
              type: 'person',
              value: record.id_card || '',
              label: `${record.prefix || ''} ${record.first_name || ''} ${record.last_name || ''}`.trim(),
              sources: [file.name],
              riskScore
            });
            
            // Link phone
            if (record.phone) {
              const phoneKey = `phone:${record.phone}`;
              if (!entityMap.has(phoneKey)) {
                entityMap.set(phoneKey, {
                  type: 'phone',
                  value: record.phone,
                  label: record.phone,
                  sources: [file.name]
                });
              }
              edges.push({
                id: `edge-person-phone-${idx}`,
                source: personKey,
                target: phoneKey,
                label: 'เบอร์โทร'
              });
            }
            
            // Link bank account
            if (record.bank_account) {
              const accountKey = `account:${record.bank_account}`;
              if (!entityMap.has(accountKey)) {
                entityMap.set(accountKey, {
                  type: 'account',
                  value: record.bank_account,
                  label: `${record.bank_account} (${record.bank || ''})`,
                  sources: [file.name]
                });
              }
              edges.push({
                id: `edge-person-account-${idx}`,
                source: personKey,
                target: accountKey,
                label: 'เจ้าของบัญชี'
              });
            }
          });
        }
        
        if (file.type === 'phone') {
          file.records.forEach((record, idx) => {
            const fromKey = `phone:${record.from_number}`;
            const toKey = `phone:${record.to_number}`;
            
            if (!entityMap.has(fromKey)) {
              entityMap.set(fromKey, {
                type: 'phone',
                value: record.from_number,
                label: record.from_name || record.from_number,
                sources: [file.name]
              });
            }
            
            if (!entityMap.has(toKey)) {
              entityMap.set(toKey, {
                type: 'phone',
                value: record.to_number,
                label: record.to_name || record.to_number,
                sources: [file.name]
              });
            }
            
            edges.push({
              id: `edge-phone-${idx}`,
              source: fromKey,
              target: toKey,
              label: `โทร ${record.duration_sec || 0} วินาที`,
              date: record.date
            });
          });
        }
        
        if (file.type === 'crypto') {
          file.records.forEach((record, idx) => {
            const amount = parseFloat(record.amount) || 0;
            const fromKey = `wallet:${record.from_wallet}`;
            const toKey = `wallet:${record.to_wallet}`;
            
            if (!entityMap.has(fromKey)) {
              entityMap.set(fromKey, {
                type: 'wallet',
                value: record.from_wallet,
                label: record.from_label || record.from_wallet?.substring(0, 10) + '...',
                sources: [file.name]
              });
            }
            
            if (!entityMap.has(toKey)) {
              entityMap.set(toKey, {
                type: 'wallet',
                value: record.to_wallet,
                label: record.to_label || record.to_wallet?.substring(0, 10) + '...',
                sources: [file.name]
              });
            }
            
            edges.push({
              id: `edge-crypto-${idx}`,
              source: fromKey,
              target: toKey,
              label: `${amount} ${record.currency || 'USDT'}`,
              amount: parseFloat(record.amount_usd) || amount,
              date: record.date
            });
          });
        }
      });
      
      // Convert entity map to arrays
      entityMap.forEach((entity, key) => {
        entities.push(entity);
        nodes.push({
          id: key,
          label: entity.label,
          type: entity.type === 'account' ? 'bank_account' : entity.type,
          riskScore: entity.riskScore
        });
      });
      
      // Find cross-file links (entities that appear in multiple files)
      const linkedEntities = entities.filter(e => 
        files.filter(f => 
          f.records.some(r => 
            Object.values(r).includes(e.value)
          )
        ).length > 1
      ).length;
      
      const result: AnalysisResult = {
        entities,
        nodes,
        edges,
        summary: {
          totalRecords,
          totalPersons: entities.filter(e => e.type === 'person').length,
          totalAccounts: entities.filter(e => e.type === 'account').length,
          totalTransactions: edges.length,
          totalAmount,
          linkedEntities
        }
      };
      
      setAnalysisResult(result);
      setStep('result');
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Create network from analysis
  const createNetwork = async () => {
    if (!analysisResult || !selectedCase) return;
    
    setIsCreatingNetwork(true);
    
    try {
      // Create nodes via API
      const nodeIdMap = new Map<string, number>();
      
      for (const node of analysisResult.nodes) {
        try {
          const response = await fetch(
            `https://investigates-api.azurewebsites.net/api/v1/cases/${selectedCase}/money-flow/nodes`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
              },
              body: JSON.stringify({
                label: node.label,
                node_type: node.type,
                risk_score: node.riskScore || 50,
                amount: node.amount || 0
              })
            }
          );
          
          if (response.ok) {
            const data = await response.json();
            nodeIdMap.set(node.id, data.id);
          }
        } catch (e) {
          console.error('Failed to create node:', node.label);
        }
      }
      
      // Create edges via API
      for (const edge of analysisResult.edges) {
        const sourceId = nodeIdMap.get(edge.source);
        const targetId = nodeIdMap.get(edge.target);
        
        if (sourceId && targetId) {
          try {
            await fetch(
              `https://investigates-api.azurewebsites.net/api/v1/cases/${selectedCase}/money-flow/edges`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                },
                body: JSON.stringify({
                  source_node_id: sourceId,
                  target_node_id: targetId,
                  label: edge.label || 'เชื่อมโยง',
                  amount: edge.amount || 0,
                  transaction_date: edge.date
                })
              }
            );
          } catch (e) {
            console.error('Failed to create edge');
          }
        }
      }
      
      // Navigate to Money Flow page
      navigate(`/money-flow?case=${selectedCase}`);
    } catch (error) {
      console.error('Failed to create network:', error);
      alert('เกิดข้อผิดพลาดในการสร้าง Network');
    } finally {
      setIsCreatingNetwork(false);
    }
  };

  return (
    <div className="flex-1 p-6 bg-dark-900 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="w-8 h-8 text-primary-400" />
          <h1 className="text-2xl font-bold text-white">Smart Import</h1>
        </div>
        <p className="text-dark-400">
          นำเข้าข้อมูลหลายไฟล์พร้อมกัน วิเคราะห์ความเชื่อมโยงอัตโนมัติ
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-4 mb-8">
        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
          step === 'upload' ? 'bg-primary-500/20 text-primary-400' : 'bg-dark-800 text-dark-400'
        }`}>
          <span className="w-6 h-6 rounded-full bg-current/20 flex items-center justify-center text-sm">1</span>
          <span>อัปโหลดไฟล์</span>
        </div>
        <ArrowRight className="w-5 h-5 text-dark-600" />
        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
          step === 'analyze' ? 'bg-primary-500/20 text-primary-400' : 
          step === 'result' ? 'bg-green-500/20 text-green-400' : 'bg-dark-800 text-dark-400'
        }`}>
          <span className="w-6 h-6 rounded-full bg-current/20 flex items-center justify-center text-sm">2</span>
          <span>วิเคราะห์</span>
        </div>
        <ArrowRight className="w-5 h-5 text-dark-600" />
        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
          step === 'result' ? 'bg-primary-500/20 text-primary-400' : 'bg-dark-800 text-dark-400'
        }`}>
          <span className="w-6 h-6 rounded-full bg-current/20 flex items-center justify-center text-sm">3</span>
          <span>สร้าง Network</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Upload Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Case Selection */}
          <div className="bg-dark-800 rounded-xl p-6 border border-dark-700">
            <h3 className="text-lg font-semibold text-white mb-4">เลือกคดี</h3>
            <select
              value={selectedCase || ''}
              onChange={(e) => setSelectedCase(Number(e.target.value) || null)}
              className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">-- เลือกคดีที่จะนำเข้าข้อมูล --</option>
              {cases.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.case_number} - {c.title}
                </option>
              ))}
            </select>
          </div>

          {/* Drop Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="bg-dark-800 rounded-xl p-8 border-2 border-dashed border-dark-600 hover:border-primary-500 transition-colors"
          >
            <div className="flex flex-col items-center justify-center text-center">
              <Upload className="w-16 h-16 text-dark-500 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                ลากไฟล์มาวางที่นี่
              </h3>
              <p className="text-dark-400 mb-4">
                รองรับ .csv หลายไฟล์พร้อมกัน
              </p>
              <label className="px-6 py-3 bg-primary-500 text-white rounded-lg cursor-pointer hover:bg-primary-600 transition-colors">
                เลือกไฟล์
                <input
                  type="file"
                  multiple
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="bg-dark-800 rounded-xl p-6 border border-dark-700">
              <h3 className="text-lg font-semibold text-white mb-4">
                ไฟล์ที่อัปโหลด ({files.length})
              </h3>
              <div className="space-y-3">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-4 bg-dark-700 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {file.icon}
                      <div>
                        <p className="text-white font-medium">{file.name}</p>
                        <p className="text-sm text-dark-400">
                          {file.typeLabel} • {file.records.length} รายการ
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {file.status === 'parsed' && (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      )}
                      {file.status === 'error' && (
                        <AlertCircle className="w-5 h-5 text-red-400" />
                      )}
                      <button
                        onClick={() => removeFile(file.id)}
                        className="p-2 text-dark-400 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Analyze Button */}
              <button
                onClick={analyzeFiles}
                disabled={files.length === 0 || isAnalyzing || !selectedCase}
                className="w-full mt-6 px-6 py-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:from-primary-600 hover:to-primary-700 transition-all flex items-center justify-center gap-2"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    กำลังวิเคราะห์...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    วิเคราะห์ความเชื่อมโยง
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Right: Analysis Result */}
        <div className="space-y-6">
          {/* Auto-detect Preview */}
          {files.length > 0 && !analysisResult && (
            <div className="bg-dark-800 rounded-xl p-6 border border-dark-700">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Eye className="w-5 h-5 text-primary-400" />
                ตรวจพบอัตโนมัติ
              </h3>
              <div className="space-y-3">
                {files.filter(f => f.type === 'bank').length > 0 && (
                  <div className="flex items-center gap-2 text-blue-400">
                    <FileText className="w-4 h-4" />
                    <span>ธุรกรรมธนาคาร: {files.filter(f => f.type === 'bank').length} ไฟล์</span>
                  </div>
                )}
                {files.filter(f => f.type === 'person').length > 0 && (
                  <div className="flex items-center gap-2 text-green-400">
                    <Users className="w-4 h-4" />
                    <span>บุคคล: {files.filter(f => f.type === 'person').length} ไฟล์</span>
                  </div>
                )}
                {files.filter(f => f.type === 'phone').length > 0 && (
                  <div className="flex items-center gap-2 text-yellow-400">
                    <Phone className="w-4 h-4" />
                    <span>โทรศัพท์: {files.filter(f => f.type === 'phone').length} ไฟล์</span>
                  </div>
                )}
                {files.filter(f => f.type === 'crypto').length > 0 && (
                  <div className="flex items-center gap-2 text-purple-400">
                    <Wallet className="w-4 h-4" />
                    <span>คริปโต: {files.filter(f => f.type === 'crypto').length} ไฟล์</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Analysis Result */}
          {analysisResult && (
            <>
              <div className="bg-dark-800 rounded-xl p-6 border border-dark-700">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  ผลการวิเคราะห์
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-dark-700 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-white">
                      {analysisResult.summary.totalRecords}
                    </p>
                    <p className="text-sm text-dark-400">รายการทั้งหมด</p>
                  </div>
                  <div className="bg-dark-700 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-green-400">
                      {analysisResult.nodes.length}
                    </p>
                    <p className="text-sm text-dark-400">Nodes</p>
                  </div>
                  <div className="bg-dark-700 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-blue-400">
                      {analysisResult.edges.length}
                    </p>
                    <p className="text-sm text-dark-400">Edges</p>
                  </div>
                  <div className="bg-dark-700 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-yellow-400">
                      ฿{(analysisResult.summary.totalAmount / 1000000).toFixed(1)}M
                    </p>
                    <p className="text-sm text-dark-400">มูลค่ารวม</p>
                  </div>
                </div>
              </div>

              {/* Linked Entities */}
              <div className="bg-dark-800 rounded-xl p-6 border border-dark-700">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Link2 className="w-5 h-5 text-primary-400" />
                  ความเชื่อมโยง
                </h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {analysisResult.entities.slice(0, 10).map((entity, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-dark-700 rounded-lg">
                      {entity.type === 'person' && <Users className="w-4 h-4 text-green-400" />}
                      {entity.type === 'account' && <FileText className="w-4 h-4 text-blue-400" />}
                      {entity.type === 'phone' && <Phone className="w-4 h-4 text-yellow-400" />}
                      {entity.type === 'wallet' && <Wallet className="w-4 h-4 text-purple-400" />}
                      <span className="text-white text-sm truncate">{entity.label}</span>
                      {entity.riskScore && entity.riskScore > 80 && (
                        <span className="ml-auto px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded">
                          Risk: {entity.riskScore}
                        </span>
                      )}
                    </div>
                  ))}
                  {analysisResult.entities.length > 10 && (
                    <p className="text-dark-400 text-sm text-center pt-2">
                      และอีก {analysisResult.entities.length - 10} รายการ...
                    </p>
                  )}
                </div>
              </div>

              {/* Create Network Button */}
              <button
                onClick={createNetwork}
                disabled={isCreatingNetwork}
                className="w-full px-6 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-green-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isCreatingNetwork ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    กำลังสร้าง Network...
                  </>
                ) : (
                  <>
                    <Network className="w-5 h-5" />
                    สร้าง Network และดูผล
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SmartImport;
