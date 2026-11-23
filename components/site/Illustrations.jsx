// Code-drawn product illustrations for the marketing pages.
// They are pure JSX (no client JS), so they render on the server, scale to any width
// and never break like a missing image would. Pick one by name with <Illustration name="..." />.

import {
  MapPin, Star, Search, Bot, Check, FileText, TrendingUp, Globe, Sparkles, Phone,
  BarChart3, ShieldCheck, Building2, ListChecks, Users, MessageSquare
} from 'lucide-react'

// Deterministic "random" so server and client render identical markup
const seeded = (seed) => () => {
  seed = (seed * 9301 + 49297) % 233280
  return seed / 233280
}

const rankColor = (r) =>
  r <= 3 ? 'bg-emerald-500' : r <= 7 ? 'bg-lime-500' : r <= 12 ? 'bg-amber-400' : r <= 18 ? 'bg-orange-500' : 'bg-rose-500'

function Frame({ title, children, className = '' }) {
  return (
    <div className={`bg-white rounded-[2rem] border border-slate-100 shadow-2xl shadow-blue-900/10 overflow-hidden ${className}`}>
      <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-100 bg-slate-50/70">
        <span className="w-2.5 h-2.5 rounded-full bg-rose-300" />
        <span className="w-2.5 h-2.5 rounded-full bg-amber-300" />
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-300" />
        <span className="ml-3 text-[11px] font-bold text-slate-400 truncate">{title}</span>
      </div>
      <div className="p-5 md:p-6">{children}</div>
    </div>
  )
}

export function HeatmapGrid({ size = 7, seed = 7, improved = false, label }) {
  const rand = seeded(seed)
  const c = (size - 1) / 2
  const cells = []
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const d = Math.sqrt((x - c) ** 2 + (y - c) ** 2)
      const base = improved ? 1 + d * 1.1 : 2 + d * 3.2
      const r = Math.max(1, Math.min(20, Math.round(base + rand() * (improved ? 2 : 5))))
      cells.push(r)
    }
  }
  return (
    <div>
      {label && <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">{label}</p>}
      <div
        className="relative rounded-2xl p-3 bg-[linear-gradient(135deg,#e8f0fb_0%,#f4f8fd_50%,#e6eef9_100%)] border border-slate-100"
        style={{ display: 'grid', gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`, gap: '6px' }}
      >
        {cells.map((r, i) => (
          <div key={i} className={`aspect-square rounded-full ${rankColor(r)} text-white text-[10px] md:text-[11px] font-black flex items-center justify-center shadow-sm`}>
            {r > 19 ? '20+' : r}
          </div>
        ))}
      </div>
    </div>
  )
}

function Heatmap() {
  return (
    <Frame title="Geo-grid scan · “dentist near me” · 7×7 · 5 mi">
      <HeatmapGrid />
      <div className="mt-4 grid grid-cols-3 gap-3 text-center">
        {[['Avg. rank', '6.4'], ['Top-3 points', '18/49'], ['Visibility', '62%']].map(([k, v]) => (
          <div key={k} className="rounded-xl bg-slate-50 py-2.5">
            <p className="text-lg font-black text-slate-900">{v}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{k}</p>
          </div>
        ))}
      </div>
    </Frame>
  )
}

function BeforeAfter() {
  return (
    <Frame title="Side-by-side compare · Scan #1 vs Scan #6">
      <div className="grid grid-cols-2 gap-4">
        <HeatmapGrid size={5} seed={3} label="Before" />
        <HeatmapGrid size={5} seed={3} improved label="After" />
      </div>
      <div className="mt-4 flex items-center justify-center gap-2 text-emerald-600 text-sm font-black">
        <TrendingUp className="w-4 h-4" /> Avg. rank improved 9.8 → 3.1
      </div>
    </Frame>
  )
}

function RankChart() {
  const pts = [18, 16, 15, 12, 11, 9, 7, 6, 5, 4, 3, 3]
  const w = 300, h = 120
  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${(i / (pts.length - 1)) * w} ${(p / 20) * h}`).join(' ')
  return (
    <Frame title="Keyword rank history · last 12 weeks">
      <div className="flex items-end justify-between mb-4">
        <div>
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">“emergency plumber”</p>
          <p className="text-3xl font-black text-slate-900">#3 <span className="text-sm text-emerald-600">▲ 15</span></p>
        </div>
        <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-black">Map Pack</span>
      </div>
      <svg viewBox={`0 0 ${w} ${h + 10}`} className="w-full h-36">
        <defs>
          <linearGradient id="rc" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#2563eb" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3].map(i => <line key={i} x1="0" x2={w} y1={(i * h) / 3} y2={(i * h) / 3} stroke="#eef2f7" />)}
        <path d={`${path} L ${w} ${h} L 0 ${h} Z`} fill="url(#rc)" />
        <path d={path} fill="none" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Frame>
  )
}

function LocalPack() {
  const rows = [
    { n: 'Your Business', r: 4.9, c: 312, you: true },
    { n: 'Competitor A', r: 4.6, c: 188 },
    { n: 'Competitor B', r: 4.4, c: 97 }
  ]
  return (
    <Frame title="Google Search · local pack">
      <div className="flex items-center gap-3 bg-slate-50 rounded-2xl px-4 py-3 mb-4">
        <Search className="w-4 h-4 text-slate-400" />
        <span className="text-sm font-semibold text-slate-600">hair salon near me</span>
      </div>
      <div className="h-24 rounded-2xl bg-[linear-gradient(135deg,#dbe8f7,#eef4fb)] relative mb-4 overflow-hidden">
        {[[20, 40], [55, 25], [75, 60]].map(([l, t], i) => (
          <MapPin key={i} className={`absolute w-6 h-6 ${i === 0 ? 'text-rose-500' : 'text-slate-400'}`} style={{ left: `${l}%`, top: `${t}%` }} />
        ))}
      </div>
      <div className="space-y-2.5">
        {rows.map((r, i) => (
          <div key={r.n} className={`flex items-center justify-between rounded-xl px-4 py-3 ${r.you ? 'bg-blue-50 border border-blue-200' : 'bg-slate-50'}`}>
            <div>
              <p className={`text-sm font-black ${r.you ? 'text-blue-700' : 'text-slate-700'}`}>{i + 1}. {r.n}</p>
              <p className="text-[11px] font-bold text-amber-500 flex items-center gap-1"><Star className="w-3 h-3 fill-amber-400" /> {r.r} ({r.c})</p>
            </div>
            {r.you && <Phone className="w-4 h-4 text-blue-600" />}
          </div>
        ))}
      </div>
    </Frame>
  )
}

function GbpProfile() {
  return (
    <Frame title="Google Business Profile · completeness">
      <div className="flex items-center gap-4 mb-5">
        <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center"><Building2 className="w-7 h-7" /></div>
        <div>
          <p className="font-black text-slate-900">Your Business</p>
          <p className="text-xs font-bold text-amber-500 flex items-center gap-1"><Star className="w-3 h-3 fill-amber-400" /> 4.9 · 312 reviews</p>
        </div>
        <span className="ml-auto text-2xl font-black text-emerald-600">94%</span>
      </div>
      <div className="space-y-2.5">
        {[['Primary & secondary categories', true], ['Services & products', true], ['Weekly posts', true], ['Photos (last 30 days)', true], ['Q&A answered', false]].map(([t, ok]) => (
          <div key={t} className="flex items-center gap-3 text-sm font-bold text-slate-600">
            <span className={`w-5 h-5 rounded-md flex items-center justify-center ${ok ? 'bg-emerald-500' : 'bg-amber-400'}`}><Check className="w-3 h-3 text-white" /></span>
            {t}
          </div>
        ))}
      </div>
    </Frame>
  )
}

function Citations() {
  const dirs = ['Google', 'Bing Places', 'Apple Maps', 'Yelp', 'Facebook', 'Foursquare', 'Justdial', 'Yellow Pages']
  return (
    <Frame title="Citations · NAP consistency">
      <div className="space-y-2">
        {dirs.map((d, i) => (
          <div key={d} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-2.5">
            <span className="text-sm font-bold text-slate-700 flex items-center gap-2"><Globe className="w-4 h-4 text-blue-500" />{d}</span>
            <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${i < 5 ? 'bg-emerald-50 text-emerald-700' : i < 7 ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'}`}>
              {i < 5 ? 'Live' : i < 7 ? 'Fix NAP' : 'Submitted'}
            </span>
          </div>
        ))}
      </div>
    </Frame>
  )
}

function Report() {
  return (
    <Frame title="Monthly report · Your Agency logo">
      <div className="flex items-center justify-between mb-5">
        <div className="h-7 w-28 rounded-lg bg-gradient-to-r from-blue-600 to-blue-400" />
        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">November</span>
      </div>
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[['Calls', '+38%'], ['Direction req.', '+21%'], ['Top-3 kws', '14']].map(([k, v]) => (
          <div key={k} className="rounded-xl bg-slate-50 p-3">
            <p className="text-lg font-black text-slate-900">{v}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase">{k}</p>
          </div>
        ))}
      </div>
      <div className="flex items-end gap-2 h-24">
        {[30, 42, 38, 55, 61, 58, 72, 80, 77, 90].map((h, i) => (
          <div key={i} className="flex-1 rounded-t-md bg-gradient-to-t from-blue-600 to-blue-400" style={{ height: `${h}%` }} />
        ))}
      </div>
    </Frame>
  )
}

function AiChat({ question = 'Who is the best physiotherapist near me?' }) {
  return (
    <Frame title="AI assistant">
      <div className="flex justify-end mb-4">
        <div className="bg-blue-600 text-white text-sm font-semibold rounded-2xl rounded-tr-md px-4 py-3 max-w-[85%]">{question}</div>
      </div>
      <div className="flex gap-3">
        <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0"><Bot className="w-4 h-4" /></div>
        <div className="bg-slate-50 rounded-2xl rounded-tl-md px-4 py-3 text-sm text-slate-600 leading-relaxed space-y-2">
          <p>Here are well-reviewed options nearby:</p>
          <p><span className="font-black text-slate-900">1. Your Clinic</span> · 4.9★, sports-injury specialists, open Sundays.</p>
          <p className="text-slate-400">2. Another Clinic · 4.5★</p>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-black"><Check className="w-3 h-3" /> Cited: yourclinic.com</span>
        </div>
      </div>
      <p className="text-[10px] text-slate-400 font-semibold text-center mt-4">Illustrative example</p>
    </Frame>
  )
}

function AiVisibility() {
  const engines = [['ChatGPT', 72], ['Google AI Overviews', 64], ['Gemini', 51], ['Perplexity', 58], ['Copilot', 39]]
  return (
    <Frame title="AI Tracker · brand mention share">
      <div className="space-y-4">
        {engines.map(([e, v]) => (
          <div key={e}>
            <div className="flex justify-between text-sm font-bold text-slate-600 mb-1.5"><span className="flex items-center gap-2"><Sparkles className="w-3.5 h-3.5 text-blue-500" />{e}</span><span>{v}%</span></div>
            <div className="h-2.5 rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-blue-400" style={{ width: `${v}%` }} /></div>
          </div>
        ))}
      </div>
    </Frame>
  )
}

function Serp() {
  const rows = [['best pizza delhi', 2, 3], ['pizza delivery vikaspuri', 1, 0], ['wood fired pizza', 5, 2], ['late night pizza', 8, -1], ['pizza near me', 3, 4]]
  return (
    <Frame title="SERP Tracker · organic positions">
      <div className="grid grid-cols-[1fr_auto_auto] gap-x-6 gap-y-3 text-sm">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Keyword</span>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pos.</span>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">7d</span>
        {rows.map(([k, p, d]) => (
          <div key={k} className="contents">
            <span className="font-bold text-slate-700 truncate">{k}</span>
            <span className="font-black text-slate-900">{p}</span>
            <span className={`font-black ${d > 0 ? 'text-emerald-600' : d < 0 ? 'text-rose-500' : 'text-slate-400'}`}>{d > 0 ? `▲${d}` : d < 0 ? `▼${-d}` : '–'}</span>
          </div>
        ))}
      </div>
    </Frame>
  )
}

function Audit() {
  return (
    <Frame title="360° Local SEO Audit">
      <div className="flex items-center gap-6 mb-5">
        <div className="relative w-28 h-28 shrink-0">
          <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="#eef2f7" strokeWidth="3.5" />
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="#2563eb" strokeWidth="3.5" strokeDasharray="78 100" strokeLinecap="round" />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-2xl font-black text-slate-900">78</span>
        </div>
        <div className="space-y-2 text-sm font-bold">
          {[['GBP', 'text-emerald-600', '92'], ['Website', 'text-amber-600', '71'], ['Citations', 'text-amber-600', '68'], ['Reviews', 'text-emerald-600', '85']].map(([k, c, v]) => (
            <p key={k} className="text-slate-600">{k}: <span className={c}>{v}</span></p>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        {['Add service-area pages for 3 suburbs', 'Fix NAP mismatch on 2 directories', 'Reply to 6 unanswered reviews'].map(t => (
          <div key={t} className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-50 rounded-lg px-3 py-2"><ListChecks className="w-3.5 h-3.5 text-blue-500" />{t}</div>
        ))}
      </div>
    </Frame>
  )
}

function Analyzer() {
  return (
    <Frame title="Scan Analyzer · AI insights">
      <HeatmapGrid size={5} seed={11} />
      <div className="mt-4 space-y-2">
        {['Rankings drop sharply north of the river: competitors cluster there.', 'You win every point within 1 mile: the core is strong.', 'Add a “North Side” service page and request reviews from that area.'].map((t, i) => (
          <div key={i} className="flex gap-2 text-xs font-semibold text-slate-600 bg-blue-50/60 rounded-lg px-3 py-2"><Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />{t}</div>
        ))}
      </div>
    </Frame>
  )
}

function Checklist() {
  return (
    <Frame title="Local SEO checklist">
      <div className="space-y-2.5">
        {[['Claim & verify Google Business Profile', true], ['Pick the right primary category', true], ['Consistent NAP on top 30 directories', true], ['Location pages with LocalBusiness schema', false], ['Review request flow after every job', false], ['Monthly geo-grid scan', false]].map(([t, ok]) => (
          <div key={t} className="flex items-center gap-3 text-sm font-bold text-slate-600">
            <span className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${ok ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`}>{ok && <Check className="w-3 h-3 text-white" />}</span>
            <span className={ok ? 'line-through text-slate-400' : ''}>{t}</span>
          </div>
        ))}
      </div>
    </Frame>
  )
}

function CodeBlock() {
  return (
    <Frame title="schema.json">
      <pre className="text-[11px] md:text-xs leading-relaxed font-mono text-slate-700 overflow-hidden">
{`{
  "@context": "https://schema.org",
  "@type": "Dentist",
  "name": "Your Clinic",
  "telephone": "+1-555-0100",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Mississauga"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.9",
    "reviewCount": "312"
  }
}`}
      </pre>
    </Frame>
  )
}

function Team() {
  return (
    <Frame title="Ringscale AI">
      <div className="grid grid-cols-3 gap-3">
        {[Users, MapPin, Bot, BarChart3, ShieldCheck, MessageSquare].map((I, i) => (
          <div key={i} className="aspect-square rounded-2xl bg-gradient-to-br from-blue-50 to-slate-50 border border-slate-100 flex items-center justify-center">
            <I className="w-8 h-8 text-blue-600" />
          </div>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-center">
        {[['2', 'Offices: Delhi & Mississauga'], ['24/7', 'Automated scans']].map(([v, k]) => (
          <div key={k} className="rounded-xl bg-slate-50 py-3"><p className="text-xl font-black text-slate-900">{v}</p><p className="text-[10px] font-bold text-slate-400 uppercase">{k}</p></div>
        ))}
      </div>
    </Frame>
  )
}

function Docs() {
  return (
    <Frame title="Docs">
      <div className="grid grid-cols-[110px_1fr] gap-4">
        <div className="space-y-2">
          {['Getting started', 'Projects', 'Scans', 'Reports', 'Billing'].map((t, i) => (
            <div key={t} className={`text-[11px] font-bold rounded-lg px-2 py-1.5 ${i === 2 ? 'bg-blue-50 text-blue-700' : 'text-slate-500'}`}>{t}</div>
          ))}
        </div>
        <div className="space-y-2.5">
          <div className="h-4 w-3/4 rounded bg-slate-200" />
          <div className="h-2.5 w-full rounded bg-slate-100" />
          <div className="h-2.5 w-11/12 rounded bg-slate-100" />
          <div className="h-2.5 w-4/5 rounded bg-slate-100" />
          <div className="h-16 rounded-xl bg-slate-900 mt-3" />
          <div className="h-2.5 w-full rounded bg-slate-100" />
          <div className="h-2.5 w-2/3 rounded bg-slate-100" />
        </div>
      </div>
    </Frame>
  )
}

function Growth() {
  return (
    <Frame title="Partner dashboard">
      <div className="grid grid-cols-2 gap-3 mb-5">
        {[['Referred accounts', '24'], ['Recurring payouts', 'Monthly']].map(([k, v]) => (
          <div key={k} className="rounded-xl bg-slate-50 p-3"><p className="text-xl font-black text-slate-900">{v}</p><p className="text-[10px] font-bold text-slate-400 uppercase">{k}</p></div>
        ))}
      </div>
      <div className="flex items-end gap-2 h-28">
        {[20, 28, 26, 40, 48, 55, 63, 70, 82, 95].map((h, i) => (
          <div key={i} className="flex-1 rounded-t-md bg-gradient-to-t from-emerald-500 to-emerald-300" style={{ height: `${h}%` }} />
        ))}
      </div>
      <p className="text-[10px] text-slate-400 font-semibold text-center mt-4">Illustrative example</p>
    </Frame>
  )
}

function Video() {
  return (
    <Frame title="On-demand sessions">
      <div className="aspect-video rounded-2xl bg-gradient-to-br from-slate-900 via-blue-900 to-blue-700 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-30"><HeatmapGrid size={9} seed={5} /></div>
        <div className="relative w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-2xl">
          <div className="w-0 h-0 border-y-[10px] border-y-transparent border-l-[16px] border-l-blue-600 ml-1" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        {['Winning the map pack in 90 days', 'From rankings to phone calls', 'AI search for local businesses'].map((t, i) => (
          <div key={t} className="flex items-center justify-between text-xs font-bold text-slate-600 bg-slate-50 rounded-lg px-3 py-2"><span>{i + 1}. {t}</span><FileText className="w-3.5 h-3.5 text-blue-500" /></div>
        ))}
      </div>
    </Frame>
  )
}

function News() {
  return (
    <Frame title="SEO News">
      <div className="space-y-3">
        {[['Algorithm', 'bg-rose-50 text-rose-600'], ['Google Business Profile', 'bg-blue-50 text-blue-700'], ['AI Search', 'bg-violet-50 text-violet-700'], ['Reviews', 'bg-amber-50 text-amber-700']].map(([t, c], i) => (
          <div key={t} className="rounded-xl border border-slate-100 p-3">
            <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${c}`}>{t}</span>
            <div className="h-3 rounded bg-slate-200 mt-2.5" style={{ width: `${85 - i * 8}%` }} />
            <div className="h-2 rounded bg-slate-100 mt-2 w-full" />
          </div>
        ))}
      </div>
    </Frame>
  )
}

const MAP = {
  heatmap: Heatmap,
  compare: BeforeAfter,
  rank: RankChart,
  localpack: LocalPack,
  gbp: GbpProfile,
  citations: Citations,
  report: Report,
  ai: AiChat,
  aitracker: AiVisibility,
  serp: Serp,
  audit: Audit,
  analyzer: Analyzer,
  checklist: Checklist,
  code: CodeBlock,
  team: Team,
  docs: Docs,
  growth: Growth,
  video: Video,
  news: News
}

export function Illustration({ name, ...props }) {
  const C = MAP[name] || Heatmap
  return <C {...props} />
}

