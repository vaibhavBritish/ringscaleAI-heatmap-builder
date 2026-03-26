'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Menu, X } from 'lucide-react'
import Image from 'next/image'

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${mobileMenuOpen ? 'bg-white' : 'bg-white/80 backdrop-blur-xl border-b border-slate-100'}`}>
      <nav className="container mx-auto px-6 h-28 flex items-center justify-between">
        <div className="flex items-center gap-3 group cursor-pointer animate-in fade-in slide-in-from-left duration-700">
          <Link href="/">
            <Image
              src="/logo.png"
              alt="Ringscale AI"
              width={260}
              height={260}
              className="h-32 w-auto object-contain"
            />
          </Link>
        </div>

        <div className="hidden md:flex items-center gap-8">
          <Link href="/login">
            <Button variant="outline" className="rounded-full border-slate-200 text-slate-600 hover:bg-slate-50 px-6 font-semibold">
              Log In
            </Button>
          </Link>

          <div className="flex items-center gap-8">
            <Link href="#" className="text-slate-600 hover:text-slate-900 font-medium transition flex items-center gap-1">
              Platform <span className="text-[10px] opacity-50">▼</span>
            </Link>
            <Link href="/#pricing" className="text-slate-600 hover:text-slate-900 font-medium transition">Pricing</Link>
          </div>

              <Link href="/contact-us">
            <Button variant="outline" className="rounded-full text-slate-600 px-6 font-semibold">
              Contact Us
            </Button>
          </Link>

          <Link href="/register">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8 py-6 font-bold flex items-center gap-2 text-lg shadow-lg shadow-blue-200">
              GET OFFER <span className="text-xl">→</span>
            </Button>
          </Link>
        </div>

        <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </nav>

      {mobileMenuOpen && (
        <div className="md:hidden mt-4 pb-4 px-6 space-y-4 bg-white border-t border-slate-100">
          <Link href="#" className="block text-slate-600 font-medium pt-4">Platform</Link>
          <Link href="/#pricing" className="block text-slate-600 font-medium">Pricing</Link>
          <Link href="/contact-us" className="block text-slate-600 font-medium">Contact Us</Link>
          <Link href="/login" className="block text-slate-600 font-medium">Login</Link>
          <Link href="/register">
            <Button className="w-full bg-blue-600">Get Started</Button>
          </Link>
        </div>
      )}
    </header>
  )
}
