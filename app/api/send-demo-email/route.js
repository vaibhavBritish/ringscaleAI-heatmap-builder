import { sendWelcomeEmail, sendGMBWelcomeEmail } from '@/lib/mail'
import { NextResponse } from 'next/server'

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const email = searchParams.get('email') || 'vaibhavbhallabritish@gmail.com'
    
    await sendWelcomeEmail(email, 'Vaibhav', 'Pro', 1000);
    await sendGMBWelcomeEmail(email, 'Vaibhav', 'Agency', 5000, 'TempPass123!');
    
    return NextResponse.json({ success: true, message: `Sent demo emails to ${email}` });
  } catch(e) {
    return NextResponse.json({ error: e.message, success: false });
  }
}
