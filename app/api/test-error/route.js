import { NextResponse } from 'next/server';
import { reportSystemError } from '@/lib/error-reporter';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Create a fake error that simulates an API Limit
    const fakeError = new Error('Simulated Quota Limit Exceeded');
    fakeError.status = 429;
    
    // 2. Call our unified error reporter
    await reportSystemError('MANUAL_TEST_ALERT', fakeError, { 
      testing: true,
      time: new Date().toISOString(),
      message: 'If you are reading this email, the global error alert system is working perfectly!'
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Test error alert has been triggered! Please check your email inbox (including spam/junk folders).' 
    });
  } catch (error) {
    console.error('Test error failed:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
