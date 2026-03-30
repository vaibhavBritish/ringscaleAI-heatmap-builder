import { CheckCircle2, AlertCircle, Info } from 'lucide-react'

export default function AuditResultsCards({ auditResults }) {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'Pass':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />
      case 'Warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />
      case 'Action Required':
        return <AlertCircle className="w-5 h-5 text-red-500" />
      default:
        return <Info className="w-5 h-5 text-slate-400" />
    }
  }

  const getBadgeStyle = (status) => {
    switch (status) {
      case 'Pass':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'Warning':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'Action Required':
        return 'bg-red-100 text-red-700 border-red-200'
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200'
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {auditResults.map((result, index) => (
        <div 
          key={index} 
          className="bg-white border border-slate-100 p-6 rounded-[1.5rem] hover:border-blue-100 transition-all shadow-sm flex flex-col justify-between min-h-[160px]"
        >
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-xl font-black text-slate-800 leading-tight">{result.title}</h3>
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${getBadgeStyle(result.status)}`}>
              {getStatusIcon(result.status)}
              {result.status}
            </div>
          </div>
          
          <p className="text-slate-500 font-bold mb-6 text-sm leading-relaxed opacity-70">
            {result.description}
          </p>
          
          <div className="text-4xl font-black text-slate-900 tracking-tight">
            {result.value}
          </div>
        </div>
      ))}
    </div>
  )
}
