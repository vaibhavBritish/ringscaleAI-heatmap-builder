import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, Clock, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function PlanStatusBanner() {
  const { data: session, update } = useSession()
  const [freshUser, setFreshUser] = useState(null)
  
  // Sync with session
  useEffect(() => {
    if (session?.user) {
      setFreshUser(session.user)
    }
  }, [session])

  const user = freshUser || session?.user
  if (!user) return null

  const userPlan = user.role === 'admin' ? 'pro' : user.plan
  const expiryDate = user.planEndsAt ? new Date(user.planEndsAt) : (user.trialEndsAt ? new Date(user.trialEndsAt) : null)
  const now = new Date()
  
  const isTimeExpired = expiryDate && expiryDate <= now
  const isCreditsExpired = (user.credits || 0) <= 0
  const isExpired = isTimeExpired || isCreditsExpired
  
  if (isExpired) {
    return (
      <div className="bg-rose-50 border-b border-rose-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-rose-800">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-black uppercase tracking-tight">
              {isCreditsExpired ? 'CREDITS EXHAUSTED' : 'PLAN EXPIRED'}: 
              <span className="ml-1 font-medium normal-case">Features are locked. Please upgrade or top up to continue.</span>
            </p>
          </div>
          <Link href="/dashboard/billing">
            <Button size="sm" className="bg-rose-600 hover:bg-rose-700 text-white font-bold h-8">
              Upgrade Now
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  // Normal trial state (Prioritize this for trial users even if < 3 days left)
  const diffTime = expiryDate ? expiryDate - now : 0
  if (userPlan === 'trial' && !isCreditsExpired) {
    const totalTrialDays = 7
    const remainingDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)))
    const currentDay = Math.min(totalTrialDays, Math.max(1, totalTrialDays - remainingDays))
    
    return (
      <div className="bg-blue-50 border-b border-blue-100 px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-blue-800">
            <div className="bg-blue-100 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">Free Trial</div>
            <p className="text-xs font-medium">Day {currentDay} of your {totalTrialDays}-day trial. {user.credits} credits left.</p>
          </div>
          <Link href="/dashboard/billing">
            <Button size="xs" variant="ghost" className="text-blue-700 hover:bg-blue-100 text-xs py-1 h-7 font-bold">
              Upgrade
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  // Warning state for paid plans (<= 3 days left or low credits)
  const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))
  const lowCredits = user.credits > 0 && user.credits <= 100

  if ((expiryDate && diffDays <= 3) || lowCredits) {
    return (
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-amber-800">
            <Clock className="w-5 h-5 shrink-0" />
            <p className="text-sm font-bold">
              {lowCredits ? `Low credits: ${user.credits} remaining.` : `Plan ends in ${diffDays} day(s).`}
            </p>
          </div>
          <Link href="/dashboard/billing">
            <Button size="sm" variant="outline" className="border-amber-300 text-amber-900 hover:bg-amber-100 font-bold h-8">
              Extend Plan
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return null
}
