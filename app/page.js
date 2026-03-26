'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MapPin, BarChart3, Zap, Target, TrendingUp, Shield, Settings, Rocket, Trophy, Check } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Image from 'next/image'

const updates = [
  {
    tag: "COMPARE & SHARE SCANS",
    title: "Ringscale AI 1.5",
    desc: "View changes across scans. Export. Share. Done.",
    user: {
      name: "Shaun Mitchell",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Shaun",
      feedback: "Massive update and absolutely love it! The UI is so awesome"
    },
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop",
  },
  {
    tag: "INTRODUCING",
    title: "Ringscale AI 1.5",
    user: {
      name: "Larry Hickman",
      date: "5d",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Larry",
      feedback: "Absolutely loving this update! Showing the number of competitor is great! Showing the competitors pin based on their address is awesome!"
    },
    image: "https://images.unsplash.com/photo-1543286386-713bdd548da4?w=600&h=400&fit=crop",
  },
  {
    tag: "INTRODUCING",
    title: "Ringscale AI 1.5",
    desc: "Sharper grids and easier to read heatmaps.",
    user: {
      name: "Brad Johnson",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Brad",
      feedback: "Eldar Cohen New U/X is killer!"
    },
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop",
  },
  {
    tag: "CLEARER COMPETITOR INSIGHTS WITH",
    title: "Ringscale AI 1.5",
    desc: "Click any pin - spot rank gaps FAST!",
    user: {
      name: "Brian Ford",
      date: "8m",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Brian",
      feedback: "I love this update! Thank you!"
    },
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop",
  }
];

const seoSolutions = [
  {
    title: "One Time Scan",
    desc: "Unlock insights, outpace competitors, and streamline reporting in one scan.",
    features: [
      "Instantly scan keywords across a custom grid.",
      "Identify current ranking positions easily.",
      "Download reports as clear, shareable PDFs."
    ]
  },
  {
    title: "Recurring Scan",
    desc: "Stay on top of your SEO game with automated scans.",
    features: [
      "Schedule scans to run at regular intervals.",
      "Automate monitoring for ranking fluctuations.",
      "Get notified of significant changes in performance."
    ]
  },
  {
    title: "GBP Management",
    desc: "All-in-One Google Maps listings management dashboard.",
    features: [
      "Manage profile details from one dashboard.",
      "Track performance of every location.",
      "Optimize listings for better visibility."
    ]
  },
  {
    title: "Service Area Business",
    desc: "Caters businesses that serve a particular area without a physical storefront.",
    features: [
      "Target precise coordinates within your service zone.",
      "View ranking distribution beyond your address.",
      "Ideal for mobile service providers."
    ]
  },
  {
    title: "White Label Reports",
    desc: "Turn complex SEO insights into client-friendly reports that showcase your expertise.",
    features: [
      "Build client reports using your own brand.",
      "Deliver professional insights in minutes.",
      "Automate report delivery to your clients."
    ]
  }
];

export default function HomePage() {
  const sliderRef = useRef(null)
  const [activeGbpFeature, setActiveGbpFeature] = useState(1)
  const [activeRankFeature, setActiveRankFeature] = useState(3)
  const [activeReportFeature, setActiveReportFeature] = useState(2)
  const [activeEdgeFeature, setActiveEdgeFeature] = useState(3)
  const [isAnnual, setIsAnnual] = useState(false)

  const scrollLeft = () => {
    sliderRef.current.scrollBy({ left: -400, behavior: 'smooth' })
  }
  const scrollRight = () => {
    sliderRef.current.scrollBy({ left: 400, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Navigation */}
      <Navbar />

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-4 bg-white relative overflow-hidden">
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-700 text-sm font-bold mb-8 animate-bounce-slow">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              New: AI-Powered Review Automations
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 mb-8 leading-[1.1] tracking-tight">
              Dominating Local Search <br />
              <span className="bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 bg-clip-text text-transparent">
                Shouldn't Be Hard.
              </span>
            </h1>
            <p className="text-lg md:text-xl text-slate-500 font-medium mb-12 max-w-2xl mx-auto leading-relaxed">
              Visualize, track, and optimize your local presence with the world's most accurate geo-grid heatmap system.
            </p>

            <Link href="/register">
              <Button size="lg" className="bg-gradient-to-r from-blue-700 to-blue-400 hover:from-blue-800 hover:to-blue-500 text-white rounded-full text-2xl font-black px-12 py-10 shadow-2xl hover:scale-105 transition-all flex items-center gap-4 mx-auto">
                Start Free Trial* <span className="text-3xl">→</span>
              </Button>
            </Link>

            <p className="text-slate-500 mt-10 text-lg font-bold">
              *7-day free trial, no credit card required
            </p>
          </div>
        </div>
      </section>

      {/* Product Mockup */}
      <section className="pb-20 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="relative rounded-2xl overflow-hidden shadow-2xl border bg-slate-900">
            <div className="absolute top-0 left-0 right-0 h-8 bg-slate-800 flex items-center px-4 gap-2">
              <div className="w-3 h-3 rounded-full bg-red-400"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
              <div className="w-3 h-3 rounded-full bg-green-400"></div>
            </div>
            <div className="pt-8 p-4">
              <img
                src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=600&fit=crop"
                alt="Dashboard Preview"
                className="rounded-lg w-full"
              />
            </div>
          </div>
        </div>
      </section>


      {/* Interactive Updates Marquee */}
      <section className="py-20 bg-slate-50 overflow-hidden border-y border-slate-100">
        <div className="container mx-auto px-4 mb-16 text-center animate-in fade-in duration-700">
          <h2 className="text-sm font-black text-blue-600 uppercase tracking-widest mb-4">Latest Insights</h2>
          <p className="text-2xl font-extrabold text-slate-800">What's happening right now</p>
        </div>

        <div className="relative group">
          <div className="flex marquee-container gap-8 hover:pause-on-hover px-4">
            {/* Display updates twice for seamless loop */}
            {[...updates, ...updates].map((update, index) => (
              <div
                key={index}
                className="flex-shrink-0 w-[450px] bg-blue-50/40 rounded-[2.5rem] p-10 border border-blue-100 flex flex-col gap-8 shadow-sm hover:shadow-xl transition-all duration-500"
              >
                <div className="space-y-4">
                  <span className="text-blue-500 font-bold text-xs tracking-[0.2em] uppercase">
                    {update.tag}
                  </span>
                  <h3 className="text-4xl font-black text-slate-900 tracking-tight">
                    {update.title}
                  </h3>
                  {update.desc && (
                    <p className="text-lg text-slate-600 font-semibold leading-snug">
                      {update.desc}
                    </p>
                  )}
                </div>

                <div className="relative rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white bg-white aspect-[4/3]">
                  <img
                    src={update.image}
                    alt={update.title}
                    className="w-full h-full object-cover opacity-90"
                  />

                  {update.user && (
                    <div className="absolute top-6 right-6 left-6 bg-white/95 backdrop-blur-sm shadow-2xl rounded-2xl p-6 flex gap-4 items-start border border-blue-50 scroll-reveal">
                      <div className="relative">
                        <img
                          src={update.user.avatar}
                          alt={update.user.name}
                          className="w-12 h-12 rounded-full border-2 border-blue-100 shadow-sm"
                        />
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center border-2 border-white">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-black text-sm text-slate-800">
                            {update.user.name} {update.user.date && <span className="mx-1 opacity-20">•</span>} <span className="text-slate-400 font-bold text-xs">{update.user.date}</span>
                          </span>
                        </div>
                        <p className="text-xs leading-relaxed text-slate-600 font-bold italic line-clamp-4">
                          "{update.user.feedback}"
                        </p>
                      </div>
                      <div className="absolute -bottom-3 right-6 w-6 h-6 bg-white border-r border-b border-blue-50 rotate-45"></div>
                    </div>
                  )}
                </div>

                <div className="mt-auto pt-8 flex items-center justify-between border-t border-blue-100/50">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                      The Most Accurate, Fastest & Affordable
                    </p>
                    <p className="text-[12px] font-black text-blue-600 uppercase tracking-tight">
                      Google Maps Rank Tracker
                    </p>
                  </div>
                  <div className="flex flex-col items-end opacity-80">
                    <span className="font-black text-sm text-slate-800 leading-none tracking-tighter">Local</span>
                    <span className="font-black text-sm text-blue-600 leading-none tracking-tighter">DOMINATOR</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-24 text-center">
          <Link href="/register">
            <Button
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-2xl font-black px-16 py-10 shadow-2xl shadow-blue-200 hover:scale-105 transition-all flex items-center gap-6 mx-auto"
            >
              Start Free Trial* <span className="text-3xl">→</span>
            </Button>
          </Link>
        </div>
      </section>

      {/* Horizontal Slider Section */}
      <section className="py-28 bg-[#001D4A] relative overflow-hidden group/slider">
        <div className="container mx-auto px-6 max-w-7xl relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-10 animate-in fade-in slide-in-from-bottom-6 duration-1000">
            <div className="max-w-2xl">
              <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-6 leading-tight tracking-tight">
                Local SEO Made Easy <br />
                <span className="text-blue-400 font-bold">In Just One Tool.</span>
              </h2>
              <p className="text-lg text-blue-100/70 font-medium leading-relaxed">
                Everything you need to scan, track, and optimize your Google Business Profiles for maximum visibility and customer conversion.
              </p>
            </div>

            <div className="flex gap-4 group-hover/slider:opacity-100 md:opacity-0 transition-opacity translate-y-2">
              {/* Navigation Arrows */}
              <button
                onClick={scrollLeft}
                className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-2xl text-blue-900 transition-all hover:scale-110 active:scale-95"
              >
                <span className="text-3xl">←</span>
              </button>
              <button
                onClick={scrollRight}
                className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-2xl text-blue-900 transition-all hover:scale-110 active:scale-95"
              >
                <span className="text-3xl">→</span>
              </button>
            </div>
          </div>

          <div
            ref={sliderRef}
            className="flex gap-6 px-10 pb-12 overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-smooth"
          >
            {seoSolutions.map((solution, index) => (
              <div
                key={index}
                className="group relative flex-shrink-0 w-[320px] md:w-[400px] h-[580px] bg-gradient-to-b from-[#E6F0FF] to-white rounded-[2.5rem] flex flex-col snap-center shadow-lg overflow-hidden transition-all duration-700 hover:shadow-2xl"
              >
                {/* Default State */}
                <div className="p-10 flex flex-col h-full bg-inherit transition-all duration-700 group-hover:opacity-0 group-hover:-translate-y-8">
                  <div className="space-y-6">
                    <h3 className="text-4xl font-black text-[#002B7F] leading-tight tracking-tight">
                      {solution.title}
                    </h3>
                    <p className="text-xl text-slate-600 font-bold leading-relaxed">
                      {solution.desc}
                    </p>
                  </div>

                  <div className="mt-auto pt-10 flex items-center gap-4 grayscale opacity-70">
                    <div className="w-10 h-10 rounded-xl bg-[#002B7F] flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1">
                        <span className="font-black text-xs text-slate-800 leading-none tracking-tighter uppercase">RINGSCALE </span>
                        <span className="font-black text-xs text-[#002B7F] leading-none tracking-tighter uppercase">AI</span>
                      </div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Your Agency Growth Partner</span>
                    </div>
                  </div>
                </div>

                {/* Hover State Checklist */}
                <div className="absolute inset-0 p-10 flex flex-col h-full bg-[#E6F0FF] opacity-0 translate-y-8 transition-all duration-700 group-hover:opacity-100 group-hover:translate-y-0">
                  <div className="inline-block px-8 py-3 rounded-2xl bg-[#000080] text-white text-xl font-black w-fit mb-10 shadow-lg">
                    {solution.title}
                  </div>

                  <div className="space-y-8 mb-auto">
                    {solution.features.map((feature, i) => (
                      <div key={i} className="flex gap-5 items-start animate-in fade-in slide-in-from-bottom-2 duration-500" style={{ animationDelay: `${i * 100}ms` }}>
                        <div className="w-7 h-7 rounded-full bg-[#3b82f6] flex items-center justify-center flex-shrink-0 mt-1 shadow-md">
                          <Check className="w-4 h-4 text-white stroke-[4px]" />
                        </div>
                        <span className="text-xl text-slate-800 font-bold leading-tight tracking-tight">
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>

                  <Link href="/register">
                    <Button className="w-full bg-gradient-to-r from-blue-700 to-blue-400 hover:from-blue-800 hover:to-blue-500 text-white rounded-2xl py-10 text-2xl font-black shadow-2xl hover:scale-[1.02] transition-all">
                      Start Free Trial* <span className="ml-3 text-3xl">→</span>
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* GBP Module Section */}
      <section className="py-24 bg-white overflow-hidden">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center mb-24 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-800 mb-6 leading-tight tracking-tight">
              Streamline Your Google Business Profiles with Ringscale AI's <span className="text-blue-600">Built-in GBP module</span>
            </h2>
            <p className="text-lg text-slate-500 font-semibold">
              With everything in one place, our dashboard streamlines your GBP's management, making it more efficient and effective.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-20 items-center lg:px-10">
            {/* Left Column: UI Mockup */}
            <div className="relative h-[600px] flex items-center justify-center scale-90 md:scale-100">
              {/* Main Dashboard Card */}
              <div className="bg-slate-50 rounded-[3rem] border border-slate-100 p-10 shadow-sm w-full">
                <div className="flex items-center justify-between mb-10 pb-6 border-b border-slate-200">
                  <span className="text-3xl font-black text-slate-800">GBP Posts</span>
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200"></div>
                    <div className="w-10 h-10 rounded-full bg-slate-200"></div>
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="h-4 w-full bg-slate-200 rounded-full"></div>
                  <div className="h-4 w-3/4 bg-slate-200 rounded-full"></div>
                  <div className="h-4 w-full bg-slate-200 rounded-full"></div>
                  <div className="h-4 w-1/2 bg-slate-200 rounded-full"></div>
                  <div className="h-4 w-full bg-slate-200 rounded-full"></div>
                </div>
              </div>

              {/* Overlapping Calendar Card */}
              <div className="absolute -bottom-4 -left-12 bg-white rounded-[2rem] border border-slate-100 p-8 shadow-2xl w-[320px] animate-in slide-in-from-left-8 duration-1000">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-5 h-5 rounded bg-blue-600 flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-base font-black text-slate-800">Schedule Post</span>
                </div>
                <div className="mb-6 flex justify-between items-center text-xs font-black text-slate-400">
                  <span>Start</span>
                  <span className="px-3 py-1 bg-slate-50 rounded-lg border border-slate-200">Select time</span>
                </div>
                <div className="bg-slate-50 rounded-2xl p-5">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-black">March 2025</span>
                    <div className="flex gap-2 text-slate-400 text-lg"><span>‹</span><span>›</span></div>
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-[10px] font-black text-slate-400 mb-2 text-center">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => <span key={d}>{d}</span>)}
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-[10px] font-black text-center">
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                      <span key={d} className={`py-1.5 transition-all ${d === 19 ? 'bg-blue-600 text-white rounded-full shadow-lg shadow-blue-200' : 'text-slate-600'}`}>
                        {d}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Overlapping Chart Card */}
              <div className="absolute top-1/2 -right-12 -translate-y-1/2 bg-white rounded-[3rem] border border-slate-100 p-10 shadow-2xl w-[280px] animate-in slide-in-from-right-8 duration-700">
                <span className="text-xl font-black text-slate-800 block mb-8 text-center uppercase tracking-tight">Post Summary</span>
                <div className="relative w-40 h-40 mx-auto mb-10">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="80" cy="80" r="65" fill="none" stroke="#f8fafc" strokeWidth="15" />
                    <circle cx="80" cy="80" r="65" fill="none" stroke="#10b981" strokeWidth="15" strokeDasharray="408" strokeDashoffset="80" />
                    <circle cx="80" cy="80" r="65" fill="none" stroke="#3b82f6" strokeWidth="15" strokeDasharray="408" strokeDashoffset="310" />
                    <circle cx="80" cy="80" r="65" fill="none" stroke="#f43f5e" strokeWidth="15" strokeDasharray="408" strokeDashoffset="380" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-black text-slate-800 leading-none">110</span>
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">Total</span>
                  </div>
                </div>
                <div className="space-y-3 px-2">
                  <div className="flex items-center gap-3 text-[#10b981] font-black text-xs">
                    <div className="w-2 h-2 rounded-full bg-current"></div>
                    <span>Live Posts (80)</span>
                  </div>
                  <div className="flex items-center gap-3 text-blue-600 font-black text-xs">
                    <div className="w-2 h-2 rounded-full bg-current"></div>
                    <span>Scheduled (30)</span>
                  </div>
                  <div className="flex items-center gap-3 text-pink-500 font-black text-xs">
                    <div className="w-2 h-2 rounded-full bg-current"></div>
                    <span>Failed (0)</span>
                  </div>
                </div>
                <Button className="w-full mt-10 bg-blue-600 hover:bg-blue-700 text-white py-8 text-base font-black rounded-2xl shadow-xl shadow-blue-100 uppercase tracking-tighter transition-all active:scale-95">
                  Create Post
                </Button>
              </div>
            </div>

            {/* Right Column: Features */}
            <div className="space-y-4 lg:pl-20 relative">
              {[
                { title: "One dashboard for all GBP tasks", desc: "Manage all your Google Business Profile operations from a single window. No more tab-switching or tool fatigue." },
                { title: "Create and schedule GBP posts", desc: "Easily schedule and publish GBP posts to maximize your online presence and drive traffic to your website." },
                { title: "Bulk upload your media files", desc: "Save time by uploading hundreds of photos and videos at once. Keep your profile fresh with ease." }
              ].map((feature, idx) => (
                <div
                  key={idx}
                  onMouseEnter={() => setActiveGbpFeature(idx)}
                  className={`flex gap-10 cursor-pointer p-6 rounded-3xl transition-all duration-500 ${activeGbpFeature === idx ? 'bg-blue-50/30' : 'hover:bg-slate-50/50'}`}
                >
                  <div className={`w-1 transition-all duration-500 rounded-full ${activeGbpFeature === idx ? 'bg-blue-600 h-full' : 'bg-slate-100 h-10'}`}></div>
                  <div className="flex-1">
                    <h3 className={`text-3xl font-black transition-all duration-500 tracking-tight ${activeGbpFeature === idx ? 'text-slate-800 mb-4' : 'text-slate-300'}`}>
                      {feature.title}
                    </h3>
                    {activeGbpFeature === idx && (
                      <p className="text-xl text-slate-500 font-bold leading-relaxed max-w-lg animate-in fade-in slide-in-from-top-2 duration-500">
                        {feature.desc}
                      </p>
                    )}
                  </div>
                </div>
              ))}

              <div className="pt-10">
                <Link href="/register">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-2xl font-black px-12 py-10 shadow-2xl shadow-blue-200 hover:scale-105 transition-all flex items-center gap-6">
                    Start Free Trial* <span className="text-3xl">→</span>
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Rank Tracker Section */}
      <section className="py-24 bg-white overflow-hidden border-t">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center mb-24 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-800 mb-6 leading-tight tracking-tight">
              Intuitive Local SEO Rank Tracker with <span className="text-blue-600 font-bold">Powerful, Accurate, & Detailed Data Insights</span>
            </h2>
            <p className="text-lg text-slate-500 font-semibold max-w-3xl mx-auto">
              Ringscale AI's local SEO rank tracking system is designed to give you a clear, comprehensive view of where your business is currently positioned in Google's local search results
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-20 items-center">
            {/* Left Column: Features */}
            <div className="space-y-4 lg:pr-10 order-2 lg:order-1">
              {[
                { title: "Run accurate audits", desc: "Identify local SEO opportunities with high-precision audits that uncover technical and ranking gaps." },
                { title: "Track competitor rankings", desc: "Keep a close eye on your top competitors. See their moves and outmaneuver them in local searches." },
                { title: "See exactly where you rank", desc: "Get a pinpoint view of your business's presence across specific coordinates in your local area." },
                { title: "Shareable scan reports", desc: "Generate heatmap scan reports with shareable URLs for easy client collaboration. Automate delivery and impress clients with data they actually understand." }
              ].map((feature, idx) => (
                <div
                  key={idx}
                  onMouseEnter={() => setActiveRankFeature(idx)}
                  className={`flex gap-8 cursor-pointer pl-4 border-l-4 transition-all duration-500 rounded-r-3xl p-6 ${activeRankFeature === idx ? 'border-blue-600 bg-blue-50/20' : 'border-slate-100 hover:border-slate-200'}`}
                >
                  <div className="space-y-4">
                    <h3 className={`text-3xl font-black transition-all duration-500 tracking-tight ${activeRankFeature === idx ? 'text-slate-800' : 'text-slate-300'}`}>
                      {feature.title}
                    </h3>
                    {activeRankFeature === idx && (
                      <p className="text-lg text-slate-500 font-bold leading-relaxed max-w-md animate-in fade-in slide-in-from-top-2 duration-500">
                        {feature.desc}
                      </p>
                    )}
                  </div>
                </div>
              ))}

              <div className="pt-8">
                <Link href="/register">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-2xl font-black px-12 py-10 shadow-2xl shadow-blue-200 hover:scale-105 transition-all">
                    Start Free Trial* <span className="text-3xl ml-2">→</span>
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right Column: Visualization Mockup */}
            <div className="relative order-1 lg:order-2 scale-90 md:scale-100 h-[650px] flex items-center justify-center lg:px-10">
              {/* Main Visualization Board */}
              <div className="bg-slate-50 rounded-[4rem] border border-slate-100 p-10 shadow-sm w-full h-[500px] relative overflow-hidden group">
                {/* Heatmap Grid Pattern */}
                <div className="grid grid-cols-12 gap-4 h-full p-6 pt-16">
                  {Array.from({ length: 108 }).map((_, i) => (
                    <div key={i} className={`w-6 h-8 rounded-full ${i % 11 === 0 ? 'bg-orange-400' : i % 7 === 0 ? 'bg-yellow-400' : 'bg-emerald-500'} scale-90 animate-pulse transition-transform hover:scale-110 cursor-pointer`} style={{ animationDelay: `${i * 30}ms`, clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }}></div>
                  ))}
                </div>

                {/* Top Control Bar Mockup */}
                <div className="absolute top-10 left-10 right-10 flex items-center justify-between bg-white/90 backdrop-blur shadow-sm rounded-[1.5rem] border border-slate-100 p-5 px-8">
                  <div className="flex gap-4 items-center">
                    <div className="w-5 h-5 rounded-full bg-blue-600"></div>
                    <div className="w-56 h-4 bg-slate-100 rounded-full"></div>
                  </div>
                  <div className="flex gap-3 text-slate-400">
                    <span className="w-10 h-10 flex items-center justify-center border-2 border-slate-100 rounded-xl font-black text-xl hover:bg-slate-50 transition-colors">‹</span>
                    <span className="w-10 h-10 flex items-center justify-center border-2 border-slate-100 rounded-xl font-black text-xl hover:bg-slate-50 transition-colors">›</span>
                  </div>
                </div>
              </div>

              {/* Avg. Rank Card Overlay */}
              <div className="absolute top-10 left-0 bg-white rounded-[2.5rem] border border-slate-100 p-10 shadow-2xl w-[240px] animate-in zoom-in slide-in-from-top-4 duration-700">
                <div className="relative w-28 h-28 mx-auto mb-6">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="56" cy="56" r="48" fill="none" stroke="#f1f5f9" strokeWidth="12" />
                    <circle cx="56" cy="56" r="48" fill="none" stroke="#facc15" strokeWidth="12" strokeDasharray="301" strokeDashoffset="80" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Avg. rank</span>
                    <span className="text-3xl font-black text-slate-800">4.79</span>
                  </div>
                </div>
              </div>

              {/* Share Report Popup Card Overlay */}
              <div className="absolute -bottom-8 left-10 bg-white rounded-[3rem] border border-slate-100 p-12 shadow-2xl w-[450px] z-30 animate-in fade-in slide-in-from-bottom-8 duration-500 delay-300">
                <span className="text-3xl font-black text-slate-800 block mb-10 tracking-tight">Share Report</span>
                <div className="space-y-8">
                  {['Image', 'GIF', 'Dynamic URL'].map(label => (
                    <div key={label}>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">{label}</label>
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-xs font-bold text-slate-400 truncate shadow-inner">
                        https://app.ringscale.ai/{label.toLowerCase()}-url
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Business Info Card Overlay */}
              <div className="absolute top-1/2 right-0 bg-white rounded-[2.5rem] border border-slate-100 p-10 shadow-2xl w-[300px] translate-x-12 animate-in slide-in-from-right-8 duration-700 delay-500">
                <div className="flex items-center justify-between mb-8">
                  <span className="text-xl font-black text-slate-800 tracking-tight">Business name</span>
                  <span className="text-blue-600 text-xl font-black">↗</span>
                </div>
                <div className="space-y-6 text-xs font-black text-slate-400">
                  <div>
                    <span className="block uppercase tracking-widest mb-2 opacity-50">Search term:</span>
                    <span className="text-slate-800 text-sm">garage door repair</span>
                  </div>
                  <div>
                    <span className="block uppercase tracking-widest mb-2 opacity-50">Date created:</span>
                    <span className="text-slate-800 text-sm">MM-DD-YYYY 9:00AM</span>
                  </div>
                  <div>
                    <span className="block uppercase tracking-widest mb-2 opacity-50">Map grid:</span>
                    <span className="text-slate-800 text-sm">133 Pins | 13x13</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SEO Reports Section */}
      <section className="py-24 bg-white overflow-hidden border-t">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center mb-24 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-800 mb-6 leading-tight tracking-tight">
              Impress Clients with <span className="text-blue-600 font-bold">Branded, Data-Driven SEO Reports</span>
            </h2>
            <p className="text-lg text-slate-500 font-semibold max-w-2xl mx-auto">
              Create fully branded, white-labeled reports that make your agency look pro.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-20 items-center">
            {/* Left Column: Table Mockup */}
            <div className="relative opacity-90 scale-95 lg:scale-110 lg:pr-10">
              <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden font-sans">
                {/* Table Header Controls */}
                <div className="p-4 border-b border-slate-100 flex flex-col gap-4 bg-slate-50/50">
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 border-2 border-slate-300 rounded-full"></div>
                    <div className="bg-white border rounded-lg py-2 pl-8 pr-4 text-[10px] text-slate-400 font-bold">Search the name of the business here...</div>
                  </div>
                  <div className="flex justify-between items-center px-1">
                    <div className="flex gap-2">
                      <span className="bg-white border rounded px-3 py-1 text-[8px] font-black text-slate-400">Bulk Actions ▾</span>
                      <span className="bg-blue-600 text-white rounded px-4 py-1 text-[8px] font-black uppercase">Apply</span>
                      <span className="text-[8px] font-black text-slate-400 px-2 py-1">1-11 results OUT</span>
                    </div>
                  </div>
                </div>
                {/* Table Body */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50/80 border-b border-slate-100 uppercase text-[8px] font-black text-slate-400">
                      <tr>
                        <th className="p-4 w-10 text-center border-r border-slate-100"><input type="checkbox" className="w-3 h-3 rounded" /></th>
                        <th className="p-4 border-r border-slate-100">Business (11)</th>
                        <th className="p-4 border-r border-slate-100">Search Term(s)</th>
                        <th className="p-4">Schedule</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-[8px]">
                      {[
                        { name: 'Business name', terms: ['keyword 01', 'longkeyword 1'], schedule: 'Weekly, Tue 12:30', active: true },
                        { name: 'Business name', terms: ['keyword 01', 'longkeyword 1'], schedule: 'Weekly, Tue 12:30', active: true },
                        { name: 'Business name', terms: ['longkeyword 1'], schedule: 'Manually', active: false },
                        { name: 'Business name', terms: ['keyword 01', 'keyword 2'], schedule: 'Weekly, Tue 12:30', active: false },
                        { name: 'Business name', terms: ['keyword 01', 'keyword 2'], schedule: 'Weekly, Tue 12:30', active: true },
                      ].map((row, i) => (
                        <tr key={i} className="hover:bg-slate-50/40 transition-colors">
                          <td className="p-4 text-center border-r border-slate-50"><input type="checkbox" checked={row.active} readOnly className="w-3 h-3 rounded text-blue-600" /></td>
                          <td className="p-4 border-r border-slate-50 relative group/row">
                            <div className="font-black text-slate-800">{row.name}</div>
                            <div className="text-slate-300 font-bold mt-1">1101 Dyer St Dallas, TX 75201</div>
                            <div className="flex gap-1 mt-2">
                              {['SCAN', 'CHART', 'GEO', 'MAP', 'LIST'].map(t => <span key={t} className="px-1 py-0.5 rounded-full border border-blue-200 bg-blue-50 text-blue-500 font-black text-[6px]">{t}</span>)}
                            </div>
                            <span className="absolute right-2 top-4 text-blue-300 opacity-0 group-hover/row:opacity-100 transition-opacity">↗</span>
                          </td>
                          <td className="p-4 border-r border-slate-50">
                            <div className="flex flex-wrap gap-1 max-w-[150px]">
                              {row.terms.map(t => <span key={t} className="px-2 py-0.5 rounded-lg border border-slate-100 bg-white font-black">{t}</span>)}
                              {row.active && <span className="bg-blue-50 text-blue-600 rounded-lg px-2 py-0.5 font-black border border-blue-100 opacity-50">keyword 2</span>}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-1 font-black text-blue-600">
                              {row.schedule !== 'Manually' && <span className="w-2 h-2 rounded border border-blue-400 flex items-center justify-center p-0.5">🗓</span>}
                              {row.schedule}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Table Footer */}
                <div className="p-4 border-t border-slate-100 flex justify-between items-center text-[8px] font-black text-slate-400 bg-slate-50/50">
                  <div className="flex items-center gap-2">Page 1 of 1</div>
                  <div className="flex items-center gap-1">25 ▾</div>
                </div>
              </div>
            </div>

            {/* Right Column: Features */}
            <div className="space-y-4 lg:pl-10 relative">
              {[
                { title: "Generate white-labeled reports", desc: "Instantly create professional reports featuring your agency's logo and colors. Impress clients with a fully branded experience." },
                { title: "Client-friendly SEO data", desc: "Present complex heatmap data in a way that's easy for your clients to digest. Focus on clear, actionable ranking improvements." },
                { title: "Built to grow with you", desc: "Whether you're managing 10 or 100+ locations, Ringscale AI handles it with ease. The platform is optimized for speed, clarity, and high-volume workflows." }
              ].map((feature, idx) => (
                <div
                  key={idx}
                  onMouseEnter={() => setActiveReportFeature(idx)}
                  className={`flex gap-10 cursor-pointer p-8 rounded-3xl transition-all duration-500 ${activeReportFeature === idx ? 'bg-blue-50/30' : 'hover:bg-slate-50/50'}`}
                >
                  <div className={`w-1 transition-all duration-500 rounded-full ${activeReportFeature === idx ? 'bg-blue-600 h-full' : 'bg-slate-100 h-10'}`}></div>
                  <div className="flex-1">
                    <h3 className={`text-3xl font-black transition-all duration-500 tracking-tight ${activeReportFeature === idx ? 'text-slate-800 mb-6' : 'text-slate-300'}`}>
                      {feature.title}
                    </h3>
                    {activeReportFeature === idx && (
                      <p className="text-xl text-slate-500 font-bold leading-relaxed max-w-lg animate-in fade-in slide-in-from-top-2 duration-500">
                        {feature.desc}
                      </p>
                    )}
                  </div>
                </div>
              ))}

              <div className="pt-10">
                <Link href="/register">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-2xl font-black px-12 py-10 shadow-2xl shadow-blue-200 hover:scale-105 transition-all flex items-center gap-6">
                    Start Free Trial* <span className="text-3xl ml-2">→</span>
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Competitive Edge Section */}
      <section className="py-24 bg-white overflow-hidden border-t">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center mb-24 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-800 mb-6 leading-tight tracking-tight">
              Our <span className="text-blue-600 font-bold">Competitive Edge</span>: Ringscale AI vs. the Rest
            </h2>
            <p className="text-lg text-slate-500 font-semibold max-w-3xl mx-auto">
              Forget the rest. Ringscale AI provides the sharpest competitive insights to consistently outrank your local competitors. We give you the winning advantage, plain and simple.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-20 items-center">
            {/* Left Column: UI Collage */}
            <div className="relative h-[600px] flex items-center justify-center scale-90 md:scale-110">
              {/* Center Rocket Circle */}
              <div className="absolute w-[400px] h-[400px] border border-dashed border-slate-200 rounded-full flex items-center justify-center">
                <div className="w-40 h-40 bg-white rounded-full shadow-2xl flex items-center justify-center z-10 animate-pulse">
                  <span className="text-6xl">🚀</span>
                </div>
              </div>

              {/* Circles for paths */}
              <div className="absolute w-[500px] h-[500px] border border-slate-100 rounded-full"></div>

              {/* Winner Group: Green Heatmap & Growth */}
              <div className="absolute top-0 right-0 lg:right-4 z-20">
                <div className="bg-white rounded-[2rem] border border-slate-100 p-6 shadow-2xl relative">
                  <div className="grid grid-cols-5 gap-2 mb-4">
                    {Array.from({ length: 15 }).map((_, i) => (
                      <div key={i} className={`w-4 h-6 rounded-full ${i % 3 === 0 ? 'bg-emerald-500' : 'bg-emerald-400 opacity-60'}`} style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }}></div>
                    ))}
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-blue-600 font-black">G</span>
                      <div className="h-1 flex-1 bg-emerald-200 rounded-full relative">
                        <div className="absolute inset-0 bg-emerald-500 w-[80%] rounded-full"></div>
                      </div>
                    </div>
                    <div className="h-10 flex items-end gap-1 px-1">
                      {[3, 4, 2, 5, 7, 8, 10].map((h, i) => <div key={i} className="flex-1 bg-emerald-500 rounded-t-sm" style={{ height: h * 4 }}></div>)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Winner Users */}
              <div className="absolute left-10 top-20 bg-white p-4 rounded-full shadow-xl flex -space-x-3 z-30">
                {[1, 2, 3].map(i => <div key={i} className="w-10 h-10 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-blue-600 text-sm font-black">👤</div>)}
                <div className="w-10 h-10 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center text-white text-xs font-black">+</div>
              </div>

              {/* Loser Group: Red Heatmap & Decline */}
              <div className="absolute bottom-0 left-0 lg:left-4 z-20">
                <div className="bg-white rounded-[2rem] border border-slate-100 p-6 shadow-2xl relative">
                  <div className="grid grid-cols-5 gap-2 mb-4">
                    {Array.from({ length: 15 }).map((_, i) => (
                      <div key={i} className={`w-4 h-6 rounded-full ${i % 2 === 0 ? 'bg-rose-500' : 'bg-rose-400 opacity-60'}`} style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }}></div>
                    ))}
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-blue-600 font-black">G</span>
                      <div className="h-1 flex-1 bg-rose-200 rounded-full relative">
                        <div className="absolute inset-0 bg-rose-500 w-[30%] rounded-full"></div>
                      </div>
                    </div>
                    <div className="h-10 flex items-end gap-1 px-1">
                      {[10, 8, 7, 5, 4, 3, 2].map((h, i) => <div key={i} className="flex-1 bg-rose-500 rounded-t-sm" style={{ height: h * 4 }}></div>)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Loser Sad Faces */}
              <div className="absolute right-10 bottom-20 bg-slate-50 p-6 rounded-full shadow-lg flex -space-x-4 z-30 grayscale opacity-40">
                {['😟', '😟', '😟'].map((face, i) => (
                  <div key={i} className={`w-12 h-12 rounded-full border-2 border-white bg-white flex items-center justify-center text-2xl`}>{face}</div>
                ))}
              </div>
            </div>

            {/* Right Column: Features */}
            <div className="space-y-4 lg:pl-10 relative">
              {[
                { title: "Never Lose Unused Credits", desc: "Your resources shouldn't expire when you're busy. Any unused credits roll over automatically to your next billing cycle." },
                { title: "Increased Cost Efficiency", desc: "Stop overpaying for rigid scan limits. Our system optimizes your usage, giving you the best price-to-data ratio in the industry." },
                { title: "Stay Ahead of Local Competitors with Rapid Insight", desc: "Identify competitor moves before they become market shifts. Gain an unfair advantage with real-time ranking alerts." },
                { title: "Capture More Customers with Proactive Optimization", desc: "Proactively making data-driven adjustments increases the chances of attracting customers who might otherwise choose competitors." }
              ].map((feature, idx) => (
                <div
                  key={idx}
                  onMouseEnter={() => setActiveEdgeFeature(idx)}
                  className={`flex gap-10 cursor-pointer p-6 rounded-3xl transition-all duration-500 border-l-4 ${activeEdgeFeature === idx ? 'border-blue-600 bg-blue-50/20' : 'border-slate-100 hover:border-slate-200'}`}
                >
                  <div className="flex-1">
                    <h3 className={`text-2xl font-black transition-all duration-500 tracking-tight ${activeEdgeFeature === idx ? 'text-slate-800 mb-4' : 'text-slate-400'}`}>
                      {feature.title}
                    </h3>
                    {activeEdgeFeature === idx && (
                      <p className="text-lg text-slate-500 font-bold leading-relaxed max-w-lg animate-in fade-in slide-in-from-top-2 duration-500">
                        {feature.desc}
                      </p>
                    )}
                  </div>
                </div>
              ))}

              <div className="pt-10">
                <Link href="/register">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-2xl font-black px-12 py-10 shadow-2xl shadow-blue-200 hover:scale-105 transition-all">
                    Start Free Trial* <span className="text-3xl ml-4">→</span>
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Marquee Section */}
      <section className="py-24 bg-slate-50 overflow-hidden">
        <div className="container mx-auto px-4 max-w-7xl mb-16 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="text-center max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-800 mb-6 leading-tight tracking-tight">
              Real Businesses, Real Results: <span className="text-blue-600 font-bold">Stories of Our Satisfied Customers</span>
            </h2>
            <p className="text-lg text-slate-500 font-semibold max-w-2xl mx-auto">
              Get inspired by our clients' success — real results from businesses just like yours.
            </p>
          </div>
        </div>

        <div className="relative group">
          <div className="flex marquee-container gap-10 hover:pause-on-hover">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex gap-10 min-w-max animate-marquee">
                {[
                  {
                    quote: "This is so far the best ranking tool I used and the most accurate one!",
                    text: "The scan results are accurate and generated fast, the interface is very easy to use and super friendly. I also like the way they about reporting they made it very easy to share with clients overall I'm super happy with Ringscale AI.",
                    name: "Raymond Beloy Bonifacio",
                    company: "SEOrcerer Digital",
                    avatar: "https://i.pravatar.cc/150?u=raymond"
                  },
                  {
                    quote: "I recommend Ringscale AI due to the fact that I believe it is the MOST accurate geo tracker/ heat map software on the market.",
                    text: "NONE of the other softwares ever produced accurate results while Ringscale AI did. The current features and upcoming features basically make this tool the best. I have canceled all my other geo trackers and now solely use LD. I give this tool a 5 star review!",
                    name: "Brian Higgins",
                    company: "The Brand Sherpas",
                    avatar: "https://i.pravatar.cc/150?u=brian"
                  },
                  {
                    quote: "...the ultimate choice for effective and concise heat maps.",
                    text: "Looking to make a big impression on your prospect and follow-up calls with clients? Look no further than Ringscale AI – the ultimate choice for effective and concise heat maps.",
                    name: "Alfredo Delgado",
                    company: "PurposeMind",
                    avatar: "https://i.pravatar.cc/150?u=alfredo"
                  },
                  {
                    quote: "This software is a GAME CHANGER!!",
                    text: "It makes it so easy to see where you rank, by map, by keywords, by reporting which saves so much time browsing and gathering all the data. With a few clicks, you can provide all business owners professional reports. It's and even a bigger MUST for every SEO & local service providers advance your agency! Highly Recommended!",
                    name: "Yeshi Kohn",
                    company: "Self Employed",
                    avatar: "https://i.pravatar.cc/150?u=yeshi"
                  }
                ].map((t, idx) => (
                  <div key={idx} className="w-[450px] bg-white rounded-[2.5rem] p-12 shadow-xl border border-slate-100 flex flex-col justify-between hover:scale-[1.02] transition-transform duration-500">
                    <div>
                      <h4 className="text-2xl font-black text-slate-800 mb-8 leading-tight italic">
                        "{t.quote}"
                      </h4>
                      <p className="text-lg text-slate-500 font-bold leading-relaxed mb-10 opacity-80">
                        {t.text}
                      </p>
                    </div>
                    <div className="flex items-center gap-6 border-t border-slate-50 pt-10 mt-auto">
                      <div className="w-16 h-16 rounded-3xl overflow-hidden shadow-lg shadow-blue-100 rotate-3">
                        <img src={t.avatar} alt={t.name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <div className="text-xl font-black text-slate-800">{t.name}</div>
                        <div className="text-sm font-black text-blue-600 uppercase tracking-widest mt-1 opacity-70">of {t.company}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
          {/* Gradient Overlays */}
          <div className="absolute inset-y-0 left-0 w-40 bg-gradient-to-r from-slate-50 to-transparent z-10 pointer-events-none"></div>
          <div className="absolute inset-y-0 right-0 w-40 bg-gradient-to-l from-slate-50 to-transparent z-10 pointer-events-none"></div>
        </div>

        <div className="text-center mt-20">
          <Link href="/register">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-2xl font-black px-12 py-10 shadow-2xl shadow-blue-200 hover:scale-105 transition-all flex items-center gap-6 mx-auto">
              Start Free Trial* <span className="text-3xl ml-2">→</span>
            </Button>
          </Link>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-[#050B1B] relative overflow-hidden">
        {/* Starry Background Effect */}
        <div className="absolute inset-0 z-0 opacity-40">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="absolute bg-white rounded-full animate-pulse"
              style={{
                width: Math.random() * 2 + 'px',
                height: Math.random() * 2 + 'px',
                top: Math.random() * 100 + '%',
                left: Math.random() * 100 + '%',
                animationDelay: Math.random() * 5 + 's',
                animationDuration: (Math.random() * 3 + 2) + 's'
              }}
            />
          ))}
        </div>

        <div className="container mx-auto px-4 max-w-7xl relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="text-center mb-16 max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-6 tracking-tight leading-tight">
              Know Exactly Where You Rank—and Why
            </h2>
            <p className="text-lg text-slate-400 font-bold mb-8 opacity-70">
              Built for agencies who need answers, not dashboards.
            </p>
            <p className="text-xs text-slate-500 font-black uppercase tracking-[0.2em] mb-12">
              **7-day free trial, no credit card required
            </p>

            {/* Toggle Switch */}
            <div className="flex items-center justify-center gap-6 mb-16">
              <div className="bg-white/10 backdrop-blur-md p-1.5 rounded-full flex gap-1.5 border border-white/5 shadow-2xl">
                <button
                  onClick={() => setIsAnnual(false)}
                  className={`px-8 py-2.5 rounded-full text-[13px] font-black transition-all duration-500 ${!isAnnual ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-400 hover:text-white'}`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setIsAnnual(true)}
                  className={`px-8 py-2.5 rounded-full text-[13px] font-black transition-all duration-500 flex items-center gap-3 ${isAnnual ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-400 hover:text-white'}`}
                >
                  Annual
                  <span className="bg-emerald-500 text-white text-[9px] px-2.5 py-1 rounded-full uppercase tracking-widest font-black animate-pulse">2 mo FREE</span>
                </button>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {[
              {
                name: "Lite",
                desc: "Best for Beginners",
                icon: <Settings className="w-6 h-6 text-blue-500" />,
                price: isAnnual ? "32" : "39",
                features: ["5,000 Credits", "(~60 9x9 Scans)", "1 GBP connection", "1 SERP Tracker Campaign", "AI Tracker ($49/site)", "Citations Builder ($35/location)", "Local Pack Rank Tracker"],
                color: "bg-white",
                textColor: "text-slate-800"
              },
              {
                name: "Advance",
                desc: "Best for Local Owners",
                icon: <Rocket className="w-6 h-6 text-blue-600" />,
                price: isAnnual ? "49" : "59",
                features: ["15,000 Credits", "(~185 9x9 Scans)", "15 GBP connections", "3 SERP Tracker Campaigns", "AI Tracker ($49/site)", "Citations Builder ($35/location)", "Local Pack Rank Tracker"],
                color: "bg-white",
                textColor: "text-slate-800"
              },
              {
                name: "Pro",
                desc: "Best for Agency Owners",
                icon: <Trophy className="w-6 h-6 text-blue-600" />,
                price: isAnnual ? "81" : "97",
                popular: true,
                features: ["Rolling Credits", "36,000 Credits", "(~444 9x9 Scans)", "25 GBP connections", "7 SERP Tracker Campaigns", "AI Tracker ($49/site)", "Citations Builder ($35/location)", "Local Pack Rank Tracker"],
                color: "bg-blue-50/95",
                textColor: "text-slate-900",
                badge: "Most Popular"
              },
              {
                name: "Powerhouse",
                desc: "Best for Large Agencies",
                icon: <Zap className="w-6 h-6 text-blue-400" />,
                price: isAnnual ? "164" : "197",
                features: ["Rolling Credits", "81,000 Credits", "(~1000 9x9 Scans)", "80 GBP connections", "18 SERP Tracker Campaigns", "AI Tracker ($49/site)", "Citations Builder ($35/location)", "Local Pack Rank Tracker"],
                color: "bg-white",
                textColor: "text-slate-800"
              }
            ].map((plan, idx) => (
              <div
                key={idx}
                className={`flex flex-col rounded-[2rem] overflow-hidden transition-all duration-500 hover:scale-[1.02] group backdrop-blur-sm ${plan.popular ? 'border-2 border-blue-600 shadow-2xl shadow-blue-900/40 relative scale-[1.03]' : 'border border-white/10 bg-white/5 shadow-xl'}`}
              >
                {/* Visual Accent for Popular */}
                {plan.popular && (
                  <div className="absolute top-0 right-0 w-24 h-24 overflow-hidden pointer-events-none z-20">
                    <div className="absolute top-4 right-[-30px] w-[140%] h-6 bg-blue-600 text-white text-[8px] font-black uppercase flex items-center justify-center rotate-45 shadow-lg tracking-widest px-4">
                      {plan.badge}
                    </div>
                  </div>
                )}

                <div className={`p-8 flex flex-col h-full ${plan.popular ? plan.color : 'bg-white'}`}>
                  <div className="flex justify-between items-start mb-6">
                    <div className="p-3 bg-slate-50 rounded-xl group-hover:bg-blue-50 transition-colors duration-500 shadow-inner">
                      {plan.icon}
                    </div>
                    <div className="text-[9px] font-black text-emerald-500 bg-emerald-50/50 px-3 py-1.5 rounded-full uppercase tracking-wider">
                      7 day FREE
                    </div>
                  </div>

                  <h3 className={`text-2xl font-black ${plan.textColor} mb-1 tracking-tight`}>{plan.name}</h3>
                  <p className="text-[11px] font-bold text-slate-400 mb-6 uppercase tracking-wider">{plan.desc}</p>

                  <div className="flex items-baseline gap-1.5 mb-8">
                    <span className={`text-5xl font-black ${plan.textColor}`}>${plan.price}</span>
                    <span className="text-slate-400 font-bold text-sm">/mo</span>
                  </div>

                  <div className="space-y-3.5 mb-10 flex-1">
                    {plan.features.map((feature, fIdx) => (
                      <div key={fIdx} className="flex gap-3 items-start group/feat">
                        <div className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded-md border flex items-center justify-center transition-colors group-hover/feat:bg-blue-500 group-hover/feat:border-blue-500 ${plan.popular ? 'border-blue-600/30' : 'border-slate-200'}`}>
                          <Check className={`w-2.5 h-2.5 ${plan.popular ? 'text-blue-600' : 'text-slate-400'} group-hover/feat:text-white`} />
                        </div>
                        <span className={`text-[12px] font-bold leading-relaxed transition-all duration-300 ${plan.textColor} opacity-80 group-hover/feat:opacity-100 group-hover/feat:translate-x-0.5`}>
                          {feature}
                        </span>
                      </div>
                    ))}
                    <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest pt-3 opacity-50">...and more</div>
                  </div>

                  <Link href="/register" className="block">
                    <Button className={`w-full py-7 rounded-2xl text-base font-black transition-all shadow-xl group-hover:scale-[1.02] ${plan.popular ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200' : 'bg-blue-500 hover:bg-blue-600 text-white shadow-blue-100'}`}>
                      Start Now <span className="ml-3 transition-transform group-hover:translate-x-1.5">→</span>
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-16">
            <Link href="#" className="inline-flex items-center gap-3 text-white font-black text-lg hover:text-blue-400 transition-all group opacity-80 hover:opacity-100">
              See more plans <span className="text-xl transition-transform group-hover:translate-x-1.5">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-bold text-slate-900 mb-6">Ready to Dominate Local Search?</h2>
          <p className="text-xl text-slate-600 mb-10">Join hundreds of agencies already using Local Rank Heatmap to win more clients.</p>
          <Link href="/register">
            <Button size="lg" className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-lg px-8 py-6">
              Start Your Free Trial Today
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
