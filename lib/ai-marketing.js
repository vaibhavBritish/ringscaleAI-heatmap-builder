import { Anthropic } from '@anthropic-ai/sdk'
import { getPlaceDetails } from './google-places'
import { getSecret } from './secrets'
import { reportSystemError } from './error-reporter'

const anthropic = new Anthropic({
  apiKey: getSecret('ANTHROPIC_API_KEY'),
})

/**
 * Generate AI review suggestions for a business
 */
export async function generateAIReviews(project, count = 5) {
  // 1. Get detailed business information if possible
  let businessInfo = project
  if (project.placeId && (!project.description || !project.industry)) {
    try {
      const place = await getPlaceDetails(project.placeId)
      businessInfo = { ...project, ...place }
    } catch (e) {
      console.warn('Failed to fetch business details for AI generation:', e.message)
    }
  }

  const industry = businessInfo.industry || businessInfo.primaryType || 'Local Business'
  const description = businessInfo.description || businessInfo.summary || `A high-quality business providing ${industry} services.`
  
  const prompt = `You are helping generate authentic, positive Google review suggestions for a business.

Business Name: ${businessInfo.businessName || businessInfo.name}
Industry: ${industry}
Description: ${description}
Key Features: ${businessInfo.keyFeatures?.join(', ') || 'Quality service, Professional staff'}

Generate exactly ${count} unique, authentic-sounding positive reviews that a satisfied customer might write. 

Requirements:
- Each review should be 2-4 sentences
- Sound natural and personal, like a real customer wrote it
- Highlight different aspects of the business
- Include specific details that make reviews feel genuine
- Vary the tone: some professional, some casual, some enthusiastic
- Do NOT use generic phrases like "highly recommend" in every review
- Make each review distinctly different

Return ONLY the reviews, one per line, separated by "|||" delimiter. No numbering, no quotes, no extra text.`

  try {
    const response = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20240620',
      max_tokens: 1000,
      messages: [
        { role: 'user', content: prompt }
      ]
    })

    const responseText = response.content[0].text
    const reviews = responseText.split('|||').map(r => r.trim()).filter(Boolean)
    return reviews.slice(0, count)
  } catch (error) {
    console.error('Error generating AI reviews:', error)
    
    // 429 = Rate Limit, 402 = Payment Required, 500/529 = Overloaded
    if (error.status === 429 || error.status === 402 || error.status === 529 || error.status >= 500) {
      reportSystemError('ANTHROPIC_API_LIMIT', error, { projectId: project?.id, count })
    }
    
    throw new Error(`Failed to generate reviews: ${error.message}`)
  }
}
