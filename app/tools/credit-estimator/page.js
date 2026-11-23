import MarketingPage, { buildMetadata } from '@/components/site/MarketingPage'
import { ToolSection, CreditEstimator } from '@/components/site/Tools'
import { tools } from '@/lib/site-content/tools'

const page = tools['credit-estimator']

export const metadata = buildMetadata(page, '/tools/credit-estimator')

export default function CreditEstimatorPage() {
  return (
    <MarketingPage page={page}>
      <ToolSection>
        <CreditEstimator />
      </ToolSection>
    </MarketingPage>
  )
}
