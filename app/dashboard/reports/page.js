'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Download, Clock, MapPin, Loader2, ArrowRight } from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'

export default function ReportsPage() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await fetch('/api/reports')
        if (!res.ok) throw new Error('Failed to load reports')
        const data = await res.json()
        setReports(data.reports || [])
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchReports()
  }, [])

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-slate-900">Reports</h1>
        <p className="text-slate-600 mt-1 font-medium">View and analyze all your completed heatmap scans</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200">
          {error}
        </div>
      )}

      {reports.length === 0 ? (
        <Card className="border-slate-200 bg-slate-50 shadow-sm">
          <CardContent className="py-16 text-center">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-200 shadow-sm">
              <FileText className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">No reports generated yet</h3>
            <p className="text-slate-500 mb-6 max-w-sm mx-auto">
              Complete a heatmap scan for any of your project keywords and it will appear here.
            </p>
            <Button asChild className="bg-blue-600 hover:bg-blue-700 font-bold rounded-xl px-6">
              <Link href="/dashboard/projects">
                Go to Projects
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {reports.map((report) => (
            <Card key={report.id} className="hover:border-blue-300 transition-all hover:shadow-md flex flex-col group">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
                    {formatDistanceToNow(new Date(report.completedAt), { addSuffix: true })}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-blue-600" />
                  </div>
                </div>
                <CardTitle className="text-xl font-bold text-slate-900 line-clamp-1" title={report.keyword}>
                  "{report.keyword}"
                </CardTitle>
                <CardDescription className="font-semibold text-blue-600 line-clamp-1 flex items-center gap-1.5" title={report.projectName}>
                  <FileText className="w-3.5 h-3.5" /> {report.projectName}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pt-0 flex-1 flex flex-col justify-end">
                <div className="bg-slate-50 rounded-xl p-4 mb-4 grid grid-cols-2 gap-3 border border-slate-100 text-sm">
                  <div>
                    <p className="text-slate-500 text-xs font-semibold mb-0.5">Grid Density</p>
                    <p className="font-bold text-slate-900">{report.totalPoints} points</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs font-semibold mb-0.5">Coverage</p>
                    <p className="font-bold text-slate-900">{(report.searchRadiusMeters / 1000).toFixed(1)} km</p>
                  </div>
                </div>

                <Button asChild className="w-full font-bold group-hover:bg-blue-600 group-hover:text-white transition-colors" variant="outline">
                  <Link href={`/dashboard/scans/${report.id}`}>
                    View Full Report <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
