-- Migration: Create users table for authentication
-- Created: 2025-12-18
-- Description: Initial database schema for QuizMaker authentication system

-- Users table to store authentication and profile information
CREATE TABLE users (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT,
  role TEXT NOT NULL CHECK(role IN ('instructor', 'student')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster email lookups during login
-- This will significantly speed up authentication queries
CREATE INDEX idx_users_email ON users(email);

-- Index for role-based queries
-- This will help when filtering users by role (e.g., list all instructors)
CREATE INDEX idx_users_role ON users(role);

