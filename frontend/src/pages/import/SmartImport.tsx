import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Upload, FileText, Users, Phone, Wallet, CheckCircle, AlertCircle, Loader2,
  Network, ArrowRight, Trash2, Eye, Sparkles, AlertTriangle, TrendingUp,
  Shield, Settings, Link, Unlink, ChevronDown, ChevronUp
} from 'lucide-react';
import { casesAPI, evidenceAPI } from '../../services/api';

// SHA-256 Hash Calculator
const calculateSHA256 = async (file: File): Promise<string> => {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// ==================== TYPES ====================
interface ColumnMapping {
  original: string;
  mapped: string;
  confidence: number;
  autoMapped: boolean;
}

interface FieldWarning {
  field: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  impact: string;
}

interface ParsedFile {
  id: string;
  name: string;
  type: 'bank' | 'person' | 'phone' | 'crypto' | 'unknown';
  typeLabel: string;
  icon: React.ReactNode;
  records: Record<string, string>[];
  columns: string[];
  columnMappings: ColumnMapping[];
  warnings: FieldWarning[];
  status: 'pending' | 'parsed' | 'mapped' | 'error';
  error?: string;
  fileSize?: number;
  sha256Hash?: string;
}

interface RiskFactor { factor: string; score: number; description: string; }

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
    totalReceived?: number; totalSent?: number; transactionCount?: number;
    callCount?: number; callDuration?: number; usedMixer?: boolean;
    foreignTransfer?: boolean; role?: string;
  };
}

interface NetworkEdge {
  id: string; source: string; target: string;
  edgeType: 'money_transfer' | 'phone_call' | 'crypto_transfer' | 'ownership';
  label: string; amount?: number; date?: string;
}

interface AnalysisResult {
  entities: LinkedEntity[];
  edges: NetworkEdge[];
  summary: {
    totalRecords: number; totalEntities: number; totalEdges: number;
    totalAmount: number; highRiskCount: number; crossLinkedCount: number;
  };
}

// ==================== FIELD DEFINITIONS ====================
const REQUIRED_FIELDS: Record<string, { required: string[]; optional: string[]; linkFields: string[] }> = {
  person: {
    required: ['first_name'],
    optional: ['id_card', 'prefix', 'last_name', 'role', 'phone', 'email', 'bank_account', 'bank', 'wallet_address', 'address', 'occupation', 'risk_score', 'note'],
    linkFields: ['phone', 'bank_account', 'wallet_address']
  },
  bank: {
    required: ['from_account', 'to_account', 'amount'],
    optional: ['date', 'time', 'from_name', 'to_name', 'bank', 'to_bank', 'note', 'ref'],
    linkFields: ['from_account', 'to_account', 'from_name', 'to_name']
  },
  phone: {
    required: ['from_number', 'to_number'],
    optional: ['date', 'time', 'from_name', 'to_name', 'duration_sec', 'call_type', 'location', 'cell_tower', 'note'],
    linkFields: ['from_number', 'to_number', 'from_name', 'to_name']
  },
  crypto: {
    required: ['from_wallet', 'to_wallet', 'amount'],
    optional: ['date', 'time', 'from_label', 'to_label', 'currency', 'amount_thb', 'amount_usd', 'tx_hash', 'exchange', 'note'],
    linkFields: ['from_wallet', 'to_wallet', 'from_label', 'to_label']
  }
};

// Column aliases from various sources (Cellebrite, UFED, XRY, Thai, etc.)
const COLUMN_ALIASES: Record<string, string[]> = {
  // Person fields (ไม่รวม contact_name เพราะจะ conflict กับ phone records)
  first_name: ['firstname', 'fname', 'first', 'given_name', 'ชื่อ', 'ชื่อจริง'],
  last_name: ['lastname', 'lname', 'last', 'surname', 'family_name', 'นามสกุล'],
  prefix: ['คำนำหน้า', 'title', 'salutation'],
  id_card: ['idcard', 'id_number', 'citizen_id', 'national_id', 'thai_id', 'เลขบัตรประชาชน', 'รหัสประชาชน'],
  phone: ['phone_number', 'mobile', 'tel', 'telephone', 'contact_phone', 'เบอร์โทร', 'เบอร์', 'หมายเลขโทรศัพท์'],
  email: ['email_address', 'mail', 'e-mail', 'อีเมล'],
  bank_account: ['account_number', 'account_no', 'acc_no', 'bank_acc', 'เลขบัญชี', 'บัญชี'],
  wallet_address: ['wallet', 'crypto_address', 'btc_address', 'eth_address', 'address_crypto'],
  role: ['person_type', 'classification', 'บทบาท', 'ประเภท'],
  occupation: ['job', 'work', 'อาชีพ'],
  address: ['ที่อยู่', 'home_address'],
  
  // Bank transaction fields
  from_account: ['source_account', 'sender_account', 'debit_account', 'from_acc', 'บัญชีต้นทาง', 'บัญชีผู้โอน'],
  to_account: ['target_account', 'receiver_account', 'credit_account', 'to_acc', 'dest_account', 'บัญชีปลายทาง', 'บัญชีผู้รับ'],
  from_name: ['sender_name', 'source_name', 'payer_name', 'ชื่อผู้โอน'],
  to_name: ['receiver_name', 'target_name', 'payee_name', 'beneficiary_name', 'ชื่อผู้รับ'],
  amount: ['value', 'sum', 'transaction_amount', 'transfer_amount', 'จำนวนเงิน', 'ยอดเงิน'],
  bank: ['ธนาคาร', 'bank_name'],
  
  // Phone record fields (Cellebrite, UFED specific)
  from_number: ['caller', 'calling_number', 'source_number', 'originating_number', 'a_number', 'msisdn_a', 'msisdn', 'เบอร์ต้นทาง', 'เบอร์โทรออก'],
  to_number: ['called', 'called_number', 'target_number', 'destination_number', 'b_number', 'msisdn_b', 'เบอร์ปลายทาง', 'เบอร์รับสาย'],
  duration_sec: ['duration', 'call_duration', 'length', 'seconds', 'duration_seconds', 'ระยะเวลา'],
  call_type: ['direction', 'call_direction', 'ประเภทการโทร'],
  cell_tower: ['cell_id', 'tower_id', 'lac', 'cgi', 'เสาสัญญาณ'],
  location: ['loc', 'place', 'สถานที่'],
  contact_name: ['called_name', 'caller_name'],  // Phone contact names
  
  // Crypto fields (XRY, Chainalysis specific)
  from_wallet: ['source_wallet', 'sender_wallet', 'from_address', 'source_address'],
  to_wallet: ['target_wallet', 'receiver_wallet', 'to_address', 'dest_address', 'destination_wallet', 'destination_address'],
  from_label: ['source_label', 'sender_label'],
  to_label: ['target_label', 'receiver_label'],
  tx_hash: ['transaction_hash', 'hash', 'txid', 'transaction_id'],
  currency: ['coin', 'token', 'crypto', 'asset'],
  
  // Common fields
  date: ['transaction_date', 'trx_date', 'datetime', 'timestamp', 'วันที่'],
  time: ['transaction_time', 'trx_time', 'เวลา'],
  note: ['notes', 'remark', 'remarks', 'description', 'memo', 'หมายเหตุ'],
  ref: ['reference', 'ref_no', 'reference_number', 'transaction_ref', 'เลขอ้างอิง']
};

// ==================== HELPERS ====================
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

// Auto-map columns to standard fields
const autoMapColumns = (columns: string[], _fileType: string): ColumnMapping[] => {
  return columns.map(col => {
    const colLower = col.toLowerCase().trim();
    
    // Direct match
    if (COLUMN_ALIASES[colLower]) {
      return { original: col, mapped: colLower, confidence: 100, autoMapped: true };
    }
    
    // Check aliases
    for (const [standard, aliases] of Object.entries(COLUMN_ALIASES)) {
      if (aliases.some(a => a.toLowerCase() === colLower || colLower.includes(a.toLowerCase()))) {
        return { original: col, mapped: standard, confidence: 90, autoMapped: true };
      }
    }
    
    // Fuzzy match
    for (const [standard] of Object.entries(COLUMN_ALIASES)) {
      if (colLower.includes(standard) || standard.includes(colLower)) {
        return { original: col, mapped: standard, confidence: 70, autoMapped: true };
      }
    }
    
    // No match - keep original
    return { original: col, mapped: col, confidence: 0, autoMapped: false };
  });
};

// Detect file type from mapped columns (ลำดับสำคัญ: specific types ก่อน generic)
const detectFileType = (mappings: ColumnMapping[]): { type: ParsedFile['type']; typeLabel: string } => {
  const mappedCols = mappings.map(m => m.mapped.toLowerCase());
  
  // 1. Bank - ต้องมี from_account + to_account + amount
  if (mappedCols.includes('from_account') && mappedCols.includes('to_account') && mappedCols.includes('amount')) {
    return { type: 'bank', typeLabel: 'ธุรกรรมธนาคาร' };
  }
  
  // 2. Phone - ต้องมี from_number + to_number
  if (mappedCols.includes('from_number') && mappedCols.includes('to_number')) {
    return { type: 'phone', typeLabel: 'ข้อมูลโทรศัพท์' };
  }
  
  // 3. Crypto - ต้องมี from_wallet + to_wallet
  if (mappedCols.includes('from_wallet') && mappedCols.includes('to_wallet')) {
    return { type: 'crypto', typeLabel: 'กระเป๋าคริปโต' };
  }
  
  // 4. Person - มี first_name หรือ id_card (ตรวจสอบสุดท้ายเพราะ generic)
  if (mappedCols.includes('first_name') || mappedCols.includes('id_card')) {
    return { type: 'person', typeLabel: 'บุคคล' };
  }
  
  return { type: 'unknown', typeLabel: 'ไม่ทราบประเภท' };
};

// Validate fields and generate warnings
const validateFields = (fileType: string, mappings: ColumnMapping[]): FieldWarning[] => {
  if (fileType === 'unknown') return [];
  
  const warnings: FieldWarning[] = [];
  const fields = REQUIRED_FIELDS[fileType];
  const mappedFields = mappings.map(m => m.mapped);
  
  // Check required fields
  fields.required.forEach(req => {
    if (!mappedFields.includes(req)) {
      warnings.push({
        field: req,
        message: `ไม่พบ field "${req}" ที่จำเป็น`,
        severity: 'error',
        impact: 'ไม่สามารถวิเคราะห์ไฟล์นี้ได้'
      });
    }
  });
  
  // Check link fields (important for cross-file linking)
  fields.linkFields.forEach(link => {
    if (!mappedFields.includes(link)) {
      const impacts: Record<string, string> = {
        phone: 'ไม่สามารถเชื่อมกับข้อมูลโทรศัพท์',
        bank_account: 'ไม่สามารถเชื่อมกับธุรกรรมธนาคาร',
        wallet_address: 'ไม่สามารถเชื่อมกับธุรกรรม Crypto',
        from_name: 'ไม่สามารถระบุชื่อผู้โอนได้',
        to_name: 'ไม่สามารถระบุชื่อผู้รับได้',
        from_account: 'ไม่สามารถเชื่อมกับบุคคลเจ้าของบัญชี',
        to_account: 'ไม่สามารถเชื่อมกับบุคคลเจ้าของบัญชี',
        from_number: 'ไม่สามารถเชื่อมกับบุคคล',
        to_number: 'ไม่สามารถเชื่อมกับบุคคล',
        from_wallet: 'ไม่สามารถเชื่อมกับบุคคล',
        to_wallet: 'ไม่สามารถเชื่อมกับบุคคล',
      };
      warnings.push({
        field: link,
        message: `ไม่พบ field "${link}" สำหรับเชื่อมโยง`,
        severity: 'warning',
        impact: impacts[link] || 'การเชื่อมโยงอาจไม่สมบูรณ์'
      });
    }
  });
  
  // Check auto-mapping confidence
  mappings.forEach(m => {
    if (m.autoMapped && m.confidence < 80 && m.confidence > 0) {
      warnings.push({
        field: m.original,
        message: `"${m.original}" ถูก map เป็น "${m.mapped}" (${m.confidence}% confident)`,
        severity: 'info',
        impact: 'กรุณาตรวจสอบว่าถูกต้อง'
      });
    }
  });
  
  return warnings;
};

// Apply mappings to records
const applyMappings = (records: Record<string, string>[], mappings: ColumnMapping[]): Record<string, string>[] => {
  return records.map(record => {
    const mapped: Record<string, string> = {};
    mappings.forEach(m => {
      if (record[m.original] !== undefined) {
        mapped[m.mapped] = record[m.original];
      }
    });
    return mapped;
  });
};

// Risk score calculation
const calculateRiskScore = (entity: LinkedEntity): { score: number; factors: RiskFactor[] } => {
  const factors: RiskFactor[] = [];
  let score = 0;
  
  if (entity.metadata.role === 'ผู้ต้องสงสัย') {
    factors.push({ factor: 'ผู้ต้องสงสัย', score: 30, description: 'ถูกระบุเป็นผู้ต้องสงสัยในคดี' });
    score += 30;
  } else if (entity.metadata.role === 'ผู้เสียหาย') {
    factors.push({ factor: 'ผู้เสียหาย', score: 5, description: 'ถูกระบุเป็นผู้เสียหาย' });
    score += 5;
  }
  
  if (entity.metadata.totalReceived && entity.metadata.totalReceived > 500000) {
    factors.push({ factor: 'รับเงิน > ฿500K', score: 25, description: `รับเงินรวม ฿${entity.metadata.totalReceived.toLocaleString()}` });
    score += 25;
  } else if (entity.metadata.totalReceived && entity.metadata.totalReceived > 100000) {
    factors.push({ factor: 'รับเงิน > ฿100K', score: 15, description: `รับเงินรวม ฿${entity.metadata.totalReceived.toLocaleString()}` });
    score += 15;
  }
  
  if (entity.metadata.transactionCount && entity.metadata.transactionCount > 3) {
    factors.push({ factor: 'ธุรกรรมบ่อย', score: 10, description: `${entity.metadata.transactionCount} ธุรกรรม` });
    score += 10;
  }
  
  if (entity.metadata.usedMixer) {
    factors.push({ factor: 'ใช้ Mixer', score: 20, description: 'โอนผ่าน Crypto Mixer' });
    score += 20;
  }
  
  if (entity.metadata.foreignTransfer) {
    factors.push({ factor: 'โอนต่างประเทศ', score: 15, description: 'โอนไปต่างประเทศ' });
    score += 15;
  }
  
  if (entity.metadata.callCount && entity.metadata.callCount > 5) {
    factors.push({ factor: 'โทรบ่อย', score: 10, description: `โทร ${entity.metadata.callCount} ครั้ง` });
    score += 10;
  }
  
  if (entity.sources.length >= 3) {
    factors.push({ factor: 'หลายแหล่ง', score: 10, description: `พบใน ${entity.sources.length} แหล่ง` });
    score += 10;
  }
  
  return { score: Math.min(score, 100), factors };
};

// ==================== MAIN COMPONENT ====================
const SmartImport: React.FC = () => {
  const navigate = useNavigate();
  const [files, setFiles] = useState<ParsedFile[]>([]);
  const [cases, setCases] = useState<{ id: number; case_number: string; title: string }[]>([]);
  const [selectedCase, setSelectedCase] = useState<number | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isCreatingNetwork, setIsCreatingNetwork] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<LinkedEntity | null>(null);
  const [step, setStep] = useState<'upload' | 'mapping' | 'analyze' | 'result'>('upload');
  const [creationLog, setCreationLog] = useState<string[]>([]);
  const [expandedFile, setExpandedFile] = useState<string | null>(null);

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
        // Calculate SHA-256 hash for Chain of Custody
        const sha256Hash = await calculateSHA256(file);
        
        const text = await file.text();
        const { columns, records } = parseCSV(text);
        
        // Auto-map columns
        const columnMappings = autoMapColumns(columns, '');
        
        // Detect file type from mappings
        const { type, typeLabel } = detectFileType(columnMappings);
        
        // Validate and generate warnings
        const warnings = validateFields(type, columnMappings);
        
        parsedFiles.push({
          id: `file-${Date.now()}-${Math.random()}`,
          name: file.name,
          type,
          typeLabel,
          icon: getFileIcon(type),
          records,
          columns,
          columnMappings,
          warnings,
          status: warnings.some(w => w.severity === 'error') ? 'error' : 'mapped',
          fileSize: file.size,
          sha256Hash
        });
      } catch {
        parsedFiles.push({
          id: `file-${Date.now()}-${Math.random()}`,
          name: file.name,
          type: 'unknown',
          typeLabel: 'Error',
          icon: <AlertCircle className="w-5 h-5 text-red-400" />,
          records: [],
          columns: [],
          columnMappings: [],
          warnings: [{ field: 'file', message: 'ไม่สามารถอ่านไฟล์ได้', severity: 'error', impact: '' }],
          status: 'error',
          error: 'ไม่สามารถอ่านไฟล์ได้'
        });
      }
    }
    
    setFiles(prev => [...prev, ...parsedFiles]);
    if (parsedFiles.length > 0) setStep('mapping');
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
    if (files.length <= 1) {
      setAnalysisResult(null);
      setStep('upload');
    }
  };

  // Update column mapping
  const updateMapping = (fileId: string, originalCol: string, newMapped: string) => {
    setFiles(prev => prev.map(f => {
      if (f.id !== fileId) return f;
      
      const newMappings = f.columnMappings.map(m => 
        m.original === originalCol 
          ? { ...m, mapped: newMapped, autoMapped: false, confidence: 100 }
          : m
      );
      
      // Re-detect type and validate
      const { type, typeLabel } = detectFileType(newMappings);
      const warnings = validateFields(type, newMappings);
      
      return {
        ...f,
        type,
        typeLabel,
        icon: getFileIcon(type),
        columnMappings: newMappings,
        warnings,
        status: warnings.some(w => w.severity === 'error') ? 'error' : 'mapped'
      };
    }));
  };

  // Get total warnings count
  const totalWarnings = files.reduce((sum, f) => sum + f.warnings.filter(w => w.severity !== 'info').length, 0);
  const hasErrors = files.some(f => f.warnings.some(w => w.severity === 'error'));

  // Check cross-file linking potential
  const getLinkingStatus = () => {
    const hasPersonFile = files.some(f => f.type === 'person');
    const hasBankFile = files.some(f => f.type === 'bank');
    const hasPhoneFile = files.some(f => f.type === 'phone');
    const hasCryptoFile = files.some(f => f.type === 'crypto');
    
    const personHasPhone = files.find(f => f.type === 'person')?.columnMappings.some(m => m.mapped === 'phone');
    const personHasBank = files.find(f => f.type === 'person')?.columnMappings.some(m => m.mapped === 'bank_account');
    const personHasWallet = files.find(f => f.type === 'person')?.columnMappings.some(m => m.mapped === 'wallet_address');
    
    const links: { from: string; to: string; possible: boolean; field: string }[] = [];
    
    if (hasPersonFile && hasPhoneFile) {
      links.push({ from: 'บุคคล', to: 'โทรศัพท์', possible: !!personHasPhone, field: 'phone' });
    }
    if (hasPersonFile && hasBankFile) {
      links.push({ from: 'บุคคล', to: 'ธนาคาร', possible: !!personHasBank, field: 'bank_account' });
    }
    if (hasPersonFile && hasCryptoFile) {
      links.push({ from: 'บุคคล', to: 'Crypto', possible: !!personHasWallet, field: 'wallet_address' });
    }
    
    return links;
  };

  // Smart Analysis with mappings
  const analyzeFiles = async () => {
    if (files.length === 0 || hasErrors) return;
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
      
      // Apply mappings to all files first
      const mappedFiles = files.map(f => ({
        ...f,
        mappedRecords: applyMappings(f.records, f.columnMappings)
      }));
      
      // Process person file first
      const personFile = mappedFiles.find(f => f.type === 'person');
      const personPhoneMap = new Map<string, string>();
      const personAccountMap = new Map<string, string>();
      const personWalletMap = new Map<string, string>();
      
      if (personFile) {
        personFile.mappedRecords.forEach(record => {
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
      mappedFiles.filter(f => f.type === 'bank').forEach(file => {
        file.mappedRecords.forEach(record => {
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
          
          const fromPerson = personAccountMap.get(record.from_account?.trim());
          const toPerson = personAccountMap.get(record.to_account?.trim());
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
      mappedFiles.filter(f => f.type === 'phone').forEach(file => {
        file.mappedRecords.forEach(record => {
          const duration = parseInt(record.duration_sec) || 0;
          const fromKey = getOrCreateEntity('phone', record.from_number, record.from_name || record.from_number, file.name);
          const toKey = getOrCreateEntity('phone', record.to_number, record.to_name || record.to_number, file.name);
          
          const fromEntity = entityMap.get(fromKey)!;
          fromEntity.metadata.callCount = (fromEntity.metadata.callCount || 0) + 1;
          fromEntity.metadata.callDuration = (fromEntity.metadata.callDuration || 0) + duration;
          
          addEdge(fromKey, toKey, 'phone_call', `โทร ${duration}วิ`, undefined, record.date);
          
          const fromPerson = personPhoneMap.get(record.from_number?.trim());
          if (fromPerson) {
            const p = entityMap.get(fromPerson)!;
            p.metadata.callCount = (p.metadata.callCount || 0) + 1;
          }
        });
      });
      
      // Process crypto
      mappedFiles.filter(f => f.type === 'crypto').forEach(file => {
        file.mappedRecords.forEach(record => {
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
    
    const log = (msg: string) => { setCreationLog(prev => [...prev, msg]); };
    
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
            log(`  ✅ ${entity.label}`);
          }
        } catch { log(`  ❌ ${entity.label}`); }
      }
      
      log(`\n🔗 สร้าง ${analysisResult.edges.length} Edges...`);
      let edgeSuccess = 0;
      
      const edgeTypeMap: Record<string, string> = {
        'money_transfer': 'bank_transfer',
        'phone_call': 'other',
        'crypto_transfer': 'crypto_transfer',
        'ownership': 'other'
      };
      
      for (const edge of analysisResult.edges) {
        const sourceId = nodeIdMap.get(edge.source);
        const targetId = nodeIdMap.get(edge.target);
        if (sourceId && targetId) {
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
      
      // บันทึก Evidence (Chain of Custody)
      log(`\n🔐 บันทึก Chain of Custody...`);
      let evidenceSuccess = 0;
      
      for (const file of files) {
        if (file.sha256Hash) {
          try {
            await evidenceAPI.create({
              case_id: selectedCase,
              file_name: file.name,
              file_type: file.type,
              file_size: file.fileSize,
              sha256_hash: file.sha256Hash,
              evidence_type: 'csv_file',
              evidence_source: 'smart_import',
              records_count: file.records.length,
              columns_info: JSON.stringify(file.columns),
              description: `${file.typeLabel} - ${file.records.length} records`
            });
            evidenceSuccess++;
            log(`  🔒 ${file.name} (${file.sha256Hash.substring(0, 16)}...)`);
          } catch (err) {
            log(`  ⚠️ ${file.name} (อาจซ้ำ)`);
          }
        }
      }
      
      log(`  ✅ บันทึก ${evidenceSuccess}/${files.length} หลักฐาน`);
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

  const linkingStatus = getLinkingStatus();

  return (
    <div className="flex-1 p-6 bg-dark-900 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="w-8 h-8 text-primary-400" />
          <h1 className="text-2xl font-bold text-white">Smart Import</h1>
          <span className="px-2 py-0.5 bg-primary-500/20 text-primary-400 text-xs rounded">v3</span>
        </div>
        <p className="text-dark-400">Auto-detect, Smart Mapping, Field Validation</p>
      </div>

      {/* Steps */}
      <div className="flex items-center justify-center gap-3 mb-6">
        {[
          { key: 'upload', label: 'อัปโหลด' },
          { key: 'mapping', label: 'ตรวจสอบ Mapping' },
          { key: 'analyze', label: 'วิเคราะห์' },
          { key: 'result', label: 'สร้าง Network' }
        ].map((s, i) => (
          <React.Fragment key={s.key}>
            {i > 0 && <ArrowRight className="w-4 h-4 text-dark-600" />}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${
              step === s.key ? 'bg-primary-500/20 text-primary-400' : 'bg-dark-800 text-dark-400'
            }`}>
              <span className="w-5 h-5 rounded-full bg-current/20 flex items-center justify-center text-xs">{i + 1}</span>
              <span>{s.label}</span>
            </div>
          </React.Fragment>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-4">
          {/* Case Select */}
          <div className="bg-dark-800 rounded-xl p-4 border border-dark-700">
            <h3 className="text-sm font-semibold text-white mb-3">เลือกคดี</h3>
            <select value={selectedCase || ''} onChange={(e) => setSelectedCase(Number(e.target.value) || null)}
              className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white text-sm">
              <option value="">-- เลือกคดี --</option>
              {cases.map((c) => <option key={c.id} value={c.id}>{c.case_number} - {c.title}</option>)}
            </select>
          </div>

          {/* Drop Zone */}
          <div onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}
            className="bg-dark-800 rounded-xl p-6 border-2 border-dashed border-dark-600 hover:border-primary-500 transition-colors">
            <div className="flex flex-col items-center text-center">
              <Upload className="w-12 h-12 text-dark-500 mb-3" />
              <h3 className="text-lg font-semibold text-white mb-1">ลากไฟล์มาวางที่นี่</h3>
              <p className="text-dark-400 text-sm mb-3">รองรับ CSV จาก Cellebrite, UFED, XRY และอื่นๆ</p>
              <label className="px-4 py-2 bg-primary-500 text-white rounded-lg cursor-pointer hover:bg-primary-600 text-sm">
                เลือกไฟล์
                <input type="file" multiple accept=".csv" onChange={handleFileSelect} className="hidden" />
              </label>
            </div>
          </div>

          {/* Files with Mapping */}
          {files.length > 0 && (
            <div className="space-y-3">
              {/* Global Warnings */}
              {totalWarnings > 0 && (
                <div className={`p-3 rounded-lg flex items-start gap-2 ${hasErrors ? 'bg-red-500/10 border border-red-500/30' : 'bg-yellow-500/10 border border-yellow-500/30'}`}>
                  <AlertTriangle className={`w-5 h-5 flex-shrink-0 ${hasErrors ? 'text-red-400' : 'text-yellow-400'}`} />
                  <div>
                    <p className={`text-sm font-medium ${hasErrors ? 'text-red-400' : 'text-yellow-400'}`}>
                      พบ {totalWarnings} รายการที่ต้องตรวจสอบ
                    </p>
                    <p className="text-xs text-dark-400 mt-0.5">
                      {hasErrors ? 'มี field ที่จำเป็นไม่ครบ - ไม่สามารถวิเคราะห์ได้' : 'การเชื่อมโยงอาจไม่สมบูรณ์'}
                    </p>
                  </div>
                </div>
              )}

              {/* Linking Status */}
              {linkingStatus.length > 0 && (
                <div className="bg-dark-800 rounded-xl p-4 border border-dark-700">
                  <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <Link className="w-4 h-4 text-primary-400" />
                    สถานะการเชื่อมโยง
                  </h4>
                  <div className="space-y-2">
                    {linkingStatus.map((link, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        {link.possible ? (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : (
                          <Unlink className="w-4 h-4 text-yellow-400" />
                        )}
                        <span className="text-dark-300">{link.from}</span>
                        <ArrowRight className="w-3 h-3 text-dark-500" />
                        <span className="text-dark-300">{link.to}</span>
                        {!link.possible && (
                          <span className="text-xs text-yellow-400 ml-2">(ขาด field: {link.field})</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* File List with Expandable Mapping */}
              {files.map((file) => (
                <div key={file.id} className="bg-dark-800 rounded-xl border border-dark-700 overflow-hidden">
                  {/* File Header */}
                  <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-dark-750"
                       onClick={() => setExpandedFile(expandedFile === file.id ? null : file.id)}>
                    <div className="flex items-center gap-3">
                      {file.icon}
                      <div>
                        <p className="text-white font-medium text-sm">{file.name}</p>
                        <p className="text-xs text-dark-400">{file.typeLabel} • {file.records.length} รายการ • {file.columns.length} columns</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {file.warnings.filter(w => w.severity === 'error').length > 0 && (
                        <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded">
                          {file.warnings.filter(w => w.severity === 'error').length} errors
                        </span>
                      )}
                      {file.warnings.filter(w => w.severity === 'warning').length > 0 && (
                        <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded">
                          {file.warnings.filter(w => w.severity === 'warning').length} warnings
                        </span>
                      )}
                      {file.status === 'mapped' && file.warnings.length === 0 && (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      )}
                      <button onClick={(e) => { e.stopPropagation(); removeFile(file.id); }} 
                              className="p-1 text-dark-400 hover:text-red-400">
                        <Trash2 className="w-4 h-4" />
                      </button>
                      {expandedFile === file.id ? <ChevronUp className="w-4 h-4 text-dark-400" /> : <ChevronDown className="w-4 h-4 text-dark-400" />}
                    </div>
                  </div>

                  {/* Expanded Mapping */}
                  {expandedFile === file.id && (
                    <div className="border-t border-dark-700 p-4 space-y-4">
                      {/* Warnings */}
                      {file.warnings.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-dark-400">คำเตือน:</p>
                          {file.warnings.map((w, idx) => (
                            <div key={idx} className={`flex items-start gap-2 p-2 rounded text-xs ${
                              w.severity === 'error' ? 'bg-red-500/10 text-red-400' :
                              w.severity === 'warning' ? 'bg-yellow-500/10 text-yellow-400' :
                              'bg-blue-500/10 text-blue-400'
                            }`}>
                              {w.severity === 'error' ? <AlertCircle className="w-3 h-3 mt-0.5" /> :
                               w.severity === 'warning' ? <AlertTriangle className="w-3 h-3 mt-0.5" /> :
                               <Eye className="w-3 h-3 mt-0.5" />}
                              <div>
                                <span className="font-medium">{w.message}</span>
                                {w.impact && <span className="text-dark-400 ml-1">- {w.impact}</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Column Mapping Table */}
                      <div>
                        <p className="text-xs font-medium text-dark-400 mb-2 flex items-center gap-2">
                          <Settings className="w-3 h-3" />
                          Column Mapping (คลิกเพื่อแก้ไข)
                        </p>
                        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                          {file.columnMappings.map((m, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-xs bg-dark-700 rounded p-2">
                              <span className="text-dark-400 truncate flex-1" title={m.original}>{m.original}</span>
                              <ArrowRight className="w-3 h-3 text-dark-500 flex-shrink-0" />
                              <select
                                value={m.mapped}
                                onChange={(e) => updateMapping(file.id, m.original, e.target.value)}
                                className={`bg-dark-600 border rounded px-1.5 py-0.5 text-xs flex-1 ${
                                  m.confidence === 100 ? 'border-green-500/50 text-green-400' :
                                  m.confidence >= 70 ? 'border-yellow-500/50 text-yellow-400' :
                                  'border-dark-500 text-dark-300'
                                }`}
                              >
                                <option value={m.original}>{m.original} (ไม่ map)</option>
                                {Object.keys(COLUMN_ALIASES).map(std => (
                                  <option key={std} value={std}>{std}</option>
                                ))}
                              </select>
                              {m.autoMapped && m.confidence >= 70 && (
                                <span className="text-green-400" title={`Auto-mapped ${m.confidence}%`}>✓</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Analyze Button */}
              <button onClick={analyzeFiles} disabled={!selectedCase || isAnalyzing || hasErrors || files.length === 0}
                className="w-full px-4 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg font-semibold disabled:opacity-50 flex items-center justify-center gap-2 text-sm">
                {isAnalyzing ? <><Loader2 className="w-4 h-4 animate-spin" />วิเคราะห์...</> : <><Sparkles className="w-4 h-4" />วิเคราะห์ + Risk Score</>}
              </button>
            </div>
          )}

          {/* Creation Log */}
          {creationLog.length > 0 && (
            <div className="bg-dark-800 rounded-xl p-4 border border-dark-700">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary-400" />สร้าง Network...
              </h3>
              <div className="bg-dark-900 rounded-lg p-3 max-h-48 overflow-y-auto font-mono text-xs">
                {creationLog.map((log, idx) => <div key={idx} className="text-dark-300">{log}</div>)}
              </div>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {analysisResult && (
            <>
              {/* Summary */}
              <div className="bg-dark-800 rounded-xl p-4 border border-dark-700">
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />ผลวิเคราะห์
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-dark-700 rounded-lg p-2 text-center">
                    <p className="text-lg font-bold text-white">{analysisResult.summary.totalRecords}</p>
                    <p className="text-xs text-dark-400">รายการ</p>
                  </div>
                  <div className="bg-dark-700 rounded-lg p-2 text-center">
                    <p className="text-lg font-bold text-green-400">{analysisResult.summary.totalEntities}</p>
                    <p className="text-xs text-dark-400">Entities</p>
                  </div>
                  <div className="bg-dark-700 rounded-lg p-2 text-center">
                    <p className="text-lg font-bold text-blue-400">{analysisResult.summary.totalEdges}</p>
                    <p className="text-xs text-dark-400">Edges</p>
                  </div>
                  <div className="bg-dark-700 rounded-lg p-2 text-center">
                    <p className="text-lg font-bold text-red-400">{analysisResult.summary.highRiskCount}</p>
                    <p className="text-xs text-dark-400">High Risk</p>
                  </div>
                </div>
              </div>

              {/* Risk List */}
              <div className="bg-dark-800 rounded-xl p-4 border border-dark-700">
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-400" />Risk Score
                </h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {analysisResult.entities
                    .filter(e => e.type === 'person' || e.riskScore >= 30)
                    .sort((a, b) => b.riskScore - a.riskScore)
                    .slice(0, 10)
                    .map((entity) => (
                      <div key={entity.id} onClick={() => setSelectedEntity(entity)}
                        className={`p-2 bg-dark-700 rounded-lg cursor-pointer hover:bg-dark-600 ${selectedEntity?.id === entity.id ? 'ring-1 ring-primary-500' : ''}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {entity.type === 'person' && <Users className="w-3 h-3 text-green-400" />}
                            {entity.type === 'account' && <FileText className="w-3 h-3 text-blue-400" />}
                            {entity.type === 'phone' && <Phone className="w-3 h-3 text-yellow-400" />}
                            {entity.type === 'wallet' && <Wallet className="w-3 h-3 text-purple-400" />}
                            <span className="text-white text-xs truncate max-w-[120px]">{entity.label}</span>
                          </div>
                          <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${getRiskColor(entity.riskScore)}`}>{entity.riskScore}</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Selected Entity Detail */}
              {selectedEntity && (
                <div className="bg-dark-800 rounded-xl p-4 border border-primary-500">
                  <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary-400" />Risk Breakdown
                  </h3>
                  <p className="text-white text-sm font-medium">{selectedEntity.label}</p>
                  <p className="text-xs text-dark-400 mb-3">พบใน: {selectedEntity.sources.join(', ')}</p>
                  
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-dark-400 text-xs">Risk Score</span>
                    <span className={`text-xl font-bold ${getRiskColor(selectedEntity.riskScore).split(' ')[0]}`}>{selectedEntity.riskScore}/100</span>
                  </div>
                  <div className="w-full bg-dark-700 rounded-full h-1.5 mb-3">
                    <div className={`h-1.5 rounded-full ${selectedEntity.riskScore >= 70 ? 'bg-red-500' : selectedEntity.riskScore >= 40 ? 'bg-yellow-500' : 'bg-green-500'}`}
                      style={{ width: `${selectedEntity.riskScore}%` }} />
                  </div>
                  
                  <div className="space-y-1.5">
                    {selectedEntity.riskFactors.map((f, idx) => (
                      <div key={idx} className="flex items-start gap-2 p-1.5 bg-dark-700 rounded text-xs">
                        <TrendingUp className="w-3 h-3 text-red-400 mt-0.5" />
                        <div>
                          <span className="text-white">{f.factor}</span>
                          <span className="text-red-400 ml-1">+{f.score}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Create Button */}
              <button onClick={createNetwork} disabled={isCreatingNetwork}
                className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-green-700 disabled:opacity-50 flex items-center justify-center gap-2 text-sm">
                {isCreatingNetwork ? <><Loader2 className="w-4 h-4 animate-spin" />สร้าง...</> :
                  <><Network className="w-4 h-4" />สร้าง Network ({analysisResult.summary.totalEntities} nodes, {analysisResult.summary.totalEdges} edges)</>}
              </button>
            </>
          )}

          {!analysisResult && files.length === 0 && (
            <div className="bg-dark-800 rounded-xl p-6 border border-dark-700 text-center">
              <Eye className="w-10 h-10 text-dark-600 mx-auto mb-3" />
              <p className="text-dark-400 text-sm">อัปโหลดไฟล์เพื่อเริ่มวิเคราะห์</p>
              <p className="text-dark-500 text-xs mt-1">รองรับ Cellebrite, UFED, XRY</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SmartImport;
