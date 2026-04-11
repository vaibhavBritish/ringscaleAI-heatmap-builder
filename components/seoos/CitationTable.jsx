'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, ChevronDown, ChevronRight, ExternalLink, CheckCircle2, Clock, XCircle, MinusCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const STATUS_CONFIG = {
  live: { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-100', label: 'Live' },
  pending: { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100', label: 'Pending' },
  failed: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100', label: 'Failed' },
  not_submitted: { icon: MinusCircle, color: 'text-slate-400', bg: 'bg-slate-100', label: 'Not Submitted' },
}

export function CitationTable({ citations = [], onStatusChange, onAdd }) {
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')

  const filtered = citations.filter(c =>
    (!statusFilter || c.status === statusFilter) &&
    (!search || c.directoryName.toLowerCase().includes(search.toLowerCase()) || c.businessName.toLowerCase().includes(search.toLowerCase()))
  )

  const counts = Object.keys(STATUS_CONFIG).reduce((acc, k) => {
    acc[k] = citations.filter(c => c.status === k).length
    return acc
  }, {})

  return (
    <div className="space-y-4">
      {/* Summary tabs */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setStatusFilter('')}
          className={cn('px-3 py-1.5 rounded-xl text-xs font-bold border transition-all',
            !statusFilter ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
          )}>
          All ({citations.length})
        </button>
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
          <button key={key}
            onClick={() => setStatusFilter(key)}
            className={cn('px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1',
              statusFilter === key ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
            )}>
            <span className={cn('w-2 h-2 rounded-full inline-block', cfg.bg)}></span>
            {cfg.label} ({counts[key]})
          </button>
        ))}
        <Button size="sm" className="ml-auto h-8 bg-blue-600 hover:bg-blue-700 text-white gap-1" onClick={onAdd}>
          <Plus className="w-3.5 h-3.5" /> Add Citation
        </Button>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search directories..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
      />

      {/* Table */}
      <div className="rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-bold text-slate-600 text-xs uppercase tracking-wider">Directory</th>
              <th className="text-left px-4 py-3 font-bold text-slate-600 text-xs uppercase tracking-wider hidden md:table-cell">Category</th>
              <th className="text-left px-4 py-3 font-bold text-slate-600 text-xs uppercase tracking-wider">Status</th>
              <th className="text-left px-4 py-3 font-bold text-slate-600 text-xs uppercase tracking-wider hidden lg:table-cell">NAP</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {filtered.map(citation => {
              const cfg = STATUS_CONFIG[citation.status] || STATUS_CONFIG.not_submitted
              const Icon = cfg.icon
              return (
                <tr key={citation.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-bold text-slate-900">{citation.directoryName}</p>
                      {citation.directoryUrl && (
                        <a href={citation.directoryUrl} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-blue-500 hover:underline flex items-center gap-0.5 mt-0.5">
                          <ExternalLink className="w-3 h-3" /> Visit
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 capitalize">
                      {citation.category || 'general'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <Icon className={cn('w-3.5 h-3.5', cfg.color)} />
                      <span className={cn('text-xs font-bold', cfg.color)}>{cfg.label}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <p className="text-xs text-slate-500 leading-tight">
                      {[citation.businessName, citation.phone, citation.address].filter(Boolean).join(' • ')}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <select
                      value={citation.status}
                      onChange={e => onStatusChange?.(citation.id, e.target.value)}
                      className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white"
                    >
                      {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-400 text-sm">No citations found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
