'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Search, MapPin, Loader2, ArrowRight, ShieldCheck, Star, RefreshCcw, Tag, CheckCircle2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

export default function AuditListPage() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects')
      if (!res.ok) throw new Error('Failed to load projects')
      const data = await res.json()
      setProjects(data.projects || [])
    } catch (err) {
      toast.error('Could not load projects')
    } finally {
      setLoading(false)
    }
  }

  const handleSyncGMB = async () => {
    setIsSyncing(true)
    try {
      const res = await fetch('/api/user/sync-gmb', { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        if (data.synced > 0) {
          toast.success(`Synced ${data.synced} businesses & audit reports!`)
          fetchProjects()
        } else {
          toast.info('All your businesses and audits are already up to date.')
        }
      }
    } catch (e) {
      console.error('Error syncing GMB:', e)
      toast.error('Failed to sync GMB profiles')
    } finally {
      setIsSyncing(false)
    }
  }

  useEffect(() => {
    fetchProjects()
    // Background sync on mount to ensure multi-business profiles are updated
    fetch('/api/user/sync-gmb', { method: 'POST' })
      .then(res => res.json())
      .then(data => {
        if (data.synced > 0) {
          fetchProjects()
        }
      })
      .catch(() => {})
  }, [])

  const filteredProjects = projects.filter(project =>
    project.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.address?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Business Audit Reports</h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700 border border-indigo-200">
              {projects.length} Businesses
            </span>
          </div>
          <p className="text-slate-500 font-semibold mt-1">Select any business to inspect optimization score, local ranking signals, and target keywords</p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleSyncGMB}
          disabled={isSyncing}
          className="rounded-xl border-slate-200 font-bold text-xs h-10 px-4 text-slate-700 hover:text-indigo-600 hover:bg-indigo-50 shadow-sm"
        >
          <RefreshCcw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin text-indigo-600' : ''}`} />
          {isSyncing ? 'Syncing...' : 'Sync All GMB Businesses'}
        </Button>
      </div>

      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
        <Input
          placeholder="Search businesses by name or address..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-11 h-12 bg-white border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium"
        />
      </div>

      {filteredProjects.length === 0 ? (
        <Card className="border-slate-200 bg-slate-50 shadow-sm rounded-2xl">
          <CardContent className="py-16 text-center">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-200 shadow-sm">
              <ShieldCheck className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">No businesses found</h3>
            <p className="text-slate-500 mb-6 max-w-sm mx-auto">
              {searchQuery ? 'Try a different search term' : 'Connect your Google Business Profile to generate audit reports for all your locations'}
            </p>
            <Button onClick={handleSyncGMB} disabled={isSyncing} className="bg-indigo-600 hover:bg-indigo-700 font-bold rounded-xl px-6">
              <RefreshCcw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
              Sync Connected Businesses
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => (
            <Card key={project.id} className="group hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 border-slate-200 rounded-2xl overflow-hidden flex flex-col bg-white">
              <CardHeader className="pb-4 pt-6 px-6">
                <div className="flex justify-between items-start mb-2">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-600 transition-colors">
                    <ShieldCheck className="w-5 h-5 text-indigo-600 group-hover:text-white transition-colors" />
                  </div>
                  
                  <div className="flex items-center gap-1.5">
                    {project.hasAudit && project.auditScore ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        {project.auditScore}% Optimized
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        Audit Ready
                      </span>
                    )}
                  </div>
                </div>

                <CardTitle className="text-xl font-black text-slate-900 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                  {project.businessName}
                </CardTitle>
                <div className="flex items-start gap-1.5 mt-2 text-slate-500 font-semibold text-xs leading-relaxed line-clamp-2 min-h-[2.5rem]">
                  <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-slate-400" />
                  {project.address || 'Address registered on Google profile'}
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                    <Tag className="w-3 h-3 text-indigo-600" />
                    {project.keywordCount > 0 ? `${project.keywordCount} Target Keywords` : 'GMB Keywords Active'}
                  </span>
                </div>
              </CardHeader>
              
              <CardContent className="px-6 pb-6 pt-0 flex-1 flex flex-col justify-end">
                <Button asChild className="w-full font-black rounded-xl h-11 transform transition-all active:scale-95 shadow-sm bg-indigo-600 hover:bg-indigo-700 text-white">
                  <Link href={`/dashboard/audit/${project.id}`}>
                    View Audit Report & Keywords <ArrowRight className="w-4 h-4 ml-2" />
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
