/**
 * Authentication Helper Utilities
 * 
 * Helper functions for extracting and verifying user sessions from API requests.
 * Used by API routes to enforce authentication and authorization.
 */

import { NextRequest } from 'next/server';
import { verifySession, type SessionPayload } from './session';
import { cookies } from 'next/headers';

/**
 * Extract and verify the session from a NextRequest.
 * Looks for the session token in cookies and validates it.
 * 
 * @param _request - The Next.js request object (unused, kept for API compatibility)
 * @returns The validated session payload or null if invalid/missing
 * 
 * @example
 * const session = await getSessionFromRequest(request);
 * if (!session) {
 *   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 * }
 */
export async function getSessionFromRequest(
  _request: NextRequest
): Promise<SessionPayload | null> {
  try {
    // Get the session token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;
    
    if (!token) {
      return null;
    }
    
    // Verify the token
    const session = await verifySession(token);
    return session;
  } catch (error) {
    console.error('Error extracting session from request:', error);
    return null;
  }
}

/**
 * Check if a user has a specific role.
 * 
 * @param session - The session payload
 * @param allowedRoles - Array of allowed roles
 * @returns True if user has one of the allowed roles
 * 
 * @example
 * if (!hasRole(session, ['instructor'])) {
 *   return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
 * }
 */
export function hasRole(
  session: SessionPayload,
  allowedRoles: Array<'instructor' | 'student'>
): boolean {
  return allowedRoles.includes(session.role);
}

/**
 * Standard error responses for authentication failures.
 */
export const AUTH_ERRORS = {
  UNAUTHORIZED: {
    success: false,
    error: 'Unauthorized',
    message: 'You must be logged in to access this resource.',
  },
  FORBIDDEN: {
    success: false,
    error: 'Forbidden',
    message: 'You do not have permission to access this resource.',
  },
  INVALID_TOKEN: {
    success: false,
    error: 'Invalid Token',
    message: 'Your session token is invalid or has expired. Please log in again.',
  },
} as const;

