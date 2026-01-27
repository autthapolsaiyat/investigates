/**
 * Landing Page - InvestiGate SaaS
 * Product Sales Page
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield, Network, Wallet, Phone, MapPin, FileText,
  CheckCircle, ArrowRight,
  ChevronDown, ChevronUp, Users, Lock, Globe,
  Sparkles, QrCode
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
      desc: 'Auto import data, supports Cellebrite, UFED, XRY',
      color: 'text-yellow-400 bg-yellow-500/20'
    },
    {
      icon: Network,
      title: 'Money Flow',
      desc: 'Analyze money trail with Network Graph',
      color: 'text-green-400 bg-green-500/20'
    },
    {
      icon: Wallet,
      title: 'Crypto Tracker',
      desc: 'Track Cryptocurrency on all chains',
      color: 'text-orange-400 bg-orange-500/20'
    },
    {
      icon: Phone,
      title: 'Call Analysis',
      desc: 'Analyze calls and SMS',
      color: 'text-purple-400 bg-purple-500/20'
    },
    {
      icon: MapPin,
      title: 'Location Timeline',
      desc: 'Track location on map',
      color: 'text-red-400 bg-red-500/20'
    },
    {
      icon: FileText,
      title: 'Forensic Report',
      desc: 'Court-standard reports with QR Code',
      color: 'text-cyan-400 bg-cyan-500/20'
    }
  ];

  const pricing = [
    {
      name: 'Starter',
      price: 'Free Trial',
      period: '30 days',
      desc: 'Try before you decide',
      features: [
        '1 User License',
        'Unlimited case creation',
        'Smart Import',
        'Money Flow Analysis',
        'Crypto Tracker',
        'Forensic Report',
        'Storage space 5GB',
        'Email Support'
      ],
      highlight: false,
      cta: 'Start Free Trial',
      isFree: true
    },
    {
      name: 'Professional',
      price: 'Contact Us',
      period: 'for pricing',
      desc: 'For advanced investigation',
      features: [
        '1 User License',
        'Everything in Starter',
        'Call Analysis',
        'Location Timeline',
        'Chain of Custody',
        'Storage space 20GB',
        'Priority Support',
        'Online Training'
      ],
      highlight: true,
      cta: 'Contact Sales',
      isFree: false
    },
    {
      name: 'Enterprise',
      price: 'Contact Us',
      period: 'for pricing',
      desc: 'For large organizations',
      features: [
        '1 User License',
        'Everything in Professional',
        'API Access',
        'Custom Integration',
        'Storage space 100GB',
        'Dedicated Support',
        'On-site Training',
        'SLA 99.9%'
      ],
      highlight: false,
      cta: 'Contact Sales',
      isFree: false
    }
  ];

  const screenshots = [
    {
      title: 'Money Flow Analysis',
      desc: 'Visualize complex financial networks and trace money trails',
      image: '/images/screenshots/money-flow.png'
    },
    {
      title: 'Call Analysis Network',
      desc: 'Analyze call patterns and identify communication clusters',
      image: '/images/screenshots/call-analysis.png'
    },
    {
      title: 'Crypto Transaction Tracker',
      desc: 'Track cryptocurrency flows across wallets and exchanges',
      image: '/images/screenshots/crypto-tracker.png'
    },
    {
      title: 'Location Timeline',
      desc: 'Map suspect movements with GPS data playback',
      image: '/images/screenshots/location-timeline.png'
    }
  ];

  const faqs = [
    {
      q: 'Who is InvestiGate for?',
      a: 'InvestiGate is designed for investigators, police and agencies that need digital data analysis in financial crime, drug and other cases'
    },
    {
      q: 'What file formats are supported?',
      a: 'Supports files from Cellebrite UFED, MSAB XRY, Oxygen Forensic and general CSV/Excel files like Bank Statements, Call Records, Crypto Transactions'
    },
    {
      q: 'Is data secure?',
      a: 'Data is encrypted at rest and in transit, stored on ISO 27001 Azure Cloud with Chain of Custody system and SHA-256 Hash verification'
    },
    {
      q: 'Can it be used in court?',
      a: 'Yes. System creates reports per Digital Forensic standards with Chain of Custody, QR Code for evidence verification and SHA-256 Hash confirming data integrity'
    },
    {
      q: 'Is training available?',
      a: 'Training available (charged separately) by expert trainers, On-site or Online'
    },
    {
      q: 'Can I cancel?',
      a: 'You can cancel anytime. Data kept for 30 days after expiry'
    }
  ];

  const stats = [
    { value: '500+', label: 'Cases Analyzed' },
    { value: '50+', label: 'Agencies Using' },
    { value: '99.9%', label: 'Uptime' },
    { value: '24/7', label: 'Support' }
  ];

  return (
    <div className="min-h-screen bg-dark-900 text-white">
      
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-dark-900/80 backdrop-blur-lg border-b border-dark-700">
        <div className="max-w-7xl mx-auto px-6 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <img src="/images/logo.png" alt="InvestiGate" className="h-20 md:h-24 w-auto" />
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-dark-300 hover:text-white transition-colors">Features</a>
              <a href="#pricing" className="text-dark-300 hover:text-white transition-colors">Pricing</a>
              <a href="#faq" className="text-dark-300 hover:text-white transition-colors">FAQ</a>
              <a href="/guide" target="_blank" className="text-dark-300 hover:text-white transition-colors">Guide</a>
            </div>
            <div className="flex items-center gap-4">
              {isAuthenticated ? (
                <button
                  onClick={() => navigate('/app/dashboard')}
                  className="px-4 py-2 bg-primary-500 hover:bg-primary-600 rounded-lg font-medium transition-colors"
                >
                  Go to Dashboard
                </button>
              ) : (
                <>
                  <button
                    onClick={() => navigate('/login')}
                    className="text-dark-300 hover:text-white transition-colors"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => navigate('/login')}
                    className="px-4 py-2 bg-primary-500 hover:bg-primary-600 rounded-lg font-medium transition-colors"
                  >
                    Try for Free
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-36 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500/20 rounded-full text-primary-400 text-sm mb-6">
                <Sparkles size={16} />
                <span>Digital Forensic Platform</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                Analyze Digital Cases
                <br />
                <span className="text-primary-400">Court Standard</span>
              </h1>
              <p className="text-xl text-dark-400 mb-8 max-w-lg">
                Import data from Cellebrite, UFED, XRY. Analyze crypto money trail. 
                Create court-ready reports instantly.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => navigate('/login')}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 rounded-lg font-medium transition-colors"
                >
                  Start Free Trial
                  <ArrowRight size={20} />
                </button>
                <button 
                  onClick={() => window.location.href = 'mailto:sales@investigates.in.th'}
                  className="flex items-center justify-center gap-2 px-6 py-3 border border-dark-600 hover:border-dark-500 rounded-lg font-medium transition-colors"
                >
                  Contact Sales
                </button>
              </div>
              <div className="flex items-center gap-6 mt-8 text-sm text-dark-400">
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-400" />
                  <span>30-day free trial</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-400" />
                  <span>No credit card required</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="rounded-2xl overflow-hidden shadow-2xl border border-dark-700">
                <img
                  src="/images/screenshots/money-flow.png"
                  alt="InvestiGate Money Flow Analysis - Network visualization"
                  className="w-full"
                />
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
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Comprehensive Features</h2>
            <p className="text-dark-400 max-w-2xl mx-auto">
              Complete digital data analysis tools, from data import to court report generation
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
                Enterprise Security
                <span className="text-primary-400"> Enterprise</span>
              </h2>
              <p className="text-dark-400 mb-8">
                Your case data is protected with highest security standards 
                Suitable for confidential data
              </p>
              <div className="space-y-4">
                {[
                  { icon: Lock, text: 'Encryption at rest & in transit (AES-256)' },
                  { icon: Shield, text: 'Chain of Custody with SHA-256 Hash' },
                  { icon: QrCode, text: 'QR Code evidence verification' },
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
                  Reports generated from system can be used as court evidence
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

      {/* Screenshots Gallery */}
      <section className="py-20 px-6 bg-dark-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">See It In Action</h2>
            <p className="text-dark-400 max-w-2xl mx-auto">
              Professional-grade visualization tools for digital forensic investigations
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {screenshots.map((item, i) => (
              <div key={i} className="group">
                <div className="rounded-2xl overflow-hidden border border-dark-700 bg-dark-900 hover:border-primary-500/50 transition-colors">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-64 object-cover object-top group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <h3 className="text-lg font-semibold mt-4 mb-1">{item.title}</h3>
                <p className="text-dark-400 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Flexible Plans</h2>
            <p className="text-dark-400 max-w-2xl mx-auto">
              Start with a free trial, then contact us for customized pricing
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
                    Recommended
                  </div>
                )}
                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <p className="text-dark-400 text-sm mb-4">{plan.desc}</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-dark-400 ml-1">{plan.period}</span>
                </div>
                <button
                  onClick={() => plan.isFree ? navigate('/login') : window.location.href = 'mailto:sales@investigates.in.th'}
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
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 px-6 bg-dark-800/50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
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
            Ready to start analyzing cases?
          </h2>
          <p className="text-xl text-dark-400 mb-8">
            Try free for 30 days. No credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/login')}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary-500 hover:bg-primary-600 rounded-lg font-medium text-lg transition-colors"
            >
              Start Free Trial
              <ArrowRight size={24} />
            </button>
            <button
              onClick={() => window.location.href = 'mailto:sales@investigates.in.th'}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-dark-600 hover:border-dark-500 rounded-lg font-medium text-lg transition-colors"
            >
              Contact Sales
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-dark-700">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="mb-4">
                <img src="/images/logo.png" alt="InvestiGate" className="h-28 w-auto" />
              </div>
              <p className="text-dark-400 text-sm">
                Digital Forensic Investigation Platform
                <br />
                Enterprise-grade Digital Investigation
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
                <li><a href="mailto:sales@investigates.in.th" className="hover:text-white">Contact Sales</a></li>
                <li><a href="mailto:support@investigates.in.th" className="hover:text-white">Support</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-dark-400 text-sm">
                <li>sales@investigates.in.th</li>
                <li>support@investigates.in.th</li>
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
