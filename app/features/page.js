import MarketingPage, { buildMetadata } from '@/components/site/MarketingPage'
import { featureList } from '@/lib/site-content/features'

const page = {
  eyebrow: 'Features',
  title: 'Everything you need to',
  highlight: 'win local search.',
  metaTitle: 'Features | Ringscale AI Local SEO Platform',
  intro: 'Geo-grid heatmaps, Google Business Profile tools, citations, audits, reporting and AI visibility, all in one local SEO platform.',
  illustration: 'heatmap',
  sections: [{
    type: 'cards',
    eyebrow: 'Explore',
    title: 'All Ringscale features',
    items: featureList.map(f => ({ title: f.nav, text: f.metaDescription, href: `/features/${f.slug}` }))
  }]
}

export const metadata = buildMetadata(page, '/features')
export default function FeaturesIndex() {
  return <MarketingPage page={page} />
}
