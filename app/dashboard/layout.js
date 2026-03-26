'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MapPin, LayoutDashboard, FolderKanban, BarChart3, FileText, Settings, LogOut, Plus, ChevronDown, Menu, X, CreditCard } from 'lucide-react'
import TrialStatusBanner from '@/components/dashboard/TrialStatusBanner'
import TrialExpiredModal from '@/components/dashboard/TrialExpiredModal'
import Image from 'next/image'

export default function DashboardLayout({ children }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isTrialModalOpen, setIsTrialModalOpen] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  const handleNewProject = (e) => {
    const isTrialExpired = session?.user?.plan === 'trial' && new Date(session.user.trialEndsAt) < new Date()
    
    if (isTrialExpired) {
      e.preventDefault()
      setIsTrialModalOpen(true)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-sm text-slate-500 animate-pulse">Connecting to dashboard...</p>
        </div>
      </div>
    )
  }

  // Handle case where session exists but DB is unreachable for specific fields
  if (status === 'authenticated' && !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-red-100 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Settings className="w-8 h-8 text-red-600 animate-spin-slow" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Database Connection Error</h2>
          <p className="text-slate-600 mb-6 text-sm">
            We're having trouble reaching the database. This usually means your IP address isn't whitelisted on MongoDB Atlas.
          </p>
          <Button onClick={() => window.location.reload()} className="w-full bg-blue-600 hover:bg-blue-700">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Projects', href: '/dashboard/projects', icon: FolderKanban },
    { name: 'Reports', href: '/dashboard/reports', icon: FileText },
    { name: 'Billing', href: '/dashboard/billing', icon: CreditCard },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ]

  const isActive = (href) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 bg-white border-r transition-all duration-300 ease-in-out lg:translate-x-0 ${sidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:w-20 lg:hover:w-64'} group`}>
        <div className="flex flex-col h-full overflow-hidden">
          {/* Logo */}
          <div className="flex items-center px-4 py-4 border-b shrink-0">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center shrink-0 overflow-hidden">
              <Image
                src="/logo.png"
                alt="Ringscale AI"
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            </div>
            <span className="font-bold text-lg whitespace-nowrap opacity-0 max-w-0 overflow-hidden group-hover:max-w-xs group-hover:opacity-100 group-hover:ml-3 transition-all duration-300">Heatmaps</span>
            <button className="ml-auto lg:hidden" onClick={() => setSidebarOpen(false)}>
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* New Project Button */}
          <div className="px-4 py-4 shrink-0">
            <Link href="/dashboard/projects/new" onClick={handleNewProject}>
              <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 flex items-center justify-center h-10 px-0 lg:group-hover:px-4 transition-all duration-300">
                <Plus className="w-5 h-5 shrink-0" />
                <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 whitespace-nowrap">
                  New Project
                </span>
              </Button>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 space-y-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-3 py-2.5 rounded-lg transition-all duration-300 overflow-hidden ${isActive(item.href)
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-slate-600 hover:bg-slate-50'
                  }`}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 group-hover:ml-3 transition-all duration-300 whitespace-nowrap">
                  {item.name}
                </span>
              </Link>
            ))}
          </nav>


          {/* User Menu */}
          <div className="p-4 border-t shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center w-full px-2 py-2 rounded-lg hover:bg-slate-50 transition-all duration-300 overflow-hidden">
                  <Avatar className="w-8 h-8 shrink-0">
                    <AvatarFallback className="bg-blue-100 text-blue-700 font-bold">
                      {session.user?.name?.[0] || session.user?.email?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left min-w-0 max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 group-hover:ml-3 transition-all duration-300">
                    <p className="text-sm font-semibold text-slate-900 truncate">{session.user?.name || 'User'}</p>
                    <p className="text-xs text-slate-500 truncate">{session.user?.email}</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 transition-all duration-300" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings">Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut({ callbackUrl: '/' })}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:pl-64' : 'lg:pl-20 group-hover:lg:pl-64'}`}>
        {/* Mobile header */}
        <header className="sticky top-0 z-30 bg-white border-b lg:hidden">
          <div className="flex items-center gap-4 px-4 py-3">
            <button onClick={() => setSidebarOpen(true)}>
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center">
                <MapPin className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold">Local Rank Heatmap</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 flex flex-col min-h-0">
          <TrialStatusBanner />
          <div className="p-4 md:p-6 flex-1 flex flex-col min-h-0">
            {children}
          </div>
        </main>
      </div>

      <TrialExpiredModal 
        isOpen={isTrialModalOpen} 
        onClose={() => setIsTrialModalOpen(false)} 
      />
    </div>
  )
}
