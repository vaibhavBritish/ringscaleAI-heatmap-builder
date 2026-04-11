'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { BarChart3, TrendingUp, AlertCircle, CheckCircle2, Sparkles, ClipboardList, Link2 } from 'lucide-react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

function MetricCard({ label, value, sub, icon: Icon, color = 'text-slate-900', bgColor = 'bg-slate-100' }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className={`text-2xl font-black ${color}`}>{value ?? '—'}</p>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mt-0.5">{label}</p>
            {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bgColor}`}>
            <Icon className={`w-5 h-5 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function SEOOSReportsPage() {
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

  const scoreData = data?.avgScores ? [
    { name: 'Tech', score: data.avgScores.tech, fill: '#3b82f6' },
    { name: 'On-Page', score: data.avgScores.onPage, fill: '#8b5cf6' },
    { name: 'Content', score: data.avgScores.content, fill: '#10b981' },
    { name: 'Perf', score: data.avgScores.perf, fill: '#f59e0b' },
  ] : []

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-black text-slate-900 flex items-center gap-2">
          <BarChart3 className="w-7 h-7 text-blue-600" /> SEOOS Reports
        </h1>
        <p className="text-slate-500 mt-1">Portfolio-level SEO performance and team throughput</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {loading ? Array(8).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />) : (<>
          <MetricCard icon={AlertCircle} label="Critical Issues" value={o?.criticalIssues} color="text-red-600" bgColor="bg-red-100" />
          <MetricCard icon={CheckCircle2} label="Issues Resolved" value={o?.resolvedIssues} color="text-emerald-600" bgColor="bg-emerald-100" />
          <MetricCard icon={Sparkles} label="AI Approved" value={o?.approvedRecs} sub={`${o?.aiApprovalRate || 0}% rate`} color="text-purple-600" bgColor="bg-purple-100" />
          <MetricCard icon={ClipboardList} label="Tasks Completed" value={o?.doneTasks} sub={`${o?.taskCompletionRate || 0}% rate`} color="text-blue-600" bgColor="bg-blue-100" />
          <MetricCard icon={BarChart3} label="Audit Runs" value={o?.totalAuditRuns} color="text-sky-600" bgColor="bg-sky-100" />
          <MetricCard icon={TrendingUp} label="Total Projects" value={o?.totalProjects} color="text-slate-700" bgColor="bg-slate-100" />
          <MetricCard icon={Link2} label="Citation Coverage" value={`${o?.citationCoverage || 0}%`} color="text-orange-600" bgColor="bg-orange-100" />
          <MetricCard icon={Sparkles} label="Pending AI Reviews" value={o?.pendingRecs} color="text-amber-600" bgColor="bg-amber-100" />
        </>)}
      </div>

      {/* Score chart */}
      {!loading && scoreData.length > 0 && (
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold">Avg SEO Scores (Latest Audits)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={scoreData} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fontWeight: 700 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(value) => [`${value}/100`, 'Score']}
                    contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
                  />
                  <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                    {scoreData.map((entry, index) => (
                      <Cell key={index} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold">Team Performance Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
              {[
                { label: 'Task Completion Rate', value: o?.taskCompletionRate || 0, color: 'bg-blue-500' },
                { label: 'AI Approval Rate', value: o?.aiApprovalRate || 0, color: 'bg-purple-500' },
                { label: 'Citation Coverage', value: o?.citationCoverage || 0, color: 'bg-orange-500' },
              ].map(item => (
                <div key={item.label} className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="font-bold text-slate-700">{item.label}</span>
                    <span className="font-black text-slate-900">{item.value}%</span>
                  </div>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${item.color} transition-all duration-1000`} style={{ width: `${item.value}%` }} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent audits table */}
      {!loading && data?.latestAudits?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-bold">Recent Audit Scores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-2.5 px-3 font-bold text-xs text-slate-500 uppercase tracking-wider">URL</th>
                    <th className="text-center py-2.5 px-3 font-bold text-xs text-slate-500 uppercase tracking-wider">Tech</th>
                    <th className="text-center py-2.5 px-3 font-bold text-xs text-slate-500 uppercase tracking-wider">On-Page</th>
                    <th className="text-center py-2.5 px-3 font-bold text-xs text-slate-500 uppercase tracking-wider">Content</th>
                    <th className="text-center py-2.5 px-3 font-bold text-xs text-slate-500 uppercase tracking-wider">Issues</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {data.latestAudits.map(a => (
                    <tr key={a.id} className="hover:bg-slate-50">
                      <td className="py-3 px-3 font-medium text-slate-700 max-w-xs truncate">{a.url}</td>
                      {[a.techScore, a.onPageScore, a.contentScore].map((score, i) => (
                        <td key={i} className="py-3 px-3 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded-lg text-xs font-black ${score >= 70 ? 'bg-emerald-100 text-emerald-700' : score >= 40 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                            {score ?? '—'}
                          </span>
                        </td>
                      ))}
                      <td className="py-3 px-3 text-center text-xs font-bold text-slate-500">{a.totalIssues}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
