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
  AlertTriangle,
  TrendingUp,
  Shield
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

interface RiskFactor {
  factor: string;
  score: number;
  description: string;
}

interface LinkedEntity {
  id: string;
  type: 'person' | 'account' | 'phone' | 'wallet';
  value: string;
  label: string;
  sources: string[];
  linkedIds: string[];
  riskScore: number;
  riskFactors: RiskFactor[];
  metadata: {
    totalReceived?: number;
    totalSent?: number;
    transactionCount?: number;
    callCount?: number;
    callDuration?: number;
    usedMixer?: boolean;
    foreignTransfer?: boolean;
    role?: string;
  };
}

interface NetworkEdge {
  id: string;
  source: string;
  target: string;
  edgeType: 'money_transfer' | 'phone_call' | 'crypto_transfer' | 'ownership';
  label: string;
  amount?: number;
  date?: string;
}

interface AnalysisResult {
  entities: LinkedEntity[];
  edges: NetworkEdge[];
  summary: {
    totalRecords: number;
    totalEntities: number;
    totalEdges: number;
    totalAmount: number;
    highRiskCount: number;
    crossLinkedCount: number;
  };
}

// Helper: Detect file type
const detectFileType = (columns: string[]): { type: ParsedFile['type']; typeLabel: string } => {
  const cols = columns.map(c => c.toLowerCase().trim());
  
  if (cols.some(c => c.includes('from_account') || c.includes('to_account')) &&
      cols.some(c => c.includes('amount'))) {
    return { type: 'bank', typeLabel: 'ธุรกรรมธนาคาร' };
  }
  if (cols.some(c => c.includes('id_card') || c.includes('first_name') || c.includes('role'))) {
    return { type: 'person', typeLabel: 'บุคคล' };
  }
  if (cols.some(c => c.includes('from_number') || c.includes('to_number'))) {
    return { type: 'phone', typeLabel: 'ข้อมูลโทรศัพท์' };
  }
  if (cols.some(c => c.includes('wallet') || c.includes('tx_hash'))) {
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
    columns.forEach((col, i) => { record[col] = values[i] || ''; });
    return record;
  });
  return { columns, records };
};

// Helper: Get icon
const getFileIcon = (type: ParsedFile['type']) => {
  const icons = {
    bank: <FileText className="w-5 h-5 text-blue-400" />,
    person: <Users className="w-5 h-5 text-green-400" />,
    phone: <Phone className="w-5 h-5 text-yellow-400" />,
    crypto: <Wallet className="w-5 h-5 text-purple-400" />,
    unknown: <FileText className="w-5 h-5 text-gray-400" />
  };
  return icons[type];
};

// Calculate Risk Score - Digital Forensic Algorithm
const calculateRiskScore = (entity: LinkedEntity): { score: number; factors: RiskFactor[] } => {
  const factors: RiskFactor[] = [];
  let score = 0;
  
  // 1. Role (30 points max)
  if (entity.metadata.role === 'ผู้ต้องสงสัย') {
    factors.push({ factor: 'ผู้ต้องสงสัย', score: 30, description: 'ถูกระบุเป็นผู้ต้องสงสัยในคดี' });
    score += 30;
  } else if (entity.metadata.role === 'ผู้เสียหาย') {
    factors.push({ factor: 'ผู้เสียหาย', score: 5, description: 'ถูกระบุเป็นผู้เสียหาย' });
    score += 5;
  }
  
  // 2. Money received (25 points max)
  if (entity.metadata.totalReceived) {
    const received = entity.metadata.totalReceived;
    if (received > 500000) {
      factors.push({ factor: 'รับเงิน > ฿500K', score: 25, description: `รับเงินรวม ฿${received.toLocaleString()}` });
      score += 25;
    } else if (received > 100000) {
      factors.push({ factor: 'รับเงิน > ฿100K', score: 15, description: `รับเงินรวม ฿${received.toLocaleString()}` });
      score += 15;
    }
  }
  
  // 3. Transaction count (10 points)
  if (entity.metadata.transactionCount && entity.metadata.transactionCount > 3) {
    factors.push({ factor: 'ธุรกรรมบ่อย', score: 10, description: `${entity.metadata.transactionCount} ธุรกรรม` });
    score += 10;
  }
  
  // 4. Mixer usage (20 points)
  if (entity.metadata.usedMixer) {
    factors.push({ factor: 'ใช้ Mixer', score: 20, description: 'โอนผ่าน Crypto Mixer เพื่อปกปิดร่องรอย' });
    score += 20;
  }
  
  // 5. Foreign transfer (15 points)
  if (entity.metadata.foreignTransfer) {
    factors.push({ factor: 'โอนต่างประเทศ', score: 15, description: 'โอนเงิน/Crypto ไปต่างประเทศ' });
    score += 15;
  }
  
  // 6. Call patterns (10 points)
  if (entity.metadata.callCount && entity.metadata.callCount > 5) {
    factors.push({ factor: 'โทรบ่อย', score: 10, description: `โทร ${entity.metadata.callCount} ครั้ง` });
    score += 10;
  }
  
  // 7. Cross-linked (10 points)
  if (entity.sources.length >= 3) {
    factors.push({ factor: 'หลายแหล่ง', score: 10, description: `พบใน ${entity.sources.length} แหล่งข้อมูล` });
    score += 10;
  }
  
  return { score: Math.min(score, 100), factors };
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
  const [selectedEntity, setSelectedEntity] = useState<LinkedEntity | null>(null);
  const [step, setStep] = useState<'upload' | 'analyze' | 'result'>('upload');
  const [creationLog, setCreationLog] = useState<string[]>([]);

  // Load cases
  React.useEffect(() => {
    const loadCases = async () => {
      try {
        const response = await casesAPI.list({ page: 1, page_size: 100 });
        setCases(response.items.map((c: any) => ({
          id: c.id, case_number: c.case_number, title: c.title
        })));
      } catch (error) { console.error('Failed to load cases:', error); }
    };
    loadCases();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    processFiles(Array.from(e.dataTransfer.files).filter(f => f.name.endsWith('.csv')));
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(Array.from(e.target.files || []).filter(f => f.name.endsWith('.csv')));
  };

  const processFiles = async (newFiles: File[]) => {
    const parsedFiles: ParsedFile[] = [];
    for (const file of newFiles) {
      try {
        const text = await file.text();
        const { columns, records } = parseCSV(text);
        const { type, typeLabel } = detectFileType(columns);
        parsedFiles.push({
          id: `file-${Date.now()}-${Math.random()}`,
          name: file.name, type, typeLabel,
          icon: getFileIcon(type), records, columns, status: 'parsed'
        });
      } catch {
        parsedFiles.push({
          id: `file-${Date.now()}-${Math.random()}`,
          name: file.name, type: 'unknown', typeLabel: 'Error',
          icon: <AlertCircle className="w-5 h-5 text-red-400" />,
          records: [], columns: [], status: 'error', error: 'ไม่สามารถอ่านไฟล์ได้'
        });
      }
    }
    setFiles(prev => [...prev, ...parsedFiles]);
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
    setAnalysisResult(null);
    setStep('upload');
  };

  // Smart Analysis
  const analyzeFiles = async () => {
    if (files.length === 0) return;
    setIsAnalyzing(true);
    setStep('analyze');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    try {
      const entityMap = new Map<string, LinkedEntity>();
      const edges: NetworkEdge[] = [];
      let totalAmount = 0;
      let edgeCounter = 0;
      
      const getOrCreateEntity = (
        type: LinkedEntity['type'], value: string, label: string, source: string,
        metadata?: Partial<LinkedEntity['metadata']>
      ): string => {
        const key = `${type}:${value.trim().toLowerCase()}`;
        if (entityMap.has(key)) {
          const entity = entityMap.get(key)!;
          if (!entity.sources.includes(source)) entity.sources.push(source);
          if (metadata) entity.metadata = { ...entity.metadata, ...metadata };
          return key;
        }
        entityMap.set(key, {
          id: key, type, value, label, sources: [source],
          linkedIds: [], riskScore: 0, riskFactors: [], metadata: metadata || {}
        });
        return key;
      };
      
      const addEdge = (
        sourceKey: string, targetKey: string, edgeType: NetworkEdge['edgeType'],
        label: string, amount?: number, date?: string
      ) => {
        edges.push({ id: `edge-${edgeCounter++}`, source: sourceKey, target: targetKey, edgeType, label, amount, date });
        const source = entityMap.get(sourceKey);
        const target = entityMap.get(targetKey);
        if (source && !source.linkedIds.includes(targetKey)) source.linkedIds.push(targetKey);
        if (target && !target.linkedIds.includes(sourceKey)) target.linkedIds.push(sourceKey);
      };
      
      // Process person file first (master data)
      const personFile = files.find(f => f.type === 'person');
      const personPhoneMap = new Map<string, string>();
      const personAccountMap = new Map<string, string>();
      const personWalletMap = new Map<string, string>();
      
      if (personFile) {
        personFile.records.forEach(record => {
          const name = `${record.prefix || ''} ${record.first_name || ''} ${record.last_name || ''}`.trim();
          const personKey = getOrCreateEntity('person', record.id_card || name, name, personFile.name, { role: record.role });
          
          if (record.phone) {
            personPhoneMap.set(record.phone.trim(), personKey);
            const phoneKey = getOrCreateEntity('phone', record.phone, record.phone, personFile.name);
            addEdge(personKey, phoneKey, 'ownership', 'เจ้าของเบอร์');
          }
          if (record.bank_account) {
            personAccountMap.set(record.bank_account.trim(), personKey);
            const accountKey = getOrCreateEntity('account', record.bank_account, `${record.bank_account} (${record.bank || ''})`, personFile.name);
            addEdge(personKey, accountKey, 'ownership', 'เจ้าของบัญชี');
          }
          if (record.wallet_address) {
            personWalletMap.set(record.wallet_address.trim(), personKey);
            const walletKey = getOrCreateEntity('wallet', record.wallet_address, record.wallet_address, personFile.name);
            addEdge(personKey, walletKey, 'ownership', 'เจ้าของ Wallet');
          }
        });
      }
      
      // Process bank transactions
      files.filter(f => f.type === 'bank').forEach(file => {
        file.records.forEach(record => {
          const amount = parseFloat(record.amount) || 0;
          totalAmount += amount;
          
          const fromKey = getOrCreateEntity('account', record.from_account, record.from_name || record.from_account, file.name);
          const toKey = getOrCreateEntity('account', record.to_account, record.to_name || record.to_account, file.name);
          
          const fromEntity = entityMap.get(fromKey)!;
          fromEntity.metadata.totalSent = (fromEntity.metadata.totalSent || 0) + amount;
          fromEntity.metadata.transactionCount = (fromEntity.metadata.transactionCount || 0) + 1;
          
          const toEntity = entityMap.get(toKey)!;
          toEntity.metadata.totalReceived = (toEntity.metadata.totalReceived || 0) + amount;
          toEntity.metadata.transactionCount = (toEntity.metadata.transactionCount || 0) + 1;
          
          if (record.to_name?.toLowerCase().includes('exchange')) toEntity.metadata.usedMixer = true;
          
          addEdge(fromKey, toKey, 'money_transfer', `฿${amount.toLocaleString()}`, amount, record.date);
          
          // Update person metadata
          const fromPerson = personAccountMap.get(record.from_account.trim());
          const toPerson = personAccountMap.get(record.to_account.trim());
          if (fromPerson) {
            const p = entityMap.get(fromPerson)!;
            p.metadata.totalSent = (p.metadata.totalSent || 0) + amount;
            p.metadata.transactionCount = (p.metadata.transactionCount || 0) + 1;
          }
          if (toPerson) {
            const p = entityMap.get(toPerson)!;
            p.metadata.totalReceived = (p.metadata.totalReceived || 0) + amount;
            p.metadata.transactionCount = (p.metadata.transactionCount || 0) + 1;
          }
        });
      });
      
      // Process phone records
      files.filter(f => f.type === 'phone').forEach(file => {
        file.records.forEach(record => {
          const duration = parseInt(record.duration_sec) || 0;
          const fromKey = getOrCreateEntity('phone', record.from_number, record.from_name || record.from_number, file.name);
          const toKey = getOrCreateEntity('phone', record.to_number, record.to_name || record.to_number, file.name);
          
          const fromEntity = entityMap.get(fromKey)!;
          fromEntity.metadata.callCount = (fromEntity.metadata.callCount || 0) + 1;
          fromEntity.metadata.callDuration = (fromEntity.metadata.callDuration || 0) + duration;
          
          addEdge(fromKey, toKey, 'phone_call', `โทร ${duration}วิ`, undefined, record.date);
          
          // Update person
          const fromPerson = personPhoneMap.get(record.from_number.trim());
          if (fromPerson) {
            const p = entityMap.get(fromPerson)!;
            p.metadata.callCount = (p.metadata.callCount || 0) + 1;
          }
        });
      });
      
      // Process crypto
      files.filter(f => f.type === 'crypto').forEach(file => {
        file.records.forEach(record => {
          const amount = parseFloat(record.amount) || 0;
          const amountThb = parseFloat(record.amount_thb) || amount * 35;
          
          const fromKey = getOrCreateEntity('wallet', record.from_wallet, record.from_label || record.from_wallet?.substring(0, 12) + '...', file.name);
          const toKey = getOrCreateEntity('wallet', record.to_wallet, record.to_label || record.to_wallet?.substring(0, 12) + '...', file.name);
          
          const toLabel = record.to_label?.toLowerCase() || '';
          const isMixer = toLabel.includes('mixer');
          const isForeign = toLabel.includes('cambodia') || toLabel.includes('myanmar') || toLabel.includes('laos');
          
          const fromEntity = entityMap.get(fromKey)!;
          if (isMixer) fromEntity.metadata.usedMixer = true;
          if (isForeign) fromEntity.metadata.foreignTransfer = true;
          fromEntity.metadata.totalSent = (fromEntity.metadata.totalSent || 0) + amountThb;
          
          addEdge(fromKey, toKey, 'crypto_transfer', `${amount} ${record.currency || 'USDT'}`, amountThb, record.date);
          
          // Update person
          const fromPerson = personWalletMap.get(record.from_wallet?.trim() || '');
          if (fromPerson) {
            const p = entityMap.get(fromPerson)!;
            if (isMixer) p.metadata.usedMixer = true;
            if (isForeign) p.metadata.foreignTransfer = true;
            p.metadata.totalSent = (p.metadata.totalSent || 0) + amountThb;
          }
        });
      });
      
      // Calculate risk scores
      entityMap.forEach(entity => {
        const { score, factors } = calculateRiskScore(entity);
        entity.riskScore = score;
        entity.riskFactors = factors;
      });
      
      const entities = Array.from(entityMap.values());
      setAnalysisResult({
        entities, edges,
        summary: {
          totalRecords: files.reduce((sum, f) => sum + f.records.length, 0),
          totalEntities: entities.length,
          totalEdges: edges.length,
          totalAmount,
          highRiskCount: entities.filter(e => e.riskScore >= 70).length,
          crossLinkedCount: entities.filter(e => e.sources.length >= 2).length
        }
      });
      setStep('result');
    } catch (error) { console.error('Analysis failed:', error); }
    finally { setIsAnalyzing(false); }
  };

  // Create Network
  const createNetwork = async () => {
    if (!analysisResult || !selectedCase) return;
    setIsCreatingNetwork(true);
    setCreationLog([]);
    
    const log = (msg: string) => { setCreationLog(prev => [...prev, msg]); console.log(msg); };
    
    try {
      const nodeIdMap = new Map<string, number>();
      const token = localStorage.getItem('access_token');
      const baseUrl = 'https://investigates-api.azurewebsites.net/api/v1';
      
      log(`📍 สร้าง ${analysisResult.entities.length} Nodes...`);
      
      for (const entity of analysisResult.entities) {
        try {
          const response = await fetch(`${baseUrl}/cases/${selectedCase}/money-flow/nodes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
              label: entity.label,
              node_type: entity.type === 'account' ? 'bank_account' : entity.type,
              risk_score: entity.riskScore,
              amount: entity.metadata.totalReceived || entity.metadata.totalSent || 0,
              metadata: JSON.stringify({ riskFactors: entity.riskFactors, sources: entity.sources, ...entity.metadata })
            })
          });
          if (response.ok) {
            const data = await response.json();
            nodeIdMap.set(entity.id, data.id);
            log(`  ✅ ${entity.label} → ID:${data.id}`);
          } else { log(`  ❌ ${entity.label}`); }
        } catch { log(`  ❌ ${entity.label}`); }
      }
      
      log(`\n🔗 สร้าง ${analysisResult.edges.length} Edges...`);
      let edgeSuccess = 0;
      
      for (const edge of analysisResult.edges) {
        const sourceId = nodeIdMap.get(edge.source);
        const targetId = nodeIdMap.get(edge.target);
        if (sourceId && targetId) {
          // Map edge type to backend format
          const edgeTypeMap: Record<string, string> = {
            'money_transfer': 'bank_transfer',
            'phone_call': 'other',
            'crypto_transfer': 'crypto_transfer',
            'ownership': 'other'
          };
          
          try {
            const response = await fetch(`${baseUrl}/cases/${selectedCase}/money-flow/edges`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({
                from_node_id: sourceId,
                to_node_id: targetId,
                edge_type: edgeTypeMap[edge.edgeType] || 'other',
                label: edge.label,
                amount: edge.amount || 0,
                transaction_date: edge.date
              })
            });
            if (response.ok) edgeSuccess++;
          } catch {}
        }
      }
      
      log(`  ✅ สร้าง ${edgeSuccess}/${analysisResult.edges.length} edges`);
      log(`\n🎉 เสร็จสิ้น!`);
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      navigate(`/money-flow?case=${selectedCase}`);
    } catch (error) { log(`\n❌ Error: ${error}`); }
    finally { setIsCreatingNetwork(false); }
  };

  const getRiskColor = (score: number) => {
    if (score >= 70) return 'text-red-400 bg-red-500/20';
    if (score >= 40) return 'text-yellow-400 bg-yellow-500/20';
    return 'text-green-400 bg-green-500/20';
  };

  return (
    <div className="flex-1 p-6 bg-dark-900 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="w-8 h-8 text-primary-400" />
          <h1 className="text-2xl font-bold text-white">Smart Import</h1>
          <span className="px-2 py-0.5 bg-primary-500/20 text-primary-400 text-xs rounded">v2</span>
        </div>
        <p className="text-dark-400">วิเคราะห์ความเชื่อมโยงและคำนวณ Risk Score ตามหลัก Digital Forensic</p>
      </div>

      {/* Steps */}
      <div className="flex items-center justify-center gap-4 mb-8">
        {[
          { key: 'upload', label: 'อัปโหลด' },
          { key: 'analyze', label: 'วิเคราะห์' },
          { key: 'result', label: 'สร้าง Network' }
        ].map((s, i) => (
          <React.Fragment key={s.key}>
            {i > 0 && <ArrowRight className="w-5 h-5 text-dark-600" />}
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              step === s.key ? 'bg-primary-500/20 text-primary-400' : 'bg-dark-800 text-dark-400'
            }`}>
              <span className="w-6 h-6 rounded-full bg-current/20 flex items-center justify-center text-sm">{i + 1}</span>
              <span>{s.label}</span>
            </div>
          </React.Fragment>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left */}
        <div className="lg:col-span-2 space-y-6">
          {/* Case Select */}
          <div className="bg-dark-800 rounded-xl p-6 border border-dark-700">
            <h3 className="text-lg font-semibold text-white mb-4">เลือกคดี</h3>
            <select value={selectedCase || ''} onChange={(e) => setSelectedCase(Number(e.target.value) || null)}
              className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white focus:ring-2 focus:ring-primary-500">
              <option value="">-- เลือกคดี --</option>
              {cases.map((c) => <option key={c.id} value={c.id}>{c.case_number} - {c.title}</option>)}
            </select>
          </div>

          {/* Drop Zone */}
          <div onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}
            className="bg-dark-800 rounded-xl p-8 border-2 border-dashed border-dark-600 hover:border-primary-500 transition-colors">
            <div className="flex flex-col items-center text-center">
              <Upload className="w-16 h-16 text-dark-500 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">ลากไฟล์มาวางที่นี่</h3>
              <p className="text-dark-400 mb-4">รองรับ .csv (บุคคล, ธนาคาร, โทรศัพท์, คริปโต)</p>
              <label className="px-6 py-3 bg-primary-500 text-white rounded-lg cursor-pointer hover:bg-primary-600">
                เลือกไฟล์
                <input type="file" multiple accept=".csv" onChange={handleFileSelect} className="hidden" />
              </label>
            </div>
          </div>

          {/* Files */}
          {files.length > 0 && (
            <div className="bg-dark-800 rounded-xl p-6 border border-dark-700">
              <h3 className="text-lg font-semibold text-white mb-4">ไฟล์ ({files.length})</h3>
              <div className="space-y-3">
                {files.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-4 bg-dark-700 rounded-lg">
                    <div className="flex items-center gap-3">
                      {file.icon}
                      <div>
                        <p className="text-white font-medium">{file.name}</p>
                        <p className="text-sm text-dark-400">{file.typeLabel} • {file.records.length} รายการ</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {file.status === 'parsed' && <CheckCircle className="w-5 h-5 text-green-400" />}
                      <button onClick={() => removeFile(file.id)} className="p-2 text-dark-400 hover:text-red-400">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={analyzeFiles} disabled={!selectedCase || isAnalyzing}
                className="w-full mt-6 px-6 py-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
                {isAnalyzing ? <><Loader2 className="w-5 h-5 animate-spin" />วิเคราะห์...</> : <><Sparkles className="w-5 h-5" />วิเคราะห์ + Risk Score</>}
              </button>
            </div>
          )}

          {/* Creation Log */}
          {creationLog.length > 0 && (
            <div className="bg-dark-800 rounded-xl p-6 border border-dark-700">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-primary-400" />สร้าง Network...
              </h3>
              <div className="bg-dark-900 rounded-lg p-4 max-h-60 overflow-y-auto font-mono text-sm">
                {creationLog.map((log, idx) => <div key={idx} className="text-dark-300">{log}</div>)}
              </div>
            </div>
          )}
        </div>

        {/* Right */}
        <div className="space-y-6">
          {analysisResult && (
            <>
              {/* Summary */}
              <div className="bg-dark-800 rounded-xl p-6 border border-dark-700">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />ผลวิเคราะห์
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-dark-700 rounded-lg p-3 text-center">
                    <p className="text-xl font-bold text-white">{analysisResult.summary.totalRecords}</p>
                    <p className="text-xs text-dark-400">รายการ</p>
                  </div>
                  <div className="bg-dark-700 rounded-lg p-3 text-center">
                    <p className="text-xl font-bold text-green-400">{analysisResult.summary.totalEntities}</p>
                    <p className="text-xs text-dark-400">Entities</p>
                  </div>
                  <div className="bg-dark-700 rounded-lg p-3 text-center">
                    <p className="text-xl font-bold text-blue-400">{analysisResult.summary.totalEdges}</p>
                    <p className="text-xs text-dark-400">Edges</p>
                  </div>
                  <div className="bg-dark-700 rounded-lg p-3 text-center">
                    <p className="text-xl font-bold text-red-400">{analysisResult.summary.highRiskCount}</p>
                    <p className="text-xs text-dark-400">High Risk</p>
                  </div>
                </div>
              </div>

              {/* Risk List */}
              <div className="bg-dark-800 rounded-xl p-6 border border-dark-700">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-400" />Risk Score
                </h3>
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {analysisResult.entities
                    .filter(e => e.type === 'person' || e.riskScore >= 30)
                    .sort((a, b) => b.riskScore - a.riskScore)
                    .slice(0, 12)
                    .map((entity) => (
                      <div key={entity.id} onClick={() => setSelectedEntity(entity)}
                        className={`p-3 bg-dark-700 rounded-lg cursor-pointer hover:bg-dark-600 ${selectedEntity?.id === entity.id ? 'ring-2 ring-primary-500' : ''}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {entity.type === 'person' && <Users className="w-4 h-4 text-green-400" />}
                            {entity.type === 'account' && <FileText className="w-4 h-4 text-blue-400" />}
                            {entity.type === 'phone' && <Phone className="w-4 h-4 text-yellow-400" />}
                            {entity.type === 'wallet' && <Wallet className="w-4 h-4 text-purple-400" />}
                            <span className="text-white text-sm truncate max-w-[140px]">{entity.label}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${getRiskColor(entity.riskScore)}`}>{entity.riskScore}</span>
                        </div>
                        {entity.riskFactors.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {entity.riskFactors.slice(0, 2).map((f, idx) => (
                              <span key={idx} className="text-xs text-dark-400 bg-dark-600 px-1.5 py-0.5 rounded">{f.factor}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>

              {/* Detail */}
              {selectedEntity && (
                <div className="bg-dark-800 rounded-xl p-6 border border-primary-500">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary-400" />Risk Breakdown
                  </h3>
                  <p className="text-white font-medium">{selectedEntity.label}</p>
                  <p className="text-sm text-dark-400 mb-4">พบใน: {selectedEntity.sources.join(', ')}</p>
                  
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-dark-400">Risk Score</span>
                    <span className={`text-2xl font-bold ${getRiskColor(selectedEntity.riskScore).split(' ')[0]}`}>{selectedEntity.riskScore}/100</span>
                  </div>
                  <div className="w-full bg-dark-700 rounded-full h-2 mb-4">
                    <div className={`h-2 rounded-full ${selectedEntity.riskScore >= 70 ? 'bg-red-500' : selectedEntity.riskScore >= 40 ? 'bg-yellow-500' : 'bg-green-500'}`}
                      style={{ width: `${selectedEntity.riskScore}%` }} />
                  </div>
                  
                  <p className="text-sm text-dark-400 font-medium mb-2">ปัจจัยความเสี่ยง:</p>
                  <div className="space-y-2">
                    {selectedEntity.riskFactors.map((f, idx) => (
                      <div key={idx} className="flex items-start gap-2 p-2 bg-dark-700 rounded">
                        <TrendingUp className="w-4 h-4 text-red-400 mt-0.5" />
                        <div>
                          <p className="text-white text-sm">{f.factor} <span className="text-red-400">+{f.score}</span></p>
                          <p className="text-xs text-dark-400">{f.description}</p>
                        </div>
                      </div>
                    ))}
                    {selectedEntity.riskFactors.length === 0 && <p className="text-dark-500 text-sm">ไม่พบปัจจัยความเสี่ยง</p>}
                  </div>
                </div>
              )}

              {/* Create Button */}
              <button onClick={createNetwork} disabled={isCreatingNetwork}
                className="w-full px-6 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-green-700 disabled:opacity-50 flex items-center justify-center gap-2">
                {isCreatingNetwork ? <><Loader2 className="w-5 h-5 animate-spin" />สร้าง...</> :
                  <><Network className="w-5 h-5" />สร้าง Network ({analysisResult.summary.totalEntities} nodes, {analysisResult.summary.totalEdges} edges)</>}
              </button>
            </>
          )}

          {!analysisResult && files.length === 0 && (
            <div className="bg-dark-800 rounded-xl p-6 border border-dark-700 text-center">
              <Eye className="w-12 h-12 text-dark-600 mx-auto mb-4" />
              <p className="text-dark-400">อัปโหลดไฟล์เพื่อเริ่มวิเคราะห์</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SmartImport;
