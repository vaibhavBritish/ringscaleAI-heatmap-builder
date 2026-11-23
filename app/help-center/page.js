import MarketingPage, { buildMetadata } from '@/components/site/MarketingPage'
import { pages } from '@/lib/site-content/pages'

const page = pages['help-center']

export const metadata = buildMetadata(page, '/help-center')

export default function HelpCenterPage() {
  return <MarketingPage page={page} />
}
