/**
 * Vitest Setup File
 * 
 * This file runs before all tests and sets up the test environment.
 */

import { beforeAll } from 'vitest';

beforeAll(() => {
  // Set up environment variables for testing
  process.env.SESSION_SECRET = 'test-secret-key-for-testing-only-not-for-production';
  process.env.NEXTJS_ENV = 'test';
});

