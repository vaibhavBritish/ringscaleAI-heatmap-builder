'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Check, Copy, Download, Plus, Trash2, Loader2, XCircle, AlertTriangle, CheckCircle2, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'

const card = 'bg-white rounded-[2rem] border border-slate-100 shadow-2xl shadow-blue-900/5 p-6 md:p-10'
const label = 'block text-xs font-black text-slate-500 uppercase tracking-widest mb-2'
const input = 'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[15px] font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500'

function useCopy() {
  const [copied, setCopied] = useState(false)
  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {}
  }
  return [copied, copy]
}

function download(name, text, type = 'text/plain') {
  const blob = new Blob([text], { type })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = name
  a.click()
  URL.revokeObjectURL(a.href)
}

export function ToolSection({ children }) {
  return (
    <section className="px-6 pb-24 -mt-4 bg-white">
      <div className="container mx-auto max-w-5xl">{children}</div>
    </section>
  )
}

/* ---------------- Credit Estimator ---------------- */

const CREDITS_PER_KEYWORD = 100
const PLANS = [
  { name: '7-Day Trial', credits: 300, radius: 5 },
  { name: 'Advance', credits: 1200, radius: 5 },
  { name: 'Pro', credits: 2400, radius: 10 },
  { name: 'Pro Plus', credits: 5000, radius: 20 }
]

export function CreditEstimator() {
  const [locations, setLocations] = useState(1)
  const [keywords, setKeywords] = useState(5)
  const [radius, setRadius] = useState(5)

  const total = Math.max(0, locations) * Math.max(0, keywords) * CREDITS_PER_KEYWORD
  const plan = PLANS.find(p => p.credits >= total && p.radius >= radius)

  return (
    <div className={card}>
      <div className="grid md:grid-cols-2 gap-10">
        <div className="space-y-8">
          {[
            ['Locations / business profiles', locations, setLocations, 1, 50],
            ['Keywords per location', keywords, setKeywords, 1, 50],
            ['Scan radius needed (miles)', radius, setRadius, 1, 20]
          ].map(([l, v, set, min, max]) => (
            <div key={l}>
              <div className="flex justify-between items-baseline">
                <span className={label}>{l}</span>
                <span className="text-2xl font-black text-slate-900">{v}</span>
              </div>
              <input type="range" min={min} max={max} value={v} onChange={e => set(Number(e.target.value))} className="w-full accent-blue-600" aria-label={l} />
            </div>
          ))}
          <p className="text-sm font-semibold text-slate-500 leading-relaxed">
            Each tracked keyword uses {CREDITS_PER_KEYWORD} credits. Automatic re-scans every 15 days are included at no extra cost.
          </p>
        </div>
        <div className="rounded-3xl bg-gradient-to-br from-blue-700 to-blue-500 text-white p-8 flex flex-col">
          <p className="text-xs font-black uppercase tracking-widest text-blue-100">Credits needed</p>
          <p className="text-6xl font-black mt-2">{total.toLocaleString()}</p>
          <p className="text-blue-100 font-semibold mt-1">{locations * keywords} tracked keywords</p>
          <div className="mt-8 rounded-2xl bg-white/15 p-5">
            <p className="text-xs font-black uppercase tracking-widest text-blue-100">Recommended plan</p>
            <p className="text-3xl font-black mt-1">{plan ? plan.name : 'Custom Package'}</p>
            <p className="text-sm font-semibold text-blue-100 mt-2">
              {plan
                ? `${plan.credits.toLocaleString()} credits · up to ${plan.radius} mi radius · ${plan.credits - total} credits spare`
                : 'Your needs go beyond our standard plans. We’ll build a package around them.'}
            </p>
          </div>
          <div className="mt-auto pt-8">
            <Link href={plan ? (plan.credits === 300 ? '/register' : '/#pricing') : '/custom-package'}>
              <Button className="w-full bg-white text-blue-700 hover:bg-blue-50 rounded-full h-12 font-black">
                {plan ? (plan.credits === 300 ? 'Start Free Trial' : `Get ${plan.name}`) : 'Request Custom Quote'}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---------------- Keyword Generator ---------------- */

const MODIFIERS = {
  prefix: ['best', 'top rated', 'affordable', 'emergency', '24 hour', 'local', 'cheap', 'professional'],
  suffix: ['near me', 'open now', 'services', 'company', 'cost', 'reviews', 'near me open now']
}

const splitList = s => s.split(/[\n,]+/).map(x => x.trim()).filter(Boolean)

export function KeywordGenerator() {
  const [services, setServices] = useState('dentist\nteeth whitening\nroot canal')
  const [places, setPlaces] = useState('Janakpuri\nVikaspuri')
  const [prefix, setPrefix] = useState(['best', 'emergency'])
  const [suffix, setSuffix] = useState(['near me', 'cost'])
  const [copied, copy] = useCopy()

  const keywords = useMemo(() => {
    const out = new Set()
    const svc = splitList(services).map(s => s.toLowerCase())
    const loc = splitList(places).map(s => s.toLowerCase())
    for (const s of svc) {
      out.add(s)
      for (const p of prefix) out.add(`${p} ${s}`)
      for (const x of suffix) out.add(`${s} ${x}`)
      for (const l of loc) {
        out.add(`${s} in ${l}`)
        out.add(`${s} ${l}`)
        for (const p of prefix) out.add(`${p} ${s} in ${l}`)
      }
    }
    return [...out]
  }, [services, places, prefix, suffix])

  const toggle = (list, set, v) => set(list.includes(v) ? list.filter(x => x !== v) : [...list, v])

  return (
    <div className={card}>
      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div>
            <label className={label} htmlFor="kg-s">Services or products (one per line)</label>
            <textarea id="kg-s" rows={4} className={input} value={services} onChange={e => setServices(e.target.value)} />
          </div>
          <div>
            <label className={label} htmlFor="kg-l">Cities, areas or neighbourhoods</label>
            <textarea id="kg-l" rows={3} className={input} value={places} onChange={e => setPlaces(e.target.value)} />
          </div>
          {[['Prefixes', MODIFIERS.prefix, prefix, setPrefix], ['Suffixes', MODIFIERS.suffix, suffix, setSuffix]].map(([l, opts, list, set]) => (
            <div key={l}>
              <span className={label}>{l}</span>
              <div className="flex flex-wrap gap-2">
                {opts.map(o => (
                  <button key={o} type="button" onClick={() => toggle(list, set, o)}
                    className={`px-3 py-1.5 rounded-full text-sm font-bold border transition ${list.includes(o) ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-blue-400'}`}>
                    {o}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-col min-h-[420px]">
          <div className="flex items-center justify-between mb-3">
            <span className={label + ' mb-0'}>{keywords.length} keywords</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="rounded-full font-bold" onClick={() => copy(keywords.join('\n'))} disabled={!keywords.length}>
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} {copied ? 'Copied' : 'Copy'}
              </Button>
              <Button variant="outline" size="sm" className="rounded-full font-bold" onClick={() => download('local-keywords.csv', 'keyword\n' + keywords.map(k => `"${k}"`).join('\n'), 'text/csv')} disabled={!keywords.length}>
                <Download className="w-4 h-4" /> CSV
              </Button>
            </div>
          </div>
          <ul className="flex-1 overflow-auto max-h-[520px] rounded-2xl bg-slate-50 border border-slate-100 p-3 space-y-1">
            {keywords.map(k => <li key={k} className="px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-white">{k}</li>)}
            {!keywords.length && <li className="px-3 py-2 text-sm text-slate-400">Add at least one service to generate keywords.</li>}
          </ul>
          <p className="text-xs font-semibold text-slate-400 mt-3">Tip: track the 5–15 most valuable of these with a geo-grid scan to see where you rank for each.</p>
        </div>
      </div>
    </div>
  )
}

/* ---------------- Schema Generator ---------------- */

const BUSINESS_TYPES = ['LocalBusiness', 'Dentist', 'Physician', 'MedicalClinic', 'Restaurant', 'CafeOrCoffeeShop', 'BeautySalon', 'HairSalon', 'HealthClub', 'Plumber', 'Electrician', 'HVACBusiness', 'RoofingContractor', 'GeneralContractor', 'AutoRepair', 'LegalService', 'Attorney', 'AccountingService', 'RealEstateAgent', 'Store', 'ProfessionalService']
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export function SchemaGenerator() {
  const [f, setF] = useState({
    type: 'LocalBusiness', name: '', url: '', phone: '', email: '', image: '', priceRange: '',
    street: '', city: '', region: '', postal: '', country: 'IN', lat: '', lng: '',
    opens: '09:00', closes: '18:00', days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    sameAs: '', rating: '', reviews: ''
  })
  const [faqs, setFaqs] = useState([{ q: '', a: '' }])
  const [copied, copy] = useCopy()
  const set = k => e => setF({ ...f, [k]: e.target.value })

  const json = useMemo(() => {
    const biz = {
      '@context': 'https://schema.org',
      '@type': f.type,
      name: f.name || undefined,
      url: f.url || undefined,
      telephone: f.phone || undefined,
      email: f.email || undefined,
      image: f.image || undefined,
      priceRange: f.priceRange || undefined,
      address: (f.street || f.city) ? {
        '@type': 'PostalAddress', streetAddress: f.street || undefined, addressLocality: f.city || undefined,
        addressRegion: f.region || undefined, postalCode: f.postal || undefined, addressCountry: f.country || undefined
      } : undefined,
      geo: (f.lat && f.lng) ? { '@type': 'GeoCoordinates', latitude: Number(f.lat), longitude: Number(f.lng) } : undefined,
      openingHoursSpecification: f.days.length ? [{ '@type': 'OpeningHoursSpecification', dayOfWeek: f.days, opens: f.opens, closes: f.closes }] : undefined,
      sameAs: splitList(f.sameAs).length ? splitList(f.sameAs) : undefined,
      aggregateRating: (f.rating && f.reviews) ? { '@type': 'AggregateRating', ratingValue: f.rating, reviewCount: f.reviews } : undefined
    }
    const blocks = [biz]
    const validFaqs = faqs.filter(x => x.q.trim() && x.a.trim())
    if (validFaqs.length) {
      blocks.push({
        '@context': 'https://schema.org', '@type': 'FAQPage',
        mainEntity: validFaqs.map(x => ({ '@type': 'Question', name: x.q.trim(), acceptedAnswer: { '@type': 'Answer', text: x.a.trim() } }))
      })
    }
    return blocks.map(b => `<script type="application/ld+json">\n${JSON.stringify(b, null, 2)}\n</script>`).join('\n\n')
  }, [f, faqs])

  const field = (k, l, ph, type = 'text') => (
    <div>
      <label className={label} htmlFor={`sg-${k}`}>{l}</label>
      <input id={`sg-${k}`} type={type} className={input} placeholder={ph} value={f[k]} onChange={set(k)} />
    </div>
  )

  return (
    <div className={card}>
      <div className="grid lg:grid-cols-2 gap-10">
        <div className="space-y-5">
          <div>
            <label className={label} htmlFor="sg-type">Business type</label>
            <select id="sg-type" className={input} value={f.type} onChange={set('type')}>
              {BUSINESS_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {field('name', 'Business name', 'Your Business')}
            {field('url', 'Website', 'https://example.com', 'url')}
            {field('phone', 'Phone', '+91 98765 43210')}
            {field('email', 'Email', 'hello@example.com', 'email')}
            {field('image', 'Logo / image URL', 'https://…/logo.png')}
            {field('priceRange', 'Price range', '₹₹ or $$')}
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {field('street', 'Street address', 'C-9, Vikaspuri')}
            {field('city', 'City', 'New Delhi')}
            {field('region', 'State / province', 'Delhi')}
            {field('postal', 'Postal code', '110018')}
            {field('country', 'Country code', 'IN')}
            <div className="grid grid-cols-2 gap-2">
              {field('lat', 'Latitude', '28.64')}
              {field('lng', 'Longitude', '77.07')}
            </div>
          </div>
          <div>
            <span className={label}>Opening days</span>
            <div className="flex flex-wrap gap-2 mb-3">
              {DAYS.map(d => (
                <button key={d} type="button" onClick={() => setF({ ...f, days: f.days.includes(d) ? f.days.filter(x => x !== d) : [...f.days, d] })}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border ${f.days.includes(d) ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 text-slate-600'}`}>
                  {d.slice(0, 3)}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {field('opens', 'Opens', '09:00', 'time')}
              {field('closes', 'Closes', '18:00', 'time')}
            </div>
          </div>
          <div>
            <label className={label} htmlFor="sg-sameAs">Social / directory profiles (one per line)</label>
            <textarea id="sg-sameAs" rows={3} className={input} placeholder="https://facebook.com/yourbusiness" value={f.sameAs} onChange={set('sameAs')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            {field('rating', 'Avg. rating (optional)', '4.8')}
            {field('reviews', 'Review count', '120')}
          </div>
          <p className="text-xs font-semibold text-slate-400">Only add rating data if it reflects reviews shown on your own page. Google may ignore or penalise self-serving review markup.</p>

          <div className="pt-4 border-t border-slate-100">
            <span className={label}>FAQ schema (optional)</span>
            <div className="space-y-4">
              {faqs.map((x, i) => (
                <div key={i} className="rounded-2xl bg-slate-50 p-4 space-y-2">
                  <input className={input} placeholder="Question" value={x.q} onChange={e => setFaqs(faqs.map((y, j) => j === i ? { ...y, q: e.target.value } : y))} />
                  <textarea rows={2} className={input} placeholder="Answer" value={x.a} onChange={e => setFaqs(faqs.map((y, j) => j === i ? { ...y, a: e.target.value } : y))} />
                  {faqs.length > 1 && (
                    <button type="button" onClick={() => setFaqs(faqs.filter((_, j) => j !== i))} className="text-xs font-bold text-rose-500 flex items-center gap-1"><Trash2 className="w-3.5 h-3.5" /> Remove</button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" className="rounded-full font-bold" onClick={() => setFaqs([...faqs, { q: '', a: '' }])}><Plus className="w-4 h-4" /> Add question</Button>
            </div>
          </div>
        </div>

        <div className="lg:sticky lg:top-28 self-start w-full">
          <div className="flex items-center justify-between mb-3">
            <span className={label + ' mb-0'}>Your JSON-LD</span>
            <Button size="sm" className="rounded-full font-bold bg-blue-600 hover:bg-blue-700" onClick={() => copy(json)}>
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} {copied ? 'Copied' : 'Copy code'}
            </Button>
          </div>
          <pre className="rounded-2xl bg-slate-900 text-slate-100 text-xs leading-relaxed p-5 overflow-auto max-h-[640px] whitespace-pre-wrap break-all">{json}</pre>
          <p className="text-xs font-semibold text-slate-400 mt-3">
            Paste into the &lt;head&gt; of your page, then validate with{' '}
            <a className="text-blue-600 underline" href="https://search.google.com/test/rich-results" target="_blank" rel="noopener noreferrer">Google’s Rich Results Test</a>.
          </p>
        </div>
      </div>
    </div>
  )
}

/* ---------------- Google Index Checker ---------------- */

export function IndexChecker() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const run = async (e) => {
    e.preventDefault()
    if (!url.trim()) return
    setLoading(true); setError(''); setResult(null)
    try {
      const res = await fetch('/api/public/index-check', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: url.trim() }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Check failed')
      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const icon = level => level === 'pass'
    ? <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
    : level === 'warn' ? <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" /> : <XCircle className="w-5 h-5 text-rose-500 shrink-0" />

  return (
    <div className={card}>
      <form onSubmit={run} className="flex flex-col sm:flex-row gap-3">
        <label htmlFor="ic-url" className="sr-only">Page URL</label>
        <input id="ic-url" className={input + ' flex-1'} placeholder="https://yourwebsite.com/services/teeth-whitening" value={url} onChange={e => setUrl(e.target.value)} />
        <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 rounded-xl h-[50px] px-8 font-black">
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Check URL'}
        </Button>
      </form>
      {error && <p className="mt-5 text-sm font-bold text-rose-600">{error}</p>}
      {result && (
        <div className="mt-8">
          <div className={`rounded-2xl p-5 mb-6 ${result.indexable ? 'bg-emerald-50 border border-emerald-100' : 'bg-rose-50 border border-rose-100'}`}>
            <p className={`text-lg font-black ${result.indexable ? 'text-emerald-700' : 'text-rose-700'}`}>
              {result.indexable ? 'Nothing is blocking Google from indexing this page.' : 'This page has issues that can stop Google indexing it.'}
            </p>
            <p className="text-sm font-semibold text-slate-600 mt-1 break-all">{result.url}</p>
          </div>
          <ul className="space-y-3">
            {result.checks.map(c => (
              <li key={c.label} className="flex gap-3 rounded-xl bg-slate-50 p-4">
                {icon(c.level)}
                <div>
                  <p className="font-black text-slate-900 text-sm">{c.label}</p>
                  <p className="text-sm font-medium text-slate-600 break-all">{c.detail}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <a href={result.siteSearch} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="rounded-full font-bold w-full">Check Google with site: search <ExternalLink className="w-4 h-4" /></Button>
            </a>
            <a href="https://search.google.com/search-console" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="rounded-full font-bold w-full">Open Search Console <ExternalLink className="w-4 h-4" /></Button>
            </a>
          </div>
          <p className="text-xs font-semibold text-slate-400 mt-4">
            This checks whether the page can be indexed. To confirm it is actually in Google’s index, use the site: search above or the URL Inspection tool in Search Console.
          </p>
        </div>
      )}
    </div>
  )
}
