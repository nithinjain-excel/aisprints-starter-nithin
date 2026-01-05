/**
 * Validation Schemas for Questions and Choices
 * 
 * Uses Zod for runtime validation of question data.
 * These schemas ensure data integrity before database operations.
 */

import { z } from 'zod';

/**
 * Question type enum schema.
 * Extensible for future question types.
 */
export const questionTypeSchema = z.enum([
  'mcq_single',
  'mcq_multiple',
  'true_false',
  'fill_blank',
]);

/**
 * Difficulty level enum schema.
 */
export const difficultySchema = z.enum(['easy', 'medium', 'hard']);

/**
 * Choice schema for creating/updating choices.
 * 
 * Validation rules:
 * - choiceText: 1-500 characters
 * - isCorrect: boolean
 * - displayOrder: positive integer
 */
export const choiceSchema = z.object({
  choiceText: z
    .string()
    .min(1, 'Choice text is required')
    .max(500, 'Choice text must be 500 characters or less')
    .trim(),
  isCorrect: z.boolean(),
  displayOrder: z.number().int().positive('Display order must be a positive integer'),
});

/**
 * Update choice schema (includes optional id).
 * Used when editing existing questions.
 */
export const updateChoiceSchema = choiceSchema.extend({
  id: z.string().optional(),
});

/**
 * Question creation schema.
 * 
 * Validation rules:
 * - title: 1-200 characters (required)
 * - description: 0-500 characters (optional)
 * - questionText: 1-1000 characters (required)
 * - questionType: valid question type (default: mcq_single)
 * - points: positive integer (default: 1)
 * - difficulty: valid difficulty (default: medium)
 * - choices: 2-6 choices for MCQ questions
 * - Exactly one correct answer for mcq_single
 */
export const createQuestionSchema = z
  .object({
    title: z
      .string()
      .min(1, 'Title is required')
      .max(200, 'Title must be 200 characters or less')
      .trim(),
    description: z
      .string()
      .max(500, 'Description must be 500 characters or less')
      .trim()
      .optional()
      .nullable(),
    questionText: z
      .string()
      .min(1, 'Question text is required')
      .max(1000, 'Question text must be 1000 characters or less')
      .trim(),
    questionType: questionTypeSchema.default('mcq_single'),
    points: z.number().int().positive('Points must be a positive integer').default(1),
    difficulty: difficultySchema.default('medium'),
    choices: z
      .array(choiceSchema)
      .min(2, 'At least 2 choices are required')
      .max(6, 'Maximum 6 choices are allowed'),
  })
  .refine(
    (data) => {
      // For MCQ single answer, exactly one choice must be correct
      if (data.questionType === 'mcq_single') {
        const correctChoices = data.choices.filter((c) => c.isCorrect);
        return correctChoices.length === 1;
      }
      return true;
    },
    {
      message: 'Exactly one choice must be marked as correct for single-answer MCQ',
      path: ['choices'],
    }
  )
  .refine(
    (data) => {
      // For MCQ multiple answers, at least one choice must be correct
      if (data.questionType === 'mcq_multiple') {
        const correctChoices = data.choices.filter((c) => c.isCorrect);
        return correctChoices.length >= 1;
      }
      return true;
    },
    {
      message: 'At least one choice must be marked as correct for multiple-answer MCQ',
      path: ['choices'],
    }
  )
  .refine(
    (data) => {
      // Ensure display order values are unique
      const orders = data.choices.map((c) => c.displayOrder);
      const uniqueOrders = new Set(orders);
      return orders.length === uniqueOrders.size;
    },
    {
      message: 'Display order values must be unique',
      path: ['choices'],
    }
  );

/**
 * Question update schema.
 * All fields are optional except those needed for identification.
 */
export const updateQuestionSchema = z
  .object({
    title: z
      .string()
      .min(1, 'Title is required')
      .max(200, 'Title must be 200 characters or less')
      .trim()
      .optional(),
    description: z
      .string()
      .max(500, 'Description must be 500 characters or less')
      .trim()
      .optional()
      .nullable(),
    questionText: z
      .string()
      .min(1, 'Question text is required')
      .max(1000, 'Question text must be 1000 characters or less')
      .trim()
      .optional(),
    questionType: questionTypeSchema.optional(),
    points: z.number().int().positive('Points must be a positive integer').optional(),
    difficulty: difficultySchema.optional(),
    choices: z
      .array(updateChoiceSchema)
      .min(2, 'At least 2 choices are required')
      .max(6, 'Maximum 6 choices are allowed')
      .optional(),
  })
  .refine(
    (data) => {
      // If choices are provided, validate correct answer count
      if (data.choices && data.questionType === 'mcq_single') {
        const correctChoices = data.choices.filter((c) => c.isCorrect);
        return correctChoices.length === 1;
      }
      return true;
    },
    {
      message: 'Exactly one choice must be marked as correct for single-answer MCQ',
      path: ['choices'],
    }
  )
  .refine(
    (data) => {
      // If choices are provided, ensure display orders are unique
      if (data.choices) {
        const orders = data.choices.map((c) => c.displayOrder);
        const uniqueOrders = new Set(orders);
        return orders.length === uniqueOrders.size;
      }
      return true;
    },
    {
      message: 'Display order values must be unique',
      path: ['choices'],
    }
  );

/**
 * Query parameters schema for listing questions.
 */
export const questionQuerySchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(10),
  sortBy: z.enum(['title', 'created_at', 'updated_at']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * Type inference from schemas.
 * These can be used instead of manually defining types.
 */
export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;
export type UpdateQuestionInput = z.infer<typeof updateQuestionSchema>;
export type QuestionQueryParams = z.infer<typeof questionQuerySchema>;

