import MarketingPage, { buildMetadata } from '@/components/site/MarketingPage'
import { ToolSection, KeywordGenerator } from '@/components/site/Tools'
import { tools } from '@/lib/site-content/tools'

const page = tools['keyword-generator']

export const metadata = buildMetadata(page, '/tools/keyword-generator')

export default function KeywordGeneratorPage() {
  return (
    <MarketingPage page={page}>
      <ToolSection>
        <KeywordGenerator />
      </ToolSection>
    </MarketingPage>
  )
}
