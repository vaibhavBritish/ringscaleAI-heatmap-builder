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
  Globe,
  Layers
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
import GoogleMap from '@/components/GoogleMap'
import jsPDF from 'jspdf'
import { Download } from 'lucide-react'
import { useConfig } from '@/hooks/use-config'
import {
  PdfReport, C, loadLogo, scoreColor, scoreVerdict,
  computeMapFit, fetchStaticMap, reportFileName, formatReportDate,
  reportRefNumber,
} from '@/lib/pdf-report'


export default function BusinessAuditPage() {
  const params = useParams()
  const router = useRouter()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { config } = useConfig()

  useEffect(() => { setMounted(true) }, [])

  const handleDownloadPDF = async () => {
    if (!data) return

    try {
      setDownloading(true)

      const { businessInfo, metrics, auditResults = [], competitors = [], scanResults = [] } = data
      const score = Number(metrics?.optimizationScore) || 0
      const verdict = scoreVerdict(score)
      const rating = Number(businessInfo?.rating) || 0
      const reviewCount = Number(businessInfo?.reviewCount) || 0
      const photoCount = Number(businessInfo?.photoCount) || 0
      const top3Coverage = Number(metrics?.top3Coverage) || 0
      const hasHeatmap = Array.isArray(scanResults) && scanResults.length > 0
      const ranked = [...competitors].sort((a, b) => (b.rating || 0) - (a.rating || 0))

      const logo = await loadLogo()
      const doc = new jsPDF('p', 'mm', 'a4')
      const r = new PdfReport(doc, { logo, subject: businessInfo?.name || 'Business Audit' })

      const statusTone = (status) => {
        const s = String(status || '').toLowerCase()
        if (s === 'pass') return 'success'
        if (s === 'warning') return 'warning'
        return 'danger'
      }

      // ── Cover ──────────────────────────────────────────────────────────────
      r.cover({
        eyebrow: 'Google Business Profile Audit',
        title: businessInfo?.name || 'Business Audit Report',
        subtitle: businessInfo?.address || '',
        meta: [
          { label: 'Report Date', value: formatReportDate(data.lastUpdated || new Date()) },
          { label: 'Profile Status', value: (businessInfo?.status || 'Operational').replace(/_/g, ' ') },
          { label: 'Competitors Analysed', value: String(competitors.length) },
        ],
        score: { value: score, label: 'Optimization Score' },
        contents: [
          { title: 'Executive Summary', detail: 'Optimization score, profile health and how the score is composed' },
          { title: 'Audit Findings', detail: `All ${auditResults.length} checks with pass / action-required status` },
          { title: 'Competitive Landscape', detail: `Benchmarked against ${competitors.length} nearby businesses` },
          ...(hasHeatmap ? [{ title: 'Local Ranking Heatmap', detail: `Rank measured across ${scanResults.length} map points` }] : []),
          { title: 'Contact Us', detail: 'How to reach our team for a walkthrough' },
        ],
      })

      // ── Executive summary ──────────────────────────────────────────────────
      r.page('Executive Summary')
      r.heading('Executive summary', {
        sub: `${businessInfo?.name || 'This business'} scores ${score} out of 100 on Ringscale's local optimization model, which weights review quality, review volume, imagery and share of top-3 map coverage.`,
      })

      // Verdict card: gauge on the left, plain-language read-out on the right.
      const verdictY = r.y
      const verdictH = 42
      r.roundRect(r.margin, verdictY, r.inner, verdictH, 2.8, { fill: C.white, border: C.border })
      r.donut(r.margin + 24, verdictY + verdictH / 2, 13.5, score, {
        thickness: 4.2, value: String(score), valueSize: 16, caption: '/ 100',
      })
      r.stroke(C.hairline)
      doc.setLineWidth(0.3)
      doc.line(r.margin + 48, verdictY + 7, r.margin + 48, verdictY + verdictH - 7)

      const vx = r.margin + 58
      const vw = r.inner - 58 - 8
      r.pill(verdict.label, vx, verdictY + 8.4, { toneName: verdict.tone })
      r.text(
        score >= 80
          ? 'This profile is competitive. Protect the position by keeping review velocity and fresh imagery consistent.'
          : score >= 60
            ? 'Solid foundations with clear headroom. The findings below show which levers move the score fastest.'
            : score >= 40
              ? 'Several core profile signals are underweight. Fixing them typically produces the largest short-term gains.'
              : 'This profile is materially under-optimised and is losing map visibility to better-maintained competitors.',
        vx, verdictY + 21, { size: 8.8, color: C.body, maxWidth: vw, lineHeight: 4.3 },
      )
      r.y = verdictY + verdictH + 10

      r.subheading('Performance at a glance')
      r.y = r.tiles([
        { label: 'Google Rating', value: `${rating || '—'} / 5`, sub: `${reviewCount} reviews`, color: scoreColor((rating / 5) * 100) },
        { label: 'Review Volume', value: String(reviewCount), sub: reviewCount >= 50 ? 'Healthy' : 'Below benchmark', color: reviewCount >= 50 ? C.green : C.amber },
        { label: 'Profile Photos', value: String(photoCount), sub: photoCount >= 10 ? 'Well stocked' : 'Add more imagery', color: photoCount >= 10 ? C.green : C.amber },
        { label: 'Top 3 Coverage', value: `${top3Coverage}%`, sub: 'Of sampled map points', color: scoreColor(top3Coverage) },
        { label: 'Visibility Score', value: `${Number(metrics?.visibilityScore) || 0}%`, sub: 'Local pack presence', color: scoreColor(Number(metrics?.visibilityScore) || 0) },
        { label: 'Average Rank', value: String(metrics?.averageRank ?? '—'), sub: 'Where you do appear', color: C.blue },
        { label: 'Market Avg Rating', value: String(metrics?.averageCompetitorRating || '—'), sub: 'Nearby competitors', color: C.muted },
        { label: 'Market Leader', value: metrics?.topCompetitor?.name || '—', valueSize: 10, sub: 'Highest rated nearby', color: C.red },
      ], { y: r.y, columns: 4, height: 25 }) + 11

      // Score composition — mirrors the weighting used by the audit API.
      r.ensure(58, 'Executive Summary')
      r.subheading('How the optimization score is composed', { right: `${score} / 100` })
      r.y = r.meterRows([
        { label: 'Review rating', value: `${Math.min((rating / 5) * 25, 25).toFixed(1)} / 25`, percent: Math.min((rating / 5) * 100, 100) },
        { label: 'Review volume', value: `${Math.min((reviewCount / 100) * 20, 20).toFixed(1)} / 20`, percent: Math.min((reviewCount / 100) * 100, 100) },
        { label: 'Photo library', value: `${Math.min((photoCount / 20) * 15, 15).toFixed(1)} / 15`, percent: Math.min((photoCount / 20) * 100, 100) },
        { label: 'Top 3 map coverage', value: `${((top3Coverage / 100) * 40).toFixed(1)} / 40`, percent: top3Coverage },
      ], { y: r.y + 1, rowH: 10.5, labelW: 56, valueW: 26 }) + 8

      // Key findings callout.
      const keyFindings = []
      if (rating < 4.5) keyFindings.push(`Rating of ${rating}/5 is below the 4.7+ threshold for dominant local pack presence`)
      if (reviewCount < 50) keyFindings.push(`Only ${reviewCount} reviews — aim for 100+ to maximise the review-volume signal`)
      if (photoCount < 10) keyFindings.push(`Profile has just ${photoCount} photos — 20+ geo-tagged images are the benchmark`)
      if (top3Coverage < 50) keyFindings.push(`Only ${top3Coverage}% top-3 coverage — more than half the service area is unclaimed`)
      if (keyFindings.length === 0) keyFindings.push('All key signals are at or above benchmark. Focus on defending the position.')

      r.ensure(34, 'Executive Summary')
      r.callout({
        y: r.y,
        toneName: keyFindings.length > 1 ? 'warning' : 'success',
        title: '🔑 Key Findings at a Glance',
        body: keyFindings.join('. ') + '.',
      })

      // Profile record.
      r.ensure(48, 'Executive Summary')
      r.subheading('Profile record')
      r.table({
        y: r.y + 1,
        section: 'Executive Summary',
        cols: [
          { label: 'Field', width: 0.3, weight: 'bold', color: C.muted, render: (row) => row.field },
          { label: 'Value', width: 0.7, render: (row) => row.value },
        ],
        rows: [
          { field: 'Business name', value: businessInfo?.name || '—' },
          { field: 'Address', value: businessInfo?.address || '—' },
          { field: 'Phone', value: businessInfo?.phone || 'Not listed on profile' },
          { field: 'Website', value: businessInfo?.website || 'Not listed on profile' },
          { field: 'Operating status', value: (businessInfo?.status || 'OPERATIONAL').replace(/_/g, ' ') },
        ],
      })

      // ── Audit findings ─────────────────────────────────────────────────────
      r.page('Audit Findings')
      r.heading('Audit findings', {
        sub: 'Each check below is scored against the benchmark we see on consistently top-ranking local profiles.',
      })
      r.table({
        y: r.y,
        section: 'Audit Findings',
        rowH: 15,
        cols: [
          { label: 'Check', width: 0.28, weight: 'bold', render: (row) => row.title, sub: () => '' },
          { label: 'What we found', width: 0.42, size: 8.2, color: C.muted, render: (row) => row.description },
          { label: 'Measured', width: 0.15, align: 'center', weight: 'bold', render: (row) => String(row.value) },
          { label: 'Status', width: 0.15, align: 'center', pill: (row) => ({ label: row.status, toneName: statusTone(row.status) }) },
        ],
        rows: auditResults,
        emptyText: 'No checks were returned for this profile.',
      })

      const failing = auditResults.filter(a => String(a.status || '').toLowerCase() !== 'pass')
      r.y += 10
      r.ensure(30, 'Audit Findings')
      r.callout({
        y: r.y,
        toneName: failing.length === 0 ? 'success' : failing.length <= 1 ? 'info' : 'warning',
        title: failing.length === 0 ? 'All checks passed' : `${failing.length} of ${auditResults.length} checks need attention`,
        body: failing.length === 0
          ? 'Nothing is holding this profile back on the checks we run. Focus on defending the position through steady review and content velocity.'
          : `Priority order: ${failing.map(f => f.title).join(', ')}.`,
      })

      // ── Competitive landscape ──────────────────────────────────────────────
      r.page('Competitive Landscape')
      r.heading('Competitive landscape', {
        sub: competitors.length
          ? `We compared this profile against the ${competitors.length} most relevant businesses operating in the same service area.`
          : 'No nearby competitors were returned for this profile, so benchmarking is unavailable for this run.',
      })

      r.y = r.tiles([
        { label: 'Your Rating', value: `${rating || '—'} / 5`, sub: `${reviewCount} reviews`, color: C.blue },
        { label: 'Market Average', value: `${metrics?.averageCompetitorRating || '—'} / 5`, sub: 'Competitor mean', color: C.muted },
        { label: 'Market Leader', value: metrics?.topCompetitor?.name || '—', valueSize: 10, sub: `${metrics?.topCompetitor?.rating || '—'} / 5 rating`, color: C.red },
        {
          label: 'Rating Gap',
          value: metrics?.averageCompetitorRating
            ? `${rating >= metrics.averageCompetitorRating ? '+' : ''}${(rating - metrics.averageCompetitorRating).toFixed(1)}`
            : '—',
          sub: 'Versus market average',
          color: rating >= (metrics?.averageCompetitorRating || 0) ? C.green : C.amber,
        },
      ], { y: r.y, columns: 4, height: 25 }) + 8

      // Market position callout.
      const myRank = ranked.findIndex(c => (c.rating || 0) < rating) + 1
      const totalCompetitors = ranked.length + 1
      r.ensure(28, 'Competitive Landscape')
      r.callout({
        y: r.y,
        toneName: myRank <= 1 ? 'success' : myRank <= 3 ? 'info' : 'warning',
        title: `Your Market Position: #${myRank || totalCompetitors} of ${totalCompetitors}`,
        body: myRank <= 1
          ? `${businessInfo?.name || 'This business'} holds the highest rating in the local market. Protect this advantage with consistent review velocity.`
          : myRank <= 3
            ? `Positioned in the top 3. Closing the gap to #1 requires a sustained focus on review quality and response time.`
            : `${totalCompetitors - myRank} competitor${totalCompetitors - myRank === 1 ? '' : 's'} rank${totalCompetitors - myRank === 1 ? 's' : ''} higher. The audit findings above highlight the fastest levers to close the gap.`,
      })
      r.y += 10

      if (ranked.length) {
        r.ensure(24 + Math.min(ranked.length + 1, 9) * 9, 'Competitive Landscape')
        r.subheading('Rating benchmark', { right: 'Out of 5.0' })
        r.y = r.meterRows([
          { label: `${businessInfo?.name || 'Your business'} (you)`, value: String(rating || '—'), percent: (rating / 5) * 100, color: C.blue, highlight: true },
          ...ranked.slice(0, 8).map(c => ({
            label: c.name,
            value: String(c.rating || '—'),
            percent: ((c.rating || 0) / 5) * 100,
            color: C.faint,
          })),
        ], { y: r.y + 1, rowH: 9.4, labelW: 70, valueW: 16 }) + 9
      }

      r.ensure(40, 'Competitive Landscape')
      r.subheading('Local competitor directory')
      r.table({
        y: r.y + 1,
        section: 'Competitive Landscape',
        cols: [
          {
            label: 'Business', width: 0.5, weight: 'bold',
            render: (row) => (row.__highlight ? `${row.name}  (YOU)` : row.name),
            sub: (row) => row.address || '—',
          },
          { label: 'Rating', width: 0.14, align: 'center', weight: 'bold', render: (row) => `${row.rating || '—'} / 5` },
          { label: 'Reviews', width: 0.16, align: 'center', render: (row) => String(row.reviewCount ?? '—') },
          {
            label: 'Position', width: 0.2, align: 'center',
            pill: (row) => (row.__highlight
              ? { label: 'Benchmark', toneName: 'info' }
              : { label: (row.rating || 0) > rating ? 'Ahead of you' : 'Behind you', toneName: (row.rating || 0) > rating ? 'danger' : 'success' }),
          },
        ],
        rows: [
          { name: businessInfo?.name || 'Your business', address: businessInfo?.address, rating, reviewCount, __highlight: true },
          ...ranked,
        ],
        emptyText: 'No competitor data available for this location.',
      })

      // ── Local ranking heatmap ──────────────────────────────────────────────
      if (hasHeatmap) {
        r.page('Local Ranking Heatmap')
        const found = scanResults.filter(p => p.found && p.rank > 0)
        const top3 = scanResults.filter(p => p.found && p.rank <= 3).length
        const top10 = scanResults.filter(p => p.found && p.rank <= 10).length
        const top20 = scanResults.filter(p => p.found && p.rank <= 20).length
        const pct = (n) => `${Math.round((n / scanResults.length) * 100)}%`

        r.heading('Local ranking heatmap', {
          sub: `Rank position sampled at ${scanResults.length} points across the service area. Each pin shows the position this business held in the local pack when searched from that spot.`,
        })

        const mapW = r.inner
        const mapH = mapW / (600 / 420) // match the static-map aspect so nothing stretches
        const fit = computeMapFit(scanResults, { logicalW: 600, logicalH: 420 })

        if (fit) {
          try {
            const image = await fetchStaticMap({ center: fit.center, zoom: fit.zoom, width: 600, height: 420, scale: 2 })
            const box = { x: r.margin, y: r.y, w: mapW, h: mapH }
            r.roundRect(box.x - 1, box.y - 1, box.w + 2, box.h + 2, 2, { border: C.border, lineWidth: 0.5 })
            doc.addImage(image, 'PNG', box.x, box.y, box.w, box.h)
            r.heatmapPins({
              points: scanResults, center: fit.center, zoom: fit.zoom, box,
              imgW: 1200, imgH: 840, scale: 2, radius: 2.1,
              business: businessInfo?.latitude ? businessInfo : null,
            })
          } catch (err) {
            console.error('[Audit PDF] Heatmap render failed:', err)
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
          { label: 'Points Sampled', value: String(scanResults.length), sub: 'Grid coverage', color: C.blue },
          { label: 'Top 3 Positions', value: `${top3} · ${pct(top3)}`, sub: 'Dominant coverage', color: C.green },
          { label: 'Top 10 Positions', value: `${top10} · ${pct(top10)}`, sub: 'Visible coverage', color: [234, 179, 8] },
          { label: 'Not Ranked', value: `${scanResults.length - top20} · ${pct(scanResults.length - top20)}`, sub: 'Outside top 20', color: C.faint },
        ], { y: r.y, columns: 4, height: 25 }) + 9

        r.ensure(26, 'Local Ranking Heatmap')
        r.callout({
          y: r.y,
          toneName: top3 / scanResults.length >= 0.5 ? 'success' : top3 / scanResults.length >= 0.25 ? 'warning' : 'danger',
          title: 'Reading the heatmap',
          body: `Green pins are the searches where this business owns the local pack. ${found.length} of ${scanResults.length} sampled points returned a position at all, with an average rank of ${metrics?.averageRank ?? '—'}. Grey "X" pins are searches where a competitor took the placement entirely.`,
        })
      }

      // ── Contact ───────────────────────────────────────────────────────────
      r.closing({
        section: 'Contact Us',
        headline: 'Let\'s talk through these findings',
        body: 'Our team is ready to walk you through this audit and help you get the most out of your local profile.',
      })

      r.footers({ note: `${businessInfo?.name || 'Business'} — Google Business Profile Audit` })
      doc.save(reportFileName('Ringscale_GBP_Audit', businessInfo?.name))
      toast.success('Audit report downloaded')
    } catch (error) {
      console.error('Audit PDF export error:', error)
      toast.error('Failed to generate the audit report')
    } finally {
      setDownloading(false)
    }
  }

  const fetchAuditData = async (force = false) => {
    try {
      if (force) setRefreshing(true)
      const res = await fetch(`/api/public/audit/${params.id}${force ? '?refresh=true' : ''}`)
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
              { value: 'competitors', label: 'Competitors', icon: <Trophy className="w-4 h-4" /> },
              { value: 'keywords', label: 'Keywords', icon: <Tag className="w-4 h-4" /> }
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
              
              {/* Heatmap Section */}
              {data.scanResults && data.scanResults.length > 0 && (
                <div className="space-y-6 pt-4">
                  <div className="flex items-center justify-between px-2">
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                      <Layers className="w-8 h-8 text-blue-600" />
                      Visibility Heatmap
                    </h2>
                  </div>
                  <Card className="border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-xl bg-white h-[450px]">
                    <GoogleMap 
                      markers={[
                        { name: businessInfo.name, latitude: businessInfo.latitude, longitude: businessInfo.longitude, selected: true },
                        ...data.scanResults
                      ]}
                      mapType="roadmap"
                    />
                  </Card>
                </div>
              )}
              
              {/* Radial Scan CTA */}
              {metrics.optimizationScore < 95 && (
                <div 
                  id="pdf-cta"
                  className="mt-12 p-8 sm:p-12 rounded-[3rem] bg-slate-900 border-none relative overflow-hidden group cursor-pointer"
                  onClick={() => router.push(`/login`)}
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
              <ProfileTab businessInfo={{ ...businessInfo, googleApiKey: config?.googleMapsApiKey }} />
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

        <TabsContent value="keywords" className="mt-0 ring-offset-0 focus-visible:ring-0">
           <div id="pdf-keywords">
              <KeywordsTab keywords={data.keywords} />
           </div>
        </TabsContent>
      </Tabs>
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

function KeywordsTab({ keywords }) {
  if (!keywords) return (
    <div className="flex justify-center items-center h-48">
      <p className="text-slate-400 font-bold italic">No keyword data available for this business.</p>
    </div>
  )

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* AI Suggested Keywords */}
        <Card className="border-2 border-slate-100 rounded-3xl shadow-sm hover:shadow-md transition-all bg-white overflow-hidden">
          <CardHeader className="border-b border-slate-50 bg-slate-50/30 px-6 py-4 sm:px-8 sm:py-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                <Star className="w-5 h-5 fill-purple-600" />
              </div>
              <div>
                <CardTitle className="text-xl font-black text-slate-900">AI Suggested Keywords</CardTitle>
                <CardDescription className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-widest">Growth Opportunities</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 sm:p-8 space-y-4">
            {keywords.aiSuggested?.map((kw, idx) => (
              <div key={idx} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50/50 border border-slate-100 hover:border-purple-200 hover:bg-purple-50/30 transition-all group cursor-default">
                <div className="w-8 h-8 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-400 font-black text-xs group-hover:text-purple-600 group-hover:border-purple-200 transition-colors">
                  {idx + 1}
                </div>
                <div className="font-bold text-slate-700 group-hover:text-slate-900 transition-colors flex-1">{kw}</div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* High Ranked Keywords */}
        <Card className="border-2 border-slate-100 rounded-3xl shadow-sm hover:shadow-md transition-all bg-white overflow-hidden">
          <CardHeader className="border-b border-slate-50 bg-slate-50/30 px-6 py-4 sm:px-8 sm:py-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-xl font-black text-slate-900">High Ranked Keywords</CardTitle>
                <CardDescription className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-widest">Current Performance</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 sm:p-8 space-y-4">
            {keywords.topRanked?.map((kw, idx) => (
              <div key={idx} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50/50 border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all group cursor-default">
                <div className="w-8 h-8 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-400 font-black text-xs group-hover:text-blue-600 group-hover:border-blue-200 transition-colors">
                  {idx + 1}
                </div>
                <div className="font-bold text-slate-700 group-hover:text-slate-900 transition-colors flex-1">{kw}</div>
                <div className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-full text-[10px] font-black uppercase">
                  <TrendingUp className="w-3 h-3" /> High
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
