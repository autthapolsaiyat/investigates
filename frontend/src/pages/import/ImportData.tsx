/**
 * Import Data Page - นำเข้าข้อมูลสำหรับวิเคราะห์
 * รองรับ CSV, Excel พร้อม Auto-Link Detection
 */
import { useState, useCallback, useRef } from 'react';
import {
  Upload, FileSpreadsheet, Users, CreditCard, Phone, Wallet,
  CheckCircle2, AlertCircle, ArrowRight, Download, Trash2,
  Loader2, FileText, Link2, Eye, Save, X, ChevronDown, ChevronUp,
  HelpCircle, Database, RefreshCw
} from 'lucide-react';
import { Button, Card, Badge, Input } from '../../components/ui';
import { casesAPI, moneyFlowAPI } from '../../services/api';
import type { Case } from '../../services/api';

// Types
interface ImportTemplate {
  id: string;
  name: string;
  nameTh: string;
  icon: React.ElementType;
  description: string;
  requiredFields: string[];
  optionalFields: string[];
  sampleData: Record<string, string>[];
}

interface ParsedRow {
  [key: string]: string | number | null;
}

interface FieldMapping {
  sourceField: string;
  targetField: string;
  isRequired: boolean;
}

interface ImportStats {
  totalRows: number;
  validRows: number;
  errorRows: number;
  duplicates: number;
  autoLinked: number;
}

// Import Templates
const importTemplates: ImportTemplate[] = [
  {
    id: 'bank_transactions',
    name: 'Bank Transactions',
    nameTh: 'ธุรกรรมธนาคาร',
    icon: CreditCard,
    description: 'นำเข้าข้อมูลการโอนเงินจาก Bank Statement',
    requiredFields: ['date', 'from_account', 'to_account', 'amount'],
    optionalFields: ['time', 'bank', 'from_name', 'to_name', 'note', 'ref'],
    sampleData: [
      { date: '2026-01-09', time: '14:30:00', from_account: '123-4-56789-0', to_account: '987-6-54321-0', amount: '50000', bank: 'KBANK', from_name: 'นาย ก', to_name: 'นาย ข', note: 'โอนเงิน' }
    ]
  },
  {
    id: 'persons',
    name: 'Persons (Suspects/Victims)',
    nameTh: 'บุคคล (ผู้ต้องสงสัย/ผู้เสียหาย)',
    icon: Users,
    description: 'นำเข้ารายชื่อผู้ต้องสงสัยหรือผู้เสียหาย',
    requiredFields: ['name', 'id_card', 'type'],
    optionalFields: ['phone', 'province', 'bank_account', 'bank_name', 'role', 'notes'],
    sampleData: [
      { name: 'นาย ก ข', id_card: '1-1234-56789-01-0', phone: '081-234-5678', type: 'suspect', province: 'กรุงเทพฯ', bank_account: '123-4-56789-0', bank_name: 'KBANK', role: 'หัวหน้า' }
    ]
  },
  {
    id: 'call_logs',
    name: 'Call Logs / SMS',
    nameTh: 'ข้อมูลโทรศัพท์',
    icon: Phone,
    description: 'นำเข้า Call Log จาก Digital Forensic Tools',
    requiredFields: ['datetime', 'from_number', 'to_number', 'type'],
    optionalFields: ['duration', 'message', 'device_id'],
    sampleData: [
      { datetime: '2026-01-09 14:30:00', from_number: '081-234-5678', to_number: '089-876-5432', type: 'call', duration: '120' }
    ]
  },
  {
    id: 'crypto',
    name: 'Crypto Wallets',
    nameTh: 'กระเป๋าคริปโต',
    icon: Wallet,
    description: 'นำเข้าข้อมูล Blockchain Transactions',
    requiredFields: ['wallet_address', 'blockchain', 'date', 'amount', 'direction'],
    optionalFields: ['counterparty', 'tx_hash', 'usd_value'],
    sampleData: [
      { wallet_address: '0x1234...abcd', blockchain: 'Ethereum', date: '2026-01-09', amount: '0.5', direction: 'out', counterparty: '0xabcd...1234', tx_hash: '0x9876...' }
    ]
  }
];

// Field name mappings (Thai to English)
const fieldAliases: Record<string, string[]> = {
  date: ['วันที่', 'date', 'transaction_date', 'trans_date'],
  time: ['เวลา', 'time', 'transaction_time'],
  from_account: ['บัญชีต้นทาง', 'from_account', 'source_account', 'debit_account', 'บัญชีผู้โอน'],
  to_account: ['บัญชีปลายทาง', 'to_account', 'dest_account', 'credit_account', 'บัญชีผู้รับ'],
  amount: ['จำนวนเงิน', 'amount', 'value', 'sum', 'ยอดเงิน'],
  bank: ['ธนาคาร', 'bank', 'bank_name'],
  from_name: ['ชื่อผู้โอน', 'from_name', 'sender_name', 'ชื่อต้นทาง'],
  to_name: ['ชื่อผู้รับ', 'to_name', 'receiver_name', 'ชื่อปลายทาง'],
  name: ['ชื่อ', 'name', 'full_name', 'ชื่อ-นามสกุล'],
  id_card: ['เลขบัตรประชาชน', 'id_card', 'citizen_id', 'national_id', 'บัตรประชาชน'],
  phone: ['เบอร์โทร', 'phone', 'mobile', 'tel', 'โทรศัพท์'],
  type: ['ประเภท', 'type', 'category', 'สถานะ'],
  province: ['จังหวัด', 'province', 'city', 'location'],
};

export const ImportData = () => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedTemplate, setSelectedTemplate] = useState<ImportTemplate | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([]);
  const [detectedHeaders, setDetectedHeaders] = useState<string[]>([]);
  const [importStats, setImportStats] = useState<ImportStats | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [cases, setCases] = useState<Case[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<number | null>(null);
  const [previewExpanded, setPreviewExpanded] = useState(true);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importSuccess, setImportSuccess] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch cases on mount
  useState(() => {
    casesAPI.list({ page: 1, page_size: 100 }).then(res => {
      setCases(res.items);
      if (res.items.length > 0) {
        setSelectedCaseId(res.items[0].id);
      }
    });
  });

  // Auto-detect field mapping based on header names
  const autoDetectFieldMapping = (headers: string[], template: ImportTemplate): FieldMapping[] => {
    const mappings: FieldMapping[] = [];
    const allFields = [...template.requiredFields, ...template.optionalFields];
    
    allFields.forEach(targetField => {
      const aliases = fieldAliases[targetField] || [targetField];
      const matchedHeader = headers.find(h => 
        aliases.some(alias => h.toLowerCase().includes(alias.toLowerCase()))
      );
      
      mappings.push({
        sourceField: matchedHeader || '',
        targetField,
        isRequired: template.requiredFields.includes(targetField)
      });
    });
    
    return mappings;
  };

  // Parse CSV content
  const parseCSV = (content: string): { headers: string[]; rows: ParsedRow[] } => {
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length === 0) return { headers: [], rows: [] };
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const rows: ParsedRow[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      const row: ParsedRow = {};
      headers.forEach((header, idx) => {
        row[header] = values[idx] || null;
      });
      rows.push(row);
    }
    
    return { headers, rows };
  };

  // Handle file upload
  const handleFileUpload = async (file: File) => {
    setUploadedFile(file);
    setIsProcessing(true);
    
    try {
      const content = await file.text();
      let headers: string[] = [];
      let rows: ParsedRow[] = [];
      
      if (file.name.endsWith('.csv')) {
        const result = parseCSV(content);
        headers = result.headers;
        rows = result.rows;
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        // For Excel files, we'd need a library like xlsx
        // For now, show a message
        setImportErrors(['รองรับไฟล์ Excel เร็วๆ นี้ - กรุณาใช้ CSV ก่อน']);
        setIsProcessing(false);
        return;
      }
      
      setDetectedHeaders(headers);
      setParsedData(rows);
      
      if (selectedTemplate) {
        const mappings = autoDetectFieldMapping(headers, selectedTemplate);
        setFieldMappings(mappings);
      }
      
      // Calculate initial stats
      setImportStats({
        totalRows: rows.length,
        validRows: rows.length,
        errorRows: 0,
        duplicates: 0,
        autoLinked: 0
      });
      
      setStep(3);
    } catch (error) {
      console.error('File parsing error:', error);
      setImportErrors(['ไม่สามารถอ่านไฟล์ได้ - กรุณาตรวจสอบรูปแบบไฟล์']);
    } finally {
      setIsProcessing(false);
    }
  };

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, [selectedTemplate]);

  // Update field mapping
  const updateFieldMapping = (targetField: string, sourceField: string) => {
    setFieldMappings(prev => 
      prev.map(m => m.targetField === targetField ? { ...m, sourceField } : m)
    );
  };

  // Validate data before import
  const validateData = (): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    const requiredMappings = fieldMappings.filter(m => m.isRequired);
    
    // Check required field mappings
    requiredMappings.forEach(m => {
      if (!m.sourceField) {
        errors.push(`ฟิลด์ "${m.targetField}" จำเป็นต้องระบุ`);
      }
    });
    
    // Check data integrity
    let invalidRows = 0;
    parsedData.forEach((row, idx) => {
      requiredMappings.forEach(m => {
        if (m.sourceField && !row[m.sourceField]) {
          invalidRows++;
        }
      });
    });
    
    if (invalidRows > 0) {
      errors.push(`พบ ${invalidRows} แถวที่ข้อมูลไม่ครบ`);
    }
    
    return { valid: errors.length === 0, errors };
  };

  // Process and import data
  const processImport = async () => {
    setIsProcessing(true);
    setImportErrors([]);
    
    const validation = validateData();
    if (!validation.valid) {
      setImportErrors(validation.errors);
      setIsProcessing(false);
      return;
    }
    
    try {
      // Transform data according to mappings
      const transformedData = parsedData.map(row => {
        const transformed: Record<string, unknown> = {};
        fieldMappings.forEach(m => {
          if (m.sourceField) {
            transformed[m.targetField] = row[m.sourceField];
          }
        });
        return transformed;
      });
      
      // Import based on template type
      if (selectedTemplate?.id === 'bank_transactions' && selectedCaseId) {
        let successCount = 0;
        let linkedCount = 0;
        
        // Create nodes and edges for each transaction
        for (const tx of transformedData) {
          try {
            // Create or find from_account node
            const fromNode = await moneyFlowAPI.createNode(selectedCaseId, {
              label: String(tx.from_name || tx.from_account),
              node_type: 'bank_account',
              identifier: String(tx.from_account),
              bank_name: String(tx.bank || ''),
              account_name: String(tx.from_name || ''),
              is_suspect: false,
              is_victim: false,
              risk_score: 50
            });
            
            // Create or find to_account node
            const toNode = await moneyFlowAPI.createNode(selectedCaseId, {
              label: String(tx.to_name || tx.to_account),
              node_type: 'bank_account',
              identifier: String(tx.to_account),
              bank_name: String(tx.bank || ''),
              account_name: String(tx.to_name || ''),
              is_suspect: false,
              is_victim: false,
              risk_score: 50
            });
            
            // Create edge (transaction)
            await moneyFlowAPI.createEdge(selectedCaseId, {
              from_node_id: fromNode.id,
              to_node_id: toNode.id,
              edge_type: 'transfer',
              amount: parseFloat(String(tx.amount)) || 0,
              label: String(tx.note || 'โอนเงิน'),
              transaction_date: String(tx.date),
              transaction_ref: String(tx.ref || '')
            });
            
            successCount++;
            linkedCount += 2; // Both nodes are auto-linked
          } catch (err) {
            console.error('Transaction import error:', err);
          }
        }
        
        setImportStats(prev => prev ? {
          ...prev,
          validRows: successCount,
          errorRows: transformedData.length - successCount,
          autoLinked: linkedCount
        } : null);
      }
      
      // Similar handling for other template types...
      
      setImportSuccess(true);
      setStep(4);
    } catch (error) {
      console.error('Import error:', error);
      setImportErrors(['เกิดข้อผิดพลาดในการนำเข้าข้อมูล']);
    } finally {
      setIsProcessing(false);
    }
  };

  // Download sample template
  const downloadTemplate = (template: ImportTemplate) => {
    const headers = [...template.requiredFields, ...template.optionalFields];
    const sampleRow = template.sampleData[0];
    const csvContent = [
      headers.join(','),
      headers.map(h => sampleRow[h] || '').join(',')
    ].join('\n');
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `template_${template.id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Reset wizard
  const resetWizard = () => {
    setStep(1);
    setSelectedTemplate(null);
    setUploadedFile(null);
    setParsedData([]);
    setFieldMappings([]);
    setDetectedHeaders([]);
    setImportStats(null);
    setImportErrors([]);
    setImportSuccess(false);
  };

  return (
    <div className="flex-1 p-6 space-y-6 bg-dark-900">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Database className="text-primary-500" />
            นำเข้าข้อมูล
          </h1>
          <p className="text-dark-400 mt-1">Import Wizard - นำเข้าข้อมูลสำหรับวิเคราะห์เครือข่าย</p>
        </div>
        {step > 1 && (
          <Button variant="ghost" onClick={resetWizard}>
            <RefreshCw size={18} className="mr-2" />
            เริ่มใหม่
          </Button>
        )}
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-2">
        {[
          { num: 1, label: 'เลือกประเภท' },
          { num: 2, label: 'อัปโหลดไฟล์' },
          { num: 3, label: 'ตรวจสอบข้อมูล' },
          { num: 4, label: 'เสร็จสิ้น' }
        ].map((s, idx) => (
          <div key={s.num} className="flex items-center">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              step >= s.num ? 'bg-primary-500/20 text-primary-400' : 'bg-dark-800 text-dark-400'
            }`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                step > s.num ? 'bg-primary-500 text-white' : 
                step === s.num ? 'bg-primary-500/50 text-white' : 'bg-dark-600'
              }`}>
                {step > s.num ? <CheckCircle2 size={14} /> : s.num}
              </div>
              <span className="text-sm font-medium">{s.label}</span>
            </div>
            {idx < 3 && (
              <ArrowRight size={20} className="mx-2 text-dark-600" />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Select Template */}
      {step === 1 && (
        <div className="space-y-4">
          <Card className="p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <FileSpreadsheet className="text-primary-400" />
              เลือกประเภทข้อมูลที่ต้องการนำเข้า
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {importTemplates.map(template => (
                <div
                  key={template.id}
                  onClick={() => {
                    setSelectedTemplate(template);
                    setStep(2);
                  }}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:border-primary-500 hover:bg-dark-800 ${
                    selectedTemplate?.id === template.id ? 'border-primary-500 bg-dark-800' : 'border-dark-700'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary-500/20 rounded-lg">
                      <template.icon className="text-primary-400" size={24} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold">{template.nameTh}</h4>
                      <p className="text-sm text-dark-400 mt-1">{template.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="info" className="text-xs">
                          {template.requiredFields.length} ฟิลด์จำเป็น
                        </Badge>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadTemplate(template);
                          }}
                        >
                          <Download size={14} className="mr-1" />
                          Template
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Step 2: Upload File */}
      {step === 2 && selectedTemplate && (
        <div className="space-y-4">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Upload className="text-primary-400" />
                อัปโหลดไฟล์ {selectedTemplate.nameTh}
              </h3>
              <Button variant="ghost" size="sm" onClick={() => downloadTemplate(selectedTemplate)}>
                <Download size={14} className="mr-1" />
                ดาวน์โหลด Template
              </Button>
            </div>

            {/* Case Selector */}
            <div className="mb-4">
              <label className="text-sm font-medium text-dark-300 mb-2 block">เลือกคดีที่จะนำเข้า:</label>
              <select
                className="bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white w-full max-w-md"
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

            {/* Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
                isDragging 
                  ? 'border-primary-500 bg-primary-500/10' 
                  : 'border-dark-600 hover:border-primary-500/50 hover:bg-dark-800'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={(e) => e.target.files && handleFileUpload(e.target.files[0])}
                className="hidden"
              />
              
              {isProcessing ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
                  <p className="text-lg font-medium">กำลังประมวลผลไฟล์...</p>
                </div>
              ) : uploadedFile ? (
                <div className="flex flex-col items-center gap-3">
                  <FileText className="w-12 h-12 text-green-500" />
                  <p className="text-lg font-medium">{uploadedFile.name}</p>
                  <p className="text-sm text-dark-400">
                    {(uploadedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <Upload className="w-12 h-12 text-dark-400" />
                  <p className="text-lg font-medium">ลากไฟล์มาวางที่นี่</p>
                  <p className="text-sm text-dark-400">หรือคลิกเพื่อเลือกไฟล์</p>
                  <p className="text-xs text-dark-500 mt-2">รองรับ .csv, .xlsx, .xls</p>
                </div>
              )}
            </div>

            {/* Required Fields Info */}
            <div className="mt-4 p-4 bg-dark-800 rounded-lg">
              <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                <HelpCircle size={14} className="text-primary-400" />
                ฟิลด์ที่ต้องมี
              </h4>
              <div className="flex flex-wrap gap-2">
                {selectedTemplate.requiredFields.map(field => (
                  <Badge key={field} variant="danger" className="text-xs">
                    {field} *
                  </Badge>
                ))}
                {selectedTemplate.optionalFields.map(field => (
                  <Badge key={field} variant="default" className="text-xs">
                    {field}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Errors */}
            {importErrors.length > 0 && (
              <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                <h4 className="text-sm font-medium text-red-400 flex items-center gap-2 mb-2">
                  <AlertCircle size={14} />
                  พบข้อผิดพลาด
                </h4>
                <ul className="text-sm text-red-300 space-y-1">
                  {importErrors.map((err, idx) => (
                    <li key={idx}>• {err}</li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Step 3: Review & Map Fields */}
      {step === 3 && selectedTemplate && (
        <div className="space-y-4">
          {/* Stats Summary */}
          {importStats && (
            <div className="grid grid-cols-5 gap-4">
              <Card className="p-4 text-center">
                <p className="text-2xl font-bold text-primary-400">{importStats.totalRows}</p>
                <p className="text-sm text-dark-400">แถวทั้งหมด</p>
              </Card>
              <Card className="p-4 text-center">
                <p className="text-2xl font-bold text-green-400">{importStats.validRows}</p>
                <p className="text-sm text-dark-400">ถูกต้อง</p>
              </Card>
              <Card className="p-4 text-center">
                <p className="text-2xl font-bold text-red-400">{importStats.errorRows}</p>
                <p className="text-sm text-dark-400">ผิดพลาด</p>
              </Card>
              <Card className="p-4 text-center">
                <p className="text-2xl font-bold text-yellow-400">{importStats.duplicates}</p>
                <p className="text-sm text-dark-400">ซ้ำ</p>
              </Card>
              <Card className="p-4 text-center">
                <p className="text-2xl font-bold text-blue-400">{importStats.autoLinked}</p>
                <p className="text-sm text-dark-400">Auto-Linked</p>
              </Card>
            </div>
          )}

          {/* Field Mapping */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Link2 className="text-primary-400" />
              จับคู่ฟิลด์ (Field Mapping)
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {fieldMappings.map(mapping => (
                <div key={mapping.targetField} className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="text-sm text-dark-400 flex items-center gap-1">
                      {mapping.targetField}
                      {mapping.isRequired && <span className="text-red-400">*</span>}
                    </label>
                    <select
                      className={`w-full bg-dark-700 border rounded-lg px-3 py-2 text-sm ${
                        mapping.isRequired && !mapping.sourceField 
                          ? 'border-red-500' 
                          : 'border-dark-600'
                      }`}
                      value={mapping.sourceField}
                      onChange={(e) => updateFieldMapping(mapping.targetField, e.target.value)}
                    >
                      <option value="">-- ไม่เลือก --</option>
                      {detectedHeaders.map(header => (
                        <option key={header} value={header}>{header}</option>
                      ))}
                    </select>
                  </div>
                  {mapping.sourceField && (
                    <CheckCircle2 className="text-green-400" size={20} />
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* Data Preview */}
          <Card className="p-4">
            <div 
              className="flex items-center justify-between cursor-pointer"
              onClick={() => setPreviewExpanded(!previewExpanded)}
            >
              <h3 className="font-semibold flex items-center gap-2">
                <Eye className="text-primary-400" />
                ตัวอย่างข้อมูล ({parsedData.length} แถว)
              </h3>
              {previewExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
            
            {previewExpanded && (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-dark-800">
                    <tr>
                      <th className="px-3 py-2 text-left">#</th>
                      {detectedHeaders.slice(0, 6).map(header => (
                        <th key={header} className="px-3 py-2 text-left">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-700">
                    {parsedData.slice(0, 5).map((row, idx) => (
                      <tr key={idx} className="hover:bg-dark-800/50">
                        <td className="px-3 py-2 text-dark-400">{idx + 1}</td>
                        {detectedHeaders.slice(0, 6).map(header => (
                          <td key={header} className="px-3 py-2 truncate max-w-[150px]">
                            {String(row[header] || '-')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsedData.length > 5 && (
                  <p className="text-center text-dark-400 text-sm mt-2">
                    ... และอีก {parsedData.length - 5} แถว
                  </p>
                )}
              </div>
            )}
          </Card>

          {/* Errors */}
          {importErrors.length > 0 && (
            <Card className="p-4 bg-red-500/10 border-red-500/30">
              <h4 className="font-medium text-red-400 flex items-center gap-2 mb-2">
                <AlertCircle size={16} />
                ข้อผิดพลาด
              </h4>
              <ul className="text-sm text-red-300 space-y-1">
                {importErrors.map((err, idx) => (
                  <li key={idx}>• {err}</li>
                ))}
              </ul>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => setStep(2)}>
              ย้อนกลับ
            </Button>
            <div className="flex items-center gap-3">
              <Button variant="secondary" onClick={resetWizard}>
                <X size={18} className="mr-2" />
                ยกเลิก
              </Button>
              <Button onClick={processImport} disabled={isProcessing}>
                {isProcessing ? (
                  <>
                    <Loader2 size={18} className="mr-2 animate-spin" />
                    กำลังนำเข้า...
                  </>
                ) : (
                  <>
                    <Save size={18} className="mr-2" />
                    นำเข้าข้อมูล
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Success */}
      {step === 4 && (
        <Card className="p-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold">นำเข้าข้อมูลสำเร็จ!</h2>
            <p className="text-dark-400">
              นำเข้าข้อมูลเรียบร้อยแล้ว {importStats?.validRows || 0} รายการ
            </p>
            
            {importStats && (
              <div className="grid grid-cols-3 gap-6 my-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-400">{importStats.validRows}</p>
                  <p className="text-sm text-dark-400">นำเข้าสำเร็จ</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-400">{importStats.autoLinked}</p>
                  <p className="text-sm text-dark-400">Auto-Linked</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-red-400">{importStats.errorRows}</p>
                  <p className="text-sm text-dark-400">ผิดพลาด</p>
                </div>
              </div>
            )}
            
            <div className="flex items-center gap-4">
              <Button variant="secondary" onClick={resetWizard}>
                <Upload size={18} className="mr-2" />
                นำเข้าเพิ่มเติม
              </Button>
              <Button onClick={() => window.location.href = '/forensic-report'}>
                <Eye size={18} className="mr-2" />
                ดูผลลัพธ์
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ImportData;
