import { google } from 'googleapis'
import path from 'path'

const KEY_FILE = path.join(process.cwd(), 'lib/ringscaleai-490013-d45bc08db957.json')

const auth = new google.auth.GoogleAuth({
  keyFile: KEY_FILE,
  scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
})

const searchconsole = google.searchconsole('v1')

/**
 * Fetch performance data from Google Search Console
 * @param {string} siteUrl - The site URL (property) in GSC (e.g. https://example.com/)
 * @param {number} days - Number of days to look back
 */
export async function getGSCPerformance(siteUrl, days = 30) {
  try {
    const authClient = await auth.getClient()
    
    // Ensure URL ends with / if it's a domain property or matches exactly
    const normalizedUrl = siteUrl.endsWith('/') ? siteUrl : `${siteUrl}/`

    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - days)

    const response = await searchconsole.searchanalytics.query({
      auth: authClient,
      siteUrl: normalizedUrl,
      requestBody: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        dimensions: ['date'],
        rowLimit: days,
      },
    })

    return response.data.rows || []
  } catch (error) {
    console.error('GSC API Error:', error.message)
    throw error
  }
}

/**
 * Fetch top queries from Google Search Console
 */
export async function getGSCTopQueries(siteUrl, days = 30, limit = 10) {
  try {
    const authClient = await auth.getClient()
    const normalizedUrl = siteUrl.endsWith('/') ? siteUrl : `${siteUrl}/`

    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - days)

    const response = await searchconsole.searchanalytics.query({
      auth: authClient,
      siteUrl: normalizedUrl,
      requestBody: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        dimensions: ['query'],
        rowLimit: limit,
      },
    })

    return response.data.rows || []
  } catch (error) {
    console.error('GSC Queries API Error:', error.message)
    throw error
  }
}
