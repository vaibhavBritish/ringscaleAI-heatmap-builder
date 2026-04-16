'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { TrendingUp, Sparkles, RefreshCcw, Tag, Plus, Lightbulb, ArrowRight, Check, Zap } from 'lucide-react'
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

const DIFFICULTY_CONFIG = {
  low: { color: 'bg-green-100 text-green-700', label: 'Easy' },
  medium: { color: 'bg-yellow-100 text-yellow-700', label: 'Medium' },
  high: { color: 'bg-red-100 text-red-700', label: 'Hard' },
}

const PRIORITY_CONFIG = {
  high: { color: 'text-red-600', icon: '🔥' },
  medium: { color: 'text-amber-600', icon: '⚡' },
  low: { color: 'text-slate-500', icon: '📌' },
}

export default function KeywordsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [projects, setProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState('')
  const [keywords, setKeywords] = useState([])
  const [clusters, setClusters] = useState([])
  const [suggestions, setSuggestions] = useState([])
  const [strategy, setStrategy] = useState('')
  const [clustering, setClustering] = useState(false)
  const [suggesting, setSuggesting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [newKeyword, setNewKeyword] = useState('')
  const [addedSuggestions, setAddedSuggestions] = useState(new Set())
  const [activeTab, setActiveTab] = useState('clusters') // 'clusters' | 'suggestions'

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
      setSuggestions([])
      setAddedSuggestions(new Set())
    })
  }, [selectedProject])

  const handleCluster = async () => {
    if (keywords.length === 0) { toast.error('No keywords to cluster'); return }
    const project = projects.find(p => p.id === selectedProject)
    setClustering(true)
    setActiveTab('clusters')
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

  const handleSuggest = async () => {
    const project = projects.find(p => p.id === selectedProject)
    setSuggesting(true)
    setActiveTab('suggestions')
    try {
      const res = await fetch('/api/seoos/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'keyword_suggest',
          projectId: selectedProject,
          saveToDb: false,
          context: {
            businessName: project?.businessName,
            category: project?.category,
            keywords: keywords.map(k => k.keyword),
            location: project?.address,
            services: project?.services,
          }
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSuggestions(data.result?.suggestions || [])
      setStrategy(data.result?.strategy || '')
      toast.success(`${data.result?.suggestions?.length || 0} keyword suggestions generated!`)
    } catch (err) {
      toast.error('Suggestion failed: ' + err.message)
    } finally {
      setSuggesting(false)
    }
  }

  const addKeyword = async (keywordText) => {
    const kw = keywordText || newKeyword.trim()
    if (!kw || !selectedProject) return
    try {
      const res = await fetch(`/api/projects/${selectedProject}/keywords`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: kw }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setKeywords(prev => [...prev, data.keyword || { keyword: kw, id: Date.now() }])
      if (!keywordText) setNewKeyword('')
      if (keywordText) {
        setAddedSuggestions(prev => new Set([...prev, kw]))
      }
      toast.success(`Keyword "${kw}" added`)
    } catch {
      toast.error('Failed to add keyword')
    }
  }

  const addAllSuggestions = async () => {
    const toAdd = suggestions.filter(s => !addedSuggestions.has(s.keyword))
    for (const s of toAdd) {
      await addKeyword(s.keyword)
    }
    toast.success(`Added ${toAdd.length} keywords!`)
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
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSuggest} disabled={suggesting}
                  className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white gap-1 shadow-sm">
                  {suggesting ? <RefreshCcw className="w-3.5 h-3.5 animate-spin" /> : <Lightbulb className="w-3.5 h-3.5" />}
                  Suggest
                </Button>
                <Button size="sm" onClick={handleCluster} disabled={clustering || keywords.length === 0}
                  className="bg-sky-600 hover:bg-sky-700 text-white gap-1">
                  {clustering ? <RefreshCcw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  Cluster
                </Button>
              </div>
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
                <Button size="sm" onClick={() => addKeyword()} className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white">
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
                  <p className="text-sm text-slate-400 text-center py-8">No keywords yet. Add some above or click &quot;Suggest&quot; for AI recommendations.</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Right panel - Tabs for Clusters / Suggestions */}
          <div className="space-y-4">
            {/* Tab switcher */}
            <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
              <button
                onClick={() => setActiveTab('clusters')}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === 'clusters'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 inline mr-1.5" />
                Clusters
              </button>
              <button
                onClick={() => setActiveTab('suggestions')}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === 'suggestions'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Lightbulb className="w-3.5 h-3.5 inline mr-1.5" />
                Suggestions
                {suggestions.length > 0 && (
                  <span className="ml-1.5 bg-violet-100 text-violet-700 text-xs px-1.5 py-0.5 rounded-full font-bold">
                    {suggestions.length}
                  </span>
                )}
              </button>
            </div>

            {/* Clusters Tab */}
            {activeTab === 'clusters' && (
              <>
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
                      <p className="font-medium">Click &quot;Cluster&quot; to<br/>segment keywords by intent</p>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Suggestions Tab */}
            {activeTab === 'suggestions' && (
              <>
                {suggesting ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-violet-600 font-medium">
                      <RefreshCcw className="w-4 h-4 animate-spin" />
                      AI is analyzing your business and finding keyword opportunities...
                    </div>
                    {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
                  </div>
                ) : suggestions.length > 0 ? (
                  <>
                    {strategy && (
                      <div className="bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200 rounded-xl p-4">
                        <div className="flex items-start gap-2">
                          <Zap className="w-4 h-4 text-violet-600 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-xs font-bold text-violet-700 uppercase tracking-wide mb-1">AI Strategy</p>
                            <p className="text-sm text-violet-900">{strategy}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <h3 className="font-black text-slate-900">Suggested Keywords ({suggestions.length})</h3>
                      <Button size="sm" onClick={addAllSuggestions} variant="outline"
                        className="text-xs gap-1 border-violet-200 text-violet-700 hover:bg-violet-50">
                        <Plus className="w-3 h-3" /> Add All
                      </Button>
                    </div>

                    <div className="space-y-2 max-h-[500px] overflow-y-auto">
                      {suggestions.map((s, idx) => {
                        const intentCfg = INTENT_CONFIG[s.intent] || INTENT_CONFIG.informational
                        const diffCfg = DIFFICULTY_CONFIG[s.difficulty] || DIFFICULTY_CONFIG.medium
                        const prioCfg = PRIORITY_CONFIG[s.priority] || PRIORITY_CONFIG.medium
                        const isAdded = addedSuggestions.has(s.keyword) || keywords.some(k => k.keyword === s.keyword)

                        return (
                          <Card key={idx} className={`transition-all ${isAdded ? 'opacity-60 bg-green-50/50' : 'hover:shadow-md'}`}>
                            <CardContent className="p-3">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                    <span className="font-semibold text-sm text-slate-900">{s.keyword}</span>
                                    <span className="text-xs">{prioCfg.icon}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${intentCfg.color}`}>
                                      {intentCfg.label}
                                    </span>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${diffCfg.color}`}>
                                      {diffCfg.label}
                                    </span>
                                  </div>
                                  {s.reason && (
                                    <p className="text-xs text-slate-500 leading-relaxed">{s.reason}</p>
                                  )}
                                </div>
                                <Button
                                  size="sm"
                                  variant={isAdded ? "ghost" : "outline"}
                                  disabled={isAdded}
                                  onClick={() => addKeyword(s.keyword)}
                                  className={`shrink-0 ${isAdded
                                    ? 'text-green-600'
                                    : 'border-sky-200 text-sky-700 hover:bg-sky-50'
                                  }`}
                                >
                                  {isAdded ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-72 rounded-2xl border-2 border-dashed border-violet-200 text-slate-400 text-center p-8">
                    <div>
                      <Lightbulb className="w-10 h-10 mx-auto mb-3 text-violet-200" />
                      <p className="font-medium text-slate-500">Click &quot;Suggest&quot; to get<br/>AI-powered keyword recommendations</p>
                      <p className="text-xs text-slate-400 mt-2">Based on your business, location & competitors</p>
                    </div>
                  </div>
                )}
              </>
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
