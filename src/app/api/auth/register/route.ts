/**
 * POST /api/auth/register
 * 
 * User registration endpoint.
 * Creates a new user account and returns a session token.
 */

import { NextRequest, NextResponse } from 'next/server';
import { registerUser } from '@/lib/services/auth-service';
import { registrationSchema } from '@/lib/validation/auth-schemas';
import { createSession } from '@/lib/utils/session';
import { setSessionCookie } from '@/lib/utils/cookies';
import { ZodError } from 'zod';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    
    // Validate request data with Zod
    const validatedData = registrationSchema.parse(body);
    
    // Register the user (this will hash the password and store in DB)
    const user = await registerUser(validatedData);
    
    // Create JWT session token
    const token = await createSession(user.id, user.role);
    
    // Set HTTP-only cookie
    await setSessionCookie(token);
    
    // Return success response with user data (no password)
    return NextResponse.json(
      {
        success: true,
        message: 'Registration successful',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      },
      { status: 201 } // 201 Created
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
    
    // Handle specific application errors
    if (error instanceof Error) {
      // Check for duplicate email
      if (error.message === 'Email already registered') {
        return NextResponse.json(
          {
            success: false,
            error: 'Email already registered',
            message: 'An account with this email already exists. Please login instead.',
          },
          { status: 409 } // 409 Conflict
        );
      }
      
      console.error('Registration error:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Registration failed',
          message: error.message,
        },
        { status: 500 } // 500 Internal Server Error
      );
    }
    
    // Handle unknown errors
    console.error('Unknown registration error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Registration failed',
        message: 'An unexpected error occurred. Please try again.',
      },
      { status: 500 }
    );
  }
}

