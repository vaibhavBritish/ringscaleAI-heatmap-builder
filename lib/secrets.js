import { decrypt } from './crypto';

/**
 * Safely fetches a secret from environment variables.
 * If the value is prefixed with 'ENC:', it will be decrypted.
 * 
 * @param {string} key The environment variable key
 * @param {string} defaultValue Optional default value
 * @returns {string|undefined} The decrypted or plain secret
 */
export function getSecret(key, defaultValue = undefined) {
  const value = process.env[key];

  if (!value) {
    return defaultValue;
  }

  // Check if it's an encrypted secret
  if (value.startsWith('ENC:')) {
    try {
      const encryptedPart = value.substring(4); // Remove 'ENC:'
      return decrypt(encryptedPart);
    } catch (error) {
      console.error(`Failed to decrypt secret for key: ${key}`, error.message);
      // Fallback to plain value if decryption fails (might be a false positive prefix)
      return value;
    }
  }

  return value;
}

/**
 * Returns whether a key is configured (either plain or encrypted)
 */
export function hasSecret(key) {
  return !!process.env[key];
}
