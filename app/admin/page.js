"use client"

import { useEffect, useState } from "react"
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

  useEffect(() => {
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
    <div className="flex flex-col gap-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Overview</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Platform-wide statistics and performance metrics.</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full">
           <Activity size={14} className="text-blue-600" />
           System Online
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats?.map((stat, index) => (
          <Card key={index} className="overflow-hidden border-none bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {stat.title}
              </CardTitle>
              <div className="rounded-lg bg-blue-50 p-2 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                {stat.title === "Total Users" ? <Users size={16} /> : 
                 stat.title === "Active Projects" ? <Layers size={16} /> : 
                 stat.title === "Total Scans" ? <Zap size={16} /> : <TrendingUp size={16} />}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stat.value.toLocaleString()}</div>
              {stat.change !== null && (
                <p className="mt-1 flex items-center text-xs text-green-600 dark:text-green-400">
                  <ArrowUpRight className="mr-1 h-3 w-3" />
                  +{stat.change} {stat.period}
                </p>
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
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
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
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
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
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {planStats.map((plan, i) => (
                <div key={plan.name} className="flex flex-col gap-2 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-bold capitalize text-slate-900 dark:text-slate-100">{plan.name}</span>
                    <span className="text-blue-600 font-bold">{plan.count}</span>
                  </div>
                  <Progress 
                    value={(plan.count / (stats?.[0]?.value || 1)) * 100} 
                    className="h-1.5"
                  />
                  <p className="text-[10px] text-slate-500 uppercase font-medium tracking-tight">Active Subscriptions</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>

  )
}
