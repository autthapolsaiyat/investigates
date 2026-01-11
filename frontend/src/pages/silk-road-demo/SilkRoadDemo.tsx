/**
 * SilkRoadDemo V3 - Complete Investigation Demo with Evidence Manager
 * Features: Export PDF, Save to Case, Evidence Management System
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
    title: 'ตรวจพบธุรกรรมต้องสงสัย',
    date: '2012-2013',
    status: 'completed',
    icon: Search,
    description: 'IRS Criminal Investigation ใช้ Chainalysis วิเคราะห์ธุรกรรม Bitcoin พบ 54 ธุรกรรมผิดปกติจาก Silk Road',
    details: [
      'Silk Road ดำเนินการ 2011-2013',
      'มียอดขายรวม 9,519,664 BTC',
      'ค่าคอมมิชชั่น ~614,000 BTC',
      'ใช้ Tor Network ซ่อนตัว'
    ]
  },
  {
    id: 2,
    title: 'ติดตามเส้นทาง Bitcoin',
    date: 'เมษายน 2013',
    status: 'completed',
    icon: ArrowRight,
    description: 'ติดตามเงิน 69,370 BTC ไหลจาก Silk Road → 2 กระเป๋ากลาง → กระเป๋า 1HQ3...',
    wallets: [
      { address: 'Silk Road Main Wallet', type: 'source', amount: '69,370 BTC' },
      { address: 'Intermediate Wallet 1', type: 'intermediate', amount: '69,370 BTC' },
      { address: '1HQ3Go3ggs8pFnXuHVHRytPCq5fGG8Hbhx', type: 'destination', amount: '69,370 BTC' }
    ]
  },
  {
    id: 3,
    title: 'ระบุตัวตน Individual X',
    date: '2020',
    status: 'completed',
    icon: User,
    description: 'Individual X พยายามถอนเงินผ่าน Exchange ทำให้ถูกระบุตัว',
    details: [
      'Individual X แฮ็ค Silk Road ปี 2012',
      'เก็บ BTC นิ่งๆ หลายปี',
      'พยายามถอนผ่าน Exchange → โดนจับได้',
      'ภายหลังระบุตัวได้ว่าคือ James Zhong'
    ],
    suspect: {
      name: 'James Zhong',
      location: 'Gainesville, Georgia, USA',
      crime: 'Wire Fraud - ขโมย Bitcoin จาก Silk Road',
      seized: '50,676 BTC (~$3.36 Billion)'
    }
  },
  {
    id: 4,
    title: 'ออกหมายยึดทรัพย์',
    date: '3 พฤศจิกายน 2020',
    status: 'completed',
    icon: Scale,
    description: 'DOJ ยื่นคำร้องยึด 69,370 BTC - การยึด Crypto ใหญ่ที่สุดในประวัติศาสตร์ DOJ',
    details: [
      'Individual X ลงนามยินยอมสละสิทธิ์',
      'มูลค่าขณะยึด: $1 Billion+',
      'ยึดทั้ง BTC, BCH, BSV, BTG',
      'โอนเข้ากระเป๋า FBI'
    ]
  },
  {
    id: 5,
    title: 'ดำเนินคดี James Zhong',
    date: 'พฤศจิกายน 2022',
    status: 'completed',
    icon: Shield,
    description: 'James Zhong รับสารภาพความผิดฐาน Wire Fraud',
    suspect: {
      name: 'James Zhong',
      verdict: 'รับสารภาพ Wire Fraud',
      sentence: 'จำคุก 1 ปี 1 วัน',
      seizure: 'ยึด 50,676 BTC + $660,000 เงินสด + ทองคำ'
    },
    evidence: [
      'BTC ซ่อนในตู้เซฟใต้พื้น',
      'BTC ซ่อนในกระป๋องป๊อปคอร์น',
      '25 Casascius Coins (Bitcoin กายภาพ)',
      'อุปกรณ์คอมพิวเตอร์หลายเครื่อง'
    ]
  },
  {
    id: 6,
    title: 'อนุมัติขายทอดตลาด',
    date: '30 ธันวาคม 2024',
    status: 'completed',
    icon: Building2,
    description: 'ศาลอนุมัติให้ DOJ ขาย 69,370 BTC มูลค่า $6.5 Billion',
    details: [
      'มูลค่าปัจจุบัน: ~$6.5 Billion',
      'US Marshals Service ดูแลการขาย',
      'อาจกระทบราคา BTC ระยะสั้น',
      'Trump อาจยับยั้งถ้าเข้ารับตำแหน่งก่อน'
    ]
  }
];

// KYC Information
const KYC_INFO = {
  individual_x: {
    realName: 'James Zhong',
    dob: 'ปี 1990 (โดยประมาณ)',
    nationality: 'American',
    address: 'Gainesville, Georgia, USA',
    idType: 'SSN / US Passport',
    exchangeUsed: 'Centralized Exchange (ไม่เปิดเผย)',
    kycDate: '2020',
    source: 'IRS Criminal Investigation + Chainalysis'
  },
  ross_ulbricht: {
    realName: 'Ross William Ulbricht',
    alias: 'Dread Pirate Roberts (DPR)',
    dob: '27 มีนาคม 1984',
    nationality: 'American',
    address: 'San Francisco, California',
    arrestDate: '1 ตุลาคม 2013',
    arrestLocation: 'Glen Park Library, San Francisco',
    sentence: 'จำคุกตลอดชีวิต (Life imprisonment)',
    source: 'FBI Investigation'
  }
};

// Wallet addresses
const WALLETS = {
  silkroad_hacked: '1HQ3Go3ggs8pFnXuHVHRytPCq5fGG8Hbhx',
  fbi_current: 'bc1qa5wkgaew2dkv56kfvj49j0av5nml45x9ek9hz6',
};

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

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const currentStep = INVESTIGATION_STEPS.find(s => s.id === activeStep);

  // Export to PDF
  const handleExportPDF = async () => {
    setIsExporting(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsExporting(false);
    setExportSuccess(true);
    setTimeout(() => {
      setExportSuccess(false);
      setShowExportModal(false);
    }, 2000);
  };

  // Save to Case
  const handleSaveToCase = async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setShowSaveModal(false);
    }, 2000);
  };

  // Navigate to Money Flow
  const handleLinkToMoneyFlow = () => {
    navigate('/money-flow');
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
                <h1 className="text-2xl font-bold text-white">คดี Silk Road</h1>
                <p className="text-dark-400">การยึด Bitcoin มูลค่า $6.5 Billion - ใหญ่ที่สุดในประวัติศาสตร์</p>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={() => setShowExportModal(true)}
                className="flex items-center gap-2"
              >
                <FileDown size={16} />
                Export PDF
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowSaveModal(true)}
                className="flex items-center gap-2"
              >
                <FolderPlus size={16} />
                Save to Case
              </Button>
              <Button
                variant="primary"
                onClick={handleLinkToMoneyFlow}
                className="flex items-center gap-2"
              >
                <LinkIcon size={16} />
                เปิดใน Money Flow
              </Button>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-4 mt-6">
            <div className="bg-dark-800 rounded-xl p-4 border border-dark-700">
              <div className="text-2xl font-bold text-amber-400">69,370</div>
              <div className="text-sm text-dark-400">BTC ยึดได้</div>
            </div>
            <div className="bg-dark-800 rounded-xl p-4 border border-dark-700">
              <div className="text-2xl font-bold text-green-400">$6.5B</div>
              <div className="text-sm text-dark-400">มูลค่าปัจจุบัน</div>
            </div>
            <div className="bg-dark-800 rounded-xl p-4 border border-dark-700">
              <div className="text-2xl font-bold text-red-400">2</div>
              <div className="text-sm text-dark-400">ผู้ต้องหา</div>
            </div>
            <div className="bg-dark-800 rounded-xl p-4 border border-dark-700">
              <div className="text-2xl font-bold text-primary-400">11 ปี</div>
              <div className="text-sm text-dark-400">ระยะเวลาสืบสวน</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Left Column - Timeline & Wallets */}
          <div className="col-span-1 space-y-4">
            {/* Timeline */}
            <div className="bg-dark-800 rounded-xl border border-dark-700 p-4">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Clock size={18} className="text-primary-400" />
                ขั้นตอนการสืบสวน
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

            {/* Wallet Addresses */}
            <div className="bg-dark-800 rounded-xl border border-dark-700 p-4">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Wallet size={18} className="text-amber-400" />
                กระเป๋าที่เกี่ยวข้อง
              </h2>
              
              <div className="space-y-3">
                <div className="p-3 bg-dark-900 rounded-lg">
                  <div className="text-xs text-dark-400 mb-1">Individual X (Hacked)</div>
                  <div className="flex items-center gap-2">
                    <code className="text-xs text-amber-400 truncate flex-1">
                      {WALLETS.silkroad_hacked}
                    </code>
                    <button 
                      onClick={() => copyAddress(WALLETS.silkroad_hacked)}
                      className="p-1 hover:bg-dark-700 rounded"
                    >
                      {copiedAddress === WALLETS.silkroad_hacked ? (
                        <CheckCircle size={14} className="text-green-400" />
                      ) : (
                        <Copy size={14} className="text-dark-400" />
                      )}
                    </button>
                    <a 
                      href={`https://www.blockchain.com/btc/address/${WALLETS.silkroad_hacked}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 hover:bg-dark-700 rounded"
                    >
                      <ExternalLink size={14} className="text-dark-400" />
                    </a>
                  </div>
                </div>

                <div className="p-3 bg-dark-900 rounded-lg">
                  <div className="text-xs text-dark-400 mb-1">FBI Current (bc1qa5...)</div>
                  <div className="flex items-center gap-2">
                    <code className="text-xs text-primary-400 truncate flex-1">
                      {WALLETS.fbi_current}
                    </code>
                    <button 
                      onClick={() => copyAddress(WALLETS.fbi_current)}
                      className="p-1 hover:bg-dark-700 rounded"
                    >
                      {copiedAddress === WALLETS.fbi_current ? (
                        <CheckCircle size={14} className="text-green-400" />
                      ) : (
                        <Copy size={14} className="text-dark-400" />
                      )}
                    </button>
                    <a 
                      href={`https://www.blockchain.com/btc/address/${WALLETS.fbi_current}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 hover:bg-dark-700 rounded"
                    >
                      <ExternalLink size={14} className="text-dark-400" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="col-span-2">
            {currentStep && (
              <div className="bg-dark-800 rounded-xl border border-dark-700 p-6">
                {/* Step Header */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 bg-primary-500/20 rounded-xl flex items-center justify-center">
                    <currentStep.icon size={28} className="text-primary-400" />
                  </div>
                  <div>
                    <div className="text-xs text-primary-400 mb-1">ขั้นตอนที่ {currentStep.id}</div>
                    <h3 className="text-xl font-bold text-white">{currentStep.title}</h3>
                    <div className="text-sm text-dark-400">{currentStep.date}</div>
                  </div>
                </div>

                <p className="text-dark-300 mb-6">{currentStep.description}</p>

                {currentStep.details && (
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-white mb-3">รายละเอียด:</h4>
                    <ul className="space-y-2">
                      {currentStep.details.map((detail, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-dark-300">
                          <CheckCircle size={14} className="text-green-400 mt-0.5 flex-shrink-0" />
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {currentStep.wallets && (
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-white mb-3">เส้นทางเงิน:</h4>
                    <div className="flex items-center gap-2 overflow-x-auto pb-2">
                      {currentStep.wallets.map((wallet, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className={`p-3 rounded-lg min-w-[150px] ${
                            wallet.type === 'source' ? 'bg-red-500/20 border border-red-500/30' :
                            wallet.type === 'destination' ? 'bg-green-500/20 border border-green-500/30' :
                            'bg-dark-700 border border-dark-600'
                          }`}>
                            <div className="text-xs text-dark-400 mb-1">
                              {wallet.type === 'source' ? 'ต้นทาง' : 
                               wallet.type === 'destination' ? 'ปลายทาง' : 'กลาง'}
                            </div>
                            <div className="text-sm text-white font-mono truncate">{wallet.address}</div>
                            <div className="text-xs text-amber-400 mt-1">{wallet.amount}</div>
                          </div>
                          {i < currentStep.wallets!.length - 1 && (
                            <ArrowRight size={20} className="text-dark-500 flex-shrink-0" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {currentStep.suspect && (
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                      <AlertTriangle size={14} className="text-red-400" />
                      ข้อมูลผู้ต้องหา:
                    </h4>
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs text-dark-400">ชื่อ</div>
                          <div className="text-white font-semibold">{currentStep.suspect.name}</div>
                        </div>
                        {currentStep.suspect.location && (
                          <div>
                            <div className="text-xs text-dark-400">ที่อยู่</div>
                            <div className="text-white">{currentStep.suspect.location}</div>
                          </div>
                        )}
                        {currentStep.suspect.crime && (
                          <div>
                            <div className="text-xs text-dark-400">ข้อหา</div>
                            <div className="text-white">{currentStep.suspect.crime}</div>
                          </div>
                        )}
                        {currentStep.suspect.seized && (
                          <div>
                            <div className="text-xs text-dark-400">ยึดทรัพย์</div>
                            <div className="text-amber-400 font-semibold">{currentStep.suspect.seized}</div>
                          </div>
                        )}
                        {currentStep.suspect.verdict && (
                          <div>
                            <div className="text-xs text-dark-400">คำตัดสิน</div>
                            <div className="text-white">{currentStep.suspect.verdict}</div>
                          </div>
                        )}
                        {currentStep.suspect.sentence && (
                          <div>
                            <div className="text-xs text-dark-400">โทษ</div>
                            <div className="text-white">{currentStep.suspect.sentence}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {currentStep.evidence && (
                  <div>
                    <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                      <FileText size={14} className="text-primary-400" />
                      หลักฐานที่พบ:
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {currentStep.evidence.map((item, i) => (
                        <div key={i} className="flex items-center gap-2 p-2 bg-dark-900 rounded-lg text-sm text-dark-300">
                          <CheckCircle size={14} className="text-green-400" />
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-between mt-8 pt-6 border-t border-dark-700">
                  <Button
                    variant="ghost"
                    disabled={activeStep === 1}
                    onClick={() => setActiveStep(prev => prev - 1)}
                  >
                    ← ขั้นตอนก่อนหน้า
                  </Button>
                  <Button
                    disabled={activeStep === INVESTIGATION_STEPS.length}
                    onClick={() => setActiveStep(prev => prev + 1)}
                  >
                    ขั้นตอนถัดไป →
                  </Button>
                </div>
              </div>
            )}

            {/* KYC Panel */}
            <div className="bg-dark-800 rounded-xl border border-dark-700 p-4 mt-4">
              <button
                onClick={() => setShowKYC(!showKYC)}
                className="w-full flex items-center justify-between"
              >
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <User size={18} className="text-green-400" />
                  ข้อมูล KYC ที่ได้จาก Exchange
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
                      <div><span className="text-dark-400">ชื่อจริง:</span> <span className="text-white">{KYC_INFO.individual_x.realName}</span></div>
                      <div><span className="text-dark-400">สัญชาติ:</span> <span className="text-white">{KYC_INFO.individual_x.nationality}</span></div>
                      <div><span className="text-dark-400">ที่อยู่:</span> <span className="text-white">{KYC_INFO.individual_x.address}</span></div>
                      <div><span className="text-dark-400">Exchange ที่ใช้:</span> <span className="text-white">{KYC_INFO.individual_x.exchangeUsed}</span></div>
                      <div><span className="text-dark-400">แหล่งข้อมูล:</span> <span className="text-primary-400">{KYC_INFO.individual_x.source}</span></div>
                    </div>
                  </div>

                  <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <User size={16} className="text-purple-400" />
                      <span className="font-semibold text-white">Silk Road Founder</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div><span className="text-dark-400">ชื่อจริง:</span> <span className="text-white">{KYC_INFO.ross_ulbricht.realName}</span></div>
                      <div><span className="text-dark-400">นามแฝง:</span> <span className="text-amber-400">{KYC_INFO.ross_ulbricht.alias}</span></div>
                      <div><span className="text-dark-400">วันเกิด:</span> <span className="text-white">{KYC_INFO.ross_ulbricht.dob}</span></div>
                      <div><span className="text-dark-400">จับกุม:</span> <span className="text-white">{KYC_INFO.ross_ulbricht.arrestDate}</span></div>
                      <div><span className="text-dark-400">สถานที่:</span> <span className="text-white">{KYC_INFO.ross_ulbricht.arrestLocation}</span></div>
                      <div><span className="text-dark-400">โทษ:</span> <span className="text-red-400">{KYC_INFO.ross_ulbricht.sentence}</span></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Evidence Manager Section */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Shield size={24} className="text-green-400" />
              ระบบจัดการหลักฐาน (Court-Ready)
            </h2>
            <Button
              variant="ghost"
              onClick={() => setShowEvidencePanel(!showEvidencePanel)}
            >
              {showEvidencePanel ? 'ซ่อน' : 'แสดง'}
            </Button>
          </div>
          
          {showEvidencePanel && (
            <EvidenceManager 
              caseId="CASE-SILKROAD-2024"
              caseName="คดี Silk Road - US Government Seizure"
            />
          )}
        </div>

        {/* Investigation Flow Diagram */}
        <div className="mt-6 bg-dark-800 rounded-xl border border-dark-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">📊 สรุปเส้นทางการสืบสวน</h2>
          
          <div className="flex items-center justify-center gap-4 overflow-x-auto py-4">
            <div className="text-center min-w-[120px]">
              <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                <Wallet size={24} className="text-amber-400" />
              </div>
              <div className="text-xs text-white font-medium">Wallet Address</div>
              <div className="text-xs text-dark-400">1HQ3...Hbhx</div>
            </div>

            <ArrowRight size={24} className="text-dark-500" />

            <div className="text-center min-w-[120px]">
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                <Search size={24} className="text-blue-400" />
              </div>
              <div className="text-xs text-white font-medium">ติดตามเงิน</div>
              <div className="text-xs text-dark-400">Chainalysis</div>
            </div>

            <ArrowRight size={24} className="text-dark-500" />

            <div className="text-center min-w-[120px]">
              <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                <Building2 size={24} className="text-purple-400" />
              </div>
              <div className="text-xs text-white font-medium">พบ Exchange</div>
              <div className="text-xs text-dark-400">Centralized Ex.</div>
            </div>

            <ArrowRight size={24} className="text-dark-500" />

            <div className="text-center min-w-[120px]">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                <Scale size={24} className="text-red-400" />
              </div>
              <div className="text-xs text-white font-medium">หมายศาล</div>
              <div className="text-xs text-dark-400">ขอข้อมูล KYC</div>
            </div>

            <ArrowRight size={24} className="text-dark-500" />

            <div className="text-center min-w-[120px]">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                <FileText size={24} className="text-green-400" />
              </div>
              <div className="text-xs text-white font-medium">ได้ข้อมูล KYC</div>
              <div className="text-xs text-dark-400">ชื่อ, ที่อยู่, บัตร</div>
            </div>

            <ArrowRight size={24} className="text-dark-500" />

            <div className="text-center min-w-[120px]">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                <Shield size={24} className="text-red-400" />
              </div>
              <div className="text-xs text-white font-medium">จับกุม!</div>
              <div className="text-xs text-dark-400">James Zhong</div>
            </div>
          </div>

          <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-center">
            <div className="text-green-400 font-semibold">✅ สืบสวนสำเร็จ - ยึดทรัพย์ $6.5 Billion</div>
            <div className="text-sm text-dark-300 mt-1">
              จาก Wallet Address → ได้ตัวตนจริง → ยึดทรัพย์ → ดำเนินคดี
            </div>
          </div>
        </div>
      </div>

      {/* Export PDF Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-dark-800 rounded-xl border border-dark-700 p-6 w-[500px]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <FileDown size={20} className="text-primary-400" />
                Export รายงาน PDF
              </h3>
              <button onClick={() => setShowExportModal(false)} className="p-1 hover:bg-dark-700 rounded">
                <X size={18} className="text-dark-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-dark-900 rounded-lg">
                <h4 className="text-sm font-medium text-white mb-2">เนื้อหาที่จะรวม:</h4>
                <div className="space-y-2">
                  {['สรุปคดี (Stats)', 'Timeline การสืบสวน', 'Wallet Addresses', 'ข้อมูล KYC', 'เส้นทางเงิน (Flow)', 'หลักฐานดิจิทัล (พร้อม Hash)'].map((item, i) => (
                    <label key={i} className="flex items-center gap-2 text-sm text-dark-300">
                      <input type="checkbox" defaultChecked className="rounded" />
                      {item}
                    </label>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-dark-900 rounded-lg">
                <h4 className="text-sm font-medium text-white mb-2">รูปแบบ:</h4>
                <select className="w-full bg-dark-800 border border-dark-600 rounded-lg p-2 text-white text-sm">
                  <option>รายงานสำหรับศาล (Court Report)</option>
                  <option>รายงานสรุป (Executive Summary)</option>
                  <option>รายงานฉบับเต็ม (Full Report)</option>
                </select>
              </div>

              {exportSuccess ? (
                <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-center">
                  <CheckCircle size={32} className="text-green-400 mx-auto mb-2" />
                  <div className="text-green-400 font-semibold">Export สำเร็จ!</div>
                  <div className="text-sm text-dark-300">ไฟล์กำลังดาวน์โหลด...</div>
                </div>
              ) : (
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={handleExportPDF}
                  disabled={isExporting}
                >
                  {isExporting ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      กำลังสร้าง PDF...
                    </>
                  ) : (
                    <>
                      <Download size={16} className="mr-2" />
                      ดาวน์โหลด PDF
                    </>
                  )}
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
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <FolderPlus size={20} className="text-primary-400" />
                บันทึกลงคดี
              </h3>
              <button onClick={() => setShowSaveModal(false)} className="p-1 hover:bg-dark-700 rounded">
                <X size={18} className="text-dark-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-dark-400 mb-1 block">เลือกคดี:</label>
                <select className="w-full bg-dark-900 border border-dark-600 rounded-lg p-3 text-white">
                  <option>➕ สร้างคดีใหม่</option>
                  <option>CASE-20260110-6A7EF6 - คดีทดสอบ Crypto</option>
                  <option>CASE-20260109-ABC123 - คดีฟอกเงิน</option>
                </select>
              </div>

              <div>
                <label className="text-sm text-dark-400 mb-1 block">ชื่อคดีใหม่:</label>
                <input 
                  type="text" 
                  defaultValue="คดี Silk Road - US Government Seizure"
                  className="w-full bg-dark-900 border border-dark-600 rounded-lg p-3 text-white"
                />
              </div>

              <div>
                <label className="text-sm text-dark-400 mb-1 block">หมายเหตุ:</label>
                <textarea 
                  rows={3}
                  placeholder="รายละเอียดเพิ่มเติม..."
                  className="w-full bg-dark-900 border border-dark-600 rounded-lg p-3 text-white resize-none"
                />
              </div>

              {saveSuccess ? (
                <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-center">
                  <CheckCircle size={32} className="text-green-400 mx-auto mb-2" />
                  <div className="text-green-400 font-semibold">บันทึกสำเร็จ!</div>
                  <div className="text-sm text-dark-300">ข้อมูลถูกบันทึกลงคดีแล้ว</div>
                </div>
              ) : (
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={handleSaveToCase}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      กำลังบันทึก...
                    </>
                  ) : (
                    <>
                      <Save size={16} className="mr-2" />
                      บันทึกลงคดี
                    </>
                  )}
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
