import MarketingPage, { buildMetadata } from '@/components/site/MarketingPage'
import { pages } from '@/lib/site-content/pages'

const page = pages['local-seo-checklist-2026']

export const metadata = buildMetadata(page, '/local-seo-checklist-2026')

export default function LocalSeoChecklist2026Page() {
  return <MarketingPage page={page} />
}
