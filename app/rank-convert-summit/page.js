import MarketingPage, { buildMetadata } from '@/components/site/MarketingPage'
import { pages } from '@/lib/site-content/pages'

const page = pages['rank-convert-summit']

export const metadata = buildMetadata(page, '/rank-convert-summit')

export default function RankConvertSummitPage() {
  return <MarketingPage page={page} />
}
