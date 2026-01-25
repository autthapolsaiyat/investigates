/**
 * KYC Request Generator
 * Generate KYC Request Document for Cryptocurrency Exchange
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
    responseTime: '7-14 days'
  },
  { 
    id: 'bitkub', 
    name: 'Bitkub', 
    email: 'compliance@bitkub.com',
    country: 'Thailand',
    logo: '🟢',
    responseTime: '3-7 days'
  },
  { 
    id: 'coinbase', 
    name: 'Coinbase', 
    email: 'law-enforcement@coinbase.com',
    country: 'USA',
    logo: '🔵',
    responseTime: '14-21 days'
  },
  { 
    id: 'kraken', 
    name: 'Kraken', 
    email: 'compliance@kraken.com',
    country: 'USA',
    logo: '🟣',
    responseTime: '7-14 days'
  },
  { 
    id: 'okx', 
    name: 'OKX', 
    email: 'lawenforcement@okx.com',
    country: 'Seychelles',
    logo: '⚪',
    responseTime: '7-14 days'
  },
  { 
    id: 'other', 
    name: 'Other (Custom)', 
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
  investigatorRank: 'Pol. Lt. Col.',
  investigatorUnit: 'Cyber Crime Investigation Bureau',
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
  { id: 'account_info', label: 'User Account Information (User Account Information)' },
  { id: 'kyc_docs', label: 'KYC Documents (ID Card, Passport, Address)' },
  { id: 'transaction_history', label: 'Transaction History (Transaction History)' },
  { id: 'deposit_withdrawal', label: 'Deposit-Withdrawal History (Deposit/Withdrawal History)' },
  { id: 'ip_logs', label: 'IP Address and Login History Records' },
  { id: 'linked_accounts', label: 'Linked Accounts (Linked Accounts)' },
  { id: 'bank_info', label: 'Linked Bank Account Information' },
  { id: 'api_keys', label: 'Created API Keys Information' },
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
      normal: 'Normal',
      urgent: 'Urgent',
      emergency: 'Emergency'
    }[formData.urgencyLevel];

    return `
═══════════════════════════════════════════════════════════════════════
                    Request for Information Cooperation Letter
                 REQUEST FOR USER INFORMATION DISCLOSURE
═══════════════════════════════════════════════════════════════════════

                                                Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                                Ref No: ${formData.caseNumber || '[To be filled]'}

To   ${exchange?.name} Compliance Team
        ${exchange?.email}

Subject: Request for User Information for Criminal Investigation
        Request for User Information for Criminal Investigation

Reference: Case No: ${formData.caseNumber || '[To be filled]'}
        Case Name: ${formData.caseTitle || '[To be filled]'}

───────────────────────────────────────────────────────────────────────

I, ${formData.investigatorRank} ${formData.investigator}
Position: Investigator ${formData.investigatorUnit}
have been assigned to investigate the criminal case referenced above.

The investigation found that cryptocurrency exchange services of ${exchange?.name}
were used in criminal activities. We request cooperation in providing the following information.

───────────────────────────────────────────────────────────────────────
                        WALLET ADDRESSES
───────────────────────────────────────────────────────────────────────

${walletList || '[Wallet Address to be filled]'}

───────────────────────────────────────────────────────────────────────
                        Required Data Period
───────────────────────────────────────────────────────────────────────

From Date: ${formData.dateRangeStart || '[To be filled]'}
To Date: ${formData.dateRangeEnd || '[To be filled]'}

───────────────────────────────────────────────────────────────────────
                        Required Information
───────────────────────────────────────────────────────────────────────

${requestedInfoText || '[To be selected]'}

───────────────────────────────────────────────────────────────────────
                        Urgency Level: ${urgencyText}
───────────────────────────────────────────────────────────────────────

${formData.additionalNotes ? `Additional Notes:\n${formData.additionalNotes}\n\n` : ''}
Therefore, we request your cooperation and thank you in advance

                                                Sincerely yours

                                        ____________________________
                                        (${formData.investigatorRank} ${formData.investigator || '[Name-Surname]'})
                                        Investigator
                                        ${formData.investigatorUnit}

───────────────────────────────────────────────────────────────────────
                            DataContact
───────────────────────────────────────────────────────────────────────

Phone: ${formData.investigatorPhone || '[To be filled]'}
Email: ${formData.investigatorEmail || '[To be filled]'}

═══════════════════════════════════════════════════════════════════════
         This document is confidential. Do not distribute without permission
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
            <title>KYC Data Request Letter - ${formData.caseNumber}</title>
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
          <p className="text-dark-400 mt-1">Generate KYC Request Document for Cryptocurrency Exchange</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => setShowPreview(!showPreview)}>
            {showPreview ? 'Edit' : 'ViewExample'}
          </Button>
          <Button variant="secondary" onClick={printDocument}>
            <Printer size={18} className="mr-2" />
            Print
          </Button>
          <Button variant="primary" onClick={downloadDocument}>
            <Download size={18} className="mr-2" />
            Download
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
              DataCase
            </h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-dark-400 block mb-1">Case Number</label>
                  <input
                    type="text"
                    value={formData.caseNumber}
                    onChange={(e) => updateField('caseNumber', e.target.value)}
                    className="w-full bg-dark-700 border border-dark-600 rounded-lg p-2"
                    placeholder="POL.xxx/2024"
                  />
                </div>
                <div>
                  <label className="text-sm text-dark-400 block mb-1">NameCase</label>
                  <input
                    type="text"
                    value={formData.caseTitle}
                    onChange={(e) => updateField('caseTitle', e.target.value)}
                    className="w-full bg-dark-700 border border-dark-600 rounded-lg p-2"
                    placeholder="Crypto Fraud Case"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Investigator Info */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <User size={18} className="text-blue-400" />
              DataInvestigator
            </h3>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-sm text-dark-400 block mb-1">Rank</label>
                  <select
                    value={formData.investigatorRank}
                    onChange={(e) => updateField('investigatorRank', e.target.value)}
                    className="w-full bg-dark-700 border border-dark-600 rounded-lg p-2"
                  >
                    <option>Pol. Capt.</option>
                    <option>Pol. Lt.</option>
                    <option>Pol. Sub-Lt.</option>
                    <option>Pol. Col.</option>
                    <option>Pol. Lt. Col.</option>
                    <option>Pol. Maj.</option>
                    <option>Pol. Sen. Sgt. Maj.</option>
                    <option>Pol. Sgt. Maj.</option>
                    <option>Pol. Sgt.</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-sm text-dark-400 block mb-1">Name-Surname</label>
                  <input
                    type="text"
                    value={formData.investigator}
                    onChange={(e) => updateField('investigator', e.target.value)}
                    className="w-full bg-dark-700 border border-dark-600 rounded-lg p-2"
                    placeholder="Name Surname"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm text-dark-400 block mb-1">Unit</label>
                <input
                  type="text"
                  value={formData.investigatorUnit}
                  onChange={(e) => updateField('investigatorUnit', e.target.value)}
                  className="w-full bg-dark-700 border border-dark-600 rounded-lg p-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-dark-400 block mb-1">Phone</label>
                  <input
                    type="tel"
                    value={formData.investigatorPhone}
                    onChange={(e) => updateField('investigatorPhone', e.target.value)}
                    className="w-full bg-dark-700 border border-dark-600 rounded-lg p-2"
                    placeholder="02-xxx-xxxx"
                  />
                </div>
                <div>
                  <label className="text-sm text-dark-400 block mb-1">Email</label>
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
              Exchange to Request Data From
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
                  <label className="text-sm text-dark-400 block mb-1">Name Exchange</label>
                  <input
                    type="text"
                    value={formData.customExchangeName}
                    onChange={(e) => updateField('customExchangeName', e.target.value)}
                    className="w-full bg-dark-700 border border-dark-600 rounded-lg p-2"
                    placeholder="Exchange Name"
                  />
                </div>
                <div>
                  <label className="text-sm text-dark-400 block mb-1">Email Compliance</label>
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
              Wallet Address to Query
            </h3>
            <div className="space-y-2">
              {formData.walletAddresses.map((wallet, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={wallet}
                    onChange={(e) => updateWallet(index, e.target.value)}
                    className="flex-1 bg-dark-700 border border-dark-600 rounded-lg p-2 font-mono text-sm"
                    placeholder="0x... or 1... or bc1..."
                  />
                  {formData.walletAddresses.length > 1 && (
                    <Button variant="ghost" size="sm" onClick={() => removeWallet(index)}>
                      ✕
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="ghost" size="sm" onClick={addWallet} className="w-full mt-2">
                + Add Wallet
              </Button>
            </div>
          </Card>

          {/* Date Range */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Calendar size={18} className="text-green-400" />
              Required Data Period
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-dark-400 block mb-1">From Date</label>
                <input
                  type="date"
                  value={formData.dateRangeStart}
                  onChange={(e) => updateField('dateRangeStart', e.target.value)}
                  className="w-full bg-dark-700 border border-dark-600 rounded-lg p-2"
                />
              </div>
              <div>
                <label className="text-sm text-dark-400 block mb-1">toDate</label>
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
            <h3 className="font-semibold mb-4">Required Information</h3>
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
            <h3 className="font-semibold mb-4">Urgency Level</h3>
            <div className="flex gap-2">
              {[
                { value: 'normal', label: 'Normal', color: 'bg-green-500' },
                { value: 'urgent', label: 'Urgent', color: 'bg-amber-500' },
                { value: 'emergency', label: 'Emergency', color: 'bg-red-500' },
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
            <h3 className="font-semibold mb-4">Additional Notes</h3>
            <textarea
              value={formData.additionalNotes}
              onChange={(e) => updateField('additionalNotes', e.target.value)}
              rows={3}
              className="w-full bg-dark-700 border border-dark-600 rounded-lg p-2 resize-none"
              placeholder="Additional details..."
            />
          </Card>
        </div>

        {/* Preview */}
        <div className="sticky top-6">
          <Card className="p-4 h-[calc(100vh-160px)] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Document Example</h3>
              <Button variant="ghost" size="sm" onClick={copyToClipboard}>
                {copied ? <CheckCircle size={16} className="text-green-400" /> : <Copy size={16} />}
                <span className="ml-2">{copied ? 'Copied!' : 'Copy'}</span>
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
