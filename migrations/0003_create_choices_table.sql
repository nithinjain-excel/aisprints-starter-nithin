-- Migration: Create choices table
-- Description: Stores answer choices for MCQ questions
-- Created: 2026-01-07
-- Phase: 1 - Database Foundation

-- Choices table: stores answer choices for MCQ questions
CREATE TABLE IF NOT EXISTS choices (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  question_id TEXT NOT NULL,
  choice_text TEXT NOT NULL,
  is_correct INTEGER NOT NULL DEFAULT 0,
  display_order INTEGER NOT NULL,
  created_at TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

-- Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_choices_question_id ON choices(question_id);
CREATE INDEX IF NOT EXISTS idx_choices_display_order ON choices(question_id, display_order);

-- Comments explaining design decisions:
-- 1. is_correct: INTEGER (0/1) represents boolean in SQLite
--    - 0 = false (incorrect answer)
--    - 1 = true (correct answer)
--    - Application layer converts to/from TypeScript boolean
-- 2. display_order: INTEGER to maintain choice order (1, 2, 3, ...)
-- 3. Foreign key with CASCADE delete: deleting a question automatically deletes all its choices
-- 4. Composite index on (question_id, display_order) optimizes choice retrieval in correct order

