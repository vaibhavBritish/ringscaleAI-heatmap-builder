'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Search, 
  MapPin, 
  Loader2, 
  ArrowRight, 
  ShieldCheck, 
  RefreshCcw, 
  Tag, 
  CheckCircle2, 
  Download, 
  Mail, 
  Calendar, 
  Clock, 
  Sparkles, 
  LayoutGrid, 
  Table as TableIcon,
  Send,
  AlertCircle,
  TrendingUp,
  FileText,
  Lock
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { downloadAuditPdf } from '@/lib/export-audit-pdf'

export default function AuditListPage() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState('table') // 'table' | 'cards'
  const [downloadingKey, setDownloadingKey] = useState(null)
  const [sendingEmailId, setSendingEmailId] = useState(null)
  const [generatingMilestoneKey, setGeneratingMilestoneKey] = useState(null)

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects')
      if (!res.ok) throw new Error('Failed to load projects')
      const data = await res.json()
      setProjects(data.projects || [])
    } catch (err) {
      toast.error('Could not load projects')
    } finally {
      setLoading(false)
    }
  }

  const handleSyncGMB = async () => {
    setIsSyncing(true)
    try {
      const res = await fetch('/api/user/sync-gmb', { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        if (data.synced > 0) {
          toast.success(`Synced ${data.synced} businesses & audit reports!`)
          fetchProjects()
        } else {
          toast.info('All your businesses and audits are already up to date.')
        }
      }
    } catch (e) {
      console.error('Error syncing GMB:', e)
      toast.error('Failed to sync GMB profiles')
    } finally {
      setIsSyncing(false)
    }
  }

  useEffect(() => {
    fetchProjects()
    fetch('/api/user/sync-gmb', { method: 'POST' })
      .then(res => res.json())
      .then(data => {
        if (data.synced > 0) {
          fetchProjects()
        }
      })
      .catch(() => {})
  }, [])

  // Direct download for a specific milestone (initial, 15_days, 30_days, latest)
  const handleDownload = async (project, milestone = 'latest') => {
    if (milestone === '15_days' && !project.isDay15Available) {
      toast.error('The 15-Day Milestone report is locked until 15 days have elapsed.')
      return
    }
    if (milestone === '30_days' && !project.isDay30Available) {
      toast.error('The 30-Day Milestone report is locked until 30 days have elapsed.')
      return
    }

    const key = `${project.id}_${milestone}`
    setDownloadingKey(key)

    try {
      // Fetch full audit report data
      const res = await fetch(`/api/projects/${project.id}/audit`)
      if (!res.ok) throw new Error('Failed to load audit report for download')
      const auditData = await res.json()

      let label = 'GBP Optimization Audit'
      if (milestone === '15_days') label = '15-Day Milestone SEO Audit Report'
      if (milestone === '30_days') label = '30-Day Comprehensive SEO Audit Report'
      if (milestone === 'initial') label = 'Initial Baseline SEO Audit Report'

      await downloadAuditPdf(auditData, {
        milestone,
        milestoneLabel: label,
        businessName: project.businessName
      })
      toast.success(`${milestone === '15_days' ? '15-Day' : milestone === '30_days' ? '30-Day' : 'Audit'} report downloaded successfully!`)
    } catch (err) {
      console.error('Download error:', err)
      toast.error('Failed to generate report PDF: ' + err.message)
    } finally {
      setDownloadingKey(null)
    }
  }

  // Force-generate a milestone early (restricted strictly to unlocked periods)
  const handleGenerateMilestone = async (projectId, cycle) => {
    const project = projects.find(p => p.id === projectId)
    if (cycle === '15_days' && (!project || !project.isDay15Available)) {
      toast.error('The 15-Day report is locked until 15 days have elapsed.')
      return
    }
    if (cycle === '30_days' && (!project || !project.isDay30Available)) {
      toast.error('The 30-Day report is locked until 30 days have elapsed.')
      return
    }

    const key = `${projectId}_${cycle}`
    setGeneratingMilestoneKey(key)
    try {
      const res = await fetch(`/api/projects/${projectId}/audit/periodic`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate_milestone', cycle })
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || 'Failed to generate milestone audit')
      }
      const data = await res.json()
      toast.success(data.message || 'Milestone audit report generated!')
      fetchProjects()
    } catch (err) {
      toast.error(err.message || 'Error generating milestone report')
    } finally {
      setGeneratingMilestoneKey(null)
    }
  }

  // Send the 30-Day Updated Audit report to customer email on demand
  const handleSendEmail = async (project) => {
    if (!project.isDay30Available) {
      toast.error('The 30-Day Audit Report email unlocks after 30 days have elapsed.')
      return
    }

    setSendingEmailId(project.id)
    try {
      const res = await fetch(`/api/projects/${project.id}/audit/periodic`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send_email' })
      })

      const data = await res.json()
      if (res.ok && data.success) {
        toast.success(data.message || `30-Day Audit Report sent to your email!`)
        fetchProjects()
      } else {
        throw new Error(data.error || 'Failed to send audit report email')
      }
    } catch (err) {
      toast.error(err.message || 'Could not send audit email')
    } finally {
      setSendingEmailId(null)
    }
  }

  const filteredProjects = projects.filter(project =>
    project.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.address?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Business Audit Reports</h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700 border border-indigo-200">
              {projects.length} Businesses Tracked
            </span>
          </div>
          <p className="text-slate-500 font-semibold mt-1">
            Download your updated SEO audit reports after every 15 days and 30 days. Updated reports are automatically sent to your email every 30 days.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Table / Grid Switcher */}
          <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex items-center">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'table' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              Table Columns
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'cards' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Cards
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleSyncGMB}
            disabled={isSyncing}
            className="rounded-xl border-slate-200 font-bold text-xs h-10 px-4 text-slate-700 hover:text-indigo-600 hover:bg-indigo-50 shadow-sm"
          >
            <RefreshCcw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin text-indigo-600' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync GMB'}
          </Button>
        </div>
      </div>

      {/* Info Callout Banner: Automated Periodic Audits */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-5 shadow-sm border border-blue-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300 shrink-0">
            <Sparkles className="w-5 h-5 text-blue-300" />
          </div>
          <div>
            <h4 className="font-extrabold text-white text-sm sm:text-base flex items-center gap-2">
              Automated Periodic Audits & Email Reports Active
              <span className="bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] uppercase font-black px-2 py-0.5 rounded-full">
                Scheduled
              </span>
            </h4>
            <p className="text-xs text-blue-200/90 font-medium mt-0.5 max-w-2xl">
              • <strong>15-Day Milestone:</strong> Intermediate profile & rating progress update ready to download.<br />
              • <strong>30-Day Milestone:</strong> Comprehensive monthly audit generated and automatically dispatched to your email.
            </p>
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
        <Input
          placeholder="Search businesses by name or address..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-11 h-12 bg-white border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium"
        />
      </div>

      {filteredProjects.length === 0 ? (
        <Card className="border-slate-200 bg-slate-50 shadow-sm rounded-2xl">
          <CardContent className="py-16 text-center">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-200 shadow-sm">
              <ShieldCheck className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">No businesses found</h3>
            <p className="text-slate-500 mb-6 max-w-sm mx-auto">
              {searchQuery ? 'Try a different search term' : 'Connect your Google Business Profile to generate audit reports for all your locations'}
            </p>
            <Button onClick={handleSyncGMB} disabled={isSyncing} className="bg-indigo-600 hover:bg-indigo-700 font-bold rounded-xl px-6">
              <RefreshCcw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
              Sync Connected Businesses
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === 'table' ? (
        /* ==================== TABLE VIEW WITH DEDICATED 15-DAY & 30-DAY COLUMNS ==================== */
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-black uppercase tracking-wider text-slate-600">
                  <th className="py-4 px-5">Business Profile</th>
                  <th className="py-4 px-4 text-center">Baseline (Day 0)</th>
                  <th className="py-4 px-4 text-center bg-blue-50/40 border-x border-blue-100/60">
                    <div className="flex items-center justify-center gap-1.5 text-blue-700">
                      <Calendar className="w-3.5 h-3.5" />
                      15-Day Audit Report
                    </div>
                  </th>
                  <th className="py-4 px-4 text-center bg-indigo-50/40 border-r border-indigo-100/60">
                    <div className="flex items-center justify-center gap-1.5 text-indigo-700">
                      <Sparkles className="w-3.5 h-3.5" />
                      30-Day Audit Report
                    </div>
                  </th>
                  <th className="py-4 px-4 text-center">Auto-Email (30 Days)</th>
                  <th className="py-4 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredProjects.map((project) => {
                  const daysElapsed = project.daysElapsed ?? 0
                  const is15Ready = project.isDay15Available
                  const is30Ready = project.isDay30Available
                  const is15Downloading = downloadingKey === `${project.id}_15_days`
                  const is30Downloading = downloadingKey === `${project.id}_30_days`
                  const isBaseDownloading = downloadingKey === `${project.id}_initial`
                  const isSendingEmail = sendingEmailId === project.id
                  const isGenerating15 = generatingMilestoneKey === `${project.id}_15_days`
                  const isGenerating30 = generatingMilestoneKey === `${project.id}_30_days`

                  return (
                    <tr key={project.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Column 1: Business Profile */}
                      <td className="py-4 px-5 align-middle">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
                            <ShieldCheck className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <Link href={`/dashboard/audit/${project.id}`} className="font-extrabold text-slate-900 hover:text-indigo-600 transition-colors line-clamp-1">
                              {project.businessName}
                            </Link>
                            <p className="text-xs text-slate-500 line-clamp-1 flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3 shrink-0 text-slate-400" />
                              {project.address || 'Address on GMB'}
                            </p>
                            <div className="mt-1 flex items-center gap-2">
                              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                                {project.keywordCount || 0} Keywords
                              </span>
                              <span className="text-[10px] font-bold text-slate-400">
                                Day {daysElapsed} tracked
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Column 2: Baseline (Day 0) */}
                      <td className="py-4 px-4 text-center align-middle">
                        <div className="flex flex-col items-center gap-1.5">
                          {project.hasAudit ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-slate-100 text-slate-800 border border-slate-200">
                              <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />
                              {project.auditScore ? `${project.auditScore}%` : 'Baseline'}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400 font-semibold">Ready</span>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={isBaseDownloading}
                            onClick={() => handleDownload(project, 'initial')}
                            className="h-7 px-2.5 text-xs font-bold text-slate-600 hover:text-blue-600 hover:bg-blue-50"
                          >
                            {isBaseDownloading ? (
                              <Loader2 className="w-3 h-3 animate-spin mr-1" />
                            ) : (
                              <Download className="w-3 h-3 mr-1" />
                            )}
                            PDF
                          </Button>
                        </div>
                      </td>

                      {/* Column 3: 15-Day Audit Report */}
                      <td className="py-4 px-4 text-center align-middle bg-blue-50/20 border-x border-blue-100/40">
                        <div className="flex flex-col items-center gap-1.5">
                          {is15Ready ? (
                            <>
                              <div className="flex items-center gap-1">
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-100 text-blue-800 border border-blue-200">
                                  {project.day15Score ? `${project.day15Score}%` : 'Available'}
                                </span>
                                {project.day15ScoreDelta && (
                                  <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                    {project.day15ScoreDelta}
                                  </span>
                                )}
                              </div>
                              <Button
                                size="sm"
                                disabled={is15Downloading}
                                onClick={() => handleDownload(project, '15_days')}
                                className="h-8 px-3 rounded-lg text-xs font-extrabold bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex items-center gap-1.5"
                              >
                                {is15Downloading ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Download className="w-3.5 h-3.5" />
                                )}
                                Download 15-Day
                              </Button>
                            </>
                          ) : (
                            <div className="flex flex-col items-center gap-1">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-200">
                                <Lock className="w-2.5 h-2.5" /> Locked (Day 15)
                              </span>
                              <span className="text-[11px] font-medium text-slate-400">
                                Day {daysElapsed}/15 ({project.daysToDay15 || Math.max(0, 15 - daysElapsed)}d left)
                              </span>
                              <Button
                                size="sm"
                                disabled
                                className="h-7 px-2.5 text-[11px] font-bold bg-slate-100 text-slate-400 border border-slate-200 rounded-lg cursor-not-allowed shadow-none flex items-center gap-1"
                              >
                                <Lock className="w-3 h-3" /> Locked
                              </Button>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Column 4: 30-Day Audit Report */}
                      <td className="py-4 px-4 text-center align-middle bg-indigo-50/20 border-r border-indigo-100/40">
                        <div className="flex flex-col items-center gap-1.5">
                          {is30Ready ? (
                            <>
                              <div className="flex items-center gap-1">
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-indigo-100 text-indigo-800 border border-indigo-200">
                                  {project.day30Score ? `${project.day30Score}%` : 'Available'}
                                </span>
                                {project.day30ScoreDelta && (
                                  <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                    {project.day30ScoreDelta}
                                  </span>
                                )}
                              </div>
                              <Button
                                size="sm"
                                disabled={is30Downloading}
                                onClick={() => handleDownload(project, '30_days')}
                                className="h-8 px-3 rounded-lg text-xs font-extrabold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm flex items-center gap-1.5"
                              >
                                {is30Downloading ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Download className="w-3.5 h-3.5" />
                                )}
                                Download 30-Day
                              </Button>
                            </>
                          ) : (
                            <div className="flex flex-col items-center gap-1">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-200">
                                <Lock className="w-2.5 h-2.5" /> Locked (Day 30)
                              </span>
                              <span className="text-[11px] font-medium text-slate-400">
                                Day {daysElapsed}/30 ({project.daysToDay30 || Math.max(0, 30 - daysElapsed)}d left)
                              </span>
                              <Button
                                size="sm"
                                disabled
                                className="h-7 px-2.5 text-[11px] font-bold bg-slate-100 text-slate-400 border border-slate-200 rounded-lg cursor-not-allowed shadow-none flex items-center gap-1"
                              >
                                <Lock className="w-3 h-3" /> Locked
                              </Button>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Column 5: Auto-Email Status */}
                      <td className="py-4 px-4 text-center align-middle">
                        <div className="flex flex-col items-center gap-1.5">
                          {is30Ready ? (
                            <>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <Mail className="w-3 h-3 text-emerald-600" />
                                Auto-Sent Every 30d
                              </span>
                              {project.day30EmailSentAt && (
                                <span className="text-[10px] text-slate-400 font-medium">
                                  Sent: {new Date(project.day30EmailSentAt).toLocaleDateString()}
                                </span>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={isSendingEmail}
                                onClick={() => handleSendEmail(project)}
                                className="h-6 px-2 text-[10px] font-bold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50"
                                title="Send 30-Day audit report to your email now"
                              >
                                {isSendingEmail ? (
                                  <Loader2 className="w-3 h-3 animate-spin mr-1" />
                                ) : (
                                  <Send className="w-3 h-3 mr-1" />
                                )}
                                Send Email Now
                              </Button>
                            </>
                          ) : (
                            <>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                                <Lock className="w-2.5 h-2.5 text-slate-400" />
                                Unlocks Day 30
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled
                                className="h-6 px-2 text-[10px] font-bold text-slate-400 cursor-not-allowed opacity-60"
                                title={`Email unlocks in ${project.daysToDay30 || Math.max(0, 30 - daysElapsed)} days`}
                              >
                                <Lock className="w-3 h-3 mr-1" />
                                Email Locked
                              </Button>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Column 6: Actions */}
                      <td className="py-4 px-5 text-right align-middle">
                        <Button asChild size="sm" className="font-extrabold text-xs h-9 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl shadow-sm">
                          <Link href={`/dashboard/audit/${project.id}`}>
                            View Audit <ArrowRight className="w-3.5 h-3.5 ml-1" />
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ==================== CARD GRID VIEW ==================== */
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => {
            const daysElapsed = project.daysElapsed ?? 0
            const is15Ready = project.isDay15Available
            const is30Ready = project.isDay30Available
            const is15Downloading = downloadingKey === `${project.id}_15_days`
            const is30Downloading = downloadingKey === `${project.id}_30_days`
            const isSendingEmail = sendingEmailId === project.id

            return (
              <Card key={project.id} className="group hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 border-slate-200 rounded-2xl overflow-hidden flex flex-col bg-white">
                <CardHeader className="pb-3 pt-5 px-6">
                  <div className="flex justify-between items-start mb-2">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-600 transition-colors">
                      <ShieldCheck className="w-5 h-5 text-indigo-600 group-hover:text-white transition-colors" />
                    </div>
                    
                    <div className="flex items-center gap-1.5">
                      {project.hasAudit && project.auditScore ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          {project.auditScore}% Optimized
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          Audit Ready
                        </span>
                      )}
                    </div>
                  </div>

                  <CardTitle className="text-xl font-black text-slate-900 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                    {project.businessName}
                  </CardTitle>
                  <div className="flex items-start gap-1.5 mt-1 text-slate-500 font-semibold text-xs leading-relaxed line-clamp-1">
                    <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                    {project.address || 'Address registered on Google profile'}
                  </div>

                  <div className="mt-2.5 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      <Tag className="w-3 h-3 text-indigo-600" />
                      {project.keywordCount > 0 ? `${project.keywordCount} Keywords` : 'GMB Keywords Active'}
                    </span>
                    <span className="text-[11px] font-bold text-slate-400">
                      Day {daysElapsed} tracked
                    </span>
                  </div>
                </CardHeader>
                
                <CardContent className="px-6 pb-6 pt-2 flex-1 flex flex-col justify-between space-y-4">
                  {/* Milestone Reports Box */}
                  <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700 border-b border-slate-200/60 pb-2">
                      <span className="flex items-center gap-1 text-indigo-700">
                        <FileText className="w-3.5 h-3.5" />
                        Milestone Audit Reports
                      </span>
                      <span className="text-[10px] text-emerald-700 font-extrabold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <Mail className="w-3 h-3" /> Auto-Email Every 30d
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {/* 15-Day Download */}
                      <div className={!is15Ready ? "bg-slate-100/70 p-2.5 rounded-lg border border-slate-200 flex flex-col justify-between gap-2" : "bg-white p-2.5 rounded-lg border border-slate-200 flex flex-col justify-between gap-2"}>
                        <div>
                          <div className="flex items-center justify-between">
                            <p className={`text-[10px] uppercase font-black tracking-wider ${is15Ready ? 'text-blue-600' : 'text-slate-500'}`}>15-Day Report</p>
                            {!is15Ready && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-bold text-amber-700 bg-amber-50 rounded border border-amber-200">
                                <Lock className="w-2.5 h-2.5" /> Locked
                              </span>
                            )}
                          </div>
                          <p className={`text-xs mt-0.5 ${is15Ready ? 'font-bold text-slate-800' : 'font-semibold text-slate-500'}`}>
                            {is15Ready ? `${project.day15Score || project.auditScore || 80}% Score` : `In ${project.daysToDay15 || Math.max(0, 15 - daysElapsed)} days`}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          disabled={!is15Ready || is15Downloading}
                          onClick={() => handleDownload(project, '15_days')}
                          className={`w-full h-7 text-[11px] font-bold rounded-md shadow-sm ${
                            is15Ready
                              ? 'bg-blue-600 hover:bg-blue-700 text-white'
                              : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                          }`}
                        >
                          {is15Downloading ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : !is15Ready ? (
                            <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> Locked</span>
                          ) : (
                            <span className="flex items-center gap-1"><Download className="w-3 h-3 mr-1" /> Download</span>
                          )}
                        </Button>
                      </div>

                      {/* 30-Day Download */}
                      <div className={!is30Ready ? "bg-slate-100/70 p-2.5 rounded-lg border border-slate-200 flex flex-col justify-between gap-2" : "bg-white p-2.5 rounded-lg border border-slate-200 flex flex-col justify-between gap-2"}>
                        <div>
                          <div className="flex items-center justify-between">
                            <p className={`text-[10px] uppercase font-black tracking-wider ${is30Ready ? 'text-indigo-600' : 'text-slate-500'}`}>30-Day Report</p>
                            {!is30Ready && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-bold text-amber-700 bg-amber-50 rounded border border-amber-200">
                                <Lock className="w-2.5 h-2.5" /> Locked
                              </span>
                            )}
                          </div>
                          <p className={`text-xs mt-0.5 ${is30Ready ? 'font-bold text-slate-800' : 'font-semibold text-slate-500'}`}>
                            {is30Ready ? `${project.day30Score || project.auditScore || 85}% Score` : `In ${project.daysToDay30 || Math.max(0, 30 - daysElapsed)} days`}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          disabled={!is30Ready || is30Downloading}
                          onClick={() => handleDownload(project, '30_days')}
                          className={`w-full h-7 text-[11px] font-bold rounded-md shadow-sm ${
                            is30Ready
                              ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                              : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                          }`}
                        >
                          {is30Downloading ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : !is30Ready ? (
                            <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> Locked</span>
                          ) : (
                            <span className="flex items-center gap-1"><Download className="w-3 h-3 mr-1" /> Download</span>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <Button asChild className="flex-1 font-black rounded-xl h-10 shadow-sm bg-indigo-600 hover:bg-indigo-700 text-white">
                      <Link href={`/dashboard/audit/${project.id}`}>
                        View Full Audit <ArrowRight className="w-4 h-4 ml-1.5" />
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      disabled={!is30Ready || isSendingEmail}
                      onClick={() => handleSendEmail(project)}
                      className={`h-10 w-10 rounded-xl border-slate-200 ${
                        is30Ready 
                          ? 'hover:bg-indigo-50 text-indigo-700' 
                          : 'text-slate-400 opacity-50 cursor-not-allowed bg-slate-50'
                      }`}
                      title={is30Ready ? "Send 30-Day Audit Report to Email" : `Email delivery locked until Day 30 (in ${project.daysToDay30 || Math.max(0, 30 - daysElapsed)}d)`}
                    >
                      {isSendingEmail ? <Loader2 className="w-4 h-4 animate-spin text-indigo-600" /> : !is30Ready ? <Lock className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
