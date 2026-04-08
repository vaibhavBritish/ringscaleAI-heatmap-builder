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
  Package
} from "lucide-react"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
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
  const [stats, setStats] = useState(null)
  const [planStats, setPlanStats] = useState([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    async function fetchStats() {
      try {
        const res = await fetch('/api/admin/stats')
        const data = await res.json()
        setStats(data.stats)
        setPlanStats(data.planStats)
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
      <div className="flex flex-col gap-8 animate-pulse">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 rounded-xl bg-slate-100 dark:bg-slate-900" />
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="h-[400px] rounded-xl bg-slate-100 dark:bg-slate-900" />
          <div className="h-[400px] rounded-xl bg-slate-100 dark:bg-slate-900" />
        </div>
      </div>
    )
  }

  // const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#f43f5e', '#f97316']

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-1">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">
            Platform Overview
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">
            Real-time statistics and performance metrics across the entire platform.
          </p>
        </div>
        <div className="flex items-center gap-3 self-start sm:self-center bg-white/50 backdrop-blur-sm border border-slate-200 dark:bg-slate-900/50 dark:border-slate-800 px-4 py-2 rounded-2xl shadow-sm">
           <div className="relative">
             <Activity size={16} className="text-blue-600 animate-pulse" />
             <div className="absolute inset-0 bg-blue-500/20 blur-md rounded-full animate-pulse" />
           </div>
           <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">System Operational</span>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats?.map((stat, index) => (
          <Card key={index} className="group relative overflow-hidden border-none bg-white shadow-md shadow-slate-200/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:bg-slate-900 dark:shadow-none dark:ring-1 dark:ring-slate-800">
            <div className="absolute top-0 right-0 -mr-4 -mt-4 h-24 w-24 rounded-full bg-blue-500/5 transition-transform group-hover:scale-150 dark:bg-blue-500/10" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">
                {stat.title}
              </CardTitle>
              <div className={cn(
                "rounded-xl p-2.5 transition-colors duration-300",
                stat.title === "Total Users" ? "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400" : 
                stat.title === "Active Projects" ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400" : 
                stat.title === "Total Scans" ? "bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-400" : 
                "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400"
              )}>
                {stat.title === "Total Users" ? <Users size={18} /> : 
                 stat.title === "Active Projects" ? <Layers size={18} /> : 
                 stat.title === "Total Scans" ? <Zap size={18} /> : <TrendingUp size={18} />}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                {stat.value.toLocaleString()}
              </div>
              {stat.change !== null && (
                <div className="mt-2 flex items-center gap-1.5">
                  <div className="flex items-center text-[11px] font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10 px-2 py-0.5 rounded-full">
                    <ArrowUpRight className="h-3 w-3 mr-0.5" />
                    {stat.change}%
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                    {stat.period}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-1">
        <Card className="border-none bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
          <CardHeader className="flex flex-row items-center">
            <div className="grid gap-1">
              <CardTitle className="text-lg">Growth Analysis</CardTitle>
              <CardDescription>User registrations by plan type.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="w-full min-w-0">
              {mounted && (
                <ResponsiveContainer width="100%" height={400} minWidth={0}>
                  <BarChart data={planStats}>
                    <XAxis 
                      dataKey="name" 
                      stroke="#888888" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                      className="capitalize"
                    />
                    <YAxis
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${value}`}
                    />
                    <Tooltip 
                      cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }} 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
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
        <Card className="border-none bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
          <CardHeader>
            <CardTitle>Plan Distribution</CardTitle>
            <CardDescription>Breakdown of users by their current subscription tier.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {planStats.map((plan, i) => {
                const pct = Math.round((plan.count / (stats?.[0]?.value || 1)) * 100)
                return (
                  <div
                    key={`plan-${plan.name}-${i}`}
                    className="flex flex-col gap-3 p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold capitalize text-slate-800 dark:text-slate-100">{plan.name}</span>
                      <span className="text-sm font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded-full">{plan.count}</span>
                    </div>
                    <Progress value={pct} className="h-2" />
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Active · {pct}%</p>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>

  )
}
