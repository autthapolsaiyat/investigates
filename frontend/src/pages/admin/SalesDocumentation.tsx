/**
 * Sales Documentation Page
 * Internal documentation for Admin - Security, FAQ, and Deployment Options
 * Access: Super Admin and Org Admin only
 */
import { useState } from 'react';
import { 
  Shield, HelpCircle, Server, Lock, Database, Cloud, 
  Monitor, Key, ChevronDown, ChevronRight, Copy, Check,
  AlertTriangle, Clock, HardDrive, Globe, Building
} from 'lucide-react';
import { Card } from '../../components/ui';
import { useSettingsStore } from '../../store/settingsStore';
import { useTranslation } from '../../utils/translations';

type TabType = 'security' | 'faq' | 'deployment';

// Collapsible Section Component
const CollapsibleSection = ({ 
  title, 
  icon: Icon, 
  children,
  defaultOpen = false 
}: { 
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className="border border-dark-600 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 p-4 bg-dark-700 hover:bg-dark-600 transition-colors"
      >
        <Icon size={20} className="text-primary-400" />
        <span className="font-medium flex-1 text-left">{title}</span>
        {isOpen ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
      </button>
      {isOpen && (
        <div className="p-4 bg-dark-800">
          {children}
        </div>
      )}
    </div>
  );
};

// FAQ Item Component
const FAQItem = ({ question, answer }: { question: string; answer: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="border-b border-dark-600 last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 p-4 hover:bg-dark-700/50 transition-colors text-left"
      >
        <HelpCircle size={18} className="text-primary-400 flex-shrink-0" />
        <span className="font-medium flex-1">{question}</span>
        {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
      </button>
      {isOpen && (
        <div className="px-4 pb-4 pl-11 text-dark-300 space-y-3">
          {answer}
        </div>
      )}
    </div>
  );
};

// Copy Button Component
const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <button
      onClick={handleCopy}
      className="p-1 hover:bg-dark-600 rounded transition-colors"
      title="Copy"
    >
      {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} className="text-dark-400" />}
    </button>
  );
};

// Code Block Component
const CodeBlock = ({ children }: { children: string }) => (
  <div className="relative bg-dark-900 rounded-lg p-3 font-mono text-sm overflow-x-auto">
    <div className="absolute top-2 right-2">
      <CopyButton text={children} />
    </div>
    <pre className="text-green-400">{children}</pre>
  </div>
);

// Stat Card Component
const StatCard = ({ icon: Icon, label, value, color }: { 
  icon: React.ElementType; 
  label: string; 
  value: string;
  color: string;
}) => (
  <div className={`bg-dark-700 rounded-lg p-4 border-l-4 ${color}`}>
    <div className="flex items-center gap-3">
      <Icon size={24} className="text-dark-400" />
      <div>
        <p className="text-sm text-dark-400">{label}</p>
        <p className="font-bold text-lg">{value}</p>
      </div>
    </div>
  </div>
);

export const SalesDocumentation = () => {
  const { language } = useSettingsStore();
  const tr = useTranslation(language);
  const [activeTab, setActiveTab] = useState<TabType>('security');

  const tabs = [
    { id: 'security' as const, label: '🔐 Security & Data Protection', icon: Shield },
    { id: 'faq' as const, label: '❓ FAQ สำหรับขาย', icon: HelpCircle },
    { id: 'deployment' as const, label: '🖥️ Deployment Options', icon: Server },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">📋 Sales Documentation</h1>
          <p className="text-dark-400 mt-1">
            เอกสารภายในสำหรับทีมขาย - Security, FAQ, และ Deployment Options
          </p>
        </div>
        <div className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm">
          🔒 Admin Only
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-dark-600 pb-2 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-dark-700 text-white border-b-2 border-primary-500'
                : 'text-dark-400 hover:text-white hover:bg-dark-700/50'
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="space-y-6">
        {/* ==================== SECURITY TAB ==================== */}
        {activeTab === 'security' && (
          <>
            {/* Security Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StatCard icon={Shield} label="Encryption" value="AES-256" color="border-green-500" />
              <StatCard icon={Lock} label="Authentication" value="2FA + JWT" color="border-blue-500" />
              <StatCard icon={Database} label="Backup Frequency" value="ทุก 5 นาที" color="border-purple-500" />
              <StatCard icon={Clock} label="Recovery Time" value="< 4 ชม." color="border-orange-500" />
            </div>

            {/* Defense in Depth */}
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Shield className="text-primary-400" />
                Defense in Depth (การป้องกันแบบหลายชั้น)
              </h2>
              
              <div className="space-y-4">
                <CollapsibleSection title="Layer 1: Network Security" icon={Globe} defaultOpen>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Check size={16} className="text-green-400" />
                      <span>Azure DDoS Protection</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check size={16} className="text-green-400" />
                      <span>Web Application Firewall (WAF)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check size={16} className="text-green-400" />
                      <span>SSL/TLS 1.3 Encryption</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check size={16} className="text-green-400" />
                      <span>IP Whitelisting (Optional)</span>
                    </div>
                  </div>
                </CollapsibleSection>

                <CollapsibleSection title="Layer 2: Application Security" icon={Lock}>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Check size={16} className="text-green-400" />
                      <span>JWT Token Authentication (30 min access, 7 day refresh)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check size={16} className="text-green-400" />
                      <span>Two-Factor Authentication (2FA/TOTP)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check size={16} className="text-green-400" />
                      <span>Role-Based Access Control (5 roles)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check size={16} className="text-green-400" />
                      <span>Brute Force Protection (5 attempts → 30 min lock)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check size={16} className="text-green-400" />
                      <span>SQL Injection Prevention (Parameterized queries)</span>
                    </div>
                  </div>
                </CollapsibleSection>

                <CollapsibleSection title="Layer 3: Data Security" icon={Database}>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Check size={16} className="text-green-400" />
                      <span>Encryption at Rest (AES-256)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check size={16} className="text-green-400" />
                      <span>Encryption in Transit (TLS 1.3)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check size={16} className="text-green-400" />
                      <span>Database Transparent Data Encryption (TDE)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check size={16} className="text-green-400" />
                      <span>Secure Key Management (Azure Key Vault)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check size={16} className="text-green-400" />
                      <span>Password Hashing (bcrypt with salt)</span>
                    </div>
                  </div>
                </CollapsibleSection>

                <CollapsibleSection title="Layer 4: Monitoring & Audit" icon={Monitor}>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Check size={16} className="text-green-400" />
                      <span>Activity Logging (All user actions)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check size={16} className="text-green-400" />
                      <span>Login History & Geolocation Tracking</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check size={16} className="text-green-400" />
                      <span>Real-time Security Alerts</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check size={16} className="text-green-400" />
                      <span>Audit Trail (Who did what, when)</span>
                    </div>
                  </div>
                </CollapsibleSection>
              </div>
            </Card>

            {/* Backup & Recovery */}
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <HardDrive className="text-primary-400" />
                Backup & Disaster Recovery
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-dark-600">
                      <th className="text-left p-3">Backup Type</th>
                      <th className="text-left p-3">Frequency</th>
                      <th className="text-left p-3">Retention</th>
                      <th className="text-left p-3">Location</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-dark-700">
                      <td className="p-3 font-medium">Transaction Log</td>
                      <td className="p-3 text-green-400">ทุก 5-10 นาที</td>
                      <td className="p-3">7 วัน</td>
                      <td className="p-3">Primary Region</td>
                    </tr>
                    <tr className="border-b border-dark-700">
                      <td className="p-3 font-medium">Differential</td>
                      <td className="p-3 text-blue-400">ทุก 12 ชั่วโมง</td>
                      <td className="p-3">30 วัน</td>
                      <td className="p-3">Primary Region</td>
                    </tr>
                    <tr className="border-b border-dark-700">
                      <td className="p-3 font-medium">Full Backup</td>
                      <td className="p-3 text-purple-400">วันละครั้ง (2:00 AM)</td>
                      <td className="p-3">90 วัน</td>
                      <td className="p-3">Primary + Secondary</td>
                    </tr>
                    <tr className="border-b border-dark-700">
                      <td className="p-3 font-medium">Monthly Archive</td>
                      <td className="p-3 text-orange-400">วันที่ 1 ของเดือน</td>
                      <td className="p-3">1 ปี</td>
                      <td className="p-3">Geo-Redundant</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium">Yearly Archive</td>
                      <td className="p-3 text-red-400">1 มกราคม</td>
                      <td className="p-3">7 ปี</td>
                      <td className="p-3">Geo-Redundant + Offline</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-dark-700 rounded-lg p-4">
                  <h4 className="font-bold text-red-400">Hardware Failure</h4>
                  <p className="text-sm text-dark-400 mt-1">RTO: &lt; 1 ชั่วโมง</p>
                  <p className="text-sm text-dark-400">RPO: &lt; 5 นาที</p>
                </div>
                <div className="bg-dark-700 rounded-lg p-4">
                  <h4 className="font-bold text-orange-400">Ransomware Attack</h4>
                  <p className="text-sm text-dark-400 mt-1">RTO: &lt; 8 ชั่วโมง</p>
                  <p className="text-sm text-dark-400">RPO: &lt; 24 ชั่วโมง</p>
                </div>
                <div className="bg-dark-700 rounded-lg p-4">
                  <h4 className="font-bold text-yellow-400">Complete Disaster</h4>
                  <p className="text-sm text-dark-400 mt-1">RTO: &lt; 24 ชั่วโมง</p>
                  <p className="text-sm text-dark-400">RPO: &lt; 24 ชั่วโมง</p>
                </div>
              </div>
            </Card>

            {/* Ransomware Protection */}
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <AlertTriangle className="text-red-400" />
                Ransomware Protection
              </h2>

              <div className="bg-dark-700 rounded-lg p-4 mb-4">
                <h4 className="font-bold text-green-400 mb-2">🛡️ Immutable Backup Strategy</h4>
                <p className="text-sm text-dark-300">
                  Backup ที่ใช้ <strong>WORM (Write Once Read Many)</strong> technology - 
                  ไม่สามารถแก้ไขหรือลบได้แม้แต่ admin หรือ ransomware
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-blue-400">Prevention</h4>
                  <ul className="text-sm space-y-1 text-dark-300">
                    <li>• Web Application Firewall (WAF)</li>
                    <li>• Input validation & sanitization</li>
                    <li>• SQL injection prevention</li>
                    <li>• File upload restrictions</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-purple-400">Detection</h4>
                  <ul className="text-sm space-y-1 text-dark-300">
                    <li>• Real-time activity monitoring</li>
                    <li>• Anomaly detection</li>
                    <li>• Failed login tracking</li>
                    <li>• Mass file modification alerts</li>
                  </ul>
                </div>
              </div>
            </Card>
          </>
        )}

        {/* ==================== FAQ TAB ==================== */}
        {activeTab === 'faq' && (
          <>
            {/* Quick Reference Card */}
            <Card className="p-6 bg-gradient-to-r from-primary-500/20 to-blue-500/20 border-primary-500/50">
              <h2 className="text-xl font-bold mb-3">💡 Elevator Pitch (30 วินาที)</h2>
              <p className="text-dark-200 italic">
                "InvestiGate คือแพลตฟอร์มสืบสวนการเงินดิจิทัลสำหรับหน่วยงานสืบสวน รองรับทั้ง Cloud และติดตั้งในเซิร์ฟเวอร์ของท่านเอง 
                มีระบบ 2FA, Backup อัตโนมัติทุก 5 นาที, และ Immutable backup ป้องกัน Ransomware"
              </p>
            </Card>

            {/* Key Selling Points */}
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">⭐ Key Selling Points</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-dark-700 rounded-lg p-4">
                  <div className="text-2xl mb-2">🔐</div>
                  <h4 className="font-bold">ความปลอดภัยระดับสูง</h4>
                  <p className="text-sm text-dark-400">2FA, Encryption, Audit log</p>
                </div>
                <div className="bg-dark-700 rounded-lg p-4">
                  <div className="text-2xl mb-2">💾</div>
                  <h4 className="font-bold">Backup ทุก 5 นาที</h4>
                  <p className="text-sm text-dark-400">ไม่มีทางสูญเสียข้อมูล</p>
                </div>
                <div className="bg-dark-700 rounded-lg p-4">
                  <div className="text-2xl mb-2">🏢</div>
                  <h4 className="font-bold">On-Premises Option</h4>
                  <p className="text-sm text-dark-400">ข้อมูลไม่ออกนอกหน่วยงาน</p>
                </div>
                <div className="bg-dark-700 rounded-lg p-4">
                  <div className="text-2xl mb-2">📚</div>
                  <h4 className="font-bold">ใช้งานง่าย</h4>
                  <p className="text-sm text-dark-400">Training 1 วันเริ่มใช้งานได้</p>
                </div>
                <div className="bg-dark-700 rounded-lg p-4">
                  <div className="text-2xl mb-2">🇹🇭</div>
                  <h4 className="font-bold">Support ภาษาไทย</h4>
                  <p className="text-sm text-dark-400">ตอบเร็วภายใน 4 ชม.</p>
                </div>
                <div className="bg-dark-700 rounded-lg p-4">
                  <div className="text-2xl mb-2">💰</div>
                  <h4 className="font-bold">ราคาถูกกว่า 5 เท่า</h4>
                  <p className="text-sm text-dark-400">เทียบกับ Cellebrite</p>
                </div>
              </div>
            </Card>

            {/* FAQ Categories */}
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <HelpCircle className="text-primary-400" />
                🔐 คำถามด้านความปลอดภัย
              </h2>
              
              <div className="divide-y divide-dark-600">
                <FAQItem 
                  question='Q1: "ข้อมูลคดีของเราจะถูกเก็บที่ไหน? มีความเสี่ยงรั่วไหลไหม?"'
                  answer={
                    <div className="space-y-3">
                      <p>ข้อมูลถูกเก็บใน Microsoft Azure Data Center ที่สิงคโปร์ (Southeast Asia) ซึ่งผ่านมาตรฐาน ISO 27001, SOC 2, และ CSA STAR Level 2</p>
                      <div className="bg-dark-700 rounded p-3">
                        <p className="font-bold text-green-400 mb-2">การป้องกันการรั่วไหล:</p>
                        <ul className="text-sm space-y-1">
                          <li>• เข้ารหัสข้อมูลทั้งหมดด้วย AES-256</li>
                          <li>• การเข้าถึงต้องผ่าน Authentication 2 ชั้น (รหัสผ่าน + OTP)</li>
                          <li>• มีระบบ Audit Log บันทึกทุกการเข้าถึง</li>
                          <li>• พนักงานของเราไม่สามารถเข้าถึงข้อมูลคดีได้ (Zero Access Architecture)</li>
                        </ul>
                      </div>
                      <p className="text-primary-400">
                        <strong>ทางเลือก:</strong> หากต้องการความมั่นใจสูงสุด เรามี <strong>On-Premises Version</strong> ที่ติดตั้งในเซิร์ฟเวอร์ของท่านเอง ข้อมูลจะไม่ออกนอกหน่วยงานเลย
                      </p>
                    </div>
                  }
                />

                <FAQItem 
                  question='Q2: "ถ้าโดน Ransomware โจมตี ข้อมูลจะหายไหม?"'
                  answer={
                    <div className="space-y-3">
                      <p>เราออกแบบระบบป้องกัน Ransomware หลายชั้น:</p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="bg-dark-700 rounded p-3">
                          <p className="font-bold text-blue-400 mb-1">1. Prevention</p>
                          <ul className="text-xs space-y-1">
                            <li>• Web Application Firewall</li>
                            <li>• ไม่มีช่องทาง upload file โดยตรง</li>
                            <li>• Input Validation</li>
                          </ul>
                        </div>
                        <div className="bg-dark-700 rounded p-3">
                          <p className="font-bold text-green-400 mb-1">2. Backup ที่โจมตีไม่ได้</p>
                          <ul className="text-xs space-y-1">
                            <li>• Immutable Backup</li>
                            <li>• Backup ทุก 5 นาที</li>
                            <li>• Offline Backup (Air-gap)</li>
                          </ul>
                        </div>
                        <div className="bg-dark-700 rounded p-3">
                          <p className="font-bold text-orange-400 mb-1">3. Recovery</p>
                          <ul className="text-xs space-y-1">
                            <li>• กู้คืนได้ภายใน 4-8 ชม.</li>
                            <li>• สูญเสียข้อมูลไม่เกิน 24 ชม.</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  }
                />

                <FAQItem 
                  question='Q3: "ระบบ Backup ทำงานอย่างไร? Backup บ่อยแค่ไหน?"'
                  answer={
                    <div className="space-y-3">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-dark-600">
                            <th className="text-left p-2">ประเภท</th>
                            <th className="text-left p-2">ความถี่</th>
                            <th className="text-left p-2">เก็บนานเท่าไร</th>
                          </tr>
                        </thead>
                        <tbody className="text-dark-300">
                          <tr className="border-b border-dark-700">
                            <td className="p-2">Transaction Log</td>
                            <td className="p-2 text-green-400">ทุก 5-10 นาที</td>
                            <td className="p-2">7 วัน</td>
                          </tr>
                          <tr className="border-b border-dark-700">
                            <td className="p-2">Full Backup</td>
                            <td className="p-2 text-blue-400">วันละครั้ง</td>
                            <td className="p-2">90 วัน</td>
                          </tr>
                          <tr>
                            <td className="p-2">Archive</td>
                            <td className="p-2 text-purple-400">เดือนละครั้ง</td>
                            <td className="p-2">1 ปี</td>
                          </tr>
                        </tbody>
                      </table>
                      <div className="bg-dark-700 rounded p-3">
                        <p className="font-bold text-primary-400 mb-1">จุดเด่น:</p>
                        <ul className="text-sm space-y-1">
                          <li>• Backup อัตโนมัติ ไม่ต้องทำเอง</li>
                          <li>• กู้คืนได้ทุกจุดในช่วง 7 วันที่ผ่านมา (Point-in-time recovery)</li>
                          <li>• Backup เก็บคนละที่กับ Production (Different data center)</li>
                        </ul>
                      </div>
                    </div>
                  }
                />

                <FAQItem 
                  question='Q4: "ใครบ้างที่สามารถเข้าถึงข้อมูลของเราได้?"'
                  answer={
                    <div className="space-y-3">
                      <p className="font-bold">ภายในหน่วยงานของท่าน:</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        <div className="bg-dark-700 rounded p-2">
                          <span className="text-red-400 font-bold">Super Admin</span> - เข้าถึงทุกอย่าง + จัดการผู้ใช้
                        </div>
                        <div className="bg-dark-700 rounded p-2">
                          <span className="text-orange-400 font-bold">Org Admin</span> - เข้าถึงคดีในหน่วยงาน
                        </div>
                        <div className="bg-dark-700 rounded p-2">
                          <span className="text-blue-400 font-bold">Investigator</span> - เข้าถึงเฉพาะคดีที่ตัวเองสร้าง
                        </div>
                        <div className="bg-dark-700 rounded p-2">
                          <span className="text-green-400 font-bold">Viewer</span> - อ่านอย่างเดียว
                        </div>
                      </div>
                      <div className="bg-yellow-500/20 border border-yellow-500/50 rounded p-3">
                        <p className="font-bold text-yellow-400">ทีมงานเรา:</p>
                        <ul className="text-sm space-y-1">
                          <li>• <strong>ไม่สามารถ</strong>เข้าถึงข้อมูลคดีได้ (Zero Access)</li>
                          <li>• ทุกการเข้าถึงมี Audit log</li>
                        </ul>
                      </div>
                    </div>
                  }
                />

                <FAQItem 
                  question='Q5: "ถ้าพนักงานลาออก จะป้องกันการเข้าถึงอย่างไร?"'
                  answer={
                    <div className="space-y-3">
                      <div className="bg-dark-700 rounded p-3">
                        <p className="font-bold text-green-400 mb-2">มาตรการ:</p>
                        <ol className="text-sm space-y-1 list-decimal list-inside">
                          <li>Admin สามารถ <strong>Disable account ทันที</strong> - หยุดการเข้าถึงทันที</li>
                          <li>Session ทั้งหมดของ user จะถูก terminate</li>
                          <li>ระบบบันทึกว่า user คนนั้นทำอะไรบ้างก่อนออก (Audit trail)</li>
                          <li>สามารถ export ประวัติการใช้งานเป็นรายงานได้</li>
                        </ol>
                      </div>
                    </div>
                  }
                />
              </div>
            </Card>

            {/* Pricing FAQ */}
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <HelpCircle className="text-primary-400" />
                💰 คำถามด้านราคาและบริการ
              </h2>
              
              <div className="divide-y divide-dark-600">
                <FAQItem 
                  question='Q6: "ราคาเท่าไร? คิดอย่างไร?"'
                  answer={
                    <div className="space-y-4">
                      <div>
                        <p className="font-bold text-blue-400 mb-2">Cloud Version (SaaS):</p>
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-dark-600">
                              <th className="text-left p-2">แพ็คเกจ</th>
                              <th className="text-left p-2">ราคา/user/ปี</th>
                              <th className="text-left p-2">จำนวน Users</th>
                            </tr>
                          </thead>
                          <tbody className="text-dark-300">
                            <tr className="border-b border-dark-700">
                              <td className="p-2">Starter</td>
                              <td className="p-2 text-green-400">฿15,000</td>
                              <td className="p-2">1-10 users</td>
                            </tr>
                            <tr className="border-b border-dark-700">
                              <td className="p-2">Professional</td>
                              <td className="p-2 text-blue-400">฿12,000</td>
                              <td className="p-2">11-50 users</td>
                            </tr>
                            <tr>
                              <td className="p-2">Enterprise</td>
                              <td className="p-2 text-purple-400">฿10,000</td>
                              <td className="p-2">51+ users</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <div>
                        <p className="font-bold text-orange-400 mb-2">On-Premises Version:</p>
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-dark-600">
                              <th className="text-left p-2">รายการ</th>
                              <th className="text-left p-2">ราคา</th>
                            </tr>
                          </thead>
                          <tbody className="text-dark-300">
                            <tr className="border-b border-dark-700">
                              <td className="p-2">License (ครั้งเดียว)</td>
                              <td className="p-2 text-green-400">฿500,000</td>
                            </tr>
                            <tr className="border-b border-dark-700">
                              <td className="p-2">Installation</td>
                              <td className="p-2">฿100,000</td>
                            </tr>
                            <tr className="border-b border-dark-700">
                              <td className="p-2">Annual Support</td>
                              <td className="p-2">฿150,000/ปี</td>
                            </tr>
                            <tr>
                              <td className="p-2">Training</td>
                              <td className="p-2">฿30,000/session</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <p className="text-xs text-dark-400">*ราคาไม่รวม VAT 7%</p>
                    </div>
                  }
                />

                <FAQItem 
                  question='Q7: "มี Support อย่างไร?"'
                  answer={
                    <div>
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-dark-600">
                            <th className="text-left p-2">ระดับ</th>
                            <th className="text-left p-2">ช่องทาง</th>
                            <th className="text-left p-2">เวลาตอบ</th>
                          </tr>
                        </thead>
                        <tbody className="text-dark-300">
                          <tr className="border-b border-dark-700">
                            <td className="p-2">Standard</td>
                            <td className="p-2">LINE, Email</td>
                            <td className="p-2">ภายใน 24 ชม.</td>
                          </tr>
                          <tr className="border-b border-dark-700">
                            <td className="p-2 text-blue-400">Priority</td>
                            <td className="p-2">LINE, Email, Phone</td>
                            <td className="p-2 text-green-400">ภายใน 4 ชม.</td>
                          </tr>
                          <tr>
                            <td className="p-2 text-purple-400">Enterprise</td>
                            <td className="p-2">Dedicated Support</td>
                            <td className="p-2 text-green-400">ภายใน 1 ชม.</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  }
                />
              </div>
            </Card>

            {/* Government FAQ */}
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Building className="text-primary-400" />
                🏛️ คำถามจากหน่วยงานราชการ
              </h2>
              
              <div className="divide-y divide-dark-600">
                <FAQItem 
                  question='Q9: "ระบบนี้ผ่านมาตรฐานอะไรบ้าง?"'
                  answer={
                    <div className="space-y-3">
                      <div>
                        <p className="font-bold text-blue-400 mb-2">Infrastructure (Azure):</p>
                        <div className="flex flex-wrap gap-2">
                          <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">ISO 27001</span>
                          <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">ISO 27017</span>
                          <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">ISO 27018</span>
                          <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">SOC 1, 2, 3</span>
                          <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">CSA STAR Level 2</span>
                          <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">PDPA Compliant</span>
                        </div>
                      </div>
                      <div>
                        <p className="font-bold text-purple-400 mb-2">Application:</p>
                        <div className="flex flex-wrap gap-2">
                          <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">OWASP Top 10</span>
                          <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">Secure Coding</span>
                          <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">Penetration Testing</span>
                        </div>
                      </div>
                      <div className="bg-yellow-500/20 border border-yellow-500/50 rounded p-3">
                        <p className="font-bold text-yellow-400">อยู่ระหว่างดำเนินการ:</p>
                        <ul className="text-sm space-y-1">
                          <li>• ISO 27001 (Application level) - Q3 2026</li>
                          <li>• SOC 2 Type II - Q4 2026</li>
                        </ul>
                      </div>
                    </div>
                  }
                />

                <FAQItem 
                  question='Q10: "ต้องการติดตั้งในเซิร์ฟเวอร์ของหน่วยงาน ทำได้ไหม?"'
                  answer={
                    <div className="space-y-3">
                      <p className="text-green-400 font-bold">✅ ได้ครับ! เรามี On-Premises Version</p>
                      <div className="bg-dark-700 rounded p-3">
                        <p className="font-bold mb-2">สิ่งที่ต้องเตรียม:</p>
                        <ul className="text-sm space-y-1">
                          <li>• Server ตาม Spec ที่กำหนด</li>
                          <li>• SQL Server License (หรือใช้ PostgreSQL ฟรี)</li>
                          <li>• IT Team สำหรับดูแลระบบ</li>
                        </ul>
                      </div>
                      <div className="bg-dark-700 rounded p-3">
                        <p className="font-bold mb-2">เราจัดให้:</p>
                        <ul className="text-sm space-y-1">
                          <li>• ติดตั้งระบบ</li>
                          <li>• Training IT Team</li>
                          <li>• Documentation ครบถ้วน</li>
                          <li>• Remote support</li>
                        </ul>
                      </div>
                    </div>
                  }
                />

                <FAQItem 
                  question='Q11: "ข้อมูลสามารถใช้เป็นหลักฐานในชั้นศาลได้ไหม?"'
                  answer={
                    <div className="space-y-3">
                      <p className="text-green-400 font-bold">✅ ได้ครับ ระบบออกแบบมาเพื่อรองรับ:</p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="bg-dark-700 rounded p-3">
                          <p className="font-bold text-blue-400 mb-1">Chain of Custody</p>
                          <ul className="text-xs space-y-1">
                            <li>• ทุก action มี timestamp + user ID + IP</li>
                            <li>• ไม่สามารถแก้ไข log ย้อนหลังได้</li>
                          </ul>
                        </div>
                        <div className="bg-dark-700 rounded p-3">
                          <p className="font-bold text-green-400 mb-1">Data Integrity</p>
                          <ul className="text-xs space-y-1">
                            <li>• Hash verification สำหรับไฟล์</li>
                            <li>• พิสูจน์ว่าไฟล์ไม่ถูกแก้ไข</li>
                          </ul>
                        </div>
                        <div className="bg-dark-700 rounded p-3">
                          <p className="font-bold text-purple-400 mb-1">Export สำหรับศาล</p>
                          <ul className="text-xs space-y-1">
                            <li>• รายงานพร้อม Audit trail</li>
                            <li>• PDF พร้อม digital signature</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  }
                />
              </div>
            </Card>

            {/* Objection Handling */}
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">🎯 Objection Handling</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-dark-600">
                      <th className="text-left p-3">Objection</th>
                      <th className="text-left p-3">Response</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-dark-700">
                      <td className="p-3 text-red-400">"แพงไป"</td>
                      <td className="p-3">"เทียบกับ Cellebrite ที่เริ่มต้น $10,000/ปี เราถูกกว่า 5 เท่า"</td>
                    </tr>
                    <tr className="border-b border-dark-700">
                      <td className="p-3 text-red-400">"กลัวข้อมูลรั่ว"</td>
                      <td className="p-3">"มี On-Premises ติดตั้งในเซิร์ฟเวอร์ท่านเอง"</td>
                    </tr>
                    <tr className="border-b border-dark-700">
                      <td className="p-3 text-red-400">"ไม่มี IT ดูแล"</td>
                      <td className="p-3">"Cloud version ไม่ต้องดูแลเลย เรา manage ทุกอย่าง"</td>
                    </tr>
                    <tr>
                      <td className="p-3 text-red-400">"ต้องผ่าน กสทช."</td>
                      <td className="p-3">"รองรับ PDPA และกำลังทำ ISO 27001"</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}

        {/* ==================== DEPLOYMENT TAB ==================== */}
        {activeTab === 'deployment' && (
          <>
            {/* Deployment Options Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Cloud Option */}
              <Card className="p-6 border-2 border-blue-500/50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-blue-500/20 rounded-lg">
                    <Cloud size={32} className="text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Cloud (SaaS)</h3>
                    <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded">Current</span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-dark-400 mb-2">Pros:</p>
                    <ul className="text-sm space-y-1">
                      <li className="flex items-center gap-2"><Check size={14} className="text-green-400" /> No hardware investment</li>
                      <li className="flex items-center gap-2"><Check size={14} className="text-green-400" /> Auto-scaling</li>
                      <li className="flex items-center gap-2"><Check size={14} className="text-green-400" /> Managed security updates</li>
                      <li className="flex items-center gap-2"><Check size={14} className="text-green-400" /> 99.9% SLA uptime</li>
                      <li className="flex items-center gap-2"><Check size={14} className="text-green-400" /> Automatic backups</li>
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm text-dark-400 mb-2">Cons:</p>
                    <ul className="text-sm space-y-1 text-dark-400">
                      <li>• Data stored outside organization</li>
                      <li>• Internet dependency</li>
                      <li>• Monthly subscription cost</li>
                    </ul>
                  </div>
                  <div className="pt-4 border-t border-dark-600">
                    <p className="text-sm text-dark-400">Best For:</p>
                    <p className="text-sm">Small-medium organizations, Quick deployment</p>
                  </div>
                </div>
              </Card>

              {/* On-Premises Option */}
              <Card className="p-6 border-2 border-orange-500/50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-orange-500/20 rounded-lg">
                    <Server size={32} className="text-orange-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">On-Premises</h3>
                    <span className="text-xs px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded">New</span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-dark-400 mb-2">Pros:</p>
                    <ul className="text-sm space-y-1">
                      <li className="flex items-center gap-2"><Check size={14} className="text-green-400" /> Complete data sovereignty</li>
                      <li className="flex items-center gap-2"><Check size={14} className="text-green-400" /> Data never leaves org</li>
                      <li className="flex items-center gap-2"><Check size={14} className="text-green-400" /> Full control over infra</li>
                      <li className="flex items-center gap-2"><Check size={14} className="text-green-400" /> Can work offline</li>
                      <li className="flex items-center gap-2"><Check size={14} className="text-green-400" /> Strict compliance</li>
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm text-dark-400 mb-2">Cons:</p>
                    <ul className="text-sm space-y-1 text-dark-400">
                      <li>• Higher upfront cost</li>
                      <li>• Need IT staff</li>
                      <li>• Customer responsible for backups</li>
                    </ul>
                  </div>
                  <div className="pt-4 border-t border-dark-600">
                    <p className="text-sm text-dark-400">Best For:</p>
                    <p className="text-sm">Government agencies, High-security requirements</p>
                  </div>
                </div>
              </Card>

              {/* Desktop App Option */}
              <Card className="p-6 border-2 border-purple-500/50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-purple-500/20 rounded-lg">
                    <Monitor size={32} className="text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Desktop App</h3>
                    <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded">Planned</span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-dark-400 mb-2">Options:</p>
                    <div className="space-y-3">
                      <div className="bg-dark-700 rounded p-3">
                        <p className="font-bold text-sm text-blue-400">Option 1: Windows App (Tauri)</p>
                        <ul className="text-xs mt-2 space-y-1">
                          <li>• ติดตั้งง่าย (Download → Install)</li>
                          <li>• License: Hardware binding</li>
                          <li>• Dev time: 10-12 สัปดาห์</li>
                        </ul>
                      </div>
                      <div className="bg-dark-700 rounded p-3">
                        <p className="font-bold text-sm text-orange-400">Option 2: Linux Appliance</p>
                        <ul className="text-xs mt-2 space-y-1">
                          <li>• ขายพร้อม Notebook</li>
                          <li>• Offline 100%</li>
                          <li>• Dev time: 8-11 สัปดาห์</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Desktop App Details */}
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Monitor className="text-primary-400" />
                Desktop App - รายละเอียดการพัฒนา
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Windows App */}
                <div className="bg-dark-700 rounded-lg p-6">
                  <h3 className="text-lg font-bold text-blue-400 mb-4">🪟 Windows Desktop App (Tauri)</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-dark-400 mb-2">Assessment:</p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>ความเป็นไปได้:</div>
                        <div className="text-green-400">⭐⭐⭐⭐⭐ (95%)</div>
                        <div>ความยาก:</div>
                        <div className="text-yellow-400">🟡 ปานกลาง</div>
                        <div>License Protection:</div>
                        <div className="text-green-400">⭐⭐⭐⭐ (75%)</div>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-dark-400 mb-2">Development Timeline:</p>
                      <table className="w-full text-xs">
                        <tbody>
                          <tr className="border-b border-dark-600">
                            <td className="py-1">Setup Tauri + Migrate React</td>
                            <td className="py-1 text-right">1-2 สัปดาห์</td>
                          </tr>
                          <tr className="border-b border-dark-600">
                            <td className="py-1">Convert FastAPI → Rust/SQLite</td>
                            <td className="py-1 text-right">3-4 สัปดาห์</td>
                          </tr>
                          <tr className="border-b border-dark-600">
                            <td className="py-1">License System</td>
                            <td className="py-1 text-right">2 สัปดาห์</td>
                          </tr>
                          <tr className="border-b border-dark-600">
                            <td className="py-1">Windows Installer</td>
                            <td className="py-1 text-right">1 สัปดาห์</td>
                          </tr>
                          <tr className="border-b border-dark-600">
                            <td className="py-1">Testing</td>
                            <td className="py-1 text-right">2 สัปดาห์</td>
                          </tr>
                          <tr className="font-bold">
                            <td className="py-1">รวม</td>
                            <td className="py-1 text-right text-green-400">10-12 สัปดาห์</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div>
                      <p className="text-sm text-dark-400 mb-2">ราคาขาย:</p>
                      <p className="text-lg font-bold text-green-400">฿80,000 (perpetual) หรือ ฿30,000/ปี</p>
                      <p className="text-xs text-dark-400">+ Annual Support ฿15,000/ปี</p>
                    </div>
                  </div>
                </div>

                {/* Linux Appliance */}
                <div className="bg-dark-700 rounded-lg p-6">
                  <h3 className="text-lg font-bold text-orange-400 mb-4">🐧 Linux Appliance (Custom ISO)</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-dark-400 mb-2">Assessment:</p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>ความเป็นไปได้:</div>
                        <div className="text-green-400">⭐⭐⭐⭐ (80%)</div>
                        <div>ความยาก:</div>
                        <div className="text-red-400">🔴 สูง</div>
                        <div>Perceived Value:</div>
                        <div className="text-green-400">⭐⭐⭐⭐⭐</div>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-dark-400 mb-2">Development Timeline:</p>
                      <table className="w-full text-xs">
                        <tbody>
                          <tr className="border-b border-dark-600">
                            <td className="py-1">Custom Ubuntu ISO (Kiosk)</td>
                            <td className="py-1 text-right">2-3 สัปดาห์</td>
                          </tr>
                          <tr className="border-b border-dark-600">
                            <td className="py-1">Auto-start Service</td>
                            <td className="py-1 text-right">1 สัปดาห์</td>
                          </tr>
                          <tr className="border-b border-dark-600">
                            <td className="py-1">Hardware Binding (License)</td>
                            <td className="py-1 text-right">2-3 สัปดาห์</td>
                          </tr>
                          <tr className="border-b border-dark-600">
                            <td className="py-1">BIOS lock + Secure boot</td>
                            <td className="py-1 text-right">1-2 สัปดาห์</td>
                          </tr>
                          <tr className="border-b border-dark-600">
                            <td className="py-1">Testing</td>
                            <td className="py-1 text-right">2 สัปดาห์</td>
                          </tr>
                          <tr className="font-bold">
                            <td className="py-1">รวม</td>
                            <td className="py-1 text-right text-orange-400">8-11 สัปดาห์</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div>
                      <p className="text-sm text-dark-400 mb-2">ราคาขาย:</p>
                      <p className="text-lg font-bold text-green-400">฿135,000 - 145,000 ต่อชุด</p>
                      <p className="text-xs text-dark-400">(รวม Notebook + Software + Setup)</p>
                      <p className="text-xs text-dark-400">+ Annual Support ฿30,000/ปี</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* License Protection */}
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Key className="text-primary-400" />
                License Protection Strategy
              </h2>

              <div className="bg-dark-700 rounded-lg p-4 mb-4">
                <h4 className="font-bold mb-2">🔐 Multi-Layer Protection</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-dark-800 rounded p-3">
                    <p className="font-bold text-blue-400 text-sm">Layer 1: Hardware Binding</p>
                    <p className="text-xs text-dark-400 mt-1">CPU Serial + MB Serial + Disk Serial + MAC Address</p>
                  </div>
                  <div className="bg-dark-800 rounded p-3">
                    <p className="font-bold text-green-400 text-sm">Layer 2: Online Heartbeat</p>
                    <p className="text-xs text-dark-400 mt-1">Ping server ทุก 7 วัน, Grace period 14 วัน</p>
                  </div>
                  <div className="bg-dark-800 rounded p-3">
                    <p className="font-bold text-purple-400 text-sm">Layer 3: Code Obfuscation</p>
                    <p className="text-xs text-dark-400 mt-1">Rust binary, String encryption, Anti-debugging</p>
                  </div>
                  <div className="bg-dark-800 rounded p-3">
                    <p className="font-bold text-orange-400 text-sm">Layer 4: Tamper Detection</p>
                    <p className="text-xs text-dark-400 mt-1">File integrity check, Debugger detection</p>
                  </div>
                </div>
              </div>

              <div className="bg-dark-900 rounded-lg p-4">
                <h4 className="font-bold mb-2">📋 License Activation Flow</h4>
                <div className="flex items-center justify-between text-sm overflow-x-auto pb-2">
                  <div className="flex flex-col items-center min-w-[100px]">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">1</div>
                    <p className="text-xs mt-1 text-center">Buy License</p>
                  </div>
                  <div className="text-dark-600">→</div>
                  <div className="flex flex-col items-center min-w-[100px]">
                    <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">2</div>
                    <p className="text-xs mt-1 text-center">Receive Key</p>
                  </div>
                  <div className="text-dark-600">→</div>
                  <div className="flex flex-col items-center min-w-[100px]">
                    <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">3</div>
                    <p className="text-xs mt-1 text-center">Install App</p>
                  </div>
                  <div className="text-dark-600">→</div>
                  <div className="flex flex-col items-center min-w-[100px]">
                    <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center">4</div>
                    <p className="text-xs mt-1 text-center">Enter Key + HW ID</p>
                  </div>
                  <div className="text-dark-600">→</div>
                  <div className="flex flex-col items-center min-w-[100px]">
                    <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">5</div>
                    <p className="text-xs mt-1 text-center">Validate & Bind</p>
                  </div>
                  <div className="text-dark-600">→</div>
                  <div className="flex flex-col items-center min-w-[100px]">
                    <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">✓</div>
                    <p className="text-xs mt-1 text-center">Licensed!</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* On-Premises Requirements */}
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Server className="text-primary-400" />
                On-Premises Requirements
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-bold mb-3">💻 Hardware Requirements (Minimum)</h4>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-dark-600">
                        <th className="text-left p-2">Component</th>
                        <th className="text-left p-2">Specification</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-dark-700">
                        <td className="p-2">Web/API Server</td>
                        <td className="p-2">4 CPU, 8GB RAM, 100GB SSD</td>
                      </tr>
                      <tr className="border-b border-dark-700">
                        <td className="p-2">Database Server</td>
                        <td className="p-2">8 CPU, 32GB RAM, 500GB SSD</td>
                      </tr>
                      <tr className="border-b border-dark-700">
                        <td className="p-2">Backup Storage</td>
                        <td className="p-2">2TB+</td>
                      </tr>
                      <tr>
                        <td className="p-2">Network</td>
                        <td className="p-2">1 Gbps internal, 100 Mbps external</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div>
                  <h4 className="font-bold mb-3">📦 Software Requirements</h4>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-dark-600">
                        <th className="text-left p-2">Software</th>
                        <th className="text-left p-2">Version</th>
                        <th className="text-left p-2">License</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-dark-700">
                        <td className="p-2">OS</td>
                        <td className="p-2">Ubuntu 22.04 LTS / Windows Server 2022</td>
                        <td className="p-2">-</td>
                      </tr>
                      <tr className="border-b border-dark-700">
                        <td className="p-2">Database</td>
                        <td className="p-2">SQL Server 2019+ / PostgreSQL 14+</td>
                        <td className="p-2">Customer provides</td>
                      </tr>
                      <tr className="border-b border-dark-700">
                        <td className="p-2">Python</td>
                        <td className="p-2">3.11+</td>
                        <td className="p-2 text-green-400">Free</td>
                      </tr>
                      <tr>
                        <td className="p-2">Nginx</td>
                        <td className="p-2">1.24+</td>
                        <td className="p-2 text-green-400">Free</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>

            {/* Recommendation */}
            <Card className="p-6 bg-gradient-to-r from-green-500/20 to-blue-500/20 border-green-500/50">
              <h2 className="text-xl font-bold mb-4">🎯 คำแนะนำการพัฒนา</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-dark-800/50 rounded-lg p-4">
                  <h4 className="font-bold text-green-400 mb-2">✅ Short-term (ทำก่อน): Windows Desktop App</h4>
                  <ul className="text-sm space-y-1">
                    <li>• ใช้ React code ที่มีอยู่ได้</li>
                    <li>• ตลาดกว้างกว่า (ทุกคนมี Windows)</li>
                    <li>• License protection ดีกว่า (Rust binary)</li>
                    <li>• ต้นทุนต่ำ ไม่ต้องซื้อ Hardware</li>
                  </ul>
                </div>
                <div className="bg-dark-800/50 rounded-lg p-4">
                  <h4 className="font-bold text-blue-400 mb-2">📌 Long-term (Phase 2): Linux Appliance</h4>
                  <ul className="text-sm space-y-1">
                    <li>• สำหรับลูกค้า Premium</li>
                    <li>• ต้องการ Offline 100%</li>
                    <li>• ขายพร้อม Hardware ได้ราคาสูง</li>
                    <li>• ดู Professional เหมือน Cellebrite</li>
                  </ul>
                </div>
              </div>
            </Card>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="text-center text-sm text-dark-500 py-4 border-t border-dark-700">
        <p>📄 Document Version: 1.0 | Last Updated: January 24, 2026</p>
        <p className="mt-1">🔒 This document is for internal use only</p>
      </div>
    </div>
  );
};

export default SalesDocumentation;
