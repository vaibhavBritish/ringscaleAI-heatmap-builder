import MarketingPage, { buildMetadata } from '@/components/site/MarketingPage'
import { competitorList } from '@/lib/site-content/compare'

const page = {
  eyebrow: 'Compare',
  title: 'How Ringscale AI',
  highlight: 'compares.',
  metaTitle: 'Ringscale AI Alternatives & Comparisons',
  intro: 'Honest, side-by-side comparisons of Ringscale AI with other local SEO and rank tracking tools, so you can choose what fits your business.',
  illustration: 'compare',
  sections: [{
    type: 'cards',
    eyebrow: 'Comparisons',
    title: 'Ringscale AI vs…',
    items: competitorList.map(c => ({ title: c.nav, text: c.metaDescription.replace(/^Comparing Ringscale AI and [^.]+\. /, ''), href: `/compare/${c.slug}`, linkLabel: 'Read comparison' }))
  }]
}

export const metadata = buildMetadata(page, '/compare')
export default function CompareIndex() {
  return <MarketingPage page={page} />
}
