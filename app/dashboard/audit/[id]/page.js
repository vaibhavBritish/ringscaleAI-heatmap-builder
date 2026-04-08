'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  ArrowLeft, 
  RefreshCcw, 
  MapPin, 
  TrendingUp, 
  BarChart2, 
  Briefcase,
  ChevronRight,
  TrendingDown,
  LayoutDashboard,
  Megaphone,
  Locate,
  Award,
  Loader2,
  Star,
  Eye,
  ImageIcon,
  Trophy,
  AlertCircle,
  CheckCircle2,
  Users,
  Tag,
  Phone,
  ExternalLink,
  Globe
} from 'lucide-react'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer, 
  Cell
} from 'recharts'
import OptimizationScore from '@/components/dashboard/OptimizationScore'
import AuditResultsCards from '@/components/dashboard/AuditResultsCards'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { toast } from 'sonner'
import jsPDF from 'jspdf'
import { toPng } from 'html-to-image'
import { Download } from 'lucide-react'


export default function BusinessAuditPage() {
  const params = useParams()
  const router = useRouter()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const handleDownloadPDF = async () => {
    if (!data) return
    
    try {
      setDownloading(true)
      
      // Wait for all components (including off-screen PDF source) to be fully rendered
      await new Promise(r => setTimeout(r, 500))
      // Force a resize event to ensure Recharts in hidden containers calculate their layout
      window.dispatchEvent(new Event('resize'))
      // Another short wait for charts to respond to resize
      await new Promise(r => setTimeout(r, 100))

      const doc = new jsPDF('p', 'mm', 'a4')
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const margin = 10
      
      const { businessInfo } = data

      // --- HELPERS ---
      const drawFullHeader = (title) => {
        doc.setFillColor(15, 23, 42) // Slate 900
        doc.rect(0, 0, pageWidth, 30, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(20)
        doc.setFont('helvetica', 'bold')
        doc.text('SEO Audit Report', margin + 5, 14)
        
        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(148, 163, 184)
        doc.text(businessInfo.name, margin + 5, 21)
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - margin - 5, 21, { align: 'right' })
        
        if (title) {
          doc.setFontSize(12)
          doc.setTextColor(37, 99, 235)
          doc.text(title.toUpperCase(), margin + 5, 27)
        }
      }

      const drawFooter = () => {
        const totalPages = doc.internal.getNumberOfPages()
        for(let i = 1; i <= totalPages; i++) {
          doc.setPage(i)
          doc.setFontSize(8)
          doc.setTextColor(148, 163, 184)
          doc.setDrawColor(241, 245, 249)
          doc.line(margin + 5, pageHeight - 12, pageWidth - margin - 5, pageHeight - 12)
          doc.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 8, { align: 'center' })
          doc.text('Ringscale AI - Professional SEO Audit', margin + 5, pageHeight - 8)
        }
      }

      const captureAndAdd = async (id, x, y, width) => {
        const el = document.getElementById(id)
        if (!el) return 0
        
        // Hide scrollbars temporarily if any
        const originalOverflow = el.style.overflow
        el.style.overflow = 'hidden'
        
        try {
          // html-to-image handles modern CSS (lab, oklch, etc.) much better than html2canvas
          const imgData = await toPng(el, { 
            quality: 0.95,
            pixelRatio: 2,
            backgroundColor: '#ffffff',
            style: {
              overflow: 'hidden'
            }
          })
          
          el.style.overflow = originalOverflow
          
          // Image size calculation
          const img = new Image()
          img.src = imgData
          await new Promise((resolve) => { img.onload = resolve })
          
          const imgWidth = width
          const imgHeight = (img.height * imgWidth) / img.width
          doc.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight)
          return imgHeight
        } catch (err) {
          console.warn(`[PDF] Failed to capture element ${id}:`, err)
          el.style.overflow = originalOverflow
          return 0
        }
      }

      // --- PAGE 1: VISUAL DASHBOARD SUMMARY ---
      drawFullHeader('Report Overview')
      
      let currentY = 35
      // 1. Sidebar Score & Info snapshot
      const sidebarHeight = await captureAndAdd('pdf-source-sidebar', margin, currentY, (pageWidth - (margin * 2)) * 0.4)
      
      // 2. Audit Results snapshot
      const resultsHeight = await captureAndAdd('pdf-source-results', margin + ((pageWidth - (margin * 2)) * 0.42), currentY, (pageWidth - (margin * 2)) * 0.55)
      
      currentY += Math.max(sidebarHeight, resultsHeight) + 10
      
      // 3. CTA card snapshot
      await captureAndAdd('pdf-source-cta', margin, currentY, pageWidth - (margin * 2))

      // --- PAGE 2: MARKET INTELLIGENCE (COMPETITORS) ---
      doc.addPage()
      drawFullHeader('Market Intelligence')
      
      currentY = 35
      // 1. Benchmarking chart
      const benchHeight = await captureAndAdd('pdf-source-benchmarking', margin, currentY, pageWidth - (margin * 2))
      currentY += (benchHeight > 0 ? benchHeight + 10 : 0)

      // 2. Comparison Metrics
      const marketHeight = await captureAndAdd('pdf-source-market-comparison', margin, currentY, pageWidth - (margin * 2))
      currentY += (marketHeight > 0 ? marketHeight + 10 : 0)

      // 3. Competitor Directory Table
      await captureAndAdd('pdf-source-competitor-directory', margin, currentY, pageWidth - (margin * 2))

      // Finalize PDF
      drawFooter()
      
      const fileName = `Audit_${(businessInfo?.name || 'Report').replace(/[^a-z0-9]/gi, '_')}.pdf`
      doc.save(fileName)
      toast.success('Visual Dashboard Report Downloaded!')
    } catch (error) {
      console.error('Visual PDF Export Error:', error)
      toast.error('Failed to generate visual report')
    } finally {
      setDownloading(false)
    }
  }

  const fetchAuditData = async (force = false) => {
    try {
      if (force) setRefreshing(true)
      const res = await fetch(`/api/projects/${params.id}/audit${force ? '?refresh=true' : ''}`)
      if (!res.ok) throw new Error('Failed to load audit data')
      const auditData = await res.json()
      setData(auditData)
      if (force) toast.success('Audit report refreshed!')
    } catch (err) {
      toast.error('Could not load audit report')
      console.error(err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchAuditData()
  }, [params.id])

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
          <p className="text-slate-500 font-bold animate-pulse">Generating Audit Report...</p>
        </div>
      </div>
    )
  }

  if (!data) return null

  const { businessInfo, metrics, auditResults } = data

  return (
    <div className="p-4 md:p-12 space-y-10 bg-[#f8fafc] min-h-screen">
      {/* Dynamic Header from Reference Image */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-2">
        <div className="flex items-center gap-5">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-10 w-10 p-0 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-blue-600 transition-all flex-shrink-0"
            onClick={() => router.push('/dashboard')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="space-y-0.5">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none uppercase">
                {businessInfo.name}
            </h1>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">
                Business Audit Report
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Button 
            variant="outline"
            size="sm"
            className="h-12 px-6 rounded-2xl font-black text-sm border-slate-200 hover:bg-white hover:border-blue-200 text-slate-700 transition-all shadow-sm bg-white flex items-center gap-2.5"
            onClick={fetchAuditData}
            disabled={refreshing || downloading}
          >
            <RefreshCcw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Audit
          </Button>
          <Button 
            variant="ghost"
            size="sm"
            className="h-12 px-6 rounded-2xl font-black text-sm text-slate-500 hover:text-blue-600 hover:bg-blue-50/50 transition-all"
            onClick={handleDownloadPDF}
            disabled={downloading}
          >
            {downloading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
            Download Report
          </Button>
        </div>
      </div>

      {data.lastUpdated && (
        <p className="text-[11px] text-slate-400 font-black uppercase tracking-[0.1em] mb-2 px-2 opacity-80">
          Last Updated: {new Date(data.lastUpdated).toLocaleString('en-US', { 
            month: 'numeric', 
            day: 'numeric', 
            year: 'numeric', 
            hour: 'numeric', 
            minute: '2-digit', 
            second: '2-digit', 
            hour12: true 
          })}
        </p>
      )}

      {/* Main Tabs - Pill Style */}
      <Tabs defaultValue="audit" className="w-full">
        <div className="mb-10 inline-block bg-slate-100/60 p-1.5 rounded-[2rem] border border-slate-200/50 shadow-sm overflow-x-auto no-scrollbar">
          <TabsList className="bg-transparent h-auto p-0 flex space-x-1">
            {[
              { value: 'audit', label: 'Audit', icon: <Eye className="w-4 h-4" /> },
              { value: 'profile', label: 'Profile', icon: <Users className="w-4 h-4" /> },
              { value: 'competitors', label: 'Competitors', icon: <Trophy className="w-4 h-4" /> }
            ].map((tab) => (
              <TabsTrigger 
                key={tab.value}
                value={tab.value} 
                className="px-8 py-3.5 rounded-[1.8rem] font-black text-sm data-[state=active]:bg-white data-[state=active]:shadow-xl data-[state=active]:text-blue-600 data-[state=active]:border-slate-100 border border-transparent text-slate-400 transition-all flex items-center gap-2.5"
              >
                {tab.icon} {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="audit" className="mt-0 ring-offset-0 focus-visible:ring-0">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* Sidebar: Optimization Score Card */}
            <div id="pdf-sidebar" className="lg:col-span-4 select-none">
              <Card className="border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-slate-200/40 bg-white group transition-all duration-700 hover:shadow-3xl hover:shadow-slate-300/50">
                <CardContent className="p-0">
                  <div id="optimization-score-top" className="bg-gradient-to-br from-white via-slate-50 to-white pt-10 pb-6 relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-16 -mt-16" />
                    <OptimizationScore score={metrics.optimizationScore} />
                  </div>
                  
                  <div className="p-8 sm:p-10 space-y-8 bg-white border-t border-slate-50/50">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-tight uppercase">
                            {businessInfo.name}
                        </h2>
                        <div className="flex items-start gap-2 text-slate-400 font-bold text-[12px] leading-relaxed">
                          <MapPin className="w-3.5 h-3.5 mt-0.5 text-slate-300 shrink-0" />
                          <span className="line-clamp-2">
                             {businessInfo.address}
                          </span>
                        </div>
                      </div>

                      {/* Stars and Reviews */}
                      <div className="flex items-center gap-3 pt-1">
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <Star 
                              key={i} 
                              className={`w-4 h-4 ${i <= Math.floor(businessInfo.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-slate-200 fill-slate-200'}`} 
                            />
                          ))}
                        </div>
                        <div className="flex items-center gap-2 text-slate-400 font-bold text-sm">
                          <span className="text-slate-900 font-black">{businessInfo.rating}</span>
                          <span className="text-slate-300">•</span>
                          <span>{businessInfo.reviewCount} reviews</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6 pt-2">
                      <div className="flex items-center justify-between group cursor-default">
                        <span className="font-bold text-slate-500 text-sm group-hover:text-slate-700 transition-colors">Visibility Score</span>
                        <span className="font-black text-slate-900 text-lg group-hover:text-blue-600 transition-colors">{metrics.visibilityScore}%</span>
                      </div>
                      <div className="flex items-center justify-between group cursor-default">
                        <span className="font-bold text-slate-500 text-sm group-hover:text-slate-700 transition-colors">Average Rank</span>
                        <span className="font-black text-slate-900 text-lg group-hover:text-blue-600 transition-colors">{metrics.averageRank}</span>
                      </div>
                      <div className="flex items-center justify-between group cursor-default">
                        <span className="font-bold text-slate-500 text-sm group-hover:text-slate-700 transition-colors">Top 3 Coverage</span>
                        <span className="font-black text-slate-900 text-lg group-hover:text-blue-600 transition-colors">{metrics.top3Coverage}%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Audit Findings Grid */}
            <div className="lg:col-span-8 space-y-8">
              <div className="flex items-center justify-between px-2">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Audit Results</h2>
                <div className="h-0.5 w-12 bg-blue-600 rounded-full"></div>
              </div>
              <div id="pdf-results">
                <AuditResultsCards auditResults={data.auditResults} />
              </div>
              
              {/* Radial Scan CTA */}
              {metrics.optimizationScore < 95 && (
                <div 
                  id="pdf-cta"
                  className="mt-12 p-8 sm:p-12 rounded-[3rem] bg-slate-900 border-none relative overflow-hidden group cursor-pointer"
                  onClick={() => router.push(`/dashboard/projects/${params.id}`)}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600/30 via-indigo-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                  <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-600/10 rounded-full blur-[80px] group-hover:bg-blue-600/20 transition-all duration-700" />
                  
                  <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="space-y-4 max-w-lg text-center md:text-left">
                        <span className="px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-[0.3em]">
                          Growth Engine
                        </span>
                        <h3 className="text-3xl font-black text-white tracking-tight leading-tight">
                          Unlock market dominance with Multi-Point Scans.
                        </h3>
                        <p className="font-bold text-slate-400 text-base leading-relaxed">
                          Scan targeted keywords across your entire service radius to find ranking gaps and high-intent local customers.
                        </p>
                    </div>
                    <div className="p-6 bg-white/5 rounded-full border border-white/10 group-hover:bg-blue-600 group-hover:border-blue-500 transition-all duration-300">
                        <ChevronRight className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="profile" className="mt-0 ring-offset-0 focus-visible:ring-0">
           <div id="pdf-profile">
              <ProfileTab businessInfo={businessInfo} />
           </div>
        </TabsContent>

        <TabsContent value="competitors" className="mt-0 ring-offset-0 focus-visible:ring-0">
           <div id="pdf-competitors">
              <CompetitorsTab 
                competitors={data.competitors} 
                metrics={metrics} 
                myBusiness={{ name: businessInfo.name, rating: businessInfo.rating, reviewCount: businessInfo.reviewCount }}
                mounted={mounted}
              />
           </div>
        </TabsContent>
      </Tabs>

      {/* --- DEDICATED PDF SOURCE CONTAINER (OFF-SCREEN) --- */}
      <div 
        id="pdf-source-container"
        style={{ 
          position: 'absolute', 
          top: '-10000px', 
          left: '0', 
          width: '1200px', 
          opacity: '1',  // Keep opacity 1 so snapshot is clean
          pointerEvents: 'none', 
          zIndex: '-1000',
          backgroundColor: 'white'
        }} 
      >
         <PDFSourceContainer data={data} mounted={mounted} />
      </div>
    </div>
  )
}

function PDFSourceContainer({ data, mounted }) {
  const { businessInfo, metrics, auditResults, competitors } = data
  const myBusiness = { 
    name: businessInfo.name, 
    rating: businessInfo.rating, 
    reviewCount: businessInfo.reviewCount 
  }

  return (
    <div className="space-y-12">
      <div className="flex gap-10 items-start">
        {/* Page 1: Sidebar Source */}
        <div id="pdf-source-sidebar" className="w-[400px]">
          <Card className="border border-slate-100 rounded-[2.5rem] bg-white">
            <div className="pt-10 pb-6 text-center">
              <OptimizationScore score={metrics.optimizationScore} />
            </div>
            <div className="p-8 space-y-6">
              <h2 className="text-3xl font-black text-slate-900 uppercase">{businessInfo.name}</h2>
              <div className="flex items-center gap-2 text-slate-400 font-bold text-sm">
                <MapPin className="w-3.5 h-3.5" />
                <span>{businessInfo.address}</span>
              </div>
              <div className="space-y-4 pt-4 border-t border-slate-50">
                <div className="flex justify-between"><span className="font-bold text-slate-500">Visibility Score</span><span className="font-black text-slate-900">{metrics.visibilityScore}%</span></div>
                <div className="flex justify-between"><span className="font-bold text-slate-500">Average Rank</span><span className="font-black text-slate-900">{metrics.averageRank}</span></div>
                <div className="flex justify-between"><span className="font-bold text-slate-500">Top 3 Coverage</span><span className="font-black text-slate-900">{metrics.top3Coverage}%</span></div>
              </div>
            </div>
          </Card>
        </div>

        {/* Page 1: Results Source */}
        <div id="pdf-source-results" className="flex-1">
          <AuditResultsCards auditResults={auditResults} />
        </div>
      </div>

      {/* Page 1: CTA Source */}
      <div id="pdf-source-cta" className="p-8 rounded-[3rem] bg-slate-900 text-white">
        <h3 className="text-3xl font-black mb-4">Unlock market dominance with Multi-Point Scans.</h3>
        <p className="font-bold text-slate-400">Scan targeted keywords across your entire service radius to find ranking gaps and high-intent local customers.</p>
      </div>

      <div className="h-20" /> {/* Page Break Spacer */}

      {/* Page 2: Competitors Benchmarking Source */}
      <div id="pdf-source-benchmarking" className="space-y-6">
        <h2 className="text-2xl font-black text-slate-900">Market Benchmarking</h2>
        <Card className="border-2 border-slate-100 rounded-[2rem] p-8 bg-white">
          <div className="h-[300px]">
            {mounted && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { name: 'You', rating: myBusiness.rating, isMe: true },
                  ...(competitors || []).map(c => ({ name: c.name.substring(0, 10), rating: c.rating, isMe: false }))
                ]}>
                  <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 5]} hide />
                  <Bar dataKey="rating" radius={[8, 8, 8, 8]} barSize={40}>
                    {[
                      { name: 'You', rating: myBusiness.rating, isMe: true },
                      ...(competitors || []).map(c => ({ name: c.name, rating: c.rating, isMe: false }))
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.isMe ? '#2563eb' : '#f1f5f9'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      {/* Page 2: Comparison Source */}
      <div id="pdf-source-market-comparison" className="grid grid-cols-3 gap-6">
        {[
          { label: 'Avg. Market Rating', value: metrics.averageCompetitorRating },
          { label: 'Market Leader', value: metrics.topCompetitor?.name || 'Competing' },
          { label: 'Rank Differential', value: metrics.averageRank }
        ].map((m, i) => (
          <Card key={i} className="border-2 border-slate-100 rounded-2xl p-6 bg-white shrink-0">
            <div className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">{m.label}</div>
            <div className="text-xl font-black text-slate-900 truncate">{m.value}</div>
          </Card>
        ))}
      </div>

      {/* Page 2: Table Source */}
      <div id="pdf-source-competitor-directory">
        <Card className="border-2 border-slate-100 rounded-[2rem] bg-white overflow-hidden">
          <div className="p-8 border-b border-slate-50 font-black text-xl">Local Competitor Directory</div>
          <table className="w-full text-left">
            <tr className="bg-slate-50 text-[10px] font-black uppercase text-slate-400">
              <th className="px-8 py-4">Business Detail</th>
              <th className="px-8 py-4 text-center">Trust Metrics</th>
              <th className="px-8 py-4 text-right">Status</th>
            </tr>
            <tr className="bg-blue-50/50">
              <td className="px-8 py-6 font-black">{myBusiness.name} (YOU)</td>
              <td className="px-8 py-6 text-center font-black">{myBusiness.rating} ★</td>
              <td className="px-8 py-6 text-right text-blue-600 font-black">BENCHMARK</td>
            </tr>
            {competitors?.map((comp, idx) => (
              <tr key={idx} className="border-t border-slate-50">
                <td className="px-8 py-6 font-bold">{comp.name}</td>
                <td className="px-8 py-6 text-center font-bold">{comp.rating} ★</td>
                <td className="px-8 py-6 text-right font-bold text-slate-400">COMPETITOR</td>
              </tr>
            ))}
          </table>
        </Card>
      </div>
    </div>
  )
}

function ProfileTab({ businessInfo }) {
  const { name, address, phone, website, status, reviewCount, rating, reviews, photos, googleApiKey } = businessInfo

  const getStatusColor = (status) => {
    switch (status) {
      case 'OPERATIONAL': return 'bg-green-100 text-green-700 border-green-200'
      case 'CLOSED_TEMPORARILY': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'CLOSED_PERMANENTLY': return 'bg-red-100 text-red-700 border-red-200'
      default: return 'bg-slate-100 text-slate-700 border-slate-200'
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Business Information */}
        <Card className="border-2 border-slate-100 rounded-3xl shadow-sm hover:shadow-md transition-all bg-white overflow-hidden">
          <CardHeader className="border-b border-slate-50 bg-slate-50/30 px-6 py-4 sm:px-8 sm:py-6">
            <CardTitle className="text-xl font-black text-slate-900">Business Information</CardTitle>
          </CardHeader>
          <CardContent className="p-6 sm:p-8 space-y-8">
            <div className="grid grid-cols-1 gap-8">
              <InfoItem label="Business Name" value={name} icon={<Tag className="w-4 h-4" />} />
              <InfoItem label="Address" value={address} icon={<MapPin className="w-4 h-4" />} />
              <InfoItem label="Phone" value={phone || 'Not provided'} icon={<Phone className="w-4 h-4" />} />
              <InfoItem 
                label="Website" 
                value={website ? (
                  <a href={website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                    {website.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]} <ExternalLink className="w-3 h-3" />
                  </a>
                ) : 'Not provided'} 
                icon={<Globe className="w-4 h-4" />} 
              />
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status</span>
                <div className="flex">
                  <span className={`px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider ${getStatusColor(status)}`}>
                    {status?.replace(/_/g, ' ') || 'UNKNOWN'}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rating & Reviews */}
        <Card className="border-2 border-slate-100 rounded-3xl shadow-sm hover:shadow-md transition-all bg-white overflow-hidden">
          <CardHeader className="border-b border-slate-50 bg-slate-50/30 px-6 py-4 sm:px-8 sm:py-6">
            <CardTitle className="text-xl font-black text-slate-900">Rating & Reviews</CardTitle>
          </CardHeader>
          <CardContent className="p-6 sm:p-8">
            <div className="flex items-center gap-6 mb-8 pb-8 border-b border-slate-100">
               <div className="text-5xl font-black text-slate-900">{rating}</div>
               <div className="space-y-1">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className={`w-5 h-5 ${i <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-200 fill-slate-200'}`} />
                    ))}
                  </div>
                  <div className="text-slate-500 font-bold text-sm tracking-tight">{reviewCount} reviews</div>
               </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest border-l-4 border-blue-600 pl-3">Recent Reviews</h3>
              <div className="space-y-4">
                {reviews?.length > 0 ? reviews.map((review, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-50/50 border border-slate-100 hover:border-blue-100 transition-colors space-y-2">
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-2">
                          {review.authorPhoto ? (
                             <img src={review.authorPhoto} alt={review.author} className="w-6 h-6 rounded-full" />
                          ) : (
                             <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-black text-blue-600">
                                {review.author[0]}
                             </div>
                          )}
                          <span className="font-bold text-slate-900 text-sm">{review.author}</span>
                       </div>
                       <span className="text-[10px] font-bold text-slate-400 uppercase">{review.relativeTime}</span>
                    </div>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star key={i} className={`w-3 h-3 ${i <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-100 fill-slate-100'}`} />
                      ))}
                    </div>
                    <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed font-medium italic">
                      "{review.text}"
                    </p>
                  </div>
                )) : (
                  <p className="text-slate-400 text-center py-8 font-bold italic">No recent reviews found.</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Photos Section */}
      <Card className="border-2 border-slate-100 rounded-3xl shadow-sm hover:shadow-md transition-all bg-white overflow-hidden">
        <CardHeader className="border-b border-slate-50 bg-slate-50/30 flex flex-row items-center justify-between px-6 py-4 sm:px-8 sm:py-6">
          <CardTitle className="text-xl font-black text-slate-900 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-blue-600" /> Photos ({photos?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 sm:p-8">
           <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {photos?.length > 0 ? photos.map((photo, idx) => (
                <div key={idx} className="aspect-square rounded-2xl overflow-hidden border border-slate-100 bg-slate-50 group relative">
                   <img 
                      src={`https://places.googleapis.com/v1/${photo.name}/media?key=${googleApiKey}&maxWidthPx=400`} 
                      alt={`Business photo ${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                   />
                   <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />
                </div>
              )) : (
                <div className="col-span-full py-20 text-center flex flex-col items-center gap-4">
                   <ImageIcon className="w-12 h-12 text-slate-200" />
                   <p className="text-slate-400 font-bold italic">No business photos available.</p>
                </div>
              )}
           </div>
        </CardContent>
      </Card>
    </div>
  )
}

function CompetitorsTab({ competitors, metrics, myBusiness, mounted }) {
  const { averageCompetitorRating, topCompetitor } = metrics

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left: Benchmarking Chart */}
        <div id="pdf-benchmarking" className="lg:col-span-7 space-y-6">
           <div className="flex items-center justify-between px-2">
              <div>
                 <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                   <BarChart2 className="w-6 h-6 text-blue-600" /> Market Benchmarking
                 </h2>
                 <p className="text-slate-500 font-bold text-sm">Rating performance against top 5 local rivals.</p>
              </div>
           </div>
           
           <Card className="border-2 border-slate-100 rounded-[2rem] p-8 shadow-sm bg-white overflow-hidden relative">
              <div className="w-full mt-4">
                {mounted && (
                  <ResponsiveContainer width="100%" height={300} minWidth={0}>
                    <BarChart data={[
                      { name: 'You', rating: myBusiness.rating, isMe: true },
                      ...(competitors || []).map(c => ({ name: c.name.substring(0, 10) + '...', rating: c.rating, isMe: false }))
                    ]}>
                      <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontWeight: 700}} />
                      <YAxis domain={[0, 5]} hide />
                      <RechartsTooltip 
                        cursor={{fill: 'transparent'}}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-slate-900 px-4 py-2 rounded-xl shadow-2xl border border-white/10">
                                <p className="text-white font-black text-xs">{payload[0].payload.name}</p>
                                <p className="text-blue-400 font-black text-sm">{payload[0].value} Stars</p>
                              </div>
                            )
                          }
                          return null
                        }}
                      />
                      <Bar dataKey="rating" radius={[8, 8, 8, 8]} barSize={40}>
                        {[
                          { name: 'You', rating: myBusiness.rating, isMe: true },
                          ...(competitors || []).map(c => ({ name: c.name, rating: c.rating, isMe: false }))
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.isMe ? '#2563eb' : '#f1f5f9'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
           </Card>
        </div>

        {/* Right: Metrics & Target */}
        <div id="pdf-market-comparison" className="lg:col-span-5 space-y-6">
           <h2 className="text-2xl font-black text-slate-900 tracking-tight px-2">Market Comparison</h2>
           <div className="grid grid-cols-1 gap-4">
              {[
                { label: 'Avg. Market Rating', value: averageCompetitorRating, icon: <Users className="w-5 h-5 text-blue-600" />, desc: 'Mean rating of top rivals' },
                { label: 'Market Leader', value: topCompetitor?.name || 'Competing', icon: <Trophy className="w-5 h-5 text-indigo-600" />, desc: 'Highest rated business' },
                { label: 'Rank Differential', value: metrics.averageRank, icon: <TrendingUp className="w-5 h-5 text-emerald-600" />, desc: 'Your average proximity' }
              ].map((m, i) => (
                <Card key={i} className="border-2 border-slate-100 rounded-2xl p-6 shadow-sm hover:border-blue-100 transition-colors flex items-center gap-5">
                   <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center shrink-0">
                      {m.icon}
                   </div>
                   <div className="overflow-hidden">
                      <div className="text-slate-400 text-[10px] font-black uppercase tracking-widest leading-none mb-1">{m.label}</div>
                      <div className="text-xl font-black text-slate-900 truncate">{m.value}</div>
                      <div className="text-slate-500 text-[10px] font-bold italic">{m.desc}</div>
                   </div>
                </Card>
              ))}
           </div>
        </div>
      </div>

      {/* Competitor List */}
      <Card id="pdf-competitor-directory" className="border-2 border-slate-100 rounded-[2rem] shadow-sm bg-white overflow-hidden">
        <CardHeader className="border-b border-slate-50 bg-slate-50/30 px-8 py-6">
          <CardTitle className="text-xl font-black text-slate-900">Local Competitor Directory</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Business Detail</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Trust Metrics</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Comparison</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Analysis</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {/* My Business Highlight */}
                <tr className="bg-blue-600/5">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-500/20">
                          <LayoutDashboard className="w-5 h-5" />
                       </div>
                       <div>
                          <div className="font-black text-slate-900">{myBusiness.name}</div>
                          <div className="text-[10px] text-blue-600 font-black uppercase tracking-widest">Target Entity (Active)</div>
                       </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col items-center">
                       <div className="flex items-center gap-1.5 font-black text-slate-900 text-lg">
                         <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" /> {myBusiness.rating}
                       </div>
                       <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{myBusiness.reviewCount} Reviews</div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center justify-center">
                       <span className="px-5 py-2 rounded-2xl bg-white border border-blue-200 text-blue-600 text-xs font-black shadow-sm">BENCHMARK</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex flex-col items-end">
                       <span className="text-emerald-500 font-black text-xs flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" /> Healthy
                       </span>
                    </div>
                  </td>
                </tr>
                {/* Competitors List */}
                {competitors?.map((comp, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-all group">
                    <td className="px-8 py-6">
                      <div className="font-black text-slate-900 group-hover:text-blue-600 transition-colors">{comp.name}</div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 line-clamp-1">{comp.address}</p>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col items-center">
                         <div className="flex items-center gap-1.5 font-black text-slate-900 text-lg group-hover:scale-110 transition-transform">
                           <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" /> {comp.rating}
                         </div>
                         <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{comp.reviewCount} Reviews</div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center justify-center">
                         {comp.rating > myBusiness.rating ? (
                           <span className="text-red-500 font-black text-xs flex items-center gap-1.5 bg-red-50 px-3 py-1.5 rounded-xl border border-red-100">
                             <TrendingUp className="w-4 h-4" /> Higher Rated
                           </span>
                         ) : comp.rating < myBusiness.rating ? (
                           <span className="text-emerald-500 font-black text-xs flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">
                             <TrendingDown className="w-4 h-4" /> Lower Rated
                           </span>
                         ) : (
                           <span className="text-slate-400 font-black text-xs bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">Competitive Neutral</span>
                         )}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                       {comp.rating >= 4.5 ? (
                         <span className="text-slate-900 font-black text-xs flex items-center justify-end gap-1.5">
                           <TrendingUp className="w-4 h-4 text-blue-600" /> Strong Rival
                         </span>
                       ) : (
                         <span className="text-slate-400 font-bold text-xs">Standard Competitor</span>
                       )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function InfoItem({ label, value, icon }) {
  return (
    <div className="space-y-2 group cursor-default">
      <div className="flex items-center gap-2 text-slate-400">
         {icon}
         <span className="text-xs font-bold uppercase tracking-widest">{label}</span>
      </div>
      <div className="text-slate-900 font-bold tracking-tight group-hover:text-blue-600 transition-colors">
        {value}
      </div>
    </div>
  )
}
