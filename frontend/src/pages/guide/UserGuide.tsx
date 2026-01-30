/**
 * UserGuide - User Guide InvestiGate
 */
import { 
  BookOpen, Sparkles, Network, Wallet, Phone, MapPin, 
  FileText, Shield, Upload, Search, CheckCircle, ArrowRight,
  Briefcase, DollarSign, QrCode, Lock, Download, Table
} from 'lucide-react';

const UserGuide = () => {
  return (
    <div className="min-h-screen bg-dark-900 text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 py-12">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">User Guide InvestiGate</h1>
              <p className="text-primary-200">Investigation Platform - Digital Forensic Standard</p>
            </div>
          </div>
          <p className="text-primary-100 max-w-2xl">
            Digital case analysis and investigation system for investigators, Digital Forensic standard 
            Supports importing data from Cellebrite, UFED, XRY and court-ready reports
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-12 space-y-12">
        
        {/* Quick Start */}
        <section>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <Sparkles className="text-yellow-400" />
            Getting Started (Quick Start)
          </h2>
          <div className="grid md:grid-cols-4 gap-4">
            {[
              { step: 1, icon: Briefcase, title: 'Create Case', desc: 'Cases → + Create New Case' },
              { step: 2, icon: Upload, title: 'Import Data', desc: 'Smart Import → Upload files' },
              { step: 3, icon: Network, title: 'Analysis', desc: 'View Money Flow, Crypto, Call' },
              { step: 4, icon: FileText, title: 'CreateReport', desc: 'Forensic Report → Export PDF' },
            ].map((item) => (
              <div key={item.step} className="bg-dark-800 border border-dark-700 rounded-xl p-4 relative">
                <div className="absolute -top-3 -left-3 w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center font-bold">
                  {item.step}
                </div>
                <item.icon className="w-8 h-8 text-primary-400 mb-3" />
                <h3 className="font-semibold mb-1">{item.title}</h3>
                <p className="text-sm text-dark-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Menu Guide */}
        <section>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <Search className="text-blue-400" />
            Menu Description
          </h2>
          <div className="space-y-4">
            
            {/* Cases */}
            <div className="bg-dark-800 border border-dark-700 rounded-xl p-5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Briefcase className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Cases - Case Management</h3>
                  <p className="text-dark-400 mb-3">
                    Create and manage all cases. Each case stores data separately 
                    Including damage value, victim count, and suspects
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 bg-dark-700 rounded text-xs">Create New Case</span>
                    <span className="px-2 py-1 bg-dark-700 rounded text-xs">ViewDetails</span>
                    <span className="px-2 py-1 bg-dark-700 rounded text-xs">EditStatus</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Smart Import */}
            <div className="bg-dark-800 border border-dark-700 rounded-xl p-5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-6 h-6 text-yellow-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Smart Import - Intelligent Data Import</h3>
                  <p className="text-dark-400 mb-3">
                    Import data from CSV/Excel files, supports Cellebrite, UFED, XRY 
                    System auto-detects file type and maps columns automatically
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">✓ Auto-detect</span>
                    <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">✓ Auto-link Entities</span>
                    <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">✓ SHA-256 Hash</span>
                    <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">✓ Risk Score</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Money Flow */}
            <div className="bg-dark-800 border border-dark-700 rounded-xl p-5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <DollarSign className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Money Flow - Track Money Trail</h3>
                  <p className="text-dark-400 mb-3">
                    Shows network graph of money transfers between accounts 
                    See connections between persons, bank accounts, and crypto wallets
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 bg-dark-700 rounded text-xs">Network Graph</span>
                    <span className="px-2 py-1 bg-dark-700 rounded text-xs">Export PNG/SVG</span>
                    <span className="px-2 py-1 bg-dark-700 rounded text-xs">Add Node</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Crypto Tracker */}
            <div className="bg-dark-800 border border-dark-700 rounded-xl p-5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Wallet className="w-6 h-6 text-orange-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Crypto Tracker - Cryptocurrency Investigation</h3>
                  <p className="text-dark-400 mb-3">
                    Professional-grade blockchain forensics supporting ETH, BTC, USDT-TRC20, BNB, Polygon.
                    Features real-time OFAC sanctions screening via Chainalysis API and automatic Mixer/Tumbler detection.
                  </p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="px-2 py-1 bg-orange-500/20 text-orange-400 rounded text-xs">✓ Multi-chain (5 blockchains)</span>
                    <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs">✓ OFAC Sanctions Check</span>
                    <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs">✓ Mixer/Tornado Cash Detection</span>
                    <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">✓ Risk Scoring (0-100)</span>
                  </div>
                  <div className="bg-dark-700/50 rounded-lg p-3 text-sm">
                    <p className="text-dark-300 mb-2"><strong>Key Features:</strong></p>
                    <ul className="text-dark-400 space-y-1 text-xs">
                      <li>• <span className="text-red-400">🚨 OFAC Sanctioned Address Detection</span> - Real-time check via Chainalysis API</li>
                      <li>• <span className="text-purple-400">🌀 Mixer Detection</span> - Tornado Cash, Wasabi Mixer automatic flagging</li>
                      <li>• <span className="text-green-400">📊 Risk Score</span> - 0-100 score based on wallet behavior and entity type</li>
                      <li>• <span className="text-blue-400">🏷️ Known Entity Labels</span> - Exchanges, DeFi protocols, sanctioned wallets</li>
                      <li>• <span className="text-yellow-400">📋 Import from CSV</span> - Bulk import transactions via Smart Import</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Call Analysis */}
            <div className="bg-dark-800 border border-dark-700 rounded-xl p-5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Phone className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Call Analysis - Analyze Call Records</h3>
                  <p className="text-dark-400 mb-3">
                    Shows call and SMS network, analyzes frequency and time periods 
                    and finds groups of frequently contacting persons
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 bg-dark-700 rounded text-xs">Link Analysis</span>
                    <span className="px-2 py-1 bg-dark-700 rounded text-xs">Cluster Detection</span>
                    <span className="px-2 py-1 bg-dark-700 rounded text-xs">Timeline</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Location Timeline */}
            <div className="bg-dark-800 border border-dark-700 rounded-xl p-5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Location Timeline - Position Timeline</h3>
                  <p className="text-dark-400 mb-3">
                    Shows target position on map over time 
                    Supports GPS, Cell Tower, WiFi and photos with EXIF
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 bg-dark-700 rounded text-xs">Map</span>
                    <span className="px-2 py-1 bg-dark-700 rounded text-xs">Play Animation</span>
                    <span className="px-2 py-1 bg-dark-700 rounded text-xs">Export KML</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Forensic Report */}
            <div className="bg-dark-800 border border-dark-700 rounded-xl p-5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Forensic Report - Court Standard Report</h3>
                  <p className="text-dark-400 mb-3">
                    Comprehensive case summary report ready for court use.
                    Auto-generates analysis from all imported data including crypto, calls, locations, and bank transactions.
                  </p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded text-xs">✓ Network Graph</span>
                    <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded text-xs">✓ AI Summary</span>
                    <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded text-xs">✓ QR Code Verification</span>
                    <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded text-xs">✓ SHA-256 Hash</span>
                  </div>
                  <div className="bg-dark-700/50 rounded-lg p-3 text-sm">
                    <p className="text-dark-300 mb-2"><strong>Report Sections:</strong></p>
                    <ul className="text-dark-400 space-y-1 text-xs">
                      <li>• <span className="text-green-400">💰 Money Flow Analysis</span> - Bank transfers, layering patterns</li>
                      <li>• <span className="text-orange-400">₿ Crypto Analysis</span> - Wallets, OFAC alerts, Mixer flags</li>
                      <li>• <span className="text-purple-400">📞 Call Analysis</span> - Communication patterns, frequency</li>
                      <li>• <span className="text-red-400">📍 Location Timeline</span> - Movement patterns, key locations</li>
                      <li>• <span className="text-yellow-400">🚩 Red Flags</span> - Auto-detected suspicious activities</li>
                      <li>• <span className="text-blue-400">📋 Investigation Steps</span> - Recommended next actions</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* Chain of Custody */}
        <section>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <Lock className="text-green-400" />
            Chain of Custody - Evidence Preservation
          </h2>
          <div className="bg-dark-800 border border-dark-700 rounded-xl p-6">
            <p className="text-dark-400 mb-4">
              System saves SHA-256 hash of all imported files to confirm evidence was not edited
            </p>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-dark-700 rounded-lg p-4 text-center">
                <Upload className="w-8 h-8 text-primary-400 mx-auto mb-2" />
                <h4 className="font-semibold mb-1">1. Import File</h4>
                <p className="text-xs text-dark-400">System calculates SHA-256 hash automatically</p>
              </div>
              <div className="bg-dark-700 rounded-lg p-4 text-center">
                <QrCode className="w-8 h-8 text-primary-400 mx-auto mb-2" />
                <h4 className="font-semibold mb-1">2. QR Code</h4>
                <p className="text-xs text-dark-400">Scan to verify evidence instantly</p>
              </div>
              <div className="bg-dark-700 rounded-lg p-4 text-center">
                <Shield className="w-8 h-8 text-green-400 mx-auto mb-2" />
                <h4 className="font-semibold mb-1">3. Verify Integrity</h4>
                <p className="text-xs text-dark-400">Compare hash with original</p>
              </div>
            </div>
          </div>
        </section>

        {/* Supported File Types */}
        <section>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <Upload className="text-purple-400" />
            Supported Files
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-dark-800 border border-dark-700 rounded-xl p-5">
              <h3 className="font-semibold mb-3 text-green-400">✓ Mobile Forensic Tools</h3>
              <ul className="space-y-2 text-dark-400 text-sm">
                <li>• Cellebrite UFED Reports (.csv, .xlsx)</li>
                <li>• MSAB XRY Reports (.csv, .xlsx)</li>
                <li>• Oxygen Forensic Reports</li>
                <li>• MOBILedit Reports</li>
              </ul>
            </div>
            <div className="bg-dark-800 border border-dark-700 rounded-xl p-5">
              <h3 className="font-semibold mb-3 text-blue-400">✓ DataGeneral</h3>
              <ul className="space-y-2 text-dark-400 text-sm">
                <li>• Bank Statement (.csv, .xlsx)</li>
                <li>• Call/SMS Records</li>
                <li>• Crypto Transaction Logs</li>
                <li>• GPS/Location Data</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Sample Data Downloads */}
        <section>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <Download className="text-green-400" />
            Sample Data Downloads
          </h2>
          <p className="text-dark-400 mb-6">
            Download these sample files to test the system. All files are in CSV format ready for Smart Import.
            Files include realistic Thai investigation data with various risk patterns.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <a 
              href="/samples/01_CallLogs_Improved.csv" 
              download
              className="flex items-center gap-4 bg-dark-800 border border-dark-700 hover:border-purple-500/50 rounded-xl p-5 transition-colors group"
            >
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Phone className="w-6 h-6 text-purple-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold group-hover:text-purple-400 transition-colors">Call Logs Sample</h3>
                <p className="text-sm text-dark-400">80 records • Multi-device • GPS coordinates</p>
              </div>
              <Download className="w-5 h-5 text-dark-400 group-hover:text-purple-400" />
            </a>

            <a 
              href="/samples/02_BankTransactions_6Banks.csv" 
              download
              className="flex items-center gap-4 bg-dark-800 border border-dark-700 hover:border-green-500/50 rounded-xl p-5 transition-colors group"
            >
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-6 h-6 text-green-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold group-hover:text-green-400 transition-colors">Bank Transactions Sample</h3>
                <p className="text-sm text-dark-400">50 records • 6 Banks • Layering patterns</p>
              </div>
              <Download className="w-5 h-5 text-dark-400 group-hover:text-green-400" />
            </a>

            <a 
              href="/samples/03_CryptoTransactions_BTC_ETH_USDT.csv" 
              download
              className="flex items-center gap-4 bg-dark-800 border border-dark-700 hover:border-orange-500/50 rounded-xl p-5 transition-colors group"
            >
              <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Wallet className="w-6 h-6 text-orange-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold group-hover:text-orange-400 transition-colors">Crypto Transactions Sample</h3>
                <p className="text-sm text-dark-400">8 records • ETH/BTC • OFAC + Tornado Cash samples</p>
                <p className="text-xs text-red-400 mt-1">⚠️ Includes sanctioned wallet examples</p>
              </div>
              <Download className="w-5 h-5 text-dark-400 group-hover:text-orange-400" />
            </a>

            <a 
              href="/samples/04_LocationTimeline_Improved.csv" 
              download
              className="flex items-center gap-4 bg-dark-800 border border-dark-700 hover:border-red-500/50 rounded-xl p-5 transition-colors group"
            >
              <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <MapPin className="w-6 h-6 text-red-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold group-hover:text-red-400 transition-colors">Location Timeline Sample</h3>
                <p className="text-sm text-dark-400">86 records • GPS/Cell Tower • Multi-day</p>
              </div>
              <Download className="w-5 h-5 text-dark-400 group-hover:text-red-400" />
            </a>
          </div>
        </section>

        {/* Required Fields */}
        <section>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <Table className="text-cyan-400" />
            Required Fields for Import
          </h2>
          <p className="text-dark-400 mb-6">
            Below are the required and recommended fields for each data type. Smart Import will auto-detect columns but using these names ensures best results.
          </p>
          
          {/* Call Logs Fields */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Phone className="w-5 h-5 text-purple-400" />
              Call Logs / CDR
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-dark-800 border border-dark-700">
                    <th className="px-4 py-3 text-left font-medium">Field Name</th>
                    <th className="px-4 py-3 text-left font-medium">Required</th>
                    <th className="px-4 py-3 text-left font-medium">Description</th>
                    <th className="px-4 py-3 text-left font-medium">Example</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-700">
                  <tr className="bg-dark-800/50">
                    <td className="px-4 py-3 font-mono text-purple-400">partner_number</td>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded text-xs">Required</span></td>
                    <td className="px-4 py-3 text-dark-400">Phone number contacted</td>
                    <td className="px-4 py-3 text-dark-400">082-345-6789</td>
                  </tr>
                  <tr className="bg-dark-800/50">
                    <td className="px-4 py-3 font-mono text-purple-400">device_number</td>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded text-xs">Recommended</span></td>
                    <td className="px-4 py-3 text-dark-400">Device owner's number</td>
                    <td className="px-4 py-3 text-dark-400">081-234-5678</td>
                  </tr>
                  <tr className="bg-dark-800/50">
                    <td className="px-4 py-3 font-mono text-purple-400">start_time</td>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded text-xs">Recommended</span></td>
                    <td className="px-4 py-3 text-dark-400">Call date/time (ISO format)</td>
                    <td className="px-4 py-3 text-dark-400">2026-01-10T08:15:00</td>
                  </tr>
                  <tr className="bg-dark-800/50">
                    <td className="px-4 py-3 font-mono text-purple-400">duration_sec</td>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 bg-dark-600 text-dark-300 rounded text-xs">Optional</span></td>
                    <td className="px-4 py-3 text-dark-400">Duration in seconds</td>
                    <td className="px-4 py-3 text-dark-400">210</td>
                  </tr>
                  <tr className="bg-dark-800/50">
                    <td className="px-4 py-3 font-mono text-purple-400">direction</td>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 bg-dark-600 text-dark-300 rounded text-xs">Optional</span></td>
                    <td className="px-4 py-3 text-dark-400">INCOMING / OUTGOING / MISSED</td>
                    <td className="px-4 py-3 text-dark-400">OUTGOING</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Bank Transaction Fields */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-400" />
              Bank Transactions
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-dark-800 border border-dark-700">
                    <th className="px-4 py-3 text-left font-medium">Field Name</th>
                    <th className="px-4 py-3 text-left font-medium">Required</th>
                    <th className="px-4 py-3 text-left font-medium">Description</th>
                    <th className="px-4 py-3 text-left font-medium">Example</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-700">
                  <tr className="bg-dark-800/50">
                    <td className="px-4 py-3 font-mono text-green-400">From_Account / To_Account</td>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded text-xs">Required</span></td>
                    <td className="px-4 py-3 text-dark-400">Account number (at least one side)</td>
                    <td className="px-4 py-3 text-dark-400">1234567890</td>
                  </tr>
                  <tr className="bg-dark-800/50">
                    <td className="px-4 py-3 font-mono text-green-400">Amount / Amount_THB</td>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded text-xs">Required</span></td>
                    <td className="px-4 py-3 text-dark-400">Transaction amount</td>
                    <td className="px-4 py-3 text-dark-400">150000</td>
                  </tr>
                  <tr className="bg-dark-800/50">
                    <td className="px-4 py-3 font-mono text-green-400">Date</td>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded text-xs">Recommended</span></td>
                    <td className="px-4 py-3 text-dark-400">Transaction date</td>
                    <td className="px-4 py-3 text-dark-400">2026-01-10</td>
                  </tr>
                  <tr className="bg-dark-800/50">
                    <td className="px-4 py-3 font-mono text-green-400">From_Name / To_Name</td>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 bg-dark-600 text-dark-300 rounded text-xs">Optional</span></td>
                    <td className="px-4 py-3 text-dark-400">Account holder names</td>
                    <td className="px-4 py-3 text-dark-400">John Doe</td>
                  </tr>
                  <tr className="bg-dark-800/50">
                    <td className="px-4 py-3 font-mono text-green-400">From_Bank / To_Bank</td>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 bg-dark-600 text-dark-300 rounded text-xs">Optional</span></td>
                    <td className="px-4 py-3 text-dark-400">Bank names</td>
                    <td className="px-4 py-3 text-dark-400">KBANK, SCB, KTB</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Crypto Transaction Fields */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-orange-400" />
              Crypto Transactions
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-dark-800 border border-dark-700">
                    <th className="px-4 py-3 text-left font-medium">Field Name</th>
                    <th className="px-4 py-3 text-left font-medium">Required</th>
                    <th className="px-4 py-3 text-left font-medium">Description</th>
                    <th className="px-4 py-3 text-left font-medium">Example</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-700">
                  <tr className="bg-dark-800/50">
                    <td className="px-4 py-3 font-mono text-orange-400">From_Wallet / To_Wallet</td>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded text-xs">Required</span></td>
                    <td className="px-4 py-3 text-dark-400">Wallet address (at least one side)</td>
                    <td className="px-4 py-3 text-dark-400">0x1234...abcd</td>
                  </tr>
                  <tr className="bg-dark-800/50">
                    <td className="px-4 py-3 font-mono text-orange-400">Amount</td>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded text-xs">Required</span></td>
                    <td className="px-4 py-3 text-dark-400">Crypto amount</td>
                    <td className="px-4 py-3 text-dark-400">0.5</td>
                  </tr>
                  <tr className="bg-dark-800/50">
                    <td className="px-4 py-3 font-mono text-orange-400">Blockchain</td>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded text-xs">Recommended</span></td>
                    <td className="px-4 py-3 text-dark-400">Chain type</td>
                    <td className="px-4 py-3 text-dark-400">BTC, ETH, USDT</td>
                  </tr>
                  <tr className="bg-dark-800/50">
                    <td className="px-4 py-3 font-mono text-orange-400">TX_Hash</td>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 bg-dark-600 text-dark-300 rounded text-xs">Optional</span></td>
                    <td className="px-4 py-3 text-dark-400">Transaction hash</td>
                    <td className="px-4 py-3 text-dark-400">a1b2c3d4e5...</td>
                  </tr>
                  <tr className="bg-dark-800/50">
                    <td className="px-4 py-3 font-mono text-orange-400">Risk_Flag</td>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 bg-dark-600 text-dark-300 rounded text-xs">Optional</span></td>
                    <td className="px-4 py-3 text-dark-400">Risk indicator</td>
                    <td className="px-4 py-3 text-dark-400">NORMAL, MIXER, SUSPICIOUS</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Location Timeline Fields */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-red-400" />
              Location Timeline
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-dark-800 border border-dark-700">
                    <th className="px-4 py-3 text-left font-medium">Field Name</th>
                    <th className="px-4 py-3 text-left font-medium">Required</th>
                    <th className="px-4 py-3 text-left font-medium">Description</th>
                    <th className="px-4 py-3 text-left font-medium">Example</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-700">
                  <tr className="bg-dark-800/50">
                    <td className="px-4 py-3 font-mono text-red-400">latitude</td>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded text-xs">Required</span></td>
                    <td className="px-4 py-3 text-dark-400">GPS latitude</td>
                    <td className="px-4 py-3 text-dark-400">13.7563</td>
                  </tr>
                  <tr className="bg-dark-800/50">
                    <td className="px-4 py-3 font-mono text-red-400">longitude</td>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded text-xs">Required</span></td>
                    <td className="px-4 py-3 text-dark-400">GPS longitude</td>
                    <td className="px-4 py-3 text-dark-400">100.5018</td>
                  </tr>
                  <tr className="bg-dark-800/50">
                    <td className="px-4 py-3 font-mono text-red-400">date + time / datetime</td>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded text-xs">Recommended</span></td>
                    <td className="px-4 py-3 text-dark-400">Date and time</td>
                    <td className="px-4 py-3 text-dark-400">2026-01-10, 08:00:00</td>
                  </tr>
                  <tr className="bg-dark-800/50">
                    <td className="px-4 py-3 font-mono text-red-400">suspect_id / suspect_name</td>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 bg-dark-600 text-dark-300 rounded text-xs">Optional</span></td>
                    <td className="px-4 py-3 text-dark-400">Person identifier</td>
                    <td className="px-4 py-3 text-dark-400">PHONE_001</td>
                  </tr>
                  <tr className="bg-dark-800/50">
                    <td className="px-4 py-3 font-mono text-red-400">location_name</td>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 bg-dark-600 text-dark-300 rounded text-xs">Optional</span></td>
                    <td className="px-4 py-3 text-dark-400">Place name</td>
                    <td className="px-4 py-3 text-dark-400">Siam Paragon</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <p className="text-blue-400 text-sm">
              <strong>💡 Tip:</strong> Smart Import supports various column name formats (e.g. "phone_number", "Phone Number", "phoneNumber"). 
              The system will auto-detect and map columns for you. For best results, use the exact field names shown above.
            </p>
          </div>
        </section>

        {/* Tips */}
        <section>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <CheckCircle className="text-yellow-400" />
            Usage Tips
          </h2>
          <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-xl p-6">
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <ArrowRight className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <span><strong>Select Case First:</strong> Always select case from left sidebar first. Data is separated by case</span>
              </li>
              <li className="flex items-start gap-3">
                <ArrowRight className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <span><strong>View Sidebar Badge:</strong> Numbers show data count for each type</span>
              </li>
              <li className="flex items-start gap-3">
                <ArrowRight className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <span><strong>Refresh Data:</strong> After importing new data, click "Refresh Data" button below Case Selector</span>
              </li>
              <li className="flex items-start gap-3">
                <ArrowRight className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <span><strong>Export Report:</strong> Use Forensic Report → Print/PDF to print court report</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center text-dark-500 pt-8 border-t border-dark-700">
          <p>InvestiGate v1.0 - Digital Forensic Investigation Platform</p>
          <p className="text-sm mt-2">© 2026 - Digital Investigation Standard</p>
        </footer>

      </div>
    </div>
  );
};

export default UserGuide;
