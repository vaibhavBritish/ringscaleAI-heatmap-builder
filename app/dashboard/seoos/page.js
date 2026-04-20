'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle, CheckCircle2, Sparkles, ClipboardList, TrendingUp, BarChart3, Link2, FileSearch, QrCode } from 'lucide-react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

function StatCard({ icon: Icon, label, value, sub, color = 'text-slate-900', href }) {
  const inner = (
    <div className="flex items-center gap-4 p-5">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color.replace('text-', 'bg-').replace('600', '100').replace('700', '100')}`}>
        <Icon className={`w-6 h-6 ${color}`} />
      </div>
      <div>
        <p className="text-2xl font-black text-slate-900">{value ?? '—'}</p>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">{label}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
  return (
    <Card className="hover:shadow-lg transition-shadow">
      {href ? <Link href={href}>{inner}</Link> : inner}
    </Card>
  )
}

export default function SEOOSHomePage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session?.user?.role !== 'admin') { router.push('/dashboard'); return }
    fetch('/api/seoos/reports')
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [session])

  const o = data?.overview

  const modules = [
    { icon: FileSearch, label: 'Website Audit', desc: 'Crawl & score any URL', href: '/dashboard/seoos/website-audit', color: 'text-blue-600' },
    { icon: Sparkles, label: 'AI Builder', desc: 'AI Asset Studio', href: '/dashboard/seoos/ai-builder', color: 'text-indigo-600' },
    { icon: Sparkles, label: 'Review Generator', desc: 'Generate AI Review Pages', href: '/dashboard/seoos/review-generator', color: 'text-amber-600' },
    { icon: QrCode, label: 'QR Generator', desc: 'Trackable Dynamic QRs', href: '/dashboard/seoos/qr-generator', color: 'text-indigo-600' },
    { icon: Sparkles, label: 'AI Assistant', desc: `${o?.pendingRecs || 0} pending approvals`, href: '/dashboard/seoos/ai-assistant', color: 'text-purple-600' },
    { icon: BarChart3, label: 'GBP Suite', desc: 'Google Business optimization', href: '/dashboard/seoos/gbp-suite', color: 'text-emerald-600' },
    { icon: TrendingUp, label: 'Keywords', desc: 'AI-powered clustering', href: '/dashboard/seoos/keywords', color: 'text-sky-600' },
    { icon: Link2, label: 'Citations', desc: `${o?.citationCoverage || 0}% coverage`, href: '/dashboard/seoos/citations', color: 'text-orange-600' },
    { icon: ClipboardList, label: 'Tasks', desc: `${o?.openTasks || 0} open tasks`, href: '/dashboard/seoos/tasks', color: 'text-rose-600' },
  ]

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-3xl font-black text-slate-900">SEOOS Command Center</h1>
          </div>
          <p className="text-slate-500 font-medium ml-[52px]">Internal SEO Operating System · Admin Only</p>
        </div>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {loading ? Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />) : (<>
          <StatCard icon={AlertCircle} label="Critical Issues" value={o?.criticalIssues} color="text-red-600" href="/dashboard/seoos/website-audit" />
          <StatCard icon={Sparkles} label="AI Pending" value={o?.pendingRecs} color="text-purple-600" href="/dashboard/seoos/ai-assistant" />
          <StatCard icon={ClipboardList} label="Open Tasks" value={o?.openTasks} color="text-blue-600" href="/dashboard/seoos/tasks" />
          <StatCard icon={CheckCircle2} label="Tasks Done" value={o?.doneTasks} sub={`${o?.taskCompletionRate || 0}% rate`} color="text-emerald-600" />
          <StatCard icon={Link2} label="Citation Coverage" value={`${o?.citationCoverage || 0}%`} color="text-orange-600" href="/dashboard/seoos/citations" />
          <StatCard icon={TrendingUp} label="AI Approval Rate" value={`${o?.aiApprovalRate || 0}%`} color="text-sky-600" />
        </>)}
      </div>

      {/* Avg SEO Scores */}
      {data?.avgScores && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-bold">Latest Audit Score Averages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Technical', value: data.avgScores.tech, color: 'bg-blue-500' },
                { label: 'On-Page', value: data.avgScores.onPage, color: 'bg-purple-500' },
                { label: 'Content', value: data.avgScores.content, color: 'bg-emerald-500' },
                { label: 'Performance', value: data.avgScores.perf, color: 'bg-amber-500' },
              ].map(s => (
                <div key={s.label} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-700">{s.label}</span>
                    <span className="text-sm font-black text-slate-900">{s.value}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${s.color}`} style={{ width: `${s.value}%`, transition: 'width 0.8s ease' }} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Module cards */}
      <div>
        <h2 className="text-lg font-black text-slate-900 mb-4">SEOOS Modules</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map(mod => (
            <Link key={mod.href} href={mod.href}>
              <Card className="hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 cursor-pointer group">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${mod.color.replace('text-', 'bg-').replace('600', '100')} group-hover:scale-110 transition-transform`}>
                    <mod.icon className={`w-6 h-6 ${mod.color}`} />
                  </div>
                  <div>
                    <p className="font-black text-slate-900 group-hover:text-blue-600 transition-colors">{mod.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{mod.desc}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent audit runs */}
      {data?.latestAudits?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-bold">Recent Website Audits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.latestAudits.map(audit => (
                <div key={audit.id} className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                  <FileSearch className="w-4 h-4 text-slate-400 shrink-0" />
                  <p className="text-sm font-medium text-slate-700 flex-1 truncate">{audit.url}</p>
                  <div className="flex gap-2 shrink-0">
                    {[
                      { label: 'T', value: audit.techScore, color: 'bg-blue-100 text-blue-700' },
                      { label: 'P', value: audit.onPageScore, color: 'bg-purple-100 text-purple-700' },
                      { label: 'C', value: audit.contentScore, color: 'bg-emerald-100 text-emerald-700' },
                    ].map(s => (
                      <span key={s.label} className={`px-2 py-0.5 rounded-lg text-xs font-bold ${s.color}`}>{s.label}:{s.value ?? '—'}</span>
                    ))}
                  </div>
                  <span className="text-xs text-slate-400 hidden md:block">{audit.totalIssues} issues</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
