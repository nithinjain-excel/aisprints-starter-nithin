/**
 * Integration tests for POST /api/auth/register endpoint
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

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Helper to create mock NextRequest
  function createMockRequest(body: any): NextRequest {
    return {
      json: async () => body,
    } as NextRequest;
  }

  describe('Successful Registration', () => {
    it('should register a new instructor and return 201', async () => {
      const mockUser = {
        id: 'user123',
        email: 'teacher@example.com',
        firstName: 'Jane',
        lastName: 'Doe',
        role: 'instructor' as const,
        createdAt: '2025-12-18T00:00:00Z',
      };

      const mockToken = 'mock-jwt-token-12345';

      vi.mocked(authService.registerUser).mockResolvedValue(mockUser);
      vi.mocked(sessionUtils.createSession).mockResolvedValue(mockToken);
      vi.mocked(cookieUtils.setSessionCookie).mockResolvedValue(undefined);

      const request = createMockRequest({
        email: 'teacher@example.com',
        password: 'SecurePass123!',
        firstName: 'Jane',
        lastName: 'Doe',
        role: 'instructor',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Registration successful');
      expect(data.user).toEqual({
        id: 'user123',
        email: 'teacher@example.com',
        firstName: 'Jane',
        lastName: 'Doe',
        role: 'instructor',
      });

      // Verify service was called correctly
      expect(authService.registerUser).toHaveBeenCalledWith({
        email: 'teacher@example.com',
        password: 'SecurePass123!',
        firstName: 'Jane',
        lastName: 'Doe',
        role: 'instructor',
      });

      // Verify session was created
      expect(sessionUtils.createSession).toHaveBeenCalledWith('user123', 'instructor');

      // Verify cookie was set
      expect(cookieUtils.setSessionCookie).toHaveBeenCalledWith(mockToken);
    });

    it('should register a new student without lastName', async () => {
      const mockUser = {
        id: 'user456',
        email: 'student@example.com',
        firstName: 'John',
        lastName: null,
        role: 'student' as const,
        createdAt: '2025-12-18T00:00:00Z',
      };

      const mockToken = 'mock-jwt-token-67890';

      vi.mocked(authService.registerUser).mockResolvedValue(mockUser);
      vi.mocked(sessionUtils.createSession).mockResolvedValue(mockToken);
      vi.mocked(cookieUtils.setSessionCookie).mockResolvedValue(undefined);

      const request = createMockRequest({
        email: 'student@example.com',
        password: 'MyPassword123!',
        firstName: 'John',
        role: 'student',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.user.lastName).toBeNull();
      expect(data.user.role).toBe('student');
    });
  });

  describe('Validation Errors', () => {
    it('should return 400 for missing firstName', async () => {
      const request = createMockRequest({
        email: 'test@example.com',
        password: 'SecurePass123!',
        // firstName missing
        role: 'student',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Validation failed');
      expect(data.details).toBeDefined();
      expect(data.details.length).toBeGreaterThan(0);
    });

    it('should return 400 for invalid email', async () => {
      const request = createMockRequest({
        email: 'not-an-email',
        password: 'SecurePass123!',
        firstName: 'Test',
        role: 'student',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Validation failed');
    });

    it('should return 400 for weak password', async () => {
      const request = createMockRequest({
        email: 'test@example.com',
        password: 'weak',
        firstName: 'Test',
        role: 'student',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Validation failed');
      expect(data.details.some((d: any) => d.field === 'password')).toBe(true);
    });

    it('should return 400 for invalid role', async () => {
      const request = createMockRequest({
        email: 'test@example.com',
        password: 'SecurePass123!',
        firstName: 'Test',
        role: 'admin', // Invalid role
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Validation failed');
    });

    it('should return 400 for firstName too short', async () => {
      const request = createMockRequest({
        email: 'test@example.com',
        password: 'SecurePass123!',
        firstName: 'A', // Too short (min 2 chars)
        role: 'student',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Validation failed');
    });
  });

  describe('Duplicate Email', () => {
    it('should return 409 for duplicate email', async () => {
      vi.mocked(authService.registerUser).mockRejectedValue(
        new Error('Email already registered')
      );

      const request = createMockRequest({
        email: 'existing@example.com',
        password: 'SecurePass123!',
        firstName: 'Test',
        role: 'instructor',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Email already registered');
      expect(data.message).toContain('already exists');
    });
  });

  describe('Server Errors', () => {
    it('should return 500 for database errors', async () => {
      vi.mocked(authService.registerUser).mockRejectedValue(
        new Error('Database connection failed')
      );

      const request = createMockRequest({
        email: 'test@example.com',
        password: 'SecurePass123!',
        firstName: 'Test',
        role: 'student',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Registration failed');
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

      vi.mocked(authService.registerUser).mockResolvedValue(mockUser);
      vi.mocked(sessionUtils.createSession).mockRejectedValue(
        new Error('Session creation failed')
      );

      const request = createMockRequest({
        email: 'test@example.com',
        password: 'SecurePass123!',
        firstName: 'Test',
        role: 'student',
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

      vi.mocked(authService.registerUser).mockResolvedValue(mockUser);
      vi.mocked(sessionUtils.createSession).mockResolvedValue('token');
      vi.mocked(cookieUtils.setSessionCookie).mockResolvedValue(undefined);

      const request = createMockRequest({
        email: 'test@example.com',
        password: 'SecurePass123!',
        firstName: 'Test',
        role: 'student',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.user).toBeDefined();
      expect(data.user.password).toBeUndefined();
      expect(data.user.password_hash).toBeUndefined();
    });
  });
});

