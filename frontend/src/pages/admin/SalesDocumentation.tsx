/**
 * Sales Documentation Page
 * Internal documentation for Admin - Security, FAQ, and Deployment Options
 * Access: Super Admin and Org Admin only
 */
import { useState } from 'react';
import { 
  Shield, HelpCircle, Server, Lock, Database, Cloud, 
  Monitor, Key, ChevronDown, ChevronRight,
  AlertTriangle, Clock, HardDrive, Globe, Building, Check
} from 'lucide-react';
import { Card } from '../../components/ui';

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
  const [activeTab, setActiveTab] = useState<TabType>('security');

  const tabs = [
    { id: 'security' as const, label: '🔐 Security & Data Protection', icon: Shield },
    { id: 'faq' as const, label: '❓ Sales FAQ', icon: HelpCircle },
    { id: 'deployment' as const, label: '🖥️ Deployment Options', icon: Server },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">📋 Sales Documentation</h1>
          <p className="text-dark-400 mt-1">
            Internal documentation for sales team - Security, FAQ, and Deployment Options
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
              <StatCard icon={Database} label="Backup Frequency" value="Every 5 minutes" color="border-purple-500" />
              <StatCard icon={Clock} label="Recovery Time" value="< 4 hours" color="border-orange-500" />
            </div>

            {/* Defense in Depth */}
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Shield className="text-primary-400" />
                Defense in Depth (Multi-layer Protection)
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
                      <td className="p-3 text-green-400">Every 5-10 minutes</td>
                      <td className="p-3">7 days</td>
                      <td className="p-3">Primary Region</td>
                    </tr>
                    <tr className="border-b border-dark-700">
                      <td className="p-3 font-medium">Differential</td>
                      <td className="p-3 text-blue-400">Every 12 hours</td>
                      <td className="p-3">30 days</td>
                      <td className="p-3">Primary Region</td>
                    </tr>
                    <tr className="border-b border-dark-700">
                      <td className="p-3 font-medium">Full Backup</td>
                      <td className="p-3 text-purple-400">Daily (2:00 AM)</td>
                      <td className="p-3">90 days</td>
                      <td className="p-3">Primary + Secondary</td>
                    </tr>
                    <tr className="border-b border-dark-700">
                      <td className="p-3 font-medium">Monthly Archive</td>
                      <td className="p-3 text-orange-400">1st of month</td>
                      <td className="p-3">1 year</td>
                      <td className="p-3">Geo-Redundant</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium">Yearly Archive</td>
                      <td className="p-3 text-red-400">January 1st</td>
                      <td className="p-3">7 years</td>
                      <td className="p-3">Geo-Redundant + Offline</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-dark-700 rounded-lg p-4">
                  <h4 className="font-bold text-red-400">Hardware Failure</h4>
                  <p className="text-sm text-dark-400 mt-1">RTO: &lt; 1 hours</p>
                  <p className="text-sm text-dark-400">RPO: &lt; 5 minutes</p>
                </div>
                <div className="bg-dark-700 rounded-lg p-4">
                  <h4 className="font-bold text-orange-400">Ransomware Attack</h4>
                  <p className="text-sm text-dark-400 mt-1">RTO: &lt; 8 hours</p>
                  <p className="text-sm text-dark-400">RPO: &lt; 24 hours</p>
                </div>
                <div className="bg-dark-700 rounded-lg p-4">
                  <h4 className="font-bold text-yellow-400">Complete Disaster</h4>
                  <p className="text-sm text-dark-400 mt-1">RTO: &lt; 24 hours</p>
                  <p className="text-sm text-dark-400">RPO: &lt; 24 hours</p>
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
                  Backup uses <strong>WORM (Write Once Read Many)</strong> technology - 
                  Cannot be edited or deleted even by admin or ransomware
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
              <h2 className="text-xl font-bold mb-3">💡 Elevator Pitch (30 seconds)</h2>
              <p className="text-dark-200 italic">
                "InvestiGate is a digital financial investigation platform for investigation agencies, supporting both Cloud and on-premises installation 
                Features 2FA, Backup automaticEvery 5 minutes, and Immutable backup for Ransomware protection"
              </p>
            </Card>

            {/* Key Selling Points */}
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">⭐ Key Selling Points</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-dark-700 rounded-lg p-4">
                  <div className="text-2xl mb-2">🔐</div>
                  <h4 className="font-bold">High Security</h4>
                  <p className="text-sm text-dark-400">2FA, Encryption, Audit log</p>
                </div>
                <div className="bg-dark-700 rounded-lg p-4">
                  <div className="text-2xl mb-2">💾</div>
                  <h4 className="font-bold">Backup Every 5 minutes</h4>
                  <p className="text-sm text-dark-400">No data loss possible</p>
                </div>
                <div className="bg-dark-700 rounded-lg p-4">
                  <div className="text-2xl mb-2">🏢</div>
                  <h4 className="font-bold">On-Premises Option</h4>
                  <p className="text-sm text-dark-400">Data stays within organization</p>
                </div>
                <div className="bg-dark-700 rounded-lg p-4">
                  <div className="text-2xl mb-2">📚</div>
                  <h4 className="font-bold">Easy to Use</h4>
                  <p className="text-sm text-dark-400">1-day training to get started</p>
                </div>
                <div className="bg-dark-700 rounded-lg p-4">
                  <div className="text-2xl mb-2">🇹🇭</div>
                  <h4 className="font-bold">Thai Support</h4>
                  <p className="text-sm text-dark-400">Response within 4 hours</p>
                </div>
                <div className="bg-dark-700 rounded-lg p-4">
                  <div className="text-2xl mb-2">💰</div>
                  <h4 className="font-bold">5x Cheaper</h4>
                  <p className="text-sm text-dark-400">Compared to Cellebrite</p>
                </div>
              </div>
            </Card>

            {/* FAQ Categories */}
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <HelpCircle className="text-primary-400" />
                🔐 Security Questions
              </h2>
              
              <div className="divide-y divide-dark-600">
                <FAQItem 
                  question='Q1: "Where is our case data stored? Is there risk of leakage?"'
                  answer={
                    <div className="space-y-3">
                      <p>Data is stored in Microsoft Azure Data Center in Singapore (Southeast Asia) which meets ISO 27001, SOC 2, and CSA STAR Level 2 standards</p>
                      <div className="bg-dark-700 rounded p-3">
                        <p className="font-bold text-green-400 mb-2">Leak prevention:</p>
                        <ul className="text-sm space-y-1">
                          <li>• All data encrypted with AES-256</li>
                          <li>• Access requires 2-factor authentication (password + OTP)</li>
                          <li>• Audit log records all access</li>
                          <li>• Our staff cannot access case data (Zero Access Architecture)</li>
                        </ul>
                      </div>
                      <p className="text-primary-400">
                        <strong>Alternative:</strong> For maximum security, we offer <strong>On-Premises Version</strong> that installs on your own server. Data never leaves your organization
                      </p>
                    </div>
                  }
                />

                <FAQItem 
                  question='Q2: "If hit by Ransomware, will data be lost??"'
                  answer={
                    <div className="space-y-3">
                      <p>We designed multi-layer Ransomware protection:</p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="bg-dark-700 rounded p-3">
                          <p className="font-bold text-blue-400 mb-1">1. Prevention</p>
                          <ul className="text-xs space-y-1">
                            <li>• Web Application Firewall</li>
                            <li>• No direct file upload channels</li>
                            <li>• Input Validation</li>
                          </ul>
                        </div>
                        <div className="bg-dark-700 rounded p-3">
                          <p className="font-bold text-green-400 mb-1">2. Backup that cannot be attacked</p>
                          <ul className="text-xs space-y-1">
                            <li>• Immutable Backup</li>
                            <li>• Backup Every 5 minutes</li>
                            <li>• Offline Backup (Air-gap)</li>
                          </ul>
                        </div>
                        <div className="bg-dark-700 rounded p-3">
                          <p className="font-bold text-orange-400 mb-1">3. Recovery</p>
                          <ul className="text-xs space-y-1">
                            <li>• Recovery within 4-8 hours</li>
                            <li>• Data loss maximum 24 hours</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  }
                />

                <FAQItem 
                  question='Q3: "How does System Backup work? How often is backup?"'
                  answer={
                    <div className="space-y-3">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-dark-600">
                            <th className="text-left p-2">Type</th>
                            <th className="text-left p-2">Frequency</th>
                            <th className="text-left p-2">Retention</th>
                          </tr>
                        </thead>
                        <tbody className="text-dark-300">
                          <tr className="border-b border-dark-700">
                            <td className="p-2">Transaction Log</td>
                            <td className="p-2 text-green-400">Every 5-10 minutes</td>
                            <td className="p-2">7 days</td>
                          </tr>
                          <tr className="border-b border-dark-700">
                            <td className="p-2">Full Backup</td>
                            <td className="p-2 text-blue-400">Daily</td>
                            <td className="p-2">90 days</td>
                          </tr>
                          <tr>
                            <td className="p-2">Archive</td>
                            <td className="p-2 text-purple-400">Monthly</td>
                            <td className="p-2">1 year</td>
                          </tr>
                        </tbody>
                      </table>
                      <div className="bg-dark-700 rounded p-3">
                        <p className="font-bold text-primary-400 mb-1">Highlights:</p>
                        <ul className="text-sm space-y-1">
                          <li>• Backup automatic no manual work needed</li>
                          <li>• Point-in-time recovery for the past 7 days</li>
                          <li>• Backup stored separately from Production (Different data center)</li>
                        </ul>
                      </div>
                    </div>
                  }
                />

                <FAQItem 
                  question='Q4: "Who can access our data??"'
                  answer={
                    <div className="space-y-3">
                      <p className="font-bold">Within your organization:</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        <div className="bg-dark-700 rounded p-2">
                          <span className="text-red-400 font-bold">Super Admin</span> - Access everything + manage users
                        </div>
                        <div className="bg-dark-700 rounded p-2">
                          <span className="text-orange-400 font-bold">Org Admin</span> - Access cases in organization
                        </div>
                        <div className="bg-dark-700 rounded p-2">
                          <span className="text-blue-400 font-bold">Investigator</span> - Access only self-created cases
                        </div>
                        <div className="bg-dark-700 rounded p-2">
                          <span className="text-green-400 font-bold">Viewer</span> - Read only
                        </div>
                      </div>
                      <div className="bg-yellow-500/20 border border-yellow-500/50 rounded p-3">
                        <p className="font-bold text-yellow-400">Our team:</p>
                        <ul className="text-sm space-y-1">
                          <li>• <strong>Cannot</strong>access case data (Zero Access)</li>
                          <li>• All access has Audit log</li>
                        </ul>
                      </div>
                    </div>
                  }
                />

                <FAQItem 
                  question='Q5: "If employee resigns, how to prevent access??"'
                  answer={
                    <div className="space-y-3">
                      <div className="bg-dark-700 rounded p-3">
                        <p className="font-bold text-green-400 mb-2">Measures:</p>
                        <ol className="text-sm space-y-1 list-decimal list-inside">
                          <li>Admin can <strong>Disable account immediately</strong> - stops access instantly</li>
                          <li>All user sessions will be terminated</li>
                          <li>System records what the user did before leaving (Audit trail)</li>
                          <li>Can export usage history as report</li>
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
                💰 Pricing and Service Questions
              </h2>
              
              <div className="divide-y divide-dark-600">
                <FAQItem 
                  question='Q6: "How much is the price? How is it calculated?"'
                  answer={
                    <div className="space-y-4">
                      <div>
                        <p className="font-bold text-blue-400 mb-2">Cloud Version (SaaS):</p>
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-dark-600">
                              <th className="text-left p-2">Package</th>
                              <th className="text-left p-2">Price/user/year</th>
                              <th className="text-left p-2">Number of Users</th>
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
                              <th className="text-left p-2">Item</th>
                              <th className="text-left p-2">Pricing</th>
                            </tr>
                          </thead>
                          <tbody className="text-dark-300">
                            <tr className="border-b border-dark-700">
                              <td className="p-2">License (one-time)</td>
                              <td className="p-2 text-green-400">฿500,000</td>
                            </tr>
                            <tr className="border-b border-dark-700">
                              <td className="p-2">Installation</td>
                              <td className="p-2">฿100,000</td>
                            </tr>
                            <tr className="border-b border-dark-700">
                              <td className="p-2">Annual Support</td>
                              <td className="p-2">฿150,000/year</td>
                            </tr>
                            <tr>
                              <td className="p-2">Training</td>
                              <td className="p-2">฿30,000/session</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <p className="text-xs text-dark-400">*Price excludes 7% VAT</p>
                    </div>
                  }
                />

                <FAQItem 
                  question='Q7: "What support is available??"'
                  answer={
                    <div>
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-dark-600">
                            <th className="text-left p-2">Level</th>
                            <th className="text-left p-2">Channel</th>
                            <th className="text-left p-2">Response Time</th>
                          </tr>
                        </thead>
                        <tbody className="text-dark-300">
                          <tr className="border-b border-dark-700">
                            <td className="p-2">Standard</td>
                            <td className="p-2">LINE, Email</td>
                            <td className="p-2">Within 24 hours</td>
                          </tr>
                          <tr className="border-b border-dark-700">
                            <td className="p-2 text-blue-400">Priority</td>
                            <td className="p-2">LINE, Email, Phone</td>
                            <td className="p-2 text-green-400">Within 4 hours</td>
                          </tr>
                          <tr>
                            <td className="p-2 text-purple-400">Enterprise</td>
                            <td className="p-2">Dedicated Support</td>
                            <td className="p-2 text-green-400">Within 1 hour</td>
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
                🏛️ Questions from Government Agencies
              </h2>
              
              <div className="divide-y divide-dark-600">
                <FAQItem 
                  question='Q9: "What standards does this system meet??"'
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
                        <p className="font-bold text-yellow-400">In progress:</p>
                        <ul className="text-sm space-y-1">
                          <li>• ISO 27001 (Application level) - Q3 2026</li>
                          <li>• SOC 2 Type II - Q4 2026</li>
                        </ul>
                      </div>
                    </div>
                  }
                />

                <FAQItem 
                  question='Q10: "Can we install on our organization's server??"'
                  answer={
                    <div className="space-y-3">
                      <p className="text-green-400 font-bold">✅ Yes! We have On-Premises Version</p>
                      <div className="bg-dark-700 rounded p-3">
                        <p className="font-bold mb-2">What you need to prepare:</p>
                        <ul className="text-sm space-y-1">
                          <li>• Server per specified specs</li>
                          <li>• SQL Server License (or use PostgreSQL free)</li>
                          <li>• IT Team to maintain system</li>
                        </ul>
                      </div>
                      <div className="bg-dark-700 rounded p-3">
                        <p className="font-bold mb-2">We provide:</p>
                        <ul className="text-sm space-y-1">
                          <li>• System installation</li>
                          <li>• Training IT Team</li>
                          <li>• Complete documentation</li>
                          <li>• Remote support</li>
                        </ul>
                      </div>
                    </div>
                  }
                />

                <FAQItem 
                  question='Q11: "Can data be used as evidence in court??"'
                  answer={
                    <div className="space-y-3">
                      <p className="text-green-400 font-bold">✅ Yes, the system is designed to support:</p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="bg-dark-700 rounded p-3">
                          <p className="font-bold text-blue-400 mb-1">Chain of Custody</p>
                          <ul className="text-xs space-y-1">
                            <li>• Every action has timestamp + user ID + IP</li>
                            <li>• Cannot edit historical logs</li>
                          </ul>
                        </div>
                        <div className="bg-dark-700 rounded p-3">
                          <p className="font-bold text-green-400 mb-1">Data Integrity</p>
                          <ul className="text-xs space-y-1">
                            <li>• Hash verification for files</li>
                            <li>• Prove files were not edited</li>
                          </ul>
                        </div>
                        <div className="bg-dark-700 rounded p-3">
                          <p className="font-bold text-purple-400 mb-1">Export for Court</p>
                          <ul className="text-xs space-y-1">
                            <li>• Report with Audit trail</li>
                            <li>• PDF with digital signature</li>
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
                      <td className="p-3 text-red-400">"Too expensive"</td>
                      <td className="p-3">"Compared to Cellebrite starting at $10,000/year we are 5x cheaper"</td>
                    </tr>
                    <tr className="border-b border-dark-700">
                      <td className="p-3 text-red-400">"Afraid of data leak"</td>
                      <td className="p-3">"We have On-Premises that installs on your server"</td>
                    </tr>
                    <tr className="border-b border-dark-700">
                      <td className="p-3 text-red-400">"No IT to maintain"</td>
                      <td className="p-3">"Cloud version needs no maintenance, we manage everything"</td>
                    </tr>
                    <tr>
                      <td className="p-3 text-red-400">"Must pass NBTC"</td>
                      <td className="p-3">"Supports PDPA and working on ISO 27001"</td>
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
                          <li>• Easy install (Download → Install)</li>
                          <li>• License: Hardware binding</li>
                          <li>• Dev time: 10-12 weeks</li>
                        </ul>
                      </div>
                      <div className="bg-dark-700 rounded p-3">
                        <p className="font-bold text-sm text-orange-400">Option 2: Linux Appliance</p>
                        <ul className="text-xs mt-2 space-y-1">
                          <li>• Sell with Notebook</li>
                          <li>• Offline 100%</li>
                          <li>• Dev time: 8-11 weeks</li>
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
                Desktop App - Development Details
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Windows App */}
                <div className="bg-dark-700 rounded-lg p-6">
                  <h3 className="text-lg font-bold text-blue-400 mb-4">🪟 Windows Desktop App (Tauri)</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-dark-400 mb-2">Assessment:</p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>Feasibility:</div>
                        <div className="text-green-400">⭐⭐⭐⭐⭐ (95%)</div>
                        <div>Difficulty:</div>
                        <div className="text-yellow-400">🟡 Medium</div>
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
                            <td className="py-1 text-right">1-2 weeks</td>
                          </tr>
                          <tr className="border-b border-dark-600">
                            <td className="py-1">Convert FastAPI → Rust/SQLite</td>
                            <td className="py-1 text-right">3-4 weeks</td>
                          </tr>
                          <tr className="border-b border-dark-600">
                            <td className="py-1">License System</td>
                            <td className="py-1 text-right">2 weeks</td>
                          </tr>
                          <tr className="border-b border-dark-600">
                            <td className="py-1">Windows Installer</td>
                            <td className="py-1 text-right">1 weeks</td>
                          </tr>
                          <tr className="border-b border-dark-600">
                            <td className="py-1">Testing</td>
                            <td className="py-1 text-right">2 weeks</td>
                          </tr>
                          <tr className="font-bold">
                            <td className="py-1">Total</td>
                            <td className="py-1 text-right text-green-400">10-12 weeks</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div>
                      <p className="text-sm text-dark-400 mb-2">Selling price:</p>
                      <p className="text-lg font-bold text-green-400">฿80,000 (perpetual) or ฿30,000/year</p>
                      <p className="text-xs text-dark-400">+ Annual Support ฿15,000/year</p>
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
                        <div>Feasibility:</div>
                        <div className="text-green-400">⭐⭐⭐⭐ (80%)</div>
                        <div>Difficulty:</div>
                        <div className="text-red-400">🔴 High</div>
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
                            <td className="py-1 text-right">2-3 weeks</td>
                          </tr>
                          <tr className="border-b border-dark-600">
                            <td className="py-1">Auto-start Service</td>
                            <td className="py-1 text-right">1 weeks</td>
                          </tr>
                          <tr className="border-b border-dark-600">
                            <td className="py-1">Hardware Binding (License)</td>
                            <td className="py-1 text-right">2-3 weeks</td>
                          </tr>
                          <tr className="border-b border-dark-600">
                            <td className="py-1">BIOS lock + Secure boot</td>
                            <td className="py-1 text-right">1-2 weeks</td>
                          </tr>
                          <tr className="border-b border-dark-600">
                            <td className="py-1">Testing</td>
                            <td className="py-1 text-right">2 weeks</td>
                          </tr>
                          <tr className="font-bold">
                            <td className="py-1">Total</td>
                            <td className="py-1 text-right text-orange-400">8-11 weeks</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div>
                      <p className="text-sm text-dark-400 mb-2">Selling price:</p>
                      <p className="text-lg font-bold text-green-400">฿135,000 - 145,000 per set</p>
                      <p className="text-xs text-dark-400">(Total Notebook + Software + Setup)</p>
                      <p className="text-xs text-dark-400">+ Annual Support ฿30,000/year</p>
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
                    <p className="text-xs text-dark-400 mt-1">Ping server every 7 days, Grace period 14 days</p>
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
              <h2 className="text-xl font-bold mb-4">🎯 Development Recommendations</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-dark-800/50 rounded-lg p-4">
                  <h4 className="font-bold text-green-400 mb-2">✅ Short-term (do first): Windows Desktop App</h4>
                  <ul className="text-sm space-y-1">
                    <li>• Can use existing React code</li>
                    <li>• Broader market (everyone has Windows)</li>
                    <li>• Better license protection (Rust binary)</li>
                    <li>• Low cost, no hardware purchase needed</li>
                  </ul>
                </div>
                <div className="bg-dark-800/50 rounded-lg p-4">
                  <h4 className="font-bold text-blue-400 mb-2">📌 Long-term (Phase 2): Linux Appliance</h4>
                  <ul className="text-sm space-y-1">
                    <li>• For premium customers</li>
                    <li>• Need 100% offline</li>
                    <li>• Can sell with hardware at high price</li>
                    <li>• Professional look like Cellebrite</li>
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
