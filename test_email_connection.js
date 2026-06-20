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

async function testEmail() {
  const user = process.env.EMAIL_SERVER_USER;
  const rawPass = process.env.EMAIL_SERVER_PASSWORD;
  
  if (!user || !rawPass) {
    console.log('Error: EMAIL_SERVER_USER or EMAIL_SERVER_PASSWORD not set in .env');
    return;
  }

  const pass = decrypt(rawPass);
  
  console.log(`Testing SMTP connection for user: ${user}`);
  
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_SERVER_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_SERVER_PORT || '587'),
    secure: process.env.EMAIL_SERVER_PORT === '465',
    auth: {
      user: user,
      pass: pass,
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  transporter.verify(function (error, success) {
    if (error) {
      console.log("❌ SMTP connection failed:");
      console.error(error.message);
    } else {
      console.log("✅ Server is ready to take our messages. Login successful!");
    }
  });
}

testEmail();
