/**
 * Cookie Management Utilities
 * 
 * Provides helpers for setting and clearing HTTP-only cookies
 * for secure session management.
 */

import { cookies } from 'next/headers';
import { SESSION_MAX_AGE } from './session';

/**
 * The name of the session cookie.
 * This cookie stores the JWT token.
 */
export const SESSION_COOKIE_NAME = 'session';

/**
 * Set the session cookie with a JWT token.
 * 
 * Security features:
 * - HttpOnly: Not accessible via JavaScript (prevents XSS attacks)
 * - Secure: Only sent over HTTPS in production
 * - SameSite: Lax (prevents CSRF attacks while allowing normal navigation)
 * - Path: / (available across the entire application)
 * - MaxAge: 7 days (matches JWT expiration)
 * 
 * @param token - The JWT token to store in the cookie
 * 
 * @example
 * await setSessionCookie(token);
 */
export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true, // Not accessible via JavaScript
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: 'lax', // CSRF protection
    path: '/', // Available across entire app
    maxAge: SESSION_MAX_AGE, // 7 days in seconds
  });
}

/**
 * Clear the session cookie (used for logout).
 * 
 * @example
 * await clearSessionCookie();
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Get the session token from the cookie.
 * 
 * @returns The JWT token if present, null otherwise
 * 
 * @example
 * const token = await getSessionToken();
 * if (token) {
 *   const session = await verifySession(token);
 * }
 */
export async function getSessionToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(SESSION_COOKIE_NAME);
  
  return cookie?.value ?? null;
}

