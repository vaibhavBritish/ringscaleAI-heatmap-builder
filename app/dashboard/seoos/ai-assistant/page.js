'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { AIRecommendationCard } from '@/components/seoos/AIRecommendationCard'
import { Sparkles, Plus, RefreshCcw, Filter } from 'lucide-react'
import { toast } from 'sonner'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

const TYPES = [
  { value: 'title', label: 'Title Tag' },
  { value: 'meta', label: 'Meta Description' },
  { value: 'h1', label: 'H1 Heading' },
  { value: 'faq', label: 'FAQ Content' },
  { value: 'gbp_description', label: 'GBP Description' },
  { value: 'gbp_post', label: 'GBP Post' },
  { value: 'content', label: 'Content Rewrite' },
]

export default function AIAssistantPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [recs, setRecs] = useState([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [projects, setProjects] = useState([])
  const [statusFilter, setStatusFilter] = useState('pending')
  const [typeFilter, setTypeFilter] = useState('')
  // Generate form
  const [showForm, setShowForm] = useState(false)
  const [genType, setGenType] = useState('title')
  const [genProject, setGenProject] = useState('')
  const [genPageUrl, setGenPageUrl] = useState('')
  const [genCurrentText, setGenCurrentText] = useState('')
  const [genKeywords, setGenKeywords] = useState('')
  const [genLocation, setGenLocation] = useState('')
  const [genTopic, setGenTopic] = useState('')

  useEffect(() => {
    if (session?.user?.role !== 'admin') { router.push('/dashboard'); return }
    Promise.all([
      fetch('/api/projects').then(r => r.json()),
      fetch(`/api/seoos/ai?status=${statusFilter}`).then(r => r.json()),
    ]).then(([pd, rd]) => {
      setProjects(pd.projects || [])
      setRecs(rd.recommendations || [])
    }).finally(() => setLoading(false))
  }, [session, statusFilter])

  const fetchRecs = async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (statusFilter) params.set('status', statusFilter)
    if (typeFilter) params.set('type', typeFilter)
    const data = await fetch(`/api/seoos/ai?${params}`).then(r => r.json())
    setRecs(data.recommendations || [])
    setLoading(false)
  }

  const handleGenerate = async () => {
    if (!genProject) { toast.error('Select a project'); return }
    const project = projects.find(p => p.id === genProject)
    setGenerating(true)
    try {
      const res = await fetch('/api/seoos/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: genType, projectId: genProject,
          context: {
            businessName: project?.businessName || '',
            pageUrl: genPageUrl || null,
            currentText: genCurrentText || null,
            keywords: genKeywords ? genKeywords.split(',').map(k => k.trim()) : [],
            location: genLocation || null,
            topic: genTopic || null,
          }
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('AI recommendation generated!')
      setRecs(prev => [data.recommendation, ...prev])
      setShowForm(false)
    } catch (err) {
      toast.error('Generation failed: ' + err.message)
    } finally {
      setGenerating(false)
    }
  }

  const handleAction = (id, status) => {
    setRecs(prev => prev.map(r => r.id === id ? { ...r, status } : r))
  }

  const pendingCount = recs.filter(r => r.status === 'pending').length

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-2">
            <Sparkles className="w-7 h-7 text-purple-600" /> AI SEO Assistant
          </h1>
          <p className="text-slate-500 mt-1">Review, approve, edit, or reject AI-generated SEO suggestions</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}
          className="bg-purple-600 hover:bg-purple-700 text-white gap-2">
          <Plus className="w-4 h-4" /> Generate New
        </Button>
      </div>

      {/* Generate form */}
      {showForm && (
        <Card className="border-purple-200 bg-purple-50/30">
          <CardHeader><CardTitle className="text-base font-bold text-purple-800">Generate AI Recommendation</CardTitle></CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1 block">Type</label>
              <select value={genType} onChange={e => setGenType(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white">
                {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1 block">Project</label>
              <select value={genProject} onChange={e => setGenProject(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white">
                <option value="">Select project...</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.businessName}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1 block">Page URL (optional)</label>
              <input value={genPageUrl} onChange={e => setGenPageUrl(e.target.value)} placeholder="https://example.com/page" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1 block">Location (optional)</label>
              <input value={genLocation} onChange={e => setGenLocation(e.target.value)} placeholder="e.g. Austin, TX" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1 block">Current Text (to improve)</label>
              <textarea value={genCurrentText} onChange={e => setGenCurrentText(e.target.value)} rows={2} placeholder="Paste current title, meta, content..." className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1 block">Target Keywords (comma separated)</label>
              <input value={genKeywords} onChange={e => setGenKeywords(e.target.value)} placeholder="plumber, plumbing repair, Austin" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="sm:col-span-2 flex gap-3">
              <Button onClick={handleGenerate} disabled={generating} className="bg-purple-600 hover:bg-purple-700 text-white">
                {generating ? <><RefreshCcw className="w-4 h-4 mr-2 animate-spin" /> Generating...</> : <><Sparkles className="w-4 h-4 mr-2" /> Generate</>}
              </Button>
              <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats banner */}
      {!loading && (
        <div className="flex gap-4 text-sm flex-wrap">
          {[
            { label: 'Pending', count: recs.filter(r => r.status === 'pending').length, color: 'text-amber-600 bg-amber-50 border-amber-200' },
            { label: 'Approved', count: recs.filter(r => r.status === 'approved').length, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
            { label: 'Rejected', count: recs.filter(r => r.status === 'rejected').length, color: 'text-red-600 bg-red-50 border-red-200' },
          ].map(s => (
            <button key={s.label} onClick={() => setStatusFilter(s.label.toLowerCase())}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${statusFilter === s.label.toLowerCase() ? s.color : 'bg-white text-slate-600 border-slate-200'}`}>
              {s.label} · {s.count}
            </button>
          ))}
          <button onClick={() => setStatusFilter('')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${!statusFilter ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'}`}>
            All
          </button>
          <Button size="sm" variant="ghost" className="ml-auto h-8 gap-1 text-slate-500" onClick={fetchRecs}>
            <RefreshCcw className="w-3.5 h-3.5" /> Refresh
          </Button>
        </div>
      )}

      {/* Recommendation cards */}
      <div className="space-y-3">
        {loading ? Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />) :
          recs.length === 0 ? (
            <div className="text-center py-20 text-slate-400">
              <Sparkles className="w-12 h-12 mx-auto mb-3 text-purple-200" />
              <p className="font-bold text-slate-600">No recommendations yet</p>
              <p className="text-sm mt-1">Run a website audit or click "Generate New" to create AI suggestions</p>
            </div>
          ) : (
            recs.map(rec => <AIRecommendationCard key={rec.id} rec={rec} onAction={handleAction} />)
          )
        }
      </div>
    </div>
  )
}
