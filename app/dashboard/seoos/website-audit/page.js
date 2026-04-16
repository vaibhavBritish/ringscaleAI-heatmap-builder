'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { SEOScoreCard } from '@/components/seoos/SEOScoreCard'
import { IssueTable } from '@/components/seoos/IssueTable'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Globe, Search, Sparkles, RefreshCcw, AlertCircle, CheckCircle, Clock, Download, TrendingUp, BarChart3, ListFilter, DownloadCloud, Plus } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { v4 as uuidv4 } from 'uuid'
import { RankTracker } from '@/components/seoos/RankTracker'

export default function WebsiteAuditPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [url, setUrl] = useState('')
  const [projectId, setProjectId] = useState('')
  const [projects, setProjects] = useState([])
  const [auditing, setAuditing] = useState(false)
  const [currentAudit, setCurrentAudit] = useState(null)
  const [issues, setIssues] = useState([])
  const [runs, setRuns] = useState([])
  const [activeRunId, setActiveRunId] = useState(null)
  
  // Real-time SEO data
  const [rankings, setRankings] = useState([])
  const [syncingSerp, setSyncingSerp] = useState(false)
  const [newKeyword, setNewKeyword] = useState('')
  
  // GSC Performance data
  const [performanceData, setPerformanceData] = useState([])
  const [syncingGsc, setSyncingGsc] = useState(false)

  useEffect(() => {
    if (session?.user?.role !== 'admin') { router.push('/dashboard'); return }
    fetch('/api/projects').then(r => r.json()).then(d => setProjects(d.projects || []))
    fetch('/api/seoos/website-audit').then(r => r.json()).then(d => setRuns(d.runs || []))
  }, [session])

  useEffect(() => {
    if (projectId) {
      fetchRankings()
      fetchPerformance()
    }
  }, [projectId])

  const fetchPerformance = async () => {
    if (!projectId) return
    try {
      const res = await fetch(`/api/seoos/gsc-data?projectId=${projectId}`)
      const data = await res.json()
      if (res.ok) setPerformanceData(data.performance || [])
    } catch (e) {
      console.error('Fetch performance error:', e)
    }
  }

  const handleSyncGsc = async () => {
    if (!projectId || !url) return
    setSyncingGsc(true)
    toast.info('Syncing data from Google Search Console...')
    try {
      const res = await fetch('/api/seoos/gsc-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, url })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('GSC synchronization complete!')
      fetchPerformance()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSyncingGsc(false)
    }
  }

  const fetchRankings = async () => {
    if (!projectId) return
    try {
      const res = await fetch(`/api/seoos/serp-sync?projectId=${projectId}`)
      const data = await res.json()
      if (res.ok) setRankings(data.rankings || [])
    } catch (e) {
      console.error('Fetch rankings error:', e)
    }
  }


  const handleSyncSerp = async (kw = null) => {
    const keywordToSync = kw || newKeyword
    if (!projectId || !url || !keywordToSync) { toast.error('Project, URL, and Keyword required'); return }
    setSyncingSerp(true)
    try {
      const res = await fetch('/api/seoos/serp-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, businessUrl: url.startsWith('http') ? url : `https://${url}`, keyword: keywordToSync })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(`Rankings updated for: ${keywordToSync}`)
      setNewKeyword('')
      fetchRankings() // Refresh rankings list
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSyncingSerp(false)
    }
  }

  const handleDownloadReport = async () => {
    const auditUrl = currentAudit?.url || url
    if (!auditUrl) {
      toast.error('No audit data found to download')
      return
    }
    
    toast.info('Generating Deep-Chunked PDF report...')
    try {
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 10
      let currentY = margin

      // Helper to add canvas to PDF with page management
      const addElementToPdf = async (el, forceNewPage = false) => {
        if (!el) return
        
        const canvas = await html2canvas(el, { 
          scale: 1, 
          useCORS: true, 
          logging: false,
          // CSS SANITATION: Map modern OKLCH/OKLAB colors to RGB for html2canvas compatibility
          onclone: (clonedDoc) => {
            const elements = clonedDoc.querySelectorAll('*')
            elements.forEach(node => {
               const style = window.getComputedStyle(node)
               // Flatten Backgrounds
               if (style.backgroundColor.includes('okl')) {
                 node.style.backgroundColor = style.backgroundColor
               }
               // Flatten Text
               if (style.color.includes('okl')) {
                 node.style.color = style.color
               }
               // Flatten Borders
               if (style.borderColor.includes('okl')) {
                 node.style.borderColor = style.borderColor
               }
               // Special fix for modern Tailwind v4 Gradients
               if (style.backgroundImage.includes('okl')) {
                 // Fallback to a solid color if gradient parsing fails
                 node.style.backgroundImage = 'none'
                 node.style.backgroundColor = style.backgroundColor || '#1e293b'
               }
            })
          }
        })
        
        const imgData = canvas.toDataURL('image/jpeg', 0.8)
        const imgWidth = canvas.width
        const imgHeight = canvas.height
        const ratio = (pageWidth - (margin * 2)) / imgWidth
        const elHeightOnPdf = imgHeight * ratio

        if (forceNewPage || (currentY + elHeightOnPdf > pageHeight - margin)) {
          pdf.addPage()
          currentY = margin
        }

        pdf.addImage(imgData, 'JPEG', margin, currentY, pageWidth - (margin * 2), elHeightOnPdf)
        currentY += elHeightOnPdf + 5 // 5mm spacing
      }

      // 1. Capture Header Sections
      const summaryCards = document.querySelector('.grid-cols-2.sm\\:grid-cols-5')
      const summaryBar = document.querySelector('.bg-slate-900.text-white.rounded-2xl')
      
      await addElementToPdf(summaryCards)
      await addElementToPdf(summaryBar)

      // 2. Capture Active Tab Content Chunks
      const activeTabContent = document.querySelector('div[role="tabpanel"][data-state="active"]')
      if (activeTabContent) {
        const issueList = activeTabContent.querySelector('.space-y-2')
        if (issueList) {
           const rows = issueList.querySelectorAll('.border.rounded-xl')
           if (rows.length > 0) {
              pdf.setFontSize(14); pdf.setFont(undefined, 'bold'); 
              pdf.text('Detailed SEO Issues', margin, currentY + 5);
              currentY += 10;
              
              for (const row of rows) {
                await addElementToPdf(row)
                await new Promise(r => setTimeout(r, 10))
              }
           } else {
             await addElementToPdf(activeTabContent)
           }
        } else {
          await addElementToPdf(activeTabContent)
        }
      }

      pdf.save(`SEO-Report-${auditUrl.replace(/https?:\/\//, '').replace(/\//g, '-')}.pdf`)
      toast.success('Report successfully downloaded!')
    } catch (err) {
      console.error('PDF Deep-Chunked Error:', err)
      toast.error('Failed to generate PDF. Compatibility error with modern CSS colors.')
    }
  }

  const handleAudit = async () => {
    if (!url) { toast.error('Enter a URL to audit'); return }
    // Project is now optional
    const finalProjectId = projectId || 'global'
    setAuditing(true)
    setCurrentAudit(null)
    setIssues([])
    try {
      const res = await fetch('/api/seoos/website-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.startsWith('http') ? url : `https://${url}`, projectId: finalProjectId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Audit failed')
      
      setCurrentAudit(data.run)
      setIssues(data.issues || [])
      setActiveRunId(data.run?.id)
      
      // Auto-select or update the project state if a new one was created/found
      if (data.projectId && (projectId !== data.projectId)) {
        setProjectId(data.projectId);
        // Refresh project list to show the new one in dropdown
        fetch('/api/projects').then(r => r.json()).then(d => setProjects(d.projects || []))
      }

      setRuns(prev => [data.run, ...prev.filter(r => r.id !== data.run?.id)])
      toast.success('Audit complete!')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setAuditing(false)
    }
  }

  const loadRun = async (run) => {
    setCurrentAudit(run)
    setActiveRunId(run.id)
    setUrl(run.url) // Keep input in sync
    
    // CRITICAL: Ensure the project context changes so that Rankings/Performance tabs update
    if (run.projectId && run.projectId !== projectId) {
      setProjectId(run.projectId)
      setRankings([]) // Clear old data immediately to prevent leaking another business's data
    }

    const res = await fetch(`/api/seoos/issues?auditRunId=${run.id}`)
    const data = await res.json()
    setIssues(data.issues || [])
  }

  const handleStatusChange = async (issueId, status) => {
    await fetch('/api/seoos/issues', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: issueId, status }),
    })
    setIssues(prev => prev.map(i => i.id === issueId ? { ...i, status } : i))
    toast.success(`Issue marked as ${status}`)
  }

  const handleGenerateAI = async (issue) => {
    toast.info('Generating AI fix suggestion...')
    const typeMap = {
      'on-page': issue.title.toLowerCase().includes('title') ? 'title' 
        : issue.title.toLowerCase().includes('meta') ? 'meta' 
        : issue.title.toLowerCase().includes('h1') ? 'h1' : 'content',
      content: 'content', schema: 'schema', technical: 'content',
    }
    const type = typeMap[issue.type] || 'content'
    const project = projects.find(p => p.id === (currentAudit?.projectId || projectId))
    try {
      const res = await fetch('/api/seoos/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type, projectId: currentAudit?.projectId || projectId,
          context: { businessName: project?.businessName || 'Business', pageUrl: issue.pageUrl || currentAudit?.url, issueId: issue.id }
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      return data.recommendation
    } catch (err) {
      console.error('AI generation failed:', err)
      throw err
    }
  }

  const handleFixAll = async () => {
    const issuesToFix = issues.filter(i => i.status === 'open' && (i.severity === 'critical' || i.severity === 'warning'))
    if (issuesToFix.length === 0) { toast.info('No critical issues to fix'); return }
    
    toast.info(`Generating AI fixes for ${issuesToFix.length} issues...`)
    setAuditing(true) // Use auditing as a global loading state
    let count = 0
    for (const issue of issuesToFix) {
      try {
        await handleGenerateAI(issue)
        count++
      } catch (e) {
        console.error(e)
      }
    }
    setAuditing(false)
    toast.success(`Generated ${count} AI suggestions! Check AI Assistant.`)
  }

  const handleCreateTask = async (issue) => {
    if (!issue.title) return
    try {
      const res = await fetch('/api/seoos/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: currentAudit?.projectId || projectId,
          title: `Fix SEO Issue: ${issue.title}`,
          description: `Issue: ${issue.description}\nPage: ${issue.pageUrl || 'N/A'}\nSeverity: ${issue.severity}`,
          type: issue.type === 'technical' ? 'technical' : issue.type === 'content' ? 'content' : 'local',
          priority: issue.severity === 'critical' ? 'high' : 'medium',
          issueId: issue.id
        })
      })
      if (!res.ok) throw new Error()
      toast.success('Task created successfully')
    } catch {
      toast.error('Failed to create task')
    }
  }

  const getStatusIcon = (status) => {
    if (status === 'complete') return <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
    if (status === 'failed') return <AlertCircle className="w-3.5 h-3.5 text-red-500" />
    return <Clock className="w-3.5 h-3.5 text-amber-500" />
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-black text-slate-900">Website Audit Engine</h1>
        <p className="text-slate-500 mt-1">Crawl any URL and detect SEO issues across 9 categories</p>
      </div>

      {/* Audit input */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                placeholder="https://example.com"
                value={url}
                onChange={e => setUrl(e.target.value)}
                className="h-11"
                disabled={auditing}
                onKeyDown={e => e.key === 'Enter' && handleAudit()}
              />
            </div>
            <select
              value={projectId}
              onChange={e => setProjectId(e.target.value)}
              className="h-11 border border-slate-200 rounded-lg px-3 text-sm bg-white min-w-[180px]"
              disabled={auditing}
            >
              <option value="">No Project (Optional)</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.businessName}</option>)}
            </select>
            <Button onClick={handleAudit} disabled={auditing || !url}
              className="h-11 bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-6 shrink-0">
              {auditing ? (
                <><RefreshCcw className="w-4 h-4 mr-2 animate-spin" /> Scanning...</>
              ) : (
                <><Search className="w-4 h-4 mr-2" /> Run Audit</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* History sidebar */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold">Audit History</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {runs.length === 0 ? (
                <p className="text-xs text-slate-400 px-4 pb-4">No audits yet</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {runs.map(run => (
                    <button key={run.id}
                      className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors ${activeRunId === run.id ? 'bg-blue-50 border-r-2 border-blue-600' : ''}`}
                      onClick={() => loadRun(run)}>
                      <div className="flex items-center gap-1.5 mb-1">
                        {getStatusIcon(run.status)}
                        <span className="text-xs font-bold text-slate-700 truncate">{run.url.replace(/^https?:\/\//, '').split('/')[0]}</span>
                      </div>
                      <p className="text-[10px] text-slate-400">{run.totalIssues ?? 0} issues · T:{run.techScore ?? '?'} P:{run.onPageScore ?? '?'}</p>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main results */}
        <div className="lg:col-span-3 space-y-6">
          {auditing && (
            <div className="space-y-4">
              <div className="grid grid-cols-5 gap-3">
                {Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
              </div>
              <Skeleton className="h-64 rounded-2xl" />
            </div>
          )}

          {currentAudit && !auditing && (
            <>
              {/* Score cards */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <SEOScoreCard label="Technical" score={currentAudit.techScore} />
                <SEOScoreCard label="On-Page" score={currentAudit.onPageScore} />
                <SEOScoreCard label="Content" score={currentAudit.contentScore} />
                <SEOScoreCard label="Schema" score={currentAudit.schemaScore} />
                <SEOScoreCard label="Performance" score={currentAudit.perfScore} />
              </div>

              {/* Summary bar */}
              <div className="flex items-center gap-4 bg-slate-900 text-white rounded-2xl px-5 py-3">
                <Globe className="w-5 h-5 text-slate-300 shrink-0" />
                <span className="text-sm font-medium truncate flex-1">{currentAudit.url}</span>
                <span className="text-sm font-black">{currentAudit.totalIssues} Issues</span>
                <Button size="sm" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800 h-8"
                  onClick={handleFixAll} disabled={auditing}>
                  <Sparkles className="w-3.5 h-3.5 mr-1" /> AI Fix All
                </Button>
              </div>

              {/* Detailed Insights & Reports */}
              <div id="seo-report-content" className="space-y-6">
                <Tabs defaultValue="audit" className="w-full">
                  <TabsList className="grid grid-cols-3 w-full max-w-md h-12 bg-slate-100 p-1 rounded-xl">
                    <TabsTrigger value="audit" className="rounded-lg font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs">
                      <Search className="w-3.5 h-3.5 mr-1" /> Audit
                    </TabsTrigger>
                    <TabsTrigger value="rankings" className="rounded-lg font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs">
                      <TrendingUp className="w-3.5 h-3.5 mr-1" /> Rankings
                    </TabsTrigger>
                    <TabsTrigger value="performance" className="rounded-lg font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs">
                      <BarChart3 className="w-3.5 h-3.5 mr-1" /> Performance
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="audit" className="mt-6 space-y-6">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-base font-bold">Detected Issues</CardTitle>
                        <Button variant="outline" size="sm" onClick={handleDownloadReport} className="h-8 text-xs">
                          <DownloadCloud className="w-3.5 h-3.5 mr-1" /> Download Report
                        </Button>
                      </CardHeader>
                      <CardContent>
                        <IssueTable
                          issues={issues}
                          onStatusChange={handleStatusChange}
                          onGenerateAI={async (issue) => {
                            try {
                              await handleGenerateAI(issue)
                              toast.success('AI suggestion generated!')
                            } catch {
                              toast.error('AI generation failed')
                            }
                          }}
                          onCreateTask={handleCreateTask}
                        />
                      </CardContent>
                    </Card>
                  </TabsContent>


                  <TabsContent value="rankings" className="mt-6 space-y-6">
                    <div className="bg-white p-4 rounded-xl border space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-bold text-slate-900">Keyword Rank Tracker</h3>
                          <p className="text-xs text-slate-500">Track your positions on Google SERP</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Input 
                          placeholder="e.g. best plumber near me" 
                          value={newKeyword}
                          onChange={e => setNewKeyword(e.target.value)}
                          className="flex-1"
                        />
                        <Button onClick={() => handleSyncSerp()} disabled={syncingSerp || !newKeyword} className="bg-indigo-600">
                          {syncingSerp ? <RefreshCcw className="w-4 h-4 animate-spin" /> : 'Add & Track'}
                        </Button>
                      </div>

                      {/* Suggested Keywords Discovery */}
                      {currentAudit?.suggestedKeywords?.length > 0 && (
                        <div className="pt-2 animate-in fade-in slide-in-from-top-2 duration-500">
                          <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Discovered Keywords</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {currentAudit.suggestedKeywords.map((kw, i) => (
                              <button 
                                key={i}
                                onClick={() => handleSyncSerp(kw)}
                                disabled={syncingSerp}
                                className="group flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-200 rounded-full text-xs font-bold text-slate-600 hover:text-indigo-700 transition-all cursor-pointer disabled:opacity-50"
                              >
                                {kw}
                                <Plus className="w-3 h-3 text-slate-300 group-hover:text-indigo-400" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <RankTracker rankings={rankings} />
                  </TabsContent>

                  <TabsContent value="performance" className="mt-6 space-y-6">
                    <div className="bg-white p-6 rounded-xl border space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-bold text-slate-900 text-lg">Search Performance</h3>
                          <p className="text-sm text-slate-500">Real data from Google Search Console (Last 30 days)</p>
                        </div>
                        <Button onClick={handleSyncGsc} disabled={syncingGsc || !projectId} variant="outline" className="border-slate-200">
                          {syncingGsc ? <RefreshCcw className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCcw className="w-4 h-4 mr-2" />}
                          Sync from GSC
                        </Button>
                      </div>

                      {performanceData.length > 0 ? (
                        <div className="space-y-8">
                           {/* Performance cards */}
                           <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Total Clicks</p>
                                <p className="text-2xl font-black text-blue-900 mt-1">{performanceData.reduce((acc, curr) => acc + curr.clicks, 0).toLocaleString()}</p>
                              </div>
                              <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                                <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Total Impressions</p>
                                <p className="text-2xl font-black text-indigo-900 mt-1">{performanceData.reduce((acc, curr) => acc + curr.impressions, 0).toLocaleString()}</p>
                              </div>
                              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Avg. CTR</p>
                                <p className="text-2xl font-black text-emerald-900 mt-1">{(performanceData.reduce((acc, curr) => acc + curr.ctr, 0) / performanceData.length * 100).toFixed(1)}%</p>
                              </div>
                              <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                                <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Avg. Position</p>
                                <p className="text-2xl font-black text-amber-900 mt-1">{(performanceData.reduce((acc, curr) => acc + curr.position, 0) / performanceData.length).toFixed(1)}</p>
                              </div>
                           </div>
                           
                           <div className="p-8 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                              <TrendingUp className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                              <h4 className="font-bold text-slate-700">Performance Visualization</h4>
                              <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">GSC analytics connected. Historical trends will be displayed as more data syncs over time.</p>
                           </div>
                        </div>
                      ) : (
                        <div className="p-12 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-4">
                          <AlertCircle className="w-12 h-12 text-amber-400 mx-auto" />
                          <div>
                            <h4 className="font-bold text-slate-900">GSC Access Required</h4>
                            <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
                              To see search performance data, you must authorize this auditor in your Google Search Console.
                            </p>
                          </div>
                          
                          <div className="bg-white p-4 rounded-xl border text-left max-w-lg mx-auto space-y-3">
                            <p className="text-xs font-bold text-slate-700">How to authorize:</p>
                            <ol className="text-xs text-slate-600 space-y-2 list-decimal pl-4">
                              <li>Open <strong>Google Search Console</strong> for this site.</li>
                              <li>Go to <strong>Settings</strong> &gt; <strong>Users and Permissions</strong>.</li>
                              <li>Click <strong>Add User</strong>.</li>
                              <li>Enter: <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-600">ringscaleai@ringscaleai-490013.iam.gserviceaccount.com</code></li>
                              <li>Set permission to <strong>Viewer</strong> and click Add.</li>
                              <li>Click <strong>Sync from GSC</strong> button above.</li>
                            </ol>
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </>
          )}

          {!currentAudit && !auditing && (
            <div className="text-center py-20 text-slate-400">
              <Globe className="w-14 h-14 mx-auto mb-4 text-slate-200" />
              <h3 className="font-bold text-lg text-slate-600">Enter a URL above to run your first audit</h3>
              <p className="text-sm mt-1">The engine checks titles, meta, H1s, images, schema, canonical, robots, viewport, and content quality</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
