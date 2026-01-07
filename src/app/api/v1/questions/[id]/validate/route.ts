/**
 * API Route: /api/v1/questions/[id]/validate
 * 
 * Validates a user's answer selection for a question.
 * Used for preview/testing functionality.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getDatabase } from '@/lib/d1-client';
import { validateAnswer } from '@/lib/services/questions-service';
import { getSessionFromRequest, AUTH_ERRORS } from '@/lib/utils/auth-helpers';

/**
 * Request body schema for answer validation
 */
const validateAnswerSchema = z.object({
  selectedChoiceId: z.string().min(1, 'Selected choice ID is required'),
});

/**
 * POST /api/v1/questions/:id/validate
 * 
 * Validate a user's answer selection.
 * 
 * Request body:
 * {
 *   "selectedChoiceId": "choice-abc123"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "isCorrect": true,
 *     "correctChoiceId": "choice-abc123",
 *     "selectedChoiceId": "choice-abc123"
 *   }
 * }
 * 
 * @example
 * POST /api/v1/questions/question-123/validate
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
    const session = await getSessionFromRequest(request);
    
    if (!session) {
      return NextResponse.json(AUTH_ERRORS.UNAUTHORIZED, { status: 401 });
    }
    
    const { id } = await params;
    
    // Parse request body
    const body = await request.json();
    
    // Validate request data
    const { selectedChoiceId } = validateAnswerSchema.parse(body);
    
    // Validate answer
    const db = await getDatabase();
    const result = await validateAnswer(db, id, selectedChoiceId);
    
    // Return success response
    return NextResponse.json(
      {
        success: true,
        data: result,
      },
      { status: 200 }
    );
  } catch (error) {
    // Handle validation errors (Zod)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: error.issues.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }
    
    // Handle service errors (e.g., choice not found)
    if (error instanceof Error) {
      // Check for specific error messages from service
      if (error.message.includes('not found')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Not found',
            message: error.message,
          },
          { status: 404 }
        );
      }
    }
    
    // Handle other errors
    console.error('POST /api/v1/questions/:id/validate error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'Failed to validate answer. Please try again.',
      },
      { status: 500 }
    );
  }
}

