/**
 * Data Type Converters for Questions and Choices
 * 
 * Handles conversion between SQLite database format and TypeScript application format.
 * Key conversions:
 * - snake_case (DB) ↔ camelCase (TypeScript)
 * - INTEGER 0/1 (DB) ↔ boolean (TypeScript)
 * - Ensures type safety across the application
 */

import type {
  Question,
  Choice,
  QuestionRow,
  ChoiceRow,
  QuestionType,
  Difficulty,
} from '../types/question';

/**
 * Convert a database question row to application Question type.
 * 
 * Conversions:
 * - snake_case → camelCase
 * - Validates question_type and difficulty enums
 * 
 * @param row - Raw row from database query
 * @returns Converted Question object
 */
export function questionRowToQuestion(row: QuestionRow): Question {
  return {
    id: row.id,
    userId: row.user_id,
    questionType: row.question_type as QuestionType,
    title: row.title,
    description: row.description,
    questionText: row.question_text,
    points: row.points,
    difficulty: row.difficulty as Difficulty,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Convert a database choice row to application Choice type.
 * 
 * Conversions:
 * - snake_case → camelCase
 * - INTEGER (0/1) → boolean
 * 
 * @param row - Raw row from database query
 * @returns Converted Choice object
 */
export function choiceRowToChoice(row: ChoiceRow): Choice {
  return {
    id: row.id,
    questionId: row.question_id,
    choiceText: row.choice_text,
    isCorrect: row.is_correct === 1, // Convert INTEGER to boolean
    displayOrder: row.display_order,
    createdAt: row.created_at,
  };
}

/**
 * Convert boolean to SQLite INTEGER (0/1).
 * 
 * @param value - Boolean value
 * @returns 1 for true, 0 for false
 */
export function booleanToInteger(value: boolean): number {
  return value ? 1 : 0;
}

/**
 * Convert SQLite INTEGER (0/1) to boolean.
 * 
 * @param value - Integer value (0 or 1)
 * @returns true if value is 1, false otherwise
 */
export function integerToBoolean(value: number): boolean {
  return value === 1;
}

/**
 * Convert array of question rows to array of Question objects.
 * 
 * @param rows - Array of database rows
 * @returns Array of converted Question objects
 */
export function questionRowsToQuestions(rows: QuestionRow[]): Question[] {
  return rows.map(questionRowToQuestion);
}

/**
 * Convert array of choice rows to array of Choice objects.
 * 
 * @param rows - Array of database rows
 * @returns Array of converted Choice objects
 */
export function choiceRowsToChoices(rows: ChoiceRow[]): Choice[] {
  return rows.map(choiceRowToChoice);
}

