import nodemailer from 'nodemailer'
import prisma from '@/lib/prisma'
import { getSecret } from './secrets'

/**
 * Creates a fresh transporter each time it is called so that environment
 * variables (and any encrypted secrets) are resolved at send-time rather
 * than at module-import time.  This avoids the 535 "Username and Password
 * not accepted" error that occurs when the module is loaded before the
 * runtime environment is fully initialised.
 */
function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.EMAIL_SERVER_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_SERVER_PORT || '587'),
    secure: process.env.EMAIL_SERVER_PORT === '465', // true for 465, false for other ports
    auth: {
      user: getSecret('EMAIL_SERVER_USER'),
      pass: getSecret('EMAIL_SERVER_PASSWORD'),
    },
    tls: {
      rejectUnauthorized: false // Helps in some environments
    }
  })
}

/**
 * Fetches dynamic email and branding settings from the database.
 */
async function getEmailSettings() {
  try {
    const settings = await prisma.globalSetting.findMany()
    const settingsMap = settings.reduce((acc, curr) => {
      acc[curr.key] = curr.value
      return acc
    }, {})

    return {
      appName: settingsMap.branding?.appName || 'Ringscale AI',
      logoUrl: settingsMap.branding?.logoUrl || '/logo.png',
      supportPhone: settingsMap.branding?.supportPhone || '+14372913099',
      ...settingsMap.email
    }
  } catch (error) {
    console.error('Error fetching email settings:', error)
    return {
      appName: 'Ringscale AI',
      logoUrl: '/logo.png',
      supportPhone: '+14372913099',
      from: '"Ringscale AI" <noreply@ringscale.ai>'
    }
  }
}

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
    return await getTransporter().sendMail(mailOptions)
  } catch (error) {
    console.error('Error sending OTP email:', error)
    throw new Error('Failed to send verification email. Please check your SMTP settings.')
  }
}

/**
 * Sends a password reset link email.
 *
 * @param {string} email      - Recipient email address
 * @param {string} name       - Recipient name
 * @param {string} resetToken - Secure reset token
 */
export async function sendPasswordResetEmail(email, name, resetToken) {
  const settings = await getEmailSettings()
  const appName = settings.appName || 'Ringscale AI'
  
  // Use BASE_URL, NEXTAUTH_URL, or determine based on environment
  let appUrl = process.env.BASE_URL || process.env.NEXTAUTH_URL || 'https://ringscale.ai'
  if (process.env.NODE_ENV === 'development' && appUrl.includes('ringscale.ai')) {
    appUrl = 'http://localhost:3000'
  }
  
  const resetUrl = `${appUrl}/reset-password?token=${resetToken}`

  const mailOptions = {
    from: process.env.EMAIL_FROM || `"${appName}" <noreply@ringscale.ai>`,
    to: email,
    subject: `Reset your ${appName} password`,
    html: `
      <div style="font-family: 'Inter', sans-serif, system-ui; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #ffffff;">
        <!-- Header -->
        <div style="margin-bottom: 40px; border-bottom: 1px solid #f1f5f9; padding-bottom: 20px;">
          <h1 style="color: #2563eb; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.025em;">${appName.toUpperCase()}</h1>
        </div>

        <!-- Content -->
        <div style="color: #334155; line-height: 1.6; font-size: 16px;">
          <p style="margin-bottom: 16px;">Hey ${name || 'there'},</p>

          <p style="margin-bottom: 24px;">
            We received a request to reset your password. Click the button below to create a new password.
          </p>

          <!-- CTA Button -->
          <div style="text-align: left; margin-bottom: 32px;">
            <a href="${resetUrl}"
               style="display: inline-block; padding: 14px 32px; background-color: #2563eb; color: #ffffff;
                      text-decoration: none; font-weight: 700; border-radius: 8px; font-size: 16px;
                      box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.3);">
              Reset My Password
            </a>
          </div>

          <!-- Expiry notice -->
          <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px 20px; border-radius: 0 8px 8px 0; margin-bottom: 28px;">
            <p style="margin: 0; color: #92400e; font-size: 14px; font-weight: 600;">
              ⏳ This link will expire in <strong>1 hour</strong>. After that, you'll need to request a new one.
            </p>
          </div>

          <!-- Fallback link -->
          <p style="font-size: 13px; color: #64748b; margin-bottom: 24px;">
            If the button doesn't work, copy and paste this link into your browser:<br/>
            <a href="${resetUrl}" style="color: #2563eb; word-break: break-all;">${resetUrl}</a>
          </p>

          <!-- Security note -->
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px 20px; margin-bottom: 28px;">
            <p style="margin: 0; color: #64748b; font-size: 13px;">
              🔒 <strong>Didn't request this?</strong> If you didn't request a password reset, you can safely ignore this email. Your password will not change.
            </p>
          </div>

          <p style="margin-top: 40px; color: #1e293b; font-weight: 600;">
            Best,<br />
            The ${appName} Team
          </p>
        </div>

        <!-- Footer -->
        <div style="margin-top: 48px; padding-top: 24px; border-top: 1px solid #f1f5f9; text-align: center;">
          <p style="color: #94a3b8; font-size: 12px; margin-bottom: 4px;">
            &copy; ${new Date().getFullYear()} ${appName}. All rights reserved.
          </p>
          <p style="color: #94a3b8; font-size: 12px;">
            This email was sent because a password reset was requested for your account.
          </p>
        </div>
      </div>
    `,
  }

  try {
    return await getTransporter().sendMail(mailOptions)
  } catch (error) {
    console.error('Error sending password reset email:', error)
    throw new Error('Failed to send password reset email. Please check your SMTP settings.')
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
    return await getTransporter().sendMail(mailOptions)
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
export async function sendWelcomeEmail(email, name, plan, credits) {
  const settings = await getEmailSettings()
  const appName = settings.appName || 'Ringscale AI'
  const supportPhone = settings.supportPhone || '+14372913099'
  const appNameUpper = appName.toUpperCase()

  const loginUrl = `${process.env.NEXTAUTH_URL}/login`
  const bookMeeting = 'https://calendly.com/ringscalemedia-info/ringscale-strategy-call'
  
  const mailOptions = {
    from: process.env.EMAIL_FROM || `"${appName}" <noreply@ringscale.ai>`,
    to: email,
    subject: `Welcome to ${appName}! 👋 - ${plan.charAt(0).toUpperCase() + plan.slice(1).replace('_', ' ')} Plan Active`,
    html: `
      <div style="font-family: 'Inter', sans-serif, system-ui; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #ffffff;">
        <!-- Header -->
        <div style="margin-bottom: 40px; border-bottom: 1px solid #f1f5f9; padding-bottom: 20px;">
          <h1 style="color: #2563eb; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.025em;">${appNameUpper}</h1>
        </div>
        
        <!-- Content -->
        <div style="color: #334155; line-height: 1.6; font-size: 16px;">
          <p style="margin-bottom: 24px;">Hey ${name || 'there'},</p>
          
          <p style="margin-bottom: 24px;">
            We're thrilled to have you on board! Your account is now active and ready to help you dominate local search.
          </p>

          <div style="background-color: #f8fafc; padding: 24px; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 32px;">
            <div style="margin-bottom: 20px;">
              <p style="margin: 0; color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">Selected Plan</p>
              <p style="margin: 4px 0 0 0; color: #1e293b; font-size: 20px; font-weight: 700;">${plan.charAt(0).toUpperCase() + plan.slice(1).replace('_', ' ')} Plan</p>
            </div>
            <div>
              <p style="margin: 0; color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">Initial Credits</p>
              <p style="margin: 4px 0 0 0; color: #2563eb; font-size: 24px; font-weight: 800;">${credits} Credits</p>
            </div>

          </div>
          
          <p style="margin-bottom: 24px;">
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
            The ${appName} Team
          </p>
        </div>
        
        <!-- Footer -->
        <div style="margin-top: 48px; padding-top: 24px; border-top: 1px solid #f1f5f9; text-align: center;">
          <p style="color: #94a3b8; font-size: 12px; margin-bottom: 8px;">
            &copy; ${new Date().getFullYear()} ${appName}. All rights reserved.
          </p>
          <p style="color: #94a3b8; font-size: 12px;">
            You are receiving this because you signed up for a trial at ${appName.toLowerCase().replace(' ', '')}.ai.
          </p>
        </div>
      </div>
    `,
  }

  try {
    return await getTransporter().sendMail(mailOptions)
  } catch (error) {
    console.error('Error sending welcome email:', error)
    // We don't throw here to avoid failing registration if email fails
    return null
  }
}

/**
 * Sends a trial-ending reminder email to a trial user (sent when ~7 days remain).
 *
 * @param {string} email - Recipient email address
 * @param {string} name  - Recipient name
 * @param {Date}   trialEndsAt - When the trial expires
 */
export async function sendTrialEndingEmail(email, name, trialEndsAt) {
  const settings = await getEmailSettings()
  const appName = settings.appName || 'Ringscale AI'
  const supportPhone = settings.supportPhone || '+14372913099'
  const bookMeeting = 'https://calendly.com/ringscalemedia-info/ringscale-strategy-call'

  const formattedDate = trialEndsAt
    ? new Date(trialEndsAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : 'soon'

  const mailOptions = {
    from: process.env.EMAIL_FROM || `"${appName}" <noreply@ringscale.ai>`,
    to: email,
    subject: `⏳ Your ${appName} 7-Day Trial is Ending – Don't Lose Access!`,
    html: `
      <div style="font-family: 'Inter', sans-serif, system-ui; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #ffffff;">
        <!-- Header -->
        <div style="margin-bottom: 40px; border-bottom: 1px solid #f1f5f9; padding-bottom: 20px;">
          <h1 style="color: #2563eb; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.025em;">${appName.toUpperCase()}</h1>
        </div>

        <!-- Content -->
        <div style="color: #334155; line-height: 1.6; font-size: 16px;">
          <p style="margin-bottom: 16px;">Hey ${name || 'there'},</p>

          <p style="margin-bottom: 24px;">
            Just a heads-up — your <strong>free 7-day trial</strong> is coming to an end on <strong>${formattedDate}</strong>.
          </p>

          <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 0 8px 8px 0; margin-bottom: 28px;">
            <p style="margin: 0; color: #92400e; font-weight: 600;">
              ⚠️ After your trial ends, you will lose access to your heatmaps, local SEO tools, and analytics dashboard.
            </p>
          </div>

          <p style="margin-bottom: 24px;">
            Upgrade now to keep your rankings growing and maintain uninterrupted access to all your data.
          </p>

          <!-- CTA -->
          <div style="text-align: left; margin-bottom: 20px;">
            <a href="${process.env.NEXTAUTH_URL}/dashboard/billing" style="display: inline-block; padding: 14px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; font-weight: 700; border-radius: 8px; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);">Upgrade My Account</a>
          </div>

          <div style="text-align: left; margin-bottom: 32px;">
            <a href="${bookMeeting}" style="display: inline-block; padding: 14px 32px; background-color: #f1f5f9; color: #1e293b; text-decoration: none; font-weight: 600; border-radius: 8px; font-size: 16px;">Book a Strategy Call</a>
          </div>

          <p style="margin-bottom: 24px;">
            Have questions? Call us at <strong>${supportPhone}</strong> — we'd love to help you get the most out of ${appName}.
          </p>

          <p style="margin-top: 40px; color: #1e293b; font-weight: 600;">
            Best,<br />
            The ${appName} Team
          </p>
        </div>

        <!-- Footer -->
        <div style="margin-top: 48px; padding-top: 24px; border-top: 1px solid #f1f5f9; text-align: center;">
          <p style="color: #94a3b8; font-size: 12px; margin-bottom: 8px;">
            &copy; ${new Date().getFullYear()} ${appName}. All rights reserved.
          </p>
          <p style="color: #94a3b8; font-size: 12px;">
            You are receiving this because you signed up for a trial at ${appName}.
          </p>
        </div>
      </div>
    `,
  }

  try {
    return await getTransporter().sendMail(mailOptions)
  } catch (error) {
    console.error('Error sending trial ending email:', error)
    return null
  }
}

/**
 * Sends a 7-day subscription expiration reminder to the user.
 */
export async function sendSubscriptionEndingReminderEmail(email, name, planName, planEndsAt) {
  const settings = await getEmailSettings()
  const appName = settings.appName || 'Ringscale AI'
  const supportPhone = settings.supportPhone || '+14372913099'
  
  const formattedDate = planEndsAt ? new Date(planEndsAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : 'soon'

  const mailOptions = {
    from: process.env.EMAIL_FROM || `"${appName}" <noreply@ringscale.ai>`,
    to: email,
    subject: `Action Required: Your ${appName} subscription is expiring in 7 days`,
    html: `
      <div style="font-family: 'Inter', sans-serif, system-ui; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #f59e0b; margin: 0; font-size: 24px; font-weight: 800;">${appName.toUpperCase()}</h1>
          <p style="color: #64748b; margin-top: 5px;">Subscription Reminder</p>
        </div>
        
        <div style="color: #334155; line-height: 1.6; font-size: 16px;">
          <p>Hi ${name || 'there'},</p>
          <p>This is a quick reminder that your <strong>${planName}</strong> plan is set to expire on <strong>${formattedDate}</strong>.</p>
          
          <div style="background-color: #fffbeb; padding: 20px; border-left: 4px solid #f59e0b; margin: 24px 0;">
            <p style="margin: 0; color: #b45309;">To ensure uninterrupted access to your local SEO tools, heatmaps, and analytics, please renew your subscription before it ends.</p>
          </div>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${process.env.NEXTAUTH_URL}/dashboard/billing" style="display: inline-block; padding: 14px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; font-weight: 700; border-radius: 8px; font-size: 16px;">Renew Subscription</a>
          </div>
          
          <p>If you have any questions or need assistance, feel free to reply to this email or call our team at <strong>${supportPhone}</strong>.</p>
          
          <p style="margin-top: 40px; color: #1e293b; font-weight: 600;">
            Best,<br />
            The ${appName} Team
          </p>
        </div>
      </div>
    `,
  }

  try {
    return await getTransporter().sendMail(mailOptions)
  } catch (error) {
    console.error('Error sending subscription reminder email:', error)
    return null
  }
}

/**
 * Sends a notification to the admin/sales team when a user's subscription is expiring.
 */
export async function sendSubscriptionEndingAdminNotification(adminEmail, user, planName) {
  const formattedDate = user.planEndsAt ? new Date(user.planEndsAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : 'soon'

  const mailOptions = {
    from: process.env.EMAIL_FROM || '"Ringscale AI Admin" <noreply@ringscale.ai>',
    to: adminEmail,
    subject: `Renewal Follow-up: ${user.name || user.email}'s subscription expires in 7 days`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Subscription Expiring Soon</h2>
        <p>This is an automated notification for the sales team to follow up regarding a pending renewal.</p>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <tr>
            <td style="padding: 10px; border: 1px solid #e2e8f0; background: #f8fafc; font-weight: bold; width: 30%;">User</td>
            <td style="padding: 10px; border: 1px solid #e2e8f0;">${user.name || 'N/A'} (${user.email})</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #e2e8f0; background: #f8fafc; font-weight: bold;">Phone</td>
            <td style="padding: 10px; border: 1px solid #e2e8f0;">${user.phone || 'Not provided'}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #e2e8f0; background: #f8fafc; font-weight: bold;">Plan</td>
            <td style="padding: 10px; border: 1px solid #e2e8f0;">${planName}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #e2e8f0; background: #f8fafc; font-weight: bold;">Expiration Date</td>
            <td style="padding: 10px; border: 1px solid #e2e8f0;">${formattedDate}</td>
          </tr>
        </table>
        
        <p style="margin-top: 20px;">Please reach out to this user to assist with their renewal process.</p>
      </div>
    `,
  }

  try {
    return await getTransporter().sendMail(mailOptions)
  } catch (error) {
    console.error('Error sending admin notification email:', error)
    return null
  }
}

/**
 * Sends a critical error alert to the admin email.
 */
export async function sendAdminErrorAlertEmail(adminEmail, context, errorDetails, additionalData = {}) {
  const mailOptions = {
    from: process.env.EMAIL_FROM || '"Ringscale Error System" <noreply@ringscale.ai>',
    to: adminEmail,
    subject: `🚨 SYSTEM ALERT: Error in ${context}`,
    html: `
      <div style="font-family: monospace; max-width: 800px; margin: 0 auto; padding: 20px; background-color: #fef2f2; border: 1px solid #f87171; border-radius: 8px;">
        <h2 style="color: #b91c1c; margin-top: 0;">🚨 Critical System Error Detected</h2>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px; background: white;">
          <tr>
            <td style="padding: 10px; border: 1px solid #fca5a5; font-weight: bold; width: 25%;">Context</td>
            <td style="padding: 10px; border: 1px solid #fca5a5; color: #b91c1c;">${context}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #fca5a5; font-weight: bold;">Time (UTC)</td>
            <td style="padding: 10px; border: 1px solid #fca5a5;">${new Date().toISOString()}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #fca5a5; font-weight: bold;">Error Message</td>
            <td style="padding: 10px; border: 1px solid #fca5a5;">${errorDetails?.message || 'Unknown Error'}</td>
          </tr>
        </table>

        <h3 style="color: #7f1d1d; margin-top: 20px;">Stack Trace</h3>
        <pre style="background: #1e293b; color: #f8fafc; padding: 15px; border-radius: 4px; overflow-x: auto; font-size: 12px;">${errorDetails?.stack || 'No stack trace available'}</pre>

        <h3 style="color: #7f1d1d;">Additional Data</h3>
        <pre style="background: #f1f5f9; color: #334155; padding: 15px; border-radius: 4px; border: 1px solid #cbd5e1; overflow-x: auto; font-size: 12px;">${JSON.stringify(additionalData, null, 2)}</pre>
        
        <p style="margin-top: 20px; font-size: 12px; color: #64748b;">This is an automated alert generated by the Ringscale AI Error Reporter.</p>
      </div>
    `,
  }

  try {
    return await getTransporter().sendMail(mailOptions)
  } catch (error) {
    console.error('CRITICAL: Failed to send error alert email:', error)
    return null
  }
}

/**
 * Sends a welcome email containing generated credentials to users registering via GMB.
 */
export async function sendGMBWelcomeEmail(email, name, plan, credits, password) {
  const settings = await getEmailSettings()
  const appName = settings.appName || 'Ringscale AI'
  const supportPhone = settings.supportPhone || '+14372913099'
  const appNameUpper = appName.toUpperCase()

  const loginUrl = `${process.env.NEXTAUTH_URL}/login`
  const bookMeeting = 'https://calendly.com/ringscalemedia-info/ringscale-strategy-call'
  
  const mailOptions = {
    from: process.env.EMAIL_FROM || `"${appName}" <noreply@ringscale.ai>`,
    to: email,
    subject: `Welcome to ${appName}! 👋 - ${plan.charAt(0).toUpperCase() + plan.slice(1).replace('_', ' ')} Plan Active`,
    html: `
      <div style="font-family: 'Inter', sans-serif, system-ui; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #ffffff;">
        <!-- Header -->
        <div style="margin-bottom: 40px; border-bottom: 1px solid #f1f5f9; padding-bottom: 20px;">
          <h1 style="color: #2563eb; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.025em;">${appNameUpper}</h1>
        </div>
        
        <!-- Content -->
        <div style="color: #334155; line-height: 1.6; font-size: 16px;">
          <p style="margin-bottom: 24px;">Hey ${name || 'there'},</p>
          
          <p style="margin-bottom: 24px;">
            We're thrilled to have you on board! Your account is now active and ready to help you dominate local search.
          </p>

          <div style="background-color: #f8fafc; padding: 24px; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 32px;">
            <div style="margin-bottom: 20px;">
              <p style="margin: 0; color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">Selected Plan</p>
              <p style="margin: 4px 0 0 0; color: #1e293b; font-size: 20px; font-weight: 700;">${plan.charAt(0).toUpperCase() + plan.slice(1).replace('_', ' ')} Plan</p>
            </div>
            <div style="margin-bottom: 20px;">
              <p style="margin: 0; color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">Initial Credits</p>
              <p style="margin: 4px 0 0 0; color: #2563eb; font-size: 24px; font-weight: 800;">${credits} Credits</p>
            </div>
            <div style="border-top: 1px solid #e2e8f0; padding-top: 16px;">
              <p style="margin: 0; color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">Your Login Credentials</p>
              <p style="margin: 4px 0; color: #334155; font-size: 14px;"><strong>Email:</strong> ${email}</p>
              <p style="margin: 4px 0; color: #334155; font-size: 14px;"><strong>Temporary Password:</strong> <code style="background-color: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-family: monospace;">${password}</code></p>
              <p style="margin: 8px 0 0 0; color: #ef4444; font-size: 12px; font-weight: 600;">Please change your password immediately after logging in.</p>
            </div>
          </div>
          
          <p style="margin-bottom: 24px;">
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
            The ${appName} Team
          </p>
        </div>
        
        <!-- Footer -->
        <div style="margin-top: 48px; padding-top: 24px; border-top: 1px solid #f1f5f9; text-align: center;">
          <p style="color: #94a3b8; font-size: 12px; margin-bottom: 8px;">
            &copy; ${new Date().getFullYear()} ${appName}. All rights reserved.
          </p>
          <p style="color: #94a3b8; font-size: 12px;">
            You are receiving this because you signed up for a trial at ${appName.toLowerCase().replace(' ', '')}.ai.
          </p>
        </div>
      </div>
    `,
  }

  try {
    return await getTransporter().sendMail(mailOptions)
  } catch (error) {
    console.error('Error sending GMB welcome email:', error)
    return null
  }
}

/**
 * Sends an email containing the initial audit report to the user.
 */
export async function sendGMBAuditEmail(email, name, auditReport) {
  const settings = await getEmailSettings()
  const appName = settings.appName || 'Ringscale AI'
  const supportPhone = settings.supportPhone || '+14372913099'
  const appNameUpper = appName.toUpperCase()

  const loginUrl = `${process.env.NEXTAUTH_URL}/login`
  const bookMeeting = 'https://calendly.com/ringscalemedia-info/ringscale-strategy-call'
  
  // Audit Metrics
  const optimizationScore = auditReport?.metrics?.optimizationScore || 0;
  const rating = auditReport?.businessInfo?.rating || 0;
  const reviewCount = auditReport?.businessInfo?.reviewCount || 0;
  const aiKeywords = auditReport?.keywords?.aiSuggested?.slice(0, 3) || [];
  const topKeywords = auditReport?.keywords?.topRanked?.slice(0, 3) || [];

  const mailOptions = {
    from: process.env.EMAIL_FROM || `"${appName}" <noreply@ringscale.ai>`,
    to: email,
    subject: `Your ${appName} Initial Audit Report is Ready 🚀`,
    html: `
      <div style="font-family: 'Inter', sans-serif, system-ui; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #ffffff;">
        <!-- Header -->
        <div style="margin-bottom: 40px; border-bottom: 1px solid #f1f5f9; padding-bottom: 20px;">
          <h1 style="color: #2563eb; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.025em;">${appNameUpper}</h1>
        </div>
        
        <!-- Content -->
        <div style="color: #334155; line-height: 1.6; font-size: 16px;">
          <p style="margin-bottom: 24px;">Hey ${name || 'there'},</p>
          
          <p style="margin-bottom: 24px;">
            We've just completed an initial local SEO audit for your business profile. Here is a quick summary of the results:
          </p>

          <!-- Audit Results -->
          <div style="background-color: #f8fafc; padding: 24px; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 32px;">
            <h2 style="margin-top: 0; color: #1e293b; font-size: 18px;">Initial Audit Report</h2>
            <div style="margin-bottom: 20px; display: flex; gap: 20px;">
              <div style="flex: 1;">
                <p style="margin: 0; color: #64748b; font-size: 13px; text-transform: uppercase; font-weight: 600;">Optimization Score</p>
                <p style="margin: 4px 0 0 0; color: #2563eb; font-size: 24px; font-weight: 800;">${optimizationScore}/100</p>
              </div>
              <div style="flex: 1;">
                <p style="margin: 0; color: #64748b; font-size: 13px; text-transform: uppercase; font-weight: 600;">Google Rating</p>
                <p style="margin: 4px 0 0 0; color: #1e293b; font-size: 20px; font-weight: 700;">⭐ ${rating} (${reviewCount} reviews)</p>
              </div>
            </div>

            <div style="margin-bottom: 20px;">
              <p style="margin: 0 0 8px 0; color: #64748b; font-size: 13px; text-transform: uppercase; font-weight: 600;">AI Suggested Keywords for Growth</p>
              <ul style="margin: 0; padding-left: 20px; color: #334155; font-size: 14px;">
                ${aiKeywords.map(kw => `<li>${kw}</li>`).join('')}
              </ul>
            </div>

            <div>
              <p style="margin: 0 0 8px 0; color: #64748b; font-size: 13px; text-transform: uppercase; font-weight: 600;">Top Ranked Keywords</p>
              <ul style="margin: 0; padding-left: 20px; color: #334155; font-size: 14px;">
                ${topKeywords.map(kw => `<li>${kw}</li>`).join('')}
              </ul>
            </div>
          </div>
          
          <p style="margin-bottom: 32px;">
            To dive deeper into your competitors, local rankings, and full heatmap analytics, please log in to your dashboard!
          </p>
          
          <!-- CTA -->
          <div style="text-align: left; margin-bottom: 24px;">
            <a href="${loginUrl}" style="display: inline-block; padding: 14px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; font-weight: 700; border-radius: 8px; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);">View Full Audit</a>
          </div>

          <div style="text-align: left; margin-bottom: 32px;">
            <a href="${bookMeeting}" style="display: inline-block; padding: 14px 32px; background-color: #f1f5f9; color: #1e293b; text-decoration: none; font-weight: 700; border-radius: 8px; font-size: 16px;">Book a Strategy Call</a>
          </div>
          
          <p style="margin-bottom: 24px;">
            Have any questions? Give us a call at <strong>${supportPhone}</strong>.
          </p>
          
          <!-- Sign-off -->
          <p style="margin-top: 40px; color: #1e293b; font-weight: 600;">
            Best,<br />
            The ${appName} Team
          </p>
        </div>
        
        <!-- Footer -->
        <div style="margin-top: 48px; padding-top: 24px; border-top: 1px solid #f1f5f9; text-align: center;">
          <p style="color: #94a3b8; font-size: 12px; margin-bottom: 8px;">
            &copy; ${new Date().getFullYear()} ${appName}. All rights reserved.
          </p>
        </div>
      </div>
    `,
  }

  try {
    return await getTransporter().sendMail(mailOptions)
  } catch (error) {
    console.error('Error sending GMB Audit email:', error)
    return null
  }
}
