'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Loader2, MapPin, Building2, Zap, 
  Settings, ChevronDown, ChevronUp, Plus, X, 
  RefreshCw, Layers, ArrowLeft
} from 'lucide-react'
import { toast } from 'sonner'
import GoogleMap from '@/components/GoogleMap'
import { calculateAnalytics } from '@/lib/grid-utils'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { Download } from 'lucide-react'

export default function ScanResultsPage() {
  const router = useRouter()
  const params = useParams()
  const scanId = params.id

  const [loading, setLoading] = useState(true)
  const [mapType, setMapType] = useState('roadmap')
  const [scanData, setScanData] = useState(null)
  
  // Builder shape states
  const [selectedBusiness, setSelectedBusiness] = useState(null)
  const [keywords, setKeywords] = useState([])
  const [heatmapPins, setHeatmapPins] = useState([])
  const [scanAnalytics, setScanAnalytics] = useState(null)
  const [rescanLoading, setRescanLoading] = useState(false)

  const [viewMode, setViewMode] = useState('single') // 'single' or 'overall'
  const [projectId, setProjectId] = useState(null)

  useEffect(() => {
    fetchScanResults()
  }, [scanId, viewMode])

  const fetchScanResults = async () => {
    try {
      setLoading(true)
      let url = `/api/scans/${scanId}/results`
      
      // If we've already loaded once and know the project ID, we can do overall
      if (viewMode === 'overall' && projectId) {
        url = `/api/projects/${projectId}/results`
      }

      const response = await fetch(url)
      if (!response.ok) throw new Error('Failed to load results')
      
      const data = await response.json()
      setScanData(data)
      if (data.project?.id) setProjectId(data.project.id)

      // Transform data into the Heatmap Builder format
      if (data.project) {
        setSelectedBusiness({
          name: data.project.businessName,
          address: data.project.address,
          latitude: Number(data.project.latitude),
          longitude: Number(data.project.longitude),
          placeId: data.project.businessId
        })
        setKeywords(data.project.keywords || [])
      }

      if (data.results && data.results.length > 0) {
        const analytics = calculateAnalytics(data.results)
        setScanAnalytics(analytics)

        // Generate the pins directly from results
        const pins = data.results.map((result, index) => ({
          id: `pin-${index}`,
          latitude: Number(result.latitude),
          longitude: Number(result.longitude),
          rank: result.rank,
          found: result.found,
          keyword: result.keyword || (viewMode === 'overall' ? 'Multiple' : '')
        }))
        setHeatmapPins(pins)
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to load scan results')
    } finally {
      setLoading(false)
    }
  }

  const handleRescan = async () => {
    if (!scanData?.scanJob) return
    
    setRescanLoading(true)
    try {
      const response = await fetch('/api/scans/rescan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          projectId: scanData.scanJob.projectId,
          keywordId: scanData.scanJob.keywordId
        })
      })
      
      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Failed to trigger rescan')
      }
      
      const data = await response.json()
      toast.success('Rescan started!')
      
      // Redirect to the "New Project" page but with a special flag to observe the existing scan
      // Or we can just stay here and poll? 
      // The user experience in the "New Project" page is better for observing.
      // But we can also just refresh this page if it's already set up for polling.
      // Since this page doesn't currently poll, let's redirect to dashboard/projects/new with the jobId
      router.push(`/dashboard/projects/new?rescanJobId=${data.scanJobId}`)
    } catch (error) {
      console.error('Rescan error:', error)
      toast.error(error.message)
    } finally {
      setRescanLoading(false)
    }
  }
  
  const [downloadLoading, setDownloadLoading] = useState(false)

  const handleDownloadPDF = async () => {
    try {
      setDownloadLoading(true)
      const doc = new jsPDF('p', 'mm', 'a4')
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      
      // Helper to load image
      const loadImage = (src) => {
        return new Promise((resolve, reject) => {
          const img = new Image()
          img.crossOrigin = 'Anonymous'
          img.onload = () => resolve(img)
          img.onerror = reject
          img.src = src
        })
      }

      // 1. Header with Logo
      // Background for header
      doc.setFillColor(15, 23, 42) // Slate 900
      doc.rect(0, 0, pageWidth, 45, 'F')
      
      try {
        const logoImg = await loadImage('/logo.png')
        doc.addImage(logoImg, 'PNG', 15, 8, 35, 25)
      } catch (e) {
        console.warn('Could not load logo for PDF', e)
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(18)
        doc.text('Ringscale AI', 15, 22)
      }
      
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(24)
      doc.setFont('helvetica', 'bold')
      doc.text('Local SEO Heatmap Report', 60, 22)
      
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(148, 163, 184)
      doc.text(`Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 60, 30)
      doc.text(`Scan ID: ${scanId.substring(0, 8).toUpperCase()}`, 60, 35)
      
      let y = 60
      
      // 2. Business & Keyword Details (Side by Side)
      doc.setTextColor(37, 99, 235) // Blue 600
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.text('BUSINESS PROFILE', 15, y)
      doc.text('TARGET KEYWORD', pageWidth / 2 + 10, y)
      y += 6
      
      doc.setTextColor(15, 23, 42)
      doc.setFontSize(14)
      doc.text(selectedBusiness.name, 15, y)
      
      const currentKeyword = viewMode === 'overall' 
        ? 'Overall Results (Best Ranks)'
        : scanData.projectScans?.find(ps => String(ps.scanId) === String(scanId))?.keyword || 'Individual Scan'
      doc.text(currentKeyword, pageWidth / 2 + 10, y)
      y += 6
      
      doc.setFontSize(9)
      doc.setTextColor(100, 116, 139)
      doc.setFont('helvetica', 'normal')
      doc.text(selectedBusiness.address || 'N/A', 15, y, { maxWidth: 85 })
      y += 15
      
      // 3. Analytics Summary (Cards)
      if (scanAnalytics) {
        const cardWidth = (pageWidth - 40) / 4
        const cardHeight = 25
        const cards = [
          { label: 'VISIBILITY', value: `${scanAnalytics.visibilityScore}%`, color: [37, 99, 235] },
          { label: 'AVG. RANK', value: `${scanAnalytics.averageRank || 'N/A'}`, color: [15, 23, 42] },
          { label: 'BEST RANK', value: `#${scanAnalytics.bestRank || '-'}`, color: [22, 163, 74] },
          { label: 'TOTAL POINTS', value: `${scanAnalytics.totalPoints}`, color: [15, 23, 42] }
        ]
        
        cards.forEach((card, i) => {
          const x = 15 + (i * (cardWidth + 3.3))
          doc.setFillColor(248, 250, 252) // Slate 50
          doc.roundedRect(x, y, cardWidth, cardHeight, 2, 2, 'F')
          doc.setDrawColor(226, 232, 240) // Slate 200
          doc.roundedRect(x, y, cardWidth, cardHeight, 2, 2, 'S')
          
          doc.setFontSize(7)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(100, 116, 139)
          doc.text(card.label, x + cardWidth/2, y + 8, { align: 'center' })
          
          doc.setFontSize(12)
          doc.setTextColor(...card.color)
          doc.text(card.value, x + cardWidth/2, y + 18, { align: 'center' })
        })
        
        y += 40
      }
      
      // 4. Map Image
      doc.setTextColor(37, 99, 235)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text('LOCAL RANKING HEATMAP', 15, y)
      y += 8
      
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY
      if (apiKey && selectedBusiness) {
        const mapWidth = 800
        const mapHeight = 500
        const businessMarker = `markers=color:red|label:B|${selectedBusiness.latitude},${selectedBusiness.longitude}`
        
        const colorGroups = {
          '0x22c55e': [], // Top 3 (Green)
          '0xeab308': [], // Top 10 (Yellow)
          '0xf97316': [], // Top 20 (Orange)
          '0x94a3b8': []  // 20+ (Gray)
        }
        
        const pinsToRender = heatmapPins.slice(0, 120) // Slightly more pins
        pinsToRender.forEach(p => {
          let color = '0x3b82f6'
          if (p.rank <= 3) color = '0x22c55e'
          else if (p.rank <= 10) color = '0xeab308'
          else if (p.rank < 20) color = '0xf97316'
          else color = '0x94a3b8'
          if (colorGroups[color]) colorGroups[color].push(`${p.latitude},${p.longitude}`)
        })
        
        let markersUrl = businessMarker
        Object.entries(colorGroups).forEach(([color, points]) => {
          if (points.length > 0) markersUrl += `&markers=size:tiny|color:${color}|${points.join('|')}`
        })
        
        const staticMapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${selectedBusiness.latitude},${selectedBusiness.longitude}&zoom=14&size=${mapWidth}x${mapHeight}&maptype=${mapType}&format=png8&key=${apiKey}&${markersUrl}`
        const proxyUrl = `/api/proxy/image?url=${encodeURIComponent(staticMapUrl)}`
        
        const response = await fetch(proxyUrl)
        if (!response.ok) throw new Error(`Map proxy failed: ${response.status}`)
        
        const blob = await response.blob()
        const reader = new FileReader()
        const base64Promise = new Promise((resolve) => {
          reader.onloadend = () => resolve(reader.result)
          reader.readAsDataURL(blob)
        })
        const base64Data = await base64Promise
        
        const imgWidth = pageWidth - 30
        const imgHeight = (imgWidth * mapHeight) / mapWidth
        
        // Add subtle shadow/border to map
        doc.setDrawColor(226, 232, 240)
        doc.rect(14.5, y - 0.5, imgWidth + 1, imgHeight + 1, 'S')
        doc.addImage(base64Data, 'PNG', 15, y, imgWidth, imgHeight)
        
        y += imgHeight + 15
      }
      
      // 5. Legend & Footer
      doc.setTextColor(37, 99, 235)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.text('RANKING LEGEND', 15, y)
      y += 8
      
      const legendItems = [
        { color: [34, 197, 94], label: 'Top 3 Ranking' },
        { color: [234, 179, 8], label: 'Top 10 Ranking' },
        { color: [249, 115, 22], label: 'Top 20 Ranking' },
        { color: [148, 163, 184], label: '20+ / Not Found' }
      ]
      
      legendItems.forEach((item, i) => {
        const lx = 15 + (i * 45)
        doc.setFillColor(...item.color)
        doc.circle(lx + 2, y - 1, 1.5, 'F')
        doc.setTextColor(100, 116, 139)
        doc.setFontSize(8)
        doc.setFont('helvetica', 'normal')
        doc.text(item.label, lx + 6, y)
      })

      // 6. Competitive Analysis Page
      if (scanData?.topCompetitors?.length > 0) {
        doc.addPage()
        
        // Header for new page
        doc.setFillColor(15, 23, 42)
        doc.rect(0, 0, pageWidth, 25, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(16)
        doc.setFont('helvetica', 'bold')
        doc.text('Competitive Analysis', 15, 17)
        
        let cy = 40
        doc.setTextColor(37, 99, 235)
        doc.setFontSize(10)
        doc.text('TOP 10 LOCAL COMPETITORS', 15, cy)
        cy += 10
        
        // Table Header
        doc.setFillColor(248, 250, 252)
        doc.rect(15, cy, pageWidth - 30, 8, 'F')
        doc.setTextColor(100, 116, 139)
        doc.setFontSize(8)
        doc.text('RANK', 18, cy + 5)
        doc.text('BUSINESS NAME & ADDRESS', 35, cy + 5)
        doc.text('AVG RANK', pageWidth - 45, cy + 5)
        doc.text('VISIBILITY', pageWidth - 25, cy + 5)
        cy += 12
        
        // Table Rows
        scanData.topCompetitors.forEach((comp, idx) => {
          if (cy > pageHeight - 40) {
            doc.addPage()
            cy = 20
          }
          
          doc.setTextColor(15, 23, 42)
          doc.setFontSize(9)
          doc.setFont('helvetica', 'bold')
          doc.text(`#${idx + 1}`, 18, cy)
          
          doc.text(comp.name, 35, cy)
          
          doc.setFontSize(7)
          doc.setFont('helvetica', 'normal')
          doc.setTextColor(100, 116, 139)
          const addr = comp.address || 'Address not available'
          const splitAddr = doc.splitTextToSize(addr, pageWidth - 90)
          doc.text(splitAddr, 35, cy + 4)
          
          doc.setFontSize(9)
          doc.setTextColor(15, 23, 42)
          doc.text(`${Math.round(comp.avgRank || comp.rank)}`, pageWidth - 45, cy + 2)
          doc.text(`${comp.appearances}`, pageWidth - 25, cy + 2)
          
          doc.setDrawColor(241, 245, 249)
          doc.line(15, cy + 10, pageWidth - 15, cy + 10)
          
          cy += 15
        })
      }

      const path = typeof window !== 'undefined' ? window.location.pathname : ''
      const isIndiaPath = path.startsWith('/in/') || path === '/in'
      const isUsPath = path.startsWith('/us/') || path === '/us'
      
      const userTz = Intl.DateTimeFormat().resolvedOptions().timeZone
      const isIndiaTz = userTz.includes('Calcutta') || userTz.includes('Kolkata') || userTz.includes('Asia/Kolkata')
      
      const isIndiaDoc = isIndiaPath ? true : isUsPath ? false : isIndiaTz
      const companyAddress = isIndiaDoc 
        ? "P-10 Patel Nagar, New Delhi, 110008" 
        : "1470 HurOntario St Mississauga Ontario L5G 3H4"

      // Footer
      const finalPageCount = doc.internal.getNumberOfPages()
      for (let i = 1; i <= finalPageCount; i++) {
        doc.setPage(i)
        const fY = pageHeight - 20
        doc.setDrawColor(241, 245, 249)
        doc.line(15, fY - 5, pageWidth - 15, fY - 5)
        
        doc.setFontSize(7)
        doc.setTextColor(148, 163, 184)
        doc.text(`Page ${i} of ${finalPageCount}`, pageWidth / 2, fY + 8, { align: 'center' })
        
        // Brand & Address on every page
        doc.text('© 2026 Ringscale AI - Local SEO Growth Engine', 15, fY)
        doc.text('Support: info@ringscale.ai | ringscale.ai', pageWidth - 15, fY, { align: 'right' })
        doc.text(companyAddress, 15, fY + 4)
      }
      
      const fileName = `SEO_Heatmap_${selectedBusiness.name.replace(/[^a-z0-9]/gi, '_')}.pdf`
      doc.save(fileName)
      toast.success('Professional report generated!')
    } catch (error) {
      console.error('PDF Export Error:', error)
      toast.error(`Failed to generate report: ${error.message}`)
    } finally {
      setDownloadLoading(false)
    }
  }

  // Mobile UI
  const [showMobileSettings, setShowMobileSettings] = useState(false)

  if (loading) {
    return (
      <div className="h-[calc(100vh-56px)] lg:h-screen flex items-center justify-center -m-4 md:-m-6 bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  if (!scanData) {
    return (
      <div className="h-[calc(100vh-56px)] lg:h-screen flex flex-col items-center justify-center -m-4 md:-m-6 bg-slate-50 gap-6 p-6 text-center">
        <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-2">
          <X className="w-10 h-10 text-slate-400" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-800">Scan Results Unavailable</h2>
          <p className="text-slate-500 max-w-sm mx-auto">
            We couldn't find the scan results you're looking for. This might happen if the scan is still being processed or was deleted.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button variant="outline" onClick={() => router.push('/dashboard')}>Return to Dashboard</Button>
          <Button onClick={fetchScanResults} className="bg-blue-600 hover:bg-blue-700">
            <RefreshCw className="w-4 h-4 mr-2" /> Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full -m-4 md:-m-6 bg-white lg:bg-slate-50 relative overflow-hidden">
      <div className="flex flex-col lg:flex-row h-full relative overflow-hidden">
        
        {/* Map Center Area (Top on Mobile, flex-1 on Desktop) */}
        <main className="w-full lg:flex-1 h-[40vh] lg:h-auto relative bg-slate-100 order-1 lg:order-2 border-b lg:border-b-0 border-slate-200">
          {selectedBusiness && (
            <GoogleMap 
              markers={[
                { ...selectedBusiness, selected: true },
                ...heatmapPins
              ]}
              onMarkerClick={() => {}}
              mapType={mapType}
            />
          )}

          {/* Map Overlay Controls */}
          <div className="absolute top-4 right-4 flex flex-col gap-2 scale-90 sm:scale-100">
            <button 
              onClick={() => setMapType(mapType === 'roadmap' ? 'satellite' : 'roadmap')}
              className="w-10 h-10 bg-white border border-slate-200 rounded-xl shadow-xl flex items-center justify-center hover:bg-slate-50 transition active:scale-95 overflow-hidden group"
              title={mapType === 'roadmap' ? 'Satellite View' : 'Roadmap View'}
            >
              {mapType === 'roadmap' ? (
                <Layers className="w-5 h-5 text-slate-600 group-hover:text-blue-600 transition-colors" />
              ) : (
                <Building2 className="w-5 h-5 text-slate-600 group-hover:text-blue-600 transition-colors" />
              )}
            </button>
            <button 
              onClick={() => {
                if (selectedBusiness) {
                  // Trigger re-center
                  setHeatmapPins([...heatmapPins])
                }
              }}
              className="w-10 h-10 bg-white border border-slate-200 rounded-xl shadow-xl flex items-center justify-center hover:bg-slate-50 transition active:scale-95 group"
              title="Center Map"
            >
              <MapPin className="w-5 h-5 text-slate-600 group-hover:text-blue-600 transition-colors" />
            </button>
          </div>
        </main>
        
        {/* Left Sidebar (Below Map on Mobile, Side on Desktop) */}
        <aside className="w-full lg:w-[350px] xl:w-[400px] bg-white border-r lg:border-r border-slate-200 overflow-hidden shadow-xl flex flex-col order-2 lg:order-1 h-full">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h2 className="font-bold text-slate-800 flex items-center gap-2 text-base">
              <Link href="/dashboard" className="mr-1 text-slate-500 hover:text-blue-600 transition">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <Layers className="w-5 h-5 text-blue-600" />
              Scan Result Viewer
            </h2>
            <Link href="/dashboard/projects/new">
              <Button variant="ghost" size="sm" className="h-8 px-3 text-blue-600 font-bold bg-blue-50 hover:bg-blue-100">
                <Plus className="w-3.5 h-3.5 mr-1.5" /> New
              </Button>
            </Link>
          </div>

          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Target Business Details */}
            {selectedBusiness && (
              <div className="p-4 border-b border-slate-100 space-y-3">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Target Business</label>
                <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 space-y-2">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white border border-blue-200 flex items-center justify-center shrink-0">
                      <Building2 className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-slate-900 truncate">{selectedBusiness.name}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {selectedBusiness.address?.split(',')[0]}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Keywords Scanned</label>
                  <div className="relative group">
                    <select
                      className="w-full bg-white border border-blue-200 rounded-xl px-3 py-2.5 text-sm font-bold text-blue-700 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer shadow-sm hover:border-blue-300 transition-all pr-10"
                      value={viewMode === 'overall' ? 'overall' : scanId}
                      onChange={(e) => {
                        const val = e.target.value
                        if (val === 'overall') {
                          setViewMode('overall')
                        } else {
                          setViewMode('single')
                          if (val !== scanId) {
                            router.push(`/dashboard/scans/${val}`)
                          }
                        }
                      }}
                    >
                      <option value="overall" className="font-bold text-blue-800">✨ Overall Results (Best Rank)</option>
                      <hr className="my-1 border-slate-100" />
                      {scanData.projectScans?.map((ps) => (
                        <option key={ps.keywordId} value={ps.scanId || ''} disabled={!ps.scanId}>
                          {ps.keyword} {ps.status === 'processing' ? '(Scanning...)' : ps.status === 'none' ? '(No scans)' : ''}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-blue-400 group-hover:text-blue-500 transition-colors">
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Results Section (Scrollable Area) */}
            <div className="flex-1 overflow-y-auto min-h-0">
              <div className="w-full px-4 py-3 flex items-center justify-between bg-slate-50/50 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-blue-600" />
                  <span className="font-semibold text-sm text-slate-700">Scan Analytics</span>
                </div>
              </div>

              {scanAnalytics ? (
                <div className="p-4 space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                  {/* Performance Overview */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
                      <div className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Visibility</div>
                      <div className="text-xl font-black text-blue-700">{scanAnalytics.visibilityScore}%</div>
                    </div>
                    <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
                      <div className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Avg. Rank</div>
                      <div className="text-xl font-black text-blue-700">{scanAnalytics.averageRank || 'N/A'}</div>
                    </div>
                  </div>

                  {/* Distribution */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rank Distribution</label>
                    <div className="space-y-2">
                      {[
                        { label: 'Top 3', count: Math.round(scanAnalytics.top3Percentage * scanAnalytics.totalPoints / 100), color: 'bg-emerald-500' },
                        { label: 'Top 10', count: Math.round(scanAnalytics.top10Percentage * scanAnalytics.totalPoints / 100), color: 'bg-yellow-500' },
                        { label: 'Top 20', count: Math.round(scanAnalytics.top20Percentage * scanAnalytics.totalPoints / 100), color: 'bg-orange-500' },
                        { label: '20+', count: scanAnalytics.notFoundCount, color: 'bg-slate-400' }
                      ].map((item) => (
                        <div key={item.label} className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${item.color}`} />
                          <div className="text-xs font-semibold text-slate-600 flex-1">{item.label}</div>
                          <div className="text-xs font-bold text-slate-800">{item.count} pins</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Highlights */}
                  <div className="p-4 rounded-xl bg-slate-900 text-white space-y-3 shadow-lg">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-yellow-400" />
                      <span className="text-sm font-bold">Search Insights</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">Best Rank</span>
                        <span className="font-bold text-emerald-400">#{scanAnalytics.bestRank || '-'}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">Total Points</span>
                        <span className="font-bold">{scanAnalytics.totalPoints}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">Location</span>
                        <span className="font-bold truncate max-w-[150px] text-right">{selectedBusiness?.name}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4">
                  <p className="text-sm text-slate-500">No analytics data available for this scan.</p>
                </div>
              )}

              {/* Top 10 Competitors Section */}
              {scanData?.topCompetitors?.length > 0 && (
                <div className="p-4 space-y-4 border-t border-slate-100 bg-slate-50/30">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    <span className="font-bold text-sm text-slate-800 uppercase tracking-tight">Competitive Analysis</span>
                  </div>
                  
                  <div className="space-y-3">
                    {scanData.topCompetitors.map((comp, idx) => (
                      <div key={comp.placeId} className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm hover:border-blue-200 transition-colors group">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="text-xs font-black text-slate-900 truncate flex items-center gap-1.5">
                              <span className="text-blue-600">#{idx + 1}</span> {comp.name}
                            </div>
                            <div className="text-[10px] text-slate-500 mt-1 flex items-start gap-1">
                              <MapPin className="w-3 h-3 mt-0.5 shrink-0" />
                              <span className="line-clamp-2">{comp.address || 'Address not available'}</span>
                            </div>
                          </div>
                          <div className="shrink-0 flex flex-col items-end gap-1">
                            <div className="bg-blue-50 text-blue-700 text-[10px] font-black px-2 py-0.5 rounded-md border border-blue-100 italic">
                               Avg Rank: {Math.round(comp.avgRank || comp.rank)}
                            </div>
                            <div className="text-[9px] font-bold text-slate-400">
                              {comp.appearances} appearances
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="p-4 mt-auto border-t border-slate-100 bg-slate-50/30">
                <Button 
                  onClick={handleRescan}
                  disabled={rescanLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-6 rounded-xl shadow-lg shadow-blue-200 flex items-center justify-center gap-2 group mb-3"
                >
                  {rescanLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                  )}
                  {rescanLoading ? 'Starting Scan...' : 'Rescan Keyword Now'}
                </Button>

                <Button 
                  onClick={handleDownloadPDF}
                  disabled={downloadLoading}
                  variant="outline"
                  className="w-full border-blue-200 bg-white hover:bg-blue-50 text-blue-700 font-bold py-6 rounded-xl shadow-sm flex items-center justify-center gap-2 group"
                >
                  {downloadLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Download className="w-5 h-5 group-hover:-translate-y-1 transition-transform" />
                  )}
                  {downloadLoading ? 'Generating Report...' : 'Download Results PDF'}
                </Button>
                
                <p className="text-[10px] text-center text-slate-400 mt-3 font-medium">
                  PDF contains map heatmap and performance analytics
                </p>
              </div>
            </div>
          </div>
        </aside>

        </div>
      </div>
    )
  }
