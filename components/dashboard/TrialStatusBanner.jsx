'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { AlertTriangle, Clock, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function TrialStatusBanner() {
  const { data: session } = useSession()
  
  if (!session?.user || session.user.plan !== 'trial') return null

  const trialEndsAt = new Date(session.user.trialEndsAt)
  const now = new Date()
  const isExpired = trialEndsAt < now
  
  const diffTime = trialEndsAt - now
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  const totalDays = 7
  const currentDay = Math.max(1, totalDays - Math.floor(diffTime / (1000 * 60 * 60 * 24)))

  if (isExpired) {
    return (
      <div className="bg-red-50 border-b border-red-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-red-800">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-medium">
              Your free trial has expired. Scans are currently disabled.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Warning state (<= 3 days left)
  if (diffDays <= 3) {
    return (
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-amber-800">
            <Clock className="w-5 h-5 shrink-0" />
            <p className="text-sm font-medium">
              Trial ends in {diffDays} {diffDays === 1 ? 'day' : 'days'}.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Normal trial state (> 3 days left)
  return (
    <div className="bg-blue-50 border-b border-blue-100 px-4 py-2">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-blue-800">
          <div className="bg-blue-100 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">Trial</div>
          <p className="text-xs font-medium">
            You're on Day {currentDay} of your 7-day free trial.
          </p>
        </div>
        <Link href="/dashboard/billing">
          <Button size="xs" variant="ghost" className="text-blue-700 hover:bg-blue-100 text-xs py-1 h-7">
            View Plans & Upgrade
          </Button>
        </Link>
      </div>
    </div>
  )
}
