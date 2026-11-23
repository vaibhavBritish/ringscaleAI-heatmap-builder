import MarketingPage, { buildMetadata } from '@/components/site/MarketingPage'
import { pages } from '@/lib/site-content/pages'

const page = pages['about']

export const metadata = buildMetadata(page, '/about')

export default function AboutPage() {
  return <MarketingPage page={page} />
}
