import MarketingPage, { buildMetadata } from '@/components/site/MarketingPage'
import { pages } from '@/lib/site-content/pages'

const page = pages['affiliate-program']

export const metadata = buildMetadata(page, '/affiliate-program')

export default function AffiliateProgramPage() {
  return <MarketingPage page={page} />
}
