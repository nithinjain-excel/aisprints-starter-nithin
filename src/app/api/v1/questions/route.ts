/**
 * API Route: /api/v1/questions
 * 
 * Handles question list and creation operations.
 * - GET: List questions with pagination and sorting
 * - POST: Create a new question with choices
 */

import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { getDatabase } from '@/lib/d1-client';
import {
  createQuestion,
  getQuestionsByUserId,
} from '@/lib/services/questions-service';
import {
  createQuestionSchema,
  questionQuerySchema,
} from '@/lib/validations/question-schema';
import { getSessionFromRequest, AUTH_ERRORS } from '@/lib/utils/auth-helpers';

/**
 * GET /api/v1/questions
 * 
 * Get paginated list of questions for the authenticated user.
 * 
 * Query parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 10, max: 100)
 * - sortBy: Field to sort by (default: created_at)
 * - sortOrder: Sort order asc/desc (default: desc)
 * 
 * @example
 * GET /api/v1/questions?page=1&limit=10&sortBy=created_at&sortOrder=desc
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const session = await getSessionFromRequest(request);
    
    if (!session) {
      return NextResponse.json(AUTH_ERRORS.UNAUTHORIZED, { status: 401 });
    }
    
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sortBy = (searchParams.get('sortBy') || 'created_at') as 'title' | 'created_at' | 'updated_at';
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';
    
    // Validate query parameters
    const validatedParams = questionQuerySchema.parse({
      page,
      limit,
      sortBy,
      sortOrder,
    });
    
    // Get questions from database
    const db = await getDatabase();
    const result = await getQuestionsByUserId(db, {
      userId: session.userId,
      ...validatedParams,
    });
    
    // Return success response
    return NextResponse.json(
      {
        success: true,
        questions: result.questions,
        pagination: result.pagination,
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
    console.error('GET /api/v1/questions error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'Failed to fetch questions. Please try again.',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/questions
 * 
 * Create a new question with choices.
 * 
 * Request body:
 * {
 *   "title": "Question title",
 *   "description": "Optional description",
 *   "questionText": "The actual question text",
 *   "questionType": "mcq_single",
 *   "points": 1,
 *   "difficulty": "medium",
 *   "choices": [
 *     { "choiceText": "Choice 1", "isCorrect": false, "displayOrder": 1 },
 *     { "choiceText": "Choice 2", "isCorrect": true, "displayOrder": 2 }
 *   ]
 * }
 * 
 * @example
 * POST /api/v1/questions
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const session = await getSessionFromRequest(request);
    
    if (!session) {
      return NextResponse.json(AUTH_ERRORS.UNAUTHORIZED, { status: 401 });
    }
    
    // Parse request body
    const body = await request.json();
    
    // Validate request data
    const validatedData = createQuestionSchema.parse(body);
    
    // Create question in database
    const db = await getDatabase();
    const question = await createQuestion(db, {
      userId: session.userId,
      ...validatedData,
    });
    
    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: 'Question created successfully',
        data: question,
      },
      { status: 201 } // 201 Created
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
    console.error('POST /api/v1/questions error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'Failed to create question. Please try again.',
      },
      { status: 500 }
    );
  }
}

