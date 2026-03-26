'use client'

export default function PlanTimer({ expiryDate, planName }) {
  if (!expiryDate) return null

  const date = new Date(expiryDate)
  const isExpired = date < new Date()
  
  const formattedDate = date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })

  return (
    <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm transition-all hover:bg-slate-50">
      <div className="flex items-center gap-2 mb-1.5">
        <div className={`w-2 h-2 rounded-full ${isExpired ? 'bg-rose-500' : 'bg-emerald-500 animate-pulse'}`} />
        <p className="font-black text-slate-800 text-[10px] uppercase tracking-widest">{planName || 'Active Plan'}</p>
      </div>
      <div className="flex flex-col">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Valid until</span>
        <p className={`text-lg font-black tracking-tight ${isExpired ? 'text-rose-600' : 'text-blue-600'}`}>
          {formattedDate}
        </p>
      </div>
    </div>
  )
}
