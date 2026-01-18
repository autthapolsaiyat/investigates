/**
 * Landing Page - InvestiGate SaaS
 * หน้าขายสินค้า
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Shield, Network, Wallet, Phone, MapPin, FileText,
  CheckCircle, ArrowRight, Play,
  ChevronDown, ChevronUp, Users, Lock, Globe,
  Sparkles, QrCode, BarChart3
} from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  
  // Check if user is already logged in
  const isAuthenticated = !!localStorage.getItem('access_token');

  const features = [
    {
      icon: Sparkles,
      title: 'Smart Import',
      desc: 'นำเข้าข้อมูลอัตโนมัติ รองรับ Cellebrite, UFED, XRY',
      color: 'text-yellow-400 bg-yellow-500/20'
    },
    {
      icon: Network,
      title: 'Money Flow',
      desc: 'วิเคราะห์เส้นทางเงินด้วย Network Graph',
      color: 'text-green-400 bg-green-500/20'
    },
    {
      icon: Wallet,
      title: 'Crypto Tracker',
      desc: 'ติดตาม Cryptocurrency ทุก Chain',
      color: 'text-orange-400 bg-orange-500/20'
    },
    {
      icon: Phone,
      title: 'Call Analysis',
      desc: 'วิเคราะห์สายโทรและ SMS',
      color: 'text-purple-400 bg-purple-500/20'
    },
    {
      icon: MapPin,
      title: 'Location Timeline',
      desc: 'ติดตามตำแหน่งบนแผนที่',
      color: 'text-red-400 bg-red-500/20'
    },
    {
      icon: FileText,
      title: 'Forensic Report',
      desc: 'รายงานมาตรฐานศาล พร้อม QR Code',
      color: 'text-cyan-400 bg-cyan-500/20'
    }
  ];

  const pricing = [
    {
      name: 'Starter',
      price: '30,000',
      period: '/คน/ปี',
      desc: 'เหมาะสำหรับเริ่มต้น',
      features: [
        '1 User License',
        'สร้างคดีไม่จำกัด',
        'Smart Import',
        'Money Flow Analysis',
        'Crypto Tracker',
        'Forensic Report',
        'พื้นที่เก็บข้อมูล 5GB',
        'Email Support'
      ],
      highlight: false,
      cta: 'เริ่มต้นใช้งาน'
    },
    {
      name: 'Professional',
      price: '60,000',
      period: '/คน/ปี',
      desc: 'สำหรับงานสืบสวนขั้นสูง',
      features: [
        '1 User License',
        'ทุกอย่างใน Starter',
        'Call Analysis',
        'Location Timeline',
        'Chain of Custody',
        'พื้นที่เก็บข้อมูล 20GB',
        'Priority Support',
        'Online Training'
      ],
      highlight: true,
      cta: 'แนะนำ'
    },
    {
      name: 'Enterprise',
      price: '120,000',
      period: '/คน/ปี',
      desc: 'สำหรับหน่วยงานขนาดใหญ่',
      features: [
        '1 User License',
        'ทุกอย่างใน Professional',
        'API Access',
        'Custom Integration',
        'พื้นที่เก็บข้อมูล 100GB',
        'Dedicated Support',
        'On-site Training',
        'SLA 99.9%'
      ],
      highlight: false,
      cta: 'ติดต่อเรา'
    }
  ];

  const faqs = [
    {
      q: 'InvestiGate เหมาะกับใคร?',
      a: 'InvestiGate ออกแบบมาสำหรับเจ้าหน้าที่สืบสวน ตำรวจ และหน่วยงานที่ต้องการวิเคราะห์ข้อมูลดิจิทัลในคดีอาชญากรรมทางการเงิน ยาเสพติด และอื่นๆ'
    },
    {
      q: 'รองรับไฟล์อะไรบ้าง?',
      a: 'รองรับไฟล์จาก Cellebrite UFED, MSAB XRY, Oxygen Forensic และไฟล์ CSV/Excel ทั่วไป เช่น Bank Statement, Call Records, Crypto Transactions'
    },
    {
      q: 'ข้อมูลปลอดภัยไหม?',
      a: 'ข้อมูลถูกเข้ารหัสทั้งขณะส่งและจัดเก็บ (Encryption at rest & in transit) เก็บบน Azure Cloud มาตรฐาน ISO 27001 และมีระบบ Chain of Custody ยืนยันความถูกต้องด้วย SHA-256 Hash'
    },
    {
      q: 'ใช้ในศาลได้ไหม?',
      a: 'ได้ ระบบสร้างรายงานตามมาตรฐาน Digital Forensic มี Chain of Custody, QR Code สำหรับตรวจสอบหลักฐาน และ SHA-256 Hash ยืนยันว่าข้อมูลไม่ถูกแก้ไข'
    },
    {
      q: 'มีอบรมการใช้งานไหม?',
      a: 'มีบริการอบรม 2 วัน (คิดแยก) โดยวิทยากรผู้เชี่ยวชาญ สามารถอบรม On-site หรือ Online ได้'
    },
    {
      q: 'ยกเลิกได้ไหม?',
      a: 'สามารถยกเลิกได้ทุกเมื่อ แต่ไม่มีการคืนเงินสำหรับระยะเวลาที่เหลือ ข้อมูลจะถูกเก็บไว้ 30 วันหลังหมดอายุ'
    }
  ];

  const stats = [
    { value: '500+', label: 'คดีที่วิเคราะห์' },
    { value: '50+', label: 'หน่วยงานใช้งาน' },
    { value: '99.9%', label: 'Uptime' },
    { value: '24/7', label: 'Support' }
  ];

  return (
    <div className="min-h-screen bg-dark-900 text-white">
      
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-dark-900/80 backdrop-blur-lg border-b border-dark-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center">
                <Search className="text-white" size={20} />
              </div>
              <span className="text-xl font-bold">InvestiGate</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-dark-300 hover:text-white transition-colors">คุณสมบัติ</a>
              <a href="#pricing" className="text-dark-300 hover:text-white transition-colors">ราคา</a>
              <a href="#faq" className="text-dark-300 hover:text-white transition-colors">คำถาม</a>
              <a href="/guide" target="_blank" className="text-dark-300 hover:text-white transition-colors">คู่มือ</a>
            </div>
            <div className="flex items-center gap-4">
              {isAuthenticated ? (
                <button
                  onClick={() => navigate('/app/dashboard')}
                  className="px-4 py-2 bg-primary-500 hover:bg-primary-600 rounded-lg font-medium transition-colors"
                >
                  เข้าสู่ Dashboard
                </button>
              ) : (
                <>
                  <button
                    onClick={() => navigate('/login')}
                    className="text-dark-300 hover:text-white transition-colors"
                  >
                    เข้าสู่ระบบ
                  </button>
                  <button
                    onClick={() => navigate('/login')}
                    className="px-4 py-2 bg-primary-500 hover:bg-primary-600 rounded-lg font-medium transition-colors"
                  >
                    ทดลองใช้ฟรี
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500/20 rounded-full text-primary-400 text-sm mb-6">
                <Sparkles size={16} />
                <span>Digital Forensic Platform</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                วิเคราะห์คดีดิจิทัล
                <br />
                <span className="text-primary-400">มาตรฐานศาล</span>
              </h1>
              <p className="text-xl text-dark-400 mb-8 max-w-lg">
                นำเข้าข้อมูลจาก Cellebrite, UFED, XRY วิเคราะห์เส้นทางเงิน Crypto 
                สร้างรายงานที่ใช้ในชั้นศาลได้ทันที
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => navigate('/login')}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 rounded-lg font-medium transition-colors"
                >
                  เริ่มใช้งานฟรี 14 วัน
                  <ArrowRight size={20} />
                </button>
                <button className="flex items-center justify-center gap-2 px-6 py-3 border border-dark-600 hover:border-dark-500 rounded-lg font-medium transition-colors">
                  <Play size={20} />
                  ดูวิดีโอสาธิต
                </button>
              </div>
              <div className="flex items-center gap-6 mt-8 text-sm text-dark-400">
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-400" />
                  <span>ไม่ต้องใส่บัตรเครดิต</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-400" />
                  <span>ยกเลิกได้ทุกเมื่อ</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-dark-800 to-dark-900 border border-dark-700 rounded-2xl p-4 shadow-2xl">
                <img
                  src="https://via.placeholder.com/600x400/1a1a2e/4f46e5?text=InvestiGate+Dashboard"
                  alt="InvestiGate Dashboard"
                  className="rounded-lg w-full"
                />
              </div>
              {/* Floating cards */}
              <div className="absolute -left-6 top-1/4 bg-dark-800 border border-dark-700 rounded-xl p-4 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <Shield className="text-green-400" size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-dark-400">Chain of Custody</p>
                    <p className="font-semibold text-green-400">SHA-256 Verified</p>
                  </div>
                </div>
              </div>
              <div className="absolute -right-6 bottom-1/4 bg-dark-800 border border-dark-700 rounded-xl p-4 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-500/20 rounded-lg flex items-center justify-center">
                    <BarChart3 className="text-primary-400" size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-dark-400">Network Analysis</p>
                    <p className="font-semibold">247 Nodes</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-y border-dark-700 bg-dark-800/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-primary-400">{stat.value}</p>
                <p className="text-dark-400 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">คุณสมบัติครบครัน</h2>
            <p className="text-dark-400 max-w-2xl mx-auto">
              เครื่องมือวิเคราะห์ข้อมูลดิจิทัลครบวงจร ตั้งแต่นำเข้าข้อมูลจนถึงสร้างรายงานส่งศาล
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div
                key={i}
                className="bg-dark-800 border border-dark-700 rounded-xl p-6 hover:border-primary-500/50 transition-colors"
              >
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${feature.color}`}>
                  <feature.icon size={24} />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-dark-400">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security */}
      <section className="py-20 px-6 bg-dark-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                ปลอดภัยระดับ
                <span className="text-primary-400"> Enterprise</span>
              </h2>
              <p className="text-dark-400 mb-8">
                ข้อมูลคดีของคุณถูกปกป้องด้วยมาตรฐานความปลอดภัยสูงสุด 
                เหมาะสำหรับข้อมูลที่เป็นความลับ
              </p>
              <div className="space-y-4">
                {[
                  { icon: Lock, text: 'Encryption at rest & in transit (AES-256)' },
                  { icon: Shield, text: 'Chain of Custody ด้วย SHA-256 Hash' },
                  { icon: QrCode, text: 'QR Code ตรวจสอบหลักฐาน' },
                  { icon: Globe, text: 'Azure Cloud - ISO 27001 Certified' },
                  { icon: Users, text: 'Role-based Access Control' }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <item.icon className="text-green-400" size={20} />
                    </div>
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gradient-to-br from-dark-800 to-dark-900 border border-dark-700 rounded-2xl p-8">
              <div className="text-center">
                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Shield className="text-green-400" size={40} />
                </div>
                <h3 className="text-2xl font-bold mb-2">Court-Ready Reports</h3>
                <p className="text-dark-400 mb-6">
                  รายงานที่สร้างจากระบบสามารถใช้เป็นหลักฐานในชั้นศาลได้
                </p>
                <div className="flex justify-center gap-4">
                  <div className="px-4 py-2 bg-dark-700 rounded-lg text-sm">
                    <CheckCircle className="inline text-green-400 mr-2" size={16} />
                    SHA-256 Verified
                  </div>
                  <div className="px-4 py-2 bg-dark-700 rounded-lg text-sm">
                    <CheckCircle className="inline text-green-400 mr-2" size={16} />
                    QR Verification
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">ราคาที่คุ้มค่า</h2>
            <p className="text-dark-400 max-w-2xl mx-auto">
              เลือกแพ็คเกจที่เหมาะกับความต้องการของคุณ (ราคายังไม่รวม VAT 7%)
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {pricing.map((plan, i) => (
              <div
                key={i}
                className={`relative rounded-2xl p-8 ${
                  plan.highlight
                    ? 'bg-gradient-to-b from-primary-500/20 to-dark-800 border-2 border-primary-500'
                    : 'bg-dark-800 border border-dark-700'
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary-500 rounded-full text-sm font-medium">
                    แนะนำ
                  </div>
                )}
                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <p className="text-dark-400 text-sm mb-4">{plan.desc}</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold">฿{plan.price}</span>
                  <span className="text-dark-400">{plan.period}</span>
                </div>
                <button
                  onClick={() => navigate('/login')}
                  className={`w-full py-3 rounded-lg font-medium transition-colors mb-6 ${
                    plan.highlight
                      ? 'bg-primary-500 hover:bg-primary-600'
                      : 'bg-dark-700 hover:bg-dark-600'
                  }`}
                >
                  {plan.cta}
                </button>
                <ul className="space-y-3">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-center gap-3 text-sm">
                      <CheckCircle size={16} className="text-green-400 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="text-center mt-8 text-dark-400">
            <p>* ค่าอบรมคิดแยก เริ่มต้น ฿10,000/คน (2 วัน)</p>
            <p>* Volume discount สำหรับ 5+ licenses - ติดต่อเรา</p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 px-6 bg-dark-800/50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">คำถามที่พบบ่อย</h2>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="bg-dark-800 border border-dark-700 rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left"
                >
                  <span className="font-medium">{faq.q}</span>
                  {openFaq === i ? (
                    <ChevronUp size={20} className="text-dark-400" />
                  ) : (
                    <ChevronDown size={20} className="text-dark-400" />
                  )}
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 text-dark-400">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            พร้อมเริ่มวิเคราะห์คดีแล้วหรือยัง?
          </h2>
          <p className="text-xl text-dark-400 mb-8">
            ทดลองใช้ฟรี 14 วัน ไม่ต้องใส่บัตรเครดิต
          </p>
          <button
            onClick={() => navigate('/login')}
            className="inline-flex items-center gap-2 px-8 py-4 bg-primary-500 hover:bg-primary-600 rounded-lg font-medium text-lg transition-colors"
          >
            เริ่มใช้งานฟรี
            <ArrowRight size={24} />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-dark-700">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center">
                  <Search className="text-white" size={20} />
                </div>
                <span className="text-xl font-bold">InvestiGate</span>
              </div>
              <p className="text-dark-400 text-sm">
                Digital Forensic Investigation Platform
                มาตรฐานการสืบสวนดิจิทัล
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-dark-400 text-sm">
                <li><a href="#features" className="hover:text-white">Features</a></li>
                <li><a href="#pricing" className="hover:text-white">Pricing</a></li>
                <li><a href="/guide" className="hover:text-white">Documentation</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-dark-400 text-sm">
                <li><a href="#" className="hover:text-white">About Us</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-dark-400 text-sm">
                <li>support@investigates.com</li>
                <li>02-xxx-xxxx</li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-dark-700 text-center text-dark-500 text-sm">
            <p>© 2026 InvestiGate. All rights reserved.</p>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
