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
import {
  PdfReport, C, loadLogo, scoreColor, scoreVerdict,
  computeMapFit, fetchStaticMap, reportFileName, formatReportDate,
  reportRefNumber,
} from '@/lib/pdf-report'

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
    if (!selectedBusiness || !scanData) return

    try {
      setDownloadLoading(true)

      const results = scanData.results || []
      const topCompetitors = scanData.topCompetitors || []
      const analytics = scanAnalytics || {
        totalPoints: 0, foundCount: 0, notFoundCount: 0, averageRank: 0,
        top3Percentage: 0, top10Percentage: 0, top20Percentage: 0, visibilityScore: 0, bestRank: null,
      }
      const currentKeyword = viewMode === 'overall'
        ? 'All Tracked Keywords'
        : (scanData.projectScans?.find(ps => ps.scanId === scanId)?.keyword || scanData.keyword || 'Target Keyword')
      const radiusMeters = scanData.scanJob?.searchRadiusMeters || 5000
      const score = Number(analytics.visibilityScore) || 0
      const verdict = scoreVerdict(score)
      const notFoundPct = analytics.totalPoints
        ? Math.round((analytics.notFoundCount / analytics.totalPoints) * 100)
        : 0

      const logo = await loadLogo()
      const doc = new jsPDF('p', 'mm', 'a4')
      const r = new PdfReport(doc, { logo, subject: selectedBusiness.name })
      const refNum = reportRefNumber('HM')

      // ── Cover ──────────────────────────────────────────────────────────────
      r.cover({
        eyebrow: 'Local Search Ranking Audit',
        title: selectedBusiness.name,
        subtitle: selectedBusiness.address || '',
        preparedFor: scanData.project?.businessName || selectedBusiness.name,
        refNumber: refNum,
        meta: [
          { label: 'Report Date', value: formatReportDate(new Date()) },
          { label: 'Target Keyword', value: currentKeyword },
          { label: 'Search Radius', value: `${(radiusMeters / 1000).toFixed(1)} km` },
        ],
        score: { value: score, label: 'Visibility Score' },
        contents: [
          { title: 'Executive Summary', detail: 'Visibility score, ranking distribution and key findings' },
          { title: 'Local Ranking Heatmap', detail: `Rank measured across ${analytics.totalPoints} map points` },
          ...(topCompetitors.length ? [{ title: 'Competitive Analysis', detail: `Benchmarked against ${topCompetitors.length} nearby businesses` }] : []),
          { title: 'Contact Us', detail: 'How to reach our team for a walkthrough' },
        ],
      })

      // ── Executive summary ──────────────────────────────────────────────────
      r.page('Executive Summary')
      r.heading('Executive summary', {
        sub: `${selectedBusiness.name} scores ${score}% visibility for "${currentKeyword}" across ${analytics.totalPoints} sampled locations within a ${(radiusMeters / 1000).toFixed(1)} km radius.`,
      })

      const verdictY = r.y
      const verdictH = 42
      r.roundRect(r.margin, verdictY, r.inner, verdictH, 2.8, { fill: C.white, border: C.border })
      r.donut(r.margin + 24, verdictY + verdictH / 2, 13.5, score, {
        thickness: 4.2, value: String(score), valueSize: 16, caption: '/ 100',
      })
      r.stroke(C.hairline)
      doc.setLineWidth(0.3)
      doc.line(r.margin + 48, verdictY + 7, r.margin + 48, verdictY + verdictH - 7)
      r.pill(verdict.label, r.margin + 58, verdictY + 8.4, { toneName: verdict.tone })
      r.text(
        score >= 80
          ? 'This business dominates the local pack for this search. Protect the position with steady review velocity and fresh content.'
          : score >= 60
            ? 'Solid visibility with clear headroom. The heatmap below shows exactly which parts of the service area still need work.'
            : score >= 40
              ? 'Visibility is inconsistent across the service area. A meaningful share of nearby searchers are not seeing this business at all.'
              : 'This business is largely invisible for this search across the sampled area, losing the majority of local demand to competitors.',
        r.margin + 58, verdictY + 21, { size: 8.8, color: C.body, maxWidth: r.inner - 66, lineHeight: 4.3 },
      )
      r.y = verdictY + verdictH + 10

      r.subheading('Performance at a glance')
      r.y = r.tiles([
        { label: 'Best Rank', value: analytics.bestRank ? `#${analytics.bestRank}` : '—', sub: 'Strongest position found', color: C.green },
        { label: 'Average Rank', value: analytics.averageRank ? String(analytics.averageRank) : '—', sub: 'Across found positions', color: C.blue },
        { label: 'Top 3 Coverage', value: `${analytics.top3Percentage}%`, sub: 'Of sampled locations', color: scoreColor(analytics.top3Percentage) },
        { label: 'Not Ranking', value: `${analytics.notFoundCount} · ${notFoundPct}%`, sub: 'No position found', color: analytics.notFoundCount ? C.red : C.green },
      ], { y: r.y, columns: 4, height: 25 }) + 11

      r.ensure(48, 'Executive Summary')
      r.subheading('Ranking distribution', { right: `${analytics.totalPoints} points sampled` })
      r.y = r.meterRows([
        { label: 'Top 3 (Dominant)', value: `${analytics.top3Percentage}%`, percent: analytics.top3Percentage, color: C.green },
        { label: 'Top 10 (Visible)', value: `${analytics.top10Percentage}%`, percent: analytics.top10Percentage, color: [234, 179, 8] },
        { label: 'Top 20 (Weak)', value: `${analytics.top20Percentage}%`, percent: analytics.top20Percentage, color: C.orange },
        { label: 'Not Found', value: `${notFoundPct}%`, percent: notFoundPct, color: C.faint },
      ], { y: r.y + 1, rowH: 10.5, labelW: 50, valueW: 22 }) + 8

      const keyFindings = []
      if (analytics.top3Percentage < 30) keyFindings.push(`Only ${analytics.top3Percentage}% top-3 coverage — most of the service area is being lost to competitors`)
      if (analytics.notFoundCount > 0) keyFindings.push(`${analytics.notFoundCount} of ${analytics.totalPoints} sampled points (${notFoundPct}%) returned no ranking at all`)
      if (analytics.averageRank && analytics.averageRank > 10) keyFindings.push(`Average rank of ${analytics.averageRank} sits outside the first page for most searches`)
      if (keyFindings.length === 0) keyFindings.push('Coverage is strong across the sampled area. Focus on defending the position as competitors respond.')

      r.ensure(34, 'Executive Summary')
      r.callout({
        y: r.y,
        toneName: keyFindings.length > 1 ? 'warning' : 'success',
        title: '🔑 Key Findings at a Glance',
        body: keyFindings.join('. ') + '.',
      })

      // ── Local ranking heatmap ────────────────────────────────────────────────
      r.page('Local Ranking Heatmap')
      r.heading('Local ranking heatmap', {
        sub: `Rank position sampled at ${analytics.totalPoints} points across the service area for "${currentKeyword}". Each pin shows the position this business held in the local pack when searched from that spot.`,
      })

      const mapW = r.inner
      const mapH = mapW / (600 / 420)
      const fit = computeMapFit(results, { logicalW: 600, logicalH: 420 })

      if (fit) {
        try {
          const image = await fetchStaticMap({
            center: fit.center, zoom: fit.zoom, width: 600, height: 420, scale: 2,
            maptype: mapType === 'roadmap' ? 'roadmap' : 'satellite',
          })
          const box = { x: r.margin, y: r.y, w: mapW, h: mapH }
          r.roundRect(box.x - 1, box.y - 1, box.w + 2, box.h + 2, 2, { border: C.border, lineWidth: 0.5 })
          doc.addImage(image, 'PNG', box.x, box.y, box.w, box.h)
          r.heatmapPins({
            points: results, center: fit.center, zoom: fit.zoom, box,
            imgW: 1200, imgH: 840, scale: 2, radius: 2.1,
            business: selectedBusiness,
          })
        } catch (err) {
          console.error('[Scan PDF] Heatmap render failed:', err)
          r.roundRect(r.margin, r.y, mapW, mapH, 2, { fill: C.wash, border: C.border })
          r.text('Map imagery could not be loaded for this report.', r.margin + mapW / 2, r.y + mapH / 2, {
            size: 9, weight: 'bold', color: C.faint, align: 'center',
          })
        }
      }

      r.y += mapH + 8
      r.y = r.rankLegend(r.margin, r.y, { w: r.inner }) + 7

      r.ensure(34, 'Local Ranking Heatmap')
      r.y = r.tiles([
        { label: 'Points Sampled', value: String(analytics.totalPoints), sub: 'Grid coverage', color: C.blue },
        { label: 'Top 3 Positions', value: `${Math.round((analytics.top3Percentage / 100) * analytics.totalPoints)} · ${analytics.top3Percentage}%`, sub: 'Dominant coverage', color: C.green },
        { label: 'Top 10 Positions', value: `${Math.round((analytics.top10Percentage / 100) * analytics.totalPoints)} · ${analytics.top10Percentage}%`, sub: 'Visible coverage', color: [234, 179, 8] },
        { label: 'Not Ranked', value: `${analytics.notFoundCount} · ${notFoundPct}%`, sub: 'Outside top 20', color: C.faint },
      ], { y: r.y, columns: 4, height: 25 }) + 9

      r.ensure(26, 'Local Ranking Heatmap')
      r.callout({
        y: r.y,
        toneName: analytics.top3Percentage >= 50 ? 'success' : analytics.top3Percentage >= 25 ? 'warning' : 'danger',
        title: 'Reading the heatmap',
        body: `Green pins are the searches where this business owns the local pack. ${analytics.foundCount} of ${analytics.totalPoints} sampled points returned a position at all, with an average rank of ${analytics.averageRank || '—'}. Grey "X" pins are searches where a competitor took the placement entirely.`,
      })

      // ── Competitive analysis ─────────────────────────────────────────────────
      if (topCompetitors.length) {
        r.page('Competitive Analysis')
        r.heading('Competitive analysis', {
          sub: `The ${topCompetitors.length} businesses that appeared most often alongside this one across the sampled search grid.`,
        })

        r.table({
          y: r.y,
          section: 'Competitive Analysis',
          cols: [
            { label: '#', width: 0.06, align: 'center', weight: 'bold', color: C.blue, render: (row, i) => String(i + 1) },
            { label: 'Business', width: 0.4, weight: 'bold', render: (row) => row.name, sub: (row) => row.address || 'Address not listed' },
            { label: 'Avg Rank', width: 0.16, align: 'center', weight: 'bold', render: (row) => `#${Math.round(row.avgRank || row.rank || 0)}` },
            { label: 'Appearances', width: 0.16, align: 'center', color: C.muted, render: (row) => String(row.appearances || 0) },
            {
              label: 'Visibility', width: 0.22, align: 'center',
              pill: (row) => {
                const pct = Math.round(((row.appearances || 0) / (analytics.totalPoints || 1)) * 100)
                return { label: `${pct}%`, toneName: pct >= 50 ? 'danger' : pct >= 25 ? 'warning' : 'neutral' }
              },
            },
          ],
          rows: topCompetitors.slice(0, 10),
        })
      }

      // ── Contact ───────────────────────────────────────────────────────────
      r.closing({
        section: 'Contact Us',
        headline: 'Let\'s talk through these findings',
        body: 'Our team is ready to walk you through this scan and help you get the most out of your local visibility.',
      })

      r.footers({ note: `${selectedBusiness.name} — Local Search Ranking Audit` })
      doc.save(reportFileName('Ringscale_Ranking_Audit', selectedBusiness.name))
      toast.success('Audit report downloaded')
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
