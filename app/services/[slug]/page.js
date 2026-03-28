'use client'

import { useParams, notFound } from 'next/navigation'
import { services } from '@/lib/services'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Button } from '@/components/ui/button'
import { Check, ArrowRight, Dumbbell, Stethoscope, Coffee, Scissors, Utensils, Bug, Wrench, Plane, HeartPulse, Hammer } from 'lucide-react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'

const iconMap = {
  Dumbbell,
  Stethoscope,
  Coffee,
  Scissors,
  Utensils,
  Bug,
  Wrench,
  Plane,
  HeartPulse,
  Hammer
}

export default function ServicePage() {
  const { slug } = useParams()
  const { data: session } = useSession()
  
  const service = services.find(s => s.slug === slug)
  
  if (!service) {
    notFound()
  }

  const Icon = iconMap[service.icon] || HeartPulse

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <Navbar />

      <main>
        {/* Hero Section */}
        <section className="pt-40 pb-20 px-6 bg-white relative overflow-hidden">
          {/* Background Decoration */}
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[600px] h-[600px] bg-blue-50/50 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="container mx-auto max-w-6xl relative z-10">
            <div className="flex flex-col lg:flex-row items-center gap-16">
              <div className="flex-1 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-700 text-sm font-bold mb-8">
                  <Icon className="w-4 h-4" />
                  Local SEO for {service.title}
                </div>
                <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 mb-8 leading-[1.1] tracking-tight">
                  Dominate Your Local Market as a <br />
                  <span className="bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                    {service.title}
                  </span>
                </h1>
                <p className="text-xl text-slate-500 font-medium mb-12 max-w-2xl leading-relaxed">
                  {service.description} Ringscale AI helps you visualize exactly where you rank and how to beat your local competitors.
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <Link href={session ? "/dashboard" : "/register"}>
                    <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-10 py-8 text-xl font-bold shadow-xl shadow-blue-100 flex items-center gap-3">
                      {session ? 'Go to Dashboard' : 'Start Free Trial'} <ArrowRight className="w-5 h-5" />
                    </Button>
                  </Link>
                  <p className="text-slate-400 font-bold px-4">No credit card required</p>
                </div>
              </div>

              <div className="flex-1 w-full max-w-2xl">
                {/* Image Placeholder */}
                <div className="aspect-video bg-slate-100 rounded-[2.5rem] border-4 border-white shadow-2xl flex items-center justify-center relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-tr from-blue-50 to-transparent opacity-50"></div>
                  <div className="text-center p-10 relative z-10">
                    <div className="w-20 h-20 bg-white rounded-3xl shadow-lg flex items-center justify-center mb-6 mx-auto transition-transform group-hover:scale-110 duration-500">
                      <Icon className="w-10 h-10 text-blue-600" />
                    </div>
                    {/* <p className="text-slate-400 font-black uppercase tracking-widest text-sm">Service Image Placeholder</p> */}
                    {/* <p className="text-slate-300 text-xs mt-2 font-bold">(I'll add the image here later)</p> */}
                  </div>
                  
                  {/* Decorative UI elements to make it look "pro" */}
                  <div className="absolute bottom-6 left-6 right-6 bg-white/90 backdrop-blur shadow-xl rounded-2xl p-4 flex items-center justify-between animate-in slide-in-from-bottom-4 duration-1000">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-xs font-black text-slate-800">Rank #1 Achieved</span>
                    </div>
                    <div className="flex gap-1">
                      {[1, 2, 3].map(i => <div key={i} className="w-6 h-1 bg-blue-100 rounded-full"></div>)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 bg-slate-50 border-y border-slate-100">
          <div className="container mx-auto max-w-6xl px-6">
            <div className="text-center mb-20">
              <h2 className="text-sm font-black text-blue-600 uppercase tracking-widest mb-4">Why it works</h2>
              <p className="text-4xl font-extrabold text-slate-900 tracking-tight">Tailored SEO for your business</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {service.features.map((feature, idx) => (
                <div key={idx} className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 group">
                  <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-blue-600 transition-colors">
                    <Check className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mb-4 leading-tight">{feature}</h3>
                  <p className="text-slate-500 font-medium leading-relaxed">
                    Customized approach to ensure your {service.title} stands out in every local search coordinate.
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Visualization Section (Placeholder) */}
        <section className="py-24 bg-white">
          <div className="container mx-auto max-w-6xl px-6">
            <div className="bg-[#001D4A] rounded-[3rem] p-12 md:p-20 relative overflow-hidden">
               <div className="max-w-2xl relative z-10">
                <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-8 leading-tight">
                  Visualize Your Growth with <br />
                  <span className="text-blue-400">Geo-Grid Heatmaps.</span>
                </h2>
                <p className="text-xl text-blue-100/70 font-medium mb-12">
                  Stop guessing where your customers are coming from. See exactly which neighborhoods you're dominating and where you need to improve.
                </p>
                <Link href={session ? "/dashboard" : "/register"}>
                  <Button size="lg" className="bg-white text-blue-900 hover:bg-blue-50 rounded-full px-10 py-8 text-xl font-black shadow-2xl">
                    Get Started Now
                  </Button>
                </Link>
              </div>
              
              {/* Abstract Heatmap Placeholder Decoration */}
              <div className="absolute right-0 top-0 bottom-0 w-1/2 hidden lg:flex items-center justify-center opacity-20">
                <div className="grid grid-cols-5 gap-4">
                  {Array.from({ length: 25 }).map((_, i) => (
                    <div key={i} className={`w-8 h-8 rounded-full ${i % 3 === 0 ? 'bg-emerald-400' : 'bg-blue-400'}`}></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ/CTA section */}
        <section className="py-24 bg-white text-center px-6">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-8 tracking-tight">Ready to Rank #1?</h2>
            <p className="text-xl text-slate-500 font-medium mb-12">
              Join thousands of {service.title} owners who are already dominating their local search results with Ringscale AI.
            </p>
            <Link href={session ? "/dashboard" : "/register"}>
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-16 py-10 text-2xl font-black shadow-2xl shadow-blue-200 hover:scale-105 transition-all">
                Start My Free Trial <ArrowRight className="ml-4 w-8 h-8" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
