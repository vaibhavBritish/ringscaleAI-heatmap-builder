const crypto = require('crypto');
require('dotenv').config();

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // Standard for GCM

function encrypt(text) {
  const masterKey = process.env.ENCRYPTION_KEY;
  if (!masterKey) {
    throw new Error('ENCRYPTION_KEY is not defined in environment variables');
  }

  // Ensure key is 32 bytes (256 bits)
  const key = crypto.createHash('sha256').update(String(masterKey)).digest();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag().toString('hex');

  return `ENC:${iv.toString('hex')}:${authTag}:${encrypted}`;
}

const secretToEncrypt = process.argv[2];

if (!secretToEncrypt) {
  console.log('Usage: node encrypt_secret.js "YOUR_SECRET_HERE"');
  process.exit(1);
}

try {
  const encrypted = encrypt(secretToEncrypt);
  console.log('\nYour encrypted secret is:');
  console.log(encrypted);
  console.log('\nCopy and paste this into your .env file.');
} catch (e) {
  console.error('Error:', e.message);
}
