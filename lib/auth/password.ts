import crypto from 'crypto';

/**
 * Hashes a plaintext password using Node.js native crypto.scryptSync with a random salt.
 */
export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return {
    hash: derivedKey.toString('hex'),
    salt
  };
}

/**
 * Verifies a plaintext password against a stored hash and salt.
 */
export function verifyPassword(password: string, hash: string, salt: string): boolean {
  try {
    const derivedKey = crypto.scryptSync(password, salt, 64);
    const keyBuffer = Buffer.from(hash, 'hex');
    if (keyBuffer.length !== derivedKey.length) {
      return false;
    }
    return crypto.timingSafeEqual(keyBuffer, derivedKey);
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
}
