'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  FileText, 
  Download, 
  Clock, 
  MapPin, 
  Loader2, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles, 
  Calendar, 
  Mail, 
  CheckCircle2, 
  Tag, 
  Send,
  Lock
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { toast } from 'sonner'
import { downloadAuditPdf } from '@/lib/export-audit-pdf'

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('audits') // 'audits' | 'scans'
  const [reports, setReports] = useState([])
  const [businesses, setBusinesses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [downloadingKey, setDownloadingKey] = useState(null)
  const [sendingEmailId, setSendingEmailId] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [reportsRes, projectsRes] = await Promise.all([
          fetch('/api/reports').catch(() => null),
          fetch('/api/projects').catch(() => null)
        ])

        if (reportsRes && reportsRes.ok) {
          const data = await reportsRes.json()
          setReports(data.reports || [])
        }

        if (projectsRes && projectsRes.ok) {
          const data = await projectsRes.json()
          setBusinesses(data.projects || [])
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleDownloadAudit = async (biz, milestone) => {
    if (milestone === '15_days' && !biz.isDay15Available) {
      toast.error('The 15-Day Milestone report is locked until 15 days have elapsed.')
      return
    }
    if (milestone === '30_days' && !biz.isDay30Available) {
      toast.error('The 30-Day Milestone report is locked until 30 days have elapsed.')
      return
    }

    const key = `${biz.id}_${milestone}`
    setDownloadingKey(key)
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
      setDownloadingKey(null)
    }
  }

  const handleSendEmail = async (biz) => {
    if (!biz.isDay30Available) {
      toast.error('The 30-Day Audit Report email unlocks after 30 days have elapsed.')
      return
    }

    setSendingEmailId(biz.id)
    try {
      const res = await fetch(`/api/projects/${biz.id}/audit/periodic`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send_email' })
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success(data.message || '30-Day Audit Report sent to email!')
      } else {
        throw new Error(data.error || 'Failed to send audit email')
      }
    } catch (err) {
      toast.error(err.message || 'Could not send audit email')
    } finally {
      setSendingEmailId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Reports & Audits</h1>
          <p className="text-slate-600 mt-1 font-medium">
            Download your automated 15-day and 30-day business audit reports and inspect heatmap rank scans
          </p>
        </div>

        {/* Tab switcher */}
        <div className="bg-slate-100 p-1 rounded-2xl border border-slate-200 flex items-center">
          <button
            onClick={() => setActiveTab('audits')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'audits'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            15 & 30 Day Audits ({businesses.length})
          </button>
          <button
            onClick={() => setActiveTab('scans')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'scans'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4 text-blue-600" />
            Heatmap Scans ({reports.length})
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 text-sm font-semibold">
          {error}
        </div>
      )}

      {/* ==================== 15 & 30 DAY AUDIT REPORTS TAB ==================== */}
      {activeTab === 'audits' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-5 shadow-sm border border-blue-800 flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300 shrink-0">
                <Sparkles className="w-5 h-5 text-blue-300" />
              </div>
              <div>
                <h4 className="font-extrabold text-white text-sm flex items-center gap-2">
                  Scheduled Periodic Delivery Active
                  <span className="bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] uppercase font-black px-2 py-0.5 rounded-full">
                    30-Day Auto-Email
                  </span>
                </h4>
                <p className="text-xs text-blue-200/90 font-medium mt-0.5">
                  Your updated audit report is automatically regenerated every 15 days and 30 days, with monthly reports dispatched to your inbox.
                </p>
              </div>
            </div>
          </div>

          {businesses.length === 0 ? (
            <Card className="border-slate-200 bg-slate-50 shadow-sm rounded-2xl">
              <CardContent className="py-16 text-center">
                <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-xl font-bold text-slate-900 mb-2">No business profiles linked yet</h3>
                <p className="text-slate-500 mb-6 max-w-sm mx-auto text-sm">
                  Connect your Google Business Profile to generate and automatically download 15-day and 30-day audit reports.
                </p>
                <Button asChild className="bg-indigo-600 hover:bg-indigo-700 font-bold rounded-xl px-6">
                  <Link href="/dashboard/projects/new">
                    Create Project
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {businesses.map((biz) => {
                const daysElapsed = biz.daysElapsed ?? 0
                const is15Ready = biz.isDay15Available
                const is30Ready = biz.isDay30Available
                const is15Downloading = downloadingKey === `${biz.id}_15_days`
                const is30Downloading = downloadingKey === `${biz.id}_30_days`
                const isSendingEmail = sendingEmailId === biz.id

                return (
                  <Card key={biz.id} className="border-slate-200 hover:border-indigo-300 hover:shadow-lg transition-all rounded-2xl overflow-hidden flex flex-col bg-white">
                    <CardHeader className="pb-3 pt-5 px-6">
                      <div className="flex justify-between items-start mb-2">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black">
                          <ShieldCheck className="w-5 h-5" />
                        </div>
                        {biz.auditScore ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            {biz.auditScore}% Optimized
                          </span>
                        ) : (
                          <span className="text-xs font-bold bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded-full border border-amber-200">
                            Ready
                          </span>
                        )}
                      </div>

                      <CardTitle className="text-lg font-black text-slate-900 line-clamp-1">
                        {biz.businessName}
                      </CardTitle>
                      <CardDescription className="text-xs text-slate-500 line-clamp-1 flex items-center gap-1 mt-1">
                        <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                        {biz.address || 'Address registered on Google profile'}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="px-6 pb-6 pt-1 flex-1 flex flex-col justify-between space-y-4">
                      {/* Periodic Download Boxes */}
                      <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-2.5">
                        <div className="flex items-center justify-between text-xs font-extrabold text-slate-700">
                          <span className="text-indigo-700 font-bold flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> Milestone Audits
                          </span>
                          <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-extrabold flex items-center gap-1">
                            <Mail className="w-2.5 h-2.5" /> Sent Every 30d
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          {/* 15-Day Milestone */}
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
                                {is15Ready ? `${biz.day15Score || biz.auditScore || 80}% Score` : `In ${biz.daysToDay15 || Math.max(0, 15 - daysElapsed)}d`}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              disabled={!is15Ready || is15Downloading}
                              onClick={() => handleDownloadAudit(biz, '15_days')}
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
                                <span className="flex items-center gap-1"><Download className="w-3 h-3 mr-0.5" /> Download</span>
                              )}
                            </Button>
                          </div>

                          {/* 30-Day Milestone */}
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
                                {is30Ready ? `${biz.day30Score || biz.auditScore || 85}% Score` : `In ${biz.daysToDay30 || Math.max(0, 30 - daysElapsed)}d`}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              disabled={!is30Ready || is30Downloading}
                              onClick={() => handleDownloadAudit(biz, '30_days')}
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
                                <span className="flex items-center gap-1"><Download className="w-3 h-3 mr-0.5" /> Download</span>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <Button asChild className="flex-1 font-bold text-xs h-9 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl shadow-sm">
                          <Link href={`/dashboard/audit/${biz.id}`}>
                            View Audit Online <ArrowRight className="w-3.5 h-3.5 ml-1" />
                          </Link>
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          disabled={!is30Ready || isSendingEmail}
                          onClick={() => handleSendEmail(biz)}
                          className={`h-9 w-9 rounded-xl border-slate-200 ${
                            is30Ready
                              ? 'text-indigo-700 hover:bg-indigo-50'
                              : 'text-slate-400 opacity-50 cursor-not-allowed bg-slate-50'
                          }`}
                          title={is30Ready ? "Send 30-Day Audit Report to Email" : `Email delivery locked until Day 30 (in ${biz.daysToDay30 || Math.max(0, 30 - daysElapsed)}d)`}
                        >
                          {isSendingEmail ? <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" /> : !is30Ready ? <Lock className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ==================== HEATMAP SCAN REPORTS TAB ==================== */}
      {activeTab === 'scans' && (
        <div>
          {reports.length === 0 ? (
            <Card className="border-slate-200 bg-slate-50 shadow-sm rounded-2xl">
              <CardContent className="py-16 text-center">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-200 shadow-sm">
                  <FileText className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">No heatmap scan reports yet</h3>
                <p className="text-slate-500 mb-6 max-w-sm mx-auto text-sm">
                  Complete a heatmap scan for any of your project keywords and it will appear here.
                </p>
                <Button asChild className="bg-blue-600 hover:bg-blue-700 font-bold rounded-xl px-6">
                  <Link href="/dashboard/projects">
                    Go to Projects
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {reports.map((report) => (
                <Card key={report.id} className="hover:border-blue-300 transition-all hover:shadow-md flex flex-col group rounded-2xl">
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
                        {formatDistanceToNow(new Date(report.completedAt), { addSuffix: true })}
                      </span>
                      <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                        <MapPin className="w-4 h-4 text-blue-600" />
                      </div>
                    </div>
                    <CardTitle className="text-xl font-bold text-slate-900 line-clamp-1" title={report.keyword}>
                      "{report.keyword}"
                    </CardTitle>
                    <CardDescription className="font-semibold text-blue-600 line-clamp-1 flex items-center gap-1.5" title={report.projectName}>
                      <FileText className="w-3.5 h-3.5" /> {report.projectName}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="pt-0 flex-1 flex flex-col justify-end">
                    <div className="bg-slate-50 rounded-xl p-4 mb-4 grid grid-cols-2 gap-3 border border-slate-100 text-sm">
                      <div>
                        <p className="text-slate-500 text-xs font-semibold mb-0.5">Grid Density</p>
                        <p className="font-bold text-slate-900">{report.totalPoints} points</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs font-semibold mb-0.5">Coverage</p>
                        <p className="font-bold text-slate-900">
                          {report.gridSettings?.unit === 'mi' 
                            ? `${(report.searchRadiusMeters / 1609.34).toFixed(1)} mi`
                            : `${(report.searchRadiusMeters / 1000).toFixed(1)} km`
                          }
                        </p>
                      </div>
                    </div>

                    <Button asChild className="w-full font-bold group-hover:bg-blue-600 group-hover:text-white transition-colors rounded-xl" variant="outline">
                      <Link href={`/dashboard/scans/${report.id}`}>
                        View Full Report <ArrowRight className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
