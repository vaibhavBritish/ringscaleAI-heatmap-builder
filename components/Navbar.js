'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Menu, X, LayoutDashboard, ChevronDown, Dumbbell, Stethoscope, Coffee, Scissors, Utensils, Bug, Wrench, Plane, HeartPulse, Hammer, ShieldCheck, Calendar } from 'lucide-react'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import { services } from '@/lib/services'
import { useSettings } from '@/components/providers'

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

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false)
  const { data: session, status } = useSession()
  const { settings } = useSettings()
  
  const branding = settings?.branding || {
    appName: 'Ringscale AI',
    logoUrl: '/logo.png'
  }

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${mobileMenuOpen ? 'bg-white' : 'bg-white/80 backdrop-blur-xl border-b border-slate-100'}`}>
      <nav className="container mx-auto px-6 h-28 flex items-center justify-between">
        <div className="flex items-center gap-3 group cursor-pointer animate-in fade-in slide-in-from-left duration-700">
          <Link href="/">
            <Image
              src={branding.logoUrl || "/logo.png"}
              alt={branding.appName || "Ringscale AI"}
              width={260}
              height={260}
              className="h-32 w-auto object-contain"
            />
          </Link>
        </div>

        <div className="hidden md:flex items-center gap-8">
          <div className="flex items-center gap-8">
            <Link href="#" className="text-slate-600 hover:text-slate-900 font-medium transition flex items-center gap-1">
              Platform <span className="text-[10px] opacity-50">▼</span>
            </Link>

            {/* Services Dropdown */}
            <div className="relative group/services">
              <button className="text-slate-600 hover:text-slate-900 font-medium transition flex items-center gap-1">
                Services <ChevronDown className="w-3 h-3 transition-transform group-hover/services:rotate-180" />
              </button>
              
              <div className="absolute left-1/2 -translate-x-1/2 top-full pt-4 opacity-0 invisible group-hover/services:opacity-100 group-hover/services:visible transition-all duration-300 transform group-hover/services:translate-y-0 translate-y-2 z-[60]">
                <div className="bg-white/95 backdrop-blur-xl border border-slate-100 shadow-2xl rounded-3xl p-6 w-[600px] grid grid-cols-2 gap-2">
                  {services.map((service) => {
                    const Icon = iconMap[service.icon] || HeartPulse
                    return (
                      <Link 
                        key={service.slug} 
                        href={`/services/${service.slug}`}
                        className="flex items-start gap-4 p-4 rounded-2xl hover:bg-blue-50/50 transition-all group/item"
                      >
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover/item:bg-blue-600 group-hover/item:text-white transition-colors">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-bold text-slate-800 mb-0.5">{service.title}</h4>
                          <p className="text-[11px] text-slate-500 font-medium leading-normal line-clamp-1">
                            {service.description}
                          </p>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            </div>

            <Link href="/#pricing" className="text-slate-600 hover:text-slate-900 font-medium transition">Pricing</Link>
            <Link href="/contact-us" className="text-slate-600 hover:text-slate-900 font-medium transition">Contact Us</Link>
            <Link href="https://calendly.com/mediaringscale/30min" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="rounded-full border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white px-6 font-bold flex items-center gap-2 transition-all duration-300">
                <Calendar className="w-4 h-4" />
                Book a Meeting
              </Button>
            </Link>

          </div>

          <div className="flex items-center gap-4">
            {session ? (
              <div className="flex items-center gap-4">
                {session.user?.role === 'admin' && (
                  <Link href="/admin">
                    <Button variant="ghost" className="rounded-full text-indigo-600 hover:bg-indigo-50 px-6 font-bold flex items-center gap-2">
                       <ShieldCheck className="w-4 h-4" /> Admin Panel
                    </Button>
                  </Link>
                )}
                <Link href="/dashboard">
                  <Button variant="outline" className="rounded-full border-blue-600 text-blue-600 hover:bg-blue-50 px-6 font-bold flex items-center gap-2">
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" className="rounded-full text-slate-600 hover:bg-slate-50 px-6 font-semibold">
                    Log In
                  </Button>
                </Link>
                <Link href="/register">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8 py-6 font-bold flex items-center gap-2 text-lg shadow-lg shadow-blue-200">
                    GET OFFER <span className="text-xl">→</span>
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>

        <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </nav>

      {mobileMenuOpen && (
        <div className="md:hidden mt-4 pb-8 px-6 space-y-4 bg-white border-t border-slate-100 overflow-y-auto max-h-[80vh]">
          <Link href="#" className="block text-slate-600 font-medium pt-4">Platform</Link>
          
          <div>
            <button 
              onClick={() => setMobileServicesOpen(!mobileServicesOpen)}
              className="flex items-center justify-between w-full text-slate-600 font-medium"
            >
              Services <ChevronDown className={`w-4 h-4 transition-transform ${mobileServicesOpen ? 'rotate-180' : ''}`} />
            </button>
            {mobileServicesOpen && (
              <div className="mt-4 grid grid-cols-1 gap-2 pl-4 border-l-2 border-slate-50">
                {services.map((service) => (
                  <Link 
                    key={service.slug} 
                    href={`/services/${service.slug}`}
                    className="block py-2 text-sm text-slate-500 font-bold hover:text-blue-600"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {service.title}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <Link href="/#pricing" className="block text-slate-600 font-medium" onClick={() => setMobileMenuOpen(false)}>Pricing</Link>
          <Link href="/contact-us" className="block text-slate-600 font-medium" onClick={() => setMobileMenuOpen(false)}>Contact Us</Link>
          <Link 
            href="https://calendly.com/your-meeting-link" 
            className="flex items-center gap-2 text-blue-600 font-bold py-2" 
            onClick={() => setMobileMenuOpen(false)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Calendar className="w-4 h-4" /> Book a Meeting
          </Link>

          
          <div className="pt-4 border-t border-slate-50">
            {session ? (
              <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full bg-blue-600">Go to Dashboard</Button>
              </Link>
            ) : (
              <div className="space-y-3">
                <Link href="/login" className="block text-center text-slate-600 font-bold" onClick={() => setMobileMenuOpen(false)}>Login</Link>
                <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full bg-blue-600 py-6 text-lg">Get Started</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}

