'use client'

import React from 'react'
import Navbar from '@/components/Navbar'
import { 
  Users, 
  Rocket, 
  TrendingUp, 
  ShieldCheck, 
  Globe, 
  Zap, 
  ChevronRight, 
  CheckCircle2, 
  Award,
  Layers,
  ArrowRight,
  Handshake
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import Footer from '@/components/Footer'
import { useState } from 'react'

const logos = [
  '/marquee/dynamicsecurity.png',
  '/marquee/holyshakes.png',
  '/marquee/indespice.jpeg',
  '/marquee/logo-MOC-Off-white1.png',
  '/marquee/northerntadka.png',
  '/marquee/uniconnectpro.png',
];

const PartnersPage = () => {
  const [activeTab, setActiveTab] = useState('Overview')

  const tabs = [
    { name: 'Overview', icon: <Handshake className="w-5 h-5" /> },
    { name: 'Resellers', icon: <Users className="w-5 h-5" /> },
    { name: 'Strategic Alliances', icon: <Award className="w-5 h-5" /> },
    { name: 'Integrators', icon: <Zap className="w-5 h-5" /> },
    { name: 'Publishers', icon: <Globe className="w-5 h-5" /> }
  ]

  const renderContent = () => {
    switch(activeTab) {
      case 'Resellers':
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-24 pb-24">
            <section className="pb-24 pt-[192px] bg-white">
              <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                <div className="animate-in slide-in-from-left duration-1000">
                  <h2 className="text-5xl font-black text-slate-900 mb-8 leading-tight tracking-tight">
                    Build a Profitable <br /> Business as a <span className="text-blue-600">Reseller</span>
                  </h2>
                  <p className="text-xl text-slate-600 mb-10 leading-relaxed font-medium">
                    Our Reseller program is designed for entrepreneurs who want to sell a proven, high-demand SEO product without the overhead of development.
                  </p>
                  <div className="space-y-6">
                    {[
                      { t: 'High Margins', d: 'Get wholesale pricing and set your own retail rates for maximum profit.' },
                      { t: 'White-Label Portal', d: 'Your clients see your brand, your logo, and your domain.' },
                      { t: 'Sales Enablement', d: 'Full access to pitch decks, case studies, and training materials.' }
                    ].map((f, i) => (
                      <div key={i} className="flex gap-4">
                        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mt-1 flex-shrink-0">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-black text-slate-900">{f.t}</h4>
                          <p className="text-slate-500 font-medium">{f.d}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="relative animate-in slide-in-from-right duration-1000">
                  <div className="absolute -inset-4 bg-blue-600/5 rounded-[3rem] blur-2xl" />
                  <div className="relative bg-slate-50 rounded-[3rem] border border-slate-100 p-12 shadow-2xl">
                    <div className="space-y-8">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-6">
                        <span className="text-slate-400 font-black uppercase tracking-widest text-xs">Profit Calculator</span>
                        <TrendingUp className="text-blue-600 w-6 h-6" />
                      </div>
                      <div className="space-y-6">
                        <div className="flex justify-between items-end">
                          <span className="text-slate-600 font-bold">Standard Margin</span>
                          <span className="text-3xl font-black text-slate-900">40%</span>
                        </div>
                        <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                          <div className="w-2/5 h-full bg-blue-600" />
                        </div>
                        <div className="flex justify-between items-end">
                          <span className="text-slate-600 font-bold">Enterprise Margin</span>
                          <span className="text-3xl font-black text-slate-900">65%</span>
                        </div>
                        <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                          <div className="w-[65%] h-full bg-blue-600" />
                        </div>
                      </div>
                      <Button className="w-full h-16 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-lg shadow-xl shadow-blue-200">
                        View Reseller Pricing
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-slate-50 py-24 rounded-[4rem] mx-6">
              <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-16">
                  <h3 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">The Reseller Tech Stack</h3>
                  <p className="text-slate-500 font-medium">Everything you need to run your SEO agency autonomously.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {[
                    { t: "Custom Domain", d: "Map your own domain (e.g., scan.youagency.com) for a seamless client experience.", i: <Globe/> },
                    { t: "Automated Billing", d: "Charge your clients automatically through our integrated Stripe connector.", i: <TrendingUp/> },
                    { t: "Wholesale Credits", d: "Purchase scan credits in bulk at up to 70% discount compared to retail.", i: <Rocket/> },
                    { t: "Client Portal", d: "A dedicated dashboard for your clients to view their own reports.", i: <Users/> },
                    { t: "Brand Customization", d: "Change colors, logos, and email templates to match your identity.", i: <Award/> },
                    { t: "Email Automation", d: "Send automated audit reports and weekly updates to your clients.", i: <Zap/> }
                  ].map((f, i) => (
                    <div key={i} className="p-10 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                      <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-all">
                        {f.i}
                      </div>
                      <h4 className="font-black text-xl mb-4 text-slate-900">{f.t}</h4>
                      <p className="text-slate-500 font-medium leading-relaxed text-sm">{f.d}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="max-w-7xl mx-auto px-6">
              <div className="p-12 rounded-[3rem] bg-slate-900 text-white flex flex-col md:flex-row items-center justify-between gap-10">
                <div className="space-y-4">
                  <h3 className="text-3xl font-black">Download Reseller Kit</h3>
                  <p className="text-slate-400 font-medium max-w-md">Get instant access to our pricing guide, white-label setup manual, and marketing deck.</p>
                </div>
                <Button className="h-16 px-10 rounded-2xl bg-white text-slate-900 font-black text-lg hover:bg-slate-100">
                  Get PDF Kit (12.4 MB)
                </Button>
              </div>
            </section>
          </div>
        )
      case 'Strategic Alliances':
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-24 pb-24">
            <section className="pb-24 pt-[192px] bg-white">
              <div className="max-w-7xl mx-auto px-6 text-center animate-in zoom-in duration-1000">
                <h2 className="text-5xl font-black text-slate-900 mb-8 tracking-tight">Expand Your Ecosystem</h2>
                <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-20 font-medium leading-relaxed">
                  We partner with industry-leading platforms to build integrated solutions that solve complex local SEO challenges for global brands.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-left">
                  {[
                    { t: 'Joint Go-To-Market', d: 'Collaborate on marketing campaigns and co-branded events.', i: <Handshake /> },
                    { t: 'Product Synergy', d: 'Influence our roadmap and build integrated product features.', i: <Layers /> },
                    { t: 'Executive Alignment', d: 'Regular strategy sessions with our leadership team.', i: <Users /> }
                  ].map((f, i) => (
                    <div key={i} className="p-10 rounded-[3rem] bg-slate-900 text-white space-y-6 hover:scale-[1.02] transition-transform">
                      <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/30">
                        {f.i}
                      </div>
                      <h3 className="text-2xl font-black">{f.t}</h3>
                      <p className="text-slate-400 font-medium leading-relaxed">{f.d}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="max-w-7xl mx-auto px-6">
              <div className="bg-blue-50 rounded-[4rem] p-16 flex flex-col lg:flex-row gap-20 items-center overflow-hidden relative">
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/5 rounded-full blur-[100px] -mr-48 -mt-48" />
                <div className="flex-1 space-y-8 relative z-10">
                  <h3 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight">Co-Innovation <br /> Opportunities</h3>
                  <p className="text-lg text-slate-600 font-medium leading-relaxed">
                    Strategic partners gain early access to our experimental AI models and the opportunity to build proprietary features exclusively for their user base.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {[
                      'BETA access to AI-SEO engine', 
                      'Custom reporting widgets', 
                      'Dedicated Slack channel', 
                      'Quarterly roadmap reviews',
                      'Early Feature Access',
                      'Custom UX Components'
                    ].map((item) => (
                      <div key={item} className="flex items-center gap-3 font-bold text-slate-700">
                        <CheckCircle2 className="text-blue-600 w-5 h-5 flex-shrink-0" /> {item}
                      </div>
                    ))}
                  </div>
                  <Button className="h-16 px-10 rounded-2xl bg-blue-600 text-white font-black text-lg hover:bg-blue-700 shadow-xl shadow-blue-200">
                    Schedule Discovery Call
                  </Button>
                </div>
                <div className="flex-1 grid grid-cols-2 gap-6 relative z-10">
                  {[1, 2, 3, 4].map(n => (
                    <div key={n} className="aspect-[4/3] bg-white/60 backdrop-blur-md rounded-[2rem] border border-white flex flex-col items-center justify-center p-8 text-center shadow-sm">
                      <div className="w-12 h-12 bg-blue-100 rounded-2xl mb-4 animate-pulse" />
                      <p className="text-slate-400 text-xs font-black uppercase tracking-widest">Synergy Module {n}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        )
      case 'Integrators':
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-24 pb-24">
            <section className="pb-24 pt-[192px] bg-white">
              <div className="max-w-7xl mx-auto px-6 flex flex-col lg:flex-row gap-20">
                <div className="flex-1 space-y-10 animate-in slide-in-from-left duration-1000">
                  <h2 className="text-5xl font-black text-slate-900 tracking-tight leading-tight">Technical <br /><span className="text-blue-600">Infrastructure</span></h2>
                  <p className="text-xl text-slate-600 font-medium leading-relaxed">
                    Our robust API and webhook infrastructure allow technical teams to build seamless experiences and automate complex reporting workflows.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    {[
                      { t: 'RESTful API', d: 'Comprehensive endpoints for all heatmap data.' },
                      { t: 'Real-time Webhooks', d: 'Get notified instantly when scans complete.' },
                      { t: 'Developer Sandbox', d: 'Build and test without spending credits.' },
                      { t: 'Priority Support', d: 'Direct access to our engineering team.' },
                      { t: 'OAuth 2.0', d: 'Secure, modern authentication for all apps.' },
                      { t: 'SOC2 Compliant', d: 'Enterprise-grade security and data privacy.' }
                    ].map((f, i) => (
                      <div key={i} className="space-y-3">
                        <div className="text-blue-600"><Zap className="w-6 h-6" /></div>
                        <h4 className="font-black text-slate-900">{f.t}</h4>
                        <p className="text-slate-500 font-medium text-sm leading-relaxed">{f.d}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex-1 bg-slate-900 rounded-[3rem] p-10 font-mono text-sm text-blue-300 shadow-2xl border border-slate-800 relative overflow-hidden animate-in slide-in-from-right duration-1000">
                  <div className="absolute top-0 right-0 p-6 flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/50" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                    <div className="w-3 h-3 rounded-full bg-green-500/50" />
                  </div>
                  <div className="flex items-center gap-3 mb-8 border-b border-white/10 pb-6 text-slate-400 font-sans">
                    <Zap className="w-4 h-4 text-blue-400" />
                    <span>Integrator Sandbox (v1.4)</span>
                  </div>
                  <pre className="mt-4 leading-relaxed overflow-x-auto text-blue-200">
                    {`// Initialize Heatmap Scan
const scan = await fetch('/api/v1/scans', {
  method: 'POST',
  headers: { 
    'Authorization': 'Bearer YOUR_SECRET_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    businessId: 'ChIJP3Sa8ziYEmsRUKgyFmh9AQM',
    keyword: 'lawyer near me',
    settings: {
      radius: 5.0,
      gridSize: '13x13',
      colorScale: 'standard'
    }
  })
});

// Real-time Event Response
{
  "status": "processing",
  "jobId": "hmap_22983",
  "webhook_url": "https://your-app.com/events",
  "eta_seconds": 42
}`}
                  </pre>
                </div>
              </div>
            </section>

            <section className="py-24 bg-slate-50 rounded-[4rem] mx-6">
              <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-16">
                  <h3 className="text-3xl font-black text-slate-900">Webhook Event Library</h3>
                  <p className="text-slate-500 font-medium mt-4">Automate your workflow with real-time notifications.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {[
                    { e: "scan.started", d: "Fired when a scan is queued and processing starts." },
                    { e: "scan.completed", d: "Fired when data is ready and heatmap is generated." },
                    { e: "scan.failed", d: "Fired if an error occurs during API retrieval." },
                    { e: "audit.ready", d: "Fired when the full PDF audit report is built." },
                    { e: "credits.low", d: "Triggered when your account balance hits threshold." },
                    { e: "project.created", d: "Fired when a new business profile is added." }
                  ].map((w, i) => (
                    <div key={i} className="p-8 bg-white rounded-3xl border border-slate-100 flex flex-col justify-between">
                      <code className="text-blue-600 font-black text-sm mb-4 block">event: {w.e}</code>
                      <p className="text-slate-500 font-medium text-sm leading-relaxed">{w.d}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="py-24 border-y border-slate-100">
              <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 text-center">
                  {[
                    { l: "Uptime", v: "99.99%" },
                    { l: "Avg Latency", v: "< 200ms" },
                    { l: "Rate Limit", v: "10k/min" },
                    { l: "SDKs", v: "Node, Py, Go" }
                  ].map((s, i) => (
                    <div key={i} className="space-y-2">
                      <p className="text-4xl font-black text-slate-900">{s.v}</p>
                      <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">{s.l}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        )
      case 'Publishers':
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-24 pb-24">
            <section className="pb-24 pt-[192px] bg-white">
              <div className="max-w-7xl mx-auto px-6 animate-in fade-in duration-1000">
                <div className="text-center mb-20 space-y-4">
                  <h2 className="text-5xl font-black text-slate-900 tracking-tight">Monetize Your Audience</h2>
                  <p className="text-xl text-slate-600 max-w-2xl mx-auto font-medium">
                    Generate high-intent leads and earn premium recurring commissions with our high-converting marketing assets.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  {[
                    { t: '30% Commission', d: 'Recurring monthly revenue for every referral.', i: <TrendingUp /> },
                    { t: '90-Day Cookies', d: 'We credit you even for delayed conversions.', i: <ShieldCheck /> },
                    { t: 'Asset Library', d: 'Ready-to-use banners, emails, and videos.', i: <Award /> },
                    { t: 'Live Tracking', d: 'Track clicks and conversions in real-time.', i: <Globe /> }
                  ].map((f, i) => (
                    <div key={i} className="group p-8 rounded-[2.5rem] bg-slate-50 hover:bg-blue-600 hover:text-white transition-all duration-500 text-center">
                      <div className="w-14 h-14 rounded-2xl bg-white text-blue-600 mx-auto flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
                        {f.i}
                      </div>
                      <h4 className="text-lg font-black mb-3">{f.t}</h4>
                      <p className="text-slate-500 group-hover:text-blue-100 text-sm font-medium">{f.d}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="max-w-7xl mx-auto px-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="p-12 rounded-[3rem] bg-blue-600 text-white space-y-8 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[80px] -mr-32 -mt-32" />
                  <h3 className="text-4xl font-black leading-tight relative z-10">High-Performance <br /> Payout Tiers</h3>
                  <div className="space-y-4 relative z-10">
                    {[
                      { tier: "Silver", volume: "1-10 Referrals", comm: "20%" },
                      { tier: "Gold", volume: "11-50 Referrals", comm: "30%" },
                      { tier: "Platinum", volume: "50+ Referrals", comm: "45%" }
                    ].map((p, i) => (
                      <div key={i} className="flex items-center justify-between p-6 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-sm">
                        <div>
                          <span className="font-black text-blue-200">{p.tier}</span>
                          <p className="text-blue-100/60 text-sm font-medium">{p.volume}</p>
                        </div>
                         <span className="text-2xl font-black">{p.comm}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-12 rounded-[3rem] bg-slate-50 border border-slate-100 flex flex-col justify-between">
                  <div className="space-y-6">
                    <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600">
                      <Layers className="w-8 h-8" />
                    </div>
                    <h3 className="text-3xl font-black text-slate-900 leading-tight">Publisher Asset Library</h3>
                    <p className="text-slate-500 font-medium leading-relaxed">
                      Stop creating ads from scratch. Access our library of high-converting visual assets, copy templates, and video walkthroughs.
                    </p>
                    <ul className="grid grid-cols-2 gap-4">
                      {['Social Banners', 'Email Templates', 'Landing Pages', 'Product Videos', 'Blog Post Kits', 'Ad Copy'].map(item => (
                        <li key={item} className="flex items-center gap-2 text-slate-700 font-bold text-sm">
                          <CheckCircle2 className="w-4 h-4 text-green-500" /> {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Button variant="outline" className="mt-10 h-14 rounded-xl border-slate-200 font-black text-slate-900 hover:bg-slate-100 transition-all">
                    Browse All Assets
                  </Button>
                </div>
              </div>
            </section>

            <section className="bg-slate-900 py-24 text-white rounded-[3rem] mx-6 mb-24">
              <div className="max-w-4xl mx-auto px-6 text-center space-y-10">
                <h3 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">Ready to start earning?</h3>
                <p className="text-slate-400 font-medium text-lg">Join our community of 750+ publishers and start generating recurring revenue today.</p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                  <Button className="h-16 px-12 rounded-2xl bg-blue-600 text-white font-black text-xl hover:bg-blue-700 shadow-xl shadow-blue-900/50">
                    Join Network
                  </Button>
                  <button className="text-slate-400 font-black text-lg hover:text-white transition-all">
                    View Affiliate Terms
                  </button>
                </div>
              </div>
            </section>
          </div>
        )
      default:
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Hero Section */}
            <section className="relative pt-[192px] pb-32 overflow-hidden bg-hero-grid">
              <div className="absolute top-0 left-0 w-full h-full opacity-40 pointer-events-none">
                <div className="absolute top-1/4 left-10 w-64 h-64 bg-blue-400/20 rounded-full blur-[100px] animate-pulse-slow" />
                <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-indigo-400/20 rounded-full blur-[120px] animate-bounce-slow" />
              </div>

              <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-sm font-black uppercase tracking-widest mb-8 animate-fade-in">
                  <Handshake className="w-4 h-4" /> Partner Program 2024
                </div>
                <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tight mb-8 leading-none">
                  Grow your business <br />
                  <span className="text-blue-600 underline decoration-blue-200 decoration-8 underline-offset-8">Faster, Together.</span>
                </h1>
                <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-10 font-medium leading-relaxed">
                  Join the fastest-growing SEO ecosystem. Empower your clients with data-driven insights, premium white-label reports, and industry-leading technology.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Button className="h-16 px-10 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-lg shadow-xl shadow-blue-200 transition-all group">
                    Become a Partner
                    <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                  <Button variant="ghost" className="h-16 px-10 rounded-2xl text-slate-600 font-black text-lg hover:bg-slate-100 transition-all">
                    View All Benefits
                  </Button>
                </div>
              </div>
            </section>

            {/* Partner Logos Marquee */}
            <section className="py-20 border-y border-slate-100 bg-white relative z-20">
              <div className="max-w-7xl mx-auto px-6">
                <p className="text-center text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-12">
                  Empowering 500+ Agencies Worldwide
                </p>
                
                <div className="relative w-full overflow-hidden">
                  <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-white to-transparent z-10" />
                  <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-white to-transparent z-10" />
                  
                  <div className="flex animate-marquee hover:pause-on-hover gap-16 items-center whitespace-nowrap">
                    {[...logos, ...logos, ...logos].map((logo, index) => (
                      <div key={index} className="flex-shrink-0 transition-all duration-300">
                        <img 
                          src={logo} 
                          alt="Partner" 
                          className="h-10 md:h-12 w-auto object-contain max-w-[150px] transition-all"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Stats Section */}
            <section className="py-24 bg-white relative z-20">
              <div className="max-w-7xl mx-auto px-6">
                <h2 className="text-4xl md:text-5xl font-black text-slate-900 text-center mb-16 tracking-tight">
                  You&apos;re in great company
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="p-10 rounded-[2.5rem] bg-slate-50/50 border border-slate-100 flex flex-col justify-center min-h-[240px] hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500">
                    <span className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tighter">200,000+</span>
                    <p className="text-slate-500 font-bold text-lg leading-relaxed">Trusted by local businesses</p>
                  </div>
                  <div className="p-10 rounded-[2.5rem] bg-slate-50/50 border border-slate-100 flex flex-col justify-center min-h-[240px] hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500">
                    <span className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tighter">3,000+</span>
                    <p className="text-slate-500 font-bold text-lg leading-relaxed">Integrated with Applications</p>
                  </div>
                  <div className="p-10 rounded-[2.5rem] bg-slate-50/50 border border-slate-100 flex flex-col justify-center min-h-[240px] hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500">
                    <span className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tighter">750+</span>
                    <p className="text-slate-500 font-bold text-lg leading-relaxed">Partnered with marketing agencies</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Partnership Tiers */}
            <section className="py-24 max-w-7xl mx-auto px-6">
              <div className="text-center mb-16 space-y-4">
                <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">The Right Program for You</h2>
                <p className="text-slate-500 font-bold max-w-xl mx-auto uppercase text-xs tracking-widest">Select the tier that best fits your business model</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Agency Card */}
                <div className="group p-10 rounded-[3rem] border border-slate-100 bg-white hover:border-blue-600 hover:shadow-2xl hover:shadow-blue-100 transition-all duration-500 relative overflow-hidden">
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-50 rounded-full group-hover:scale-150 transition-transform duration-700" />
                  <div className="relative z-10">
                    <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 mb-8 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <Rocket className="w-8 h-8" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 mb-4">Agency Partners</h3>
                    <p className="text-slate-500 font-medium mb-8 leading-relaxed">
                      Perfect for digital marketing agencies wanting to provide premium SEO reporting to their clients.
                    </p>
                    <ul className="space-y-4 mb-10">
                      {['100% White-Label', 'Bulk Pricing', 'Dedicated Manager', 'API Access'].map((item) => (
                        <li key={item} className="flex items-center gap-3 text-slate-700 font-bold text-sm">
                          <CheckCircle2 className="w-4 h-4 text-green-500" /> {item}
                        </li>
                      ))}
                    </ul>
                    <Button variant="outline" className="w-full h-14 rounded-xl border-slate-200 font-black hover:bg-blue-600 hover:text-white transition-all">
                      Learn More
                    </Button>
                  </div>
                </div>

                {/* Strategic Card */}
                <div className="group p-10 rounded-[3rem] border border-slate-100 bg-slate-900 hover:shadow-2xl hover:shadow-blue-900/20 transition-all duration-500 relative overflow-hidden">
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/10 rounded-full group-hover:scale-150 transition-transform duration-700" />
                  <div className="relative z-10">
                    <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white mb-8 shadow-lg shadow-blue-600/20">
                      <Layers className="w-8 h-8" />
                    </div>
                    <h3 className="text-2xl font-black text-white mb-4">Strategic Partners</h3>
                    <p className="text-slate-400 font-medium mb-8 leading-relaxed">
                      For technology companies and platforms looking for deep integrations and co-marketing.
                    </p>
                    <ul className="space-y-4 mb-10">
                      {['Direct API Sync', 'Co-Marketing', 'SDK Access', 'Custom Workflows'].map((item) => (
                        <li key={item} className="flex items-center gap-3 text-slate-300 font-bold text-sm">
                          <CheckCircle2 className="w-4 h-4 text-blue-400" /> {item}
                        </li>
                      ))}
                    </ul>
                    <Button className="w-full h-14 rounded-xl bg-blue-600 border-none font-black hover:bg-blue-700 text-white transition-all">
                      Get Started
                    </Button>
                  </div>
                </div>

                {/* Affiliate Card */}
                <div className="group p-10 rounded-[3rem] border border-slate-100 bg-white hover:border-blue-600 hover:shadow-2xl hover:shadow-blue-100 transition-all duration-500 relative overflow-hidden">
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-slate-50 rounded-full group-hover:scale-150 transition-transform duration-700" />
                  <div className="relative z-10">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 mb-8 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      <TrendingUp className="w-8 h-8" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 mb-4">Affiliate Program</h3>
                    <p className="text-slate-500 font-medium mb-8 leading-relaxed">
                      For influencers and entrepreneurs who want to earn high recurring commissions by referring users.
                    </p>
                    <ul className="space-y-4 mb-10">
                      {['30% Recurring', '90-day Cookies', 'Asset Library', 'Live Dashboard'].map((item) => (
                        <li key={item} className="flex items-center gap-3 text-slate-700 font-bold text-sm">
                          <CheckCircle2 className="w-4 h-4 text-indigo-500" /> {item}
                        </li>
                      ))}
                    </ul>
                    <Button variant="outline" className="w-full h-14 rounded-xl border-slate-200 font-black hover:bg-indigo-600 hover:text-white transition-all">
                      Join Network
                    </Button>
                  </div>
                </div>
              </div>
            </section>

            {/* Benefits Grid */}
            <section className="py-24 bg-slate-50">
              <div className="max-w-7xl mx-auto px-6">
                <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-6">
                  <div className="space-y-4">
                    <span className="text-blue-600 font-black text-xs uppercase tracking-[0.3em]">Advantages</span>
                    <h2 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight">Why Partner With Us?</h2>
                  </div>
                  <p className="text-slate-500 font-medium max-w-sm mb-2">
                    We provide the tools, support, and infrastructure you need to win the local SEO market.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12">
                  {[
                    { title: "High Retention", desc: "Our heatmap reports are 'sticky' assets that keep clients paying for months.", icon: <ShieldCheck className="w-8 h-8" /> },
                    { title: "Real-time Data", desc: "No more stale reporting. Get live data from Google Places API instantly.", icon: <Zap className="w-8 h-8" /> },
                    { title: "Global Reach", desc: "Operate in any language or country supported by Google Maps.", icon: <Globe className="w-8 h-8" /> },
                    { title: "Exclusive Tools", desc: "Get early access to our AI-powered local SEO audit tools.", icon: <Award className="w-8 h-8" /> },
                    { title: "Priority Support", desc: "Direct line to our technical team for custom integrations.", icon: <Handshake className="w-8 h-8" /> },
                    { title: "Revenue Share", desc: "Earn up to 40% on bulk white-label subscription tiers.", icon: <TrendingUp className="w-8 h-8" /> }
                  ].map((benefit, i) => (
                    <div key={i} className="group space-y-6">
                      <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                        {benefit.icon}
                      </div>
                      <h4 className="text-xl font-black text-slate-900 tracking-tight">{benefit.title}</h4>
                      <p className="text-slate-500 font-medium leading-relaxed">{benefit.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* How it Works */}
            <section className="py-24 bg-white border-t border-slate-100">
              <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-20 space-y-4">
                  <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">How it Works</h2>
                  <p className="text-slate-500 font-bold max-w-xl mx-auto uppercase text-xs tracking-widest leading-relaxed">
                    Three simple steps to start your partnership journey with Ringscale AI
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
                  <div className="hidden md:block absolute top-24 left-0 w-full h-0.5 bg-slate-100 -z-10" />
                  {[
                    { s: '01', t: 'Apply', d: 'Submit your application through our portal. Our team reviews all requests within 24 hours.' },
                    { s: '02', t: 'Align', d: 'We schedule a brief strategy session to align on goals, pricing, and integration needs.' },
                    { s: '03', t: 'Launch', d: 'Receive your credentials, access the marketing library, and start scaling your agency.' }
                  ].map((step, i) => (
                    <div key={i} className="space-y-6 bg-white p-2">
                      <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-2xl font-black shadow-xl shadow-blue-200">
                        {step.s}
                      </div>
                      <h3 className="text-2xl font-black text-slate-900">{step.t}</h3>
                      <p className="text-slate-500 font-medium leading-relaxed">{step.d}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Testimonials */}
            <section className="py-24 bg-slate-900 overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-600 rounded-full blur-[200px] -mr-[400px] -mt-[400px]" />
              </div>
              <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                  <div className="space-y-8">
                    <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-tight">
                      Don&apos;t just take <br /> our word for it.
                    </h2>
                    <p className="text-xl text-slate-400 font-medium leading-relaxed">
                      Hear from the agencies and partners who have transformed their local SEO offerings with our heatmap technology.
                    </p>
                    <div className="flex gap-6">
                      <div className="space-y-1">
                        <p className="text-3xl font-black text-white">98%</p>
                        <p className="text-slate-500 font-bold text-sm uppercase tracking-widest">Partner Retention</p>
                      </div>
                      <div className="w-px h-12 bg-slate-800" />
                      <div className="space-y-1">
                        <p className="text-3xl font-black text-white">1.4M+</p>
                        <p className="text-slate-500 font-bold text-sm uppercase tracking-widest">Reports Generated</p>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-6">
                    {[
                      { 
                        q: "The white-label heatmaps changed our pitch completely. We went from a 20% close rate to over 55% in just three months.",
                        a: "Sarah Jenkins",
                        r: "CEO, GrowthLocal Agency"
                      },
                      { 
                        q: "Integration was a breeze. Our dev team had the API live in 48 hours, and the support team was with us every step of the way.",
                        a: "Michael Chen",
                        r: "CTO, SearchFlow Solutions"
                      }
                    ].map((t, i) => (
                      <div key={i} className="p-10 rounded-[3rem] bg-white/5 border border-white/10 backdrop-blur-xl space-y-6 hover:bg-white/10 transition-all duration-500">
                        <p className="text-xl text-slate-200 font-medium italic leading-relaxed">
                          &quot;{t.q}&quot;
                        </p>
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-black">
                            {t.a[0]}
                          </div>
                          <div>
                            <p className="text-white font-black">{t.a}</p>
                            <p className="text-slate-500 text-sm font-bold">{t.r}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* FAQ Section */}
            <section className="py-24 bg-white">
              <div className="max-w-4xl mx-auto px-6">
                <div className="text-center mb-16 space-y-4">
                  <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">Frequently Asked Questions</h2>
                  <p className="text-slate-500 font-bold uppercase text-xs tracking-widest">Everything you need to know about the program</p>
                </div>
                <div className="space-y-4">
                  {[
                    { q: "Is there a cost to join the partner program?", a: "No, there is no upfront fee to join. We only charge for the credits or subscriptions you use as part of your partner tier." },
                    { q: "How long does the approval process take?", a: "Most applications are reviewed and approved within 24 business hours. You'll receive an email notification once your status is updated." },
                    { q: "Can I upgrade or downgrade my tier later?", a: "Absolutely. You can move between Agency, Strategic, and Affiliate tiers as your business needs evolve." },
                    { q: "Do you offer technical support for API integrations?", a: "Yes, our Integrator and Strategic partners get a direct Slack line to our engineering team for technical guidance." }
                  ].map((faq, i) => (
                    <div key={i} className="p-8 rounded-[2rem] bg-slate-50 hover:bg-slate-100 transition-all cursor-pointer group">
                      <div className="flex items-center justify-between gap-4">
                        <h4 className="text-lg font-black text-slate-900">{faq.q}</h4>
                        <div className="w-8 h-8 rounded-full border-2 border-slate-200 flex items-center justify-center group-hover:border-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                          <ChevronRight className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                        </div>
                      </div>
                      <p className="mt-4 text-slate-600 font-medium leading-relaxed">
                        {faq.a}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* CTA Final */}
            <section className="py-32 px-6">
              <div className="max-w-5xl mx-auto rounded-[4rem] bg-blue-600 p-12 md:p-24 text-center text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[80px] -mr-32 -mt-32" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-[80px] -ml-32 -mb-32" />
                
                <div className="relative z-10 space-y-10">
                  <h2 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">
                    Ready to take your agency <br /> to the next level?
                  </h2>
                  <p className="text-xl text-blue-100 font-medium max-w-xl mx-auto">
                    Applications are reviewed within 24 hours. Join the elite network of local SEO professionals today.
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                    <Button className="h-16 px-12 rounded-2xl bg-white text-blue-600 font-black text-xl hover:bg-slate-100 transition-all shadow-2xl">
                      Apply Now
                    </Button>
                    <button className="text-white font-black text-lg flex items-center gap-2 hover:gap-4 transition-all group">
                      Talk to Sales <ArrowRight className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Secondary Sub-nav */}
      <div className="sticky top-28 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="hidden md:flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Users className="w-6 h-6" />
            </div>
            <span className="text-2xl font-black text-slate-900 tracking-tight">Partners</span>
          </div>
          <nav className="flex items-center gap-6 md:gap-10 h-full overflow-x-auto scrollbar-hide no-scrollbar flex-nowrap">
            {tabs.map((tab) => (
              <button 
                key={tab.name} 
                onClick={() => setActiveTab(tab.name)}
                className={`text-sm font-black transition-all relative h-full flex items-center gap-2 whitespace-nowrap flex-shrink-0 ${activeTab === tab.name ? 'text-slate-900' : 'text-slate-400 hover:text-slate-900'}`}
              >
                {tab.name}
                {activeTab === tab.name && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-full" />
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <main className="min-h-screen">
        {renderContent()}
      </main>

      <Footer/>
    </div>
  )
}

export default PartnersPage