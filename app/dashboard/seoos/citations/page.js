'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { CitationTable } from '@/components/seoos/CitationTable'
import { Link2, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

const DEFAULT_DIRECTORIES = [
  { name: 'Google Business Profile', url: 'https://business.google.com', category: 'general' },
  { name: 'Yelp', url: 'https://yelp.com', category: 'general' },
  { name: 'Facebook', url: 'https://facebook.com', category: 'general' },
  { name: 'Bing Places', url: 'https://bingplaces.com', category: 'general' },
  { name: 'Apple Maps', url: 'https://maps.apple.com', category: 'general' },
  { name: 'Yellow Pages', url: 'https://yellowpages.com', category: 'general' },
  { name: 'BBB (Better Business Bureau)', url: 'https://bbb.org', category: 'general' },
  { name: 'Angi (Angie\'s List)', url: 'https://angi.com', category: 'industry' },
  { name: 'HomeAdvisor', url: 'https://homeadvisor.com', category: 'industry' },
  { name: 'Foursquare', url: 'https://foursquare.com', category: 'general' },
]

export default function CitationsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [projects, setProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState('')
  const [citations, setCitations] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [form, setForm] = useState({ directoryName: '', directoryUrl: '', category: 'general', status: 'pending', phone: '', website: '', city: '', state: '' })

  useEffect(() => {
    if (session?.user?.role !== 'admin') { router.push('/dashboard'); return }
    fetch('/api/projects').then(r => r.json()).then(d => {
      setProjects(d.projects || [])
      setLoading(false)
    })
  }, [session])

  useEffect(() => {
    if (!selectedProject) return
    fetch(`/api/seoos/citations?projectId=${selectedProject}`).then(r => r.json()).then(d => {
      setCitations(d.citations || [])
      setStats(d.stats)
    })
  }, [selectedProject])

  const project = projects.find(p => p.id === selectedProject)

  const handleStatusChange = async (id, status) => {
    await fetch('/api/seoos/citations', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    setCitations(prev => prev.map(c => c.id === id ? { ...c, status } : c))
    toast.success(`Citation marked as ${status}`)
  }

  const handleAdd = async () => {
    if (!form.directoryName || !selectedProject || !project) { toast.error('Fill required fields'); return }
    const res = await fetch('/api/seoos/citations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: selectedProject, businessName: project.businessName, ...form }),
    })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error); return }
    setCitations(prev => [data.citation, ...prev])
    setShowAddForm(false)
    setForm({ directoryName: '', directoryUrl: '', category: 'general', status: 'pending', phone: '', website: '', city: '', state: '' })
    toast.success('Citation added!')
  }

  const seedDefaultDirectories = async () => {
    if (!project) return
    let added = 0
    for (const dir of DEFAULT_DIRECTORIES) {
      if (citations.find(c => c.directoryName === dir.name)) continue
      const res = await fetch('/api/seoos/citations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: selectedProject, businessName: project.businessName, directoryName: dir.name, directoryUrl: dir.url, category: dir.category, status: 'not_submitted' }),
      })
      const data = await res.json()
      if (res.ok) { setCitations(prev => [...prev, data.citation]); added++ }
    }
    toast.success(`Added ${added} default directories`)
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-2">
            <Link2 className="w-7 h-7 text-orange-600" /> Citation Manager
          </h1>
          <p className="text-slate-500 mt-1">Track NAP consistency and citation submission status</p>
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

      {selectedProject && stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Directories', value: stats.total, color: 'text-slate-900' },
            { label: 'Live', value: stats.live, color: 'text-emerald-600' },
            { label: 'Pending', value: stats.pending, color: 'text-amber-600' },
            { label: 'Coverage Score', value: `${stats.coverageScore}%`, color: 'text-blue-600' },
          ].map(s => (
            <Card key={s.label}>
              <CardContent className="p-4 text-center">
                <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                <p className="text-xs font-medium text-slate-500 mt-1">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedProject && (
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" onClick={() => setShowAddForm(!showAddForm)} className="bg-orange-600 hover:bg-orange-700 text-white gap-1">
            <Plus className="w-4 h-4" /> Add Custom
          </Button>
          <Button size="sm" variant="outline" onClick={seedDefaultDirectories}>
            Seed 10 Defaults
          </Button>
        </div>
      )}

      {showAddForm && (
        <Card className="border-orange-200 bg-orange-50/20">
          <CardHeader><CardTitle className="text-sm font-bold">Add Citation</CardTitle></CardHeader>
          <CardContent className="grid sm:grid-cols-3 gap-3">
            {[
              { key: 'directoryName', label: 'Directory Name *', placeholder: 'e.g. Yelp' },
              { key: 'directoryUrl', label: 'Directory URL', placeholder: 'https://...' },
              { key: 'phone', label: 'Phone', placeholder: '(512) 555-0100' },
              { key: 'website', label: 'Website', placeholder: 'https://...' },
              { key: 'city', label: 'City', placeholder: 'Austin' },
              { key: 'state', label: 'State', placeholder: 'TX' },
            ].map(f => (
              <div key={f.key}>
                <label className="text-xs font-bold text-slate-600 mb-1 block">{f.label}</label>
                <input value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
              </div>
            ))}
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1 block">Category</label>
              <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white">
                <option value="general">General</option>
                <option value="industry">Industry</option>
                <option value="local">Local</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1 block">Status</label>
              <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white">
                <option value="not_submitted">Not Submitted</option>
                <option value="pending">Pending</option>
                <option value="live">Live</option>
                <option value="failed">Failed</option>
              </select>
            </div>
            <div className="sm:col-span-3 flex gap-2">
              <Button size="sm" onClick={handleAdd} className="bg-orange-600 hover:bg-orange-700 text-white">Add Citation</Button>
              <Button size="sm" variant="ghost" onClick={() => setShowAddForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedProject ? (
        loading ? <Skeleton className="h-64 rounded-2xl" /> :
        <Card>
          <CardContent className="p-6">
            <CitationTable citations={citations} onStatusChange={handleStatusChange} onAdd={() => setShowAddForm(true)} />
          </CardContent>
        </Card>
      ) : (
        <div className="text-center py-20 text-slate-400">
          <Link2 className="w-12 h-12 mx-auto mb-3 text-slate-200" />
          <p className="font-bold text-slate-600">Select a project to manage citations</p>
        </div>
      )}
    </div>
  )
}
