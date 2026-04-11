'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { SEOScoreCard } from '@/components/seoos/SEOScoreCard'
import { IssueTable } from '@/components/seoos/IssueTable'
import { Globe, Search, Sparkles, RefreshCcw, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function WebsiteAuditPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [url, setUrl] = useState('')
  const [projectId, setProjectId] = useState('')
  const [projects, setProjects] = useState([])
  const [auditing, setAuditing] = useState(false)
  const [currentAudit, setCurrentAudit] = useState(null)
  const [issues, setIssues] = useState([])
  const [runs, setRuns] = useState([])
  const [activeRunId, setActiveRunId] = useState(null)

  useEffect(() => {
    if (session?.user?.role !== 'admin') { router.push('/dashboard'); return }
    fetch('/api/projects').then(r => r.json()).then(d => setProjects(d.projects || []))
    fetch('/api/seoos/website-audit').then(r => r.json()).then(d => setRuns(d.runs || []))
  }, [session])

  const handleAudit = async () => {
    if (!url) { toast.error('Enter a URL to audit'); return }
    if (!projectId) { toast.error('Select a project'); return }
    setAuditing(true)
    setCurrentAudit(null)
    setIssues([])
    try {
      const res = await fetch('/api/seoos/website-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.startsWith('http') ? url : `https://${url}`, projectId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Audit failed')
      setCurrentAudit(data.run)
      setIssues(data.issues || [])
      setActiveRunId(data.run?.id)
      setRuns(prev => [data.run, ...prev.filter(r => r.id !== data.run?.id)])
      toast.success('Audit complete!')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setAuditing(false)
    }
  }

  const loadRun = async (run) => {
    setCurrentAudit(run)
    setActiveRunId(run.id)
    const res = await fetch(`/api/seoos/issues?auditRunId=${run.id}`)
    const data = await res.json()
    setIssues(data.issues || [])
  }

  const handleStatusChange = async (issueId, status) => {
    await fetch('/api/seoos/issues', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: issueId, status }),
    })
    setIssues(prev => prev.map(i => i.id === issueId ? { ...i, status } : i))
    toast.success(`Issue marked as ${status}`)
  }

  const handleGenerateAI = async (issue) => {
    toast.info('Generating AI fix suggestion...')
    const typeMap = {
      'on-page': issue.title.toLowerCase().includes('title') ? 'title' 
        : issue.title.toLowerCase().includes('meta') ? 'meta' 
        : issue.title.toLowerCase().includes('h1') ? 'h1' : 'content',
      content: 'content', schema: 'schema', technical: 'content',
    }
    const type = typeMap[issue.type] || 'content'
    const project = projects.find(p => p.id === (currentAudit?.projectId || projectId))
    try {
      const res = await fetch('/api/seoos/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type, projectId: currentAudit?.projectId || projectId,
          context: { businessName: project?.businessName || 'Business', pageUrl: issue.pageUrl, issueId: issue.id }
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('AI suggestion generated! Check AI Assistant.')
    } catch (err) {
      toast.error('AI generation failed: ' + err.message)
    }
  }

  const getStatusIcon = (status) => {
    if (status === 'complete') return <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
    if (status === 'failed') return <AlertCircle className="w-3.5 h-3.5 text-red-500" />
    return <Clock className="w-3.5 h-3.5 text-amber-500" />
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-black text-slate-900">Website Audit Engine</h1>
        <p className="text-slate-500 mt-1">Crawl any URL and detect SEO issues across 9 categories</p>
      </div>

      {/* Audit input */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                placeholder="https://example.com"
                value={url}
                onChange={e => setUrl(e.target.value)}
                className="h-11"
                disabled={auditing}
                onKeyDown={e => e.key === 'Enter' && handleAudit()}
              />
            </div>
            <select
              value={projectId}
              onChange={e => setProjectId(e.target.value)}
              className="h-11 border border-slate-200 rounded-lg px-3 text-sm bg-white min-w-[180px]"
              disabled={auditing}
            >
              <option value="">Select project...</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.businessName}</option>)}
            </select>
            <Button onClick={handleAudit} disabled={auditing || !url || !projectId}
              className="h-11 bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-6 shrink-0">
              {auditing ? (
                <><RefreshCcw className="w-4 h-4 mr-2 animate-spin" /> Scanning...</>
              ) : (
                <><Search className="w-4 h-4 mr-2" /> Run Audit</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* History sidebar */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold">Audit History</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {runs.length === 0 ? (
                <p className="text-xs text-slate-400 px-4 pb-4">No audits yet</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {runs.map(run => (
                    <button key={run.id}
                      className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors ${activeRunId === run.id ? 'bg-blue-50 border-r-2 border-blue-600' : ''}`}
                      onClick={() => loadRun(run)}>
                      <div className="flex items-center gap-1.5 mb-1">
                        {getStatusIcon(run.status)}
                        <span className="text-xs font-bold text-slate-700 truncate">{run.url.replace(/^https?:\/\//, '').split('/')[0]}</span>
                      </div>
                      <p className="text-[10px] text-slate-400">{run.totalIssues ?? 0} issues · T:{run.techScore ?? '?'} P:{run.onPageScore ?? '?'}</p>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main results */}
        <div className="lg:col-span-3 space-y-6">
          {auditing && (
            <div className="space-y-4">
              <div className="grid grid-cols-5 gap-3">
                {Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
              </div>
              <Skeleton className="h-64 rounded-2xl" />
            </div>
          )}

          {currentAudit && !auditing && (
            <>
              {/* Score cards */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <SEOScoreCard label="Technical" score={currentAudit.techScore} />
                <SEOScoreCard label="On-Page" score={currentAudit.onPageScore} />
                <SEOScoreCard label="Content" score={currentAudit.contentScore} />
                <SEOScoreCard label="Schema" score={currentAudit.schemaScore} />
                <SEOScoreCard label="Performance" score={currentAudit.perfScore} />
              </div>

              {/* Summary bar */}
              <div className="flex items-center gap-4 bg-slate-900 text-white rounded-2xl px-5 py-3">
                <Globe className="w-5 h-5 text-slate-300 shrink-0" />
                <span className="text-sm font-medium truncate flex-1">{currentAudit.url}</span>
                <span className="text-sm font-black">{currentAudit.totalIssues} Issues</span>
                <Button size="sm" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800 h-8"
                  onClick={() => handleGenerateAI({ type: 'on-page', title: 'Title', pageUrl: currentAudit.url, id: null })}>
                  <Sparkles className="w-3.5 h-3.5 mr-1" /> AI Fix All
                </Button>
              </div>

              {/* Issues */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-bold">Detected Issues</CardTitle>
                </CardHeader>
                <CardContent>
                  <IssueTable
                    issues={issues}
                    onStatusChange={handleStatusChange}
                    onGenerateAI={handleGenerateAI}
                  />
                </CardContent>
              </Card>
            </>
          )}

          {!currentAudit && !auditing && (
            <div className="text-center py-20 text-slate-400">
              <Globe className="w-14 h-14 mx-auto mb-4 text-slate-200" />
              <h3 className="font-bold text-lg text-slate-600">Enter a URL above to run your first audit</h3>
              <p className="text-sm mt-1">The engine checks titles, meta, H1s, images, schema, canonical, robots, viewport, and content quality</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
