/**
 * POST /api/auth/login
 * 
 * User login endpoint.
 * Verifies credentials and returns a session token.
 */

import { NextRequest, NextResponse } from 'next/server';
import { loginUser } from '@/lib/services/auth-service';
import { loginSchema } from '@/lib/validation/auth-schemas';
import { createSession } from '@/lib/utils/session';
import { setSessionCookie } from '@/lib/utils/cookies';
import { ZodError } from 'zod';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    
    // Validate request data with Zod
    const validatedData = loginSchema.parse(body);
    
    // Attempt to login (verify credentials)
    const user = await loginUser(validatedData);
    
    // Check if login was successful
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid credentials',
          message: 'The email or password you entered is incorrect. Please try again.',
        },
        { status: 401 } // 401 Unauthorized
      );
    }
    
    // Create JWT session token
    const token = await createSession(user.id, user.role);
    
    // Set HTTP-only cookie
    await setSessionCookie(token);
    
    // Return success response with user data (no password)
    return NextResponse.json(
      {
        success: true,
        message: 'Login successful',
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
    // Handle validation errors from Zod
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: error.issues?.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })) || [],
        },
        { status: 400 } // 400 Bad Request
      );
    }
    
    // Handle other errors
    console.error('Login error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Login failed',
        message: 'An unexpected error occurred. Please try again.',
      },
      { status: 500 } // 500 Internal Server Error
    );
  }
}

