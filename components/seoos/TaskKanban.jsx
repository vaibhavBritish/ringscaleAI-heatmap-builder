'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, GripVertical, User, Calendar, Flag, AlertCircle, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'

const COLUMNS = [
  { id: 'open', label: 'Open', color: 'bg-slate-100 text-slate-700', accent: 'border-slate-300' },
  { id: 'in_progress', label: 'In Progress', color: 'bg-blue-100 text-blue-700', accent: 'border-blue-400' },
  { id: 'blocked', label: 'Blocked', color: 'bg-red-100 text-red-700', accent: 'border-red-400' },
  { id: 'done', label: 'Done', color: 'bg-emerald-100 text-emerald-700', accent: 'border-emerald-400' },
]

const PRIORITY_CONFIG = {
  urgent: { color: 'text-red-600 bg-red-50', label: '🔴 Urgent' },
  high: { color: 'text-orange-600 bg-orange-50', label: '🟠 High' },
  medium: { color: 'text-amber-600 bg-amber-50', label: '🟡 Medium' },
  low: { color: 'text-slate-500 bg-slate-50', label: '⚪ Low' },
}

const TYPE_COLORS = {
  technical: 'bg-purple-100 text-purple-700',
  content: 'bg-sky-100 text-sky-700',
  local: 'bg-green-100 text-green-700',
  citation: 'bg-orange-100 text-orange-700',
  gbp: 'bg-pink-100 text-pink-700',
}

function TaskCard({ task, onMove }) {
  const priority = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm hover:shadow-md transition-shadow space-y-2.5 group">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-bold text-slate-900 leading-tight flex-1">{task.title}</p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold', priority.color)}>{priority.label}</span>
        {task.type && <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold capitalize', TYPE_COLORS[task.type] || 'bg-slate-100 text-slate-600')}>{task.type}</span>}
      </div>

      {task.description && <p className="text-xs text-slate-500 line-clamp-2">{task.description}</p>}

      <div className="flex items-center justify-between pt-1 border-t border-slate-100">
        <div className="flex gap-2 text-xs text-slate-400">
          {task.dueDate && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDistanceToNow(new Date(task.dueDate), { addSuffix: true })}
            </span>
          )}
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {COLUMNS.filter(c => c.id !== task.status).map(col => (
            <button key={col.id} onClick={() => onMove(task.id, col.id)}
              className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold transition-colors">
              → {col.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export function TaskKanban({ tasks = [], onMove, onAdd }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 min-h-[400px]">
      {COLUMNS.map(col => {
        const colTasks = tasks.filter(t => t.status === col.id)
        return (
          <div key={col.id} className="flex flex-col gap-3">
            {/* Column header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={cn('px-2.5 py-1 rounded-full text-xs font-bold', col.color)}>{col.label}</span>
                <span className="text-xs font-bold text-slate-400">{colTasks.length}</span>
              </div>
              <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-slate-400 hover:text-slate-700"
                onClick={() => onAdd?.(col.id)}>
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>

            {/* Column body */}
            <div className={cn('flex-1 rounded-xl border-2 border-dashed p-2 space-y-2 min-h-[200px]', col.accent, 'border-opacity-40')}>
              {colTasks.map(task => (
                <TaskCard key={task.id} task={task} onMove={onMove} />
              ))}
              {colTasks.length === 0 && (
                <div className="flex items-center justify-center h-24 text-xs text-slate-300 font-medium">
                  No tasks
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
