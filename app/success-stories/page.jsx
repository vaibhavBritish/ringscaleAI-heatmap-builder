'use client'

import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ArrowUpRight, Users, TrendingUp, Target, Award, BarChart, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function SuccessStoriesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white" suppressHydrationWarning={true}>
      <Navbar />

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-4 bg-white relative overflow-hidden">
        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="animate-in fade-in slide-in-from-left-8 duration-1000">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-700 text-sm font-bold mb-8">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                Proven Track Record
              </div>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-slate-900 mb-6 md:mb-8 leading-[1.1] tracking-tight">
                Empowering Over <br className="hidden md:block" />
                <span className="bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 bg-clip-text text-transparent">
                  2,000+ Clients
                </span> <br className="hidden md:block" />
                Worldwide.
              </h1>
              <p className="text-lg md:text-xl text-slate-500 font-medium mb-8 md:mb-12 leading-relaxed">
                We've successfully closed deals and partnered with over 2,000 businesses, agencies, and franchises. Discover how our AI-powered local SEO platform transforms rankings into revenue.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white rounded-full text-lg font-black px-8 py-6 shadow-xl hover:scale-105 transition-transform">
                  Start Your Journey
                </Button>
                <Link href="/blogs" className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="w-full rounded-full text-lg font-black px-8 py-6 hover:bg-slate-50 transition-colors border-2">
                    View Case Studies
                  </Button>
                </Link>
              </div>
            </div>

            {/* Stats Graphic */}
            <div className="relative h-[500px] animate-in fade-in slide-in-from-right-8 duration-1000 delay-200">
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-100 to-slate-50 rounded-[3rem] transform rotate-3"></div>
              <div className="absolute inset-0 bg-white border border-slate-100 rounded-[3rem] shadow-2xl p-10 flex flex-col justify-between">
                <div>
                  <h3 className="text-2xl font-black text-slate-800 mb-2">Global Impact</h3>
                  <p className="text-slate-500 font-medium">Delivering measurable growth across industries.</p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 mt-8">
                  <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100 flex flex-col items-center sm:items-start text-center sm:text-left">
                    <Users className="w-8 h-8 md:w-10 md:h-10 text-blue-600 mb-3 md:mb-4" />
                    <div className="text-3xl md:text-4xl font-black text-slate-900 mb-1">2,000+</div>
                    <div className="text-xs md:text-sm font-bold text-slate-500 uppercase tracking-wider">Deals Closed</div>
                  </div>
                  <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100 flex flex-col items-center sm:items-start text-center sm:text-left">
                    <TrendingUp className="w-8 h-8 md:w-10 md:h-10 text-emerald-600 mb-3 md:mb-4" />
                    <div className="text-3xl md:text-4xl font-black text-slate-900 mb-1">315%</div>
                    <div className="text-xs md:text-sm font-bold text-slate-500 uppercase tracking-wider">Avg. ROI</div>
                  </div>
                  <div className="bg-purple-50 rounded-2xl p-6 border border-purple-100 flex flex-col items-center sm:items-start text-center sm:text-left">
                    <Target className="w-8 h-8 md:w-10 md:h-10 text-purple-600 mb-3 md:mb-4" />
                    <div className="text-3xl md:text-4xl font-black text-slate-900 mb-1">Top 3</div>
                    <div className="text-xs md:text-sm font-bold text-slate-500 uppercase tracking-wider">Rankings Hit</div>
                  </div>
                  <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100 flex flex-col items-center sm:items-start text-center sm:text-left">
                    <Award className="w-8 h-8 md:w-10 md:h-10 text-amber-600 mb-3 md:mb-4" />
                    <div className="text-3xl md:text-4xl font-black text-slate-900 mb-1">98%</div>
                    <div className="text-xs md:text-sm font-bold text-slate-500 uppercase tracking-wider">Retention Rate</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Case Study 1 */}
      <section className="py-24 bg-slate-50 border-y border-slate-100">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1">
              <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100 relative">
                <div className="absolute -top-6 -left-6 bg-blue-600 text-white p-4 rounded-2xl shadow-lg">
                  <BarChart className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-6 mt-4">Growth Trajectory</h3>
                <div className="space-y-4">
                  {/* Fake Chart Bars */}
                  <div className="flex items-end gap-2 h-48 border-b-2 border-slate-100 pb-2">
                    {[20, 35, 45, 60, 80, 110].map((h, i) => (
                      <div key={i} className="flex-1 bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg group relative transition-all duration-300 hover:opacity-80" style={{ height: `${h}%` }}>
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-slate-800 text-white text-xs py-1 px-2 rounded font-bold transition-opacity whitespace-nowrap">
                          Month {i+1}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between text-xs font-bold text-slate-400 uppercase">
                    <span>Baseline</span>
                    <span>6 Months Later</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="text-sm font-black text-blue-600 uppercase tracking-widest mb-4">Featured Case Study — Home Services</div>
              <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 leading-tight">From Invisible to Dominating a 50-Mile Radius</h2>
              <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                Precision HVAC was struggling to get leads outside their immediate zip code. By utilizing our geo-grid heatmap analysis, they identified exact blind spots in their local coverage and optimized their GBP accordingly.
              </p>
              
              <div className="space-y-6 mb-10">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <ArrowUpRight className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-slate-900">420% Increase in Calls</h4>
                    <p className="text-slate-500">Directly attributed to Google Business Profile within 6 months.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Target className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-slate-900">Top 3 Rankings in 12 New Cities</h4>
                    <p className="text-slate-500">Expanded their service area dominance efficiently.</p>
                  </div>
                </div>
              </div>
              
              <blockquote className="border-l-4 border-blue-600 pl-6 italic text-lg text-slate-700 font-medium">
                "We had 2,000+ clients using different tools before, but nothing gave us the visual clarity of Ringscale AI. It completely transformed our local acquisition strategy."
                <footer className="not-italic font-bold text-slate-900 mt-2">— Mark D., CEO of Precision HVAC</footer>
              </blockquote>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Case Study 2 */}
      <section className="py-24 bg-white border-b border-slate-100">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="text-sm font-black text-purple-600 uppercase tracking-widest mb-4">Featured Case Study — Digital Agency</div>
              <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 leading-tight">Scaling Client Retention with White-Label Reports</h2>
              <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                Elevate Marketing Agency managed over 150 local clients but spent 40 hours a month just generating confusing spreadsheets. Implementing our automated, white-labeled heatmap reports changed everything.
              </p>
              
              <div className="space-y-6 mb-10">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <Users className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-slate-900">Zero Churn in 12 Months</h4>
                    <p className="text-slate-500">Clients finally understood the value they were receiving.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-slate-900">Upsold 45% of Existing Clients</h4>
                    <p className="text-slate-500">Used competitor gap analysis to sell larger packages.</p>
                  </div>
                </div>
              </div>
              
              <blockquote className="border-l-4 border-purple-600 pl-6 italic text-lg text-slate-700 font-medium">
                "Our clients love seeing the map turn green. It makes our job of proving ROI incredibly easy. We are proud to be one of the 2,000+ agencies leveraging this platform."
                <footer className="not-italic font-bold text-slate-900 mt-2">— Sarah W., Agency Director</footer>
              </blockquote>
            </div>

            <div className="relative">
              <div className="bg-slate-900 rounded-[2rem] p-8 shadow-2xl transform rotate-2 hover:rotate-0 transition-transform duration-500">
                <div className="flex items-center gap-2 mb-8 border-b border-slate-700 pb-4">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="ml-4 text-xs font-black text-slate-400 uppercase tracking-widest">Client Report Dashboard</span>
                </div>
                
                <div className="space-y-6">
                  {[
                    { label: "Client 1 - Plumber", progress: 95, color: "bg-emerald-500" },
                    { label: "Client 2 - Dentist", progress: 82, color: "bg-blue-500" },
                    { label: "Client 3 - Lawyer", progress: 78, color: "bg-purple-500" },
                    { label: "Client 4 - HVAC", progress: 91, color: "bg-amber-500" }
                  ].map((item, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-slate-300 text-sm font-bold mb-2">
                        <span>{item.label}</span>
                        <span>{item.progress}% Visibility</span>
                      </div>
                      <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                        <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.progress}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Industry Breakdown Section */}
      <section className="py-20 bg-slate-900 text-white border-y border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600 rounded-full blur-[150px] opacity-10"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-600 rounded-full blur-[120px] opacity-10"></div>
        
        <div className="container mx-auto px-4 max-w-7xl relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-extrabold mb-6">Results Across Every Industry</h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto">
              Our 2,000+ clients span across diverse verticals. Here is a snapshot of the average growth metrics we've recorded across our most popular sectors.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 p-8 rounded-3xl text-center">
              <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-3xl">🏠</div>
              <h3 className="text-xl font-bold mb-2">Home Services</h3>
              <p className="text-4xl font-black text-blue-400 mb-2">+285%</p>
              <p className="text-sm text-slate-400 font-bold uppercase tracking-wider">Avg. Call Volume</p>
            </div>
            
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 p-8 rounded-3xl text-center">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-3xl">⚕️</div>
              <h3 className="text-xl font-bold mb-2">Healthcare</h3>
              <p className="text-4xl font-black text-emerald-400 mb-2">+190%</p>
              <p className="text-sm text-slate-400 font-bold uppercase tracking-wider">New Patient Leads</p>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 p-8 rounded-3xl text-center">
              <div className="w-16 h-16 bg-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-3xl">⚖️</div>
              <h3 className="text-xl font-bold mb-2">Legal Services</h3>
              <p className="text-4xl font-black text-purple-400 mb-2">Top 3</p>
              <p className="text-sm text-slate-400 font-bold uppercase tracking-wider">For High-Intent KWs</p>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 p-8 rounded-3xl text-center">
              <div className="w-16 h-16 bg-amber-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-3xl">📊</div>
              <h3 className="text-xl font-bold mb-2">Digital Agencies</h3>
              <p className="text-4xl font-black text-amber-400 mb-2">-40%</p>
              <p className="text-sm text-slate-400 font-bold uppercase tracking-wider">Client Churn Rate</p>
            </div>
          </div>
        </div>
      </section>

      {/* Massive Content Section: More Success Highlights */}
      <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-6">More Wins from Our 2,000+ Clients</h2>
            <p className="text-xl text-slate-500 max-w-3xl mx-auto">From single-location mom-and-pop shops to enterprise franchises, see how we deliver results.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Box 1 */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 border border-blue-100">
                <span className="text-2xl font-black text-blue-600">01</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">National Franchise Rollout</h3>
              <p className="text-slate-600 mb-4">A fast-casual restaurant chain used our bulk management tools to optimize 300+ locations simultaneously. Within 90 days, non-branded search visibility increased by 45% nationwide.</p>
              <ul className="space-y-2 text-sm font-medium text-slate-700">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> 300+ Locations</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> +45% Non-branded visibility</li>
              </ul>
            </div>

            {/* Box 2 */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6 border border-emerald-100">
                <span className="text-2xl font-black text-emerald-600">02</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Local Law Firm Domination</h3>
              <p className="text-slate-600 mb-4">Personal injury keywords are highly competitive. By utilizing our granular 13x13 heatmaps, this firm pinpointed highly localized ranking gaps and adjusted their GBP content strategy.</p>
              <ul className="space-y-2 text-sm font-medium text-slate-700">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> #1 for "Injury Lawyer near me"</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> 2x Lead Volume</li>
              </ul>
            </div>

            {/* Box 3 */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center mb-6 border border-purple-100">
                <span className="text-2xl font-black text-purple-600">03</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Service Area Business</h3>
              <p className="text-slate-600 mb-4">A mobile detailing service with no physical storefront used our platform to track rankings precisely at customer coordinates rather than just their home address.</p>
              <ul className="space-y-2 text-sm font-medium text-slate-700">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> 100% Service Area Coverage</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Calendar fully booked</li>
              </ul>
            </div>
            
            {/* Box 4 */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center mb-6 border border-rose-100">
                <span className="text-2xl font-black text-rose-600">04</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Real Estate Expansion</h3>
              <p className="text-slate-600 mb-4">A growing brokerage used competitor tracking to identify exactly which neighborhoods their rivals were neglecting, allowing them to swoop in and dominate those hyper-local markets.</p>
              <ul className="space-y-2 text-sm font-medium text-slate-700">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> 15 New Neighborhoods</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> 30% increase in listings</li>
              </ul>
            </div>

            {/* Box 5 */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mb-6 border border-amber-100">
                <span className="text-2xl font-black text-amber-600">05</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Multi-Location Medical Clinic</h3>
              <p className="text-slate-600 mb-4">Managing patient acquisition across 12 clinics was chaotic. Centralizing GBP management and scheduling posts in advance ensured brand consistency and improved local search discoverability.</p>
              <ul className="space-y-2 text-sm font-medium text-slate-700">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> 12 Clinics Centralized</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> +55% New Patient Bookings</li>
              </ul>
            </div>

            {/* Box 6 */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-cyan-50 rounded-2xl flex items-center justify-center mb-6 border border-cyan-100">
                <span className="text-2xl font-black text-cyan-600">06</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Boutique Fitness Studio</h3>
              <p className="text-slate-600 mb-4">Faced with stiff competition from large gym chains, this boutique studio used our platform to target long-tail, high-intent fitness keywords in their immediate 3-mile radius.</p>
              <ul className="space-y-2 text-sm font-medium text-slate-700">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Dominated 3-mile radius</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Sold out classes 3 months straight</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-slate-900 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600 rounded-full blur-[120px] opacity-20 transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600 rounded-full blur-[120px] opacity-20 transform -translate-x-1/2 translate-y-1/2"></div>
        
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-8">Be Our Next Success Story</h2>
          <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">Join the 2,000+ businesses who have already discovered the secret to local SEO dominance.</p>
          <Button size="lg" className="bg-blue-600 hover:bg-blue-500 text-white rounded-full text-xl font-black px-12 py-8 shadow-2xl hover:scale-105 transition-transform">
            Start Your Free Trial
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
