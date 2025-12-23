/**
 * GET /api/auth/session
 * 
 * Session verification endpoint.
 * Returns the current user's session data if authenticated.
 */

import { NextResponse } from 'next/server';
import { getSessionToken } from '@/lib/utils/cookies';
import { verifySession } from '@/lib/utils/session';
import { getUserById } from '@/lib/services/auth-service';

export async function GET() {
  try {
    // Get session token from cookie
    const token = await getSessionToken();
    
    if (!token) {
      return NextResponse.json(
        {
          success: false,
          authenticated: false,
          message: 'No active session',
        },
        { status: 401 } // 401 Unauthorized
      );
    }
    
    // Verify JWT token
    const session = await verifySession(token);
    
    if (!session) {
      return NextResponse.json(
        {
          success: false,
          authenticated: false,
          message: 'Invalid or expired session',
        },
        { status: 401 } // 401 Unauthorized
      );
    }
    
    // Get full user data from database
    const user = await getUserById(session.userId);
    
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          authenticated: false,
          message: 'User not found',
        },
        { status: 401 } // 401 Unauthorized
      );
    }
    
    // Return user data
    return NextResponse.json(
      {
        success: true,
        authenticated: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      },
      { status: 200 } // 200 OK
    );
  } catch (error) {
    console.error('Session verification error:', error);
    return NextResponse.json(
      {
        success: false,
        authenticated: false,
        error: 'Session verification failed',
        message: 'An unexpected error occurred. Please try again.',
      },
      { status: 500 } // 500 Internal Server Error
    );
  }
}

