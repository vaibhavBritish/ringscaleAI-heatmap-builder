'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  ArrowLeft, MapPin, Tag, Plus, Trash2, Loader2, Play, Clock, BarChart3, Grid3X3, Settings2, ExternalLink, Check, Users
} from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { formatDistanceToNow, format } from 'date-fns'
import { useSession } from 'next-auth/react'
import PlanExpiredModal from '@/components/dashboard/PlanExpiredModal'

export default function ProjectDetailPage() {
  const params = useParams()
  const projectId = params.id
  
  const [project, setProject] = useState(null)
  const [keywords, setKeywords] = useState([])
  const [scans, setScans] = useState([])
  const [loading, setLoading] = useState(true)
  const [newKeyword, setNewKeyword] = useState('')
  const [addingKeyword, setAddingKeyword] = useState(false)
  const [showScanDialog, setShowScanDialog] = useState(false)
  const [scanConfig, setScanConfig] = useState({
    keywordIds: [],
    gridSize: '3',
    spacingMeters: '1000',
    searchRadiusMeters: '5000'
  })
  const [startingScan, setStartingScan] = useState(false)
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false)
  const [competitors, setCompetitors] = useState([])
  const [loadingCompetitors, setLoadingCompetitors] = useState(false)
  const { data: session } = useSession()

  useEffect(() => {
    fetchProjectData()
  }, [projectId])

  const fetchProjectData = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`)
      if (!response.ok) throw new Error('Failed to load project')
      
      const data = await response.json()
      setProject(data.project)
      setKeywords(data.keywords || [])
      setScans(data.scans || [])
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to load project')
    } finally {
      setLoading(false)
    }
  }

  const fetchCompetitors = async () => {
    if (competitors.length > 0) return
    setLoadingCompetitors(true)
    try {
      const response = await fetch(`/api/projects/${projectId}/competitors`)
      if (!response.ok) throw new Error('Failed to load competitors')
      const data = await response.json()
      setCompetitors(data.competitors || [])
    } catch (error) {
      console.error('Error fetching competitors:', error)
      toast.error('Failed to load competitors')
    } finally {
      setLoadingCompetitors(false)
    }
  }

  const handleAddKeyword = async (e) => {
    e.preventDefault()
    if (!newKeyword.trim()) return
    
    // Check if keyword already exists in the local list
    if (keywords.some(k => k.keyword.toLowerCase() === newKeyword.trim().toLowerCase())) {
      toast.error('Keyword already exists in this project')
      setNewKeyword('')
      return
    }

    setAddingKeyword(true)
    try {
      const response = await fetch(`/api/projects/${projectId}/keywords`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: newKeyword.trim() })
      })

      const data = await response.json()

      if (response.status === 402) {
        toast.error(data.error || 'Not enough credits')
        return
      }

      if (!response.ok) throw new Error(data.error || 'Failed to add keyword')

      setKeywords([data, ...keywords])
      setNewKeyword('')

      if (data.creditsDeducted) {
        toast.success(`Keyword added! -${data.creditsDeducted} credits (${data.creditsRemaining?.toLocaleString()} remaining)`)
        // Refresh session so credits update everywhere
        try { await fetch('/api/auth/session') } catch (e) {}
      } else {
        toast.success('Keyword added')
      }
    } catch (error) {
      toast.error(error.message || 'Failed to add keyword')
    } finally {
      setAddingKeyword(false)
    }
  }

  const handleDeleteKeyword = async (keywordId) => {
    try {
      await fetch(`/api/keywords/${keywordId}`, { method: 'DELETE' })
      setKeywords(keywords.filter(k => k.id !== keywordId))
      toast.success('Keyword deleted')
    } catch (error) {
      toast.error('Failed to delete keyword')
    }
  }

  const handleStartScan = async () => {
    if (scanConfig.keywordIds.length === 0) {
      toast.error('Please select at least one keyword')
      return
    }

    setStartingScan(true)
    try {
      const response = await fetch('/api/scans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          keywordIds: scanConfig.keywordIds,
          gridSize: parseInt(scanConfig.gridSize),
          spacingMeters: parseInt(scanConfig.spacingMeters),
          searchRadiusMeters: parseInt(scanConfig.searchRadiusMeters)
        })
      })

      if (!response.ok) throw new Error('Failed to start scans')

      const result = await response.json()
      
      // If it returned multiple scans
      if (result.scans) {
        setScans([...result.scans, ...scans])
        // Poll status for each new scan
        result.scans.forEach(scan => pollScanStatus(scan.id))
      } else {
        setScans([result, ...scans])
        pollScanStatus(result.id)
      }

      setShowScanDialog(false)
      toast.success(`${result.scans ? result.scans.length : 1} scan(s) started!`)
    } catch (error) {
      toast.error('Failed to start scans')
    } finally {
      setStartingScan(false)
    }
  }

  const handleCancelScan = async (scanId) => {
    try {
      const response = await fetch(`/api/scans/${scanId}/cancel`, { method: 'POST' })
      if (!response.ok) throw new Error('Failed to cancel scan')
      
      setScans(prev => prev.map(s => s.id === scanId ? { ...s, status: 'cancelled' } : s))
      toast.success('Scan cancelled')
    } catch (error) {
      toast.error('Failed to cancel scan')
    }
  }

  const pollScanStatus = async (scanId) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/scans/${scanId}`)
        if (!response.ok) return
        
        const scan = await response.json()
        setScans(prev => prev.map(s => s.id === scanId ? scan : s))
        
        if (scan.status === 'completed' || scan.status === 'failed' || scan.status === 'cancelled') {
          clearInterval(interval)
          if (scan.status === 'completed') {
            toast.success('Scan completed!')
          } else if (scan.status === 'failed') {
            toast.error('Scan failed')
          }
        }
      } catch (error) {
        clearInterval(interval)
      }
    }, 3000)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-blue-100 text-blue-700'
      case 'processing': return 'bg-indigo-100 text-indigo-700'
      case 'queued': return 'bg-yellow-100 text-yellow-700'
      case 'failed': return 'bg-red-100 text-red-700'
      case 'cancelled': return 'bg-slate-100 text-slate-500'
      default: return 'bg-slate-100 text-slate-700'
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Project not found</p>
        <Link href="/dashboard/projects">
          <Button variant="outline" className="mt-4">Back to Projects</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/projects" className="text-slate-400 hover:text-slate-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900">{project.businessName}</h1>
          <p className="text-slate-500 flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            {project.address || 'No address'}
          </p>
        </div>
        <Dialog open={showScanDialog} onOpenChange={(open) => {
          const expiryDate = session?.user?.planEndsAt || session?.user?.trialEndsAt
          const isExpired = (expiryDate && new Date(expiryDate) < new Date()) || (session?.user?.credits <= 0)
          
          if (open && isExpired) {
            setIsPlanModalOpen(true)
            return
          }
          setShowScanDialog(open)
        }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800">
              <Play className="w-4 h-4 mr-2" />
              Run Scan
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Configure Scan</DialogTitle>
              <DialogDescription>
                Set up your heatmap scan parameters
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">Keywords</Label>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 text-xs"
                    onClick={() => {
                      if (scanConfig.keywordIds.length === keywords.length) {
                        setScanConfig({...scanConfig, keywordIds: []})
                      } else {
                        setScanConfig({...scanConfig, keywordIds: keywords.map(k => k.id)})
                      }
                    }}
                  >
                    {scanConfig.keywordIds.length === keywords.length ? 'Deselect All' : 'Select All'}
                  </Button>
                </div>
                <div className="max-h-[200px] overflow-y-auto border rounded-lg p-3 space-y-2">
                  {keywords.length > 0 ? (
                    keywords.map(kw => (
                      <div key={kw.id} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`kw-${kw.id}`} 
                          checked={scanConfig.keywordIds.includes(kw.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setScanConfig({...scanConfig, keywordIds: [...scanConfig.keywordIds, kw.id]})
                            } else {
                              setScanConfig({...scanConfig, keywordIds: scanConfig.keywordIds.filter(id => id !== kw.id)})
                            }
                          }}
                        />
                        <label 
                          htmlFor={`kw-${kw.id}`}
                          className="text-sm font-medium leading-none cursor-pointer"
                        >
                          {kw.keyword}
                        </label>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500 text-center py-2">No keywords available</p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Grid Size</Label>
                <Select value={scanConfig.gridSize} onValueChange={(v) => setScanConfig({...scanConfig, gridSize: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3x3 (9 points)</SelectItem>
                    <SelectItem value="5">5x5 (25 points)</SelectItem>
                    <SelectItem value="7">7x7 (49 points)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Grid Spacing</Label>
                <Select value={scanConfig.spacingMeters} onValueChange={(v) => setScanConfig({...scanConfig, spacingMeters: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="500">500m (compact)</SelectItem>
                    <SelectItem value="1000">1km (standard)</SelectItem>
                    <SelectItem value="2000">2km (wide)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowScanDialog(false)}>Cancel</Button>
              <Button onClick={handleStartScan} disabled={startingScan || keywords.length === 0}>
                {startingScan ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Start Scan'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="keywords" onValueChange={(value) => {
        if (value === 'competitors') fetchCompetitors()
      }} className="space-y-6">
        <TabsList>
          <TabsTrigger value="keywords">
            <Tag className="w-4 h-4 mr-2" />
            Keywords ({keywords.length})
          </TabsTrigger>
          <TabsTrigger value="scans">
            <BarChart3 className="w-4 h-4 mr-2" />
            Scans ({scans.length})
          </TabsTrigger>
          <TabsTrigger value="competitors">
            <Users className="w-4 h-4 mr-2" />
            Competitors
          </TabsTrigger>
        </TabsList>

        <TabsContent value="keywords" className="space-y-4">
          {/* Add Keyword */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Add Keywords</CardTitle>
                  <CardDescription>Track your business ranking for specific search terms</CardDescription>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Credits</p>
                  <p className="text-lg font-black text-blue-600">{session?.user?.credits?.toLocaleString() || 0}</p>
                  <p className="text-[10px] text-slate-400">100 per keyword</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddKeyword} className="flex gap-3">
                <Input
                  placeholder="e.g., coffee shop near me, best pizza..."
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" disabled={addingKeyword || !newKeyword.trim()}>
                  {addingKeyword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Keywords List */}
          {keywords.length > 0 ? (
            <div className="space-y-2">
              {keywords.map(keyword => (
                <Card key={keyword.id}>
                  <CardContent className="py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Tag className="w-5 h-5 text-slate-400" />
                      <span className="font-medium">{keyword.keyword}</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteKeyword(keyword.id)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <Tag className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No keywords yet. Add your first keyword above.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="scans" className="space-y-4">
          {scans.length > 0 ? (
            <div className="space-y-3">
              {scans.map(scan => {
                const keyword = keywords.find(k => k.id === scan.keywordId)
                return (
                  <Card key={scan.id} className="hover:shadow-md transition">
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center">
                            <Grid3X3 className="w-6 h-6 text-slate-500" />
                          </div>
                          <div>
                            <p className="font-medium">{keyword?.keyword || 'Unknown keyword'}</p>
                            <div className="flex items-center gap-3 text-sm text-slate-500">
                              <span>{scan.gridSize}x{scan.gridSize} grid</span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatDistanceToNow(new Date(scan.createdAt), { addSuffix: true })}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {scan.status === 'processing' && (
                            <span className="text-sm text-slate-500">
                              {scan.processedPoints || 0}/{scan.totalPoints} points
                            </span>
                          )}
                          <Badge className={getStatusColor(scan.status)}>
                            {scan.status}
                          </Badge>
                          {scan.status === 'completed' && (
                            <Link href={`/dashboard/scans/${scan.id}`}>
                              <Button size="sm">
                                View Results
                                <ExternalLink className="w-4 h-4 ml-2" />
                              </Button>
                            </Link>
                          )}
                          {(scan.status === 'queued' || scan.status === 'processing') && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                              onClick={() => handleCancelScan(scan.id)}
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <BarChart3 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 mb-4">No scans yet. Add a keyword and run your first scan.</p>
                {keywords.length > 0 && (
                  <Button onClick={() => {
                    const expiryDate = session?.user?.planEndsAt || session?.user?.trialEndsAt
                    const isExpired = (expiryDate && new Date(expiryDate) < new Date()) || (session?.user?.credits <= 0)
                    
                    if (isExpired) {
                      setIsPlanModalOpen(true)
                    } else {
                      setShowScanDialog(true)
                    }
                  }}>
                    <Play className="w-4 h-4 mr-2" />
                    Run Your First Scan
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="competitors" className="space-y-4">
          {loadingCompetitors ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}
            </div>
          ) : competitors.length > 0 ? (
            <div className="grid gap-4">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Top Competitors ({competitors.length})</h3>
                <span className="text-xs text-slate-400">Aggregated from all completed scans</span>
              </div>
              <div className="grid gap-3">
                {competitors.map((comp, idx) => (
                  <Card key={comp.placeId || idx} className="overflow-hidden border-slate-200 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 rounded-2xl group">
                    <CardContent className="p-0">
                      <div className="flex items-center p-4 sm:p-5 gap-4">
                        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 font-bold group-hover:bg-blue-50 group-hover:border-blue-100 group-hover:text-blue-500 transition-colors">
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">{comp.name}</h3>
                          <p className="text-xs text-slate-500 truncate flex items-center gap-1 mt-1 font-medium">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {comp.address || 'No address provided'}
                          </p>
                        </div>
                        <div className="flex items-center gap-4 sm:gap-8 text-right">
                          <div className="hidden md:block">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Visibility</p>
                            <p className="text-sm font-black text-blue-600">{comp.visibility}%</p>
                          </div>
                          <div className="hidden sm:block">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Avg Rank</p>
                            <p className="text-sm font-black text-slate-900">{comp.avgRank || '-'}</p>
                          </div>
                          <div className="min-w-[80px]">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Appearances</p>
                            <p className="text-sm font-black text-slate-900">{comp.appearances}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <Card className="border-dashed border-2 bg-slate-50/50">
              <CardContent className="py-16 text-center">
                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-slate-300" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">No competitors tracked yet</h3>
                <p className="text-slate-500 max-w-xs mx-auto text-sm font-medium">
                  Run some heatmap scans to start tracking which businesses appear alongside yours in search results.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
      
      <PlanExpiredModal 
        isOpen={isPlanModalOpen} 
        onClose={() => setIsPlanModalOpen(false)} 
      />
    </div>
  )
}
