"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Loader2, Shield, ArrowRight, Undo2 } from "lucide-react"

// mode 'add' moves credits from the agency pool to the client, 'reclaim' returns them to the pool
export function TransferModal({ isOpen, onClose, client, onRefresh, mode = "add", poolCredits = null }) {
  const [loading, setLoading] = useState(false)
  const [amount, setAmount] = useState(100)
  const isReclaim = mode === "reclaim"

  useEffect(() => {
    if (isOpen && client) {
      setAmount(isReclaim ? Math.max(0, client.credits || 0) : 100)
    }
  }, [isOpen, client, isReclaim])

  const parsedAmount = parseInt(amount) || 0
  const maxAmount = isReclaim ? Math.max(0, client?.credits || 0) : poolCredits
  const overLimit = maxAmount !== null && parsedAmount > maxAmount
  const clientName = client?.name || client?.email

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch("/api/partner/credits/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: client.id,
          amount: parsedAmount,
          direction: mode,
        }),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || "Something went wrong")

      toast.success(isReclaim
        ? `${parsedAmount} credits returned to your pool from ${clientName}`
        : `${parsedAmount} credits transferred to ${clientName}`)
      onRefresh()
      onClose()
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  if (!client) return null

  const after = isReclaim ? (client.credits || 0) - parsedAmount : (client.credits || 0) + parsedAmount

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px] rounded-3xl border-none shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-black">
            {isReclaim ? <Undo2 className="w-6 h-6 text-amber-600" /> : <Shield className="w-6 h-6 text-emerald-600" />}
            {isReclaim ? "Reclaim Credits" : "Add Credits"}
          </DialogTitle>
          <DialogDescription className="font-medium text-slate-500">
            {isReclaim
              ? <>Return unused credits from <strong>{clientName}</strong> to your agency pool.</>
              : <>Allocate credits from your agency pool to <strong>{clientName}</strong>.</>}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="flex items-center justify-center gap-4 py-4 bg-slate-50 rounded-2xl border border-slate-100">
             <div className="text-center">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Current</p>
                <p className="text-xl font-bold text-slate-900">{client.credits}</p>
             </div>
             <ArrowRight className="text-slate-300" />
             <div className="text-center">
                <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isReclaim ? 'text-amber-500' : 'text-emerald-500'}`}>After</p>
                <p className={`text-xl font-bold ${isReclaim ? 'text-amber-600' : 'text-emerald-600'}`}>{after}</p>
             </div>
          </div>

          <div className="grid gap-3">
            <Label htmlFor="amount" className="font-bold text-slate-700">
              {isReclaim ? "Amount to Reclaim" : "Amount to Transfer"}
            </Label>
            <div className="relative">
              <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                id="amount"
                type="number"
                min="1"
                max={maxAmount ?? undefined}
                placeholder="100"
                className="pl-10 h-12 rounded-xl border-slate-200 focus:ring-emerald-500 text-lg font-bold"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <p className={`text-[11px] font-medium ${overLimit ? 'text-rose-500' : 'text-slate-400'}`}>
              {isReclaim
                ? `The client has ${client.credits} credits available to reclaim.`
                : poolCredits !== null
                  ? `${poolCredits.toLocaleString()} credits available in your agency pool.`
                  : 'This amount will be deducted from your agency balance instantly.'}
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose} disabled={loading} className="rounded-xl font-bold">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || parsedAmount <= 0 || overLimit}
              className={`text-white font-bold h-12 px-8 rounded-xl min-w-[140px] ${isReclaim ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200'}`}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : isReclaim ? "Reclaim Credits" : "Confirm Transfer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
