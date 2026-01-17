/**
 * KYC Request Generator
 * สร้างหนังสือขอข้อมูล KYC จาก Cryptocurrency Exchange
 */
import { useState } from 'react';
import {
  FileText,
  Building2,
  Wallet,
  Download,
  Copy,
  CheckCircle,
  Printer,
  Calendar,
  User,
  AlertTriangle
} from 'lucide-react';
import { Button, Card } from '../../components/ui';

// Exchange templates
const EXCHANGES = [
  { 
    id: 'binance', 
    name: 'Binance', 
    email: 'law@binance.com',
    country: 'Cayman Islands',
    logo: '🟡',
    responseTime: '7-14 วัน'
  },
  { 
    id: 'bitkub', 
    name: 'Bitkub', 
    email: 'compliance@bitkub.com',
    country: 'Thailand',
    logo: '🟢',
    responseTime: '3-7 วัน'
  },
  { 
    id: 'coinbase', 
    name: 'Coinbase', 
    email: 'law-enforcement@coinbase.com',
    country: 'USA',
    logo: '🔵',
    responseTime: '14-21 วัน'
  },
  { 
    id: 'kraken', 
    name: 'Kraken', 
    email: 'compliance@kraken.com',
    country: 'USA',
    logo: '🟣',
    responseTime: '7-14 วัน'
  },
  { 
    id: 'okx', 
    name: 'OKX', 
    email: 'lawenforcement@okx.com',
    country: 'Seychelles',
    logo: '⚪',
    responseTime: '7-14 วัน'
  },
  { 
    id: 'other', 
    name: 'อื่นๆ (กรอกเอง)', 
    email: '',
    country: '',
    logo: '📧',
    responseTime: '-'
  },
];

interface KYCRequestData {
  // Case info
  caseNumber: string;
  caseTitle: string;
  investigator: string;
  investigatorRank: string;
  investigatorUnit: string;
  investigatorPhone: string;
  investigatorEmail: string;
  
  // Exchange info
  exchangeId: string;
  customExchangeName: string;
  customExchangeEmail: string;
  
  // Request details
  walletAddresses: string[];
  dateRangeStart: string;
  dateRangeEnd: string;
  requestedInfo: string[];
  urgencyLevel: 'normal' | 'urgent' | 'emergency';
  
  // Additional
  additionalNotes: string;
}

const DEFAULT_DATA: KYCRequestData = {
  caseNumber: '',
  caseTitle: '',
  investigator: '',
  investigatorRank: 'พ.ต.ท.',
  investigatorUnit: 'กองบัญชาการตำรวจสืบสวนสอบสวนอาชญากรรมทางเทคโนโลยี',
  investigatorPhone: '',
  investigatorEmail: '',
  exchangeId: 'binance',
  customExchangeName: '',
  customExchangeEmail: '',
  walletAddresses: [''],
  dateRangeStart: '',
  dateRangeEnd: '',
  requestedInfo: ['account_info', 'kyc_docs', 'transaction_history'],
  urgencyLevel: 'normal',
  additionalNotes: '',
};

const REQUESTED_INFO_OPTIONS = [
  { id: 'account_info', label: 'ข้อมูลบัญชีผู้ใช้ (User Account Information)' },
  { id: 'kyc_docs', label: 'เอกสาร KYC (บัตรประชาชน, Passport, ที่อยู่)' },
  { id: 'transaction_history', label: 'ประวัติธุรกรรม (Transaction History)' },
  { id: 'deposit_withdrawal', label: 'ประวัติการฝาก-ถอน (Deposit/Withdrawal History)' },
  { id: 'ip_logs', label: 'บันทึก IP Address และ Login History' },
  { id: 'linked_accounts', label: 'บัญชีที่เชื่อมโยง (Linked Accounts)' },
  { id: 'bank_info', label: 'ข้อมูลบัญชีธนาคารที่ผูกไว้' },
  { id: 'api_keys', label: 'ข้อมูล API Keys ที่สร้าง' },
];

export const KYCRequestGenerator = () => {
  const [formData, setFormData] = useState<KYCRequestData>(DEFAULT_DATA);
  const [showPreview, setShowPreview] = useState(false);
  const [copied, setCopied] = useState(false);

  const selectedExchange = EXCHANGES.find(e => e.id === formData.exchangeId);

  const updateField = <K extends keyof KYCRequestData>(field: K, value: KYCRequestData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addWallet = () => {
    setFormData(prev => ({
      ...prev,
      walletAddresses: [...prev.walletAddresses, '']
    }));
  };

  const updateWallet = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      walletAddresses: prev.walletAddresses.map((w, i) => i === index ? value : w)
    }));
  };

  const removeWallet = (index: number) => {
    setFormData(prev => ({
      ...prev,
      walletAddresses: prev.walletAddresses.filter((_, i) => i !== index)
    }));
  };

  const toggleRequestedInfo = (infoId: string) => {
    setFormData(prev => ({
      ...prev,
      requestedInfo: prev.requestedInfo.includes(infoId)
        ? prev.requestedInfo.filter(i => i !== infoId)
        : [...prev.requestedInfo, infoId]
    }));
  };

  const generateDocument = () => {
    const exchange = formData.exchangeId === 'other' 
      ? { name: formData.customExchangeName, email: formData.customExchangeEmail }
      : selectedExchange;

    const requestedInfoText = formData.requestedInfo
      .map(id => REQUESTED_INFO_OPTIONS.find(o => o.id === id)?.label)
      .filter(Boolean)
      .map((text, i) => `${i + 1}. ${text}`)
      .join('\n');

    const walletList = formData.walletAddresses
      .filter(w => w.trim())
      .map((w, i) => `${i + 1}. ${w}`)
      .join('\n');

    const urgencyText = {
      normal: 'ปกติ (Normal)',
      urgent: 'เร่งด่วน (Urgent)',
      emergency: 'ฉุกเฉิน (Emergency)'
    }[formData.urgencyLevel];

    return `
═══════════════════════════════════════════════════════════════════════
                    หนังสือขอความร่วมมือในการให้ข้อมูล
                 REQUEST FOR USER INFORMATION DISCLOSURE
═══════════════════════════════════════════════════════════════════════

                                                วันที่: ${new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
                                                เลขที่: ${formData.caseNumber || '[รอกรอก]'}

เรียน   ${exchange?.name} Compliance Team
        ${exchange?.email}

เรื่อง   ขอความร่วมมือในการให้ข้อมูลผู้ใช้บริการเพื่อประกอบการสอบสวนคดีอาญา
        Request for User Information for Criminal Investigation

อ้างถึง  คดีหมายเลข: ${formData.caseNumber || '[รอกรอก]'}
        ชื่อคดี: ${formData.caseTitle || '[รอกรอก]'}

───────────────────────────────────────────────────────────────────────

ด้วยข้าพเจ้า ${formData.investigatorRank} ${formData.investigator}
ตำแหน่ง พนักงานสอบสวน ${formData.investigatorUnit}
ได้รับมอบหมายให้ทำการสอบสวนคดีอาญาตามอ้างอิงข้างต้น

จากการสอบสวนพบว่า มีการใช้บริการแลกเปลี่ยน Cryptocurrency ของ ${exchange?.name}
ในการกระทำความผิด จึงขอความร่วมมือในการให้ข้อมูลดังต่อไปนี้

───────────────────────────────────────────────────────────────────────
                        WALLET ADDRESSES / ที่อยู่กระเป๋า
───────────────────────────────────────────────────────────────────────

${walletList || '[รอกรอก Wallet Address]'}

───────────────────────────────────────────────────────────────────────
                        ช่วงเวลาที่ต้องการข้อมูล
───────────────────────────────────────────────────────────────────────

ตั้งแต่วันที่: ${formData.dateRangeStart || '[รอกรอก]'}
ถึงวันที่: ${formData.dateRangeEnd || '[รอกรอก]'}

───────────────────────────────────────────────────────────────────────
                        ข้อมูลที่ต้องการ
───────────────────────────────────────────────────────────────────────

${requestedInfoText || '[รอเลือก]'}

───────────────────────────────────────────────────────────────────────
                        ระดับความเร่งด่วน: ${urgencyText}
───────────────────────────────────────────────────────────────────────

${formData.additionalNotes ? `หมายเหตุเพิ่มเติม:\n${formData.additionalNotes}\n\n` : ''}
จึงเรียนมาเพื่อขอความร่วมมือ และขอขอบคุณมา ณ โอกาสนี้

                                                ขอแสดงความนับถือ

                                        ____________________________
                                        (${formData.investigatorRank} ${formData.investigator || '[ชื่อ-สกุล]'})
                                        พนักงานสอบสวน
                                        ${formData.investigatorUnit}

───────────────────────────────────────────────────────────────────────
                            ข้อมูลติดต่อ
───────────────────────────────────────────────────────────────────────

โทรศัพท์: ${formData.investigatorPhone || '[รอกรอก]'}
อีเมล: ${formData.investigatorEmail || '[รอกรอก]'}

═══════════════════════════════════════════════════════════════════════
         เอกสารนี้เป็นความลับ ห้ามเผยแพร่โดยไม่ได้รับอนุญาต
                     CONFIDENTIAL DOCUMENT
═══════════════════════════════════════════════════════════════════════
`;
  };

  const copyToClipboard = async () => {
    const doc = generateDocument();
    await navigator.clipboard.writeText(doc);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const printDocument = () => {
    const doc = generateDocument();
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>หนังสือขอข้อมูล KYC - ${formData.caseNumber}</title>
            <style>
              body { font-family: 'Sarabun', sans-serif; padding: 40px; white-space: pre-wrap; line-height: 1.6; }
              @media print { body { padding: 20px; } }
            </style>
            <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600&display=swap" rel="stylesheet">
          </head>
          <body>${doc}</body>
        </html>
      `);
      printWindow.document.close();
      setTimeout(() => printWindow.print(), 500);
    }
  };

  const downloadDocument = () => {
    const doc = generateDocument();
    const blob = new Blob([doc], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `KYC-Request-${formData.caseNumber || 'draft'}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 p-6 bg-dark-900 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <FileText className="text-primary-500" />
            KYC Request Generator
          </h1>
          <p className="text-dark-400 mt-1">สร้างหนังสือขอข้อมูล KYC จาก Cryptocurrency Exchange</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => setShowPreview(!showPreview)}>
            {showPreview ? 'แก้ไข' : 'ดูตัวอย่าง'}
          </Button>
          <Button variant="secondary" onClick={printDocument}>
            <Printer size={18} className="mr-2" />
            พิมพ์
          </Button>
          <Button variant="primary" onClick={downloadDocument}>
            <Download size={18} className="mr-2" />
            ดาวน์โหลด
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Form */}
        <div className="space-y-4">
          {/* Case Info */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle size={18} className="text-amber-400" />
              ข้อมูลคดี
            </h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-dark-400 block mb-1">เลขคดี</label>
                  <input
                    type="text"
                    value={formData.caseNumber}
                    onChange={(e) => updateField('caseNumber', e.target.value)}
                    className="w-full bg-dark-700 border border-dark-600 rounded-lg p-2"
                    placeholder="ตช.xxx/2567"
                  />
                </div>
                <div>
                  <label className="text-sm text-dark-400 block mb-1">ชื่อคดี</label>
                  <input
                    type="text"
                    value={formData.caseTitle}
                    onChange={(e) => updateField('caseTitle', e.target.value)}
                    className="w-full bg-dark-700 border border-dark-600 rounded-lg p-2"
                    placeholder="คดีฉ้อโกง Crypto"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Investigator Info */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <User size={18} className="text-blue-400" />
              ข้อมูลพนักงานสอบสวน
            </h3>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-sm text-dark-400 block mb-1">ยศ</label>
                  <select
                    value={formData.investigatorRank}
                    onChange={(e) => updateField('investigatorRank', e.target.value)}
                    className="w-full bg-dark-700 border border-dark-600 rounded-lg p-2"
                  >
                    <option>ร.ต.อ.</option>
                    <option>ร.ต.ท.</option>
                    <option>ร.ต.ต.</option>
                    <option>พ.ต.อ.</option>
                    <option>พ.ต.ท.</option>
                    <option>พ.ต.ต.</option>
                    <option>ส.ต.อ.</option>
                    <option>ส.ต.ท.</option>
                    <option>ส.ต.ต.</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-sm text-dark-400 block mb-1">ชื่อ-สกุล</label>
                  <input
                    type="text"
                    value={formData.investigator}
                    onChange={(e) => updateField('investigator', e.target.value)}
                    className="w-full bg-dark-700 border border-dark-600 rounded-lg p-2"
                    placeholder="ชื่อ นามสกุล"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm text-dark-400 block mb-1">สังกัด</label>
                <input
                  type="text"
                  value={formData.investigatorUnit}
                  onChange={(e) => updateField('investigatorUnit', e.target.value)}
                  className="w-full bg-dark-700 border border-dark-600 rounded-lg p-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-dark-400 block mb-1">โทรศัพท์</label>
                  <input
                    type="tel"
                    value={formData.investigatorPhone}
                    onChange={(e) => updateField('investigatorPhone', e.target.value)}
                    className="w-full bg-dark-700 border border-dark-600 rounded-lg p-2"
                    placeholder="02-xxx-xxxx"
                  />
                </div>
                <div>
                  <label className="text-sm text-dark-400 block mb-1">อีเมล</label>
                  <input
                    type="email"
                    value={formData.investigatorEmail}
                    onChange={(e) => updateField('investigatorEmail', e.target.value)}
                    className="w-full bg-dark-700 border border-dark-600 rounded-lg p-2"
                    placeholder="email@police.go.th"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Exchange Selection */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Building2 size={18} className="text-purple-400" />
              Exchange ที่ต้องการขอข้อมูล
            </h3>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {EXCHANGES.map(exchange => (
                <button
                  key={exchange.id}
                  onClick={() => updateField('exchangeId', exchange.id)}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    formData.exchangeId === exchange.id
                      ? 'border-primary-500 bg-primary-500/10'
                      : 'border-dark-600 bg-dark-800 hover:bg-dark-700'
                  }`}
                >
                  <div className="text-xl">{exchange.logo}</div>
                  <div className="font-medium text-sm mt-1">{exchange.name}</div>
                  {exchange.responseTime !== '-' && (
                    <div className="text-xs text-dark-400">{exchange.responseTime}</div>
                  )}
                </button>
              ))}
            </div>
            {formData.exchangeId === 'other' && (
              <div className="space-y-3 p-3 bg-dark-800 rounded-lg">
                <div>
                  <label className="text-sm text-dark-400 block mb-1">ชื่อ Exchange</label>
                  <input
                    type="text"
                    value={formData.customExchangeName}
                    onChange={(e) => updateField('customExchangeName', e.target.value)}
                    className="w-full bg-dark-700 border border-dark-600 rounded-lg p-2"
                    placeholder="Exchange Name"
                  />
                </div>
                <div>
                  <label className="text-sm text-dark-400 block mb-1">อีเมล Compliance</label>
                  <input
                    type="email"
                    value={formData.customExchangeEmail}
                    onChange={(e) => updateField('customExchangeEmail', e.target.value)}
                    className="w-full bg-dark-700 border border-dark-600 rounded-lg p-2"
                    placeholder="compliance@exchange.com"
                  />
                </div>
              </div>
            )}
          </Card>

          {/* Wallet Addresses */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Wallet size={18} className="text-amber-400" />
              Wallet Address ที่ต้องการสอบถาม
            </h3>
            <div className="space-y-2">
              {formData.walletAddresses.map((wallet, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={wallet}
                    onChange={(e) => updateWallet(index, e.target.value)}
                    className="flex-1 bg-dark-700 border border-dark-600 rounded-lg p-2 font-mono text-sm"
                    placeholder="0x... หรือ 1... หรือ bc1..."
                  />
                  {formData.walletAddresses.length > 1 && (
                    <Button variant="ghost" size="sm" onClick={() => removeWallet(index)}>
                      ✕
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="ghost" size="sm" onClick={addWallet} className="w-full mt-2">
                + เพิ่ม Wallet
              </Button>
            </div>
          </Card>

          {/* Date Range */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Calendar size={18} className="text-green-400" />
              ช่วงเวลาที่ต้องการข้อมูล
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-dark-400 block mb-1">ตั้งแต่วันที่</label>
                <input
                  type="date"
                  value={formData.dateRangeStart}
                  onChange={(e) => updateField('dateRangeStart', e.target.value)}
                  className="w-full bg-dark-700 border border-dark-600 rounded-lg p-2"
                />
              </div>
              <div>
                <label className="text-sm text-dark-400 block mb-1">ถึงวันที่</label>
                <input
                  type="date"
                  value={formData.dateRangeEnd}
                  onChange={(e) => updateField('dateRangeEnd', e.target.value)}
                  className="w-full bg-dark-700 border border-dark-600 rounded-lg p-2"
                />
              </div>
            </div>
          </Card>

          {/* Requested Info */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4">ข้อมูลที่ต้องการ</h3>
            <div className="space-y-2">
              {REQUESTED_INFO_OPTIONS.map(option => (
                <label key={option.id} className="flex items-center gap-3 p-2 hover:bg-dark-800 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.requestedInfo.includes(option.id)}
                    onChange={() => toggleRequestedInfo(option.id)}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm">{option.label}</span>
                </label>
              ))}
            </div>
          </Card>

          {/* Urgency */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4">ระดับความเร่งด่วน</h3>
            <div className="flex gap-2">
              {[
                { value: 'normal', label: 'ปกติ', color: 'bg-green-500' },
                { value: 'urgent', label: 'เร่งด่วน', color: 'bg-amber-500' },
                { value: 'emergency', label: 'ฉุกเฉิน', color: 'bg-red-500' },
              ].map(level => (
                <button
                  key={level.value}
                  onClick={() => updateField('urgencyLevel', level.value as any)}
                  className={`flex-1 p-3 rounded-lg border transition-all ${
                    formData.urgencyLevel === level.value
                      ? `border-white ${level.color}/20`
                      : 'border-dark-600 bg-dark-800'
                  }`}
                >
                  <div className={`w-3 h-3 rounded-full ${level.color} mx-auto mb-1`} />
                  <div className="text-sm">{level.label}</div>
                </button>
              ))}
            </div>
          </Card>

          {/* Additional Notes */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4">หมายเหตุเพิ่มเติม</h3>
            <textarea
              value={formData.additionalNotes}
              onChange={(e) => updateField('additionalNotes', e.target.value)}
              rows={3}
              className="w-full bg-dark-700 border border-dark-600 rounded-lg p-2 resize-none"
              placeholder="รายละเอียดเพิ่มเติม..."
            />
          </Card>
        </div>

        {/* Preview */}
        <div className="sticky top-6">
          <Card className="p-4 h-[calc(100vh-160px)] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">ตัวอย่างเอกสาร</h3>
              <Button variant="ghost" size="sm" onClick={copyToClipboard}>
                {copied ? <CheckCircle size={16} className="text-green-400" /> : <Copy size={16} />}
                <span className="ml-2">{copied ? 'คัดลอกแล้ว!' : 'คัดลอก'}</span>
              </Button>
            </div>
            <div className="flex-1 overflow-auto bg-dark-800 rounded-lg p-4">
              <pre className="text-xs whitespace-pre-wrap font-mono text-dark-200">
                {generateDocument()}
              </pre>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default KYCRequestGenerator;
