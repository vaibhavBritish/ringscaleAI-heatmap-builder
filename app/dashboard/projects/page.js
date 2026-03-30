'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Plus, Search, MapPin, Calendar, Tag, Trash2, ExternalLink, MoreVertical, ShieldCheck, BarChart3 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'
import { useSession } from 'next-auth/react'
import PlanExpiredModal from '@/components/dashboard/PlanExpiredModal'

export default function ProjectsPage() {
  const { data: session } = useSession()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteProject, setDeleteProject] = useState(null)
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false)

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects')
      if (response.ok) {
        const data = await response.json()
        setProjects(data.projects || [])
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
      toast.error('Failed to load projects')
    } finally {
      setLoading(false)
    }
  }

  const handleNewProject = (e) => {
    const expiryDate = session?.user?.planEndsAt || session?.user?.trialEndsAt
    const isExpired = (expiryDate && new Date(expiryDate) < new Date()) || (session?.user?.credits <= 0)
    
    if (isExpired) {
      e.preventDefault()
      setIsPlanModalOpen(true)
    }
  }

  const handleDelete = async () => {
    if (!deleteProject) return

    try {
      const response = await fetch(`/api/projects/${deleteProject.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Project deleted')
        setProjects(projects.filter(p => p.id !== deleteProject.id))
      } else {
        toast.error('Failed to delete project')
      }
    } catch (error) {
      toast.error('An error occurred')
    } finally {
      setDeleteProject(null)
    }
  }

  const filteredProjects = projects.filter(project =>
    project.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.address?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-blue-100 text-blue-700'
      case 'processing': return 'bg-indigo-100 text-indigo-700'
      case 'queued': return 'bg-yellow-100 text-yellow-700'
      case 'failed': return 'bg-red-100 text-red-700'
      default: return 'bg-slate-100 text-slate-700'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Projects</h1>
          <p className="text-sm md:text-base text-slate-500 font-medium">Manage your tracked businesses and organic visibility</p>
        </div>
        <Link href="/dashboard/projects/new" onClick={handleNewProject} className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 h-11 px-6 rounded-xl font-bold shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-2">
            <Plus className="w-5 h-5" />
            New Project
          </Button>
        </Link>
      </div>

      <PlanExpiredModal 
        isOpen={isPlanModalOpen} 
        onClose={() => setIsPlanModalOpen(false)} 
      />

      {/* Search */}
      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
        <Input
          placeholder="Search by business name or address..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-11 h-12 bg-white border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium"
        />
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredProjects.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <Card key={project.id} className="group hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 border-slate-200 rounded-2xl overflow-hidden flex flex-col">
              <CardHeader className="pb-4 pt-6 px-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg font-bold text-slate-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
                      {project.businessName}
                    </CardTitle>
                    <div className="flex items-start gap-1.5 mt-2 text-slate-500 group-hover:text-slate-600 min-h-[32px]">
                      <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-blue-500" />
                      <p className="text-[11px] font-bold leading-relaxed line-clamp-2 opacity-80 uppercase tracking-tight">
                        {project.address || 'No address provided'}
                      </p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-slate-100 shrink-0">
                        <MoreVertical className="w-4 h-4 text-slate-400" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/projects/${project.id}`}>
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/audit/${project.id}`}>
                          <ShieldCheck className="w-4 h-4 mr-2" />
                          Business Audit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-red-600 focus:text-red-600 focus:bg-red-50"
                        onClick={() => setDeleteProject(project)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              
              <CardContent className="px-6 pb-6 pt-0 flex-1 flex flex-col justify-between space-y-5">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold text-slate-500">
                    <div className="flex items-center gap-1.5 py-1 px-2 bg-slate-100 rounded-md">
                      <Tag className="w-3.5 h-3.5" />
                      {project.keywordCount || 0} keywords
                    </div>
                    {project.latestScanDate && (
                      <div className="flex items-center gap-1.5 py-1 px-2 bg-slate-100 rounded-md">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDistanceToNow(new Date(project.latestScanDate), { addSuffix: true })}
                      </div>
                    )}
                  </div>

                  {project.latestScanStatus && (
                    <div className="flex items-center">
                      <Badge className={`${getStatusColor(project.latestScanStatus)} border-0 font-bold px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider`}>
                        {project.latestScanStatus}
                      </Badge>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <Link href={`/dashboard/projects/${project.id}`} className="flex-1">
                    <Button className="w-full bg-slate-50 hover:bg-blue-600 text-slate-700 hover:text-white border border-slate-200 hover:border-blue-600 rounded-xl font-bold h-11 transition-all">
                      Open Project
                    </Button>
                  </Link>
                  <Link href={`/dashboard/audit/${project.id}`}>
                    <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl border-slate-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm" title="View Audit Report">
                      <ShieldCheck className="w-5 h-5" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <MapPin className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              {searchQuery ? 'No matching projects' : 'No projects yet'}
            </h3>
            <p className="text-slate-500 mb-6">
              {searchQuery 
                ? 'Try a different search term'
                : 'Create your first project to start tracking rankings'
              }
            </p>
            {!searchQuery && (
              <Link href="/dashboard/projects/new" onClick={handleNewProject}>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Project
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteProject} onOpenChange={() => setDeleteProject(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteProject?.businessName}"? 
              This will also delete all associated keywords, scans, and reports.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
