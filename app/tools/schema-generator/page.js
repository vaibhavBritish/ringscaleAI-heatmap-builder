import MarketingPage, { buildMetadata } from '@/components/site/MarketingPage'
import { ToolSection, SchemaGenerator } from '@/components/site/Tools'
import { tools } from '@/lib/site-content/tools'

const page = tools['schema-generator']

export const metadata = buildMetadata(page, '/tools/schema-generator')

export default function SchemaGeneratorPage() {
  return (
    <MarketingPage page={page}>
      <ToolSection>
        <SchemaGenerator />
      </ToolSection>
    </MarketingPage>
  )
}
