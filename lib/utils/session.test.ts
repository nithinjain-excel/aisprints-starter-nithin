/**
 * Unit tests for session utilities (JWT)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createSession, verifySession, SESSION_MAX_AGE } from './session';

describe('Session Utilities', () => {
  beforeEach(() => {
    // Ensure SESSION_SECRET is set
    process.env.SESSION_SECRET = 'test-secret-for-jwt-testing';
  });

  describe('createSession', () => {
    it('should create a valid JWT token', async () => {
      const token = await createSession('user123', 'instructor');
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });

    it('should create tokens with correct payload structure', async () => {
      const userId = 'test-user-id';
      const role = 'student';
      
      const token = await createSession(userId, role);
      const payload = await verifySession(token);
      
      expect(payload).toBeDefined();
      expect(payload?.userId).toBe(userId);
      expect(payload?.role).toBe(role);
    });

    it('should create different tokens for different users', async () => {
      const token1 = await createSession('user1', 'instructor');
      const token2 = await createSession('user2', 'student');
      
      expect(token1).not.toBe(token2);
    });

    it('should create valid tokens consistently', async () => {
      // Create multiple tokens and verify they're all valid
      const token1 = await createSession('user123', 'instructor');
      const token2 = await createSession('user123', 'instructor');
      const token3 = await createSession('user456', 'student');
      
      // All tokens should be valid and decodable
      const payload1 = await verifySession(token1);
      const payload2 = await verifySession(token2);
      const payload3 = await verifySession(token3);
      
      expect(payload1?.userId).toBe('user123');
      expect(payload2?.userId).toBe('user123');
      expect(payload3?.userId).toBe('user456');
    });

    it('should work with both instructor and student roles', async () => {
      const instructorToken = await createSession('user1', 'instructor');
      const studentToken = await createSession('user2', 'student');
      
      const instructorPayload = await verifySession(instructorToken);
      const studentPayload = await verifySession(studentToken);
      
      expect(instructorPayload?.role).toBe('instructor');
      expect(studentPayload?.role).toBe('student');
    });
  });

  describe('verifySession', () => {
    it('should verify a valid token', async () => {
      const userId = 'user123';
      const role = 'instructor';
      const token = await createSession(userId, role);
      
      const payload = await verifySession(token);
      
      expect(payload).not.toBeNull();
      expect(payload?.userId).toBe(userId);
      expect(payload?.role).toBe(role);
    });

    it('should return null for invalid token', async () => {
      const invalidToken = 'invalid.jwt.token';
      
      const payload = await verifySession(invalidToken);
      
      expect(payload).toBeNull();
    });

    it('should return null for empty token', async () => {
      const payload = await verifySession('');
      
      expect(payload).toBeNull();
    });

    it('should return null for malformed token', async () => {
      const malformedToken = 'header.payload';
      
      const payload = await verifySession(malformedToken);
      
      expect(payload).toBeNull();
    });

    it('should return null for token with wrong signature', async () => {
      const token = await createSession('user123', 'instructor');
      
      // Tamper with the token by changing the last character
      const tamperedToken = token.slice(0, -1) + 'X';
      
      const payload = await verifySession(tamperedToken);
      
      expect(payload).toBeNull();
    });

    it('should extract correct userId and role', async () => {
      const userId = 'abc123def456';
      const role = 'student';
      
      const token = await createSession(userId, role);
      const payload = await verifySession(token);
      
      expect(payload?.userId).toBe(userId);
      expect(payload?.role).toBe(role);
    });

    it('should include standard JWT claims', async () => {
      const token = await createSession('user123', 'instructor');
      const payload = await verifySession(token);
      
      expect(payload?.iat).toBeDefined(); // Issued at
      expect(payload?.exp).toBeDefined(); // Expiration
      expect(typeof payload?.iat).toBe('number');
      expect(typeof payload?.exp).toBe('number');
    });

    it('should set expiration time correctly (7 days)', async () => {
      const token = await createSession('user123', 'instructor');
      const payload = await verifySession(token);
      
      if (payload?.iat && payload?.exp) {
        const expirationDuration = payload.exp - payload.iat;
        const sevenDaysInSeconds = 7 * 24 * 60 * 60;
        
        // Allow a small margin for processing time
        expect(expirationDuration).toBeGreaterThanOrEqual(sevenDaysInSeconds - 5);
        expect(expirationDuration).toBeLessThanOrEqual(sevenDaysInSeconds + 5);
      }
    });
  });

  describe('SESSION_MAX_AGE', () => {
    it('should be 7 days in seconds', () => {
      const expectedSeconds = 7 * 24 * 60 * 60; // 604800 seconds
      
      expect(SESSION_MAX_AGE).toBe(expectedSeconds);
    });
  });

  describe('Integration tests', () => {
    it('should complete full create and verify cycle', async () => {
      const userId = 'integration-test-user';
      const role = 'instructor';
      
      // Create token
      const token = await createSession(userId, role);
      expect(token).toBeDefined();
      
      // Verify token
      const payload = await verifySession(token);
      expect(payload).not.toBeNull();
      expect(payload?.userId).toBe(userId);
      expect(payload?.role).toBe(role);
    });

    it('should handle multiple tokens correctly', async () => {
      // Create multiple tokens
      const token1 = await createSession('user1', 'instructor');
      const token2 = await createSession('user2', 'student');
      const token3 = await createSession('user3', 'instructor');
      
      // Verify each token independently
      const payload1 = await verifySession(token1);
      const payload2 = await verifySession(token2);
      const payload3 = await verifySession(token3);
      
      expect(payload1?.userId).toBe('user1');
      expect(payload1?.role).toBe('instructor');
      
      expect(payload2?.userId).toBe('user2');
      expect(payload2?.role).toBe('student');
      
      expect(payload3?.userId).toBe('user3');
      expect(payload3?.role).toBe('instructor');
    });
  });

  describe('Error handling', () => {
    it('should throw error if SESSION_SECRET is not set', async () => {
      delete process.env.SESSION_SECRET;
      
      await expect(createSession('user123', 'instructor')).rejects.toThrow();
      
      // Restore for other tests
      process.env.SESSION_SECRET = 'test-secret-for-jwt-testing';
    });
  });
});

