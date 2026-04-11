'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { TrendingUp, Sparkles, RefreshCcw, Tag, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

const INTENT_CONFIG = {
  branded: { color: 'bg-blue-100 text-blue-700', label: '🏷️ Branded' },
  local_service: { color: 'bg-emerald-100 text-emerald-700', label: '📍 Local Service' },
  informational: { color: 'bg-purple-100 text-purple-700', label: '📖 Informational' },
  transactional: { color: 'bg-amber-100 text-amber-700', label: '💳 Transactional' },
  question: { color: 'bg-pink-100 text-pink-700', label: '❓ Question' },
}

export default function KeywordsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [projects, setProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState('')
  const [keywords, setKeywords] = useState([])
  const [clusters, setClusters] = useState([])
  const [clustering, setClustering] = useState(false)
  const [loading, setLoading] = useState(true)
  const [newKeyword, setNewKeyword] = useState('')

  useEffect(() => {
    if (session?.user?.role !== 'admin') { router.push('/dashboard'); return }
    fetch('/api/projects').then(r => r.json()).then(d => {
      setProjects(d.projects || [])
      setLoading(false)
    })
  }, [session])

  useEffect(() => {
    if (!selectedProject) return
    fetch(`/api/projects/${selectedProject}/keywords`).then(r => r.json()).then(d => {
      setKeywords(d.keywords || [])
      setClusters([])
    })
  }, [selectedProject])

  const handleCluster = async () => {
    if (keywords.length === 0) { toast.error('No keywords to cluster'); return }
    const project = projects.find(p => p.id === selectedProject)
    setClustering(true)
    try {
      const res = await fetch('/api/seoos/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'keyword_cluster',
          projectId: selectedProject,
          saveToDb: false,
          context: {
            businessName: project?.businessName,
            keywords: keywords.map(k => k.keyword),
            location: project?.address,
          }
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setClusters(data.result?.clusters || [])
      toast.success('Keywords clustered by AI!')
    } catch (err) {
      toast.error('Clustering failed: ' + err.message)
    } finally {
      setClustering(false)
    }
  }

  const addKeyword = async () => {
    if (!newKeyword.trim() || !selectedProject) return
    try {
      const res = await fetch(`/api/projects/${selectedProject}/keywords`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: newKeyword.trim() }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setKeywords(prev => [...prev, data.keyword || { keyword: newKeyword.trim(), id: Date.now() }])
      setNewKeyword('')
      toast.success('Keyword added')
    } catch {
      toast.error('Failed to add keyword')
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-7 h-7 text-sky-600" /> Keyword Intelligence
          </h1>
          <p className="text-slate-500 mt-1">AI-powered keyword clustering and intent segmentation</p>
        </div>
        <select
          onChange={e => setSelectedProject(e.target.value)}
          value={selectedProject}
          className="border border-slate-200 rounded-xl px-4 py-2 text-sm bg-white shadow-sm"
        >
          <option value="">Select project...</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.businessName}</option>)}
        </select>
      </div>

      {selectedProject ? (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Keywords list */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base font-bold">Keywords ({keywords.length})</CardTitle>
              <Button size="sm" onClick={handleCluster} disabled={clustering || keywords.length === 0}
                className="bg-sky-600 hover:bg-sky-700 text-white gap-1">
                {clustering ? <RefreshCcw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                Cluster with AI
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <input
                  value={newKeyword}
                  onChange={e => setNewKeyword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addKeyword()}
                  placeholder="Add keyword..."
                  className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <Button size="sm" onClick={addKeyword} className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              <div className="max-h-80 overflow-y-auto space-y-1.5">
                {keywords.map(kw => (
                  <div key={kw.id} className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg">
                    <Tag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="text-sm text-slate-700">{kw.keyword}</span>
                  </div>
                ))}
                {keywords.length === 0 && (
                  <p className="text-sm text-slate-400 text-center py-8">No keywords yet. Add some above or create a project with keywords first.</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Clusters */}
          <div className="space-y-4">
            {clustering ? (
              <div className="space-y-3">
                {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
              </div>
            ) : clusters.length > 0 ? (
              <>
                <h3 className="font-black text-slate-900">AI Clusters ({clusters.length})</h3>
                {clusters.map((cluster, idx) => {
                  const cfg = INTENT_CONFIG[cluster.intent] || INTENT_CONFIG.informational
                  return (
                    <Card key={idx} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${cfg.color}`}>{cfg.label}</span>
                          <span className="font-bold text-slate-900 text-sm">{cluster.name}</span>
                          <span className="ml-auto text-xs text-slate-400">{cluster.keywords?.length} kw</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {cluster.keywords?.map(kw => (
                            <span key={kw} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs font-medium">{kw}</span>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </>
            ) : (
              <div className="flex items-center justify-center h-72 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 text-center p-8">
                <div>
                  <Sparkles className="w-10 h-10 mx-auto mb-3 text-slate-200" />
                  <p className="font-medium">Click "Cluster with AI" to<br/>segment keywords by intent</p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-20 text-slate-400">
          <TrendingUp className="w-12 h-12 mx-auto mb-3 text-slate-200" />
          <p className="font-bold text-slate-600">Select a project to view keywords</p>
        </div>
      )}
    </div>
  )
}
