'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { AIRecommendationCard } from '@/components/seoos/AIRecommendationCard'
import { MapPin, Sparkles, RefreshCcw, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

const GBP_CHECKS = [
  { key: 'businessName', label: 'Business Name', desc: 'Clear, accurate legal name', weight: 10 },
  { key: 'phone', label: 'Phone Number', desc: 'Local phone number listed', weight: 10 },
  { key: 'address', label: 'Address', desc: 'Complete service address', weight: 10 },
  { key: 'primaryType', label: 'Primary Category', desc: 'Most relevant business category', weight: 15 },
  { key: 'website', label: 'Website URL', desc: 'Website linked to profile', weight: 10 },
  { key: 'description', label: 'Business Description', desc: 'Keyword-rich, 250+ characters', weight: 20 },
  { key: 'hours', label: 'Business Hours', desc: 'Complete opening hours set', weight: 10 },
  { key: 'photos', label: 'Photos', desc: 'Minimum 10 quality photos', weight: 15 },
]

export default function GBPSuitePage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [projects, setProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState(null)
  const [audits, setAudits] = useState([])
  const [recs, setRecs] = useState([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(null)

  useEffect(() => {
    if (session?.user?.role !== 'admin') { router.push('/dashboard'); return }
    fetch('/api/projects').then(r => r.json()).then(d => {
      const ps = d.projects || []
      setProjects(ps)
      if (ps.length > 0) setSelectedProject(ps[0])
      setLoading(false)
    })
  }, [session])

  useEffect(() => {
    if (!selectedProject) return
    fetch(`/api/seoos/ai?projectId=${selectedProject.id}&type=gbp_description`).then(r => r.json()).then(d => setRecs(d.recommendations || []))
  }, [selectedProject])

  const calcGBPScore = (project) => {
    if (!project) return 0
    let score = 0
    GBP_CHECKS.forEach(check => {
      const val = project[check.key] || (check.key === 'description' ? project.auditData?.description : null)
      if (val && val.length > 0) score += check.weight
    })
    return score
  }

  const generateContent = async (type) => {
    if (!selectedProject) return
    setGenerating(type)
    try {
      const res = await fetch('/api/seoos/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type, projectId: selectedProject.id,
          context: {
            businessName: selectedProject.businessName,
            category: selectedProject.primaryType,
            location: selectedProject.address,
            topic: 'general services update',
          }
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setRecs(prev => [data.recommendation, ...prev])
      toast.success(`${type === 'gbp_description' ? 'Description' : 'Post'} generated!`)
    } catch (err) {
      toast.error('Generation failed: ' + err.message)
    } finally {
      setGenerating(null)
    }
  }

  const gbpScore = calcGBPScore(selectedProject)
  const scoreColor = gbpScore >= 70 ? 'text-emerald-600' : gbpScore >= 40 ? 'text-amber-600' : 'text-red-600'
  const scoreBg = gbpScore >= 70 ? 'from-emerald-500 to-green-600' : gbpScore >= 40 ? 'from-amber-500 to-orange-600' : 'from-red-500 to-rose-600'

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-2">
            <MapPin className="w-7 h-7 text-emerald-600" /> GBP Optimization Suite
          </h1>
          <p className="text-slate-500 mt-1">Audit and AI-optimize your Google Business Profiles</p>
        </div>
        <select
          onChange={e => setSelectedProject(projects.find(p => p.id === e.target.value))}
          value={selectedProject?.id || ''}
          className="border border-slate-200 rounded-xl px-4 py-2 text-sm bg-white shadow-sm"
        >
          {projects.map(p => <option key={p.id} value={p.id}>{p.businessName}</option>)}
        </select>
      </div>

      {loading ? <Skeleton className="h-48 rounded-2xl" /> : selectedProject && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Score */}
          <Card className="lg:col-span-1">
            <CardContent className="p-6 text-center">
              <div className={`w-28 h-28 rounded-full bg-gradient-to-br ${scoreBg} flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                <span className="text-4xl font-black text-white">{gbpScore}</span>
              </div>
              <h3 className="font-black text-xl text-slate-900 mb-1">{selectedProject.businessName}</h3>
              <p className="text-sm text-slate-500 mb-4">{selectedProject.address || 'No address'}</p>
              <div className={`text-lg font-black ${scoreColor}`}>
                {gbpScore >= 70 ? '✅ Well optimized' : gbpScore >= 40 ? '⚠️ Needs work' : '❌ Critical gaps'}
              </div>
            </CardContent>
          </Card>

          {/* Checklist */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base font-bold">Profile Completeness Checklist</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {GBP_CHECKS.map(check => {
                const val = selectedProject[check.key]
                const ok = val && val.length > 0
                return (
                  <div key={check.key} className={`flex items-center gap-3 p-3 rounded-xl ${ok ? 'bg-emerald-50 border border-emerald-100' : 'bg-red-50 border border-red-100'}`}>
                    {ok
                      ? <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                      : <XCircle className="w-4 h-4 text-red-400 shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900">{check.label}</p>
                      <p className="text-xs text-slate-500">{check.desc}</p>
                    </div>
                    <span className="text-xs font-bold text-slate-400">{check.weight}pts</span>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          {/* AI Generation panel */}
          <Card className="lg:col-span-3">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base font-bold">AI Content Generator</CardTitle>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => generateContent('gbp_description')} disabled={!!generating}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1">
                  {generating === 'gbp_description' ? <RefreshCcw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  Description
                </Button>
                <Button size="sm" onClick={() => generateContent('gbp_post')} disabled={!!generating}
                  className="bg-blue-600 hover:bg-blue-700 text-white gap-1">
                  {generating === 'gbp_post' ? <RefreshCcw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  GBP Post
                </Button>
                <Button size="sm" onClick={() => generateContent('faq')} disabled={!!generating}
                  className="bg-purple-600 hover:bg-purple-700 text-white gap-1">
                  {generating === 'faq' ? <RefreshCcw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  FAQ
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {recs.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                  <Sparkles className="w-10 h-10 mx-auto mb-2 text-emerald-200" />
                  <p className="text-sm">Click a button above to generate AI content for this profile</p>
                </div>
              ) : (
                recs.map(rec => <AIRecommendationCard key={rec.id} rec={rec} onAction={(id, status) => setRecs(prev => prev.map(r => r.id === id ? { ...r, status } : r))} />)
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
