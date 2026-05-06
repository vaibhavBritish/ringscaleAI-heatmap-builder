'use client'

import React, { useState } from 'react'
import { 
  Search, 
  MapPin, 
  MessageSquare, 
  Share2, 
  BarChart3, 
  Users, 
  ChevronRight, 
  ArrowRight,
  Sparkles,
  Zap,
  Globe,
  Database,
  Brain,
  Layers,
  CheckCircle2,
  Phone,
  Mail,
  Smartphone,
  Ticket,
  ClipboardList,
  Star,
  ExternalLink
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCountry } from '@/hooks/use-country'

const AgenticPlatformContent = () => {
  const [activeIndustry, setActiveIndustry] = useState('Healthcare')
  const { isIndia } = useCountry()

  const meetingLink = isIndia 
    ? "https://calendly.com/d/cxz8-97v-6m8/20-mins-product-demo-ringscale-ai?month=2026-05"
    : "https://calendly.com/ringscalemedia-info/ringscale-strategy-call"

  const industries = [
    'Healthcare', 'Real Estate', 'Finance', 'Self Storage', 'Dental', 'Restaurants', 'Legal', 'Auto', 'Retail'
  ]

  const industryData = {
    'Healthcare': {
      quote: "Ringscale AI has given me the perspective and agility I need to effectively manage our expansive footprint easily.",
      author: "Ken Norquist",
      company: "Axia Women's Health",
      image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=800",
      stackText: "Connects to your PMS, EHR, and the sites patients trust",
      logos: [
        { name: 'Google', type: 'img', src: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg' },
        { name: 'Facebook', type: 'img', src: 'https://upload.wikimedia.org/wikipedia/commons/5/51/Facebook_f_logo_%282019%29.svg' },
        { name: 'Healthgrades', type: 'text', color: 'text-blue-600' },
        { name: 'Zocdoc', type: 'text', color: 'text-blue-400', icon: true },
        { name: 'WebMD', type: 'text', color: 'text-blue-900', italic: true },
        { name: 'Athenahealth', type: 'text', color: 'text-purple-600' },
        { name: 'DrChrono', type: 'text', color: 'text-green-600', icon: true },
        { name: 'Nextech', type: 'text', color: 'text-teal-600', icon: true }
      ]
    },
    'Real Estate': {
      quote: "Managing 500+ property listings across different regions used to be a nightmare until we automated it with Ringscale AI.",
      author: "Sarah Jenkins",
      company: "Elite Living Properties",
      image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=800",
      stackText: "Syncs with your CRM, MLS, and top real estate portals",
      logos: [
        { name: 'Zillow', type: 'text', color: 'text-blue-500' },
        { name: 'Realtor.com', type: 'text', color: 'text-red-600' },
        { name: 'Salesforce', type: 'text', color: 'text-blue-400' },
        { name: 'Redfin', type: 'text', color: 'text-red-500' },
        { name: 'Apartments.com', type: 'text', color: 'text-green-600' },
        { name: 'Follow Up Boss', type: 'text', color: 'text-blue-900' },
        { name: 'LionDesk', type: 'text', color: 'text-orange-500' },
        { name: 'Yardi', type: 'text', color: 'text-slate-800' }
      ]
    },
    'Finance': {
      quote: "Compliance and local brand consistency are non-negotiable for us. Ringscale AI handles both autonomously.",
      author: "David Chen",
      company: "First National Bancorp",
      image: "https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?auto=format&fit=crop&q=80&w=800",
      stackText: "Integrates with banking cores and compliance trackers",
      logos: [
        { name: 'Fiserv', type: 'text', color: 'text-orange-600' },
        { name: 'Jack Henry', type: 'text', color: 'text-blue-800' },
        { name: 'Compliance.ai', type: 'text', color: 'text-red-500' },
        { name: 'BankerBay', type: 'text', color: 'text-blue-600' },
        { name: 'Mambu', type: 'text', color: 'text-indigo-600' },
        { name: 'nCino', type: 'text', color: 'text-green-500' },
        { name: 'Finastra', type: 'text', color: 'text-purple-600' },
        { name: 'Plaid', type: 'text', color: 'text-slate-900' }
      ]
    },
    'Self Storage': {
      quote: "Occupancy rates at our multi-city facilities spiked within 60 days of deploying the Ringscale Agentic stack.",
      author: "Mike Rodriguez",
      company: "SafeSpace Storage",
      image: "https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?auto=format&fit=crop&q=80&w=800",
      stackText: "Connects with SiteLink, storEDGE, and local maps",
      logos: [
        { name: 'SiteLink', type: 'text', color: 'text-red-600' },
        { name: 'storEDGE', type: 'text', color: 'text-orange-500' },
        { name: 'SelfStorage.com', type: 'text', color: 'text-blue-600' },
        { name: 'SpareFoot', type: 'text', color: 'text-green-600' },
        { name: '6Storage', type: 'text', color: 'text-blue-400' },
        { name: 'Storable', type: 'text', color: 'text-blue-900' },
        { name: 'DoorLoop', type: 'text', color: 'text-indigo-500' },
        { name: 'RentManager', type: 'text', color: 'text-blue-800' }
      ]
    },
    'Dental': {
      quote: "Patients find us easier and book faster. The AI agents respond to questions before we even see them.",
      author: "Dr. Emily Smith",
      company: "SmileBright Dental",
      image: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=800",
      stackText: "Integrates with Dentrix, Open Dental, and local search",
      logos: [
        { name: 'Dentrix', type: 'text', color: 'text-blue-700' },
        { name: 'Open Dental', type: 'text', color: 'text-green-600' },
        { name: 'Curve Dental', type: 'text', color: 'text-blue-400' },
        { name: 'CareStack', type: 'text', color: 'text-blue-600' },
        { name: 'PatientPrism', type: 'text', color: 'text-purple-500' },
        { name: 'RevenueWell', type: 'text', color: 'text-red-500' },
        { name: 'Solutionreach', type: 'text', color: 'text-indigo-600' },
        { name: 'Lighthouse 360', type: 'text', color: 'text-blue-500' }
      ]
    },
    'Restaurants': {
      quote: "Keeping menus and hours updated across 40 locations is finally automated. It's a game changer for our ops team.",
      author: "James Wilson",
      company: "Coastal Grill Group",
      image: "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&q=80&w=800",
      stackText: "Syncs with Toast, Yelp, and delivery platforms",
      logos: [
        { name: 'Toast', type: 'text', color: 'text-orange-500' },
        { name: 'Yelp', type: 'text', color: 'text-red-600' },
        { name: 'OpenTable', type: 'text', color: 'text-red-500' },
        { name: 'UberEats', type: 'text', color: 'text-green-500' },
        { name: 'DoorDash', type: 'text', color: 'text-red-400' },
        { name: 'Grubhub', type: 'text', color: 'text-red-700' },
        { name: 'SevenRooms', type: 'text', color: 'text-slate-800' },
        { name: 'Olo', type: 'text', color: 'text-blue-600' }
      ]
    },
    'Legal': {
      quote: "In a high-intent industry like legal, response time is everything. Our AI agents ensure we never miss a lead.",
      author: "Robert Miller",
      company: "Miller & Associates",
      image: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=800",
      stackText: "Connects with Clio, MyCase, and legal directories",
      logos: [
        { name: 'Clio', type: 'text', color: 'text-blue-600' },
        { name: 'MyCase', type: 'text', color: 'text-blue-500' },
        { name: 'Avvo', type: 'text', color: 'text-blue-800' },
        { name: 'FindLaw', type: 'text', color: 'text-green-600' },
        { name: 'Justia', type: 'text', color: 'text-red-600' },
        { name: 'Filevine', type: 'text', color: 'text-indigo-600' },
        { name: 'PracticePanther', type: 'text', color: 'text-orange-500' },
        { name: 'Smokeball', type: 'text', color: 'text-blue-400' }
      ]
    },
    'Auto': {
      quote: "Drive more test drives by ensuring every dealership's local profile is fully optimized and responding to every inquiry.",
      author: "Carlos Mendez",
      company: "Summit Auto Group",
      image: "https://images.unsplash.com/photo-1550355291-bbee04a92027?auto=format&fit=crop&q=80&w=800",
      stackText: "Integrates with Dealer.com, CDK Global, and local maps",
      logos: [
        { name: 'Dealer.com', type: 'text', color: 'text-blue-600' },
        { name: 'CDK Global', type: 'text', color: 'text-red-600' },
        { name: 'Cars.com', type: 'text', color: 'text-purple-600' },
        { name: 'AutoTrader', type: 'text', color: 'text-orange-500' },
        { name: 'TrueCar', type: 'text', color: 'text-slate-900' },
        { name: 'CarGurus', type: 'text', color: 'text-blue-500' },
        { name: 'VinSolutions', type: 'text', color: 'text-green-600' },
        { name: 'Reynolds', type: 'text', color: 'text-blue-800' }
      ]
    },
    'Retail': {
      quote: "Bringing digital scale to our physical stores. We now manage localized seasonal campaigns across 200+ stores instantly.",
      author: "Linda G.",
      company: "Urban Trend Retail",
      image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=800",
      stackText: "Syncs with Shopify POS, Square, and retail maps",
      logos: [
        { name: 'Shopify', type: 'text', color: 'text-green-600' },
        { name: 'Square', type: 'text', color: 'text-slate-900' },
        { name: 'Magento', type: 'text', color: 'text-orange-600' },
        { name: 'BigCommerce', type: 'text', color: 'text-blue-600' },
        { name: 'Lightspeed', type: 'text', color: 'text-red-500' },
        { name: 'NetSuite', type: 'text', color: 'text-blue-400' },
        { name: 'WooCommerce', type: 'text', color: 'text-purple-600' },
        { name: 'Salesforce Commerce', type: 'text', color: 'text-blue-500' }
      ]
    }
  }

  const agents = [
    {
      title: 'Keep every location accurate',
      description: 'Sync info across 50+ sites so customers always find the right hours, address, and details.',
      label: 'Listings optimization agent',
      icon: <MapPin className="w-5 h-5" />
    },
    {
      title: 'Be the #1 answer on ChatGPT',
      description: 'Track how you show up on AI platforms and fix what\'s hurting your visibility.',
      label: 'Search AI agent',
      icon: <Search className="w-5 h-5" />
    },
    {
      title: 'Respond to every review, in your voice',
      description: 'Draft and publish replies across Google, Yelp, and Facebook — fast, on-brand, at scale.',
      label: 'Reviews response agent',
      icon: <Star className="w-5 h-5" />
    },
    {
      title: 'Post locally without added headcount',
      description: 'Create and publish location-relevant content — on-brand, on-schedule, no manual work.',
      label: 'Social publishing agent',
      icon: <Share2 className="w-5 h-5 rotate-[-45deg]" />
    },
    {
      title: 'See what\'s working and what to fix',
      description: 'Analyze every location and surface the highest-impact actions.',
      label: 'Insights agent',
      icon: <Brain className="w-5 h-5" />
    },
    {
      title: 'Build segments in plain English',
      description: 'Describe your audience — get a ready-to-use list in seconds, no filters or rules required.',
      label: 'Segmentation agent',
      icon: <Layers className="w-5 h-5" />
    }
  ]

  const results = [
    {
      stat: "400%",
      subtext: "increase in social publishing",
      logo: "https://upload.wikimedia.org/wikipedia/en/thumb/d/d3/Valley_Veterinary_Hospital_Logo.png/220px-Valley_Veterinary_Hospital_Logo.png",
      logoType: "img",
      logoName: "Valley Veterinary",
      quote: "Ringscale Social allows us to post across locations while still connecting with our communities. We can post in bulk while keeping the voice of the practice without the tediousness of posting individually to each account.",
      author: "Meghan S. Bingham",
      role: "CVPM Senior Operations Manager, Valley Veterinary Care",
      color: "bg-[#F7FAF7]"
    },
    {
      stat: "86%",
      subtext: "increase in direction requests",
      logo: "Superior Storage",
      logoType: "text",
      logoName: "Superior Storage",
      quote: "Ringscale does the hard work, making our jobs easier, and provides top-notch service to better your business.",
      author: "Brandon Wipperfurth",
      role: "Director of Marketing, Superior Storage",
      color: "bg-[#F7FAF7]"
    },
    {
      stat: "25%",
      subtext: "increase in digital interactions in just 6 months",
      logo: "Pacifica Senior Living",
      logoType: "text",
      logoName: "Pacifica Senior Living",
      quote: "Having a platform where everything is monitored in one place makes such a difference and has streamlined our approach to social media. This has such a huge impact on our processes and the amount of manpower it takes to keep up.",
      author: "Carly Dodd",
      role: "Content Manager, Pacifica Senior Living",
      color: "bg-[#F7FAF7]"
    }
  ]

  const currentData = industryData[activeIndustry] || industryData['Healthcare']

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative h-[80vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="/agentic-hero-bg.png" 
            alt="Futuristic AI Connectivity" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[1px]" />
        </div>
        
        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center text-white">
          <h1 className="text-4xl md:text-5xl font-black mb-6 leading-[1.1] animate-in fade-in slide-in-from-bottom duration-1000 tracking-tighter">
            #1 Agentic Marketing Platform <br /> for Multi-location Brands
          </h1>
          <p className="text-lg md:text-xl font-medium mb-10 text-white/90 animate-in fade-in slide-in-from-bottom duration-1000 delay-200 max-w-2xl mx-auto leading-relaxed">
            One platform to consolidate data, think locally, and act at scale.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom duration-1000 delay-500">
            <a href={meetingLink} target="_blank" rel="noopener noreferrer">
              <Button className="h-14 px-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm shadow-xl transition-all hover:scale-105 uppercase tracking-wider">
                Watch Demo
              </Button>
            </a>
            <Button variant="outline" className="h-14 px-10 rounded-xl border-white/20 bg-white/5 text-white font-black text-sm hover:bg-white/10 backdrop-blur-sm uppercase tracking-wider">
              Explore Products
            </Button>
          </div>
        </div>
      </section>

      {/* AI Agents Grid */}
      <section className="py-24 max-w-7xl mx-auto px-6" id="products">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-6">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter leading-tight max-w-3xl">
            Where <Sparkles className="text-blue-600 w-8 h-8 inline-block align-middle mb-1 mx-1" /> AI Agents work for you across every marketing function
          </h2>
          <Button variant="outline" className="h-11 px-6 rounded-lg border-slate-200 font-black text-slate-900 hover:bg-slate-50 flex items-center gap-2 group text-xs uppercase tracking-widest transition-all">
            See all Products <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform rotate-[-45deg]" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {agents.map((agent, i) => (
            <div key={i} className="p-8 rounded-[2rem] bg-white border border-slate-100 hover:border-blue-600/20 hover:shadow-[0_20px_50px_rgba(0,0,0,0.03)] transition-all duration-500 group relative flex flex-col h-full cursor-pointer">
              <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-900 mb-8 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
                {agent.icon}
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-3 leading-tight tracking-tight">{agent.title}</h3>
              <p className="text-slate-500 font-medium text-sm mb-10 flex-grow leading-relaxed">{agent.description}</p>
              
              <div className="flex items-center justify-between pt-6 border-t border-slate-100 mt-auto">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{agent.label}</span>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all">
                  <ArrowRight className="w-5 h-5 rotate-[-45deg]" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Industry Section */}
      <section className="py-24 bg-slate-50 overflow-hidden border-y border-slate-100" id="industries">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
            <div className="space-y-3 max-w-2xl">
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter leading-tight">
                Built for your industry. Connected to your stack.
              </h2>
              <p className="text-slate-500 font-medium text-base md:text-lg leading-relaxed">Your platforms. Your workflows. Your industry expertise — built in.</p>
            </div>
            <Button variant="outline" className="h-11 px-6 rounded-lg border-slate-200 font-black text-slate-900 hover:bg-white flex items-center gap-2 group text-xs uppercase tracking-widest transition-all">
              See all Integrations <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform rotate-[-45deg]" />
            </Button>
          </div>

          {/* Industry Tabs */}
          <div className="flex items-center gap-1.5 mb-12 overflow-x-auto no-scrollbar pb-2 -mx-6 px-6">
            {industries.map((industry) => (
              <button
                key={industry}
                onClick={() => setActiveIndustry(industry)}
                className={`px-6 py-2.5 rounded-lg font-black text-[11px] uppercase tracking-wider transition-all whitespace-nowrap ${
                  activeIndustry === industry 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                  : 'text-slate-500 hover:text-slate-900 hover:bg-white border border-transparent hover:border-slate-100'
                }`}
              >
                {industry}
              </button>
            ))}
          </div>

          <div className="relative p-10 md:p-14 rounded-[3.5rem] bg-white border border-slate-100 overflow-hidden flex flex-col lg:flex-row gap-16 items-center min-h-[550px] shadow-sm">
            <div className="absolute top-8 left-8 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 font-black text-[9px] uppercase tracking-[0.2em] text-slate-400 z-20">
              Ringscale AI for {activeIndustry}
            </div>
            
            <div className="flex-1 space-y-8 relative z-10 animate-in fade-in slide-in-from-bottom duration-500 key={activeIndustry}">
              <blockquote className="text-2xl md:text-3xl font-black text-slate-900 leading-[1.15] tracking-tighter">
                “{currentData.quote}”
              </blockquote>
              <div className="space-y-0.5">
                <p className="text-lg font-black text-slate-900">{currentData.author}</p>
                <p className="text-slate-400 font-bold text-sm uppercase tracking-wide">{currentData.company}</p>
              </div>
            </div>

            <div className="flex-1 w-full flex flex-col items-center relative z-10 animate-in fade-in slide-in-from-bottom duration-700 delay-100">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-10 text-center">
                {currentData.stackText}
              </div>
              
              <div className="relative w-full max-w-md aspect-[1.2/1] bg-white rounded-[3rem] border border-slate-100 p-8 flex items-center justify-center shadow-inner overflow-hidden">
                 
                 {/* Connection lines (Sized to container) */}
                 <div className="absolute inset-0 pointer-events-none opacity-10">
                    <svg className="w-full h-full" viewBox="0 0 500 400">
                      <path d="M 60 100 L 250 200 M 60 160 L 250 200 M 60 220 L 250 200 M 60 280 L 250 200" stroke="#000" strokeWidth="1.2" fill="none" />
                      <path d="M 440 100 L 250 200 M 440 200 L 250 200 M 440 300 L 250 200" stroke="#000" strokeWidth="1.2" fill="none" />
                    </svg>
                 </div>

                 <div className="flex items-center justify-between w-full px-4 relative z-10">
                    {/* Left Column */}
                    <div className="flex flex-col gap-10 items-end flex-1">
                       {currentData.logos.slice(0, 4).map((logo, idx) => (
                          <div key={idx} className="animate-in fade-in slide-in-from-left duration-500" style={{ transitionDelay: `${idx * 100}ms` }}>
                             {logo.type === 'img' ? (
                                <img src={logo.src} alt={logo.name} className="h-5 opacity-80 hover:opacity-100 transition-opacity" />
                             ) : (
                                <div className={`${logo.color} font-black text-[12px] ${logo.italic ? 'italic' : ''} flex items-center gap-1 opacity-80 hover:opacity-100 transition-opacity whitespace-nowrap`}>
                                   {logo.icon && <span className="w-1.5 h-1.5 bg-current rounded-sm" />} {logo.name}
                                </div>
                             )}
                          </div>
                       ))}
                    </div>
                    
                    {/* Center Brand */}
                    <div className="relative z-30 mx-8">
                       <div className="bg-white px-4 py-3 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.12)] border border-slate-100 flex items-center gap-2 scale-90">
                          <Zap className="w-5 h-5 fill-blue-600 text-blue-600" />
                          <span className="text-blue-600 font-black text-base italic tracking-tighter">Ringscale AI</span>
                       </div>
                    </div>

                    {/* Right Column */}
                    <div className="flex flex-col gap-10 items-start flex-1">
                       {currentData.logos.slice(4, 8).map((logo, idx) => (
                          <div key={idx} className="animate-in fade-in slide-in-from-right duration-500" style={{ transitionDelay: `${idx * 100}ms` }}>
                             {logo.type === 'img' ? (
                                <img src={logo.src} alt={logo.name} className="h-5 opacity-80 hover:opacity-100 transition-opacity" />
                             ) : (
                                <div className={`${logo.color} font-black text-[12px] ${logo.italic ? 'italic' : ''} flex items-center gap-1 opacity-80 hover:opacity-100 transition-opacity whitespace-nowrap`}>
                                   {logo.icon && <span className="w-1.5 h-1.5 bg-current rounded-sm" />} {logo.name}
                                </div>
                             )}
                          </div>
                       ))}
                    </div>
                 </div>
              </div>
            </div>

            <div className="lg:w-1/4 h-full hidden lg:block self-stretch overflow-hidden rounded-[2.5rem]">
              <img 
                src={currentData.image} 
                alt={`${activeIndustry} Professional`} 
                className="object-cover h-full w-full transition-all duration-1000 grayscale-[0.2] hover:grayscale-0"
              />
            </div>
          </div>
        </div>
      </section>

      {/* The Agentic Marketing Platform Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter mb-5">
            The Agentic Marketing Platform
          </h2>
          <Button variant="outline" className="h-12 px-8 rounded-xl border-slate-200 font-black text-slate-900 mb-20 group text-xs uppercase tracking-widest transition-all">
            Learn more <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform rotate-[-45deg] ml-2" />
          </Button>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 text-left max-w-4xl mx-auto">
            <div className="space-y-5">
              <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center mb-6 border border-slate-100">
                 <Database className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Full-cycle</h3>
              <p className="text-base text-slate-500 font-medium leading-relaxed">
                Replace point tools with one platform for awareness, conversion, and customer experience.
              </p>
            </div>

            <div className="space-y-5">
              <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center mb-6 border border-slate-100">
                 <Brain className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Agentic</h3>
              <p className="text-base text-slate-500 font-medium leading-relaxed">
                Unprecedented AI agents consolidating data, thinking locally, and acting at scale to drive outcomes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Circular Platform Diagram Section */}
      <section className="py-32 bg-white relative overflow-hidden">
        <div className="max-w-[1100px] mx-auto px-6 relative z-10">
          <div className="flex flex-col xl:flex-row items-center justify-center gap-12 xl:gap-0">
            
            {/* Customer Experience Box */}
            <div className="w-full xl:w-[280px] p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-xl space-y-6 relative group xl:-mr-10 z-30">
              <h3 className="text-xl font-black text-slate-900 mb-1 tracking-tight leading-none">Customer Experience</h3>
              <ul className="space-y-5">
                {[
                  { n: 'Surveys AI', i: <ClipboardList className="w-4 h-4" /> },
                  { n: 'Referrals', i: <Sparkles className="w-4 h-4" /> },
                  { n: 'Ticketing', i: <Ticket className="w-4 h-4" /> },
                  { n: 'Insights', i: <Brain className="w-4 h-4" /> },
                  { n: 'Competitors', i: <Users className="w-4 h-4" /> }
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-3.5 text-slate-500 font-bold text-sm group/item hover:text-blue-600 transition-colors cursor-pointer">
                    <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center group-hover/item:bg-blue-50 transition-colors">
                      {item.i}
                    </div>
                    {item.n}
                  </li>
                ))}
              </ul>
            </div>

            {/* Circular Diagram Core */}
            <div className="relative w-[320px] h-[320px] md:w-[550px] md:h-[550px] flex items-center justify-center z-20">
              {/* Outer Rings */}
              <div className="absolute inset-0 rounded-full border border-slate-100 bg-slate-50/10" />
              <div className="absolute w-[88%] h-[88%] rounded-full border border-slate-100/50 bg-white shadow-xl" />
              
              {/* Labels Overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                 <div className="w-full h-full relative">
                    <div className="absolute top-[6%] left-1/2 -translate-x-1/2 text-slate-900 font-black text-xl uppercase tracking-[0.25em] bg-white px-5">Awareness</div>
                    <div className="absolute bottom-[6%] left-1/2 -translate-x-1/2 text-slate-900 font-black text-xl uppercase tracking-[0.25em] bg-white px-5">Conversion</div>
                    <div className="absolute top-1/2 left-[4%] -translate-x-1/2 -translate-y-1/2 text-slate-900 font-black text-xl uppercase tracking-[0.25em] bg-white px-5 [writing-mode:vertical-lr] rotate-180">Experience</div>
                 </div>
              </div>

              {/* Internal Structure */}
              <div className="absolute w-[58%] h-[58%] rounded-full border border-slate-100 flex items-center justify-center bg-white shadow-inner">
                 <div className="absolute inset-0 rounded-full border-[1rem] border-blue-50/20" />
                 
                 <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-full h-full relative rotate-[45deg]">
                       <div className="absolute top-3 left-1/2 -translate-x-1/2 text-slate-400 font-black text-[9px] uppercase tracking-[0.2em] flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5" /> AI Agents
                       </div>
                       <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-slate-400 font-black text-[9px] uppercase tracking-[0.2em]">Context</div>
                       <div className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400 font-black text-[9px] uppercase tracking-[0.2em] [writing-mode:vertical-lr] rotate-180">Memory</div>
                       <div className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 font-black text-[9px] uppercase tracking-[0.2em] [writing-mode:vertical-lr]">Unified Data</div>
                    </div>
                 </div>

                 {/* Center Logo */}
                 <div className="w-32 h-32 md:w-44 md:h-44 rounded-full bg-white shadow-2xl flex flex-col items-center justify-center p-5 border border-slate-50 relative z-20 group transition-transform hover:scale-105 duration-700">
                    <div className="text-blue-600 font-black text-2xl md:text-3xl italic mb-0 flex items-center gap-1 tracking-tighter">
                      <Zap className="w-6 h-6 fill-blue-600" /> Ringscale
                    </div>
                    <div className="text-blue-600 font-black text-xl md:text-2xl uppercase tracking-tighter opacity-80">AI</div>
                 </div>
              </div>
            </div>

            {/* Right Side Boxes Stack */}
            <div className="w-full xl:w-[320px] space-y-8 xl:-ml-10 z-30">
              
              {/* Online Reputation Box */}
              <div className="p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-xl space-y-6 relative group">
                <h3 className="text-xl font-black text-slate-900 mb-1 tracking-tight leading-none">Online Reputation</h3>
                <ul className="space-y-5">
                  {[
                    { n: 'Reviews', i: <Star className="w-4 h-4" /> },
                    { n: 'Listings', i: <MapPin className="w-4 h-4" /> },
                    { n: 'Search AI', i: <Search className="w-4 h-4" /> },
                    { n: 'Social', i: <Share2 className="w-4 h-4" /> },
                    { n: 'Pages', i: <Globe className="w-4 h-4" /> }
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-center gap-3.5 text-slate-500 font-bold text-sm group/item hover:text-blue-600 transition-colors cursor-pointer">
                      <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center group-hover/item:bg-blue-50 transition-colors">
                        {item.i}
                      </div>
                      {item.n}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Marketing Automation Box */}
              <div className="p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-xl space-y-6 relative group">
                <h3 className="text-xl font-black text-slate-900 mb-1 tracking-tight leading-none">Automation</h3>
                <ul className="space-y-5">
                  {[
                    { n: 'Marketing Automation', i: <Zap className="w-4 h-4" /> },
                    { n: 'Mass Texting', i: <Smartphone className="w-4 h-4" /> },
                    { n: 'Chatbot', i: <MessageSquare className="w-4 h-4" /> }
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-center gap-3.5 text-slate-500 font-bold text-sm group/item hover:text-blue-600 transition-colors cursor-pointer">
                      <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center group-hover/item:bg-blue-50 transition-colors">
                        {item.i}
                      </div>
                      {item.n}
                    </li>
                  ))}
                </ul>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* Customer Results Section (Moved to end) */}
      <section className="py-24 max-w-7xl mx-auto px-6 border-t border-slate-100">
        <div className="flex justify-between items-center mb-12">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter">Customer results</h2>
          <Button variant="outline" className="h-10 px-5 rounded-lg border-slate-200 font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-2 text-xs transition-all">
            See all case studies <ExternalLink className="w-3.5 h-3.5" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {results.map((result, i) => (
            <div key={i} className="rounded-[2.5rem] bg-white border border-slate-100 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col h-full">
              <div className={`p-10 ${result.color} space-y-2`}>
                <div className="text-5xl font-black text-slate-900 tracking-tighter">{result.stat}</div>
                <div className="text-base font-bold text-slate-900/80 leading-tight">{result.subtext}</div>
                <div className="pt-6">
                   {result.logoType === 'img' ? (
                      <img src={result.logo} alt={result.logoName} className="h-10 object-contain grayscale opacity-80" />
                   ) : (
                      <div className="text-slate-900 font-black text-lg tracking-tight flex items-center gap-2">
                         <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                            <Users className="w-4 h-4 text-slate-400" />
                         </div>
                         {result.logoName}
                      </div>
                   )}
                </div>
              </div>
              <div className="p-10 flex flex-col flex-grow bg-white">
                <p className="text-slate-600 font-medium text-sm leading-relaxed mb-10 flex-grow italic">
                  “{result.quote}”
                </p>
                <div className="pt-6 border-t border-slate-100">
                  <div className="font-black text-slate-900 text-sm mb-1">{result.author}</div>
                  <div className="text-slate-400 font-bold text-[10px] uppercase tracking-wider leading-relaxed">{result.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  )
}

export default AgenticPlatformContent
