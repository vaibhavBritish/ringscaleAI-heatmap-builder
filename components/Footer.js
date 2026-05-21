'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSettings } from '@/components/providers'

export default function Footer() {
  const { settings } = useSettings()
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);
  
  const branding = settings?.branding || {
    appName: 'Ringscale AI',
    logoUrl: '/logo.png'
  }

  return (
    <footer className="bg-[#EBF2F9] py-24 px-6 border-t border-slate-200/50">
      <div className="container mx-auto max-w-7xl">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-12 mb-24">
          <div className="col-span-2 lg:col-span-1">
            <div className="flex flex-col items-center lg:items-start gap-4 mb-6">
              <div className="w-auto h-auto rounded-xl flex items-center justify-center">
                <Image
                  src={branding.logoUrl || "/logo.png"}
                  alt={branding.appName || "Ringscale AI"}
                  width={360}
                  height={260}
                  className="h-48 w-auto object-contain" 
                />
              </div>
              <p className="text-[#526484] font-bold text-sm max-w-xs text-center lg:text-left">
                The World's #1 <span className="text-blue-600">AI-Powered</span> SaaS Platform for Local Search Dominance.
              </p>
            </div>
          </div>

          <div>
            <h4 className="font-extrabold text-[#11254A] mb-8 text-lg">Quick Links</h4>
            <ul className="space-y-4 text-[13px] font-bold text-[#526484]">
              <li><Link href="/#pricing" className="hover:text-blue-600 transition-colors">Pricing</Link></li>
              <li><Link href="#" className="hover:text-blue-600 transition-colors">Custom Package</Link></li>
              <li><Link href="#" className="hover:text-blue-600 transition-colors">Reviews</Link></li>
              <li><Link href="/login" className="hover:text-blue-600 transition-colors">Log in</Link></li>
              <li><Link href="#" className="hover:text-blue-600 transition-colors">API Documentation</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-extrabold text-[#11254A] mb-8 text-lg">Resources</h4>
            <ul className="space-y-4 text-[13px] font-bold text-[#526484]">
              <li><Link href="#" className="hover:text-blue-600 transition-colors">Help Center</Link></li>
              <li><Link href="#" className="hover:text-blue-600 transition-colors">Customer Support</Link></li>
              <li><Link href="/blogs" className="hover:text-blue-600 transition-colors">Blog</Link></li>
              <li><Link href="#" className="hover:text-blue-600 transition-colors">SEO News</Link></li>
              <li><Link href="#" className="hover:text-blue-600 transition-colors">Case Studies</Link></li>
              <li><Link href="#" className="hover:text-blue-600 transition-colors">Credit Estimator</Link></li>
              <li><Link href="#" className="hover:text-blue-600 transition-colors">Free Keyword Generator</Link></li>
              <li><Link href="#" className="hover:text-blue-600 transition-colors">Free Schema Generator</Link></li>
              <li><Link href="#" className="hover:text-blue-600 transition-colors">Free Google Index Checker</Link></li>
              <li><Link href="#" className="hover:text-blue-600 transition-colors">Free Local SEO Checklist 2026</Link></li>
              <li><Link href="#" className="hover:text-blue-600 transition-colors">ChatGPT Visibility Guide</Link></li>
              <li><Link href="#" className="hover:text-blue-600 transition-colors">Rank & Convert Summit On-demand</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-extrabold text-[#11254A] mb-8 text-lg">Company</h4>
            <ul className="space-y-4 text-[13px] font-bold text-[#526484]">
              <li><Link href="#" className="hover:text-blue-600 transition-colors">About</Link></li>
              <li><Link href="#" className="hover:text-blue-600 transition-colors">FAQ</Link></li>
              <li><Link href="/privacy-policy" className="hover:text-blue-600 transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms-and-conditions" className="hover:text-blue-600 transition-colors">Terms of Service</Link></li>
              <li><Link href="#" className="hover:text-blue-600 transition-colors">Affiliate Program</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-extrabold text-[#11254A] mb-8 text-lg">Compare</h4>
            <ul className="space-y-4 text-[13px] font-bold text-[#526484]">
              <li><Link href="#" className="hover:text-blue-600 transition-colors">vs Local Falcon</Link></li>
              <li><Link href="#" className="hover:text-blue-600 transition-colors">vs Local Viking</Link></li>
              <li><Link href="#" className="hover:text-blue-600 transition-colors">vs Search Atlas</Link></li>
              <li><Link href="#" className="hover:text-blue-600 transition-colors">vs BrightLocal</Link></li>
              <li><Link href="#" className="hover:text-blue-600 transition-colors">vs SE Ranking</Link></li>
              <li><Link href="#" className="hover:text-blue-600 transition-colors">vs SEO Neo</Link></li>
              <li><Link href="#" className="hover:text-blue-600 transition-colors">vs GMB Crush</Link></li>
              <li><Link href="#" className="hover:text-blue-600 transition-colors">vs Localo</Link></li>
              <li><Link href="#" className="hover:text-blue-600 transition-colors">vs SEO Utils</Link></li>
              <li><Link href="#" className="hover:text-blue-600 transition-colors">vs Wiremo</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-extrabold text-[#11254A] mb-8 text-lg">Features</h4>
            <ul className="space-y-4 text-[13px] font-bold text-[#526484]">
              <li><Link href="#" className="hover:text-blue-600 transition-colors">Google Maps Rank Tracker</Link></li>
              <li><Link href="#" className="hover:text-blue-600 transition-colors">Local Pack</Link></li>
              <li><Link href="#" className="hover:text-blue-600 transition-colors">GBP Management</Link></li>
              <li><Link href="#" className="hover:text-blue-600 transition-colors">Citations Builder</Link></li>
              <li><Link href="#" className="hover:text-blue-600 transition-colors">White Label Reporting</Link></li>
              <li><Link href="#" className="hover:text-blue-600 transition-colors">AI Assist</Link></li>
              <li><Link href="#" className="hover:text-blue-600 transition-colors">Scan Analyzer</Link></li>
              <li><Link href="#" className="hover:text-blue-600 transition-colors">360 Local SEO Audit</Link></li>
              <li><Link href="#" className="hover:text-blue-600 transition-colors">Local SEO Reporting</Link></li>
              <li><Link href="#" className="hover:text-blue-600 transition-colors">Side-by-Side Compare</Link></li>
              <li><Link href="#" className="hover:text-blue-600 transition-colors">SERP Tracker</Link></li>
              <li><Link href="#" className="hover:text-blue-600 transition-colors">AI Tracker</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-12 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-[14px] font-bold text-[#526484] space-y-1">
            <p>All Rights Reserved © 2026 <span className="text-blue-600">Ringscale AI</span> – Your Agency Growth Partner</p>
            <p className="text-[12px] text-slate-500/80 font-medium">
              Address: {
                (() => {
                  if (!mounted) return "1470 HurOntario St Mississauga Ontario L5G 3H4";
                  
                  // Priority 1: Check URL Path (Middle-ware driven)
                  const path = typeof window !== 'undefined' ? window.location.pathname : '';
                  if (path.startsWith('/in/') || path === '/in') return "P-10 Patel Nagar, New Delhi, 110008";
                  if (path.startsWith('/us/') || path === '/us') return "1470 HurOntario St Mississauga Ontario L5G 3H4";
                  
                  // Priority 2: Check Timezone as fallback
                  const userTz = typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : '';
                  const isIndiaTz = userTz.includes('Calcutta') || userTz.includes('Kolkata') || userTz.includes('Asia/Kolkata');
                  return isIndiaTz 
                    ? "P-10 Patel Nagar, New Delhi, 110008" 
                    : "1470 HurOntario St Mississauga Ontario L5G 3H4";
                })()
              }
            </p>
          </div>
          <div className="flex gap-4">
            {[
              { label: 'F', color: 'bg-[#3b5998]' },
              { label: 'Y', color: 'bg-[#FF0000]' },
              { label: 'L', color: 'bg-[#0077b5]' },
              { label: 'I', color: 'bg-[#e4405f]' }
            ].map((s, i) => (
              <div key={i} className={`w-8 h-8 rounded-lg ${s.color} text-white flex items-center justify-center font-black text-xs cursor-pointer hover:scale-110 transition-transform`}>
                {s.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
