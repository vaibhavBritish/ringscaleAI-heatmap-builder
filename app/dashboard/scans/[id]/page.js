'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Loader2, MapPin, Building2, Zap,
  ChevronDown, Plus, X,
  RefreshCw, Layers, ArrowLeft, Download
} from 'lucide-react'
import { toast } from 'sonner'
import GoogleMap from '@/components/GoogleMap'
import { calculateAnalytics } from '@/lib/grid-utils'
import jsPDF from 'jspdf'
import { getPixelCoordinate } from '@/lib/mercator-projection'
import { useConfig } from '@/hooks/use-config'

export default function ScanResultsPage() {
  const router = useRouter()
  const params = useParams()
  const scanId = params.id

  const [loading, setLoading] = useState(true)
  const [mapType, setMapType] = useState('roadmap')
  const [scanData, setScanData] = useState(null)

  const [selectedBusiness, setSelectedBusiness] = useState(null)
  const [keywords, setKeywords] = useState([])
  const [heatmapPins, setHeatmapPins] = useState([])
  const [scanAnalytics, setScanAnalytics] = useState(null)
  const [rescanLoading, setRescanLoading] = useState(false)

  const [viewMode, setViewMode] = useState('single') // 'single' or 'overall'
  const [projectId, setProjectId] = useState(null)
  const { config } = useConfig()

  useEffect(() => {
    fetchScanResults()
  }, [scanId, viewMode])

  const fetchScanResults = async () => {
    try {
      setLoading(true)
      let url = `/api/scans/${scanId}/results`

      if (viewMode === 'overall' && projectId) {
        url = `/api/projects/${projectId}/results`
      }

      const response = await fetch(url)
      if (!response.ok) throw new Error('Failed to load results')

      const data = await response.json()
      setScanData(data)
      if (data.project?.id) setProjectId(data.project.id)

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
        headers: { 'Content-Type': 'application/json' },
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
      const doc = new jsPDF('l', 'mm', 'a4')
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()

      const loadImage = (src) => {
        return new Promise((resolve, reject) => {
          const img = new Image()
          img.crossOrigin = 'Anonymous'
          img.onload = () => resolve(img)
          img.onerror = reject
          img.src = src
        })
      }

      // --- PAGE 1: HEATMAP AUDIT ---
      doc.setFillColor(15, 23, 42) // Slate 900
      doc.rect(0, 0, 75, pageHeight, 'F')

      try {
        const logoImg = await loadImage('/logo.png')
        doc.addImage(logoImg, 'PNG', 15, 12, 45, 15)
      } catch (e) {
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(18)
        doc.text('Ringscale AI', 15, 22)
      }

      let sy = 45
      doc.setTextColor(59, 130, 246)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.text('PERFORMANCE AUDIT', 15, sy)
      sy += 7

      doc.setTextColor(255, 255, 255)
      doc.setFontSize(13)
      doc.text(selectedBusiness.name, 15, sy, { maxWidth: 50 })
      sy += (doc.splitTextToSize(selectedBusiness.name, 50).length * 6)

      doc.setFontSize(8)
      doc.setTextColor(148, 163, 184)
      doc.setFont('helvetica', 'normal')
      doc.text(selectedBusiness.address || '', 15, sy, { maxWidth: 50 })
      sy += 12

      const currentKeyword = scanData.projectScans?.find(ps => ps.scanId === scanId)?.keyword || 'Multiple Keywords'
      doc.setTextColor(59, 130, 246)
      doc.setFontSize(7)
      doc.setFont('helvetica', 'bold')
      doc.text('TARGET KEYWORD', 15, sy)
      sy += 5
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(10)
      doc.text(currentKeyword, 15, sy, { maxWidth: 50 })
      sy += 15

      if (scanAnalytics) {
        const stats = [
          { label: 'Visibility Score', value: `${scanAnalytics.visibilityScore}%`, color: [34, 197, 94] },
          { label: 'Average Rank', value: String(scanAnalytics.averageRank || 'N/A'), color: [255, 255, 255] },
          { label: 'Best Found Rank', value: `#${scanAnalytics.bestRank || '-'}`, color: [234, 179, 8] }
        ]

        stats.forEach(s => {
          doc.setTextColor(148, 163, 184)
          doc.setFontSize(7)
          doc.text(s.label.toUpperCase(), 15, sy)
          sy += 6
          doc.setTextColor(...s.color)
          doc.setFontSize(22)
          doc.setFont('helvetica', 'bold')
          doc.text(s.value, 15, sy)
          sy += 15
        })
      }

      sy = pageHeight - 40
      doc.setTextColor(59, 130, 246)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'bold')
      doc.text('RANKING LEGEND', 15, sy)
      sy += 6
      const legend = [
        { color: [34, 197, 94], label: 'Top 3 (Dominant)' },
        { color: [234, 179, 8], label: 'Top 10 (Visible)' },
        { color: [249, 115, 22], label: 'Top 20 (Weak)' },
        { color: [148, 163, 184], label: '20+ (Not Found)' }
      ]
      legend.forEach(item => {
        doc.setFillColor(...item.color)
        doc.circle(17, sy - 1, 1.5, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(7)
        doc.setFont('helvetica', 'normal')
        doc.text(item.label, 21, sy)
        sy += 5
      })

      const mapX = 85
      const mapY = 15
      const mapW = pageWidth - mapX - 15
      const mapH = pageHeight - 30

      const apiKey = config?.googleMapsApiKey
      if (apiKey && selectedBusiness) {
        try {
          const mapWidth = 1200
          const mapHeight = 840
          const radiusMeters = scanData.scanJob?.searchRadiusMeters || 5000
          const zoom = Math.floor(16 - Math.log2(radiusMeters / 750))

          const center = `${selectedBusiness.latitude},${selectedBusiness.longitude}`
          const mapTypeParam = mapType === 'roadmap' ? 'roadmap' : 'satellite'
          
          // Build query for secure server-side proxy
          const queryParams = new URLSearchParams({
            center,
            zoom: String(zoom),
            size: '600x420',
            scale: '2',
            maptype: mapTypeParam,
            format: 'png8'
          })
          
          // Inject custom dashboard styles
          const rawStyles = [
            'feature:all|element:labels.text.fill|color:0x0c4bb0',
            'feature:water|element:geometry|color:0xa2daf2',
            'feature:landscape|element:geometry|color:0xe9f1f4'
          ]
          rawStyles.forEach(s => queryParams.append('style', s))

          const proxyUrl = `/api/google/static-map?${queryParams.toString()}`
          
          const response = await fetch(proxyUrl)
          const blob = await response.blob()
          const reader = new FileReader()
          const base64Data = await new Promise((res) => {
            reader.onloadend = () => res(reader.result)
            reader.readAsDataURL(blob)
          })
          
          // Draw map frame
          doc.setDrawColor(226, 232, 240) // Slate 200
          doc.setLineWidth(0.5)
          doc.roundedRect(mapX - 2, mapY - 2, mapW + 4, mapH + 4, 3, 3, 'D')
          doc.addImage(base64Data, 'PNG', mapX, mapY, mapW, mapH)
          
          // Draw high-fidelity markers
          heatmapPins.forEach(p => {
            if (p.rank === undefined && !p.found) return
            const px = getPixelCoordinate(p.latitude, p.longitude, selectedBusiness.latitude, selectedBusiness.longitude, zoom, mapWidth, mapHeight)
            if (px.x < 0 || px.x > mapWidth || px.y < 0 || px.y > mapHeight) return
            
            const mmX = mapX + (px.x * mapW / mapWidth)
            const mmY = mapY + (px.y * mapH / mapHeight)
            
            let color = [148, 163, 184] // Slate 400 (Grey)
            let textColor = [255, 255, 255]
            if (p.rank && p.rank <= 3) color = [34, 197, 94] // Green
            else if (p.rank && p.rank <= 10) {
              color = [234, 179, 8] // Yellow
              textColor = [0, 0, 0] // Black text for yellow background
            }
            else if (p.rank && p.rank <= 20) color = [249, 115, 22] // Orange
            
            doc.setFillColor(...color)
            doc.circle(mmX, mmY, 2.5, 'F')
            doc.setDrawColor(255, 255, 255)
            doc.setLineWidth(0.3)
            doc.circle(mmX, mmY, 2.5, 'S')
            
            doc.setTextColor(...textColor)
            doc.setFontSize(5.5)
            doc.setFont('helvetica', 'bold')
            const txt = (p.found === false || !p.rank || p.rank > 20) ? 'X' : String(p.rank)
            doc.text(txt, mmX, mmY + 0.4, { align: 'center' })
          })

          // Business Marker (Red 'B')
          const cpx = getPixelCoordinate(selectedBusiness.latitude, selectedBusiness.longitude, selectedBusiness.latitude, selectedBusiness.longitude, zoom, mapWidth, mapHeight)
          const cmmX = mapX + (cpx.x * mapW / mapWidth)
          const cmmY = mapY + (cpx.y * mapH / mapHeight)
          doc.setFillColor(239, 68, 68) // Red 500
          doc.circle(cmmX, cmmY, 4.0, 'F')
          doc.setDrawColor(255, 255, 255)
          doc.setLineWidth(0.5)
          doc.circle(cmmX, cmmY, 4.0, 'S')
          doc.setTextColor(255, 255, 255)
          doc.setFontSize(7.5)
          doc.setFont('helvetica', 'bold')
          doc.text('B', cmmX, cmmY + 1.1, { align: 'center' })

          // Map Legend Overlay
          doc.setFillColor(255, 255, 255)
          doc.roundedRect(mapX + 5, mapY + 5, 75, 8, 1, 1, 'F')
          doc.setTextColor(15, 23, 42)
          doc.setFontSize(8)
          doc.setFont('helvetica', 'bold')
          doc.text('LOCAL SEARCH RANKING HEATMAP', mapX + 8, mapY + 10.5)
        } catch (e) {
          console.error('Map Error:', e)
        }
      }

      // --- PAGE 2: COMPETITORS ---
      if (scanData?.topCompetitors?.length > 0) {
        doc.addPage('l', 'mm', 'a4')
        doc.setFillColor(15, 23, 42)
        doc.rect(0, 0, pageWidth, 40, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(22)
        doc.setFont('helvetica', 'bold')
        doc.text('COMPETITIVE ANALYSIS', 15, 25)
        doc.setFontSize(10)
        doc.setTextColor(59, 130, 246)
        doc.text('TOP LOCAL SEARCH COMPETITORS', 15, 33)

        let cy = 55
        doc.setFillColor(248, 250, 252)
        doc.rect(15, cy, pageWidth - 30, 10, 'F')
        doc.setTextColor(100, 116, 139)
        doc.setFontSize(9)
        doc.text('RANK', 20, cy + 6.5)
        doc.text('BUSINESS NAME & ADDRESS', 40, cy + 6.5)
        doc.text('AVG RANK', pageWidth - 70, cy + 6.5)
        doc.text('VISIBILITY (%)', pageWidth - 40, cy + 6.5)
        cy += 15

        scanData.topCompetitors.slice(0, 10).forEach((comp, idx) => {
          doc.setTextColor(15, 23, 42)
          doc.setFontSize(10)
          doc.setFont('helvetica', 'bold')
          doc.text(`#${idx + 1}`, 20, cy)
          doc.text(comp.name, 40, cy)
          doc.setFontSize(8)
          doc.setTextColor(100, 116, 139)
          doc.setFont('helvetica', 'normal')
          doc.text(comp.address || 'Address not listed', 40, cy + 4)
          doc.setTextColor(15, 23, 42)
          doc.setFontSize(11)
          doc.setFont('helvetica', 'bold')
          doc.text(`${Math.round(comp.avgRank || comp.rank)}`, pageWidth - 65, cy + 2)
          const visPercent = Math.round((comp.appearances / (scanAnalytics?.totalPoints || 1)) * 100)
          doc.setTextColor(34, 197, 94)
          doc.text(`${visPercent}%`, pageWidth - 35, cy + 2)
          doc.setDrawColor(241, 245, 249)
          doc.line(15, cy + 8, pageWidth - 15, cy + 8)
          cy += 14
        })
      }

      doc.save(`Audit_${selectedBusiness.name.replace(/\s+/g, '_')}.pdf`)
      toast.success('Agency-grade report downloaded!')
    } catch (error) {
      console.error('PDF Error:', error)
      toast.error('Failed to build report')
    } finally {
      setDownloadLoading(false)
    }
  }

  if (loading) {
    return <div className="h-screen flex items-center justify-center bg-slate-50"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
  }

  if (!scanData) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <h2 className="text-xl font-bold">Results Not Found</h2>
        <Button onClick={() => router.push('/dashboard')}>Back to Dashboard</Button>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full bg-white overflow-hidden font-sans">
      <div className="flex flex-col lg:flex-row h-full relative">
        <main className="w-full lg:flex-1 h-[45vh] lg:h-full relative bg-slate-100 order-1 lg:order-2 border-b lg:border-b-0 border-slate-200 min-h-0">
          {selectedBusiness && (
            <GoogleMap
              markers={[{ ...selectedBusiness, selected: true }, ...heatmapPins]}
              onMarkerClick={() => { }}
              mapType={mapType}
            />
          )}

          <div className="absolute top-4 right-4 flex flex-col gap-2 scale-90 sm:scale-100 z-50">
            <button
              onClick={() => setMapType(mapType === 'roadmap' ? 'satellite' : 'roadmap')}
              className="w-10 h-10 bg-white border border-slate-200 rounded-xl shadow-xl flex items-center justify-center hover:bg-slate-50 transition active:scale-95"
            >
              <Layers className="w-5 h-5 text-slate-600" />
            </button>
          </div>
        </main>

        <aside className="w-full lg:w-[350px] bg-white border-r border-slate-200 overflow-hidden shadow-2xl flex flex-col order-2 lg:order-1 h-full z-10">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h2 className="font-black text-slate-900 flex items-center gap-2 text-base">
              <Link href="/dashboard" className="text-slate-400 hover:text-blue-600 transition"><ArrowLeft className="w-5 h-5" /></Link>
              Scan Review
            </h2>
            <Link href="/dashboard/projects/new"><Button size="sm" className="h-8 rounded-lg bg-blue-600 px-3">New Scan</Button></Link>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl space-y-2 shadow-sm">
              <div className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Target Business</div>
              <div className="font-black text-slate-900 text-sm truncate">{selectedBusiness.name}</div>
              <div className="text-[10px] text-slate-500 font-bold flex items-center gap-1"><MapPin className="w-3 h-3" /> {selectedBusiness.address?.split(',')[0]}</div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Selected Keyword</label>
              <select
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-black text-slate-800 appearance-none focus:border-blue-500 transition-all cursor-pointer shadow-sm"
                value={viewMode === 'overall' ? 'overall' : scanId}
                onChange={(e) => {
                  const val = e.target.value
                  if (val === 'overall') setViewMode('overall')
                  else if (val !== scanId) router.push(`/dashboard/scans/${val}`)
                }}
              >
                <option value="overall">✨ OVERALL RESULTS</option>
                {scanData.projectScans?.map((ps) => (
                  <option key={ps.keywordId} value={ps.scanId}>{ps.keyword}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 shadow-sm">
                <div className="text-[10px] font-black text-emerald-600 uppercase mb-1">Visibility</div>
                <div className="text-2xl font-black text-emerald-700">{scanAnalytics?.visibilityScore}%</div>
              </div>
              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 shadow-sm">
                <div className="text-[10px] font-black text-blue-600 uppercase mb-1">Avg Rank</div>
                <div className="text-2xl font-black text-blue-700">{scanAnalytics?.averageRank || 'N/A'}</div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-4 shadow-xl">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <Zap className="w-4 h-4 text-yellow-400" />
                <span className="text-xs font-black uppercase tracking-widest text-slate-300">Quick Stats</span>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-bold">Best Rank</span>
                  <span className="font-black text-emerald-400 text-sm">#{scanAnalytics?.bestRank || '-'}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-bold">Total Points</span>
                  <span className="font-black">{scanAnalytics?.totalPoints}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-400 font-bold italic">
                  <span>Audit Complete</span>
                  <RefreshCw className="w-3 h-3" />
                </div>
              </div>
            </div>

            {scanData.topCompetitors?.length > 0 && (
              <div className="space-y-3 pt-2">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Top Competitors</h3>
                <div className="space-y-2">
                  {scanData.topCompetitors.slice(0, 5).map((comp, i) => (
                    <div key={i} className="p-3 bg-white border border-slate-100 rounded-xl flex items-center justify-between shadow-sm hover:border-blue-200 transition-all group">
                      <div className="min-w-0">
                        <div className="text-[11px] font-black text-slate-900 truncate group-hover:text-blue-600 transition-colors">#{i + 1} {comp.name}</div>
                        <div className="text-[9px] text-slate-500 font-bold">Avg Rank: {Math.round(comp.avgRank)}</div>
                      </div>
                      <div className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg italic">{Math.round((comp.appearances / (scanAnalytics?.totalPoints || 1)) * 100)}%</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-slate-100 bg-white space-y-3">
            <Button
              onClick={handleDownloadPDF}
              disabled={downloadLoading}
              className="w-full h-14 bg-slate-900 hover:bg-black text-white font-black rounded-xl shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all"
            >
              {downloadLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
              EXPORT PRO AUDIT
            </Button>
            <Button
              onClick={handleRescan}
              disabled={rescanLoading}
              variant="outline"
              className="w-full h-12 border-2 border-slate-100 hover:bg-slate-50 text-slate-600 font-black rounded-xl"
            >
              RESCAN NOW
            </Button>
          </div>
        </aside>
      </div>
    </div>
  )
}
