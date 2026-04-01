'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { FolderKanban, BarChart3, Scan, Plus, ArrowRight, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import PlanExpiredModal from '@/components/dashboard/PlanExpiredModal'
import PlanTimer from '@/components/dashboard/PlanTimer'
import { toast } from 'sonner'

export default function DashboardPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false)
  const [cancellingScanId, setCancellingScanId] = useState(null)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/dashboard/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelScan = async (scanId) => {
    setCancellingScanId(scanId)
    try {
      const response = await fetch(`/api/scans/${scanId}/cancel`, { method: 'POST' })
      if (!response.ok) throw new Error('Failed to cancel scan')
      
      setStats(prev => ({
        ...prev,
        recentScans: prev.recentScans.map(s => s.id === scanId ? { ...s, status: 'cancelled' } : s)
      }))
      toast.success('Scan cancelled')
    } catch (error) {
      toast.error('Failed to cancel scan')
    } finally {
      setCancellingScanId(null)
    }
  }

  const handleNewProject = (e) => {
    const user = stats?.user || session?.user
    const expiryDate = user?.planEndsAt || user?.trialEndsAt
    const isExpired = (expiryDate && new Date(expiryDate) < new Date()) || (user?.credits <= 0)
    
    if (isExpired) {
      e.preventDefault()
      if (user?.credits <= 0) {
        toast.error('No more credits. Please purchase more credits to run the scan.')
      }
      setIsPlanModalOpen(true)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-blue-100 text-blue-700'
      case 'processing': return 'bg-indigo-100 text-indigo-700'
      case 'queued': return 'bg-yellow-100 text-yellow-700'
      case 'failed': return 'bg-red-100 text-red-700'
      case 'cancelled': return 'bg-slate-100 text-slate-500'
      default: return 'bg-slate-100 text-slate-700'
    }
  }

  const getPlanDisplayName = (plan) => {
    const p = (plan || '').toLowerCase()
    if (p.includes('trial')) return '7-Day Trial'
    if (p.includes('lite') || p.includes('advance')) return 'Advance Plan'
    if (p.includes('pro_plus') || p.includes('pro plus')) return 'Pro Plus'
    if (p.includes('pro')) return 'Pro Plan'
    return 'Trial'
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-600 mt-1">Welcome back! Here's your ranking overview.</p>
        </div>
        <Link href="/dashboard/projects/new" onClick={handleNewProject}>
          <Button className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800">
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Button>
        </Link>
      </div>

      <PlanExpiredModal 
        isOpen={isPlanModalOpen} 
        onClose={() => setIsPlanModalOpen(false)} 
      />

      {/* Stats Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Projects</CardTitle>
            <FolderKanban className="w-5 h-5 text-slate-400" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <p className="text-3xl font-bold">{stats?.totalProjects || 0}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Scans</CardTitle>
            <Scan className="w-5 h-5 text-slate-400" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <p className="text-3xl font-bold">{stats?.totalScans || 0}</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-blue-100 bg-gradient-to-br from-white to-blue-50/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-black text-blue-600 uppercase tracking-wider">Plan & Usage</CardTitle>
            <Clock className="w-5 h-5 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className={`text-2xl font-black ${ (stats?.user?.credits || 0) <= 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                    {loading ? (
                      <Skeleton className="h-8 w-16" />
                    ) : (
                      (stats?.user?.credits || 0).toLocaleString()
                    )}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Credits left</span>
                </div>
                {!loading && (stats?.user?.credits || 0) <= 0 && (
                  <p className="text-[10px] font-bold text-rose-500 uppercase tracking-tight">
                    No more credits. Please purchase more credits to run the scan.
                  </p>
                )}
              </div>
              <PlanTimer 
                expiryDate={ (stats?.user?.plan || '').toLowerCase().includes('trial') ? (stats?.user?.trialEndsAt || session?.user?.trialEndsAt) : (stats?.user?.planEndsAt || session?.user?.planEndsAt) } 
                planName={getPlanDisplayName(stats?.user?.plan || session?.user?.plan)} 
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Scans */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Scans</CardTitle>
          <CardDescription>Your latest ranking scans across all projects</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              ))}
            </div>
          ) : stats?.recentScans?.length > 0 ? (
            <div className="space-y-4">
              {stats.recentScans.map((scan) => (
                <div key={scan.id} className="flex items-center gap-4 p-3 rounded-lg border hover:bg-slate-50 transition group cursor-pointer" onClick={() => scan.status === 'completed' && router.push(`/dashboard/scans/${scan.id}`)}>
                  <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center">
                    <Scan className="w-6 h-6 text-slate-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 truncate flex flex-wrap items-center gap-x-2 gap-y-0.5 leading-tight">
                      <span className="truncate max-w-[120px] sm:max-w-none">{scan.project?.businessName || 'Project'}</span>
                      <span className="text-slate-300 hidden sm:inline">•</span>
                      <span className="text-blue-600 font-bold truncate max-w-[100px] sm:max-w-none text-xs sm:text-sm">{scan.keyword}</span>
                    </p>
                    <div className="flex items-center gap-2 text-[10px] sm:text-xs text-slate-500 mt-0.5">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {formatDistanceToNow(new Date(scan.createdAt), { addSuffix: true })}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(scan.status)}`}>
                      {scan.status}
                    </span>
                    {scan.status === 'completed' && (
                      <Button variant="ghost" size="sm" className="hidden group-hover:flex">
                        View Results
                      </Button>
                    )}
                    {((scan.status === 'queued' || scan.status === 'processing') && !cancellingScanId) && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-600 hover:bg-red-50 hover:text-red-700 hidden group-hover:flex"
                        isLoading={cancellingScanId === scan.id}
                        cooldown={2000}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleCancelScan(scan.id)
                        }}
                      >
                        Cancel
                      </Button>
                    )}
                    {cancellingScanId === scan.id && (
                      <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Scan className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 mb-4">No scans yet. Create a project to get started.</p>
              <Link href="/dashboard/projects/new" onClick={handleNewProject}>
                <Button variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Project
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
