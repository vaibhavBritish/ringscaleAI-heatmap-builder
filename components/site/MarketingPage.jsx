// Renders a marketing / resource page from a plain data object (see lib/site-content/*).
// Server component: all content ships as HTML, which is what search and AI crawlers read.

import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Button } from '@/components/ui/button'
import { ArrowRight, Check, ChevronDown, Sparkles } from 'lucide-react'
import { Illustration } from '@/components/site/Illustrations'

const SITE = 'https://ringscale.ai'

export function buildMetadata(page, path) {
  const url = `${SITE}${path}`
  return {
    title: page.metaTitle || `${page.title} | Ringscale AI`,
    description: page.metaDescription || page.intro,
    alternates: { canonical: url },
    openGraph: { title: page.metaTitle || page.title, description: page.metaDescription || page.intro, url, type: 'website' }
  }
}

export function SectionHeading({ eyebrow, title, text, align = 'center' }) {
  return (
    <div className={`mb-14 max-w-3xl ${align === 'center' ? 'mx-auto text-center' : ''}`}>
      {eyebrow && <p className="text-sm font-black text-blue-600 uppercase tracking-widest mb-4">{eyebrow}</p>}
      <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">{title}</h2>
      {text && <p className="text-lg text-slate-500 font-medium leading-relaxed mt-5">{text}</p>}
    </div>
  )
}

function CtaButton({ cta, variant = 'primary' }) {
  if (!cta) return null
  const external = cta.href?.startsWith('http')
  const btn = variant === 'primary'
    ? <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-9 py-7 text-base md:text-lg font-bold shadow-xl shadow-blue-100 flex items-center gap-3">{cta.label} <ArrowRight className="w-5 h-5" /></Button>
    : <Button size="lg" variant="outline" className="rounded-full border-blue-600 text-blue-600 hover:bg-blue-50 px-9 py-7 text-base md:text-lg font-bold">{cta.label}</Button>
  return <Link href={cta.href} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{btn}</Link>
}

export function Hero({ page }) {
  return (
    <section className="pt-36 md:pt-40 pb-20 px-6 bg-white relative overflow-hidden">
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[600px] h-[600px] bg-blue-50/60 rounded-full blur-3xl pointer-events-none" />
      <div className="container mx-auto max-w-6xl relative z-10">
        <div className={`flex flex-col ${page.illustration ? 'lg:flex-row' : ''} items-center gap-14`}>
          <div className={`flex-1 ${page.illustration ? 'text-center lg:text-left' : 'text-center max-w-4xl'}`}>
            {page.eyebrow && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-700 text-sm font-bold mb-8">
                <Sparkles className="w-4 h-4" /> {page.eyebrow}
              </div>
            )}
            <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 mb-8 leading-[1.1] tracking-tight">
              {page.title}{' '}
              {page.highlight && <span className="bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">{page.highlight}</span>}
            </h1>
            <p className={`text-lg md:text-xl text-slate-500 font-medium mb-10 leading-relaxed ${page.illustration ? 'max-w-2xl' : 'max-w-3xl mx-auto'}`}>{page.intro}</p>
            <div className={`flex flex-col sm:flex-row items-center gap-4 ${page.illustration ? 'justify-center lg:justify-start' : 'justify-center'}`}>
              <CtaButton cta={page.primaryCta || { label: 'Start 7-Day Free Trial', href: '/register' }} />
              <CtaButton cta={page.secondaryCta} variant="secondary" />
            </div>
          </div>
          {page.illustration && (
            <div className="flex-1 w-full max-w-xl">
              <Illustration name={page.illustration} />
            </div>
          )}
        </div>
        {page.stats && (
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4">
            {page.stats.map(([v, k]) => (
              <div key={k} className="rounded-2xl border border-slate-100 bg-white shadow-sm p-5 text-center">
                <p className="text-2xl md:text-3xl font-black text-slate-900">{v}</p>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">{k}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function Features({ s, tone }) {
  return (
    <section className={`py-24 px-6 ${tone}`}>
      <div className="container mx-auto max-w-6xl">
        <SectionHeading eyebrow={s.eyebrow} title={s.title} text={s.text} />
        <div className={`grid sm:grid-cols-2 ${s.items.length % 3 === 0 ? 'lg:grid-cols-3' : 'lg:grid-cols-2'} gap-6`}>
          {s.items.map(({ icon: Icon, title, text, points }) => (
            <div key={title} className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              {Icon && <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mb-6"><Icon className="w-6 h-6 text-blue-600" /></div>}
              <h3 className="text-xl font-extrabold text-slate-900 mb-3">{title}</h3>
              <p className="text-slate-500 font-medium leading-relaxed">{text}</p>
              {points && (
                <ul className="mt-5 space-y-2">
                  {points.map(p => <li key={p} className="flex gap-2 text-sm font-semibold text-slate-600"><Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />{p}</li>)}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Split({ s, tone }) {
  return (
    <section className={`py-24 px-6 ${tone}`}>
      <div className="container mx-auto max-w-6xl">
        <div className={`flex flex-col ${s.reverse ? 'lg:flex-row-reverse' : 'lg:flex-row'} gap-16 items-center`}>
          <div className="flex-1">
            {s.eyebrow && <p className="text-sm font-black text-blue-600 uppercase tracking-widest mb-4">{s.eyebrow}</p>}
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-6">{s.title}</h2>
            <div className="space-y-5 text-lg text-slate-600 font-medium leading-relaxed">
              {s.paragraphs?.map((p, i) => <p key={i}>{p}</p>)}
            </div>
            {s.bullets && (
              <ul className="mt-8 grid sm:grid-cols-2 gap-3">
                {s.bullets.map(b => (
                  <li key={b} className="flex gap-3 text-[15px] font-bold text-slate-700">
                    <span className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center shrink-0"><Check className="w-3.5 h-3.5 text-white" /></span>{b}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="flex-1 w-full max-w-xl">
            <Illustration name={s.illustration} />
          </div>
        </div>
      </div>
    </section>
  )
}

function Steps({ s, tone }) {
  return (
    <section className={`py-24 px-6 ${tone}`} id={s.id}>
      <div className="container mx-auto max-w-6xl">
        <SectionHeading eyebrow={s.eyebrow} title={s.title} text={s.text} />
        <ol className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {s.items.map((step, i) => (
            <li key={step.title} className="relative bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
              <span className="text-5xl font-black text-blue-100 absolute top-5 right-7">{String(i + 1).padStart(2, '0')}</span>
              <h3 className="text-lg font-extrabold text-slate-900 mb-3 pr-12">{step.title}</h3>
              <p className="text-slate-500 font-medium leading-relaxed">{step.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

function Article({ s, tone }) {
  return (
    <section className={`py-24 px-6 ${tone}`} id={s.id}>
      <div className="container mx-auto max-w-3xl">
        {s.eyebrow && <p className="text-sm font-black text-blue-600 uppercase tracking-widest mb-4">{s.eyebrow}</p>}
        {s.title && <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-10">{s.title}</h2>}
        <div className="space-y-12">
          {s.blocks.map((b, i) => (
            <div key={i}>
              {b.h && <h3 className="text-2xl font-extrabold text-slate-900 mb-4">{b.h}</h3>}
              <div className="space-y-4 text-lg text-slate-600 font-medium leading-relaxed">
                {b.p?.map((p, j) => <p key={j}>{p}</p>)}
              </div>
              {b.list && (
                <ul className="mt-5 space-y-3">
                  {b.list.map(item => (
                    <li key={item} className="flex gap-3 text-[16px] font-semibold text-slate-700"><Check className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />{item}</li>
                  ))}
                </ul>
              )}
              {b.illustration && <div className="mt-8 max-w-xl"><Illustration name={b.illustration} /></div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Table({ s, tone }) {
  return (
    <section className={`py-24 px-6 ${tone}`}>
      <div className="container mx-auto max-w-5xl">
        <SectionHeading eyebrow={s.eyebrow} title={s.title} text={s.text} />
        <div className="overflow-x-auto rounded-3xl border border-slate-100 bg-white shadow-sm">
          <table className="w-full text-left min-w-[640px]">
            <thead>
              <tr className="bg-slate-50">
                {s.columns.map((c, i) => (
                  <th key={c} className={`px-6 py-5 text-xs font-black uppercase tracking-widest ${i === 1 ? 'text-blue-600' : 'text-slate-400'}`}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {s.rows.map((row, i) => (
                <tr key={i} className="border-t border-slate-100 align-top">
                  {row.map((cell, j) => (
                    <td key={j} className={`px-6 py-5 text-[15px] leading-relaxed ${j === 0 ? 'font-extrabold text-slate-900' : j === 1 ? 'font-semibold text-slate-800' : 'font-medium text-slate-500'}`}>
                      {cell === true ? <Check className="w-5 h-5 text-emerald-500" /> : cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {s.note && <p className="text-xs text-slate-400 font-semibold mt-4 text-center">{s.note}</p>}
      </div>
    </section>
  )
}

function Cards({ s, tone }) {
  return (
    <section className={`py-24 px-6 ${tone}`} id={s.id}>
      <div className="container mx-auto max-w-6xl">
        <SectionHeading eyebrow={s.eyebrow} title={s.title} text={s.text} />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {s.items.map(item => {
            const body = (
              <>
                {item.tag && <span className="inline-block text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-blue-50 text-blue-700 mb-4">{item.tag}</span>}
                {item.icon && <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mb-5"><item.icon className="w-6 h-6 text-blue-600" /></div>}
                <h3 className="text-lg font-extrabold text-slate-900 mb-3 group-hover:text-blue-600 transition-colors">{item.title}</h3>
                <p className="text-slate-500 font-medium leading-relaxed text-[15px]">{item.text}</p>
                {item.href && <span className="inline-flex items-center gap-1.5 text-sm font-black text-blue-600 mt-5">{item.linkLabel || 'Learn more'} <ArrowRight className="w-4 h-4" /></span>}
              </>
            )
            const cls = 'group block bg-white rounded-3xl border border-slate-100 p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300'
            return item.href
              ? <Link key={item.title} href={item.href} className={cls}>{body}</Link>
              : <div key={item.title} className={cls}>{body}</div>
          })}
        </div>
      </div>
    </section>
  )
}

function ChecklistSection({ s, tone }) {
  return (
    <section className={`py-24 px-6 ${tone}`} id={s.id}>
      <div className="container mx-auto max-w-5xl">
        <SectionHeading eyebrow={s.eyebrow} title={s.title} text={s.text} />
        <div className="grid md:grid-cols-2 gap-6">
          {s.groups.map((g, gi) => (
            <div key={g.title} className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
              <h3 className="text-lg font-extrabold text-slate-900 mb-5 flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-blue-600 text-white text-sm font-black flex items-center justify-center">{gi + 1}</span>{g.title}
              </h3>
              <ul className="space-y-3">
                {g.items.map(item => (
                  <li key={item} className="flex gap-3 text-[15px] font-semibold text-slate-600">
                    <span className="w-5 h-5 rounded-md border-2 border-slate-300 shrink-0 mt-0.5" />{item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function FaqSection({ faqs, title = 'Frequently asked questions', tone = 'bg-white' }) {
  if (!faqs?.length) return null
  return (
    <section className={`py-24 px-6 ${tone}`} id="faq">
      <div className="container mx-auto max-w-3xl">
        <SectionHeading eyebrow="FAQ" title={title} />
        <div className="space-y-4">
          {faqs.map(({ q, a }) => (
            <details key={q} className="group bg-white rounded-2xl border border-slate-100 shadow-sm open:shadow-lg transition-shadow">
              <summary className="flex items-center justify-between gap-4 cursor-pointer list-none px-6 py-5 text-[17px] font-extrabold text-slate-900">
                {q}
                <ChevronDown className="w-5 h-5 text-blue-600 shrink-0 transition-transform group-open:rotate-180" />
              </summary>
              <p className="px-6 pb-6 text-slate-600 font-medium leading-relaxed">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}

export function CtaBand({ cta }) {
  const c = cta || {}
  return (
    <section className="py-24 px-6 bg-white">
      <div className="container mx-auto max-w-5xl">
        <div className="rounded-[2.5rem] bg-gradient-to-br from-blue-700 via-blue-600 to-blue-500 p-10 md:p-16 text-center relative overflow-hidden shadow-2xl shadow-blue-200">
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-white/10 blur-2xl" />
          <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-6 relative">{c.title || 'See where you rank, block by block.'}</h2>
          <p className="text-lg md:text-xl text-blue-100 font-medium max-w-2xl mx-auto mb-10 relative">
            {c.text || 'Run your first geo-grid heatmap in under two minutes. 7-day free trial, no card required.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center relative">
            <Link href={c.href || '/register'}>
              <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50 rounded-full px-10 py-7 text-lg font-black shadow-xl flex items-center gap-3">
                {c.label || 'Start Free Trial'} <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link href="/contact-us">
              <Button size="lg" variant="outline" className="rounded-full bg-transparent border-white text-white hover:bg-white/10 hover:text-white px-10 py-7 text-lg font-bold">
                Talk to Sales
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

const RENDER = { features: Features, split: Split, steps: Steps, article: Article, table: Table, cards: Cards, checklist: ChecklistSection }

export function Sections({ sections = [] }) {
  return sections.map((s, i) => {
    const C = RENDER[s.type]
    if (!C) return null
    const tone = i % 2 === 0 ? 'bg-slate-50 border-y border-slate-100' : 'bg-white'
    return <C key={i} s={s} tone={tone} />
  })
}

export function PageShell({ children, jsonLd = [] }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {jsonLd.map((j, i) => <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(j) }} />)}
      <Navbar />
      <main>{children}</main>
      <Footer />
    </div>
  )
}

export default function MarketingPage({ page, children }) {
  const jsonLd = []
  if (page.faqs?.length) {
    jsonLd.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: page.faqs.map(({ q, a }) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } }))
    })
  }
  return (
    <PageShell jsonLd={jsonLd}>
      <Hero page={page} />
      {children}
      <Sections sections={page.sections} />
      <FaqSection faqs={page.faqs} tone={(page.sections?.length || 0) % 2 === 0 ? 'bg-slate-50 border-y border-slate-100' : 'bg-white'} />
      <CtaBand cta={page.cta} />
    </PageShell>
  )
}
