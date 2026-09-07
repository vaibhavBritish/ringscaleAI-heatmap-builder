const crypto = require('crypto');
const nodemailer = require('nodemailer');
require('dotenv').config();

const ALGORITHM = 'aes-256-gcm';

function decrypt(encryptedText) {
  const masterKey = process.env.ENCRYPTION_KEY;
  if (!masterKey) return encryptedText;

  if (encryptedText.startsWith('ENC:')) {
    encryptedText = encryptedText.substring(4);
  } else {
    return encryptedText;
  }

  const parts = encryptedText.split(':');
  if (parts.length !== 3) return encryptedText;

  const [ivHex, authTagHex, encryptedContentHex] = parts;
  const key = crypto.createHash('sha256').update(String(masterKey)).digest();
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedContentHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

function generateEmailLayout({ content, appName, logoUrl, preheader = '' }) {
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
            <img src="${logo}" alt="${appName}" style="height: 90px; max-width: 100%;" />
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
          <div style="color: #64748b; font-size: 13px; margin-bottom: 16px; line-height: 1.5;">
            Need assistance? Give us a call:<br/>
            🇮🇳 <strong>India:</strong> <a href="tel:+917827494533" style="color: #2563eb; text-decoration: none; font-weight: 600;">+91 78274 94533</a> &nbsp;|&nbsp; 
            🌎 <strong>International:</strong> <a href="tel:+14372913091" style="color: #2563eb; text-decoration: none; font-weight: 600;">+1 437-291-3091</a>
          </div>
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

async function run() {
  const user = process.env.EMAIL_SERVER_USER;
  const rawPass = process.env.EMAIL_SERVER_PASSWORD;
  
  if (!user || !rawPass) {
    console.log('Error: EMAIL_SERVER_USER or EMAIL_SERVER_PASSWORD not set in .env');
    return;
  }

  const pass = decrypt(rawPass);
  
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_SERVER_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_SERVER_PORT || '587'),
    secure: process.env.EMAIL_SERVER_PORT === '465',
    auth: { user, pass },
    tls: { rejectUnauthorized: false }
  });

  const email = 'vaibhavbhallabritish@gmail.com';
  const name = 'Vaibhav';
  const appName = 'Ringscale AI';
  const plan = 'Pro';
  const credits = 1000;
  
  const loginUrl = process.env.NEXTAUTH_URL ? `${process.env.NEXTAUTH_URL}/login` : 'https://app.ringscale.ai/login';
  const bookMeeting = 'https://calendly.com/ringscalemedia-info/ringscale-strategy-call';

  const mailOptions = {
    from: process.env.EMAIL_FROM || `"${appName}" <noreply@ringscale.ai>`,
    to: email,
    subject: `Welcome to ${appName}! 👋 - ${plan} Plan Active`,
    html: generateEmailLayout({
      appName, logoUrl: 'https://ringscale.ai/logo.png',
      preheader: 'Welcome to Ringscale AI',
      content: `
          <div style="text-align: center; margin-bottom: 32px;">
            <h2 style="color: #1e293b; font-size: 24px; font-weight: 800; margin-bottom: 8px;">Welcome to ${appName}! 🎉</h2>
            <p style="color: #64748b; font-size: 16px; margin: 0;">Your local SEO journey starts here.</p>
          </div>
          
          <p style="margin-bottom: 24px; font-size: 16px;">Hi ${name || 'there'},</p>
          <p style="margin-bottom: 24px; font-size: 16px; line-height: 1.6;">We're thrilled to have you on board! Your account is now active and fully equipped to help you dominate local search rankings and grow your business with data-driven insights.</p>
          
          <div style="background: #f8fafc; padding: 24px; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 32px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding-bottom: 8px;">
                  <p style="margin: 0; color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">Selected Plan</p>
                  <p style="margin: 4px 0 0 0; color: #1e293b; font-size: 20px; font-weight: 700;">${plan} Plan</p>
                </td>
                <td style="padding-bottom: 8px; text-align: right;">
                  <p style="margin: 0; color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">Initial Credits</p>
                  <p style="margin: 4px 0 0 0; color: #2563eb; font-size: 24px; font-weight: 800;">${credits}</p>
                </td>
              </tr>
            </table>
          </div>
          
          <p style="margin-bottom: 24px; font-size: 16px;">Everything is set up on our end. To get started and make the most out of your trial, we highly recommend booking a quick strategy call. We'll walk you through the platform and answer any questions you might have.</p>
          
          <div style="text-align: center; margin-bottom: 32px;">
            <a href="${loginUrl}" style="display: inline-block; padding: 14px 28px; background-color: #2563eb; color: #ffffff; text-decoration: none; font-weight: 600; border-radius: 8px; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2); margin: 8px;">Log in to Dashboard</a>
            <a href="${bookMeeting}" style="display: inline-block; padding: 14px 28px; background-color: #ffffff; color: #1e293b; text-decoration: none; font-weight: 600; border-radius: 8px; font-size: 16px; border: 2px solid #e2e8f0; margin: 8px;">Book a Strategy Call</a>
          </div>
          <p style="margin-bottom: 24px; text-align: center; color: #64748b; font-size: 14px;">We don't want you to miss any time from your trial! Please give us a quick call or book a meeting so we can make sure everything is good to go.</p>
      `
    })
  }

  console.log('Sending Welcome email...');
  const res = await transporter.sendMail(mailOptions);
  console.log('Mail sent successfully!', res.messageId);
}

run().catch(console.error);
