import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // Standard for GCM
const AUTH_TAG_LENGTH = 16;

/**
 * Encrypts text using AES-256-GCM
 * @param {string} text 
 * @returns {string} Encrypted text in format: iv:authTag:encryptedContent
 */
export function encrypt(text) {
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

  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypts text encrypted with AES-256-GCM
 * @param {string} encryptedText Format: iv:authTag:encryptedContent
 * @returns {string} Decrypted text
 */
export function decrypt(encryptedText) {
  const masterKey = process.env.ENCRYPTION_KEY;
  if (!masterKey) {
    throw new Error('ENCRYPTION_KEY is not defined in environment variables');
  }

  const parts = encryptedText.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted text format');
  }

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
