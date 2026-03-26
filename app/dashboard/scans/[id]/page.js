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
          latitude: result.latitude,
          longitude: result.longitude,
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
      
      // 1. Header
      doc.setFillColor(15, 23, 42) // Slate 900
      doc.rect(0, 0, pageWidth, 40, 'F')
      
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(22)
      doc.setFont('helvetica', 'bold')
      doc.text('Local SEO Heatmap Report', 15, 22)
      
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text(`Generated on ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 15, 30)
      
      let y = 55
      
      // 2. Business Details
      doc.setTextColor(51, 65, 85) // Slate 700
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text('BUSINESS DETAILS', 15, y)
      y += 8
      
      doc.setFontSize(14)
      doc.setTextColor(15, 23, 42)
      doc.text(selectedBusiness.name, 15, y)
      y += 6
      
      doc.setFontSize(10)
      doc.setTextColor(100, 116, 139)
      doc.text(selectedBusiness.address || 'N/A', 15, y)
      y += 12
      
      // 3. Keyword Info
      const currentKeyword = viewMode === 'overall' 
        ? 'Overall Results (Best Ranks)'
        : scanData.projectScans?.find(ps => String(ps.scanId) === String(scanId))?.keyword || 'Individual Scan'
      
      doc.setTextColor(51, 65, 85)
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text('TARGET KEYWORD', 15, y)
      y += 8
      
      doc.setFontSize(16)
      doc.setTextColor(37, 99, 235) // Blue 600
      doc.text(currentKeyword, 15, y)
      y += 15
      
      // 4. Analytics Summary
      if (scanAnalytics) {
        doc.setFillColor(248, 250, 252) // Slate 50
        doc.roundedRect(12, y - 5, pageWidth - 24, 35, 3, 3, 'F')
        
        doc.setTextColor(100, 116, 139)
        doc.setFontSize(9)
        doc.text('VISIBILITY SCORE', 20, y + 5)
        doc.text('AVG. RANK', 65, y + 5)
        doc.text('BEST RANK', 110, y + 5)
        doc.text('TOTAL POINTS', 155, y + 5)
        
        doc.setTextColor(15, 23, 42)
        doc.setFontSize(18)
        doc.setFont('helvetica', 'bold')
        doc.text(`${scanAnalytics.visibilityScore}%`, 20, y + 15)
        doc.text(`${scanAnalytics.averageRank || 'N/A'}`, 65, y + 15)
        doc.text(`#${scanAnalytics.bestRank || '-'}`, 110, y + 15)
        doc.text(`${scanAnalytics.totalPoints}`, 155, y + 15)
        
        y += 45
      }
      
      // 5. Map Image (Static Maps)
      doc.setTextColor(51, 65, 85)
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text('RANKING HEATMAP', 15, y)
      y += 8
      
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY
      if (apiKey && selectedBusiness) {
        // Construct Static Map URL
        const mapWidth = 800
        const mapHeight = 500
        
        // Build markers
        const businessMarker = `markers=color:red|label:B|${selectedBusiness.latitude},${selectedBusiness.longitude}`
        
        // Group pins by color to save URL space (cap at 150 for URL length limits)
        const colorGroups = {
          '0x22c55e': [], // Top 3 (Green)
          '0xeab308': [], // Top 10 (Yellow)
          '0xf97316': [], // Top 20 (Orange)
          '0x94a3b8': []  // 20+ (Gray)
        }
        
        const pinsToRender = heatmapPins.slice(0, 100)
        pinsToRender.forEach(p => {
          let color = '0x3b82f6' // Default blue
          if (p.rank <= 3) color = '0x22c55e'
          else if (p.rank <= 10) color = '0xeab308'
          else if (p.rank < 20) color = '0xf97316'
          else color = '0x94a3b8'
          
          if (colorGroups[color]) {
            colorGroups[color].push(`${p.latitude},${p.longitude}`)
          }
        })
        
        let markersUrl = businessMarker
        Object.entries(colorGroups).forEach(([color, points]) => {
          if (points.length > 0) {
            // Static Maps limits the number of pins per 'markers' param to some extent, 
            // but usually it's the URL length that's the real limit.
            // We'll chunk if needed, but for 7x7/13x13 it should be fine in one go.
            markersUrl += `&markers=size:tiny|color:${color}|${points.join('|')}`
          }
        })
        
        const staticMapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${selectedBusiness.latitude},${selectedBusiness.longitude}&zoom=14&size=${mapWidth}x${mapHeight}&maptype=${mapType}&format=png8&key=${apiKey}&${markersUrl}`
        
        // Use our proxy to bypass CORS
        const proxyUrl = `/api/proxy/image?url=${encodeURIComponent(staticMapUrl)}`
        
        const response = await fetch(proxyUrl)
        if (!response.ok) {
          const err = await response.json().catch(() => ({ error: 'Unknown proxy error' }))
          throw new Error(err.error || `Map proxy failed with status ${response.status}`)
        }
        
        const blob = await response.blob()
        if (!blob.type.startsWith('image/')) {
          const text = await blob.text()
          throw new Error('Proxy returned non-image data: ' + text.substring(0, 100))
        }

        const reader = new FileReader()
        
        const base64Promise = new Promise((resolve) => {
          reader.onloadend = () => resolve(reader.result)
          reader.readAsDataURL(blob)
        })
        
        const base64Data = await base64Promise
        
        const imgWidth = pageWidth - 30
        const imgHeight = (imgWidth * mapHeight) / mapWidth
        doc.addImage(base64Data, 'PNG', 15, y, imgWidth, imgHeight)
        
        y += imgHeight + 15
      } else {
        doc.setTextColor(239, 68, 68)
        doc.text('Map preview unavailable in PDF.', 15, y)
        y += 10
      }
      
      // 6. Legend
      if (y > 250) {
        doc.addPage()
        y = 20
      }
      
      doc.setTextColor(51, 65, 85)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text('LEGEND', 15, y)
      y += 6
      
      const legendItems = [
        { color: [34, 197, 94], label: 'Top 3 Ranking' },
        { color: [234, 179, 8], label: 'Top 10 Ranking' },
        { color: [249, 115, 22], label: 'Top 20 Ranking' },
        { color: [148, 163, 184], label: '20+ / Not Found' }
      ]
      
      legendItems.forEach(item => {
        doc.setFillColor(...item.color)
        doc.circle(18, y - 1, 2, 'F')
        doc.setTextColor(100, 116, 139)
        doc.setFont('helvetica', 'normal')
        doc.text(item.label, 25, y)
        y += 7
      })
      
      // Save
      const fileName = `SEO_Heatmap_${selectedBusiness.name.replace(/[^a-z0-9]/gi, '_')}_${currentKeyword.replace(/[^a-z0-9]/gi, '_')}.pdf`
      doc.save(fileName)
      toast.success('Report downloaded successfully!')
    } catch (error) {
      console.error('PDF Export Error:', error)
      toast.error(`PDF Generation Failed: ${error.message || 'Unknown error'}`)
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
      <div className="h-[calc(100vh-56px)] lg:h-screen flex flex-col items-center justify-center -m-4 md:-m-6 bg-slate-50 gap-4">
        <h2 className="text-xl font-bold text-slate-800">Scan not found</h2>
        <Button onClick={() => router.push('/dashboard')}>Return to Dashboard</Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1 -m-4 md:-m-6 bg-white lg:bg-slate-50 relative overflow-y-auto lg:overflow-hidden">
      <div className="flex flex-col lg:flex-row flex-1 relative min-h-screen lg:min-h-0">
        
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
        <aside className="w-full lg:w-[30%] min-w-[320px] max-w-[450px] bg-white border-r lg:border-r border-slate-200 overflow-y-auto shadow-xl flex flex-col order-2 lg:order-1">
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

          <div className="flex-1">
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

            {/* Results Section */}
            <div className="flex-1 overflow-y-auto">
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
