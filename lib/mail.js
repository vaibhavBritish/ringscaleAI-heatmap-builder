import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_SERVER_PORT || '587'),
  secure: process.env.EMAIL_SERVER_PORT === '465', // true for 465, false for 587
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false // Helps in some dev environments
  }
})

/**
 * Sends a 6-digit OTP verification email to the user.
 * 
 * @param {string} email - Recipient email address
 * @param {string} otp - 6-digit verification code
 * @returns {Promise} - Result of the email sending operation
 */
export async function sendOTPEmail(email, otp) {
  const mailOptions = {
    from: process.env.EMAIL_FROM || '"Ringscale AI" <noreply@ringscale.ai>',
    to: email,
    subject: `Verify your account - ${otp}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb; margin: 0; font-size: 24px; font-weight: 800;">Ringscale AI</h1>
          <p style="color: #64748b; margin-top: 5px;">Secure Verification</p>
        </div>
        
        <div style="padding: 20px; text-align: center; background-color: #f8fafc; border-radius: 8px;">
          <p style="color: #1e293b; font-size: 16px; margin-bottom: 20px;">Use the following code to verify your email address:</p>
          <div style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #1e293b; padding: 15px; background: white; border: 2px solid #e2e8f0; border-radius: 8px; display: inline-block;">
            ${otp}
          </div>
          <p style="color: #64748b; font-size: 14px; margin-top: 20px;">This code will expire in 10 minutes.</p>
        </div>
        
        <div style="margin-top: 30px; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px;">
          <p style="color: #94a3b8; font-size: 12px;">If you didn't request this email, you can safely ignore it.</p>
          <p style="color: #94a3b8; font-size: 12px;">&copy; ${new Date().getFullYear()} Ringscale AI. All rights reserved.</p>
        </div>
      </div>
    `,
  }

  try {
    return await transporter.sendMail(mailOptions)
  } catch (error) {
    console.error('Error sending OTP email:', error)
    throw new Error('Failed to send verification email. Please check your SMTP settings.')
  }
}
/**
 * Sends a subscription purchase confirmation email to the user.
 * 
 * @param {string} email - Recipient email address
 * @param {Object} details - Subscription and payment details
 * @returns {Promise} - Result of the email sending operation
 */
export async function sendSubscriptionEmail(email, details) {
  const { 
    planName, 
    credits, 
    amount, 
    currency, 
    planEndsAt, 
    receiptUrl, 
    invoicePdf 
  } = details

  const formattedDate = planEndsAt ? new Date(planEndsAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : 'N/A'

  const mailOptions = {
    from: process.env.EMAIL_FROM || '"Ringscale AI" <noreply@ringscale.ai>',
    to: email,
    subject: `Subscription Confirmed: ${planName} Plan Active`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb; margin: 0; font-size: 24px; font-weight: 800;">Ringscale AI</h1>
          <p style="color: #64748b; margin-top: 5px;">Subscription Confirmed</p>
        </div>
        
        <div style="padding: 25px; background-color: #f8fafc; border-radius: 12px; border: 1px solid #f1f5f9; margin-bottom: 25px;">
          <h2 style="color: #1e293b; font-size: 18px; margin-top: 0; margin-bottom: 20px;">Welcome to the ${planName} Plan!</h2>
          
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Plan Type</td>
              <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 700; text-align: right;">${planName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Credits Added</td>
              <td style="padding: 8px 0; color: #2563eb; font-size: 14px; font-weight: 700; text-align: right;">+${credits} Credits</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Amount Paid</td>
              <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 700; text-align: right;">${amount} ${currency.toUpperCase()}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Valid Until</td>
              <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 700; text-align: right;">${formattedDate}</td>
            </tr>
          </table>
        </div>

        <div style="text-align: center; margin-bottom: 25px;">
          <a href="${process.env.NEXTAUTH_URL}/dashboard" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: #ffffff; text-decoration: none; font-weight: 600; border-radius: 8px;">Go to Dashboard</a>
        </div>

        ${receiptUrl || invoicePdf ? `
        <div style="padding: 15px; border: 1px dashed #e2e8f0; border-radius: 8px; text-align: center; margin-bottom: 25px;">
          <p style="color: #64748b; font-size: 13px; margin: 0 0 10px 0;">Need a copy of your invoice?</p>
          ${invoicePdf ? `<a href="${invoicePdf}" style="color: #2563eb; text-decoration: underline; font-size: 13px; margin: 0 10px;">Download PDF Invoice</a>` : ''}
          ${receiptUrl ? `<a href="${receiptUrl}" style="color: #2563eb; text-decoration: underline; font-size: 13px; margin: 0 10px;">View Online Receipt</a>` : ''}
        </div>
        ` : ''}
        
        <div style="margin-top: 30px; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px;">
          <p style="color: #94a3b8; font-size: 12px;">Thank you for choosing Ringscale AI. Let's grow your local SEO!</p>
          <p style="color: #94a3b8; font-size: 12px;">&copy; ${new Date().getFullYear()} Ringscale AI. All rights reserved.</p>
        </div>
      </div>
    `,
  }

  try {
    return await transporter.sendMail(mailOptions)
  } catch (error) {
    console.error('Error sending subscription email:', error)
    // We don't throw here to avoid failing the payment processing if email fails
    return null
  }
}

/**
 * Sends a personalized welcome email to new users after registration.
 * 
 * @param {string} email - Recipient email address
 * @param {string} name - Recipient name
 * @returns {Promise} - Result of the email sending operation
 */
export async function sendWelcomeEmail(email, name) {
  const loginUrl = `${process.env.NEXTAUTH_URL}/login`
  const supportPhone = '(619) 625-6148'
  const bookMeeting = 'https://calendly.com/ringscalemedia-info/onboarding-call-ringscale-ai'
  
  const mailOptions = {
    from: process.env.EMAIL_FROM || '"Ringscale AI" <noreply@ringscale.ai>',
    to: email,
    subject: `Welcome to Ringscale AI! 👋`,
    html: `
      <div style="font-family: 'Inter', sans-serif, system-ui; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #ffffff;">
        <!-- Header -->
        <div style="margin-bottom: 40px; border-bottom: 1px solid #f1f5f9; padding-bottom: 20px;">
          <h1 style="color: #2563eb; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.025em;">RINGSCALE <span style="color: #94a3b8; font-weight: 400;">AI</span></h1>
        </div>
        
        <!-- Content -->
        <div style="color: #334155; line-height: 1.6; font-size: 16px;">
          <p style="margin-bottom: 24px;">Hey ${name || 'there'},</p>
          
          <p style="margin-bottom: 24px;">
            We're excited that you signed up for a free trial of <strong>Ringscale AI</strong>! 
            Our professional <strong>local SEO SaaS platform</strong> is designed to help you dominate 
            the Google Maps Top 3 and grow your business with data-driven heatmaps.
          </p>
          
          <p style="margin-bottom: 32px;">
            Everything is already set up on our end. We just need to connect briefly to confirm details 
            and answer any questions you may have.
          </p>
          
          <!-- CTA -->
          <div style="text-align: left; margin-bottom: 32px;">
            <a href="${loginUrl}" style="display: inline-block; padding: 14px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; font-weight: 700; border-radius: 8px; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);">Log me in</a>
          </div>

          <div style="text-align: left; margin-bottom: 32px;">
            <a href="${bookMeeting}" style="display: inline-block; padding: 14px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; font-weight: 700; border-radius: 8px; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);">Book a Meeting</a>
          </div>
          
          <p style="margin-bottom: 24px;">
            We've tried reaching you and don't want you to miss any time from your trial. 
            Please give us a quick call at <strong>${supportPhone}</strong> so we can make 
            sure everything is good to go. It should only take a few minutes.
          </p>
          
          <p style="margin-bottom: 32px;">
            Looking forward to connecting with you soon.
          </p>
          
          <!-- Sign-off -->
          <p style="margin-top: 40px; color: #1e293b; font-weight: 600;">
            Best,<br />
            The Ringscale AI Team
          </p>
        </div>
        
        <!-- Footer -->
        <div style="margin-top: 48px; padding-top: 24px; border-top: 1px solid #f1f5f9; text-align: center;">
          <p style="color: #94a3b8; font-size: 12px; margin-bottom: 8px;">
            &copy; ${new Date().getFullYear()} Ringscale AI. All rights reserved.
          </p>
          <p style="color: #94a3b8; font-size: 12px;">
            You are receiving this because you signed up for a trial at ringscale.ai.
          </p>
        </div>
      </div>
    `,
  }

  try {
    return await transporter.sendMail(mailOptions)
  } catch (error) {
    console.error('Error sending welcome email:', error)
    // We don't throw here to avoid failing registration if email fails
    return null
  }
}
