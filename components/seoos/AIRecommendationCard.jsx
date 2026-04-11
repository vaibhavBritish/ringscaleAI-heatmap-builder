'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Check, X, Edit2, Sparkles, ChevronDown, ChevronRight, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const TYPE_LABELS = {
  title: 'Title Tag', meta: 'Meta Description', h1: 'H1 Heading',
  faq: 'FAQ Content', description: 'Page Description', gbp_post: 'GBP Post',
  gbp_description: 'GBP Description', schema: 'Schema Markup', content: 'Content Rewrite',
}

const CONFIDENCE_COLOR = (score) =>
  score >= 80 ? 'text-emerald-600' : score >= 60 ? 'text-amber-600' : 'text-red-600'

const RISK_COLOR = (score) =>
  score <= 20 ? 'bg-emerald-100 text-emerald-700' : score <= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'

export function AIRecommendationCard({ rec, onAction }) {
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(rec.suggestedText)
  const [loading, setLoading] = useState(false)

  const handleAction = async (status, text) => {
    setLoading(true)
    try {
      const res = await fetch('/api/seoos/ai', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: rec.id, status, approvedText: text }),
      })
      if (!res.ok) throw new Error()
      toast.success(status === 'approved' ? '✅ Approved!' : status === 'rejected' ? 'Rejected' : 'Saved')
      onAction?.(rec.id, status)
    } catch {
      toast.error('Action failed')
    } finally {
      setLoading(false)
      setEditing(false)
    }
  }

  const statusColors = {
    pending: 'bg-amber-100 text-amber-700',
    approved: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-red-100 text-red-700',
    edited: 'bg-blue-100 text-blue-700',
  }

  return (
    <div className={cn(
      'border rounded-2xl overflow-hidden transition-all duration-200',
      rec.status === 'approved' ? 'border-emerald-200 bg-emerald-50/30' :
      rec.status === 'rejected' ? 'border-red-200 bg-red-50/20 opacity-60' :
      'border-slate-200 bg-white hover:shadow-md'
    )}>
      {/* Header */}
      <button className="w-full flex items-center gap-3 p-4 text-left" onClick={() => setExpanded(!expanded)}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-bold text-slate-900 text-sm">{TYPE_LABELS[rec.type] || rec.type}</span>
            <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold capitalize', statusColors[rec.status] || 'bg-slate-100 text-slate-600')}>
              {rec.status}
            </span>
            {rec.riskScore > 50 && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">
                <AlertTriangle className="w-2.5 h-2.5" /> High Risk
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 truncate">{rec.pageUrl || 'General'}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {rec.confidenceScore != null && (
            <div className="text-right hidden sm:block">
              <p className={cn('text-lg font-black', CONFIDENCE_COLOR(rec.confidenceScore))}>{rec.confidenceScore}%</p>
              <p className="text-[9px] text-slate-400 uppercase tracking-wider">Confidence</p>
            </div>
          )}
          {expanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-slate-100 space-y-4">
          {/* Original vs Suggested */}
          <div className="grid gap-3 mt-3 sm:grid-cols-2">
            {rec.originalText && (
              <div className="bg-red-50/50 border border-red-100 rounded-xl p-3">
                <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider mb-1">Current</p>
                <p className="text-sm text-slate-700">{rec.originalText}</p>
              </div>
            )}
            <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3">
              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1">
                <Sparkles className="w-3 h-3 inline mr-1" />AI Suggestion
              </p>
              {editing ? (
                <Textarea
                  value={editText}
                  onChange={e => setEditText(e.target.value)}
                  className="text-sm min-h-[80px] bg-white"
                  autoFocus
                />
              ) : (
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{rec.suggestedText}</p>
              )}
            </div>
          </div>

          {/* Risk & confidence badges */}
          <div className="flex gap-2 flex-wrap">
            {rec.riskScore != null && (
              <span className={cn('px-2.5 py-1 rounded-full text-xs font-bold', RISK_COLOR(rec.riskScore))}>
                Risk: {rec.riskScore}/100
              </span>
            )}
            {rec.confidenceScore != null && (
              <span className={cn('px-2.5 py-1 rounded-full text-xs font-bold', CONFIDENCE_COLOR(rec.confidenceScore), 'bg-slate-100')}>
                Confidence: {rec.confidenceScore}%
              </span>
            )}
          </div>

          {/* Reasoning */}
          {rec.reasoning && (
            <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-600 border border-slate-100">
              <span className="font-bold text-slate-700">Why: </span>{rec.reasoning}
            </div>
          )}

          {/* Actions */}
          {rec.status === 'pending' && (
            <div className="flex gap-2 flex-wrap">
              {!editing ? (
                <>
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white h-9" disabled={loading}
                    onClick={() => handleAction('approved', rec.suggestedText)}>
                    <Check className="w-3.5 h-3.5 mr-1" /> Approve
                  </Button>
                  <Button size="sm" variant="outline" className="h-9 border-blue-200 text-blue-700 hover:bg-blue-50" disabled={loading}
                    onClick={() => setEditing(true)}>
                    <Edit2 className="w-3.5 h-3.5 mr-1" /> Edit & Approve
                  </Button>
                  <Button size="sm" variant="ghost" className="h-9 text-red-600 hover:bg-red-50" disabled={loading}
                    onClick={() => handleAction('rejected', null)}>
                    <X className="w-3.5 h-3.5 mr-1" /> Reject
                  </Button>
                </>
              ) : (
                <>
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white h-9" disabled={loading}
                    onClick={() => handleAction('approved', editText)}>
                    <Check className="w-3.5 h-3.5 mr-1" /> Save & Approve
                  </Button>
                  <Button size="sm" variant="ghost" className="h-9" disabled={loading}
                    onClick={() => { setEditing(false); setEditText(rec.suggestedText) }}>
                    Cancel
                  </Button>
                </>
              )}
            </div>
          )}
          {rec.status !== 'pending' && (
            <Button size="sm" variant="ghost" className="h-8 text-xs text-slate-400" disabled={loading}
              onClick={() => handleAction('pending', null)}>
              Reopen
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
