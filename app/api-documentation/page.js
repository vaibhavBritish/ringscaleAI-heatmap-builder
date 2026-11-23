import MarketingPage, { buildMetadata } from '@/components/site/MarketingPage'
import { pages } from '@/lib/site-content/pages'

const page = pages['api-documentation']

export const metadata = buildMetadata(page, '/api-documentation')

export default function ApiDocumentationPage() {
  return <MarketingPage page={page} />
}
