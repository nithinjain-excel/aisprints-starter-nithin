/**
 * Password Utilities
 * 
 * Provides secure password hashing and verification using bcrypt.
 * Uses 10 salt rounds as a good balance between security and performance.
 */

import bcrypt from 'bcryptjs';

/**
 * Number of salt rounds for bcrypt hashing.
 * 10 rounds is recommended for most applications as it provides good security
 * while maintaining acceptable performance (~100ms per hash).
 */
const SALT_ROUNDS = 10;

/**
 * Hash a plain text password using bcrypt.
 * 
 * @param password - The plain text password to hash
 * @returns Promise resolving to the hashed password
 * @throws Error if hashing fails
 * 
 * @example
 * const hash = await hashPassword('mySecurePassword123!');
 * // Returns something like: '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    return hash;
  } catch (error) {
    console.error('Error hashing password:', error);
    throw new Error('Failed to hash password');
  }
}

/**
 * Verify a plain text password against a bcrypt hash.
 * 
 * @param password - The plain text password to verify
 * @param hash - The bcrypt hash to compare against
 * @returns Promise resolving to true if password matches, false otherwise
 * 
 * @example
 * const isValid = await verifyPassword('myPassword', storedHash);
 * if (isValid) {
 *   console.log('Password is correct!');
 * }
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  try {
    const isMatch = await bcrypt.compare(password, hash);
    return isMatch;
  } catch (error) {
    console.error('Error verifying password:', error);
    return false;
  }
}

