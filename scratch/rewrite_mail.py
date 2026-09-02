import re
import os

with open('./lib/mail.js', 'r') as f:
    content = f.read()

layout_func = """
/**
 * Generates a professional email layout with Ringscale branding.
 */
function generateEmailLayout({ content, appName, logoUrl, supportPhone, preheader = '' }) {
  const logo = logoUrl && logoUrl.startsWith('/') ? `https://ringscale.ai${logoUrl}` : (logoUrl || 'https://ringscale.ai/logo.png');
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${appName}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      ${preheader ? `<div style="display: none; max-height: 0px; overflow: hidden;">${preheader}</div>` : ''}
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #ffffff; border-radius: 12px; margin-top: 20px; margin-bottom: 20px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
        
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 32px; border-bottom: 1px solid #f1f5f9; padding-bottom: 24px;">
          <a href="https://ringscale.ai" target="_blank" style="text-decoration: none;">
            <img src="${logo}" alt="${appName}" style="height: 48px; max-width: 100%;" onerror="this.onerror=null; this.style.display='none'; this.nextElementSibling.style.display='block';" />
            <h1 style="display: none; color: #2563eb; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.025em;">${appName.toUpperCase()}</h1>
          </a>
        </div>

        <!-- Content -->
        <div style="color: #334155; line-height: 1.6; font-size: 16px;">
          ${content}
        </div>

        <!-- Footer -->
        <div style="margin-top: 48px; padding-top: 24px; border-top: 1px solid #f1f5f9; text-align: center;">
          <div style="margin-bottom: 16px;">
            <a href="https://ringscale.ai" style="color: #2563eb; text-decoration: none; font-weight: 500; font-size: 14px; margin: 0 12px;">Visit Website</a>
            <span style="color: #cbd5e1;">|</span>
            <a href="https://calendly.com/ringscalemedia-info/ringscale-strategy-call" style="color: #2563eb; text-decoration: none; font-weight: 500; font-size: 14px; margin: 0 12px;">Book a Call</a>
          </div>
          <p style="color: #64748b; font-size: 13px; margin-bottom: 12px;">
            Need assistance? Give us a call at <a href="tel:${supportPhone}" style="color: #2563eb; text-decoration: none; font-weight: 600;">${supportPhone}</a>
          </p>
          <p style="color: #94a3b8; font-size: 12px; margin-bottom: 0;">
            &copy; ${new Date().getFullYear()} ${appName}. All rights reserved.<br/>
            This is an automated email, please do not reply.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}
"""

# Insert layout function after imports
content = content.replace("import { getSecret } from './secrets'", "import { getSecret } from './secrets'\n" + layout_func)

# We have these functions:
# sendOTPEmail
# sendPasswordResetEmail
# sendSubscriptionEmail
# sendWelcomeEmail
# sendTrialEndingEmail
# sendSubscriptionEndingReminderEmail
# sendSubscriptionEndingAdminNotification
# sendAdminErrorAlertEmail
# sendGMBWelcomeEmail
# sendGMBAuditEmail

replacements = [
    # sendOTPEmail
    (r"export async function sendOTPEmail\(email, otp\) \{\s*const mailOptions = \{[^}]+?html: `[\s\S]+?`,\s*\}",
     """export async function sendOTPEmail(email, otp) {
  const settings = await getEmailSettings()
  const appName = settings.appName || 'Ringscale AI'
  const logoUrl = settings.logoUrl || 'https://ringscale.ai/logo.png'
  const supportPhone = await getSupportPhone(email)
  const mailOptions = {
    from: process.env.EMAIL_FROM || '"Ringscale AI" <noreply@ringscale.ai>',
    to: email,
    subject: `Verify your account - ${otp}`,
    html: generateEmailLayout({
      appName, logoUrl, supportPhone,
      preheader: 'Secure Verification',
      content: `
        <div style="text-align: center;">
          <p style="color: #1e293b; font-size: 16px; margin-bottom: 20px;">Use the following code to verify your email address:</p>
          <div style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #1e293b; padding: 15px; background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 8px; display: inline-block;">
            ${otp}
          </div>
          <p style="color: #64748b; font-size: 14px; margin-top: 20px;">This code will expire in 10 minutes.</p>
        </div>
      `
    })
  }"""),

    # sendPasswordResetEmail
    (r"const mailOptions = \{\s*from: process.env.EMAIL_FROM \|\| `\"\$\{appName\}\" <noreply@ringscale.ai>`,[\s\S]+?html: `([\s\S]+?)`,\s*\}",
     """const mailOptions = {
    from: process.env.EMAIL_FROM || `"${appName}" <noreply@ringscale.ai>`,
    to: email,
    subject: `Reset your ${appName} password`,
    html: generateEmailLayout({
      appName, logoUrl: settings.logoUrl || 'https://ringscale.ai/logo.png', supportPhone: await getSupportPhone(email),
      preheader: 'Reset your password',
      content: `
          <p style="margin-bottom: 16px;">Hey ${name || 'there'},</p>
          <p style="margin-bottom: 24px;">We received a request to reset your password. Click the button below to create a new password.</p>
          <div style="text-align: left; margin-bottom: 32px;">
            <a href="${resetUrl}" style="display: inline-block; padding: 14px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; font-weight: 700; border-radius: 8px; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.3);">Reset My Password</a>
          </div>
          <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px 20px; border-radius: 0 8px 8px 0; margin-bottom: 28px;">
            <p style="margin: 0; color: #92400e; font-size: 14px; font-weight: 600;">⏳ This link will expire in <strong>1 hour</strong>.</p>
          </div>
          <p style="font-size: 13px; color: #64748b; margin-bottom: 24px;">If the button doesn't work, copy and paste this link into your browser:<br/><a href="${resetUrl}" style="color: #2563eb; word-break: break-all;">${resetUrl}</a></p>
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px 20px; margin-bottom: 28px;">
            <p style="margin: 0; color: #64748b; font-size: 13px;">🔒 <strong>Didn't request this?</strong> You can safely ignore this email.</p>
          </div>
      `
    })
  }"""),
  
    # sendSubscriptionEmail
    (r"export async function sendSubscriptionEmail\(email, details\) \{\s*(const \{\s*planName,[\s\S]+?invoicePdf\s*\} = details\n\n\s*const formattedDate = [\s\S]+?'N\/A'\n)\s*const mailOptions = \{[\s\S]+?html: `[\s\S]+?`,\s*\}",
     """export async function sendSubscriptionEmail(email, details) {
  \\1
  const settings = await getEmailSettings()
  const appName = settings.appName || 'Ringscale AI'
  const logoUrl = settings.logoUrl || 'https://ringscale.ai/logo.png'
  const supportPhone = await getSupportPhone(email)
  const mailOptions = {
    from: process.env.EMAIL_FROM || `"${appName}" <noreply@ringscale.ai>`,
    to: email,
    subject: `Subscription Confirmed: ${planName} Plan Active`,
    html: generateEmailLayout({
      appName, logoUrl, supportPhone,
      preheader: 'Subscription Confirmed',
      content: `
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
      `
    })
  }"""),
  
    # sendWelcomeEmail (only replacing mailOptions part)
    (r"(const loginUrl = `\$\{process.env.NEXTAUTH_URL\}/login`\n\s*const bookMeeting = 'https://calendly.com/ringscalemedia-info/ringscale-strategy-call'\n\s*)const mailOptions = \{[\s\S]+?html: `([\s\S]+?)`,\s*\}",
     """\\1const mailOptions = {
    from: process.env.EMAIL_FROM || `"${appName}" <noreply@ringscale.ai>`,
    to: email,
    subject: `Welcome to ${appName}! 👋 - ${plan.charAt(0).toUpperCase() + plan.slice(1).replace('_', ' ')} Plan Active`,
    html: generateEmailLayout({
      appName, logoUrl: settings.logoUrl || 'https://ringscale.ai/logo.png', supportPhone,
      preheader: 'Welcome to Ringscale AI',
      content: `
          <p style="margin-bottom: 24px;">Hey ${name || 'there'},</p>
          <p style="margin-bottom: 24px;">We're thrilled to have you on board! Your account is now active and ready to help you dominate local search.</p>
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
          <p style="margin-bottom: 24px;">Our professional <strong>local SEO SaaS platform</strong> is designed to help you dominate the Google Maps Top 3 and grow your business with data-driven heatmaps.</p>
          <p style="margin-bottom: 32px;">Everything is already set up on our end. We just need to connect briefly to confirm details and answer any questions you may have.</p>
          <div style="text-align: left; margin-bottom: 32px;">
            <a href="${loginUrl}" style="display: inline-block; padding: 14px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; font-weight: 700; border-radius: 8px; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2); margin-right: 15px;">Log me in</a>
            <a href="${bookMeeting}" style="display: inline-block; padding: 14px 32px; background-color: #f8fafc; color: #1e293b; text-decoration: none; font-weight: 700; border-radius: 8px; font-size: 16px; border: 1px solid #e2e8f0;">Book a Meeting</a>
          </div>
          <p style="margin-bottom: 24px;">We've tried reaching you and don't want you to miss any time from your trial. Please give us a quick call at <strong>${supportPhone}</strong> so we can make sure everything is good to go. It should only take a few minutes.</p>
      `
    })
  }"""),
  
    # sendTrialEndingEmail (only replacing mailOptions part)
    (r"(const formattedDate = [^;]+?;\n\s*)const mailOptions = \{[\s\S]+?html: `([\s\S]+?)`,\s*\}",
     """\\1const mailOptions = {
    from: process.env.EMAIL_FROM || `"${appName}" <noreply@ringscale.ai>`,
    to: email,
    subject: `⏳ Your ${appName} 7-Day Trial is Ending – Don't Lose Access!`,
    html: generateEmailLayout({
      appName, logoUrl: settings.logoUrl || 'https://ringscale.ai/logo.png', supportPhone,
      preheader: 'Your 7-Day Trial is Ending',
      content: `
          <p style="margin-bottom: 16px;">Hey ${name || 'there'},</p>
          <p style="margin-bottom: 24px;">Just a heads-up — your <strong>free 7-day trial</strong> is coming to an end on <strong>${formattedDate}</strong>.</p>
          <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 0 8px 8px 0; margin-bottom: 28px;">
            <p style="margin: 0; color: #92400e; font-weight: 600;">⚠️ After your trial ends, you will lose access to your heatmaps, local SEO tools, and analytics dashboard.</p>
          </div>
          <p style="margin-bottom: 24px;">Upgrade now to keep your rankings growing and maintain uninterrupted access to all your data.</p>
          <div style="text-align: left; margin-bottom: 32px;">
            <a href="${process.env.NEXTAUTH_URL}/dashboard/billing" style="display: inline-block; padding: 14px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; font-weight: 700; border-radius: 8px; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2); margin-right: 15px;">Upgrade My Account</a>
            <a href="${bookMeeting}" style="display: inline-block; padding: 14px 32px; background-color: #f8fafc; color: #1e293b; text-decoration: none; font-weight: 700; border-radius: 8px; font-size: 16px; border: 1px solid #e2e8f0;">Book a Strategy Call</a>
          </div>
          <p style="margin-bottom: 24px;">Have questions? Call us at <strong>${supportPhone}</strong> — we'd love to help you get the most out of ${appName}.</p>
      `
    })
  }"""),
  
    # sendSubscriptionEndingReminderEmail
    (r"(const formattedDate = [^;]+?;\n\s*)const mailOptions = \{[\s\S]+?html: `([\s\S]+?)`,\s*\}",
     """\\1const mailOptions = {
    from: process.env.EMAIL_FROM || `"${appName}" <noreply@ringscale.ai>`,
    to: email,
    subject: `Action Required: Your ${appName} subscription is expiring in 7 days`,
    html: generateEmailLayout({
      appName, logoUrl: settings.logoUrl || 'https://ringscale.ai/logo.png', supportPhone,
      preheader: 'Subscription Expiring Soon',
      content: `
          <p>Hi ${name || 'there'},</p>
          <p>This is a quick reminder that your <strong>${planName}</strong> plan is set to expire on <strong>${formattedDate}</strong>.</p>
          <div style="background-color: #fffbeb; padding: 20px; border-left: 4px solid #f59e0b; margin: 24px 0;">
            <p style="margin: 0; color: #b45309;">To ensure uninterrupted access to your local SEO tools, heatmaps, and analytics, please renew your subscription before it ends.</p>
          </div>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${process.env.NEXTAUTH_URL}/dashboard/billing" style="display: inline-block; padding: 14px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; font-weight: 700; border-radius: 8px; font-size: 16px;">Renew Subscription</a>
          </div>
          <p>If you have any questions or need assistance, feel free to reply to this email or call our team at <strong>${supportPhone}</strong>.</p>
      `
    })
  }"""),

    # sendSubscriptionEndingAdminNotification
    (r"export async function sendSubscriptionEndingAdminNotification\(adminEmail, user, planName\) \{\s*(const formattedDate = [\s\S]+?'soon'\n)\s*const mailOptions = \{[\s\S]+?html: `[\s\S]+?`,\s*\}",
     """export async function sendSubscriptionEndingAdminNotification(adminEmail, user, planName) {
  \\1
  const settings = await getEmailSettings()
  const appName = settings.appName || 'Ringscale AI'
  const logoUrl = settings.logoUrl || 'https://ringscale.ai/logo.png'
  const supportPhone = settings.supportPhone || '+14372913091'
  const mailOptions = {
    from: process.env.EMAIL_FROM || '"Ringscale AI Admin" <noreply@ringscale.ai>',
    to: adminEmail,
    subject: `Renewal Follow-up: ${user.name || user.email}'s subscription expires in 7 days`,
    html: generateEmailLayout({
      appName, logoUrl, supportPhone,
      preheader: 'Subscription Expiring Soon',
      content: `
        <h2 style="color: #1e293b; margin-top: 0;">Subscription Expiring Soon</h2>
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
      `
    })
  }"""),
  
    # sendAdminErrorAlertEmail
    (r"export async function sendAdminErrorAlertEmail\(adminEmail, context, errorDetails, additionalData = \{\}\) \{\s*const mailOptions = \{[\s\S]+?html: `[\s\S]+?`,\s*\}",
     """export async function sendAdminErrorAlertEmail(adminEmail, context, errorDetails, additionalData = {}) {
  const settings = await getEmailSettings()
  const appName = settings.appName || 'Ringscale AI'
  const logoUrl = settings.logoUrl || 'https://ringscale.ai/logo.png'
  const supportPhone = settings.supportPhone || '+14372913091'
  const mailOptions = {
    from: process.env.EMAIL_FROM || '"Ringscale Error System" <noreply@ringscale.ai>',
    to: adminEmail,
    subject: `🚨 SYSTEM ALERT: Error in ${context}`,
    html: generateEmailLayout({
      appName, logoUrl, supportPhone,
      preheader: 'Critical System Error',
      content: `
        <div style="background-color: #fef2f2; border: 1px solid #f87171; border-radius: 8px; padding: 20px;">
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
        </div>
      `
    })
  }"""),
  
    # sendGMBWelcomeEmail
    (r"(const loginUrl = `\$\{process.env.NEXTAUTH_URL\}/login`\n\s*const bookMeeting = 'https://calendly.com/ringscalemedia-info/ringscale-strategy-call'\n\s*)const mailOptions = \{[\s\S]+?html: `([\s\S]+?)`,\s*\}",
     """\\1const mailOptions = {
    from: process.env.EMAIL_FROM || `"${appName}" <noreply@ringscale.ai>`,
    to: email,
    subject: `Welcome to ${appName}! 👋 - ${plan.charAt(0).toUpperCase() + plan.slice(1).replace('_', ' ')} Plan Active`,
    html: generateEmailLayout({
      appName, logoUrl: settings.logoUrl || 'https://ringscale.ai/logo.png', supportPhone,
      preheader: 'Welcome to Ringscale AI',
      content: `
          <p style="margin-bottom: 24px;">Hey ${name || 'there'},</p>
          <p style="margin-bottom: 24px;">We're thrilled to have you on board! Your account is now active and ready to help you dominate local search.</p>
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
          <p style="margin-bottom: 24px;">Our professional <strong>local SEO SaaS platform</strong> is designed to help you dominate the Google Maps Top 3 and grow your business with data-driven heatmaps.</p>
          <div style="text-align: left; margin-bottom: 32px;">
            <a href="${loginUrl}" style="display: inline-block; padding: 14px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; font-weight: 700; border-radius: 8px; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2); margin-right: 15px;">Log me in</a>
            <a href="${bookMeeting}" style="display: inline-block; padding: 14px 32px; background-color: #f8fafc; color: #1e293b; text-decoration: none; font-weight: 700; border-radius: 8px; font-size: 16px; border: 1px solid #e2e8f0;">Book a Meeting</a>
          </div>
          <p style="margin-bottom: 24px;">We've tried reaching you and don't want you to miss any time from your trial. Please give us a quick call at <strong>${supportPhone}</strong> so we can make sure everything is good to go.</p>
      `
    })
  }"""),
  
    # sendGMBAuditEmail
    (r"(const topKeywords = auditReport\?\.keywords\?\.topRanked\?\.slice\(0, 3\) \|\| \[\];\n\s*)const mailOptions = \{[\s\S]+?html: `([\s\S]+?)`,\s*\}",
     """\\1const mailOptions = {
    from: process.env.EMAIL_FROM || `"${appName}" <noreply@ringscale.ai>`,
    to: email,
    subject: `Your ${appName} Initial Audit Report is Ready 🚀`,
    html: generateEmailLayout({
      appName, logoUrl: settings.logoUrl || 'https://ringscale.ai/logo.png', supportPhone,
      preheader: 'Your Initial Audit Report',
      content: `
          <p style="margin-bottom: 24px;">Hey ${name || 'there'},</p>
          <p style="margin-bottom: 24px;">We've just completed an initial local SEO audit for your business profile. Here is a quick summary of the results:</p>
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
          <p style="margin-bottom: 32px;">To dive deeper into your competitors, local rankings, and full heatmap analytics, click the link below to view your complete audit report and download it as a PDF!</p>
          <div style="text-align: left; margin-bottom: 32px;">
            <a href="${publicAuditUrl}" style="display: inline-block; padding: 14px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; font-weight: 700; border-radius: 8px; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2); margin-right: 15px;">View Full Audit</a>
            <a href="${bookMeeting}" style="display: inline-block; padding: 14px 32px; background-color: #f8fafc; color: #1e293b; text-decoration: none; font-weight: 700; border-radius: 8px; font-size: 16px; border: 1px solid #e2e8f0;">Book a Strategy Call</a>
          </div>
          <p style="margin-bottom: 24px;">Have any questions? Give us a call at <strong>${supportPhone}</strong>.</p>
      `
    })
  }""")
]

for pattern, repl in replacements:
    content, count = re.subn(pattern, repl, content)
    if count == 0:
        print(f"Warning: Failed to match and replace a pattern: {pattern[:50]}")
    else:
        print(f"Successfully replaced pattern: {pattern[:50]}")

with open('./lib/mail.js', 'w') as f:
    f.write(content)
