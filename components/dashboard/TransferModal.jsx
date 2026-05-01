"use client"

import { useState } from "react"
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
import { Loader2, Shield, ArrowRight } from "lucide-react"

export function TransferModal({ isOpen, onClose, client, onRefresh }) {
  const [loading, setLoading] = useState(false)
  const [amount, setAmount] = useState(100)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch("/api/partner/credits/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: client.id,
          amount: amount,
        }),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || "Something went wrong")

      toast.success(`${amount} credits transferred to ${client.name}`)
      onRefresh()
      onClose()
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  if (!client) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px] rounded-3xl border-none shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-black">
            <Shield className="w-6 h-6 text-emerald-600" />
            Transfer Credits
          </DialogTitle>
          <DialogDescription className="font-medium text-slate-500">
            Allocate scanning credits to <strong>{client.name}</strong>.
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
                <p className="text-[10px] font-black uppercase text-emerald-500 tracking-widest mb-1">After</p>
                <p className="text-xl font-bold text-emerald-600">{parseInt(client.credits) + (parseInt(amount) || 0)}</p>
             </div>
          </div>

          <div className="grid gap-3">
            <Label htmlFor="amount" className="font-bold text-slate-700">Amount to Transfer</Label>
            <div className="relative">
              <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                id="amount"
                type="number"
                min="1"
                placeholder="100"
                className="pl-10 h-12 rounded-xl border-slate-200 focus:ring-emerald-500 text-lg font-bold"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <p className="text-[11px] text-slate-400 font-medium">This amount will be deducted from your agency balance instantly.</p>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose} disabled={loading} className="rounded-xl font-bold">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12 px-8 rounded-xl shadow-lg shadow-emerald-200 min-w-[140px]">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Transfer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
