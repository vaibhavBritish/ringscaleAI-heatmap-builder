'use client'

import React from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Button } from '@/components/ui/button'
import { 
  Building2, Globe2, MapPin, BarChart4, Users, Zap, 
  CheckCircle2, ArrowRight, ShieldCheck, TrendingUp,
  LayoutDashboard, Network, Target
} from 'lucide-react'

export default function MultiLocationPage() {
  return (
    <div className="min-h-screen bg-white" suppressHydrationWarning>
      <Navbar />

      {/* Hero Section */}
      <section className="pt-40 pb-24 px-4 bg-gradient-to-b from-slate-50 to-white relative overflow-hidden">
        {/* Abstract Background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-100 rounded-full blur-[150px] transform translate-x-1/3 -translate-y-1/4"></div>
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-100 rounded-full blur-[150px] transform -translate-x-1/3 translate-y-1/4"></div>
        </div>

        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-sm font-bold mb-8">
                <Building2 className="w-4 h-4" /> For Franchises & Agencies
              </div>
              <h1 className="text-5xl lg:text-7xl font-extrabold text-slate-900 mb-8 leading-[1.1] tracking-tight">
                Dominate Local Search Across <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-400">
                  100+ Locations
                </span>
              </h1>
              <p className="text-xl text-slate-500 font-medium mb-10 leading-relaxed max-w-2xl">
                Managing multiple Google Business Profiles shouldn't be a nightmare. Ringscale AI centralizes your entire franchise footprint into one powerful, automated dashboard. Track rankings, update listings, and scale revenue globally.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/register">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white rounded-full text-lg font-black px-8 py-6 shadow-xl hover:scale-105 transition-all">
                    Start Scaling Today
                  </Button>
                </Link>
                <Link href="/contact-us">
                  <Button size="lg" variant="outline" className="rounded-full text-lg font-black px-8 py-6 border-2 hover:bg-slate-50 transition-colors">
                    Book a Demo
                  </Button>
                </Link>
              </div>
            </div>

            {/* Hero Graphic */}
            <div className="relative lg:h-[600px] w-full animate-in fade-in slide-in-from-right-12 duration-1000 delay-200 hidden md:block">
              <div className="absolute inset-0 bg-white rounded-[3rem] border border-slate-100 shadow-2xl p-8 overflow-hidden">
                <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                      <Globe2 className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-slate-900 font-bold text-lg">Global Overview</h3>
                      <p className="text-slate-500 text-sm">248 Active Locations</p>
                    </div>
                  </div>
                  <div className="px-4 py-2 rounded-lg bg-emerald-50 text-emerald-600 font-bold text-sm">
                    +15% Visibility
                  </div>
                </div>

                <div className="space-y-4">
                  {[
                    { city: 'New York, NY', rank: '#1', trend: 'up' },
                    { city: 'Los Angeles, CA', rank: '#2', trend: 'up' },
                    { city: 'Chicago, IL', rank: '#1', trend: 'up' },
                    { city: 'Houston, TX', rank: '#3', trend: 'down' },
                    { city: 'Miami, FL', rank: '#1', trend: 'up' },
                  ].map((loc, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-colors cursor-default">
                      <div className="flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-blue-600" />
                        <span className="text-slate-700 font-bold">{loc.city}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-slate-900 font-black">{loc.rank}</span>
                        {loc.trend === 'up' ? 
                          <TrendingUp className="w-4 h-4 text-emerald-500" /> : 
                          <TrendingUp className="w-4 h-4 text-red-500 transform rotate-180" />
                        }
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Fade out effect at bottom */}
                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Banner */}
      <section className="py-10 border-b border-slate-100 bg-white">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Trusted by enterprise franchises managing thousands of locations</p>
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
            {/* Fake logos using text for now, but styled elegantly */}
            <div className="text-2xl font-black text-slate-800 tracking-tighter">GLOBAL<span className="text-blue-600">FIT</span></div>
            <div className="text-2xl font-black text-slate-800 tracking-tighter">Apex<span className="font-light">Dental</span></div>
            <div className="text-2xl font-black text-slate-800 tracking-tighter">Auto<span className="text-red-600">Max</span></div>
            <div className="text-2xl font-black text-slate-800 tracking-tighter">Pro<span className="text-emerald-600">Clean</span></div>
            <div className="text-2xl font-black text-slate-800 tracking-tighter">Urban<span className="font-serif italic">Eats</span></div>
          </div>
        </div>
      </section>

      {/* Massive Content Section 1: The Problem vs Solution */}
      <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">The multi-location nightmare is finally over.</h2>
            <p className="text-xl text-slate-500 leading-relaxed">
              Logging into 50 different Google accounts to update holiday hours? Stitching together spreadsheets to figure out which location is dropping in rank? Stop the madness.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-10 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-xl transition-all duration-300">
              <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mb-6">
                <LayoutDashboard className="w-7 h-7 text-red-500" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Centralized Command</h3>
              <p className="text-slate-500 leading-relaxed">
                Connect hundreds of Google Business Profiles in one click. Update operating hours, business attributes, and contact info across your entire network simultaneously.
              </p>
            </div>

            <div className="bg-white p-10 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-xl transition-all duration-300 transform md:-translate-y-4">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
                <Network className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Bulk Post & Media</h3>
              <p className="text-slate-500 leading-relaxed">
                Roll out seasonal promotions, menu updates, or new services to all locations instantly. Upload photos to specific regions or your entire franchise network in seconds.
              </p>
            </div>

            <div className="bg-white p-10 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-xl transition-all duration-300">
              <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6">
                <Target className="w-7 h-7 text-emerald-500" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Hyper-Local Tracking</h3>
              <p className="text-slate-500 leading-relaxed">
                Deploy 13x13 heatmaps for every single location on autopilot. Automatically track local map pack rankings for thousands of keyword variations across different zip codes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Huge Features Deep Dive */}
      <section className="py-32 bg-white overflow-hidden">
        <div className="container mx-auto px-4 max-w-7xl space-y-32">
          
          {/* Feature 1 */}
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1 space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-50 text-blue-600 font-bold text-sm">
                <BarChart4 className="w-4 h-4" /> Enterprise Analytics
              </div>
              <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Roll-up reporting that executives actually understand.
              </h2>
              <p className="text-xl text-slate-500 leading-relaxed">
                Stop drowning in data. Ringscale AI aggregates performance metrics from every location into beautiful, high-level executive summaries, while allowing you to drill down into the poorest performing locations instantly.
              </p>
              <ul className="space-y-4">
                {[
                  "Compare performance between regions and states",
                  "Identify underperforming locations instantly",
                  "Automated monthly PDF reports sent to stakeholders",
                  "Track total interactions, calls, and direction requests"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-700 font-medium">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex-1 relative w-full">
              <div className="absolute inset-0 bg-blue-600/5 rounded-[3rem] transform rotate-3"></div>
              <img 
                src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1000&auto=format&fit=crop" 
                alt="Analytics Dashboard" 
                className="relative rounded-[3rem] shadow-2xl border border-slate-100 object-cover aspect-[4/3]"
              />
            </div>
          </div>

          {/* Feature 2 */}
          <div className="flex flex-col lg:flex-row-reverse items-center gap-16">
            <div className="flex-1 space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-50 text-purple-600 font-bold text-sm">
                <ShieldCheck className="w-4 h-4" /> Brand Protection
              </div>
              <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Lock down your brand identity across the globe.
              </h2>
              <p className="text-xl text-slate-500 leading-relaxed">
                Rogue franchisees or malicious public edits can destroy your brand's reputation. Our system acts as an iron shield, instantly reverting unauthorized changes to your Google listings.
              </p>
              <ul className="space-y-4">
                {[
                  "Auto-reject unauthorized public Google edits",
                  "Role-based access control for local managers",
                  "Standardized reply templates for reviews",
                  "Real-time alerts for negative reviews across network"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-700 font-medium">
                    <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-purple-600" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex-1 relative w-full">
              <div className="absolute inset-0 bg-purple-600/5 rounded-[3rem] transform -rotate-3"></div>
              <img 
                src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1000&auto=format&fit=crop" 
                alt="Brand Protection" 
                className="relative rounded-[3rem] shadow-2xl border border-slate-100 object-cover aspect-[4/3]"
              />
            </div>
          </div>

        </div>
      </section>

      {/* Testimonial specifically for Multi-Location */}
      <section className="py-24 bg-blue-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-5xl font-black mb-12 leading-tight">
              "We manage 140+ dental clinics. What used to take a team of three people an entire week, now takes me 15 minutes on Monday morning."
            </h2>
            <div className="flex items-center justify-center gap-4">
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah" alt="Sarah" className="w-16 h-16 rounded-full bg-white/20 p-1" />
              <div className="text-left">
                <div className="font-bold text-xl">Sarah Jenkins</div>
                <div className="text-blue-200 font-medium">VP of Marketing, Apex Dental Group</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 bg-slate-50 relative overflow-hidden">
        <div className="container mx-auto px-4 text-center max-w-4xl">
          <h2 className="text-5xl md:text-7xl font-black text-slate-900 mb-8 tracking-tight">Ready to scale your local presence?</h2>
          <p className="text-2xl text-slate-500 mb-12 leading-relaxed">
            Join the hundreds of franchises and agencies that use Ringscale AI to dominate local search across thousands of locations.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link href="/register">
              <Button size="lg" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xl font-black px-12 py-8 shadow-xl hover:scale-105 transition-transform">
                Start Free Trial
              </Button>
            </Link>
            <Link href="/contact-us">
              <Button size="lg" variant="outline" className="w-full sm:w-auto rounded-full text-xl font-black px-12 py-8 border-2 hover:bg-slate-100 transition-colors">
                Contact Sales
              </Button>
            </Link>
          </div>
          <p className="mt-8 text-slate-400 font-medium">No credit card required for 14-day trial. Cancel anytime.</p>
        </div>
      </section>

      <Footer />
    </div>
  )
}
