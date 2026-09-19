"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { 
  Users, 
  Layers, 
  Zap, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight,
  MoreVertical,
  Activity,
  Package,
  Briefcase,
  Target,
  BadgeDollarSign,
  Wallet
} from "lucide-react"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { 
  Bar, 
  BarChart, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  Tooltip,
  Cell
} from "recharts"

export default function AdminOverview() {
  const [stats, setStats] = useState([])
  const [planStats, setPlanStats] = useState([])
  const [userRole, setUserRole] = useState(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    async function fetchStats() {
      try {
        const res = await fetch('/api/admin/stats')
        const data = await res.json()
        if (res.ok) {
          setStats(data.stats || [])
          setPlanStats(data.planStats || [])
          setUserRole(data.role || 'user')
        } else {
          console.error("API error:", data.error)
          setStats([])
          setPlanStats([])
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  const COLORS = ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe']

  if (loading) {
    return (
      <div className="flex flex-col gap-8 animate-pulse p-4">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 rounded-2xl bg-slate-100 dark:bg-slate-900" />
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="h-[400px] rounded-2xl bg-slate-100 dark:bg-slate-900" />
          <div className="h-[400px] rounded-2xl bg-slate-100 dark:bg-slate-900" />
        </div>
      </div>
    )
  }

  const isStaff = userRole === 'staff'

  // Dynamic icon mapper based on stat title
  const getIcon = (title) => {
    switch (title) {
      case "Total Users": return <Users size={20} />
      case "Active Projects": return <Layers size={20} />
      case "Total Scans": return <Zap size={20} />
      case "Allocated Credits": return <TrendingUp size={20} />
      case "Total Leads": return <Target size={20} />
      case "Converted Clients": return <Briefcase size={20} />
      case "Total Revenue": return <BadgeDollarSign size={20} />
      case "Pending Collections": return <Wallet size={20} />
      default: return <Activity size={20} />
    }
  }

  const getColorClass = (index) => {
    const classes = [
      "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
      "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400",
      "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
      "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
      "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400"
    ]
    return classes[index % classes.length]
  }

  return (
    <div className="flex flex-col gap-10">
      
      {/* Header Section */}
      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between px-2">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 rounded-full bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800/50">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">
              Live Overview
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-white dark:via-slate-200 dark:to-white">
            {isStaff ? "Sales Dashboard" : "Platform Overview"}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium max-w-xl">
            {isStaff 
              ? "Track your sales pipeline, conversions, and revenue collections in real-time."
              : "Real-time statistics and performance metrics across the entire platform."}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats?.map((stat, index) => (
          <Card key={index} className="group relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white/50 backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-500/10 dark:border-slate-800/60 dark:bg-slate-950/50">
            
            {/* Background Glow */}
            <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-blue-500/5 blur-2xl transition-transform duration-500 group-hover:scale-150 group-hover:bg-blue-500/10" />
            
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">
                {stat.title}
              </CardTitle>
              <div className={cn(
                "rounded-xl p-2.5 transition-all duration-300 shadow-sm",
                getColorClass(index)
              )}>
                {getIcon(stat.title)}
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {stat.value.toLocaleString()}
              </div>
              {stat.change !== null && (
                <div className="mt-3 flex items-center gap-2">
                  <div className={cn(
                    "flex items-center text-[11px] font-bold px-2 py-0.5 rounded-md",
                    stat.change >= 0 
                      ? "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-500/10"
                      : "text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-500/10"
                  )}>
                    {stat.change >= 0 ? <ArrowUpRight className="h-3 w-3 mr-0.5" /> : <ArrowDownRight className="h-3 w-3 mr-0.5" />}
                    {Math.abs(stat.change)} {stat.title === "Total Leads" ? "new" : "%"}
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                    {stat.period || "this week"}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Admin Charts (Hidden for Staff) */}
      {!isStaff && planStats.length > 0 && (
        <>
          <div className="grid gap-6 md:grid-cols-1">
            <Card className="rounded-2xl border border-slate-200/60 bg-white/50 backdrop-blur-xl shadow-sm dark:border-slate-800/60 dark:bg-slate-950/50">
              <CardHeader className="flex flex-row items-center">
                <div className="grid gap-1">
                  <CardTitle className="text-lg font-bold">Growth Analysis</CardTitle>
                  <CardDescription>User registrations mapped by plan type.</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pl-2">
                <div className="w-full min-w-0">
                  {mounted && (
                    <ResponsiveContainer width="100%" height={400} minWidth={0}>
                      <BarChart data={planStats}>
                        <XAxis 
                          dataKey="name" 
                          stroke="#94a3b8" 
                          fontSize={12} 
                          tickLine={false} 
                          axisLine={false} 
                          className="capitalize font-medium"
                        />
                        <YAxis
                          stroke="#94a3b8"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(value) => `${value}`}
                        />
                        <Tooltip 
                          cursor={{ fill: 'rgba(0, 0, 0, 0.04)' }} 
                          contentStyle={{ 
                            borderRadius: '12px', 
                            border: '1px solid rgba(0,0,0,0.05)', 
                            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                            backgroundColor: 'rgba(255,255,255,0.95)',
                            backdropFilter: 'blur(8px)'
                          }}
                        />
                        <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                          {planStats.map((entry, index) => (
                            <Cell key={`bar-cell-${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-1">
            <Card className="rounded-2xl border border-slate-200/60 bg-white/50 backdrop-blur-xl shadow-sm dark:border-slate-800/60 dark:bg-slate-950/50">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Plan Distribution</CardTitle>
                <CardDescription>Breakdown of active users by their current subscription tier.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {planStats.map((plan, i) => {
                    const pct = Math.round((plan.count / (stats?.[0]?.value || 1)) * 100)
                    return (
                      <div
                        key={`plan-${plan.name}-${i}`}
                        className="group flex flex-col gap-3 p-5 rounded-2xl border border-slate-200/50 bg-white shadow-sm transition-all hover:shadow-md dark:border-slate-800/50 dark:bg-slate-900/50"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold capitalize text-slate-800 dark:text-slate-100">{plan.name}</span>
                          <span className="text-sm font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2.5 py-1 rounded-full">{plan.count}</span>
                        </div>
                        <Progress value={pct} className="h-2 bg-slate-100 dark:bg-slate-800" indicatorClassName="bg-blue-600 dark:bg-blue-500" />
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active · {pct}%</p>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Staff Placeholder / Empty State for Charts Area */}
      {isStaff && (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/20">
          <div className="h-12 w-12 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 flex items-center justify-center mb-4">
            <Briefcase className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Sales Pipeline Active</h3>
          <p className="text-sm text-slate-500 max-w-sm mt-2">
            View the CRM tab to dive deeper into your active leads, manage clients, and update transaction statuses.
          </p>
        </div>
      )}

    </div>
  )
}
