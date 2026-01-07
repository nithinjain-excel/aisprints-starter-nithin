/**
 * API Route: /api/v1/questions/[id]
 * 
 * Handles individual question operations.
 * - GET: Get a single question with choices
 * - PUT: Update an existing question
 * - DELETE: Delete a question
 */

import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { getDatabase } from '@/lib/d1-client';
import {
  getQuestionById,
  updateQuestion,
  deleteQuestion,
} from '@/lib/services/questions-service';
import { updateQuestionSchema } from '@/lib/validations/question-schema';
import { getSessionFromRequest, AUTH_ERRORS } from '@/lib/utils/auth-helpers';

/**
 * GET /api/v1/questions/:id
 * 
 * Get a single question with all its choices.
 * Only the question owner can access it.
 * 
 * @example
 * GET /api/v1/questions/abc123
 */
export async function GET(
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
    
    // Get question from database
    const db = await getDatabase();
    const question = await getQuestionById(db, id, session.userId);
    
    // Check if question exists and user has access
    if (!question) {
      return NextResponse.json(
        {
          success: false,
          error: 'Not found',
          message: 'Question not found or you do not have permission to access it.',
        },
        { status: 404 }
      );
    }
    
    // Return success response
    return NextResponse.json(
      {
        success: true,
        data: question,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('GET /api/v1/questions/:id error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'Failed to fetch question. Please try again.',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/v1/questions/:id
 * 
 * Update an existing question.
 * Only the question owner can update it.
 * 
 * Request body (all fields optional except what you want to update):
 * {
 *   "title": "Updated title",
 *   "description": "Updated description",
 *   "questionText": "Updated question text",
 *   "choices": [
 *     { "choiceText": "Choice 1", "isCorrect": false, "displayOrder": 1 },
 *     { "choiceText": "Choice 2", "isCorrect": true, "displayOrder": 2 }
 *   ]
 * }
 * 
 * @example
 * PUT /api/v1/questions/abc123
 */
export async function PUT(
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
    const validatedData = updateQuestionSchema.parse(body);
    
    // Update question in database
    const db = await getDatabase();
    const question = await updateQuestion(db, {
      id,
      userId: session.userId,
      ...validatedData,
    });
    
    // Check if question exists and user has access
    if (!question) {
      return NextResponse.json(
        {
          success: false,
          error: 'Not found',
          message: 'Question not found or you do not have permission to update it.',
        },
        { status: 404 }
      );
    }
    
    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: 'Question updated successfully',
        data: question,
      },
      { status: 200 }
    );
  } catch (error) {
    // Handle validation errors
    if (error instanceof ZodError) {
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
    
    // Handle other errors
    console.error('PUT /api/v1/questions/:id error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'Failed to update question. Please try again.',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v1/questions/:id
 * 
 * Delete a question and all its choices.
 * Only the question owner can delete it.
 * 
 * @example
 * DELETE /api/v1/questions/abc123
 */
export async function DELETE(
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
    
    // Delete question from database
    const db = await getDatabase();
    const deleted = await deleteQuestion(db, id, session.userId);
    
    // Check if question exists and user has access
    if (!deleted) {
      return NextResponse.json(
        {
          success: false,
          error: 'Not found',
          message: 'Question not found or you do not have permission to delete it.',
        },
        { status: 404 }
      );
    }
    
    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: 'Question deleted successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE /api/v1/questions/:id error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'Failed to delete question. Please try again.',
      },
      { status: 500 }
    );
  }
}

