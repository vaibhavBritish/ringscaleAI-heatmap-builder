import MarketingPage, { buildMetadata } from '@/components/site/MarketingPage'
import { ToolSection, IndexChecker } from '@/components/site/Tools'
import { tools } from '@/lib/site-content/tools'

const page = tools['google-index-checker']

export const metadata = buildMetadata(page, '/tools/google-index-checker')

export default function IndexCheckerPage() {
  return (
    <MarketingPage page={page}>
      <ToolSection>
        <IndexChecker />
      </ToolSection>
    </MarketingPage>
  )
}
