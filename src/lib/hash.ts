import { pbkdf2Sync, randomBytes } from 'crypto';

/**
 * Hashes a plain-text password using PBKDF2.
 * Output format is `salt:hash` in hex.
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Verifies a plain-text password against a stored `salt:hash` value.
 */
export function verifyPassword(password: string, storedValue: string): boolean {
  if (!storedValue.includes(':')) {
    return false;
  }
  const [salt, originalHash] = storedValue.split(':');
  const hash = pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === originalHash;
}
