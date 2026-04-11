'use client'

import { cn } from '@/lib/utils'
import { formatDistanceToNow, format } from 'date-fns'
import {
  Globe, MapPin, BookOpen, Star, FileText, BarChart3
} from 'lucide-react'

const TYPE_CONFIG = {
  website: { icon: Globe, color: 'bg-blue-100 text-blue-600', label: 'Website' },
  gbp: { icon: MapPin, color: 'bg-emerald-100 text-emerald-600', label: 'GBP' },
  citation: { icon: FileText, color: 'bg-orange-100 text-orange-600', label: 'Citation' },
  content: { icon: BookOpen, color: 'bg-purple-100 text-purple-600', label: 'Content' },
  review: { icon: Star, color: 'bg-amber-100 text-amber-600', label: 'Review' },
  ranking: { icon: BarChart3, color: 'bg-sky-100 text-sky-600', label: 'Ranking' },
}

export function ChangeTimeline({ logs = [] }) {
  if (logs.length === 0) {
    return (
      <div className="text-center py-16 text-slate-400">
        <BarChart3 className="w-10 h-10 mx-auto mb-3 text-slate-200" />
        <p className="font-medium">No changes logged yet</p>
        <p className="text-sm mt-1">Use the "Log Change" button to track SEO experiments</p>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-[23px] top-0 bottom-0 w-0.5 bg-slate-100" />

      <div className="space-y-6">
        {logs.map((log, idx) => {
          const cfg = TYPE_CONFIG[log.type] || TYPE_CONFIG.website
          const Icon = cfg.icon

          return (
            <div key={log.id} className="relative flex gap-4">
              {/* Dot */}
              <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center shrink-0 z-10 border-2 border-white shadow-sm', cfg.color)}>
                <Icon className="w-5 h-5" />
              </div>

              {/* Content */}
              <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="font-bold text-slate-900 text-sm">{log.title}</p>
                  <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0', cfg.color)}>
                    {cfg.label}
                  </span>
                </div>
                {log.description && <p className="text-xs text-slate-500 mb-2">{log.description}</p>}

                {(log.beforeValue || log.afterValue) && (
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {log.beforeValue && (
                      <div className="bg-red-50 border border-red-100 rounded-lg p-2">
                        <p className="text-[9px] font-bold text-red-400 uppercase mb-1">Before</p>
                        <p className="text-xs text-slate-700">{log.beforeValue}</p>
                      </div>
                    )}
                    {log.afterValue && (
                      <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-2">
                        <p className="text-[9px] font-bold text-emerald-500 uppercase mb-1">After</p>
                        <p className="text-xs text-slate-700">{log.afterValue}</p>
                      </div>
                    )}
                  </div>
                )}

                {log.pageUrl && (
                  <p className="text-[10px] text-slate-400 mt-2 truncate">📄 {log.pageUrl}</p>
                )}

                <p className="text-[10px] text-slate-400 mt-2">
                  {format(new Date(log.happenedAt), 'MMM d, yyyy')} · {formatDistanceToNow(new Date(log.happenedAt), { addSuffix: true })}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
