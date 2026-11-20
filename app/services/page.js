'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import LeadForm from '@/components/LeadForm'
import { Button } from '@/components/ui/button'
import { services } from '@/lib/services'
import { ArrowRight, Check, Dumbbell, Stethoscope, Coffee, Scissors, Utensils, Bug, Wrench, Plane, HeartPulse, Hammer, MapPin, BarChart3, Target } from 'lucide-react'

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

const steps = [
  { icon: MapPin, title: 'Map Your Market', text: 'We scan a precise geo-grid around your business to see exactly where you rank, block by block.' },
  { icon: Target, title: 'Find the Gaps', text: 'Spot the neighborhoods where competitors outrank you and the keywords costing you customers.' },
  { icon: BarChart3, title: 'Grow & Track', text: 'Optimize your Google Business Profile and watch your heatmap turn green over time.' }
]

export default function ServicesPage() {
  const { data: session } = useSession()

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <Navbar />

      <main>
        {/* Hero */}
        <section className="pt-40 pb-20 px-6 bg-white relative overflow-hidden">
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[600px] h-[600px] bg-blue-50/50 rounded-full blur-3xl pointer-events-none"></div>
          <div className="container mx-auto max-w-6xl relative z-10 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-700 text-sm font-bold mb-8">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              Industries We Serve
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 mb-8 leading-[1.1] tracking-tight">
              Local SEO Built for <br className="hidden md:block" />
              <span className="bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                Every Local Business
              </span>
            </h1>
            <p className="text-lg md:text-xl text-slate-500 font-medium mb-12 max-w-3xl mx-auto leading-relaxed">
              Whatever your industry, Ringscale AI shows you exactly where you rank on the map and how to beat the competition in your neighborhood.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href={session ? '/dashboard' : '/register'}>
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-10 py-7 text-lg font-bold shadow-xl shadow-blue-100 flex items-center gap-3">
                  {session ? 'Go to Dashboard' : 'Start Free Trial'} <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link href="#all-services">
                <Button size="lg" variant="outline" className="rounded-full border-blue-600 text-blue-600 hover:bg-blue-50 px-10 py-7 text-lg font-bold">
                  Explore Services
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Services Grid */}
        <section id="all-services" className="py-24 bg-slate-50 border-y border-slate-100 scroll-mt-28">
          <div className="container mx-auto max-w-6xl px-6">
            <div className="text-center mb-16">
              <h2 className="text-sm font-black text-blue-600 uppercase tracking-widest mb-4">Our Services</h2>
              <p className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">Choose your industry</p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service) => {
                const Icon = iconMap[service.icon] || HeartPulse
                return (
                  <Link
                    key={service.slug}
                    href={`/services/${service.slug}`}
                    className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 group flex flex-col"
                  >
                    <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 mb-3 leading-tight">{service.title}</h3>
                    <p className="text-slate-500 font-medium leading-relaxed mb-6 flex-1">{service.description}</p>
                    <ul className="space-y-2 mb-6">
                      {service.features.slice(0, 2).map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-600 font-medium">
                          <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <span className="inline-flex items-center gap-2 text-blue-600 font-bold text-sm">
                      Learn more <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-24 bg-white">
          <div className="container mx-auto max-w-6xl px-6">
            <div className="text-center mb-16">
              <h2 className="text-sm font-black text-blue-600 uppercase tracking-widest mb-4">How it works</h2>
              <p className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">Three steps to the top of the map</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {steps.map(({ icon: StepIcon, title, text }, idx) => (
                <div key={title} className="p-10 rounded-[2.5rem] border border-slate-100 bg-slate-50/50">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center">
                      <StepIcon className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-black text-slate-300">0{idx + 1}</span>
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mb-3">{title}</h3>
                  <p className="text-slate-500 font-medium leading-relaxed">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Lead Form */}
        <section id="contact" className="py-24 bg-slate-50 relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-hero-grid opacity-50" />
          <div className="container mx-auto max-w-6xl px-6 relative z-10">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-6">
                <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                  Not sure which service <br />
                  <span className="text-blue-600">fits your business?</span>
                </h2>
                <p className="text-xl text-slate-500 font-medium leading-relaxed">
                  Tell us about your business and our SEO experts will reach out with a custom local ranking strategy.
                </p>
              </div>
              <LeadForm defaultService="Service: General Inquiry" />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
