import { NextResponse } from 'next/server'
import { reportSystemError } from '@/lib/error-reporter'

export async function POST(request) {
  try {
    const body = await request.json()
    const { message, stack, digest, pathname } = body

    // Create a dummy error object for the reporter
    const error = new Error(message || 'Unknown Client Error')
    error.stack = stack || ''

    // Report it to the admin
    await reportSystemError('FRONTEND_CRASH', error, { digest, pathname })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Failed to log client error:', err)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
