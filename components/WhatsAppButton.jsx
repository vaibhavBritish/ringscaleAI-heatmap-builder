'use client'

import { MessageCircle } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function WhatsAppButton() {
  const [isVisible, setIsVisible] = useState(false)

  // Show button after a short delay for a nice entrance
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 1500)
    return () => clearTimeout(timer)
  }, [])

  const whatsappNumber = "+919650708468" // Placeholder - update with actual number
  const message = encodeURIComponent("Hello! I'm interested in your Local SEO services. Can we chat?")
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${message}`

  if (!isVisible) return null

  return (
    <div className="fixed bottom-8 right-8 z-[60] group animate-in fade-in slide-in-from-bottom-10 duration-1000">
      {/* Tooltip */}
      <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
        <div className="bg-slate-900 text-white text-xs font-bold py-2 px-4 rounded-xl whitespace-nowrap shadow-xl">
          Chat with us on WhatsApp
          <div className="absolute left-full top-1/2 -translate-y-1/2 border-8 border-transparent border-l-slate-900"></div>
        </div>
      </div>

      {/* Main Button */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl shadow-2xl text-white transition-all duration-500 hover:scale-110 active:scale-95 animate-whatsapp-pulse relative"
      >
        <MessageCircle className="w-8 h-8 fill-current text-white" />
        
        {/* Subtle Glow Effect */}
        <div className="absolute inset-0 rounded-2xl bg-green-400 blur-xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
      </a>
    </div>
  )
}
