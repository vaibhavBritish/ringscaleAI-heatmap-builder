'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ShieldAlert, CreditCard } from "lucide-react"
import { useRouter } from "next/navigation"

import { useSession } from "next-auth/react"

export default function PlanExpiredModal({ isOpen, onClose }) {
  const router = useRouter()
  const { data: session } = useSession()

  const isCreditsExpired = (session?.user?.credits || 0) <= 0
  const isTrial = session?.user?.plan === 'trial'

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mb-4">
            <ShieldAlert className="w-6 h-6 text-rose-600" />
          </div>
          <DialogTitle className="text-xl">
            {isCreditsExpired ? 'Credits Exhausted' : (isTrial ? 'Trial Expired' : 'Plan Expired')}
          </DialogTitle>
          <DialogDescription className="text-slate-600 pt-2 text-base">
            {isCreditsExpired 
              ? "No more credits. Please purchase more credits to run the scan." 
              : "Your current plan has ended. Access to premium features like project creation and rank scanning is now locked."}
          </DialogDescription>
        </DialogHeader>
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 my-2">
          <h4 className="text-sm font-semibold text-blue-900 mb-1">Available Benefits:</h4>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>• New Advance Plan: 1200 Credits ($499)</li>
            <li>• New Pro Plan: 2400 Credits ($1299)</li>
            <li>• Full Dashboard Access</li>
            <li>• Global Rank Tracking</li>
          </ul>
        </div>
        <DialogFooter className="sm:justify-start gap-2 pt-4">
          <Button
            type="button"
            className="flex-1 bg-blue-600 hover:bg-blue-700 font-bold"
            onClick={() => {
              onClose()
              router.push('/dashboard/billing')
            }}
          >
            <CreditCard className="w-4 h-4 mr-2" />
            Pick a Plan
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="flex-1 text-slate-500 font-medium"
            onClick={onClose}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
