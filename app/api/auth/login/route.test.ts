/**
 * Integration tests for POST /api/auth/login endpoint
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';
import * as authService from '@/lib/services/auth-service';
import * as sessionUtils from '@/lib/utils/session';
import * as cookieUtils from '@/lib/utils/cookies';

// Mock dependencies
vi.mock('@/lib/services/auth-service');
vi.mock('@/lib/utils/session');
vi.mock('@/lib/utils/cookies');

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Helper to create mock NextRequest
  function createMockRequest(body: any): NextRequest {
    return {
      json: async () => body,
    } as NextRequest;
  }

  describe('Successful Login', () => {
    it('should login an instructor and return 200', async () => {
      const mockUser = {
        id: 'user123',
        email: 'teacher@example.com',
        firstName: 'Jane',
        lastName: 'Doe',
        role: 'instructor' as const,
        createdAt: '2025-12-18T00:00:00Z',
      };

      const mockToken = 'mock-jwt-token-12345';

      vi.mocked(authService.loginUser).mockResolvedValue(mockUser);
      vi.mocked(sessionUtils.createSession).mockResolvedValue(mockToken);
      vi.mocked(cookieUtils.setSessionCookie).mockResolvedValue(undefined);

      const request = createMockRequest({
        email: 'teacher@example.com',
        password: 'SecurePass123!',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Login successful');
      expect(data.user).toEqual({
        id: 'user123',
        email: 'teacher@example.com',
        firstName: 'Jane',
        lastName: 'Doe',
        role: 'instructor',
      });

      // Verify service was called correctly
      expect(authService.loginUser).toHaveBeenCalledWith({
        email: 'teacher@example.com',
        password: 'SecurePass123!',
      });

      // Verify session was created
      expect(sessionUtils.createSession).toHaveBeenCalledWith('user123', 'instructor');

      // Verify cookie was set
      expect(cookieUtils.setSessionCookie).toHaveBeenCalledWith(mockToken);
    });

    it('should login a student and return 200', async () => {
      const mockUser = {
        id: 'user456',
        email: 'student@example.com',
        firstName: 'John',
        lastName: null,
        role: 'student' as const,
        createdAt: '2025-12-18T00:00:00Z',
      };

      const mockToken = 'mock-jwt-token-67890';

      vi.mocked(authService.loginUser).mockResolvedValue(mockUser);
      vi.mocked(sessionUtils.createSession).mockResolvedValue(mockToken);
      vi.mocked(cookieUtils.setSessionCookie).mockResolvedValue(undefined);

      const request = createMockRequest({
        email: 'student@example.com',
        password: 'MyPassword123!',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.user.role).toBe('student');
    });
  });

  describe('Invalid Credentials', () => {
    it('should return 401 for non-existent user', async () => {
      vi.mocked(authService.loginUser).mockResolvedValue(null);

      const request = createMockRequest({
        email: 'nonexistent@example.com',
        password: 'SomePassword123!',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid credentials');
      expect(data.message).toContain('incorrect');

      // Session should not be created for invalid login
      expect(sessionUtils.createSession).not.toHaveBeenCalled();
      expect(cookieUtils.setSessionCookie).not.toHaveBeenCalled();
    });

    it('should return 401 for wrong password', async () => {
      vi.mocked(authService.loginUser).mockResolvedValue(null);

      const request = createMockRequest({
        email: 'teacher@example.com',
        password: 'WrongPassword123!',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid credentials');

      // Session should not be created
      expect(sessionUtils.createSession).not.toHaveBeenCalled();
      expect(cookieUtils.setSessionCookie).not.toHaveBeenCalled();
    });
  });

  describe('Validation Errors', () => {
    it('should return 400 for missing email', async () => {
      const request = createMockRequest({
        // email missing
        password: 'SecurePass123!',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Validation failed');
      expect(data.details).toBeDefined();
    });

    it('should return 400 for missing password', async () => {
      const request = createMockRequest({
        email: 'test@example.com',
        // password missing
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Validation failed');
    });

    it('should return 400 for invalid email format', async () => {
      const request = createMockRequest({
        email: 'not-an-email',
        password: 'SecurePass123!',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Validation failed');
    });

    it('should return 400 for empty password', async () => {
      const request = createMockRequest({
        email: 'test@example.com',
        password: '',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Validation failed');
    });
  });

  describe('Server Errors', () => {
    it('should return 500 for database errors', async () => {
      vi.mocked(authService.loginUser).mockRejectedValue(
        new Error('Database connection failed')
      );

      const request = createMockRequest({
        email: 'test@example.com',
        password: 'SecurePass123!',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Login failed');
    });

    it('should return 500 for session creation errors', async () => {
      const mockUser = {
        id: 'user123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: null,
        role: 'student' as const,
        createdAt: '2025-12-18T00:00:00Z',
      };

      vi.mocked(authService.loginUser).mockResolvedValue(mockUser);
      vi.mocked(sessionUtils.createSession).mockRejectedValue(
        new Error('Session creation failed')
      );

      const request = createMockRequest({
        email: 'test@example.com',
        password: 'SecurePass123!',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });

    it('should return 500 for cookie setting errors', async () => {
      const mockUser = {
        id: 'user123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: null,
        role: 'student' as const,
        createdAt: '2025-12-18T00:00:00Z',
      };

      vi.mocked(authService.loginUser).mockResolvedValue(mockUser);
      vi.mocked(sessionUtils.createSession).mockResolvedValue('token');
      vi.mocked(cookieUtils.setSessionCookie).mockRejectedValue(
        new Error('Cookie setting failed')
      );

      const request = createMockRequest({
        email: 'test@example.com',
        password: 'SecurePass123!',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });
  });

  describe('Data Sanitization', () => {
    it('should not return password in response', async () => {
      const mockUser = {
        id: 'user123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: null,
        role: 'student' as const,
        createdAt: '2025-12-18T00:00:00Z',
      };

      vi.mocked(authService.loginUser).mockResolvedValue(mockUser);
      vi.mocked(sessionUtils.createSession).mockResolvedValue('token');
      vi.mocked(cookieUtils.setSessionCookie).mockResolvedValue(undefined);

      const request = createMockRequest({
        email: 'test@example.com',
        password: 'SecurePass123!',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.user).toBeDefined();
      expect(data.user.password).toBeUndefined();
      expect(data.user.password_hash).toBeUndefined();
    });
  });

  describe('Email Case Sensitivity', () => {
    it('should handle uppercase emails correctly', async () => {
      const mockUser = {
        id: 'user123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: null,
        role: 'student' as const,
        createdAt: '2025-12-18T00:00:00Z',
      };

      vi.mocked(authService.loginUser).mockResolvedValue(mockUser);
      vi.mocked(sessionUtils.createSession).mockResolvedValue('token');
      vi.mocked(cookieUtils.setSessionCookie).mockResolvedValue(undefined);

      const request = createMockRequest({
        email: 'TEST@EXAMPLE.COM', // Uppercase
        password: 'SecurePass123!',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Verify loginUser was called (email normalization happens in validation schema)
      expect(authService.loginUser).toHaveBeenCalled();
    });
  });
});

