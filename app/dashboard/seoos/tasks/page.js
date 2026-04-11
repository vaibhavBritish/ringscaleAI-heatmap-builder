'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { TaskKanban } from '@/components/seoos/TaskKanban'
import { ClipboardList, Plus, RefreshCcw } from 'lucide-react'
import { toast } from 'sonner'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function TasksPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [projects, setProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState('')
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [defaultStatus, setDefaultStatus] = useState('open')
  const [form, setForm] = useState({ title: '', description: '', type: 'technical', priority: 'medium', dueDate: '' })

  useEffect(() => {
    if (session?.user?.role !== 'admin') { router.push('/dashboard'); return }
    fetch('/api/projects').then(r => r.json()).then(d => {
      setProjects(d.projects || [])
      setLoading(false)
    })
  }, [session])

  useEffect(() => {
    if (!selectedProject) return
    fetch(`/api/seoos/tasks?projectId=${selectedProject}`).then(r => r.json()).then(d => setTasks(d.tasks || []))
  }, [selectedProject])

  const handleMove = async (taskId, newStatus) => {
    const res = await fetch('/api/seoos/tasks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: taskId, status: newStatus }),
    })
    const data = await res.json()
    if (!res.ok) { toast.error('Failed to update task'); return }
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t))
  }

  const handleAdd = async () => {
    if (!form.title || !selectedProject) { toast.error('Title and project required'); return }
    const res = await fetch('/api/seoos/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: selectedProject, ...form, status: defaultStatus }),
    })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error); return }
    setTasks(prev => [data.task, ...prev])
    setForm({ title: '', description: '', type: 'technical', priority: 'medium', dueDate: '' })
    setShowForm(false)
    toast.success('Task created!')
  }

  const handleKanbanAdd = (columnStatus) => {
    setDefaultStatus(columnStatus)
    setShowForm(true)
  }

  const open = tasks.filter(t => t.status !== 'done').length
  const done = tasks.filter(t => t.status === 'done').length

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-2">
            <ClipboardList className="w-7 h-7 text-rose-600" /> Task Board
          </h1>
          <p className="text-slate-500 mt-1">Manage SEO execution tasks across your team</p>
        </div>
        <div className="flex gap-2">
          <select onChange={e => setSelectedProject(e.target.value)} value={selectedProject}
            className="border border-slate-200 rounded-xl px-4 py-2 text-sm bg-white shadow-sm">
            <option value="">Select project...</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.businessName}</option>)}
          </select>
          <Button size="sm" onClick={() => { setDefaultStatus('open'); setShowForm(true) }}
            className="bg-rose-600 hover:bg-rose-700 text-white gap-1 h-10">
            <Plus className="w-4 h-4" /> Add Task
          </Button>
        </div>
      </div>

      {selectedProject && (
        <div className="flex gap-4 text-sm">
          <span className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-xl font-bold text-xs">{open} Open</span>
          <span className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-xl font-bold text-xs">{done} Done</span>
          <span className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs">
            {open + done > 0 ? `${Math.round((done / (open + done)) * 100)}%` : '0%'} Complete
          </span>
        </div>
      )}

      {showForm && (
        <Card className="border-rose-200 bg-rose-50/20">
          <CardHeader><CardTitle className="text-sm font-bold">New Task</CardTitle></CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Task title *" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="sm:col-span-2">
              <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Description (optional)" rows={2} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1 block">Type</label>
              <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white">
                {['technical', 'content', 'local', 'citation', 'gbp'].map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1 block">Priority</label>
              <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white">
                {['urgent', 'high', 'medium', 'low'].map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1 block">Due Date</label>
              <input type="date" value={form.dueDate} onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="flex items-end gap-2">
              <Button size="sm" onClick={handleAdd} className="bg-rose-600 hover:bg-rose-700 text-white">Create Task</Button>
              <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedProject ? (
        loading ? <Skeleton className="h-64 rounded-2xl" /> :
        <TaskKanban tasks={tasks} onMove={handleMove} onAdd={handleKanbanAdd} />
      ) : (
        <div className="text-center py-20 text-slate-400">
          <ClipboardList className="w-12 h-12 mx-auto mb-3 text-slate-200" />
          <p className="font-bold text-slate-600">Select a project to manage tasks</p>
        </div>
      )}
    </div>
  )
}
