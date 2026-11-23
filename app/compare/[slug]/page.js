import { notFound } from 'next/navigation'
import MarketingPage, { buildMetadata } from '@/components/site/MarketingPage'
import { competitors } from '@/lib/site-content/compare'

export const dynamicParams = false

export function generateStaticParams() {
  return Object.keys(competitors).map(slug => ({ slug }))
}

export async function generateMetadata({ params }) {
  const { slug } = await params
  const page = competitors[slug]
  return page ? buildMetadata(page, `/compare/${slug}`) : {}
}

export default async function ComparePage({ params }) {
  const { slug } = await params
  const page = competitors[slug]
  if (!page) notFound()
  return <MarketingPage page={page} />
}
