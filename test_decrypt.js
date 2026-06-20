const crypto = require('crypto');
require('dotenv').config();

const ALGORITHM = 'aes-256-gcm';

function decrypt(encryptedText) {
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

try {
  console.log('Decrypted:', decrypt('0208e3706ec1ee6218473c7b:349f875b6704f2dffce93fa64192516c:0782fb8739494485f461c12c7425f0a5e3d9d8'));
} catch (e) {
  console.error('Error:', e.message);
}
