/**
 * Unit tests for questions service
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createQuestion,
  getQuestionsByUserId,
  getQuestionById,
  updateQuestion,
  deleteQuestion,
  validateAnswer,
  getQuestionCount,
} from './questions-service';
import * as d1Client from '../d1-client';
import type { D1Database } from '../d1-client';
import type { CreateQuestionInput, UpdateQuestionInput } from '../types/question';

// Mock the d1-client module
vi.mock('../d1-client', () => ({
  getDatabase: vi.fn(() => ({} as unknown)),
  executeQuery: vi.fn(),
  executeQueryFirst: vi.fn(),
  executeMutation: vi.fn(),
  executeBatch: vi.fn(),
  generateId: vi.fn(() => 'generated-id-123'),
}));

// Mock converter module
vi.mock('../converters/question-converter', () => ({
  questionRowToQuestion: vi.fn((row) => ({
    id: row.id,
    userId: row.user_id,
    questionType: row.question_type,
    title: row.title,
    description: row.description,
    questionText: row.question_text,
    points: row.points,
    difficulty: row.difficulty,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  })),
  choiceRowToChoice: vi.fn((row) => ({
    id: row.id,
    questionId: row.question_id,
    choiceText: row.choice_text,
    isCorrect: row.is_correct === 1,
    displayOrder: row.display_order,
    createdAt: row.created_at,
  })),
  booleanToInteger: vi.fn((value) => (value ? 1 : 0)),
}));

describe('Questions Service', () => {
  const mockDb = {} as D1Database;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createQuestion', () => {
    it('should create a question with choices successfully', async () => {
      const input: CreateQuestionInput = {
        userId: 'user-123',
        questionType: 'mcq_single',
        title: 'Test Question',
        description: 'Test description',
        questionText: 'What is 2+2?',
        points: 1,
        difficulty: 'easy',
        choices: [
          { choiceText: '3', isCorrect: false, displayOrder: 1 },
          { choiceText: '4', isCorrect: true, displayOrder: 2 },
          { choiceText: '5', isCorrect: false, displayOrder: 3 },
        ],
      };

      vi.mocked(d1Client.executeBatch).mockResolvedValue([]);

      const result = await createQuestion(mockDb, input);

      expect(result).toBeDefined();
      expect(result.id).toBe('generated-id-123');
      expect(result.title).toBe('Test Question');
      expect(result.userId).toBe('user-123');
      expect(d1Client.executeBatch).toHaveBeenCalledTimes(1);
      
      // Verify batch includes question + 3 choices (4 queries total)
      const batchCalls = vi.mocked(d1Client.executeBatch).mock.calls[0][1];
      expect(batchCalls).toHaveLength(4); // 1 question + 3 choices
    });

    it('should use default values when optional fields are not provided', async () => {
      const input: CreateQuestionInput = {
        userId: 'user-123',
        questionType: 'mcq_single',
        title: 'Test Question',
        questionText: 'What is 2+2?',
        choices: [
          { choiceText: '3', isCorrect: false, displayOrder: 1 },
          { choiceText: '4', isCorrect: true, displayOrder: 2 },
        ],
      };

      vi.mocked(d1Client.executeBatch).mockResolvedValue([]);

      const result = await createQuestion(mockDb, input);

      expect(result.points).toBe(1);
      expect(result.difficulty).toBe('medium');
      expect(result.description).toBeNull();
    });
  });

  describe('getQuestionsByUserId', () => {
    it('should return paginated questions for a user', async () => {
      const mockQuestionRows = [
        {
          id: 'q1',
          user_id: 'user-123',
          question_type: 'mcq_single',
          title: 'Question 1',
          description: 'Description 1',
          question_text: 'Text 1',
          points: 1,
          difficulty: 'easy',
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        },
        {
          id: 'q2',
          user_id: 'user-123',
          question_type: 'mcq_single',
          title: 'Question 2',
          description: 'Description 2',
          question_text: 'Text 2',
          points: 1,
          difficulty: 'medium',
          created_at: '2026-01-02T00:00:00Z',
          updated_at: '2026-01-02T00:00:00Z',
        },
      ];

      vi.mocked(d1Client.executeQueryFirst).mockResolvedValue({ count: 15 });
      vi.mocked(d1Client.executeQuery).mockResolvedValue(mockQuestionRows);

      const result = await getQuestionsByUserId(mockDb, {
        userId: 'user-123',
        page: 1,
        limit: 10,
        sortBy: 'created_at',
        sortOrder: 'desc',
      });

      expect(result.questions).toHaveLength(2);
      expect(result.pagination.totalItems).toBe(15);
      expect(result.pagination.totalPages).toBe(2);
      expect(result.pagination.currentPage).toBe(1);
      expect(result.pagination.itemsPerPage).toBe(10);
    });

    it('should use default pagination values', async () => {
      vi.mocked(d1Client.executeQueryFirst).mockResolvedValue({ count: 5 });
      vi.mocked(d1Client.executeQuery).mockResolvedValue([]);

      const result = await getQuestionsByUserId(mockDb, {
        userId: 'user-123',
      });

      expect(result.pagination.currentPage).toBe(1);
      expect(result.pagination.itemsPerPage).toBe(10);
    });

    it('should return empty array when user has no questions', async () => {
      vi.mocked(d1Client.executeQueryFirst).mockResolvedValue({ count: 0 });
      vi.mocked(d1Client.executeQuery).mockResolvedValue([]);

      const result = await getQuestionsByUserId(mockDb, {
        userId: 'user-123',
      });

      expect(result.questions).toHaveLength(0);
      expect(result.pagination.totalItems).toBe(0);
      expect(result.pagination.totalPages).toBe(0);
    });
  });

  describe('getQuestionById', () => {
    it('should return question with choices', async () => {
      const mockQuestionRow = {
        id: 'q1',
        user_id: 'user-123',
        question_type: 'mcq_single',
        title: 'Question 1',
        description: 'Description 1',
        question_text: 'Text 1',
        points: 1,
        difficulty: 'easy',
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      };

      const mockChoiceRows = [
        {
          id: 'c1',
          question_id: 'q1',
          choice_text: 'Choice 1',
          is_correct: 0,
          display_order: 1,
          created_at: '2026-01-01T00:00:00Z',
        },
        {
          id: 'c2',
          question_id: 'q1',
          choice_text: 'Choice 2',
          is_correct: 1,
          display_order: 2,
          created_at: '2026-01-01T00:00:00Z',
        },
      ];

      vi.mocked(d1Client.executeQueryFirst).mockResolvedValue(mockQuestionRow);
      vi.mocked(d1Client.executeQuery).mockResolvedValue(mockChoiceRows);

      const result = await getQuestionById(mockDb, 'q1', 'user-123');

      expect(result).toBeDefined();
      expect(result!.id).toBe('q1');
      expect(result!.choices).toHaveLength(2);
      expect(result!.choices[0].isCorrect).toBe(false);
      expect(result!.choices[1].isCorrect).toBe(true);
    });

    it('should return null when question not found', async () => {
      vi.mocked(d1Client.executeQueryFirst).mockResolvedValue(null);

      const result = await getQuestionById(mockDb, 'nonexistent', 'user-123');

      expect(result).toBeNull();
    });

    it('should return null when user does not own the question', async () => {
      vi.mocked(d1Client.executeQueryFirst).mockResolvedValue(null);

      const result = await getQuestionById(mockDb, 'q1', 'wrong-user');

      expect(result).toBeNull();
    });
  });

  describe('updateQuestion', () => {
    it('should update question successfully', async () => {
      const mockExistingQuestion = {
        id: 'q1',
        user_id: 'user-123',
        question_type: 'mcq_single',
        title: 'Old Title',
        description: 'Old description',
        question_text: 'Old text',
        points: 1,
        difficulty: 'easy',
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      };

      const mockUpdatedQuestion = {
        ...mockExistingQuestion,
        title: 'New Title',
        question_text: 'New text',
        updated_at: '2026-01-07T00:00:00Z',
      };

      vi.mocked(d1Client.executeQueryFirst)
        .mockResolvedValueOnce(mockExistingQuestion)
        .mockResolvedValueOnce(mockUpdatedQuestion);
      vi.mocked(d1Client.executeBatch).mockResolvedValue([]);

      const input: UpdateQuestionInput = {
        id: 'q1',
        userId: 'user-123',
        title: 'New Title',
        questionText: 'New text',
      };

      const result = await updateQuestion(mockDb, input);

      expect(result).toBeDefined();
      expect(result!.title).toBe('New Title');
      expect(d1Client.executeBatch).toHaveBeenCalledTimes(1);
    });

    it('should update choices when provided', async () => {
      const mockExistingQuestion = {
        id: 'q1',
        user_id: 'user-123',
        question_type: 'mcq_single',
        title: 'Title',
        description: null,
        question_text: 'Text',
        points: 1,
        difficulty: 'easy',
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      };

      vi.mocked(d1Client.executeQueryFirst)
        .mockResolvedValueOnce(mockExistingQuestion)
        .mockResolvedValueOnce(mockExistingQuestion);
      vi.mocked(d1Client.executeBatch).mockResolvedValue([]);

      const input: UpdateQuestionInput = {
        id: 'q1',
        userId: 'user-123',
        choices: [
          { choiceText: 'New Choice 1', isCorrect: false, displayOrder: 1 },
          { choiceText: 'New Choice 2', isCorrect: true, displayOrder: 2 },
        ],
      };

      await updateQuestion(mockDb, input);

      const batchCalls = vi.mocked(d1Client.executeBatch).mock.calls[0][1];
      // Should have: 1 update question + 1 delete old choices + 2 insert new choices = 4 queries
      expect(batchCalls).toHaveLength(4);
    });

    it('should return null when question not found', async () => {
      vi.mocked(d1Client.executeQueryFirst).mockResolvedValue(null);

      const input: UpdateQuestionInput = {
        id: 'nonexistent',
        userId: 'user-123',
        title: 'New Title',
      };

      const result = await updateQuestion(mockDb, input);

      expect(result).toBeNull();
      expect(d1Client.executeBatch).not.toHaveBeenCalled();
    });

    it('should return null when user does not own the question', async () => {
      vi.mocked(d1Client.executeQueryFirst).mockResolvedValue(null);

      const input: UpdateQuestionInput = {
        id: 'q1',
        userId: 'wrong-user',
        title: 'New Title',
      };

      const result = await updateQuestion(mockDb, input);

      expect(result).toBeNull();
    });
  });

  describe('deleteQuestion', () => {
    it('should delete question successfully', async () => {
      const mockQuestion = { id: 'q1' };
      vi.mocked(d1Client.executeQueryFirst).mockResolvedValue(mockQuestion);
      vi.mocked(d1Client.executeMutation).mockResolvedValue(null);

      const result = await deleteQuestion(mockDb, 'q1', 'user-123');

      expect(result).toBe(true);
      expect(d1Client.executeMutation).toHaveBeenCalledTimes(1);
    });

    it('should return false when question not found', async () => {
      vi.mocked(d1Client.executeQueryFirst).mockResolvedValue(null);

      const result = await deleteQuestion(mockDb, 'nonexistent', 'user-123');

      expect(result).toBe(false);
      expect(d1Client.executeMutation).not.toHaveBeenCalled();
    });

    it('should return false when user does not own the question', async () => {
      vi.mocked(d1Client.executeQueryFirst).mockResolvedValue(null);

      const result = await deleteQuestion(mockDb, 'q1', 'wrong-user');

      expect(result).toBe(false);
    });
  });

  describe('validateAnswer', () => {
    it('should return correct validation result for correct answer', async () => {
      const mockSelectedChoice = {
        id: 'c2',
        question_id: 'q1',
        choice_text: 'Correct Answer',
        is_correct: 1,
        display_order: 2,
        created_at: '2026-01-01T00:00:00Z',
      };

      const mockCorrectChoice = {
        id: 'c2',
        question_id: 'q1',
        choice_text: 'Correct Answer',
        is_correct: 1,
        display_order: 2,
        created_at: '2026-01-01T00:00:00Z',
      };

      vi.mocked(d1Client.executeQueryFirst)
        .mockResolvedValueOnce(mockSelectedChoice)
        .mockResolvedValueOnce(mockCorrectChoice);

      const result = await validateAnswer(mockDb, 'q1', 'c2');

      expect(result.isCorrect).toBe(true);
      expect(result.correctChoiceId).toBe('c2');
      expect(result.selectedChoiceId).toBe('c2');
    });

    it('should return correct validation result for incorrect answer', async () => {
      const mockSelectedChoice = {
        id: 'c1',
        question_id: 'q1',
        choice_text: 'Wrong Answer',
        is_correct: 0,
        display_order: 1,
        created_at: '2026-01-01T00:00:00Z',
      };

      const mockCorrectChoice = {
        id: 'c2',
        question_id: 'q1',
        choice_text: 'Correct Answer',
        is_correct: 1,
        display_order: 2,
        created_at: '2026-01-01T00:00:00Z',
      };

      vi.mocked(d1Client.executeQueryFirst)
        .mockResolvedValueOnce(mockSelectedChoice)
        .mockResolvedValueOnce(mockCorrectChoice);

      const result = await validateAnswer(mockDb, 'q1', 'c1');

      expect(result.isCorrect).toBe(false);
      expect(result.correctChoiceId).toBe('c2');
      expect(result.selectedChoiceId).toBe('c1');
    });

    it('should throw error when selected choice not found', async () => {
      vi.mocked(d1Client.executeQueryFirst).mockResolvedValue(null);

      await expect(validateAnswer(mockDb, 'q1', 'nonexistent')).rejects.toThrow(
        'Selected choice not found'
      );
    });

    it('should throw error when correct choice not found', async () => {
      const mockSelectedChoice = {
        id: 'c1',
        question_id: 'q1',
        choice_text: 'Choice',
        is_correct: 0,
        display_order: 1,
        created_at: '2026-01-01T00:00:00Z',
      };

      vi.mocked(d1Client.executeQueryFirst)
        .mockResolvedValueOnce(mockSelectedChoice)
        .mockResolvedValueOnce(null);

      await expect(validateAnswer(mockDb, 'q1', 'c1')).rejects.toThrow(
        'Correct choice not found'
      );
    });
  });

  describe('getQuestionCount', () => {
    it('should return question count for user', async () => {
      vi.mocked(d1Client.executeQueryFirst).mockResolvedValue({ count: 42 });

      const result = await getQuestionCount(mockDb, 'user-123');

      expect(result).toBe(42);
    });

    it('should return 0 when user has no questions', async () => {
      vi.mocked(d1Client.executeQueryFirst).mockResolvedValue({ count: 0 });

      const result = await getQuestionCount(mockDb, 'user-123');

      expect(result).toBe(0);
    });

    it('should return 0 when count query returns null', async () => {
      vi.mocked(d1Client.executeQueryFirst).mockResolvedValue(null);

      const result = await getQuestionCount(mockDb, 'user-123');

      expect(result).toBe(0);
    });
  });
});

