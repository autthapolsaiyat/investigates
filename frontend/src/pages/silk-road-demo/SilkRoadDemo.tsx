/**
 * SilkRoadDemo V4 - Complete Investigation Demo with Enhanced Evidence Manager
 * Features: Export PDF, Save to Case, Evidence Management with Wallets & Suspects
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  ArrowRight,
  FileText,
  Building2,
  User,
  AlertTriangle,
  CheckCircle,
  Clock,
  Wallet,
  Scale,
  Shield,
  ExternalLink,
  Copy,
  ChevronDown,
  ChevronUp,
  Download,
  Save,
  X,
  FileDown,
  FolderPlus,
  LinkIcon
} from 'lucide-react';
import { Button } from '../../components/ui';
import { EvidenceManager } from '../../components/evidence';

// Investigation Timeline Steps
const INVESTIGATION_STEPS = [
  {
    id: 1,
    title: 'Suspicious Transaction Detected',
    date: '2012-2013',
    status: 'completed',
    icon: Search,
    description: 'IRS Criminal Investigation used Chainalysis to analyze Bitcoin transactions, found 54 suspicious transactions from Silk Road',
    details: [
      'Silk Road operated 2011-2013',
      'Total sales 9,519,664 BTC',
      'Commission ~614,000 BTC',
      'Used Tor Network to hide identity'
    ]
  },
  {
    id: 2,
    title: 'Bitcoin Trail Tracking',
    date: 'April 2013',
    status: 'completed',
    icon: ArrowRight,
    description: 'Tracked money 69,370 BTC flowing from Silk Road → 2 intermediate wallets → wallet 1HQ3...',
    wallets: [
      { address: 'Silk Road Main Wallet', type: 'source', amount: '69,370 BTC' },
      { address: 'Intermediate Wallet 1', type: 'intermediate', amount: '69,370 BTC' },
      { address: '1HQ3Go3ggs8pFnXuHVHRytPCq5fGG8Hbhx', type: 'destination', amount: '69,370 BTC' }
    ]
  },
  {
    id: 3,
    title: 'Identify Individual X',
    date: '2020',
    status: 'completed',
    icon: User,
    description: 'Individual X tried to withdraw through exchange, leading to identification',
    details: [
      'Individual X hacked Silk Road in 2012',
      'Held BTC dormant for years',
      'Tried to withdraw via Exchange → Got caught',
      'Later identified as James Zhong'
    ],
    suspect: {
      name: 'James Zhong',
      location: 'Gainesville, Georgia, USA',
      crime: 'Wire Fraud - Stole Bitcoin from Silk Road',
      seized: '50,676 BTC (~$3.36 Billion)'
    }
  },
  {
    id: 4,
    title: 'Asset Seizure Order',
    date: 'November 3, 2020',
    status: 'completed',
    icon: Scale,
    description: 'DOJ filed for seizure of 69,370 BTC - Largest crypto seizure in DOJ history',
    details: [
      'Individual X signed consent to forfeit',
      'Value at seizure: $1 Billion+',
      'Seized all BTC, BCH, BSV, BTG',
      'Transferred to FBI wallet'
    ]
  },
  {
    id: 5,
    title: 'Prosecute James Zhong',
    date: 'November 2022',
    status: 'completed',
    icon: Shield,
    description: 'James Zhong pleaded guilty to Wire Fraud',
    suspect: {
      name: 'James Zhong',
      verdict: 'Pleaded guilty Wire Fraud',
      sentence: 'Imprisonment 1 year 1 day',
      seizure: 'Seized 50,676 BTC + $660,000 cash + gold'
    },
    evidence: [
      'BTC hidden in floor safe',
      'BTC hidden in popcorn tin',
      '25 Casascius Coins (Physical Bitcoin)',
      'Multiple computer equipment'
    ]
  },
  {
    id: 6,
    title: 'Auction Approved',
    date: 'December 30, 2024',
    status: 'completed',
    icon: Building2,
    description: 'Court approved DOJ to sell 69,370 BTC valued at $6.5 Billion',
    details: [
      'Current value: ~$6.5 Billion',
      'US Marshals Service oversees sale',
      'May impact BTC price short-term',
      'Trump may halt if inaugurated first'
    ]
  }
];

// KYC Information
const KYC_INFO = {
  individual_x: {
    realName: 'James Zhong',
    dob: '1990 (approximately)',
    nationality: 'American',
    address: 'Gainesville, Georgia, USA',
    idType: 'SSN / US Passport',
    exchangeUsed: 'Centralized Exchange (undisclosed)',
    kycDate: '2020',
    source: 'IRS Criminal Investigation + Chainalysis'
  },
  ross_ulbricht: {
    realName: 'Ross William Ulbricht',
    alias: 'Dread Pirate Roberts (DPR)',
    dob: 'March 27, 1984',
    nationality: 'American',
    address: 'San Francisco, California',
    arrestDate: 'October 1, 2013',
    arrestLocation: 'Glen Park Library, San Francisco',
    sentence: 'Life imprisonment (Life imprisonment)',
    source: 'FBI Investigation'
  }
};

// Wallet addresses for EvidenceManager
const CASE_WALLETS = [
  { address: '1HQ3Go3ggs8pFnXuHVHRytPCq5fGG8Hbhx', type: 'Bitcoin (BTC)', balance: '69,370 BTC', label: 'Individual X (Hacked)' },
  { address: 'bc1qa5wkgaew2dkv56kfvj49j0av5nml45x9ek9hz6', type: 'Bitcoin (BTC)', balance: '69,370 BTC', label: 'FBI Seizure Wallet' }
];

// Suspects for EvidenceManager
const CASE_SUSPECTS = [
  { name: 'James Zhong', idNumber: 'US Passport', role: 'Hacker - Stole Bitcoin from Silk Road', nationality: 'American' },
  { name: 'Ross William Ulbricht', idNumber: 'US Passport', role: 'Founder - Silk Road (Dread Pirate Roberts)', nationality: 'American' }
];

// Available cases for linking
const AVAILABLE_CASES = [
  { id: 'CASE-SILKROAD-2024', name: 'Silk Road Case - US Government Seizure', description: 'Seized Bitcoin valued at $6.5 Billion' },
  { id: 'CASE-20260110-6A7EF6', name: 'Crypto Test Case', description: 'System test case' },
  { id: 'CASE-20260109-ABC123', name: 'Money Laundering Case', description: 'Money Laundering Case via Crypto' }
];

export const SilkRoadDemo = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState<number>(1);
  const [showKYC, setShowKYC] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showEvidencePanel, setShowEvidencePanel] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [caseName, setCaseName] = useState('Silk Road Case - US Government Seizure');
  const [caseNotes, setCaseNotes] = useState('');
  const [savedCaseId, setSavedCaseId] = useState<number | null>(null);

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const currentStep = INVESTIGATION_STEPS.find(s => s.id === activeStep);

  const handleExportPDF = async () => {
    setIsExporting(true);
    
    // Generate PDF Report HTML
    const reportHTML = `
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <title>Investigation Report - Silk Road Case</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap');
    * { font-family: 'Sarabun', sans-serif; margin: 0; padding: 0; box-sizing: border-box; }
    body { padding: 40px; background: white; color: #1a1a1a; line-height: 1.6; }
    .header { text-align: center; border-bottom: 3px solid #1a1a1a; padding-bottom: 20px; margin-bottom: 30px; }
    .header h1 { font-size: 24px; margin-bottom: 5px; }
    .header p { color: #666; }
    .section { margin-bottom: 30px; }
    .section h2 { font-size: 18px; color: #1a1a1a; border-bottom: 2px solid #3b82f6; padding-bottom: 8px; margin-bottom: 15px; }
    .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }
    .stat-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; text-align: center; }
    .stat-box .value { font-size: 24px; font-weight: bold; color: #3b82f6; }
    .stat-box .label { font-size: 12px; color: #64748b; }
    table { width: 100%; border-collapse: collapse; margin-top: 15px; }
    th, td { border: 1px solid #e2e8f0; padding: 10px; text-align: left; font-size: 14px; }
    th { background: #f1f5f9; font-weight: 600; }
    .timeline-item { padding: 15px; background: #f8fafc; border-left: 4px solid #22c55e; margin-bottom: 10px; }
    .timeline-item.active { border-left-color: #3b82f6; }
    .timeline-item h4 { font-size: 14px; margin-bottom: 5px; }
    .timeline-item p { font-size: 12px; color: #64748b; }
    .wallet-box { background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin-bottom: 10px; }
    .wallet-box .label { font-size: 12px; color: #92400e; }
    .wallet-box .address { font-family: monospace; font-size: 12px; color: #1a1a1a; word-break: break-all; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #64748b; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>🔍 Investigation Report</h1>
    <p>Case Silk Road - Seized Bitcoin valued at $6.5 Billion</p>
    <p style="font-size: 12px; margin-top: 10px;">Report date: ${new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
  </div>

  <div class="stats">
    <div class="stat-box">
      <div class="value">69,370</div>
      <div class="label">BTC Seized</div>
    </div>
    <div class="stat-box">
      <div class="value">$6.5B</div>
      <div class="label">Current Value</div>
    </div>
    <div class="stat-box">
      <div class="value">2</div>
      <div class="label">Suspects</div>
    </div>
    <div class="stat-box">
      <div class="value">11 years</div>
      <div class="label">Investigation period</div>
    </div>
  </div>

  <div class="section">
    <h2>📋 Investigation Steps</h2>
    ${INVESTIGATION_STEPS.map(step => `
      <div class="timeline-item">
        <h4>${step.id}. ${step.title} (${step.date})</h4>
        <p>${step.description}</p>
      </div>
    `).join('')}
  </div>

  <div class="section">
    <h2>💼 Related Wallets</h2>
    ${CASE_WALLETS.map(wallet => `
      <div class="wallet-box">
        <div class="label">${wallet.label}</div>
        <div class="address">${wallet.address}</div>
        <div style="font-size: 12px; color: #666; margin-top: 5px;">Balance: ${wallet.balance}</div>
      </div>
    `).join('')}
  </div>

  <div class="section">
    <h2>👤 DataSuspects</h2>
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Role</th>
          <th>Nationality</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>James Zhong</strong></td>
          <td>Individual X - Stole Bitcoin from Silk Road</td>
          <td>American</td>
          <td>Arrested (Nov 2022)</td>
        </tr>
        <tr>
          <td><strong>Ross William Ulbricht</strong></td>
          <td>Founder - Silk Road (Dread Pirate Roberts)</td>
          <td>American</td>
          <td>Life imprisonment</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="section">
    <h2>📊 Investigation Trail Summary</h2>
    <div style="text-align: center; padding: 20px; background: #f0fdf4; border-radius: 8px; border: 1px solid #22c55e;">
      <p style="font-size: 14px;">
        <strong>Wallet Address</strong> → <strong>Tracked money</strong> → <strong>Found Exchange</strong> → <strong>Court order</strong> → <strong>Got KYC data</strong> → <strong>Arrest!</strong>
      </p>
      <p style="margin-top: 10px; color: #16a34a; font-weight: bold;">
        ✅ Investigation successful - Assets Seized $6.5 Billion
      </p>
    </div>
  </div>

  <div class="footer">
    <p>This report was generated by InvestiGate - Digital Forensics Investigation Platform</p>
    <p>This document is confidential. Do not distribute without permission</p>
  </div>
</body>
</html>`;

    // Create blob and download
    const blob = new Blob([reportHTML], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    // Open in new window for print
    const printWindow = window.open(url, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
        }, 500);
      };
    }

    // Also download as HTML file
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = `SilkRoad-Report-${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    
    setIsExporting(false);
    setExportSuccess(true);
    setTimeout(() => {
      setExportSuccess(false);
      setShowExportModal(false);
    }, 2000);
  };

  const handleSaveToCase = async () => {
    setIsSaving(true);
    try {
      // Import API
      const { casesAPI, moneyFlowAPI } = await import('../../services/api');
      
      // Create new case
      const newCase = await casesAPI.create({
        title: caseName || 'Silk Road Case - US Government Seizure',
        description: `Seized Bitcoin valued at $6.5 Billion from Silk Road\n\n${caseNotes || 'Saved from Silk Road Demo'}`,
        case_type: 'cryptocurrency',
        priority: 'high',
        total_amount: 6500000000, // $6.5B
        currency: 'USD',
        victims_count: 0,
        suspects_count: 2,
        tags: 'silk-road,bitcoin,cryptocurrency,us-government,seizure',
      });

      // Add nodes to the case
      const nodePromises = [
        // Individual X Wallet
        moneyFlowAPI.createNode(newCase.id, {
          label: 'Individual X (James Zhong)',
          node_type: 'crypto_wallet',
          identifier: '1HQ3Go3ggs8pFnXuHVHRytPCq5fGG8Hbhx',
          is_suspect: true,
          is_victim: false,
          risk_score: 95,
          notes: 'Hacker - Stole 50,676 BTC from Silk Road in 2012',
        }),
        // FBI Seizure Wallet
        moneyFlowAPI.createNode(newCase.id, {
          label: 'FBI Seizure Wallet',
          node_type: 'crypto_wallet',
          identifier: 'bc1qa5wkgaew2dkv56kfvj49j0av5nml45x9ek9hz6',
          is_suspect: false,
          is_victim: false,
          risk_score: 0,
          notes: 'FBI Asset Seizure wallet - 69,370 BTC',
        }),
        // Ross Ulbricht
        moneyFlowAPI.createNode(newCase.id, {
          label: 'Ross Ulbricht (Dread Pirate Roberts)',
          node_type: 'person',
          identifier: 'US Passport',
          is_suspect: true,
          is_victim: false,
          risk_score: 100,
          notes: 'Silk Road founder - Arrested Oct 1, 2013 - Life imprisonment',
        }),
        // Silk Road Platform
        moneyFlowAPI.createNode(newCase.id, {
          label: 'Silk Road Marketplace',
          node_type: 'exchange',
          identifier: 'Dark Web Marketplace',
          is_suspect: true,
          is_victim: false,
          risk_score: 100,
          notes: 'Dark market on Tor Network - Operated 2011-2013 - Sales 9.5M BTC',
        }),
      ];

      await Promise.all(nodePromises);

      setSavedCaseId(newCase.id);
      setIsSaving(false);
      setSaveSuccess(true);
      
      setTimeout(() => {
        setSaveSuccess(false);
        setShowSaveModal(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to save case:', error);
      setIsSaving(false);
      alert('Error saving. Please try again');
    }
  };

  const handleLinkToMoneyFlow = () => {
    // Navigate to Money Flow with wallet addresses as state
    navigate('/money-flow', {
      state: {
        wallets: CASE_WALLETS.map(w => w.address),
        caseTitle: 'Silk Road Investigation',
      }
    });
  };

  return (
    <div className="min-h-screen bg-dark-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header with Actions */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                <AlertTriangle className="text-red-400" size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Case Silk Road</h1>
                <p className="text-dark-400">Seized Bitcoin valued at $6.5 Billion - Largest in history</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={() => setShowExportModal(true)} className="flex items-center gap-2">
                <FileDown size={16} />Export PDF
              </Button>
              <Button variant="ghost" onClick={() => setShowSaveModal(true)} className="flex items-center gap-2">
                <FolderPlus size={16} />Save to Case
              </Button>
              <Button variant="primary" onClick={handleLinkToMoneyFlow} className="flex items-center gap-2">
                <LinkIcon size={16} />Open in Money Flow
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-4 gap-4 mt-6">
            <div className="bg-dark-800 rounded-xl p-4 border border-dark-700">
              <div className="text-2xl font-bold text-amber-400">69,370</div>
              <div className="text-sm text-dark-400">BTC Seized</div>
            </div>
            <div className="bg-dark-800 rounded-xl p-4 border border-dark-700">
              <div className="text-2xl font-bold text-green-400">$6.5B</div>
              <div className="text-sm text-dark-400">Current Value</div>
            </div>
            <div className="bg-dark-800 rounded-xl p-4 border border-dark-700">
              <div className="text-2xl font-bold text-red-400">2</div>
              <div className="text-sm text-dark-400">Suspects</div>
            </div>
            <div className="bg-dark-800 rounded-xl p-4 border border-dark-700">
              <div className="text-2xl font-bold text-primary-400">11 years</div>
              <div className="text-sm text-dark-400">Investigation period</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Left Column - Timeline & Wallets */}
          <div className="col-span-1 space-y-4">
            <div className="bg-dark-800 rounded-xl border border-dark-700 p-4">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Clock size={18} className="text-primary-400" />Investigation Steps
              </h2>
              <div className="space-y-2">
                {INVESTIGATION_STEPS.map((step) => (
                  <button
                    key={step.id}
                    onClick={() => setActiveStep(step.id)}
                    className={`w-full text-left p-3 rounded-lg transition-all ${
                      activeStep === step.id 
                        ? 'bg-primary-500/20 border border-primary-500/50' 
                        : 'bg-dark-900 hover:bg-dark-700 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        step.status === 'completed' ? 'bg-green-500/20' : 'bg-dark-700'
                      }`}>
                        {step.status === 'completed' ? (
                          <CheckCircle size={16} className="text-green-400" />
                        ) : (
                          <span className="text-xs text-dark-400">{step.id}</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-white">{step.title}</div>
                        <div className="text-xs text-dark-400">{step.date}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-dark-800 rounded-xl border border-dark-700 p-4">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Wallet size={18} className="text-amber-400" />Related Wallets
              </h2>
              <div className="space-y-3">
                {CASE_WALLETS.map((wallet, i) => (
                  <div key={i} className="p-3 bg-dark-900 rounded-lg">
                    <div className="text-xs text-dark-400 mb-1">{wallet.label}</div>
                    <div className="flex items-center gap-2">
                      <code className="text-xs text-amber-400 truncate flex-1">{wallet.address}</code>
                      <button onClick={() => copyAddress(wallet.address)} className="p-1 hover:bg-dark-700 rounded">
                        {copiedAddress === wallet.address ? (
                          <CheckCircle size={14} className="text-green-400" />
                        ) : (
                          <Copy size={14} className="text-dark-400" />
                        )}
                      </button>
                      <a 
                        href={`https://www.blockchain.com/btc/address/${wallet.address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 hover:bg-dark-700 rounded"
                      >
                        <ExternalLink size={14} className="text-dark-400" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="col-span-2">
            {currentStep && (
              <div className="bg-dark-800 rounded-xl border border-dark-700 p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 bg-primary-500/20 rounded-xl flex items-center justify-center">
                    <currentStep.icon size={28} className="text-primary-400" />
                  </div>
                  <div>
                    <div className="text-xs text-primary-400 mb-1">Step {currentStep.id}</div>
                    <h3 className="text-xl font-bold text-white">{currentStep.title}</h3>
                    <div className="text-sm text-dark-400">{currentStep.date}</div>
                  </div>
                </div>

                <p className="text-dark-300 mb-6">{currentStep.description}</p>

                {currentStep.details && (
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-white mb-3">Details:</h4>
                    <ul className="space-y-2">
                      {currentStep.details.map((detail, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-dark-300">
                          <CheckCircle size={14} className="text-green-400 mt-0.5 flex-shrink-0" />{detail}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {currentStep.wallets && (
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-white mb-3">Money Trail:</h4>
                    <div className="flex items-center gap-2 overflow-x-auto pb-2">
                      {currentStep.wallets.map((wallet, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className={`p-3 rounded-lg min-w-[150px] ${
                            wallet.type === 'source' ? 'bg-red-500/20 border border-red-500/30' :
                            wallet.type === 'destination' ? 'bg-green-500/20 border border-green-500/30' :
                            'bg-dark-700 border border-dark-600'
                          }`}>
                            <div className="text-xs text-dark-400 mb-1">
                              {wallet.type === 'source' ? 'Source' : wallet.type === 'destination' ? 'Destination' : 'Middle'}
                            </div>
                            <div className="text-sm text-white font-mono truncate">{wallet.address}</div>
                            <div className="text-xs text-amber-400 mt-1">{wallet.amount}</div>
                          </div>
                          {i < currentStep.wallets!.length - 1 && <ArrowRight size={20} className="text-dark-500 flex-shrink-0" />}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {currentStep.suspect && (
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                      <AlertTriangle size={14} className="text-red-400" />DataSuspects:
                    </h4>
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div><div className="text-xs text-dark-400">Name</div><div className="text-white font-semibold">{currentStep.suspect.name}</div></div>
                        {currentStep.suspect.location && <div><div className="text-xs text-dark-400">Address</div><div className="text-white">{currentStep.suspect.location}</div></div>}
                        {currentStep.suspect.crime && <div><div className="text-xs text-dark-400">Charge</div><div className="text-white">{currentStep.suspect.crime}</div></div>}
                        {currentStep.suspect.seized && <div><div className="text-xs text-dark-400">Assets Seized</div><div className="text-amber-400 font-semibold">{currentStep.suspect.seized}</div></div>}
                        {currentStep.suspect.verdict && <div><div className="text-xs text-dark-400">Verdict</div><div className="text-white">{currentStep.suspect.verdict}</div></div>}
                        {currentStep.suspect.sentence && <div><div className="text-xs text-dark-400">Sentence</div><div className="text-white">{currentStep.suspect.sentence}</div></div>}
                      </div>
                    </div>
                  </div>
                )}

                {currentStep.evidence && (
                  <div>
                    <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                      <FileText size={14} className="text-primary-400" />Evidence Found:
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {currentStep.evidence.map((item, i) => (
                        <div key={i} className="flex items-center gap-2 p-2 bg-dark-900 rounded-lg text-sm text-dark-300">
                          <CheckCircle size={14} className="text-green-400" />{item}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-between mt-8 pt-6 border-t border-dark-700">
                  <Button variant="ghost" disabled={activeStep === 1} onClick={() => setActiveStep(prev => prev - 1)}>← Previous Step</Button>
                  <Button disabled={activeStep === INVESTIGATION_STEPS.length} onClick={() => setActiveStep(prev => prev + 1)}>Next Step →</Button>
                </div>
              </div>
            )}

            {/* KYC Panel */}
            <div className="bg-dark-800 rounded-xl border border-dark-700 p-4 mt-4">
              <button onClick={() => setShowKYC(!showKYC)} className="w-full flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <User size={18} className="text-green-400" />KYC Data from Exchange
                </h2>
                {showKYC ? <ChevronUp size={18} className="text-dark-400" /> : <ChevronDown size={18} className="text-dark-400" />}
              </button>

              {showKYC && (
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle size={16} className="text-red-400" />
                      <span className="font-semibold text-white">Individual X (Hacker)</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div><span className="text-dark-400">Real Name:</span> <span className="text-white">{KYC_INFO.individual_x.realName}</span></div>
                      <div><span className="text-dark-400">Nationality:</span> <span className="text-white">{KYC_INFO.individual_x.nationality}</span></div>
                      <div><span className="text-dark-400">Address:</span> <span className="text-white">{KYC_INFO.individual_x.address}</span></div>
                      <div><span className="text-dark-400">Exchange Used:</span> <span className="text-white">{KYC_INFO.individual_x.exchangeUsed}</span></div>
                      <div><span className="text-dark-400">Data Source:</span> <span className="text-primary-400">{KYC_INFO.individual_x.source}</span></div>
                    </div>
                  </div>

                  <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <User size={16} className="text-purple-400" />
                      <span className="font-semibold text-white">Silk Road Founder</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div><span className="text-dark-400">Real Name:</span> <span className="text-white">{KYC_INFO.ross_ulbricht.realName}</span></div>
                      <div><span className="text-dark-400">Alias:</span> <span className="text-amber-400">{KYC_INFO.ross_ulbricht.alias}</span></div>
                      <div><span className="text-dark-400">DOB:</span> <span className="text-white">{KYC_INFO.ross_ulbricht.dob}</span></div>
                      <div><span className="text-dark-400">Arrested:</span> <span className="text-white">{KYC_INFO.ross_ulbricht.arrestDate}</span></div>
                      <div><span className="text-dark-400">Location:</span> <span className="text-white">{KYC_INFO.ross_ulbricht.arrestLocation}</span></div>
                      <div><span className="text-dark-400">Sentence:</span> <span className="text-red-400">{KYC_INFO.ross_ulbricht.sentence}</span></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Evidence Manager Section - Enhanced with Wallets & Suspects */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Shield size={24} className="text-green-400" />Evidence Management System (Court-Ready)
            </h2>
            <Button variant="ghost" onClick={() => setShowEvidencePanel(!showEvidencePanel)}>
              {showEvidencePanel ? 'Hide' : 'Show'}
            </Button>
          </div>
          
          {showEvidencePanel && (
            <EvidenceManager 
              caseId="CASE-SILKROAD-2024"
              caseName="Silk Road Case - US Government Seizure"
              wallets={CASE_WALLETS}
              suspects={CASE_SUSPECTS}
              cases={AVAILABLE_CASES}
            />
          )}
        </div>

        {/* Investigation Flow Diagram */}
        <div className="mt-6 bg-dark-800 rounded-xl border border-dark-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">📊 Investigation Trail Summary</h2>
          
          <div className="flex items-center justify-center gap-4 overflow-x-auto py-4">
            {[
              { icon: Wallet, label: 'Wallet Address', sub: '1HQ3...Hbhx', color: 'amber' },
              { icon: Search, label: 'Tracked money', sub: 'Chainalysis', color: 'blue' },
              { icon: Building2, label: 'Found Exchange', sub: 'Centralized Ex.', color: 'purple' },
              { icon: Scale, label: 'Court order', sub: 'Request KYC Data', color: 'red' },
              { icon: FileText, label: 'Got KYC data', sub: 'Name, Address, ID', color: 'green' },
              { icon: Shield, label: 'Arrest!', sub: 'James Zhong', color: 'red' }
            ].map((item, i, arr) => (
              <div key={i} className="flex items-center gap-4">
                <div className="text-center min-w-[120px]">
                  <div className={`w-16 h-16 bg-${item.color}-500/20 rounded-full flex items-center justify-center mx-auto mb-2`}>
                    <item.icon size={24} className={`text-${item.color}-400`} />
                  </div>
                  <div className="text-xs text-white font-medium">{item.label}</div>
                  <div className="text-xs text-dark-400">{item.sub}</div>
                </div>
                {i < arr.length - 1 && <ArrowRight size={24} className="text-dark-500" />}
              </div>
            ))}
          </div>

          <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-center">
            <div className="text-green-400 font-semibold">✅ Investigation successful - Assets Seized $6.5 Billion</div>
            <div className="text-sm text-dark-300 mt-1">from Wallet Address → Real Identity → Assets Seized → Case Prosecution</div>
          </div>
        </div>
      </div>

      {/* Export PDF Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-dark-800 rounded-xl border border-dark-700 p-6 w-[500px]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2"><FileDown size={20} className="text-primary-400" />Export Report PDF</h3>
              <button onClick={() => setShowExportModal(false)} className="p-1 hover:bg-dark-700 rounded"><X size={18} className="text-dark-400" /></button>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-dark-900 rounded-lg">
                <h4 className="text-sm font-medium text-white mb-2">Content to Include:</h4>
                <div className="space-y-2">
                  {['Case Summary (Stats)', 'Investigation Timeline', 'Wallet Addresses', 'KYC Data', 'Money Flow', 'Digital Evidence (with Hash)'].map((item, i) => (
                    <label key={i} className="flex items-center gap-2 text-sm text-dark-300"><input type="checkbox" defaultChecked className="rounded" />{item}</label>
                  ))}
                </div>
              </div>
              <div className="p-4 bg-dark-900 rounded-lg">
                <h4 className="text-sm font-medium text-white mb-2">Format:</h4>
                <select className="w-full bg-dark-800 border border-dark-600 rounded-lg p-2 text-white text-sm">
                  <option>Court Report</option>
                  <option>ReportSummary (Executive Summary)</option>
                  <option>Full Report</option>
                </select>
              </div>
              {exportSuccess ? (
                <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-center">
                  <CheckCircle size={32} className="text-green-400 mx-auto mb-2" />
                  <div className="text-green-400 font-semibold">Export Success!</div>
                  <div className="text-sm text-dark-300">File downloading...</div>
                </div>
              ) : (
                <Button variant="primary" className="w-full" onClick={handleExportPDF} disabled={isExporting}>
                  {isExporting ? <><span className="animate-spin mr-2">⏳</span>LoadingCreate PDF...</> : <><Download size={16} className="mr-2" />Download PDF</>}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Save to Case Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-dark-800 rounded-xl border border-dark-700 p-6 w-[500px]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2"><FolderPlus size={20} className="text-primary-400" />Save to Case</h3>
              <button onClick={() => setShowSaveModal(false)} className="p-1 hover:bg-dark-700 rounded"><X size={18} className="text-dark-400" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-dark-400 mb-1 block">NameCase:</label>
                <input 
                  type="text" 
                  value={caseName}
                  onChange={(e) => setCaseName(e.target.value)}
                  className="w-full bg-dark-900 border border-dark-600 rounded-lg p-3 text-white" 
                />
              </div>
              <div>
                <label className="text-sm text-dark-400 mb-1 block">Notes:</label>
                <textarea 
                  rows={3} 
                  value={caseNotes}
                  onChange={(e) => setCaseNotes(e.target.value)}
                  placeholder="Additional details..." 
                  className="w-full bg-dark-900 border border-dark-600 rounded-lg p-3 text-white resize-none" 
                />
              </div>
              {saveSuccess ? (
                <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-center">
                  <CheckCircle size={32} className="text-green-400 mx-auto mb-2" />
                  <div className="text-green-400 font-semibold">SaveSuccess!</div>
                  <div className="text-sm text-dark-300 mb-3">Data saved to case</div>
                  {savedCaseId && (
                    <Button 
                      variant="ghost" 
                      className="text-primary-400"
                      onClick={() => navigate(`/cases/${savedCaseId}`)}
                    >
                      <ExternalLink size={16} className="mr-2" />
                      เCloseViewCase
                    </Button>
                  )}
                </div>
              ) : (
                <Button variant="primary" className="w-full" onClick={handleSaveToCase} disabled={isSaving}>
                  {isSaving ? <><span className="animate-spin mr-2">⏳</span>Saving...</> : <><Save size={16} className="mr-2" />Save to Case</>}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SilkRoadDemo;
