"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { 
  CalendarClock,
  RefreshCw,
  XCircle,
  CreditCard,
  Search,
  Mail
} from "lucide-react"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

export default function PaymentsOverview() {
  const [data, setData] = useState({
    upcoming: [],
    upcomingCount: 0,
    renewed: [],
    renewedCount: 0,
    cancelled: [],
    cancelledCount: 0
  })
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/admin/payments-overview')
        const json = await res.json()
        setData(json)
      } catch (error) {
        console.error("Failed to fetch payments overview:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col gap-8 animate-pulse">
        <div className="grid gap-6 md:grid-cols-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 rounded-xl bg-slate-100 dark:bg-slate-900" />
          ))}
        </div>
        <div className="h-[600px] rounded-xl bg-slate-100 dark:bg-slate-900" />
      </div>
    )
  }

  const renderTable = (users) => {
    const filteredUsers = users.filter(u => 
      u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
      <div className="rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-200 dark:border-slate-800">
              <TableHead>User</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Expiration Date</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-slate-500">
                  No results found.
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => {
                const planName = user.plan === 'plan_lite' ? 'Advance' : user.plan === 'plan_pro' ? 'Pro' : user.plan
                
                return (
                  <TableRow key={user.id} className="border-slate-200 dark:border-slate-800">
                    <TableCell>
                      <div className="font-medium text-slate-900 dark:text-slate-100">{user.name || 'Unknown'}</div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">{user.email}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {planName}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(user.planEndsAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <a href={`mailto:${user.email}`} className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-slate-200 bg-transparent hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:hover:bg-slate-800 dark:hover:text-slate-50 h-8 px-3">
                        <Mail className="mr-2 h-4 w-4" />
                        Contact
                      </a>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-10 pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-1">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">
            Payments & Renewals
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">
            Track upcoming renewals, recent payments, and cancelled subscriptions.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="group relative overflow-hidden border-none bg-white shadow-md shadow-slate-200/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:bg-slate-900 dark:shadow-none dark:ring-1 dark:ring-slate-800">
          <div className="absolute top-0 right-0 -mr-4 -mt-4 h-24 w-24 rounded-full bg-blue-500/5 transition-transform group-hover:scale-150 dark:bg-blue-500/10" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">
              Upcoming Renewals
            </CardTitle>
            <div className="bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 rounded-xl p-2.5">
              <CalendarClock size={18} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              {data.upcomingCount}
            </div>
            <p className="mt-2 text-[10px] font-bold text-slate-400 uppercase tracking-tight">
              Due in next 30 days
            </p>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden border-none bg-white shadow-md shadow-slate-200/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:bg-slate-900 dark:shadow-none dark:ring-1 dark:ring-slate-800">
          <div className="absolute top-0 right-0 -mr-4 -mt-4 h-24 w-24 rounded-full bg-green-500/5 transition-transform group-hover:scale-150 dark:bg-green-500/10" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">
              Renewed Subscriptions
            </CardTitle>
            <div className="bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400 rounded-xl p-2.5">
              <RefreshCw size={18} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              {data.renewedCount}
            </div>
            <p className="mt-2 text-[10px] font-bold text-slate-400 uppercase tracking-tight">
              Multiple successful payments
            </p>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden border-none bg-white shadow-md shadow-slate-200/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:bg-slate-900 dark:shadow-none dark:ring-1 dark:ring-slate-800">
          <div className="absolute top-0 right-0 -mr-4 -mt-4 h-24 w-24 rounded-full bg-red-500/5 transition-transform group-hover:scale-150 dark:bg-red-500/10" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">
              Expired / Cancelled
            </CardTitle>
            <div className="bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 rounded-xl p-2.5">
              <XCircle size={18} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              {data.cancelledCount}
            </div>
            <p className="mt-2 text-[10px] font-bold text-slate-400 uppercase tracking-tight">
              Passed expiration date
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Detailed Overview</CardTitle>
              <CardDescription>View all user subscriptions by status.</CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
              <Input
                type="search"
                placeholder="Search by name or email..."
                className="pl-9 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="upcoming" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8 bg-slate-100 dark:bg-slate-950 h-auto p-1 rounded-xl border border-slate-200 dark:border-slate-800">
              <TabsTrigger 
                value="upcoming" 
                className="py-3 data-[state=active]:bg-white data-[state=active]:text-blue-600 dark:data-[state=active]:bg-slate-900 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-sm rounded-lg"
              >
                Upcoming ({data.upcomingCount})
              </TabsTrigger>
              <TabsTrigger 
                value="renewed"
                className="py-3 data-[state=active]:bg-white data-[state=active]:text-green-600 dark:data-[state=active]:bg-slate-900 dark:data-[state=active]:text-green-400 data-[state=active]:shadow-sm rounded-lg"
              >
                Renewed ({data.renewedCount})
              </TabsTrigger>
              <TabsTrigger 
                value="cancelled"
                className="py-3 data-[state=active]:bg-white data-[state=active]:text-red-600 dark:data-[state=active]:bg-slate-900 dark:data-[state=active]:text-red-400 data-[state=active]:shadow-sm rounded-lg"
              >
                Expired / Cancelled ({data.cancelledCount})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="upcoming" className="m-0 focus-visible:outline-none focus-visible:ring-0">
              {renderTable(data.upcoming)}
            </TabsContent>
            
            <TabsContent value="renewed" className="m-0 focus-visible:outline-none focus-visible:ring-0">
              {renderTable(data.renewed)}
            </TabsContent>
            
            <TabsContent value="cancelled" className="m-0 focus-visible:outline-none focus-visible:ring-0">
              {renderTable(data.cancelled)}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
