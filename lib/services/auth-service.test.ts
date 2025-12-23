/**
 * Unit tests for authentication service
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { registerUser, loginUser, getUserById, emailExists } from './auth-service';
import * as d1Client from '../d1-client';
import * as passwordUtils from '../utils/password';

// Mock the d1-client module
vi.mock('../d1-client', () => ({
  getDatabase: vi.fn(() => ({} as unknown)),
  executeQueryFirst: vi.fn(),
  executeMutation: vi.fn(),
}));

// Mock password utilities (we want to test logic, not actual bcrypt)
vi.mock('../utils/password', () => ({
  hashPassword: vi.fn(async (password: string) => `hashed_${password}`),
  verifyPassword: vi.fn(async (password: string, hash: string) => {
    return hash === `hashed_${password}`;
  }),
}));

describe('Authentication Service', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  describe('registerUser', () => {
    it('should register a new user successfully', async () => {
      const mockUser = {
        id: 'user123',
        email: 'test@example.com',
        password_hash: 'hashed_password',
        first_name: 'John',
        last_name: 'Doe',
        role: 'instructor' as const,
        created_at: '2025-12-18T00:00:00Z',
        updated_at: '2025-12-18T00:00:00Z',
      };

      vi.mocked(d1Client.executeMutation).mockResolvedValue(mockUser);

      const result = await registerUser({
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
        role: 'instructor',
      });

      expect(result).toEqual({
        id: 'user123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'instructor',
        createdAt: '2025-12-18T00:00:00Z',
      });

      // Verify password was hashed
      expect(passwordUtils.hashPassword).toHaveBeenCalledWith('Password123!');
    });

    it('should normalize email to lowercase', async () => {
      const mockUser = {
        id: 'user123',
        email: 'test@example.com',
        password_hash: 'hashed_password',
        first_name: 'John',
        last_name: null,
        role: 'student' as const,
        created_at: '2025-12-18T00:00:00Z',
        updated_at: '2025-12-18T00:00:00Z',
      };

      vi.mocked(d1Client.executeMutation).mockResolvedValue(mockUser);

      await registerUser({
        email: 'TEST@EXAMPLE.COM',
        password: 'Password123!',
        firstName: 'John',
        role: 'student',
      });

      // Check that executeMutation was called with lowercase email
      expect(d1Client.executeMutation).toHaveBeenCalled();
      const callArgs = vi.mocked(d1Client.executeMutation).mock.calls[0];
      expect(callArgs[2][0]).toBe('test@example.com');
    });

    it('should handle missing lastName', async () => {
      const mockUser = {
        id: 'user123',
        email: 'test@example.com',
        password_hash: 'hashed_password',
        first_name: 'John',
        last_name: null,
        role: 'student' as const,
        created_at: '2025-12-18T00:00:00Z',
        updated_at: '2025-12-18T00:00:00Z',
      };

      vi.mocked(d1Client.executeMutation).mockResolvedValue(mockUser);

      const result = await registerUser({
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'John',
        role: 'student',
      });

      expect(result.lastName).toBeNull();
    });

    it('should throw error for duplicate email', async () => {
      const uniqueError = new Error('UNIQUE constraint failed: users.email');
      vi.mocked(d1Client.executeMutation).mockRejectedValue(uniqueError);

      await expect(
        registerUser({
          email: 'existing@example.com',
          password: 'Password123!',
          firstName: 'Jane',
          role: 'instructor',
        })
      ).rejects.toThrow('Email already registered');
    });

    it('should throw error for database failure', async () => {
      vi.mocked(d1Client.executeMutation).mockRejectedValue(new Error('Database error'));

      await expect(
        registerUser({
          email: 'test@example.com',
          password: 'Password123!',
          firstName: 'John',
          role: 'student',
        })
      ).rejects.toThrow('Failed to register user');
    });

    it('should work with both instructor and student roles', async () => {
      const mockInstructor = {
        id: 'user1',
        email: 'instructor@example.com',
        password_hash: 'hashed',
        first_name: 'Teacher',
        last_name: null,
        role: 'instructor' as const,
        created_at: '2025-12-18T00:00:00Z',
        updated_at: '2025-12-18T00:00:00Z',
      };

      vi.mocked(d1Client.executeMutation).mockResolvedValue(mockInstructor);

      const result = await registerUser({
        email: 'instructor@example.com',
        password: 'Pass123!',
        firstName: 'Teacher',
        role: 'instructor',
      });

      expect(result.role).toBe('instructor');
    });
  });

  describe('loginUser', () => {
    it('should login successfully with correct credentials', async () => {
      const mockUser = {
        id: 'user123',
        email: 'test@example.com',
        password_hash: 'hashed_Password123!',
        first_name: 'John',
        last_name: 'Doe',
        role: 'instructor' as const,
        created_at: '2025-12-18T00:00:00Z',
        updated_at: '2025-12-18T00:00:00Z',
      };

      vi.mocked(d1Client.executeQueryFirst).mockResolvedValue(mockUser);

      const result = await loginUser({
        email: 'test@example.com',
        password: 'Password123!',
      });

      expect(result).not.toBeNull();
      expect(result?.email).toBe('test@example.com');
      expect(result?.firstName).toBe('John');
      expect(passwordUtils.verifyPassword).toHaveBeenCalledWith(
        'Password123!',
        'hashed_Password123!'
      );
    });

    it('should return null for non-existent user', async () => {
      vi.mocked(d1Client.executeQueryFirst).mockResolvedValue(null);

      const result = await loginUser({
        email: 'nonexistent@example.com',
        password: 'Password123!',
      });

      expect(result).toBeNull();
    });

    it('should return null for incorrect password', async () => {
      const mockUser = {
        id: 'user123',
        email: 'test@example.com',
        password_hash: 'hashed_CorrectPassword',
        first_name: 'John',
        last_name: null,
        role: 'student' as const,
        created_at: '2025-12-18T00:00:00Z',
        updated_at: '2025-12-18T00:00:00Z',
      };

      vi.mocked(d1Client.executeQueryFirst).mockResolvedValue(mockUser);
      vi.mocked(passwordUtils.verifyPassword).mockResolvedValue(false);

      const result = await loginUser({
        email: 'test@example.com',
        password: 'WrongPassword',
      });

      expect(result).toBeNull();
    });

    it('should normalize email to lowercase', async () => {
      const mockUser = {
        id: 'user123',
        email: 'test@example.com',
        password_hash: 'hashed_Password123!',
        first_name: 'John',
        last_name: null,
        role: 'student' as const,
        created_at: '2025-12-18T00:00:00Z',
        updated_at: '2025-12-18T00:00:00Z',
      };

      vi.mocked(d1Client.executeQueryFirst).mockResolvedValue(mockUser);

      await loginUser({
        email: 'TEST@EXAMPLE.COM',
        password: 'Password123!',
      });

      const callArgs = vi.mocked(d1Client.executeQueryFirst).mock.calls[0];
      expect(callArgs[2][0]).toBe('test@example.com');
    });

    it('should return null on database error', async () => {
      vi.mocked(d1Client.executeQueryFirst).mockRejectedValue(new Error('DB error'));

      const result = await loginUser({
        email: 'test@example.com',
        password: 'Password123!',
      });

      expect(result).toBeNull();
    });
  });

  describe('getUserById', () => {
    it('should return user when found', async () => {
      const mockUser = {
        id: 'user123',
        email: 'test@example.com',
        password_hash: 'hashed',
        first_name: 'John',
        last_name: 'Doe',
        role: 'instructor' as const,
        created_at: '2025-12-18T00:00:00Z',
        updated_at: '2025-12-18T00:00:00Z',
      };

      vi.mocked(d1Client.executeQueryFirst).mockResolvedValue(mockUser);

      const result = await getUserById('user123');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('user123');
      expect(result?.email).toBe('test@example.com');
    });

    it('should return null when user not found', async () => {
      vi.mocked(d1Client.executeQueryFirst).mockResolvedValue(null);

      const result = await getUserById('nonexistent');

      expect(result).toBeNull();
    });

    it('should return null on database error', async () => {
      vi.mocked(d1Client.executeQueryFirst).mockRejectedValue(new Error('DB error'));

      const result = await getUserById('user123');

      expect(result).toBeNull();
    });

    it('should not include password_hash in result', async () => {
      const mockUser = {
        id: 'user123',
        email: 'test@example.com',
        password_hash: 'hashed_secret',
        first_name: 'John',
        last_name: null,
        role: 'student' as const,
        created_at: '2025-12-18T00:00:00Z',
        updated_at: '2025-12-18T00:00:00Z',
      };

      vi.mocked(d1Client.executeQueryFirst).mockResolvedValue(mockUser);

      const result = await getUserById('user123');

      expect(result).toBeDefined();
      expect('password_hash' in (result as unknown as Record<string, unknown>)).toBe(false);
    });
  });

  describe('emailExists', () => {
    it('should return true when email exists', async () => {
      vi.mocked(d1Client.executeQueryFirst).mockResolvedValue({ count: 1 });

      const result = await emailExists('existing@example.com');

      expect(result).toBe(true);
    });

    it('should return false when email does not exist', async () => {
      vi.mocked(d1Client.executeQueryFirst).mockResolvedValue({ count: 0 });

      const result = await emailExists('nonexistent@example.com');

      expect(result).toBe(false);
    });

    it('should normalize email to lowercase', async () => {
      vi.mocked(d1Client.executeQueryFirst).mockResolvedValue({ count: 1 });

      await emailExists('TEST@EXAMPLE.COM');

      const callArgs = vi.mocked(d1Client.executeQueryFirst).mock.calls[0];
      expect(callArgs[2][0]).toBe('test@example.com');
    });

    it('should return false on database error', async () => {
      vi.mocked(d1Client.executeQueryFirst).mockRejectedValue(new Error('DB error'));

      const result = await emailExists('test@example.com');

      expect(result).toBe(false);
    });

    it('should return false when result is null', async () => {
      vi.mocked(d1Client.executeQueryFirst).mockResolvedValue(null);

      const result = await emailExists('test@example.com');

      expect(result).toBe(false);
    });
  });
});

