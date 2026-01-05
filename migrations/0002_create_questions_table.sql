-- Migration: Create questions table
-- Description: Stores quiz questions with support for multiple question types
-- Created: 2026-01-07
-- Phase: 1 - Database Foundation

-- Questions table: stores all question types (MCQ single, MCQ multiple, True/False, Fill in blanks)
CREATE TABLE IF NOT EXISTS questions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'mcq_single',
  title TEXT NOT NULL,
  description TEXT,
  question_text TEXT NOT NULL,
  points INTEGER DEFAULT 1,
  difficulty TEXT CHECK(difficulty IN ('easy', 'medium', 'hard')) DEFAULT 'medium',
  created_at TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
  updated_at TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_questions_user_id ON questions(user_id);
CREATE INDEX IF NOT EXISTS idx_questions_type ON questions(question_type);
CREATE INDEX IF NOT EXISTS idx_questions_created_at ON questions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_questions_user_created ON questions(user_id, created_at DESC);

-- Comments explaining design decisions:
-- 1. id: TEXT with randomblob for globally unique identifiers
-- 2. question_type: TEXT to support extensibility (mcq_single, mcq_multiple, true_false, fill_blank)
-- 3. difficulty: CHECK constraint ensures only valid values
-- 4. created_at/updated_at: TEXT format for SQLite datetime (ISO8601)
-- 5. Foreign key with CASCADE delete ensures data integrity
-- 6. Composite index on (user_id, created_at) optimizes paginated queries

