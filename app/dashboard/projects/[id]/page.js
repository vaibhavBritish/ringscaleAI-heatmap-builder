'use client'

import { useEffect, useState, useRef } from 'react'
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
  ArrowLeft, MapPin, Tag, Plus, Trash2, Loader2, Play, Clock, BarChart3, Grid3X3, Settings2, ExternalLink, Check, Users, ShieldCheck, QrCode, MessageSquare, Sparkles, Zap
} from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { formatDistanceToNow, format } from 'date-fns'
import { useSession } from 'next-auth/react'
import PlanExpiredModal from '@/components/dashboard/PlanExpiredModal'
import { toPng } from 'html-to-image'

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
  const [cancellingScanId, setCancellingScanId] = useState(null)
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false)
  const [competitors, setCompetitors] = useState([])
  const [loadingCompetitors, setLoadingCompetitors] = useState(false)
  const [generatingAssets, setGeneratingAssets] = useState(false)
  const { data: session } = useSession()
  const qrTemplateRef = useRef(null)
  const qrPosterImgRef = useRef(null)

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
    setCancellingScanId(scanId)
    try {
      const response = await fetch(`/api/scans/${scanId}/cancel`, { method: 'POST' })
      if (!response.ok) throw new Error('Failed to cancel scan')
      
      setScans(prev => prev.map(s => s.id === scanId ? { ...s, status: 'cancelled' } : s))
      toast.success('Scan cancelled')
    } catch (error) {
      toast.error('Failed to cancel scan')
    } finally {
      setCancellingScanId(null)
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
  
  const handleGenerateAssets = async () => {
    setGeneratingAssets(true)
    try {
      const response = await fetch(`/api/projects/${projectId}/setup-assets`, {
        method: 'POST'
      })
      
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to generate assets')
      
      toast.success('AI Marketing Assets generated successfully!')
      fetchProjectData() // Refresh UI
    } catch (error) {
      console.error('Asset generation error:', error)
      toast.error(error.message || 'Failed to generate assets. Please ensure all services are online.')
    } finally {
      setGeneratingAssets(false)
    }
  }

  const downloadQR = async () => {
    if (!project?.qrCodeUrl) return
    toast.info('Generating custom QR poster...')
    try {
      const fullUrl = `${window.location.origin}${project.qrCodeUrl}`
      const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(fullUrl)}`
      
      const response = await fetch(qrImageUrl)
      const blob = await response.blob()
      const blobUrl = URL.createObjectURL(blob)
      
      if (qrPosterImgRef.current) {
        qrPosterImgRef.current.src = blobUrl
        await new Promise((resolve) => {
          qrPosterImgRef.current.onload = resolve
        })
      }

      if (qrTemplateRef.current) {
        const dataUrl = await toPng(qrTemplateRef.current, { quality: 1.0 })
        const link = document.createElement('a')
        link.download = `QR-Poster-${project.businessName.replace(/\s+/g, '-')}.png`
        link.href = dataUrl
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
      
      URL.revokeObjectURL(blobUrl)
      toast.success('QR Poster downloaded!')
    } catch (error) {
      console.error('Error downloading QR:', error)
      toast.error('Failed to generate QR poster')
    }
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/projects" className="flex-shrink-0 text-slate-400 hover:text-slate-600 bg-white p-2 rounded-xl border border-slate-100 shadow-sm transition-all hover:scale-110">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-2xl font-black text-slate-900 leading-tight truncate">{project.businessName}</h1>
            <p className="text-slate-500 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider mt-1">
              <MapPin className="w-3.5 h-3.5 text-blue-500" />
              <span className="truncate">{project.address || 'No address provided'}</span>
            </p>
          </div>
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
        <div className="flex flex-col xs:flex-row items-center gap-3 w-full sm:w-auto">
          <Link href={`/dashboard/audit/${projectId}`} className="w-full xs:w-auto">
            <Button variant="outline" className="w-full h-11 px-6 font-bold rounded-xl border-slate-200 hover:bg-slate-50 transition-all shadow-sm active:scale-95">
              <ShieldCheck className="w-4 h-4 mr-2 text-blue-600" />
              View Audit
            </Button>
          </Link>
          <Link href={`/dashboard/projects/new?projectId=${projectId}`} className="w-full xs:w-auto">
            <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 focus:ring-0 shadow-lg shadow-blue-500/20 active:scale-95 transition-all h-11 px-6 font-bold rounded-xl">
              <Play className="w-4 h-4 mr-2" />
              Run Scan
            </Button>
          </Link>
        </div>
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
              <Button type="button" variant="outline" onClick={() => setShowScanDialog(false)}>Cancel</Button>
              <Button type="button" onClick={handleStartScan} disabled={startingScan || keywords.length === 0}>
                {startingScan ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Start Scan'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* AI Marketing Assets - Automated from Review Generator and ConnectIt */}
      {(project.reviewPageUrl || project.qrCodeUrl) && (
        <Card className="border-none shadow-xl bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 text-white overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full blur-[80px] -mr-32 -mt-32 group-hover:bg-blue-600/30 transition-all duration-1000" />
          <CardContent className="p-6 relative z-10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                  <Sparkles className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xl font-black italic tracking-tight">AI Powered Marketing Assets</h3>
                  <p className="text-slate-400 text-sm font-medium">Automated review collection and trackable QR assets</p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-3">
                {project.reviewPageUrl && (
                  <Link href={project.reviewPageUrl} target="_blank">
                    <Button variant="outline" className="h-12 px-6 rounded-xl border-white/20 bg-white/5 hover:bg-white/10 text-white font-bold transition-all border-none">
                      <MessageSquare className="w-4 h-4 mr-2 text-blue-400" />
                      View Review Page
                    </Button>
                  </Link>
                )}
                {project.qrCodeUrl && (
                  <Button 
                    onClick={downloadQR}
                    className="h-12 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-500/30 transition-all active:scale-95"
                  >
                    <QrCode className="w-4 h-4 mr-2" />
                    Download AI QR
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Manual Automation Trigger (Show only if assets are NOT generated) */}
      {!project.reviewPageUrl && !project.qrCodeUrl && (
        <Card className="border border-dashed border-blue-200 bg-blue-50/30 rounded-[2rem] overflow-hidden group hover:bg-blue-50/50 transition-all duration-500">
           <CardContent className="p-8">
             <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                   <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center border border-blue-100 group-hover:scale-110 transition-transform duration-500">
                      <Sparkles className="w-8 h-8 text-blue-600 animate-pulse" />
                   </div>
                   <div>
                      <h3 className="text-xl font-black text-slate-900 tracking-tight mb-1">Boost Your Marketing with AI</h3>
                      <p className="text-slate-500 font-medium max-w-md">Generate a custom AI Review Page and trackable QR code for this business in one click.</p>
                   </div>
                </div>
                
                <Button 
                   onClick={handleGenerateAssets}
                   disabled={generatingAssets}
                   className="h-14 px-8 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black shadow-xl shadow-blue-500/20 active:scale-95 transition-all text-lg min-w-[200px]"
                >
                   {generatingAssets ? (
                      <span className="flex items-center gap-3">
                         <Loader2 className="w-5 h-5 animate-spin" />
                         Syncing Tools...
                      </span>
                   ) : (
                      <span className="flex items-center gap-2">
                         <Zap className="w-5 h-5" />
                         Build AI Assets
                      </span>
                   )}
                </Button>
             </div>
           </CardContent>
        </Card>
      )}

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
                            <>
                              {!cancellingScanId && (
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                                  isLoading={cancellingScanId === scan.id}
                                  cooldown={2000}
                                  onClick={() => handleCancelScan(scan.id)}
                                >
                                  Cancel
                                </Button>
                              )}
                              {cancellingScanId === scan.id && (
                                <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                              )}
                            </>
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
                  <Link href={`/dashboard/projects/new?projectId=${projectId}`}>
                    <Button 
                      className="h-11 px-8 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-500/20 transition-all active:scale-95"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Run Your First Scan
                    </Button>
                  </Link>
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
      
      {/* Hidden QR Poster Template for Download */}
      <div className="absolute left-[-9999px] top-[-9999px]">
        <div 
          ref={qrTemplateRef}
          id="qr-poster-template" 
          className="w-[400px] h-[700px] bg-slate-50 flex flex-col items-center justify-between p-4 relative overflow-hidden font-sans"
        >
          {/* Background Color Blocks (Corners) */}
          <div className="absolute top-0 left-0 w-40 h-40 bg-[#FBBC05] rounded-br-[100%] z-0" />
          <div className="absolute top-0 right-0 w-40 h-40 bg-[#EA4335] rounded-bl-[100%] z-0" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#34A853] rounded-tr-[100%] z-0" />
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-[#4285F4] rounded-tl-[100%] z-0" />

          {/* Main White Poster Area */}
          <div className="w-[calc(100%-16px)] h-[calc(100%-16px)] bg-[#F8F9FA] rounded-2xl shadow-2xl flex-1 flex flex-col items-center justify-between p-6 z-10 border border-white mt-2 mb-2 relative">
            
            {/* Google Logo */}
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg border border-slate-100 mt-2">
              <svg className="w-12 h-12" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.16H2.18C1.43 8.64 1 10.27 1 12s.43 3.36 1.18 4.84l3.66-2.75z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.16l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            </div>

            {/* 5 Stars */}
            <div className="flex gap-1 text-[#FBBC05]">
              {Array.from({ length: 5 }).map((_, i) => (
                <svg key={i} className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                </svg>
              ))}
            </div>

            {/* Call to Action Line */}
            <div className="text-center">
              <span className="text-xl font-bold text-[#202124] tracking-tight">Scan to Rate Us on </span>
              <span className="text-2xl font-black tracking-tight">
                <span className="text-[#4285F4]">G</span>
                <span className="text-[#EA4335]">o</span>
                <span className="text-[#FBBC05]">o</span>
                <span className="text-[#4285F4]">g</span>
                <span className="text-[#34A853]">l</span>
                <span className="text-[#EA4335]">e</span>
              </span>
            </div>

            {/* Business Name */}
            <div className="text-center px-6 w-full">
              <div className="bg-white/80 backdrop-blur-sm py-2 px-4 rounded-xl shadow-sm border border-slate-100 inline-block max-w-full">
                <p className="text-2xl font-black text-[#202124] break-words leading-tight">
                  {project?.businessName}
                </p>
              </div>
            </div>

            {/* QR Code */}
            <div className="bg-white p-4 rounded-2xl shadow-xl border border-slate-100 relative mt-2">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#EA4335] rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-[#4285F4] rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-[#FBBC05] rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#34A853] rounded-br-lg" />
              
              <img 
                ref={qrPosterImgRef}
                alt="QR Code"
                className="w-52 h-52"
                crossOrigin="anonymous"
              />
            </div>

            {/* Footer Branding */}
            <div className="flex flex-col items-center gap-1 mt-4 w-full">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Powered By</p>
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-2">
                  <img src="/logo.png" alt="Ringscale" className="h-8 object-contain" crossOrigin="anonymous" onError={(e) => {
                    e.target.style.display = 'none'
                  }} />
                  <span className="text-lg font-black text-slate-800 tracking-tight">RINGSCALE</span>
                </div>
                <p className="text-[9px] text-slate-500 font-bold tracking-wider mt-1">Scale Your Digital Presence</p>
              </div>
            </div>

          </div>
        </div>
      </div>

      <PlanExpiredModal 
        isOpen={isPlanModalOpen} 
        onClose={() => setIsPlanModalOpen(false)} 
      />
    </div>
  )
}
