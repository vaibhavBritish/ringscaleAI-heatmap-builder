"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  Users, 
  LayoutDashboard, 
  Settings, 
  LogOut,
  Building
} from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { signOut } from "next-auth/react"

const adminNavItems = [
  {
    title: "Overview",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "User Management",
    href: "/admin/users",
    icon: Users,
  },
  {
    title: "Partner Companies",
    href: "/admin/companies",
    icon: Building,
  },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside
      style={{ width: "256px", minWidth: "256px", background: "#020817" }}
      className="fixed inset-y-0 left-0 z-40 flex flex-col border-r border-slate-800"
    >
      {/* Logo */}
      <div className="flex items-center justify-center px-5 py-4 border-b border-slate-800/60" style={{ height: "85px" }}>
        <Link href="/" className="flex items-center justify-center w-full transition-all duration-300 hover:scale-[1.02] active:scale-95">
          <div className="relative" style={{ height: "96px", width: "200px" }}>
            <Image
              src="/logo.png"
              alt="Ringscale AI"
              fill
              sizes="300px"
              className="object-contain object-center"
              priority
            />
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
        {/* Main Menu */}
        <div>
          <p className="px-2 mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
            Main Menu
          </p>
          <ul className="space-y-1">
            {adminNavItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 group",
                      isActive
                        ? "bg-blue-600/15 text-blue-600 ring-1 ring-blue-600/20"
                        : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                    )}
                  >
                    <item.icon
                      className={cn(
                        "h-[18px] w-[18px] shrink-0 transition-transform duration-200 group-hover:scale-110",
                        isActive ? "text-blue-400" : "text-slate-500"
                      )}
                    />
                    <span className="tracking-tight">{item.title}</span>
                    {isActive && (
                      <div className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)] animate-pulse" />
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>

        {/* System */}
        <div>
          <p className="px-2 mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
            System
          </p>
          <ul className="space-y-1">
            <li>
              <Link
                href="/admin/settings"
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 group",
                  pathname === "/admin/settings"
                    ? "bg-blue-600/15 text-blue-400 ring-1 ring-blue-600/20"
                    : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                )}
              >
                <Settings
                  className={cn(
                    "h-[18px] w-[18px] shrink-0 transition-transform duration-200 group-hover:scale-110",
                    pathname === "/admin/settings" ? "text-blue-400" : "text-slate-500"
                  )}
                />
                <span className="tracking-tight">Settings</span>
              </Link>
            </li>
          </ul>
        </div>
      </nav>

      {/* Footer / Sign Out */}
      <div className="p-4 border-t border-slate-800/60">
        <button
          onClick={() => signOut({ callbackUrl: window.location.origin })}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 transition-all duration-200 hover:bg-red-500/10 hover:text-red-400 border border-transparent hover:border-red-500/20"
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  )
}
