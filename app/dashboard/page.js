'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  FolderKanban, 
  BarChart3, 
  Scan, 
  Plus, 
  ArrowRight, 
  Clock, 
  ShieldCheck, 
  Tag, 
  RefreshCcw, 
  ExternalLink, 
  Sparkles, 
  MapPin,
  ChevronRight,
  CheckCircle2,
  Loader2,
  Download,
  Mail,
  Calendar,
  FileText
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import PlanExpiredModal from '@/components/dashboard/PlanExpiredModal'
import PlanTimer from '@/components/dashboard/PlanTimer'
import { toast } from 'sonner'
import { downloadAuditPdf } from '@/lib/export-audit-pdf'

export default function DashboardPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false)
  const [cancellingScanId, setCancellingScanId] = useState(null)
  const [isSyncingGMB, setIsSyncingGMB] = useState(false)
  const [downloadingMilestoneKey, setDownloadingMilestoneKey] = useState(null)

  const handleDownloadMilestone = async (biz, milestone) => {
    const key = `${biz.id}_${milestone}`
    setDownloadingMilestoneKey(key)
    try {
      const res = await fetch(`/api/projects/${biz.id}/audit`)
      if (!res.ok) throw new Error('Failed to load audit')
      const auditData = await res.json()
      await downloadAuditPdf(auditData, {
        milestone,
        businessName: biz.businessName
      })
      toast.success(`${milestone === '15_days' ? '15-Day' : '30-Day'} report downloaded!`)
    } catch (err) {
      toast.error('Download failed: ' + err.message)
    } finally {
      setDownloadingMilestoneKey(null)
    }
  }

  const handleSyncGMB = async () => {
    setIsSyncingGMB(true)
    try {
      const res = await fetch('/api/user/sync-gmb', { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        if (data.synced > 0) {
          toast.success(`Successfully synced ${data.synced} businesses & audit reports!`)
          fetchStats()
        } else {
          toast.info('Businesses & keywords are up to date.')
        }
      }
    } catch (e) {
      console.error('Error syncing GMB:', e)
      toast.error('Failed to sync GMB profiles')
    } finally {
      setIsSyncingGMB(false)
    }
  }

  useEffect(() => {
    fetchStats()
    // Background auto-sync on load to ensure multi-business profiles & audits are fresh
    fetch('/api/user/sync-gmb', { method: 'POST' })
      .then(res => res.json())
      .then(data => {
        if (data.synced > 0) {
          fetchStats()
        }
      })
      .catch(() => {})
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
    const isAdmin = ['admin', 'superadmin'].includes(user?.role)
    const expiryDate = user?.planEndsAt || user?.trialEndsAt
    const isExpired = !isAdmin && ((expiryDate && new Date(expiryDate) < new Date()) || (user?.credits <= 0))
    
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

      {/* Connected Businesses & Audit Reports Panel */}
      <Card className="border-2 border-indigo-100/70 bg-gradient-to-br from-white via-indigo-50/10 to-blue-50/20 rounded-3xl shadow-sm overflow-hidden">
        <CardHeader className="border-b border-indigo-50/60 bg-white/70 px-6 py-5 sm:px-8 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-100 shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <CardTitle className="text-xl font-black text-slate-900 tracking-tight">
                    Connected Businesses & Audit Reports
                  </CardTitle>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700 border border-indigo-200">
                    {stats?.businesses?.length || 0} Businesses
                  </span>
                </div>
                <CardDescription className="text-xs font-semibold text-slate-500 mt-0.5">
                  Live optimization audits & GMB target keywords for all your locations
                </CardDescription>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSyncGMB}
                disabled={isSyncingGMB}
                className="rounded-xl border-indigo-200 font-bold text-xs h-9 text-indigo-700 bg-white hover:bg-indigo-50 shadow-sm"
              >
                <RefreshCcw className={`w-3.5 h-3.5 mr-1.5 ${isSyncingGMB ? 'animate-spin text-indigo-600' : ''}`} />
                {isSyncingGMB ? 'Syncing...' : 'Sync from GMB'}
              </Button>
              <Link href="/dashboard/audit">
                <Button variant="ghost" size="sm" className="font-bold text-xs h-9 text-slate-600 hover:text-indigo-600">
                  View All Audits <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 sm:p-8">
          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-40 rounded-2xl" />
              ))}
            </div>
          ) : stats?.businesses?.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.businesses.slice(0, 6).map((biz) => (
                <div
                  key={biz.id}
                  className="group relative bg-white border border-slate-200/80 hover:border-indigo-300 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      {biz.hasAudit ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          {biz.auditScore ? `${biz.auditScore}% Optimized` : 'Audit Ready'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          Audit Ready
                        </span>
                      )}
                    </div>

                    <h4 className="font-black text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1 text-base">
                      {biz.businessName}
                    </h4>
                    <p className="text-xs text-slate-500 font-medium line-clamp-1 mt-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      {biz.address || 'Address registered on GMB'}
                    </p>

                    <div className="mt-3 flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        <Tag className="w-3 h-3 text-indigo-600" />
                        {biz.keywordCount > 0 ? `${biz.keywordCount} Target Keywords` : 'GMB Keywords Active'}
                      </span>
                    </div>

                    {/* Periodic 15-Day & 30-Day Audit Downloads */}
                    <div className="mt-3.5 bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-extrabold text-slate-700">
                        <span className="flex items-center gap-1 text-indigo-700">
                          <FileText className="w-3 h-3" /> Scheduled Audits
                        </span>
                        <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 font-bold flex items-center gap-1">
                          <Mail className="w-2.5 h-2.5" /> Sent every 30d
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={downloadingMilestoneKey === `${biz.id}_15_days`}
                          onClick={() => handleDownloadMilestone(biz, '15_days')}
                          className="h-7 px-2 text-[10px] font-bold bg-white hover:bg-blue-50 text-blue-700 border-blue-200 rounded-lg justify-center shadow-2xs"
                        >
                          {downloadingMilestoneKey === `${biz.id}_15_days` ? (
                            <Loader2 className="w-3 h-3 animate-spin mr-1" />
                          ) : (
                            <Download className="w-3 h-3 mr-1" />
                          )}
                          15-Day PDF
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={downloadingMilestoneKey === `${biz.id}_30_days`}
                          onClick={() => handleDownloadMilestone(biz, '30_days')}
                          className="h-7 px-2 text-[10px] font-bold bg-white hover:bg-indigo-50 text-indigo-700 border-indigo-200 rounded-lg justify-center shadow-2xs"
                        >
                          {downloadingMilestoneKey === `${biz.id}_30_days` ? (
                            <Loader2 className="w-3 h-3 animate-spin mr-1" />
                          ) : (
                            <Download className="w-3 h-3 mr-1" />
                          )}
                          30-Day PDF
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                    <Button asChild size="sm" className="flex-1 font-bold text-xs h-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm">
                      <Link href={`/dashboard/audit/${biz.id}`}>
                        View Audit & Keywords
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm" className="font-bold text-xs h-8 border-slate-200 hover:bg-indigo-50 text-slate-700 rounded-lg">
                      <Link href={`/dashboard/projects/new?projectId=${biz.id}`} title="New Heatmap Scan">
                        Scan
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-700 font-bold text-base mb-1">No GMB businesses linked yet</p>
              <p className="text-slate-400 text-xs max-w-sm mx-auto mb-4">
                Connect your Google Business Profile to automatically view all locations, target keywords, and optimization reports.
              </p>
              <Button
                size="sm"
                onClick={handleSyncGMB}
                disabled={isSyncingGMB}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs h-9"
              >
                <RefreshCcw className={`w-3.5 h-3.5 mr-1.5 ${isSyncingGMB ? 'animate-spin' : ''}`} />
                Check & Sync Connected GMB
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

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
