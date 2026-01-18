/**
 * UserGuide - คู่มือการใช้งาน InvestiGate
 */
import { 
  BookOpen, Sparkles, Network, Wallet, Phone, MapPin, 
  FileText, Shield, Upload, Search, CheckCircle, ArrowRight,
  Briefcase, DollarSign, QrCode, Lock
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
              <h1 className="text-3xl font-bold">คู่มือการใช้งาน InvestiGate</h1>
              <p className="text-primary-200">Investigation Platform - Digital Forensic Standard</p>
            </div>
          </div>
          <p className="text-primary-100 max-w-2xl">
            ระบบวิเคราะห์และสืบสวนคดีดิจิทัล สำหรับเจ้าหน้าที่สืบสวน มาตรฐาน Digital Forensic 
            รองรับการนำเข้าข้อมูลจาก Cellebrite, UFED, XRY และรายงานที่ใช้ได้ในชั้นศาล
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-12 space-y-12">
        
        {/* Quick Start */}
        <section>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <Sparkles className="text-yellow-400" />
            เริ่มต้นใช้งาน (Quick Start)
          </h2>
          <div className="grid md:grid-cols-4 gap-4">
            {[
              { step: 1, icon: Briefcase, title: 'สร้างคดี', desc: 'Cases → + สร้างคดีใหม่' },
              { step: 2, icon: Upload, title: 'นำเข้าข้อมูล', desc: 'Smart Import → อัปโหลดไฟล์' },
              { step: 3, icon: Network, title: 'วิเคราะห์', desc: 'ดู Money Flow, Crypto, Call' },
              { step: 4, icon: FileText, title: 'สร้างรายงาน', desc: 'Forensic Report → Export PDF' },
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
            อธิบายเมนู
          </h2>
          <div className="space-y-4">
            
            {/* Cases */}
            <div className="bg-dark-800 border border-dark-700 rounded-xl p-5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Briefcase className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Cases - จัดการคดี</h3>
                  <p className="text-dark-400 mb-3">
                    สร้างและจัดการคดีทั้งหมด แต่ละคดีจะเก็บข้อมูลแยกกัน 
                    รวมถึงมูลค่าความเสียหาย จำนวนผู้เสียหาย และผู้ต้องสงสัย
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 bg-dark-700 rounded text-xs">สร้างคดีใหม่</span>
                    <span className="px-2 py-1 bg-dark-700 rounded text-xs">ดูรายละเอียด</span>
                    <span className="px-2 py-1 bg-dark-700 rounded text-xs">แก้ไขสถานะ</span>
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
                  <h3 className="text-lg font-semibold mb-2">Smart Import - นำเข้าข้อมูลอัจฉริยะ</h3>
                  <p className="text-dark-400 mb-3">
                    นำเข้าข้อมูลจากไฟล์ CSV/Excel รองรับ Cellebrite, UFED, XRY 
                    ระบบจะ Auto-detect ประเภทไฟล์และ Mapping คอลัมน์อัตโนมัติ
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
                  <h3 className="text-lg font-semibold mb-2">Money Flow - ติดตามเส้นทางเงิน</h3>
                  <p className="text-dark-400 mb-3">
                    แสดง Network Graph ของการโอนเงินระหว่างบัญชี 
                    เห็นความเชื่อมโยงระหว่างบุคคล บัญชีธนาคาร และ Crypto Wallet
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 bg-dark-700 rounded text-xs">Network Graph</span>
                    <span className="px-2 py-1 bg-dark-700 rounded text-xs">Export PNG/SVG</span>
                    <span className="px-2 py-1 bg-dark-700 rounded text-xs">เพิ่ม Node</span>
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
                  <h3 className="text-lg font-semibold mb-2">Crypto Tracker - ติดตาม Cryptocurrency</h3>
                  <p className="text-dark-400 mb-3">
                    ค้นหาและวิเคราะห์ Wallet Address รองรับ ETH, BTC, USDT-TRC20, BNB, Polygon
                    ตรวจจับ Mixer/Tumbler และ Risk Scoring
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
                  <h3 className="text-lg font-semibold mb-2">Call Analysis - วิเคราะห์สายโทร</h3>
                  <p className="text-dark-400 mb-3">
                    แสดง Network ของการโทรและ SMS วิเคราะห์ความถี่ ช่วงเวลา 
                    และค้นหากลุ่มบุคคลที่ติดต่อกันบ่อย
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
                  <h3 className="text-lg font-semibold mb-2">Location Timeline - ไทม์ไลน์ตำแหน่ง</h3>
                  <p className="text-dark-400 mb-3">
                    แสดงตำแหน่งของเป้าหมายบนแผนที่ตามเวลา 
                    รองรับ GPS, Cell Tower, WiFi และรูปภาพที่มี EXIF
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 bg-dark-700 rounded text-xs">แผนที่</span>
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
                  <h3 className="text-lg font-semibold mb-2">Forensic Report - รายงานมาตรฐานศาล</h3>
                  <p className="text-dark-400 mb-3">
                    สร้างรายงานสรุปคดีที่พร้อมนำไปใช้ในชั้นศาล 
                    มี QR Code สำหรับตรวจสอบหลักฐาน และ Chain of Custody
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
            Chain of Custody - การรักษาหลักฐาน
          </h2>
          <div className="bg-dark-800 border border-dark-700 rounded-xl p-6">
            <p className="text-dark-400 mb-4">
              ระบบบันทึก SHA-256 Hash ของทุกไฟล์ที่นำเข้า เพื่อยืนยันว่าหลักฐานไม่ถูกแก้ไข
            </p>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-dark-700 rounded-lg p-4 text-center">
                <Upload className="w-8 h-8 text-primary-400 mx-auto mb-2" />
                <h4 className="font-semibold mb-1">1. นำเข้าไฟล์</h4>
                <p className="text-xs text-dark-400">ระบบคำนวณ SHA-256 Hash อัตโนมัติ</p>
              </div>
              <div className="bg-dark-700 rounded-lg p-4 text-center">
                <QrCode className="w-8 h-8 text-primary-400 mx-auto mb-2" />
                <h4 className="font-semibold mb-1">2. QR Code</h4>
                <p className="text-xs text-dark-400">สแกนเพื่อตรวจสอบหลักฐานได้ทันที</p>
              </div>
              <div className="bg-dark-700 rounded-lg p-4 text-center">
                <Shield className="w-8 h-8 text-green-400 mx-auto mb-2" />
                <h4 className="font-semibold mb-1">3. ยืนยันความถูกต้อง</h4>
                <p className="text-xs text-dark-400">เปรียบเทียบ Hash กับต้นฉบับ</p>
              </div>
            </div>
          </div>
        </section>

        {/* Supported File Types */}
        <section>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <Upload className="text-purple-400" />
            ไฟล์ที่รองรับ
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
              <h3 className="font-semibold mb-3 text-blue-400">✓ ข้อมูลทั่วไป</h3>
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
            เคล็ดลับการใช้งาน
          </h2>
          <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-xl p-6">
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <ArrowRight className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <span><strong>เลือกคดีก่อนทำงาน:</strong> เลือกคดีจาก Sidebar ด้านซ้ายก่อนเสมอ ข้อมูลจะแยกตามคดี</span>
              </li>
              <li className="flex items-start gap-3">
                <ArrowRight className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <span><strong>ดู Badge ใน Sidebar:</strong> ตัวเลขจะบอกจำนวนข้อมูลในแต่ละประเภท</span>
              </li>
              <li className="flex items-start gap-3">
                <ArrowRight className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <span><strong>รีเฟรชข้อมูล:</strong> หลังนำเข้าข้อมูลใหม่ กดปุ่ม "รีเฟรชข้อมูล" ใต้ Case Selector</span>
              </li>
              <li className="flex items-start gap-3">
                <ArrowRight className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <span><strong>Export รายงาน:</strong> ใช้ Forensic Report → Print/PDF เพื่อพิมพ์รายงานส่งศาล</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center text-dark-500 pt-8 border-t border-dark-700">
          <p>InvestiGate v1.0 - Digital Forensic Investigation Platform</p>
          <p className="text-sm mt-2">© 2026 - มาตรฐานการสืบสวนดิจิทัล</p>
        </footer>

      </div>
    </div>
  );
};

export default UserGuide;
