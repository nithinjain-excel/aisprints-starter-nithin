/**
 * Question and Choice Type Definitions
 * 
 * These types represent the domain models for quiz questions and their choices.
 * Includes both application types (after conversion) and database row types (before conversion).
 */

/**
 * Question types supported by the system.
 * Extensible design allows for future question types without schema changes.
 */
export type QuestionType = 'mcq_single' | 'mcq_multiple' | 'true_false' | 'fill_blank';

/**
 * Difficulty levels for questions.
 * Used for future adaptive quiz features.
 */
export type Difficulty = 'easy' | 'medium' | 'hard';

/**
 * Question entity - Application domain model
 * 
 * This is the TypeScript representation after data conversion from database.
 * All field names use camelCase and proper TypeScript types.
 */
export interface Question {
  id: string;
  userId: string;
  questionType: QuestionType;
  title: string;
  description: string | null;
  questionText: string;
  points: number;
  difficulty: Difficulty;
  createdAt: string; // ISO8601 datetime string
  updatedAt: string; // ISO8601 datetime string
}

/**
 * Choice entity - Application domain model
 * 
 * Represents a single answer choice for MCQ questions.
 * isCorrect is converted from INTEGER (0/1) to boolean.
 */
export interface Choice {
  id: string;
  questionId: string;
  choiceText: string;
  isCorrect: boolean; // Converted from INTEGER (0/1)
  displayOrder: number;
  createdAt: string; // ISO8601 datetime string
}

/**
 * Question with its choices combined.
 * Used when fetching a complete question for display or editing.
 */
export interface QuestionWithChoices extends Question {
  choices: Choice[];
}

/**
 * Database row type for questions table.
 * 
 * This matches the exact structure returned from SQLite queries.
 * Field names use snake_case as they appear in the database.
 */
export interface QuestionRow {
  id: string;
  user_id: string;
  question_type: string;
  title: string;
  description: string | null;
  question_text: string;
  points: number;
  difficulty: string;
  created_at: string;
  updated_at: string;
}

/**
 * Database row type for choices table.
 * 
 * This matches the exact structure returned from SQLite queries.
 * is_correct is an INTEGER (0 or 1) that needs conversion to boolean.
 */
export interface ChoiceRow {
  id: string;
  question_id: string;
  choice_text: string;
  is_correct: number; // 0 or 1
  display_order: number;
  created_at: string;
}

/**
 * Input data for creating a new question.
 * Omits auto-generated fields (id, createdAt, updatedAt).
 */
export interface CreateQuestionInput {
  userId: string;
  questionType: QuestionType;
  title: string;
  description?: string | null;
  questionText: string;
  points?: number;
  difficulty?: Difficulty;
  choices: CreateChoiceInput[];
}

/**
 * Input data for creating a new choice.
 * Omits auto-generated fields (id, createdAt).
 */
export interface CreateChoiceInput {
  choiceText: string;
  isCorrect: boolean;
  displayOrder: number;
}

/**
 * Input data for updating an existing question.
 * All fields are optional except id.
 */
export interface UpdateQuestionInput {
  id: string;
  userId: string; // For authorization check
  questionType?: QuestionType;
  title?: string;
  description?: string | null;
  questionText?: string;
  points?: number;
  difficulty?: Difficulty;
  choices?: UpdateChoiceInput[];
}

/**
 * Input data for updating a choice.
 * Can include id for existing choices or omit id for new choices.
 */
export interface UpdateChoiceInput {
  id?: string; // If present, update existing; if absent, create new
  choiceText: string;
  isCorrect: boolean;
  displayOrder: number;
}

/**
 * Pagination parameters for question queries.
 */
export interface QuestionQueryParams {
  userId: string;
  page?: number;
  limit?: number;
  sortBy?: 'title' | 'created_at' | 'updated_at';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Paginated question results.
 */
export interface PaginatedQuestions {
  questions: Question[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

