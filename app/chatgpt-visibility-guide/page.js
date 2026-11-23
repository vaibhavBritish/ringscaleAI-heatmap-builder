import MarketingPage, { buildMetadata } from '@/components/site/MarketingPage'
import { pages } from '@/lib/site-content/pages'

const page = pages['chatgpt-visibility-guide']

export const metadata = buildMetadata(page, '/chatgpt-visibility-guide')

export default function ChatgptVisibilityGuidePage() {
  return <MarketingPage page={page} />
}
