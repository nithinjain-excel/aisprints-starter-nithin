/**
 * Integration tests for GET /api/auth/session endpoint
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET } from './route';
import * as cookieUtils from '@/lib/utils/cookies';
import * as sessionUtils from '@/lib/utils/session';
import * as authService from '@/lib/services/auth-service';

// Mock dependencies
vi.mock('@/lib/utils/cookies');
vi.mock('@/lib/utils/session');
vi.mock('@/lib/services/auth-service');

describe('GET /api/auth/session', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Valid Session', () => {
    it('should return authenticated user data for valid session', async () => {
      const mockToken = 'valid-jwt-token';
      const mockSessionPayload = {
        userId: 'user123',
        role: 'instructor' as const,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
      };
      const mockUser = {
        id: 'user123',
        email: 'teacher@example.com',
        firstName: 'Jane',
        lastName: 'Doe',
        role: 'instructor' as const,
        createdAt: '2025-12-18T00:00:00Z',
      };

      vi.mocked(cookieUtils.getSessionToken).mockResolvedValue(mockToken);
      vi.mocked(sessionUtils.verifySession).mockResolvedValue(mockSessionPayload);
      vi.mocked(authService.getUserById).mockResolvedValue(mockUser);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.authenticated).toBe(true);
      expect(data.user).toEqual({
        id: 'user123',
        email: 'teacher@example.com',
        firstName: 'Jane',
        lastName: 'Doe',
        role: 'instructor',
      });

      // Verify all steps were called correctly
      expect(cookieUtils.getSessionToken).toHaveBeenCalledTimes(1);
      expect(sessionUtils.verifySession).toHaveBeenCalledWith(mockToken);
      expect(authService.getUserById).toHaveBeenCalledWith('user123');
    });

    it('should return student user data', async () => {
      const mockToken = 'valid-jwt-token';
      const mockSessionPayload = {
        userId: 'user456',
        role: 'student' as const,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
      };
      const mockUser = {
        id: 'user456',
        email: 'student@example.com',
        firstName: 'John',
        lastName: null,
        role: 'student' as const,
        createdAt: '2025-12-18T00:00:00Z',
      };

      vi.mocked(cookieUtils.getSessionToken).mockResolvedValue(mockToken);
      vi.mocked(sessionUtils.verifySession).mockResolvedValue(mockSessionPayload);
      vi.mocked(authService.getUserById).mockResolvedValue(mockUser);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.authenticated).toBe(true);
      expect(data.user.role).toBe('student');
      expect(data.user.lastName).toBeNull();
    });
  });

  describe('No Session', () => {
    it('should return 401 when no session token exists', async () => {
      vi.mocked(cookieUtils.getSessionToken).mockResolvedValue(null);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.authenticated).toBe(false);
      expect(data.message).toBe('No active session');

      // Should not try to verify or fetch user if no token
      expect(sessionUtils.verifySession).not.toHaveBeenCalled();
      expect(authService.getUserById).not.toHaveBeenCalled();
    });
  });

  describe('Invalid Session', () => {
    it('should return 401 for invalid JWT token', async () => {
      const mockToken = 'invalid-jwt-token';

      vi.mocked(cookieUtils.getSessionToken).mockResolvedValue(mockToken);
      vi.mocked(sessionUtils.verifySession).mockResolvedValue(null);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.authenticated).toBe(false);
      expect(data.message).toBe('Invalid or expired session');

      // Should not fetch user if token is invalid
      expect(authService.getUserById).not.toHaveBeenCalled();
    });

    it('should return 401 for expired JWT token', async () => {
      const mockToken = 'expired-jwt-token';

      vi.mocked(cookieUtils.getSessionToken).mockResolvedValue(mockToken);
      vi.mocked(sessionUtils.verifySession).mockResolvedValue(null); // Expired tokens return null

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.authenticated).toBe(false);
      expect(data.message).toBe('Invalid or expired session');
    });
  });

  describe('User Not Found', () => {
    it('should return 401 when user no longer exists', async () => {
      const mockToken = 'valid-jwt-token';
      const mockSessionPayload = {
        userId: 'deleted-user-123',
        role: 'instructor' as const,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
      };

      vi.mocked(cookieUtils.getSessionToken).mockResolvedValue(mockToken);
      vi.mocked(sessionUtils.verifySession).mockResolvedValue(mockSessionPayload);
      vi.mocked(authService.getUserById).mockResolvedValue(null);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.authenticated).toBe(false);
      expect(data.message).toBe('User not found');
    });
  });

  describe('Server Errors', () => {
    it('should return 500 for database errors', async () => {
      const mockToken = 'valid-jwt-token';
      const mockSessionPayload = {
        userId: 'user123',
        role: 'instructor' as const,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
      };

      vi.mocked(cookieUtils.getSessionToken).mockResolvedValue(mockToken);
      vi.mocked(sessionUtils.verifySession).mockResolvedValue(mockSessionPayload);
      vi.mocked(authService.getUserById).mockRejectedValue(
        new Error('Database connection failed')
      );

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.authenticated).toBe(false);
      expect(data.error).toBe('Session verification failed');
    });

    it('should return 500 for session verification errors', async () => {
      const mockToken = 'valid-jwt-token';

      vi.mocked(cookieUtils.getSessionToken).mockResolvedValue(mockToken);
      vi.mocked(sessionUtils.verifySession).mockRejectedValue(
        new Error('Session verification error')
      );

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.authenticated).toBe(false);
    });

    it('should return 500 for cookie reading errors', async () => {
      vi.mocked(cookieUtils.getSessionToken).mockRejectedValue(
        new Error('Cookie reading failed')
      );

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.authenticated).toBe(false);
    });
  });

  describe('Data Sanitization', () => {
    it('should not return password in response', async () => {
      const mockToken = 'valid-jwt-token';
      const mockSessionPayload = {
        userId: 'user123',
        role: 'instructor' as const,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
      };
      const mockUser = {
        id: 'user123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: null,
        role: 'instructor' as const,
        createdAt: '2025-12-18T00:00:00Z',
      };

      vi.mocked(cookieUtils.getSessionToken).mockResolvedValue(mockToken);
      vi.mocked(sessionUtils.verifySession).mockResolvedValue(mockSessionPayload);
      vi.mocked(authService.getUserById).mockResolvedValue(mockUser);

      const response = await GET();
      const data = await response.json();

      expect(data.user).toBeDefined();
      expect(data.user.password).toBeUndefined();
      expect(data.user.password_hash).toBeUndefined();
    });
  });

  describe('Response Format', () => {
    it('should return consistent JSON structure for authenticated users', async () => {
      const mockToken = 'valid-jwt-token';
      const mockSessionPayload = {
        userId: 'user123',
        role: 'instructor' as const,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
      };
      const mockUser = {
        id: 'user123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: null,
        role: 'instructor' as const,
        createdAt: '2025-12-18T00:00:00Z',
      };

      vi.mocked(cookieUtils.getSessionToken).mockResolvedValue(mockToken);
      vi.mocked(sessionUtils.verifySession).mockResolvedValue(mockSessionPayload);
      vi.mocked(authService.getUserById).mockResolvedValue(mockUser);

      const response = await GET();
      const data = await response.json();

      expect(data).toHaveProperty('success');
      expect(data).toHaveProperty('authenticated');
      expect(data).toHaveProperty('user');
      expect(typeof data.success).toBe('boolean');
      expect(typeof data.authenticated).toBe('boolean');
      expect(typeof data.user).toBe('object');
    });

    it('should return consistent JSON structure for unauthenticated requests', async () => {
      vi.mocked(cookieUtils.getSessionToken).mockResolvedValue(null);

      const response = await GET();
      const data = await response.json();

      expect(data).toHaveProperty('success');
      expect(data).toHaveProperty('authenticated');
      expect(data).toHaveProperty('message');
      expect(typeof data.success).toBe('boolean');
      expect(typeof data.authenticated).toBe('boolean');
      expect(typeof data.message).toBe('string');
    });
  });
});

