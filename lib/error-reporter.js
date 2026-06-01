import { sendAdminErrorAlertEmail } from '@/lib/mail'

// Simple in-memory cache to prevent email spam for identical errors
// In a serverless environment like Vercel, this is per-instance, which is fine for basic throttling.
const errorCache = new Map()

// Throttle time: 1 hour in milliseconds
const THROTTLE_MS = 60 * 60 * 1000

/**
 * Reports a critical system error.
 * If the error has not been reported recently (within THROTTLE_MS), it sends an email alert.
 * 
 * @param {string} context - Where the error occurred (e.g. 'SERP_API_FETCHER', 'WEBHOOK_STRIPE')
 * @param {Error} error - The error object
 * @param {Object} additionalData - Any additional context (user ID, request params, etc.)
 */
export async function reportSystemError(context, error, additionalData = {}) {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'sales@ringscale.ai'
    
    // Create a unique key for this error based on context and error message
    const errorKey = `${context}::${error?.message || 'unknown'}`
    
    const lastReported = errorCache.get(errorKey)
    const now = Date.now()

    if (lastReported && (now - lastReported) < THROTTLE_MS) {
      console.log(`[ERROR-REPORTER] Throttled alert for: ${errorKey}`)
      return // Skip sending email to prevent spam
    }

    // Update cache
    errorCache.set(errorKey, now)

    console.log(`[ERROR-REPORTER] Sending alert for: ${context}`)
    
    // Extract error details safely
    const errorDetails = {
      message: error?.message || String(error),
      stack: error?.stack || 'No stack trace'
    }

    // Send the email
    await sendAdminErrorAlertEmail(adminEmail, context, errorDetails, additionalData)

  } catch (err) {
    // Failsafe so the error reporter itself never crashes the app
    console.error('[ERROR-REPORTER] Failed to process error report:', err)
  }
}
