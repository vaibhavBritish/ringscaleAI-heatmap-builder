'use client'

import { cn } from '@/lib/utils'

const COLOR_MAP = {
  high: { ring: 'stroke-emerald-500', text: 'text-emerald-600', bg: 'from-emerald-500/10 to-emerald-500/5' },
  medium: { ring: 'stroke-amber-500', text: 'text-amber-600', bg: 'from-amber-500/10 to-amber-500/5' },
  low: { ring: 'stroke-red-500', text: 'text-red-600', bg: 'from-red-500/10 to-red-500/5' },
}

function scoreLevel(score) {
  if (score >= 70) return 'high'
  if (score >= 40) return 'medium'
  return 'low'
}

export function SEOScoreCard({ label, score, description, size = 100, className }) {
  const level = scoreLevel(score ?? 0)
  const colors = COLOR_MAP[level]
  const radius = 38
  const circumference = 2 * Math.PI * radius
  const strokeDash = ((score ?? 0) / 100) * circumference

  return (
    <div className={cn(
      'flex flex-col items-center gap-2 p-4 rounded-2xl bg-gradient-to-b border',
      colors.bg,
      'border-slate-100',
      className
    )}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox="0 0 100 100" className="-rotate-90">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="8" />
          <circle
            cx="50" cy="50" r={radius}
            fill="none"
            className={colors.ring}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${strokeDash} ${circumference}`}
            style={{ transition: 'stroke-dasharray 0.8s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn('text-2xl font-black', colors.text)}>{score ?? '—'}</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-sm font-bold text-slate-800">{label}</p>
        {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
      </div>
    </div>
  )
}
