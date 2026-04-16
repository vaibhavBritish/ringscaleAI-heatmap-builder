'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Check, X, Edit2, ChevronDown, ChevronRight, Sparkles, AlertTriangle, Info, AlertCircle, ClipboardList } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Textarea } from '@/components/ui/textarea'

const SEVERITY_CONFIG = {
  critical: { icon: AlertCircle, bg: 'bg-red-50 border-red-200', badge: 'bg-red-100 text-red-700', label: 'Critical' },
  warning: { icon: AlertTriangle, bg: 'bg-amber-50 border-amber-200', badge: 'bg-amber-100 text-amber-700', label: 'Warning' },
  info: { icon: Info, bg: 'bg-blue-50 border-blue-200', badge: 'bg-blue-100 text-blue-700', label: 'Info' },
}

const TYPE_LABELS = {
  technical: 'Technical', 'on-page': 'On-Page', content: 'Content',
  schema: 'Schema', performance: 'Performance', local: 'Local',
}

export function IssueTable({ issues = [], onStatusChange, onGenerateAI, onCreateTask, projectId }) {
  const [expanded, setExpanded] = useState(null)
  const [filter, setFilter] = useState({ severity: '', type: '', status: '' })
  const [loadingAI, setLoadingAI] = useState(null)
  const [loadingTask, setLoadingTask] = useState(null)

  const handleCreateTask = async (issue) => {
    setLoadingTask(issue.id)
    try {
      await onCreateTask?.(issue)
    } finally {
      setLoadingTask(null)
    }
  }

  const filtered = issues.filter(i =>
    (!filter.severity || i.severity === filter.severity) &&
    (!filter.type || i.type === filter.type) &&
    (!filter.status || i.status === filter.status)
  )

  const handleGenerateAI = async (issue) => {
    setLoadingAI(issue.id)
    try {
      await onGenerateAI?.(issue)
    } finally {
      setLoadingAI(null)
    }
  }

  const severityCounts = {
    critical: issues.filter(i => i.severity === 'critical').length,
    warning: issues.filter(i => i.severity === 'warning').length,
    info: issues.filter(i => i.severity === 'info').length,
  }

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Filter:</span>
        {['', 'critical', 'warning', 'info'].map(s => (
          <button
            key={s}
            onClick={() => setFilter(f => ({ ...f, severity: s }))}
            className={cn(
              'px-3 py-1 rounded-full text-xs font-bold border transition-all',
              filter.severity === s
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
            )}
          >
            {s === '' ? `All (${issues.length})` : `${SEVERITY_CONFIG[s]?.label} (${severityCounts[s]})`}
          </button>
        ))}
        <select
          value={filter.type}
          onChange={e => setFilter(f => ({ ...f, type: e.target.value }))}
          className="ml-auto text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white"
        >
          <option value="">All Types</option>
          {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {/* Issues list */}
      <div className="space-y-2">
        {filtered.map(issue => {
          const cfg = SEVERITY_CONFIG[issue.severity] || SEVERITY_CONFIG.info
          const Icon = cfg.icon
          const isExpanded = expanded === issue.id

          return (
            <div key={issue.id} className={cn('border rounded-xl overflow-hidden transition-all', cfg.bg)}>
              <button
                className="w-full flex items-center gap-3 p-4 text-left"
                onClick={() => setExpanded(isExpanded ? null : issue.id)}
              >
                <Icon className="w-4 h-4 shrink-0 text-current" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900 text-sm">{issue.title}</span>
                    <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold uppercase', cfg.badge)}>{issue.severity}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 uppercase">{TYPE_LABELS[issue.type]}</span>
                    {issue.status === 'resolved' && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 uppercase">Resolved</span>}
                  </div>
                  {issue.pageUrl && <p className="text-xs text-slate-400 mt-0.5 truncate">{issue.pageUrl}</p>}
                </div>
                {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />}
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 border-t border-current/10 space-y-3">
                  <p className="text-sm text-slate-700 mt-3">{issue.description}</p>
                  {issue.recommendation && (
                    <div className="bg-white/70 rounded-lg p-3 text-xs text-slate-700 border border-current/10">
                      <span className="font-bold">Recommendation: </span>{issue.recommendation}
                    </div>
                  )}
                  <div className="flex gap-2 flex-wrap">
                    {issue.status !== 'resolved' && (
                      <Button size="sm" variant="outline" className="text-xs h-8"
                        onClick={() => onStatusChange?.(issue.id, 'resolved')}>
                        <Check className="w-3 h-3 mr-1" /> Mark Resolved
                      </Button>
                    )}
                    {issue.status !== 'ignored' && (
                      <Button size="sm" variant="ghost" className="text-xs h-8 text-slate-500"
                        onClick={() => onStatusChange?.(issue.id, 'ignored')}>
                        <X className="w-3 h-3 mr-1" /> Ignore
                      </Button>
                    )}
                      <Button size="sm" variant="outline" className="text-xs h-8 text-slate-500"
                        onClick={() => handleCreateTask(issue)}
                        disabled={loadingTask === issue.id}>
                        <ClipboardList className="w-3 h-3 mr-1" />
                        {loadingTask === issue.id ? 'Creating...' : 'Convert to Task'}
                      </Button>
                      <Button size="sm" variant="outline" className="text-xs h-8 ml-auto border-purple-200 text-purple-700 hover:bg-purple-50"
                      onClick={() => handleGenerateAI(issue)}
                      disabled={loadingAI === issue.id}>
                      <Sparkles className="w-3 h-3 mr-1" />
                      {loadingAI === issue.id ? 'Generating...' : 'AI Fix'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <Check className="w-10 h-10 mx-auto mb-2 text-emerald-300" />
            <p className="font-medium">No issues found for this filter</p>
          </div>
        )}
      </div>
    </div>
  )
}
