/**
 * Session Management Utilities
 * 
 * Provides JWT-based session management using HTTP-only cookies.
 * This is a simple implementation focused on core functionality.
 * 
 * Security features:
 * - Tokens are signed with HS256 algorithm
 * - Tokens expire after 7 days
 * - Stored in HTTP-only cookies (not accessible via JavaScript)
 */

import { SignJWT, jwtVerify, type JWTPayload } from 'jose';

/**
 * JWT payload structure for our application sessions.
 */
export interface SessionPayload extends JWTPayload {
  userId: string;
  role: 'instructor' | 'student';
}

/**
 * Get the SESSION_SECRET as a Uint8Array for jose library.
 * The secret is stored in environment variables and encoded to bytes.
 */
function getSecretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  
  if (!secret) {
    throw new Error('SESSION_SECRET environment variable is not set');
  }
  
  return new TextEncoder().encode(secret);
}

/**
 * Create a JWT session token for a user.
 * 
 * @param userId - The unique identifier for the user
 * @param role - The user's role (instructor or student)
 * @returns Promise resolving to the signed JWT token string
 * 
 * @example
 * const token = await createSession('user123', 'instructor');
 * // Store this token in an HTTP-only cookie
 */
export async function createSession(
  userId: string,
  role: 'instructor' | 'student'
): Promise<string> {
  const secret = getSecretKey();
  
  const token = await new SignJWT({ userId, role })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d') // Token expires in 7 days
    .sign(secret);
  
  return token;
}

/**
 * Verify and decode a JWT session token.
 * 
 * @param token - The JWT token to verify
 * @returns Promise resolving to the session payload if valid, null if invalid
 * 
 * @example
 * const session = await verifySession(token);
 * if (session) {
 *   console.log('User ID:', session.userId);
 *   console.log('Role:', session.role);
 * }
 */
export async function verifySession(
  token: string
): Promise<SessionPayload | null> {
  try {
    const secret = getSecretKey();
    const { payload } = await jwtVerify(token, secret);
    
    // Validate that the payload has the expected structure
    if (
      typeof payload.userId === 'string' &&
      (payload.role === 'instructor' || payload.role === 'student')
    ) {
      return payload as SessionPayload;
    }
    
    return null;
  } catch (error) {
    // Token is invalid, expired, or has a bad signature
    console.error('Session verification failed:', error);
    return null;
  }
}

/**
 * Get the expiration time for session cookies (7 days in seconds).
 */
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days in seconds

