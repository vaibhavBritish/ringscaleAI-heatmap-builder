import { Hammer, Globe, Mail, Phone, ExternalLink } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import prisma from "@/lib/prisma"

async function getBranding() {
  try {
    const setting = await prisma.globalSetting.findUnique({ where: { key: "branding" } })
    return setting?.value || { appName: "Ringscale AI", supportEmail: "support@ringscale.ai", supportPhone: "(619) 625-6148" }
  } catch (err) {
    return { appName: "Ringscale AI", supportEmail: "support@ringscale.ai", supportPhone: "(619) 625-6148" }
  }
}

export default async function MaintenancePage() {
  const branding = await getBranding()
  
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      {/* Background patterns */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-300 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-2xl w-full">
        {/* Logo */}
        <div className="mb-12 flex justify-center transform transition-transform hover:scale-105 duration-500">
          <Link href="/">
             <Image 
               src="/logo.png" 
               alt={branding.appName} 
               width={200} 
               height={60} 
               className="h-16 w-auto object-contain"
             />
          </Link>
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-[32px] p-10 md:p-16 shadow-[0_8px_40px_-12px_rgba(37,99,235,0.12)] border border-slate-100">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 text-blue-600 mb-8 animate-bounce">
            <Hammer size={40} />
          </div>
          
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">
            We&apos;re <span className="text-blue-600">refining</span> things for you.
          </h1>
          
          <p className="text-lg text-slate-500 mb-10 leading-relaxed max-w-lg mx-auto">
            <strong>{branding.appName}</strong> is undergoing a scheduled system upgrade to bring you even better SEO insights. We&apos;ll be back online very shortly!
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-left transition-colors hover:bg-slate-100">
              <div className="h-10 w-10 shrink-0 rounded-full bg-white flex items-center justify-center shadow-sm">
                <Mail size={18} className="text-blue-600" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Email Us</p>
                <p className="text-sm font-semibold text-slate-700">{branding.supportEmail}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-left transition-colors hover:bg-slate-100">
              <div className="h-10 w-10 shrink-0 rounded-full bg-white flex items-center justify-center shadow-sm">
                <Phone size={18} className="text-blue-600" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Call Support</p>
                <p className="text-sm font-semibold text-slate-700">{branding.supportPhone}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-slate-400 text-xs font-medium uppercase tracking-[0.2em] flex items-center justify-center gap-8">
           <Link href="/login" className="flex items-center gap-2 hover:text-blue-600 transition-colors">
              <ExternalLink size={14} /> Admin Access
           </Link>
           <div className="h-1 w-1 rounded-full bg-slate-300" />
           <span>System Status: <span className="text-amber-500">Maintenance</span></span>
        </div>
      </div>
    </div>
  )
}
