import MarketingPage, { buildMetadata } from '@/components/site/MarketingPage'
import { pages } from '@/lib/site-content/pages'

const page = pages['faq']

export const metadata = buildMetadata(page, '/faq')

export default function FaqPage() {
  return <MarketingPage page={page} />
}
