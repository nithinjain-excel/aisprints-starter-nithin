/**
 * POST /api/auth/logout
 * 
 * User logout endpoint.
 * Clears the session cookie.
 */

import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/utils/cookies';

export async function POST() {
  try {
    // Clear the session cookie
    await clearSessionCookie();
    
    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: 'Logout successful',
      },
      { status: 200 } // 200 OK
    );
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Logout failed',
        message: 'An unexpected error occurred. Please try again.',
      },
      { status: 500 } // 500 Internal Server Error
    );
  }
}

