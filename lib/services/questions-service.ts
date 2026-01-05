/**
 * Questions Service
 * 
 * Provides CRUD operations for quiz questions and their choices.
 * Handles data conversion between database and application formats.
 * Implements business logic for question management.
 */

import type { D1Database } from '../d1-client';
import {
  executeQuery,
  executeQueryFirst,
  executeMutation,
  executeBatch,
  generateId,
} from '../d1-client';
import {
  questionRowToQuestion,
  choiceRowToChoice,
  booleanToInteger,
} from '../converters/question-converter';
import type {
  Question,
  QuestionWithChoices,
  QuestionRow,
  ChoiceRow,
  CreateQuestionInput,
  UpdateQuestionInput,
  PaginatedQuestions,
  QuestionQueryParams,
} from '../types/question';

/**
 * Create a new question with its choices.
 * 
 * This operation is atomic - either the question and all choices are created,
 * or none are created (using batch transaction).
 * 
 * @param db - D1 database instance
 * @param input - Question data with choices
 * @returns The created question with its ID
 * 
 * @throws Error if validation fails or database operation fails
 * 
 * @example
 * const question = await createQuestion(db, {
 *   userId: 'user-123',
 *   questionType: 'mcq_single',
 *   title: 'Variables',
 *   questionText: 'What is a variable?',
 *   choices: [
 *     { choiceText: 'A container', isCorrect: true, displayOrder: 1 },
 *     { choiceText: 'A function', isCorrect: false, displayOrder: 2 }
 *   ]
 * });
 */
export async function createQuestion(
  db: D1Database,
  input: CreateQuestionInput
): Promise<Question> {
  const questionId = generateId();
  const now = new Date().toISOString();

  // Prepare all queries for batch execution
  const queries = [];

  // Insert question
  queries.push({
    sql: `
      INSERT INTO questions (
        id, user_id, question_type, title, description, question_text,
        points, difficulty, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    params: [
      questionId,
      input.userId,
      input.questionType,
      input.title,
      input.description || null,
      input.questionText,
      input.points || 1,
      input.difficulty || 'medium',
      now,
      now,
    ],
  });

  // Insert choices
  for (const choice of input.choices) {
    const choiceId = generateId();
    queries.push({
      sql: `
        INSERT INTO choices (
          id, question_id, choice_text, is_correct, display_order, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?)
      `,
      params: [
        choiceId,
        questionId,
        choice.choiceText,
        booleanToInteger(choice.isCorrect),
        choice.displayOrder,
        now,
      ],
    });
  }

  // Execute all queries in a batch transaction
  await executeBatch(db, queries);

  // Return the created question
  return {
    id: questionId,
    userId: input.userId,
    questionType: input.questionType,
    title: input.title,
    description: input.description || null,
    questionText: input.questionText,
    points: input.points || 1,
    difficulty: input.difficulty || 'medium',
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Get paginated list of questions for a user.
 * 
 * @param db - D1 database instance
 * @param params - Query parameters (userId, page, limit, sort)
 * @returns Paginated questions with metadata
 * 
 * @example
 * const result = await getQuestionsByUserId(db, {
 *   userId: 'user-123',
 *   page: 1,
 *   limit: 10,
 *   sortBy: 'created_at',
 *   sortOrder: 'desc'
 * });
 */
export async function getQuestionsByUserId(
  db: D1Database,
  params: QuestionQueryParams
): Promise<PaginatedQuestions> {
  const page = params.page || 1;
  const limit = params.limit || 10;
  const sortBy = params.sortBy || 'created_at';
  const sortOrder = params.sortOrder || 'desc';
  const offset = (page - 1) * limit;

  // Get total count
  const countResult = await executeQueryFirst<{ count: number }>(
    db,
    'SELECT COUNT(*) as count FROM questions WHERE user_id = ?',
    [params.userId]
  );
  const totalItems = countResult?.count || 0;
  const totalPages = Math.ceil(totalItems / limit);

  // Get paginated questions
  const rows = await executeQuery<QuestionRow>(
    db,
    `
      SELECT * FROM questions
      WHERE user_id = ?
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT ? OFFSET ?
    `,
    [params.userId, limit, offset]
  );

  const questions = rows.map(questionRowToQuestion);

  return {
    questions,
    pagination: {
      currentPage: page,
      totalPages,
      totalItems,
      itemsPerPage: limit,
    },
  };
}

/**
 * Get a single question by ID with all its choices.
 * 
 * @param db - D1 database instance
 * @param questionId - Question ID
 * @param userId - User ID (for authorization check)
 * @returns Question with choices or null if not found/unauthorized
 * 
 * @example
 * const question = await getQuestionById(db, 'question-123', 'user-123');
 */
export async function getQuestionById(
  db: D1Database,
  questionId: string,
  userId: string
): Promise<QuestionWithChoices | null> {
  // Get question (with ownership check)
  const questionRow = await executeQueryFirst<QuestionRow>(
    db,
    'SELECT * FROM questions WHERE id = ? AND user_id = ?',
    [questionId, userId]
  );

  if (!questionRow) {
    return null;
  }

  // Get choices
  const choiceRows = await executeQuery<ChoiceRow>(
    db,
    'SELECT * FROM choices WHERE question_id = ? ORDER BY display_order',
    [questionId]
  );

  const question = questionRowToQuestion(questionRow);
  const choices = choiceRows.map(choiceRowToChoice);

  return {
    ...question,
    choices,
  };
}

/**
 * Update an existing question and its choices.
 * 
 * This operation:
 * 1. Updates the question fields
 * 2. Deletes all existing choices
 * 3. Creates new choices from the input
 * 
 * @param db - D1 database instance
 * @param input - Update data (must include id and userId)
 * @returns Updated question or null if not found/unauthorized
 * 
 * @throws Error if database operation fails
 * 
 * @example
 * const updated = await updateQuestion(db, {
 *   id: 'question-123',
 *   userId: 'user-123',
 *   title: 'Updated Title',
 *   choices: [...]
 * });
 */
export async function updateQuestion(
  db: D1Database,
  input: UpdateQuestionInput
): Promise<Question | null> {
  const now = new Date().toISOString();

  // Check if question exists and user owns it
  const existing = await executeQueryFirst<QuestionRow>(
    db,
    'SELECT * FROM questions WHERE id = ? AND user_id = ?',
    [input.id, input.userId]
  );

  if (!existing) {
    return null;
  }

  const queries = [];

  // Build update query for question
  const updateFields: string[] = ['updated_at = ?'];
  const updateParams: unknown[] = [now];

  if (input.title !== undefined) {
    updateFields.push('title = ?');
    updateParams.push(input.title);
  }
  if (input.description !== undefined) {
    updateFields.push('description = ?');
    updateParams.push(input.description);
  }
  if (input.questionText !== undefined) {
    updateFields.push('question_text = ?');
    updateParams.push(input.questionText);
  }
  if (input.questionType !== undefined) {
    updateFields.push('question_type = ?');
    updateParams.push(input.questionType);
  }
  if (input.points !== undefined) {
    updateFields.push('points = ?');
    updateParams.push(input.points);
  }
  if (input.difficulty !== undefined) {
    updateFields.push('difficulty = ?');
    updateParams.push(input.difficulty);
  }

  // Add question ID to params
  updateParams.push(input.id);

  queries.push({
    sql: `UPDATE questions SET ${updateFields.join(', ')} WHERE id = ?`,
    params: updateParams,
  });

  // If choices are provided, replace all choices
  if (input.choices) {
    // Delete existing choices
    queries.push({
      sql: 'DELETE FROM choices WHERE question_id = ?',
      params: [input.id],
    });

    // Insert new choices
    for (const choice of input.choices) {
      const choiceId = choice.id || generateId();
      queries.push({
        sql: `
          INSERT INTO choices (
            id, question_id, choice_text, is_correct, display_order, created_at
          )
          VALUES (?, ?, ?, ?, ?, ?)
        `,
        params: [
          choiceId,
          input.id,
          choice.choiceText,
          booleanToInteger(choice.isCorrect),
          choice.displayOrder,
          now,
        ],
      });
    }
  }

  // Execute all updates in a batch
  await executeBatch(db, queries);

  // Fetch and return updated question
  const updatedRow = await executeQueryFirst<QuestionRow>(
    db,
    'SELECT * FROM questions WHERE id = ?',
    [input.id]
  );

  return updatedRow ? questionRowToQuestion(updatedRow) : null;
}

/**
 * Delete a question and all its choices.
 * 
 * Choices are automatically deleted due to CASCADE delete constraint.
 * 
 * @param db - D1 database instance
 * @param questionId - Question ID
 * @param userId - User ID (for authorization check)
 * @returns true if deleted, false if not found/unauthorized
 * 
 * @example
 * const deleted = await deleteQuestion(db, 'question-123', 'user-123');
 */
export async function deleteQuestion(
  db: D1Database,
  questionId: string,
  userId: string
): Promise<boolean> {
  // Check ownership before deleting
  const existing = await executeQueryFirst<QuestionRow>(
    db,
    'SELECT id FROM questions WHERE id = ? AND user_id = ?',
    [questionId, userId]
  );

  if (!existing) {
    return false;
  }

  // Delete question (choices are cascade deleted automatically)
  await executeMutation(
    db,
    'DELETE FROM questions WHERE id = ?',
    [questionId]
  );

  return true;
}

/**
 * Validate a user's answer for a question.
 * 
 * Used in preview/testing functionality.
 * 
 * @param db - D1 database instance
 * @param questionId - Question ID
 * @param selectedChoiceId - ID of the choice selected by user
 * @returns Object with validation result
 * 
 * @example
 * const result = await validateAnswer(db, 'question-123', 'choice-456');
 * // { isCorrect: true, correctChoiceId: 'choice-456' }
 */
export async function validateAnswer(
  db: D1Database,
  questionId: string,
  selectedChoiceId: string
): Promise<{
  isCorrect: boolean;
  correctChoiceId: string;
  selectedChoiceId: string;
}> {
  // Get the selected choice
  const selectedChoice = await executeQueryFirst<ChoiceRow>(
    db,
    'SELECT * FROM choices WHERE id = ? AND question_id = ?',
    [selectedChoiceId, questionId]
  );

  if (!selectedChoice) {
    throw new Error('Selected choice not found');
  }

  // Get the correct choice
  const correctChoice = await executeQueryFirst<ChoiceRow>(
    db,
    'SELECT * FROM choices WHERE question_id = ? AND is_correct = 1',
    [questionId]
  );

  if (!correctChoice) {
    throw new Error('Correct choice not found');
  }

  return {
    isCorrect: selectedChoice.is_correct === 1,
    correctChoiceId: correctChoice.id,
    selectedChoiceId,
  };
}

/**
 * Get total question count for a user.
 * 
 * @param db - D1 database instance
 * @param userId - User ID
 * @returns Total number of questions
 */
export async function getQuestionCount(
  db: D1Database,
  userId: string
): Promise<number> {
  const result = await executeQueryFirst<{ count: number }>(
    db,
    'SELECT COUNT(*) as count FROM questions WHERE user_id = ?',
    [userId]
  );

  return result?.count || 0;
}

