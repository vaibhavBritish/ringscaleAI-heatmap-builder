import MarketingPage, { buildMetadata } from '@/components/site/MarketingPage'
import { pages } from '@/lib/site-content/pages'

const page = pages['custom-package']

export const metadata = buildMetadata(page, '/custom-package')

export default function CustomPackagePage() {
  return <MarketingPage page={page} />
}
