'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Search, MapPin, Loader2, ArrowRight, ShieldCheck, Star } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

export default function AuditListPage() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
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

    fetchProjects()
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
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Business Audit Reports</h1>
          <p className="text-slate-500 font-semibold mt-1">Select a business to view its full optimization audit</p>
        </div>
      </div>

      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
        <Input
          placeholder="Search businesses..."
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
              {searchQuery ? 'Try a different search term' : 'Create a project first to generate an audit report'}
            </p>
            {!searchQuery && (
              <Button asChild className="bg-blue-600 hover:bg-blue-700 font-bold rounded-xl px-6">
                <Link href="/dashboard/projects/new">
                  Create Project
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => (
            <Card key={project.id} className="group hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 border-slate-200 rounded-2xl overflow-hidden flex flex-col bg-white">
              <CardHeader className="pb-4 pt-6 px-6">
                <div className="flex justify-between items-start mb-2">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                        <ShieldCheck className="w-5 h-5 text-blue-600 group-hover:text-white transition-colors" />
                    </div>
                    {project.rating && (
                        <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                            <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                            <span className="text-xs font-black text-slate-700">{project.rating || '4.5'}</span>
                        </div>
                    )}
                </div>
                <CardTitle className="text-xl font-black text-slate-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
                  {project.businessName}
                </CardTitle>
                <div className="flex items-start gap-1.5 mt-2 text-slate-500 font-semibold text-xs leading-relaxed line-clamp-2 min-h-[2.5rem]">
                  <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-slate-300" />
                  {project.address || 'No address provided'}
                </div>
              </CardHeader>
              
              <CardContent className="px-6 pb-6 pt-0 flex-1 flex flex-col justify-end">
                <Button asChild className="w-full font-black rounded-xl h-11 transform transition-all active:scale-95 shadow-sm" variant="outline">
                  <Link href={`/dashboard/audit/${project.id}`}>
                    View Audit Report <ArrowRight className="w-4 h-4 ml-2" />
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
