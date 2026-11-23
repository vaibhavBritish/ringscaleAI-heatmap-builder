import MarketingPage, { buildMetadata } from '@/components/site/MarketingPage'
import { pages } from '@/lib/site-content/pages'

const page = pages['seo-news']

export const metadata = buildMetadata(page, '/seo-news')

export default function SeoNewsPage() {
  return <MarketingPage page={page} />
}
