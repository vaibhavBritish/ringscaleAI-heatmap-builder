'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { format, formatDistanceToNow, subDays, startOfDay, endOfDay } from 'date-fns'
import {
  BarChart3, Trophy, Eye, Layers, CalendarClock, MapPin, ExternalLink, KeyRound, Search,
  Plus, Loader2, RefreshCcw, ArrowUp, ArrowDown, Minus, Users, History, Star, X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'

const PERIODS = [
  { key: 'weekly', label: 'Weekly', days: 7 },
  { key: 'monthly', label: 'Monthly', days: 30 },
  { key: '90d', label: '90 Days', days: 90 },
  { key: 'custom', label: 'Custom' }
]

const LEGEND = [
  { label: '1–3', cls: 'bg-green-600' },
  { label: '4–7', cls: 'bg-lime-500' },
  { label: '8–10', cls: 'bg-yellow-400' },
  { label: '11–15', cls: 'bg-orange-500' },
  { label: '16–20+', cls: 'bg-red-500' }
]

function rankColor(rank, found) {
  if (!found || !rank || rank > 15) return 'bg-red-500 text-white'
  if (rank <= 3) return 'bg-green-600 text-white'
  if (rank <= 7) return 'bg-lime-500 text-white'
  if (rank <= 10) return 'bg-yellow-400 text-white'
  return 'bg-orange-500 text-white'
}

function avgBadge(avg) {
  if (!avg) return 'bg-slate-100 text-slate-500'
  if (avg <= 3) return 'bg-green-600 text-white'
  if (avg <= 7) return 'bg-lime-500 text-white'
  if (avg <= 10) return 'bg-yellow-400 text-white'
  if (avg <= 15) return 'bg-orange-500 text-white'
  return 'bg-red-500 text-white'
}

const fmtShort = (d) => (d ? format(new Date(d), 'MMM d') : '')

// Placeholder place IDs are shared by unrelated businesses, so never group on them
const isRealPlaceId = (id) => !!id && id !== 'external_sync' && !id.startsWith('gmb_')

/** One entry per business: duplicate project records of the same place collapse into one. */
function groupBusinesses(projects) {
  const groups = new Map()
  const keyOf = new Map()
  for (const p of projects) {
    const key = isRealPlaceId(p.placeId)
      ? `place:${p.placeId}`
      : `name:${(p.businessName || '').trim().toLowerCase()}|${(p.address || '').trim().toLowerCase()}`
    keyOf.set(p.id, key)
    if (!groups.has(key)) groups.set(key, { key, id: p.id, businessName: p.businessName, address: p.address })
  }
  const list = [...groups.values()]
  // Same name, different locations: add the address so branches can be told apart
  const nameCount = new Map()
  for (const g of list) {
    const n = (g.businessName || '').trim().toLowerCase()
    nameCount.set(n, (nameCount.get(n) || 0) + 1)
  }
  for (const g of list) {
    const multi = nameCount.get((g.businessName || '').trim().toLowerCase()) > 1
    g.label = multi && g.address ? `${g.businessName} — ${g.address.slice(0, 40)}` : g.businessName
  }
  list.sort((a, b) => (a.businessName || '').localeCompare(b.businessName || ''))
  return { list, keyOf }
}
const round1 = (n) => Math.round(n * 10) / 10

/**
 * For one keyword: the most recent scan up to the end of the period ("after") and the
 * scan that marks the start of the period ("before"). The "before" scan is the earliest
 * scan inside the period; if the period holds only the latest scan, the last scan from
 * before the period is used so there's still a comparison. Scans are newest first.
 */
function pickScans(scans, range) {
  const completed = scans.filter(s => s.status === 'completed' && s.analytics?.totalPoints > 0)
  const upToEnd = completed.filter(s => new Date(s.createdAt) <= range.end)
  const latest = upToEnd[0] || null
  let start = null
  if (latest && new Date(latest.createdAt) >= range.start) {
    const inRange = upToEnd.filter(s => new Date(s.createdAt) >= range.start)
    const earliest = inRange[inRange.length - 1]
    start = earliest && earliest.id !== latest.id
      ? earliest
      : upToEnd.find(s => new Date(s.createdAt) < range.start) || null
  }
  return { latest, start, completed }
}

export default function KeywordsPage() {
  const router = useRouter()
  const [projects, setProjects] = useState([])
  const [projectId, setProjectId] = useState('')
  const [data, setData] = useState(null)
  const [loadingProjects, setLoadingProjects] = useState(true)
  const [loading, setLoading] = useState(false)

  const [period, setPeriod] = useState('monthly')
  const [customFrom, setCustomFrom] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'))
  const [customTo, setCustomTo] = useState(format(new Date(), 'yyyy-MM-dd'))

  const [selectedKeywordId, setSelectedKeywordId] = useState('')
  const [gridView, setGridView] = useState('compare') // compare | latest
  const [scanCache, setScanCache] = useState({})

  const [showAdd, setShowAdd] = useState(false)
  const [newKeyword, setNewKeyword] = useState('')
  const [adding, setAdding] = useState(false)
  const [rescanning, setRescanning] = useState(null)

  // ── Load businesses ────────────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/projects')
      .then(r => r.json())
      .then(d => {
        const list = d.projects || []
        setProjects(list)
        const fromUrl = new URLSearchParams(window.location.search).get('projectId')
        setProjectId(fromUrl || list[0]?.id || '')
      })
      .catch(() => toast.error('Failed to load businesses'))
      .finally(() => setLoadingProjects(false))
  }, [])

  const loadRankings = useCallback(async (id, { silent = false } = {}) => {
    if (!id) return
    if (!silent) setLoading(true)
    try {
      const res = await fetch(`/api/projects/${id}/keyword-rankings`)
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to load')
      const json = await res.json()
      setData(json)
      setSelectedKeywordId(prev =>
        json.keywords.some(k => k.id === prev) ? prev : (json.keywords[0]?.id || '')
      )
    } catch (err) {
      if (!silent) toast.error(err.message)
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!projectId) return
    setData(null)
    setScanCache({})
    loadRankings(projectId)
    const url = new URL(window.location.href)
    url.searchParams.set('projectId', projectId)
    window.history.replaceState(null, '', url)
  }, [projectId, loadRankings])

  const businesses = useMemo(() => groupBusinesses(projects), [projects])
  const selectedGroupKey = businesses.keyOf.get(projectId) || ''

  // Poll while a scan is running so the table updates when it finishes
  const hasActiveScan = data?.keywords?.some(k => ['queued', 'processing'].includes(k.latestStatus))
  useEffect(() => {
    if (!hasActiveScan || !projectId) return
    const t = setInterval(() => loadRankings(projectId, { silent: true }), 8000)
    return () => clearInterval(t)
  }, [hasActiveScan, projectId, loadRankings])

  // ── Period ─────────────────────────────────────────────────────────────────
  const range = useMemo(() => {
    if (period === 'custom') {
      const start = startOfDay(new Date(customFrom))
      const end = endOfDay(new Date(customTo))
      if (!isNaN(start) && !isNaN(end) && start <= end) return { start, end }
    }
    const days = PERIODS.find(p => p.key === period)?.days || 30
    return { start: startOfDay(subDays(new Date(), days)), end: new Date() }
  }, [period, customFrom, customTo])

  const rows = useMemo(() => {
    return (data?.keywords || []).map(kw => {
      const { latest, start, completed } = pickScans(kw.scans, range)
      const change = latest && start && latest.analytics.averageRank && start.analytics.averageRank
        ? round1(start.analytics.averageRank - latest.analytics.averageRank)
        : null
      return { ...kw, latest, start, completed, change }
    })
  }, [data, range])

  const summary = useMemo(() => {
    const withLatest = rows.filter(r => r.latest)
    const avg = (fn) => withLatest.length ? withLatest.reduce((s, r) => s + fn(r.latest.analytics), 0) / withLatest.length : null
    const avgRanks = withLatest.map(r => r.latest.analytics.averageRank).filter(Boolean)
    const allScans = rows.flatMap(r => r.scans)
    const lastScan = allScans
      .filter(s => s.status === 'completed')
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]
    return {
      averageRank: avgRanks.length ? round1(avgRanks.reduce((a, b) => a + b, 0) / avgRanks.length) : null,
      top3: avg(a => a.top3Percentage),
      visibility: avg(a => a.visibilityScore),
      keywordCount: rows.length,
      scansCompleted: allScans.filter(s => s.status === 'completed').length,
      lastScan
    }
  }, [rows])

  const selected = rows.find(r => r.id === selectedKeywordId) || null
  const afterScan = selected?.latest || selected?.completed?.[0] || null
  const beforeScan = selected?.start || null

  // ── Grid data for the selected keyword ─────────────────────────────────────
  useEffect(() => {
    for (const scan of [afterScan, beforeScan]) {
      if (!scan || scanCache[scan.id]) continue
      setScanCache(c => ({ ...c, [scan.id]: { loading: true } }))
      fetch(`/api/scans/${scan.id}/results`)
        .then(r => (r.ok ? r.json() : Promise.reject(new Error('Failed to load grid'))))
        .then(d => setScanCache(c => ({ ...c, [scan.id]: { results: d.results || [], competitors: d.topCompetitors || [] } })))
        .catch(() => setScanCache(c => ({ ...c, [scan.id]: { error: true } })))
    }
  }, [afterScan?.id, beforeScan?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleAddKeyword = async (e) => {
    e.preventDefault()
    const kw = newKeyword.trim()
    if (!kw) return
    setAdding(true)
    try {
      const res = await fetch(`/api/projects/${data.project.id}/keywords`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: kw })
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to add keyword')
      // Run the baseline scan right away; later scans run automatically
      await fetch('/api/scans/rescan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: data.project.id, keywordId: json.id })
      })
      toast.success(`"${kw}" added. Baseline scan started.`)
      setNewKeyword('')
      setShowAdd(false)
      setSelectedKeywordId(json.id)
      loadRankings(data.project.id, { silent: true })
    } catch (err) {
      toast.error(err.message)
    } finally {
      setAdding(false)
    }
  }

  const handleRescan = async (kw) => {
    setRescanning(kw.id)
    try {
      const res = await fetch('/api/scans/rescan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: kw.projectId || data.project.id, keywordId: kw.id })
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to start scan')
      toast.success(`Scan started for "${kw.keyword}"`)
      loadRankings(data.project.id, { silent: true })
    } catch (err) {
      toast.error(err.message)
    } finally {
      setRescanning(null)
    }
  }

  const project = data?.project
  const intervalDays = data?.autoRescan?.intervalDays || 15

  // ── Render ─────────────────────────────────────────────────────────────────
  if (!loadingProjects && projects.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center">
        <KeyRound className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-800">No businesses yet</h2>
        <p className="text-sm text-slate-500 mt-1 mb-5">Add a business to start tracking keyword rankings.</p>
        <Button asChild><Link href="/dashboard/projects/new">Add Business</Link></Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Business header */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center gap-5">
        <div className="flex items-center gap-4 min-w-0 flex-1">
          {project?.heroImage ? (
            <img src={project.heroImage} alt="" className="w-20 h-16 rounded-xl object-cover shrink-0" />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <KeyRound className="w-7 h-7" />
            </div>
          )}
          <div className="min-w-0">
            {project ? (
              <>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 truncate">{project.businessName}</h1>
                {project.address && (
                  <p className="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{project.address}</span>
                  </p>
                )}
              </>
            ) : (
              <>
                <Skeleton className="h-7 w-64" />
                <Skeleton className="h-4 w-80 mt-2" />
              </>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {project && (
            <Button asChild variant="outline" className="rounded-xl border-blue-200 text-blue-700 font-semibold">
              <a
                href={project.gmbLink || `https://www.google.com/maps/place/?q=place_id:${project.placeId}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                View GBP <ExternalLink className="w-4 h-4 ml-1.5" />
              </a>
            </Button>
          )}
          {project && (
            <Button asChild className="rounded-xl bg-blue-600 hover:bg-blue-700 font-semibold">
              <Link href={`/dashboard/projects/${project.id}`}>
                <KeyRound className="w-4 h-4 mr-1.5" /> Keywords &amp; Scans
              </Link>
            </Button>
          )}
          <select
            value={selectedGroupKey}
            onChange={(e) => {
              const g = businesses.list.find(b => b.key === e.target.value)
              if (g) setProjectId(g.id)
            }}
            disabled={loadingProjects}
            className="h-10 max-w-[240px] rounded-xl border border-green-200 bg-green-50/40 px-3 text-sm font-semibold text-green-800 focus:outline-none focus:ring-2 focus:ring-green-300"
          >
            {!selectedGroupKey && projectId && <option value="">{project?.businessName || 'Business'}</option>}
            {businesses.list.map(b => (
              <option key={b.key} value={b.key}>{b.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Period tabs */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex bg-white rounded-2xl border border-slate-200 shadow-sm p-1">
          {PERIODS.map(p => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                period === p.key ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        {period === 'custom' && (
          <div className="flex items-center gap-2 text-sm">
            <Input type="date" value={customFrom} max={customTo} onChange={e => setCustomFrom(e.target.value)} className="w-40 bg-white" />
            <span className="text-slate-400">to</span>
            <Input type="date" value={customTo} min={customFrom} onChange={e => setCustomTo(e.target.value)} className="w-40 bg-white" />
          </div>
        )}
        <span className="text-xs text-slate-500 flex items-center gap-1.5 ml-auto">
          <RefreshCcw className="w-3.5 h-3.5" />
          {data?.autoRescan?.enabled === false
            ? 'Automatic scans are paused'
            : `New scan runs automatically every ${intervalDays} days`}
        </span>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard icon={BarChart3} label="Average Rank" value={summary.averageRank ?? '—'} sub="across keywords" loading={loading} />
        <StatCard icon={Trophy} label="Top 3 Coverage" value={summary.top3 != null ? `${Math.round(summary.top3)}%` : '—'} loading={loading} />
        <StatCard icon={Eye} label="Local Visibility" value={summary.visibility != null ? `${Math.round(summary.visibility)}%` : '—'} loading={loading} />
        <StatCard icon={Layers} label="Keywords" value={summary.keywordCount} sub={`${summary.scansCompleted} scans completed`} loading={loading} />
        <StatCard
          icon={CalendarClock}
          label="Last Scan"
          value={summary.lastScan ? fmtShort(summary.lastScan.createdAt) : '—'}
          sub={summary.lastScan ? formatDistanceToNow(new Date(summary.lastScan.createdAt), { addSuffix: true }) : 'No scans yet'}
          loading={loading}
        />
      </div>

      <div className="grid xl:grid-cols-[1.1fr_1fr] gap-6">
        {/* Keyword rankings table */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h2 className="text-xl font-black text-slate-900">Keyword Rankings</h2>
              <p className="text-sm text-slate-500 mt-1">
                Average grid position at the start of the period vs now, with scan dates. Click a keyword to view its grid.
              </p>
            </div>
            <Button onClick={() => setShowAdd(v => !v)} className="rounded-xl bg-blue-600 hover:bg-blue-700 shrink-0" disabled={!project}>
              {showAdd ? <X className="w-4 h-4 mr-1" /> : <Plus className="w-4 h-4 mr-1" />}
              {showAdd ? 'Cancel' : 'Add Keyword'}
            </Button>
          </div>

          {showAdd && (
            <form onSubmit={handleAddKeyword} className="flex gap-2 mb-4">
              <Input
                autoFocus
                value={newKeyword}
                onChange={e => setNewKeyword(e.target.value)}
                placeholder="e.g. english course near me"
                className="rounded-xl"
              />
              <Button type="submit" disabled={adding || !newKeyword.trim()} className="rounded-xl">
                {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add & Scan'}
              </Button>
            </form>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-500">
                  <th className="text-left font-medium px-4 py-3 rounded-l-xl">Keyword</th>
                  <th className="font-medium px-3 py-3">Start</th>
                  <th className="font-medium px-3 py-3">Latest</th>
                  <th className="font-medium px-3 py-3">Top 3</th>
                  <th className="font-medium px-3 py-3">Change</th>
                  <th className="text-right font-medium px-4 py-3 rounded-r-xl">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading && [1, 2, 3].map(i => (
                  <tr key={i}><td colSpan={6} className="px-4 py-3"><Skeleton className="h-10 w-full" /></td></tr>
                ))}
                {!loading && rows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-slate-500">
                      No keywords yet. Add one to run the baseline scan.
                    </td>
                  </tr>
                )}
                {!loading && rows.map(r => {
                  const active = r.id === selectedKeywordId
                  const running = ['queued', 'processing'].includes(r.latestStatus)
                  return (
                    <tr
                      key={r.id}
                      onClick={() => setSelectedKeywordId(r.id)}
                      className={`cursor-pointer border-b border-slate-100 last:border-0 transition ${active ? 'bg-blue-50/60' : 'hover:bg-slate-50'}`}
                    >
                      <td className="px-4 py-4">
                        <span className={`flex items-center gap-2 ${active ? 'text-blue-700 font-semibold' : 'text-slate-800'}`}>
                          <Search className="w-4 h-4 text-blue-500 shrink-0" />
                          {r.keyword}
                        </span>
                      </td>
                      <td className="px-3 py-4 text-center">
                        {r.start ? (
                          <div>
                            <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-bold ${avgBadge(r.start.analytics.averageRank)}`}>
                              {r.start.analytics.averageRank || '20+'}
                            </span>
                            <div className="text-[11px] text-slate-400 mt-0.5">{fmtShort(r.start.createdAt)}</div>
                          </div>
                        ) : <span className="text-slate-400">—</span>}
                      </td>
                      <td className="px-3 py-4 text-center">
                        {r.latest ? (
                          <div>
                            <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-bold ${avgBadge(r.latest.analytics.averageRank)}`}>
                              {r.latest.analytics.averageRank || '20+'}
                            </span>
                            {r.start && <div className="text-[11px] text-slate-400 mt-0.5">{fmtShort(r.latest.createdAt)}</div>}
                          </div>
                        ) : <span className="text-slate-400">—</span>}
                      </td>
                      <td className="px-3 py-4 text-center text-slate-700">
                        {r.latest ? `${r.latest.analytics.top3Percentage}%` : '—'}
                      </td>
                      <td className="px-3 py-4 text-center"><ChangeBadge change={r.change} /></td>
                      <td className="px-4 py-4 text-right">
                        <StatusCell
                          row={r}
                          running={running}
                          rescanning={rescanning === r.id}
                          onRescan={(e) => { e.stopPropagation(); handleRescan(r) }}
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Ranking grid: before & after */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-slate-900">Google Maps Ranking Grid</h2>
                {afterScan && (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                    {beforeScan ? 'Before & After' : 'Baseline'}
                  </span>
                )}
              </div>
              {selected && <p className="text-sm text-slate-500 mt-1">“{selected.keyword}”</p>}
            </div>
            <select
              value={selectedKeywordId}
              onChange={e => setSelectedKeywordId(e.target.value)}
              className="h-10 max-w-[220px] rounded-xl border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              {rows.map(r => <option key={r.id} value={r.id}>{r.keyword}</option>)}
            </select>
          </div>

          {beforeScan && afterScan && (
            <div className="inline-flex bg-slate-100 rounded-xl p-1 mb-4">
              {[['compare', 'Before & After'], ['latest', 'Latest only']].map(([k, label]) => (
                <button
                  key={k}
                  onClick={() => setGridView(k)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${gridView === k ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {!afterScan ? (
            <div className="py-16 text-center text-slate-500 text-sm">
              {selected && ['queued', 'processing'].includes(selected.latestStatus)
                ? <span className="inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Scan in progress…</span>
                : 'No completed scan for this keyword yet.'}
            </div>
          ) : (
            <div className={`grid gap-5 ${beforeScan && gridView === 'compare' ? 'sm:grid-cols-2' : ''}`}>
              {beforeScan && gridView === 'compare' && (
                <ScanGrid label="Before" scan={beforeScan} data={scanCache[beforeScan.id]} />
              )}
              <ScanGrid
                label={beforeScan ? 'After' : null}
                scan={afterScan}
                data={scanCache[afterScan.id]}
                scanNumber={selected.completed.length - selected.completed.findIndex(s => s.id === afterScan.id)}
                large={!(beforeScan && gridView === 'compare')}
              />
            </div>
          )}

          <div className="flex flex-wrap justify-center gap-4 mt-5 text-xs text-slate-600">
            {LEGEND.map(l => (
              <span key={l.label} className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${l.cls}`} /> {l.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {selected && afterScan && (
        <div className="grid xl:grid-cols-[1.4fr_1fr] gap-6">
          <CompetitorsPanel
            keyword={selected.keyword}
            businessName={project?.businessName}
            after={scanCache[afterScan.id]}
            before={beforeScan ? scanCache[beforeScan.id] : null}
            afterScan={afterScan}
            beforeScan={beforeScan}
          />
          <HistoryPanel row={selected} intervalDays={intervalDays} onOpen={(id) => router.push(`/dashboard/scans/${id}`)} />
        </div>
      )}
    </div>
  )
}

// ── Pieces ───────────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, sub, loading }) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-5 flex gap-4">
      <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
        <Icon className="w-6 h-6" />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-slate-500">{label}</p>
        {loading ? <Skeleton className="h-8 w-16 mt-1" /> : <p className="text-2xl sm:text-3xl font-black text-slate-900">{value}</p>}
        {sub && !loading && <p className="text-xs text-slate-400 mt-0.5 truncate">{sub}</p>}
      </div>
    </div>
  )
}

function ChangeBadge({ change }) {
  if (change == null) return <span className="text-slate-300">—</span>
  if (change === 0) return <span className="inline-flex items-center text-slate-500 text-xs font-semibold"><Minus className="w-3 h-3 mr-0.5" />0</span>
  const up = change > 0 // lower average rank = better
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold ${up ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
      {up ? <ArrowUp className="w-3 h-3 mr-0.5" /> : <ArrowDown className="w-3 h-3 mr-0.5" />}
      {Math.abs(change)}
    </span>
  )
}

function StatusCell({ row, running, rescanning, onRescan }) {
  const last = row.scans[0]
  if (running) {
    const pct = last?.totalPoints ? Math.round((last.processedPoints / last.totalPoints) * 100) : 0
    return (
      <div className="inline-flex flex-col items-end">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700">
          <Loader2 className="w-3 h-3 animate-spin" /> Scanning {pct}%
        </span>
      </div>
    )
  }
  if (!last) {
    return (
      <Button size="sm" variant="outline" className="h-7 text-xs rounded-lg" onClick={onRescan} disabled={rescanning}>
        {rescanning ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Run scan'}
      </Button>
    )
  }
  const styles = {
    completed: 'bg-green-50 text-green-700',
    failed: 'bg-red-50 text-red-600',
    cancelled: 'bg-slate-100 text-slate-500'
  }
  return (
    <div className="inline-flex flex-col items-end gap-0.5 group">
      <span className={`px-2 py-0.5 rounded-md text-xs font-semibold capitalize ${styles[last.status] || 'bg-slate-100 text-slate-600'}`}>
        {last.status}
      </span>
      <span className="text-[11px] text-slate-400">{fmtShort(last.createdAt)}</span>
      <button
        onClick={onRescan}
        disabled={rescanning}
        className="text-[11px] text-blue-600 hover:underline inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition"
      >
        {rescanning ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCcw className="w-3 h-3" />} Scan now
      </button>
    </div>
  )
}

function ScanGrid({ label, scan, data, scanNumber, large }) {
  const results = data?.results || []
  const rowsN = results.length ? Math.max(...results.map(r => r.rowIndex ?? 0)) + 1 : 0
  const colsN = results.length ? Math.max(...results.map(r => r.colIndex ?? 0)) + 1 : 0
  const cells = new Map(results.map(r => [`${r.rowIndex},${r.colIndex}`, r]))
  const textSize = colsN > 9 ? 'text-[8px]' : colsN > 7 ? 'text-[10px]' : large ? 'text-sm' : 'text-xs'

  return (
    <div className={large ? 'max-w-md mx-auto w-full' : 'w-full'}>
      <div className="flex items-baseline justify-between mb-2 gap-2">
        <div className="flex items-center gap-2">
          {label && (
            <span className={`text-[11px] font-bold uppercase tracking-wide px-2 py-0.5 rounded ${label === 'Before' ? 'bg-slate-100 text-slate-600' : 'bg-blue-50 text-blue-700'}`}>
              {label}
            </span>
          )}
          <span className="font-bold text-slate-900 text-sm sm:text-base">{format(new Date(scan.createdAt), 'MMMM d, yyyy')}</span>
        </div>
        <span className="text-xs text-slate-500 whitespace-nowrap">
          {scanNumber ? `Scan #${scanNumber} · ` : ''}Avg. {scan.analytics?.averageRank || '20+'}
        </span>
      </div>
      <div className="bg-stone-100 rounded-2xl p-2 sm:p-3">
        {!data || data.loading ? (
          <Skeleton className="w-full aspect-square rounded-xl" />
        ) : data.error ? (
          <div className="aspect-square flex items-center justify-center text-sm text-slate-500">Couldn’t load grid</div>
        ) : (
          <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${colsN}, minmax(0, 1fr))` }}>
            {Array.from({ length: rowsN * colsN }, (_, i) => {
              const r = cells.get(`${Math.floor(i / colsN)},${i % colsN}`)
              if (!r) return <div key={i} className="aspect-square" />
              const label = r.found && r.rank ? (r.rank > 20 ? '20+' : r.rank) : '20+'
              return (
                <div
                  key={i}
                  title={r.found ? `Rank ${r.rank}` : 'Not in top 20'}
                  className={`aspect-square rounded-full flex items-center justify-center font-bold shadow-sm ${textSize} ${rankColor(r.rank, r.found)}`}
                >
                  {label}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function CompetitorsPanel({ keyword, businessName, after, before, afterScan, beforeScan }) {
  const beforeMap = new Map((before?.competitors || []).map(c => [c.placeId, c]))
  const comps = after?.competitors || []
  const total = after?.results?.length || afterScan.analytics?.totalPoints || 0

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-5 sm:p-6">
      <div className="flex items-center gap-2 mb-1">
        <Users className="w-5 h-5 text-blue-600" />
        <h2 className="text-xl font-black text-slate-900">Top Competitors</h2>
      </div>
      <p className="text-sm text-slate-500 mb-4">
        Businesses ranking for “{keyword}” in the {format(new Date(afterScan.createdAt), 'MMM d')} scan
        {beforeScan ? `, compared with ${format(new Date(beforeScan.createdAt), 'MMM d')}` : ''}.
      </p>

      {!after || after.loading ? (
        <div className="space-y-2">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
      ) : comps.length === 0 ? (
        <p className="text-sm text-slate-500 py-6 text-center">No competitor data for this scan.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-500">
                <th className="text-left font-medium px-3 py-2.5 rounded-l-xl">#</th>
                <th className="text-left font-medium px-3 py-2.5">Business</th>
                <th className="font-medium px-3 py-2.5">Avg. Rank</th>
                <th className="font-medium px-3 py-2.5">Grid Presence</th>
                {beforeScan && <th className="font-medium px-3 py-2.5 rounded-r-xl">vs Before</th>}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-100 bg-blue-50/40">
                <td className="px-3 py-3 text-blue-600 font-bold">★</td>
                <td className="px-3 py-3 font-semibold text-blue-700">{businessName} <span className="text-xs font-normal text-blue-500">(you)</span></td>
                <td className="px-3 py-3 text-center">
                  <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-bold ${avgBadge(afterScan.analytics?.averageRank)}`}>
                    {afterScan.analytics?.averageRank || '20+'}
                  </span>
                </td>
                <td className="px-3 py-3 text-center text-slate-700">
                  {total ? `${Math.round(((afterScan.analytics?.foundCount || 0) / total) * 100)}%` : '—'}
                </td>
                {beforeScan && (
                  <td className="px-3 py-3 text-center">
                    <ChangeBadge change={beforeScan.analytics?.averageRank && afterScan.analytics?.averageRank
                      ? round1(beforeScan.analytics.averageRank - afterScan.analytics.averageRank) : null} />
                  </td>
                )}
              </tr>
              {comps.slice(0, 8).map((c, i) => {
                const prev = beforeMap.get(c.placeId)
                const change = prev ? round1(prev.avgRank - c.avgRank) : null
                return (
                  <tr key={c.placeId || i} className="border-b border-slate-100 last:border-0">
                    <td className="px-3 py-3 text-slate-400">{i + 1}</td>
                    <td className="px-3 py-3">
                      <div className="font-medium text-slate-800">{c.name}</div>
                      <div className="text-xs text-slate-400 flex items-center gap-2">
                        {c.rating ? <span className="inline-flex items-center gap-0.5"><Star className="w-3 h-3 fill-amber-400 text-amber-400" />{c.rating}</span> : null}
                        {c.reviewCount ? <span>{c.reviewCount} reviews</span> : null}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-bold ${avgBadge(c.avgRank)}`}>{round1(c.avgRank)}</span>
                    </td>
                    <td className="px-3 py-3 text-center text-slate-700">{total ? `${Math.round((c.appearances / total) * 100)}%` : '—'}</td>
                    {beforeScan && (
                      <td className="px-3 py-3 text-center">
                        {before?.loading ? <Loader2 className="w-3 h-3 animate-spin inline" /> : prev ? <ChangeBadge change={change} /> : <span className="text-[11px] font-semibold text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded">New</span>}
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function HistoryPanel({ row, intervalDays, onOpen }) {
  const scans = row.scans
  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-5 sm:p-6">
      <div className="flex items-center gap-2 mb-1">
        <History className="w-5 h-5 text-blue-600" />
        <h2 className="text-xl font-black text-slate-900">Scan History</h2>
      </div>
      <p className="text-sm text-slate-500 mb-4">
        {row.nextAutoScanAt
          ? <>Next automatic scan {new Date(row.nextAutoScanAt) <= new Date() ? 'is due today' : <>on <span className="font-semibold text-slate-700">{format(new Date(row.nextAutoScanAt), 'MMM d, yyyy')}</span></>} (every {intervalDays} days).</>
          : 'Run the first scan to set a baseline. Later scans run automatically.'}
      </p>
      <ol className="relative border-l border-slate-200 ml-2 space-y-4">
        {scans.slice(0, 8).map((s, i) => {
          const isBaseline = i === scans.length - 1
          return (
            <li key={s.id} className="ml-4">
              <span className={`absolute -left-[5px] mt-1.5 w-2.5 h-2.5 rounded-full ${s.status === 'completed' ? 'bg-blue-600' : s.status === 'failed' ? 'bg-red-500' : 'bg-slate-300'}`} />
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    {format(new Date(s.createdAt), 'MMM d, yyyy')}
                    {isBaseline && <span className="ml-2 text-[10px] font-bold uppercase bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">Baseline</span>}
                  </p>
                  <p className="text-xs text-slate-500 capitalize">
                    {s.status === 'completed'
                      ? `Avg. ${s.analytics?.averageRank || '20+'} · Top 3 ${s.analytics?.top3Percentage ?? 0}%`
                      : s.status}
                  </p>
                </div>
                {s.status === 'completed' && (
                  <Button size="sm" variant="ghost" className="h-7 text-xs text-blue-600" onClick={() => onOpen(s.id)}>
                    Full report
                  </Button>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
