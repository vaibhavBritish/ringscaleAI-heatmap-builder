import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import LeadForm from '@/components/LeadForm'
import { Button } from '@/components/ui/button'
import {
  ArrowRight, Check, X, Sparkles, MessageSquareText, Bot, Search, FileText, Code2,
  ListChecks, Network, MapPin, Star, RefreshCw, LineChart, ShieldCheck, Layers,
  Building2, Store, Briefcase, Users, Quote, Mic, Globe, Zap, ChevronDown
} from 'lucide-react'

// Static route: takes precedence over /services/[slug].

const PAGE_URL = 'https://ringscale.ai/services/aeo'

export const metadata = {
  title: 'AEO Services: Answer Engine Optimization for AI Search | Ringscale AI',
  description:
    'Get your business cited by ChatGPT, Google AI Overviews, Gemini, Perplexity and voice assistants. Ringscale AEO writes answer-ready FAQs, service pages and schema markup on autopilot.',
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: 'Answer Engine Optimization (AEO) | Ringscale AI',
    description:
      'Be the answer, not just a blue link. Answer-ready content, structured data and local signals that AI search engines trust.',
    url: PAGE_URL,
    type: 'website'
  }
}

const engines = ['ChatGPT', 'Google AI Overviews', 'Gemini', 'Perplexity', 'Microsoft Copilot', 'Siri & Alexa']

const seoVsAeo = [
  { label: 'Goal', seo: 'Rank a page in the top 10 blue links', aeo: 'Be the single answer an AI engine quotes or recommends' },
  { label: 'What the user sees', seo: 'A list of websites to click through', aeo: 'A direct answer, often with your brand named as the source' },
  { label: 'Query style', seo: 'Short keywords ("dentist delhi")', aeo: 'Full questions ("who is the best emergency dentist open now near Saket?")' },
  { label: 'Content format', seo: 'Long pages built around keywords', aeo: 'Clear question-and-answer blocks, facts, lists and definitions' },
  { label: 'Technical layer', seo: 'Meta tags, backlinks, page speed', aeo: 'All of SEO plus schema markup (FAQPage, Service, LocalBusiness) and entity consistency' },
  { label: 'Trust signals', seo: 'Backlinks and domain authority', aeo: 'Consistent NAP, reviews, citations, expert authorship and up-to-date facts' },
  { label: 'Success metric', seo: 'Rankings and clicks', aeo: 'Citations and mentions in AI answers, plus the calls and visits they bring' }
]

const pillars = [
  {
    icon: MessageSquareText,
    title: 'Answer-ready FAQs on every page',
    text: 'We research the real questions your customers ask and publish concise, factual answers on the pages where they belong. Each FAQ block is written to be lifted word-for-word into an AI answer.',
    points: ['Questions mined from search, reviews and People Also Ask', '40–60 word direct answers, with detail below', 'Page-specific: no copy-pasted FAQs across the site']
  },
  {
    icon: FileText,
    title: 'Autopilot service pages',
    text: 'The Ringscale AEO autopilot writes and publishes dedicated service pages for each thing you sell, structured the way answer engines like to read: definition, who it is for, process, pricing factors, and FAQs.',
    points: ['One page per service and per location where it makes sense', 'Plain-language headings that mirror real questions', 'Published straight to your site, refreshed over time']
  },
  {
    icon: Code2,
    title: 'Schema markup & structured data',
    text: 'Every answer is backed by JSON-LD that machines can read without guessing. We generate and validate the schema for you, so AI crawlers know exactly who you are, what you do and where.',
    points: ['FAQPage, Service, LocalBusiness, Organization, Review', 'Validated against Google’s Rich Results requirements', 'Kept in sync with the visible page content']
  },
  {
    icon: Network,
    title: 'Entity & brand consistency',
    text: 'AI models build a picture of your business from everything published about it. We make that picture consistent, so the engine is confident enough to recommend you by name.',
    points: ['Same name, address and phone (NAP) everywhere', 'Clear “about” facts: founding year, services, areas served', 'Citations on the directories AI engines read']
  },
  {
    icon: MapPin,
    title: 'Local signals that feed AI answers',
    text: '“Near me” answers in AI search lean heavily on Google Business Profile data and reviews. AEO plugs straight into the local SEO work Ringscale already does with geo-grid heatmaps.',
    points: ['Google Business Profile optimisation', 'Review velocity and review-reply strategy', 'Heatmap tracking to prove local visibility gains']
  },
  {
    icon: RefreshCw,
    title: 'Continuous refresh',
    text: 'AI engines favour content that is current. Prices, hours, offers and answers go stale, so the autopilot keeps reviewing and updating your FAQs and service pages instead of publishing once and forgetting.',
    points: ['Scheduled content reviews', 'New questions added as search behaviour shifts', 'Outdated facts flagged and fixed']
  }
]

const steps = [
  { title: 'AEO audit', text: 'We check how AI engines currently describe your business, which questions you already answer, what schema you have, and where competitors are being cited instead of you.' },
  { title: 'Question research', text: 'We build a question map for every service and location: the exact phrasing customers use in ChatGPT, Google and voice search, grouped by intent.' },
  { title: 'Content & schema build', text: 'The autopilot drafts answer-first FAQs and service pages, generates matching JSON-LD, and our team reviews them for accuracy and tone before they go live.' },
  { title: 'Publish & connect', text: 'A single lightweight widget or API connection publishes content to your site. No rebuild, no developer sprint, and it works on any stack.' },
  { title: 'Local authority boost', text: 'We align your Google Business Profile, citations and reviews with the new content so every source tells AI engines the same story.' },
  { title: 'Track, refresh, expand', text: 'We monitor AI answers for your target questions, refresh what is slipping, and expand into new questions and services every month.' }
]

const answerFactors = [
  { icon: Quote, title: 'Directly answers the question', text: 'The first sentence after a heading should be the answer. Engines skip content that buries it.' },
  { icon: ShieldCheck, title: 'Comes from a trusted entity', text: 'Consistent business details, real reviews and expert authorship make your answer safer to quote.' },
  { icon: Code2, title: 'Is machine-readable', text: 'Schema markup removes ambiguity about what each block of text means.' },
  { icon: RefreshCw, title: 'Is current', text: 'Fresh dates, current prices and updated facts beat stale pages.' },
  { icon: Layers, title: 'Is well structured', text: 'Short paragraphs, lists, tables and clear headings are easier to extract.' },
  { icon: Globe, title: 'Is corroborated elsewhere', text: 'When directories, reviews and your site agree, the engine is more confident.' }
]

const audiences = [
  { icon: Store, title: 'Local businesses', text: 'Clinics, salons, gyms, restaurants, repair shops and home services that want to be the business AI recommends for “near me” questions.' },
  { icon: Building2, title: 'Multi-location brands', text: 'Chains and franchises that need accurate, location-specific answers for every branch, without writing hundreds of pages by hand.' },
  { icon: Briefcase, title: 'Professional services', text: 'Lawyers, accountants, consultants and real-estate firms whose clients ask detailed questions before they ever call.' },
  { icon: Users, title: 'Agencies', text: 'SEO and marketing agencies that want to add AEO as a white-label service for their clients on top of Ringscale’s local SEO tools.' }
]

const deliverables = [
  'Full AEO audit and AI-visibility baseline',
  'Question map for every service and location',
  'Answer-first FAQs published on your key pages',
  'Autopilot-written service pages',
  'FAQPage, Service and LocalBusiness schema',
  'Organization and entity markup',
  'Google Business Profile optimisation',
  'Citation and NAP consistency clean-up',
  'Review strategy and reply templates',
  'Voice-search friendly answer formatting',
  'Monthly content refresh and expansion',
  'Monthly AEO and local visibility report'
]

const faqs = [
  {
    q: 'What is Answer Engine Optimization (AEO)?',
    a: 'Answer Engine Optimization is the practice of structuring your website content, schema markup and online presence so that AI-powered answer engines such as ChatGPT, Google AI Overviews, Gemini, Perplexity and voice assistants pick your business as the answer to a user’s question. Instead of competing for a click in a list of links, you compete to be the source the AI quotes or recommends.'
  },
  {
    q: 'How is AEO different from SEO?',
    a: 'SEO aims to rank pages in traditional search results. AEO aims to get your content selected as the direct answer. AEO builds on SEO, since engines still need to crawl and trust your site, but it adds question-led content, concise answers, structured data and entity consistency. You need both, and Ringscale handles both together.'
  },
  {
    q: 'Does AEO replace my existing SEO?',
    a: 'No. AEO sits on top of good SEO. A fast, crawlable, trusted website is still the foundation. AEO changes how content on that site is written and marked up so that AI systems can extract and cite it.'
  },
  {
    q: 'Which AI engines does Ringscale AEO target?',
    a: 'We optimise for the engines your customers actually use: Google AI Overviews and AI Mode, ChatGPT search, Gemini, Perplexity, Microsoft Copilot, and voice assistants such as Siri, Alexa and Google Assistant. The same principles of clear answers, structured data and consistent entities work across all of them.'
  },
  {
    q: 'What does the AEO autopilot actually do?',
    a: 'The autopilot researches the questions customers ask about your services, writes answer-first FAQs and service pages, generates matching JSON-LD schema, and publishes them to your website. It keeps reviewing and refreshing that content over time, and our team reviews it for accuracy.'
  },
  {
    q: 'Do I need to rebuild my website?',
    a: 'No. Ringscale AEO publishes through a lightweight widget or API connection that works with WordPress, Shopify, Webflow, Wix, Next.js and custom sites. Your design stays the same; answer-ready content and schema are added on top.'
  },
  {
    q: 'How long does AEO take to show results?',
    a: 'Schema and FAQ changes can be picked up as soon as engines recrawl your pages, which is often within a few weeks. Being consistently cited for competitive questions usually takes a few months of steady content, reviews and citations. We report progress monthly so you can see what is moving.'
  },
  {
    q: 'Can you guarantee my business will appear in ChatGPT or AI Overviews?',
    a: 'No honest provider can guarantee placement, because each AI engine decides its own answers. What we do is remove every reason for an engine not to choose you: unclear content, missing schema, inconsistent business details and thin reviews. That is what moves the odds in your favour.'
  },
  {
    q: 'How do you measure AEO success?',
    a: 'We track whether your business is mentioned or cited for your target questions across major AI engines, rich-result eligibility of your schema, growth in question-led search impressions, and the local outcomes that matter: calls, direction requests and bookings. Ringscale geo-grid heatmaps show your local map visibility alongside it.'
  },
  {
    q: 'Is AEO useful for a small local business?',
    a: 'Yes, arguably more than for large brands. Questions like “which clinic near me is open on Sunday?” are answered from a small set of local businesses. Clear answers, an optimised Google Business Profile and good reviews can put a small business in that set.'
  },
  {
    q: 'Does AEO help with voice search?',
    a: 'Yes. Voice assistants read out a single answer, usually a short factual sentence. The answer-first format AEO uses (a 40 to 60 word direct answer under a question heading) is exactly what voice assistants look for.'
  },
  {
    q: 'Can agencies resell Ringscale AEO?',
    a: 'Yes. Agencies can offer AEO to their clients alongside Ringscale’s heatmaps, rank tracking and Google Business Profile tools. Contact us about partner and white-label options.'
  }
]

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map(({ q, a }) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: { '@type': 'Answer', text: a }
  }))
}

const serviceJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: 'Answer Engine Optimization (AEO)',
  serviceType: 'Answer Engine Optimization',
  url: PAGE_URL,
  description: metadata.description,
  provider: { '@type': 'Organization', name: 'Ringscale AI', url: 'https://ringscale.ai' },
  areaServed: ['IN', 'US']
}

function SectionHeading({ eyebrow, title, text }) {
  return (
    <div className="text-center mb-16 max-w-3xl mx-auto">
      <h2 className="text-sm font-black text-blue-600 uppercase tracking-widest mb-4">{eyebrow}</h2>
      <p className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">{title}</p>
      {text && <p className="text-lg text-slate-500 font-medium leading-relaxed mt-5">{text}</p>}
    </div>
  )
}

export default function AeoServicePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <Navbar />

      <main>
        {/* Hero */}
        <section className="pt-40 pb-20 px-6 bg-white relative overflow-hidden">
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[600px] h-[600px] bg-blue-50/50 rounded-full blur-3xl pointer-events-none" />
          <div className="container mx-auto max-w-6xl relative z-10">
            <div className="flex flex-col lg:flex-row items-center gap-16">
              <div className="flex-1 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-700 text-sm font-bold mb-8">
                  <Sparkles className="w-4 h-4" />
                  Answer Engine Optimization
                </div>
                <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 mb-8 leading-[1.1] tracking-tight">
                  Be the answer AI <br className="hidden md:block" />
                  <span className="bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">recommends.</span>
                </h1>
                <p className="text-lg md:text-xl text-slate-500 font-medium mb-10 max-w-2xl leading-relaxed">
                  Your customers are asking ChatGPT, Google AI Overviews and voice assistants who to call. Ringscale AEO turns your website and local presence into answer-ready content, so those engines quote and recommend your business by name.
                </p>
                <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                  <Link href="#contact">
                    <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-10 py-7 text-lg font-bold shadow-xl shadow-blue-100 flex items-center gap-3">
                      Get a Free AEO Audit <ArrowRight className="w-5 h-5" />
                    </Button>
                  </Link>
                  <Link href="#how-it-works">
                    <Button size="lg" variant="outline" className="rounded-full border-blue-600 text-blue-600 hover:bg-blue-50 px-10 py-7 text-lg font-bold">
                      How It Works
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Mock AI answer */}
              <div className="flex-1 w-full max-w-xl">
                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-2xl p-6 md:p-8 space-y-5">
                  <div className="flex items-center gap-3 bg-slate-50 rounded-2xl px-4 py-3">
                    <Search className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="text-sm font-semibold text-slate-600">Which dental clinic near me is open on Sunday?</span>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
                      <p>
                        <span className="font-bold text-slate-900">Your Clinic</span> is open on Sundays from 10 am to 4 pm and offers same-day emergency appointments. It has a 4.8-star rating from over 300 reviews and is about 2 km from you.
                      </p>
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold">
                        <Check className="w-3.5 h-3.5" /> Source: yourclinic.com/faq
                      </div>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 font-semibold text-center">Illustrative example of an AI answer citing a business</p>
                </div>
              </div>
            </div>

            <div className="mt-16 text-center">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-5">Optimised for the engines your customers use</p>
              <div className="flex flex-wrap justify-center gap-3">
                {engines.map(e => (
                  <span key={e} className="px-4 py-2 rounded-full border border-slate-200 bg-white text-sm font-bold text-slate-600">{e}</span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* What is AEO */}
        <section className="py-24 bg-slate-50 border-y border-slate-100">
          <div className="container mx-auto max-w-6xl px-6">
            <div className="grid lg:grid-cols-2 gap-16 items-start">
              <div>
                <h2 className="text-sm font-black text-blue-600 uppercase tracking-widest mb-4">What is AEO?</h2>
                <p className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-6">Search has moved from links to answers.</p>
                <div className="space-y-5 text-lg text-slate-600 font-medium leading-relaxed">
                  <p>
                    <strong className="text-slate-900">Answer Engine Optimization (AEO)</strong> is the practice of making your business the source AI-powered search engines choose when they answer a question. It covers how your content is written, how it is marked up with structured data, and how consistent your business information is across the web.
                  </p>
                  <p>
                    When someone asks “best physiotherapist near me for a sports injury”, more and more of them get one generated answer rather than ten blue links. That answer names a few businesses and usually cites where the information came from. If your business is not in it, you are not in the conversation.
                  </p>
                  <p>
                    AEO does not replace SEO. It builds on it. Engines still need to crawl and trust your site, but they also need content they can lift cleanly into an answer, and enough consistent evidence to be confident recommending you.
                  </p>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-5">
                {[
                  { icon: Bot, title: 'AI chat search', text: 'ChatGPT, Gemini, Copilot and Perplexity answer questions conversationally and cite sources.' },
                  { icon: Sparkles, title: 'AI Overviews', text: 'Google now shows an AI summary above the traditional results for many questions.' },
                  { icon: Mic, title: 'Voice assistants', text: 'Siri, Alexa and Google Assistant read out one answer, with no second place.' },
                  { icon: ListChecks, title: 'Featured snippets', text: 'The original answer box still drives clicks and feeds AI answers.' }
                ].map(({ icon: Icon, title, text }) => (
                  <div key={title} className="bg-white p-7 rounded-[2rem] border border-slate-100 shadow-sm">
                    <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-5 text-blue-600">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-black text-slate-900 mb-2">{title}</h3>
                    <p className="text-slate-500 font-medium leading-relaxed text-sm">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* SEO vs AEO */}
        <section className="py-24 bg-white">
          <div className="container mx-auto max-w-6xl px-6">
            <SectionHeading eyebrow="SEO vs AEO" title="Same foundation, different finish line" text="SEO gets you found. AEO gets you chosen. Here is how the two compare." />
            <div className="overflow-x-auto rounded-[2rem] border border-slate-100 shadow-sm">
              <table className="w-full min-w-[640px] text-left">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="p-5 text-sm font-black text-slate-400 uppercase tracking-wider w-1/5"></th>
                    <th className="p-5 text-sm font-black text-slate-700 uppercase tracking-wider">Traditional SEO</th>
                    <th className="p-5 text-sm font-black text-blue-600 uppercase tracking-wider">Answer Engine Optimization</th>
                  </tr>
                </thead>
                <tbody>
                  {seoVsAeo.map(row => (
                    <tr key={row.label} className="border-t border-slate-100">
                      <td className="p-5 font-black text-slate-900 text-sm">{row.label}</td>
                      <td className="p-5 text-slate-500 font-medium text-sm leading-relaxed">{row.seo}</td>
                      <td className="p-5 text-slate-700 font-semibold text-sm leading-relaxed bg-blue-50/40">{row.aeo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Why it matters */}
        <section className="py-24 bg-white">
          <div className="container mx-auto max-w-6xl px-6">
            <div className="bg-[#001D4A] rounded-[3rem] p-10 md:p-16">
              <div className="max-w-3xl mb-12">
                <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-6 leading-tight">
                  Why AEO matters <span className="text-blue-400">right now.</span>
                </h2>
                <p className="text-lg text-blue-100/70 font-medium leading-relaxed">
                  The way people find local businesses is changing faster than most websites are. Businesses that adapt early build the trust signals AI engines rely on, and those signals compound.
                </p>
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                {[
                  { icon: Zap, title: 'Fewer clicks, more answers', text: 'When an AI answer satisfies the question, many users never scroll to the links. Being in the answer is the new page one.' },
                  { icon: Star, title: 'Winner takes most', text: 'An AI answer typically names only a handful of businesses, and a voice assistant names one. The gap between cited and not cited is huge.' },
                  { icon: LineChart, title: 'High-intent traffic', text: 'People who arrive after an AI recommendation have already been told you are a good fit, so they convert better.' }
                ].map(({ icon: Icon, title, text }) => (
                  <div key={title} className="bg-white/5 border border-white/10 rounded-[2rem] p-8">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-300 flex items-center justify-center mb-5">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-xl font-black text-white mb-3">{title}</h3>
                    <p className="text-blue-100/70 font-medium leading-relaxed">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* What's included */}
        <section className="py-24 bg-slate-50 border-y border-slate-100">
          <div className="container mx-auto max-w-6xl px-6">
            <SectionHeading eyebrow="What’s included" title="Six pillars of Ringscale AEO" text="Everything an answer engine needs to understand, trust and recommend your business, handled end to end." />
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pillars.map(({ icon: Icon, title, text, points }) => (
                <div key={title} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 group flex flex-col">
                  <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mb-3 leading-tight">{title}</h3>
                  <p className="text-slate-500 font-medium leading-relaxed mb-6">{text}</p>
                  <ul className="space-y-2 mt-auto">
                    {points.map(p => (
                      <li key={p} className="flex items-start gap-2 text-sm text-slate-600 font-medium">
                        <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How AI picks answers */}
        <section className="py-24 bg-white">
          <div className="container mx-auto max-w-6xl px-6">
            <SectionHeading eyebrow="How answer engines choose" title="What makes content “quotable”" text="AI engines prefer content that is easy to extract and safe to repeat. Every page we publish is built around these six factors." />
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {answerFactors.map(({ icon: Icon, title, text }) => (
                <div key={title} className="flex gap-5 p-7 rounded-[2rem] border border-slate-100 bg-slate-50/50">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 mb-2">{title}</h3>
                    <p className="text-slate-500 font-medium leading-relaxed text-sm">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Before / after */}
        <section className="py-24 bg-slate-50 border-y border-slate-100">
          <div className="container mx-auto max-w-6xl px-6">
            <SectionHeading eyebrow="Before & after" title="The same information, written for answer engines" />
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="bg-white p-8 rounded-[2rem] border border-rose-100 shadow-sm">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-50 text-rose-600 text-xs font-black uppercase tracking-wider mb-6">
                  <X className="w-3.5 h-3.5" /> Before
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-4">Welcome to Our Clinic</h3>
                <p className="text-slate-500 font-medium leading-relaxed">
                  For over a decade we have been passionate about delivering excellence in dental care to our valued community. Our state-of-the-art facility and caring team strive to make every visit a pleasant experience. Contact us today to learn more about what we can do for you!
                </p>
                <ul className="mt-6 space-y-2 text-sm text-rose-600 font-semibold">
                  <li>No question answered</li>
                  <li>No hours, location or services stated</li>
                  <li>No structured data</li>
                </ul>
              </div>
              <div className="bg-white p-8 rounded-[2rem] border border-emerald-100 shadow-sm">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-black uppercase tracking-wider mb-6">
                  <Check className="w-3.5 h-3.5" /> After
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-4">Is the clinic open on Sundays for emergencies?</h3>
                <p className="text-slate-600 font-medium leading-relaxed">
                  Yes. The clinic is open every Sunday from 10 am to 4 pm and keeps two emergency slots free each day for toothache, broken teeth and swelling. Call ahead to reserve a slot; walk-ins are seen in order of urgency.
                </p>
                <ul className="mt-6 space-y-2 text-sm text-emerald-700 font-semibold">
                  <li>Question as heading, answer in the first sentence</li>
                  <li>Specific, verifiable facts</li>
                  <li>Wrapped in FAQPage and LocalBusiness schema</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="py-24 bg-white scroll-mt-28">
          <div className="container mx-auto max-w-6xl px-6">
            <SectionHeading eyebrow="How it works" title="From audit to answers in six steps" />
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {steps.map(({ title, text }, idx) => (
                <div key={title} className="p-8 rounded-[2rem] border border-slate-100 bg-slate-50/50">
                  <span className="inline-flex w-11 h-11 rounded-2xl bg-blue-600 text-white items-center justify-center font-black mb-6">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <h3 className="text-xl font-black text-slate-900 mb-3">{title}</h3>
                  <p className="text-slate-500 font-medium leading-relaxed">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Integration */}
        <section className="py-24 bg-slate-50 border-y border-slate-100">
          <div className="container mx-auto max-w-6xl px-6">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-sm font-black text-blue-600 uppercase tracking-widest mb-4">Easy integration</h2>
                <p className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-6">Works with the website you already have.</p>
                <p className="text-lg text-slate-500 font-medium leading-relaxed mb-8">
                  Ringscale AEO publishes FAQs, service pages and schema through a lightweight widget or API. Content is rendered on your own domain, so it builds your site’s authority, not ours.
                </p>
                <ul className="space-y-3">
                  {['WordPress, Shopify, Webflow, Wix and Squarespace', 'Next.js, React and custom-built sites', 'Server-rendered HTML so crawlers see the content', 'No design changes and no developer sprint'].map(t => (
                    <li key={t} className="flex items-start gap-3 text-slate-700 font-semibold">
                      <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-[#0B1220] rounded-[2rem] p-6 md:p-8 shadow-2xl overflow-x-auto">
                <div className="flex gap-1.5 mb-5">
                  <span className="w-3 h-3 rounded-full bg-rose-400" />
                  <span className="w-3 h-3 rounded-full bg-amber-400" />
                  <span className="w-3 h-3 rounded-full bg-emerald-400" />
                </div>
                <pre className="text-[13px] leading-relaxed text-slate-300 font-mono whitespace-pre">
{`<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [{
    "@type": "Question",
    "name": "Is the clinic open on Sundays?",
    "acceptedAnswer": {
      "@type": "Answer",
      "text": "Yes. Open every Sunday
               10 am to 4 pm..."
    }
  }]
}
</script>`}
                </pre>
                <p className="text-xs text-slate-500 font-semibold mt-5">Schema like this is generated and kept in sync for every page.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Who it's for */}
        <section className="py-24 bg-white">
          <div className="container mx-auto max-w-6xl px-6">
            <SectionHeading eyebrow="Who it’s for" title="Built for businesses customers ask about" />
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {audiences.map(({ icon: Icon, title, text }) => (
                <div key={title} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                  <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-5 text-blue-600">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-black text-slate-900 mb-3">{title}</h3>
                  <p className="text-slate-500 font-medium leading-relaxed text-sm">{text}</p>
                </div>
              ))}
            </div>
            <p className="text-center text-slate-500 font-medium mt-10">
              Looking for your industry? <Link href="/services#all-services" className="text-blue-600 font-bold hover:underline">See all industries we serve</Link>
            </p>
          </div>
        </section>

        {/* Deliverables + AEO with local SEO */}
        <section className="py-24 bg-slate-50 border-y border-slate-100">
          <div className="container mx-auto max-w-6xl px-6">
            <div className="grid lg:grid-cols-2 gap-12">
              <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <h2 className="text-sm font-black text-blue-600 uppercase tracking-widest mb-4">Deliverables</h2>
                <p className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight mb-8">What you get every month</p>
                <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-3">
                  {deliverables.map(d => (
                    <li key={d} className="flex items-start gap-2 text-sm text-slate-700 font-semibold">
                      <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-blue-600 p-10 rounded-[2.5rem] text-white">
                <h2 className="text-sm font-black text-blue-200 uppercase tracking-widest mb-4">AEO + local SEO</h2>
                <p className="text-2xl md:text-3xl font-extrabold tracking-tight mb-6">One platform for being found and being chosen.</p>
                <p className="text-blue-100 font-medium leading-relaxed mb-8">
                  Most AEO providers stop at content. Ringscale combines it with the local SEO tools you already know, so you can see the full picture of your visibility in one place.
                </p>
                <ul className="space-y-4">
                  {[
                    ['Geo-grid heatmaps', 'See your Google Maps ranking block by block.'],
                    ['Local pack rank tracking', 'Follow your target keywords across locations.'],
                    ['Google Business Profile tools', 'Keep the data AI engines read accurate and active.'],
                    ['Citation management', 'Consistent listings across the directories that matter.']
                  ].map(([t, d]) => (
                    <li key={t} className="flex gap-3">
                      <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                      <span><strong className="font-black">{t}.</strong> <span className="text-blue-100">{d}</span></span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-24 bg-white">
          <div className="container mx-auto max-w-4xl px-6">
            <SectionHeading eyebrow="FAQ" title="Answer Engine Optimization, answered" />
            <div className="space-y-4">
              {faqs.map(({ q, a }) => (
                <details key={q} className="group bg-slate-50/60 border border-slate-100 rounded-2xl p-6 open:bg-white open:shadow-lg transition-all">
                  <summary className="flex items-center justify-between gap-4 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                    <h3 className="text-lg font-black text-slate-900">{q}</h3>
                    <ChevronDown className="w-5 h-5 text-blue-600 shrink-0 transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="text-slate-600 font-medium leading-relaxed mt-4">{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Lead form */}
        <section id="contact" className="py-24 bg-slate-50 relative overflow-hidden scroll-mt-28">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-hero-grid opacity-50" />
          <div className="container mx-auto max-w-6xl px-6 relative z-10">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-700 text-sm font-bold">
                  <Sparkles className="w-4 h-4" />
                  Free AEO Audit
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                  Find out what AI <br />
                  <span className="text-blue-600">says about you.</span>
                </h2>
                <p className="text-xl text-slate-500 font-medium leading-relaxed">
                  Tell us about your business and we will show you how answer engines describe you today, which questions competitors are winning, and exactly what to fix first.
                </p>
                <div className="space-y-4 pt-2">
                  {['How AI engines currently describe your business', 'Questions where competitors are cited instead of you', 'Schema and content gaps on your key pages', 'A prioritised AEO roadmap'].map(t => (
                    <div key={t} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-semibold text-slate-700">{t}</span>
                    </div>
                  ))}
                </div>
              </div>
              <LeadForm defaultService="Service: Answer Engine Optimization (AEO)" />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
