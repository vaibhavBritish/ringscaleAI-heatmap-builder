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

export default function TrialExpiredModal({ isOpen, onClose }) {
  const router = useRouter()

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <ShieldAlert className="w-6 h-6 text-red-600" />
          </div>
          <DialogTitle className="text-xl">Trial Expired</DialogTitle>
          <DialogDescription className="text-slate-600 pt-2 text-base">
            Your free trial has ended. To continue creating projects and performing rank scans, please choose a plan.
          </DialogDescription>
        </DialogHeader>
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 my-2">
          <h4 className="text-sm font-semibold text-blue-900 mb-1">Upgrade Benefits:</h4>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>• Unlimited Projects</li>
            <li>• Higher Daily Scan Limits</li>
            <li>• Historical Data Retained</li>
            <li>• Priority Support</li>
          </ul>
        </div>
        <DialogFooter className="sm:justify-start gap-2 pt-4">
          <Button
            type="button"
            className="flex-1 bg-blue-600 hover:bg-blue-700"
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
            className="flex-1 text-slate-500"
            onClick={onClose}
          >
            Maybe Later
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
