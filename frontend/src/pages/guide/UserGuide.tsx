/**
 * UserGuide - User Guide InvestiGate
 */
import { 
  BookOpen, Sparkles, Network, Wallet, Phone, MapPin, 
  FileText, Shield, Upload, Search, CheckCircle, ArrowRight,
  Briefcase, DollarSign, QrCode, Lock, Download, FileSpreadsheet
} from 'lucide-react';

const UserGuide = () => {
  // Sample files for download
  const sampleFiles = [
    {
      name: '01_CallLogs.csv',
      description: 'Call records - 80 calls, 5 suspects network',
      icon: Phone,
      color: 'purple',
      size: '16 KB'
    },
    {
      name: '02_BankTransactions.csv',
      description: 'Bank transactions - 51 records, 6 banks, money laundering pattern',
      icon: DollarSign,
      color: 'green',
      size: '10 KB'
    },
    {
      name: '03_LocationTimeline.csv',
      description: 'Location timeline - GPS coordinates 5 suspects, border area activity',
      icon: MapPin,
      color: 'red',
      size: '15 KB'
    },
    {
      name: '04_CryptoTransactions_Thai.csv',
      description: 'Crypto transactions - BTC/ETH/USDT, Mixer detected, cross-border',
      icon: Wallet,
      color: 'orange',
      size: '6 KB'
    }
  ];

  const handleDownload = (filename: string) => {
    const link = document.createElement('a');
    link.href = `/samples/${filename}`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadAll = () => {
    sampleFiles.forEach((file, index) => {
      setTimeout(() => {
        handleDownload(file.name);
      }, index * 500);
    });
  };

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

        {/* Sample Files Download */}
        <section>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <Download className="text-cyan-400" />
            Sample Files for Testing
          </h2>
          <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-xl p-6">
            <p className="text-dark-300 mb-4">
              Download sample files to test InvestiGate features. All files are interconnected with the same suspects, 
              dates, and locations - simulating a real money laundering and drug trafficking investigation case.
            </p>
            
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              {sampleFiles.map((file) => (
                <div 
                  key={file.name}
                  className="bg-dark-800 border border-dark-700 rounded-lg p-4 flex items-center gap-4 hover:border-cyan-500/50 transition-colors cursor-pointer group"
                  onClick={() => handleDownload(file.name)}
                >
                  <div className={`w-12 h-12 bg-${file.color}-500/20 rounded-lg flex items-center justify-center flex-shrink-0`}>
                    <file.icon className={`w-6 h-6 text-${file.color}-400`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm truncate group-hover:text-cyan-400 transition-colors">
                      {file.name}
                    </h4>
                    <p className="text-xs text-dark-400 truncate">{file.description}</p>
                    <p className="text-xs text-dark-500">{file.size}</p>
                  </div>
                  <Download className="w-5 h-5 text-dark-500 group-hover:text-cyan-400 transition-colors" />
                </div>
              ))}
            </div>
            
            <button
              onClick={handleDownloadAll}
              className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-all"
            >
              <Download className="w-5 h-5" />
              Download All Sample Files
            </button>
            
            <div className="mt-4 p-4 bg-dark-800 rounded-lg">
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-yellow-400" />
                Case Summary in Sample Files
              </h4>
              <ul className="text-xs text-dark-400 space-y-1">
                <li>• <strong>Suspects:</strong> สมชาย ใจดี (Leader), สมหญิง รักดี (Finance), เดช กล้าหาญ (Transport), แดง สีทอง (Dealer), ดำ สีขาว (Dealer)</li>
                <li>• <strong>Period:</strong> January 10-16, 2026</li>
                <li>• <strong>Pattern:</strong> Victims → Mule accounts → Collection → Crypto conversion → Border transfer</li>
                <li>• <strong>Locations:</strong> Bangkok, Chiang Mai, Mae Sai Border</li>
              </ul>
            </div>
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
                  <h3 className="text-lg font-semibold mb-2">Crypto Tracker - Track Cryptocurrency</h3>
                  <p className="text-dark-400 mb-3">
                    Search and analyze wallet addresses, supports ETH, BTC, USDT-TRC20, BNB, Polygon
                    Detects Mixer/Tumbler and Risk Scoring
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 bg-dark-700 rounded text-xs">Multi-chain</span>
                    <span className="px-2 py-1 bg-dark-700 rounded text-xs">Risk Analysis</span>
                    <span className="px-2 py-1 bg-dark-700 rounded text-xs">Mixer Detection</span>
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
                    Create case summary report ready for court use 
                    Includes QR Code for evidence verification and Chain of Custody
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded text-xs">✓ Network Graph</span>
                    <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded text-xs">✓ Auto Summary</span>
                    <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded text-xs">✓ QR Code</span>
                    <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded text-xs">✓ SHA-256 Hash</span>
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
