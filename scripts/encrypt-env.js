const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Minimal encryption logic for the script (matches lib/crypto.js)
function encrypt(text, masterKey) {
  const ALGORITHM = 'aes-256-gcm';
  const IV_LENGTH = 12;
  const key = crypto.createHash('sha256').update(String(masterKey)).digest();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

const envPath = path.join(__dirname, '../.env');
const sensitiveKeys = [
  'GOOGLE_API_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'ANTHROPIC_API_KEY',
  'SERPAPI_API_KEY',
  'EMAIL_SERVER_PASSWORD',
  'RAZORPAY_KEY_SECRET',
  'RAZORPAY_WEBHOOK_SECRET',
  'EXTERNAL_REVIEW_GEN_PASSWORD',
  'NEXTAUTH_SECRET'
];

async function run() {
  if (!fs.existsSync(envPath)) {
    console.error('.env file not found');
    process.exit(1);
  }

  let envContent = fs.readFileSync(envPath, 'utf8');
  let encryptionKey = '';

  // Check for existing ENCRYPTION_KEY
  const keyMatch = envContent.match(/^ENCRYPTION_KEY=(.*)$/m);
  if (keyMatch && keyMatch[1]) {
    encryptionKey = keyMatch[1].trim();
    console.log('Using existing ENCRYPTION_KEY');
  } else {
    encryptionKey = crypto.randomBytes(32).toString('base64');
    envContent += `\nENCRYPTION_KEY=${encryptionKey}\n`;
    console.log('Generated new ENCRYPTION_KEY');
  }

  let lines = envContent.split('\n');
  let modified = false;

  const newLines = lines.map(line => {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match) {
      const key = match[1];
      const value = match[2].trim().replace(/^["'](.*)["']$/, '$1'); // Remove quotes

      if (sensitiveKeys.includes(key) && value && !value.startsWith('ENC:')) {
        console.log(`Encrypting ${key}...`);
        const encrypted = encrypt(value, encryptionKey);
        modified = true;
        return `${key}="ENC:${encrypted}"`;
      }
    }
    return line;
  });

  if (modified) {
    fs.writeFileSync(envPath, newLines.join('\n'));
    console.log('\nSUCCESS: Sensitive keys in .env have been encrypted.');
    console.log('IMPORTANT: Keep your ENCRYPTION_KEY safe!');
  } else {
    console.log('\nNo new keys to encrypt or all keys already encrypted.');
  }
}

run().catch(console.error);
