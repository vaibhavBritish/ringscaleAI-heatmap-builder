'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ChangeTimeline } from '@/components/seoos/ChangeTimeline'
import { History, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

const TYPES = ['website', 'gbp', 'citation', 'content', 'ranking', 'review']

export default function ChangelogPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [projects, setProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState('')
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ type: 'website', title: '', description: '', pageUrl: '', beforeValue: '', afterValue: '', happenedAt: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (session?.user?.role !== 'admin') { router.push('/dashboard'); return }
    fetch('/api/projects').then(r => r.json()).then(d => {
      setProjects(d.projects || [])
      setLoading(false)
    })
  }, [session])

  useEffect(() => {
    if (!selectedProject) return
    fetch(`/api/seoos/changelog?projectId=${selectedProject}`).then(r => r.json()).then(d => setLogs(d.logs || []))
  }, [selectedProject])

  const handleSave = async () => {
    if (!form.title || !form.type || !selectedProject) { toast.error('Title and type required'); return }
    setSaving(true)
    const res = await fetch('/api/seoos/changelog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: selectedProject, ...form }),
    })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error); setSaving(false); return }
    setLogs(prev => [data.log, ...prev])
    setForm({ type: 'website', title: '', description: '', pageUrl: '', beforeValue: '', afterValue: '', happenedAt: '' })
    setShowForm(false)
    toast.success('Change logged!')
    setSaving(false)
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-2">
            <History className="w-7 h-7 text-indigo-600" /> Change Log
          </h1>
          <p className="text-slate-500 mt-1">Track SEO changes and connect them to ranking outcomes</p>
        </div>
        <div className="flex gap-2">
          <select onChange={e => setSelectedProject(e.target.value)} value={selectedProject}
            className="border border-slate-200 rounded-xl px-4 py-2 text-sm bg-white shadow-sm">
            <option value="">Select project...</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.businessName}</option>)}
          </select>
          <Button size="sm" onClick={() => setShowForm(!showForm)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1 h-10">
            <Plus className="w-4 h-4" /> Log Change
          </Button>
        </div>
      </div>

      {showForm && (
        <Card className="border-indigo-200 bg-indigo-50/20">
          <CardHeader><CardTitle className="text-sm font-bold">Log a SEO Change</CardTitle></CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1 block">Type *</label>
              <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white">
                {TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1 block">Title *</label>
              <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Updated homepage title tag" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-600 mb-1 block">Description</label>
              <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none" placeholder="What changed and why?" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1 block">Page URL</label>
              <input value={form.pageUrl} onChange={e => setForm(p => ({ ...p, pageUrl: e.target.value }))} placeholder="https://..." className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1 block">Date</label>
              <input type="date" value={form.happenedAt} onChange={e => setForm(p => ({ ...p, happenedAt: e.target.value }))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1 block">Before</label>
              <input value={form.beforeValue} onChange={e => setForm(p => ({ ...p, beforeValue: e.target.value }))} placeholder="e.g. Rank #12" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1 block">After</label>
              <input value={form.afterValue} onChange={e => setForm(p => ({ ...p, afterValue: e.target.value }))} placeholder="e.g. Rank #4" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="sm:col-span-2 flex gap-2">
              <Button size="sm" onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                {saving ? 'Saving...' : 'Log Change'}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedProject ? (
        loading ? <Skeleton className="h-64 rounded-2xl" /> :
        <ChangeTimeline logs={logs} />
      ) : (
        <div className="text-center py-20 text-slate-400">
          <History className="w-12 h-12 mx-auto mb-3 text-slate-200" />
          <p className="font-bold text-slate-600">Select a project to view change history</p>
        </div>
      )}
    </div>
  )
}
