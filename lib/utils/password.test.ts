/**
 * Unit tests for password utilities
 */

import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from './password';

describe('Password Utilities', () => {
  describe('hashPassword', () => {
    it('should hash a password successfully', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);
      
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash).not.toBe(password); // Hash should be different from plain text
      expect(hash.length).toBeGreaterThan(0);
    });

    it('should produce different hashes for the same password (salt)', async () => {
      const password = 'TestPassword123!';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);
      
      // Hashes should be different due to different salts
      expect(hash1).not.toBe(hash2);
    });

    it('should hash different passwords differently', async () => {
      const password1 = 'Password1!';
      const password2 = 'Password2!';
      
      const hash1 = await hashPassword(password1);
      const hash2 = await hashPassword(password2);
      
      expect(hash1).not.toBe(hash2);
    });

    it('should produce bcrypt-formatted hashes', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);
      
      // Bcrypt hashes start with $2a$, $2b$, or $2y$
      expect(hash).toMatch(/^\$2[aby]\$/);
    });
  });

  describe('verifyPassword', () => {
    it('should return true for correct password', async () => {
      const password = 'CorrectPassword123!';
      const hash = await hashPassword(password);
      
      const isValid = await verifyPassword(password, hash);
      
      expect(isValid).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const correctPassword = 'CorrectPassword123!';
      const wrongPassword = 'WrongPassword123!';
      const hash = await hashPassword(correctPassword);
      
      const isValid = await verifyPassword(wrongPassword, hash);
      
      expect(isValid).toBe(false);
    });

    it('should return false for empty password', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);
      
      const isValid = await verifyPassword('', hash);
      
      expect(isValid).toBe(false);
    });

    it('should return false for invalid hash format', async () => {
      const password = 'TestPassword123!';
      const invalidHash = 'not-a-valid-hash';
      
      const isValid = await verifyPassword(password, invalidHash);
      
      expect(isValid).toBe(false);
    });

    it('should handle case-sensitive passwords correctly', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);
      
      const isValidLower = await verifyPassword('testpassword123!', hash);
      const isValidUpper = await verifyPassword('TESTPASSWORD123!', hash);
      const isValidOriginal = await verifyPassword(password, hash);
      
      expect(isValidLower).toBe(false);
      expect(isValidUpper).toBe(false);
      expect(isValidOriginal).toBe(true);
    });

    it('should work with special characters in password', async () => {
      const password = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      const hash = await hashPassword(password);
      
      const isValid = await verifyPassword(password, hash);
      
      expect(isValid).toBe(true);
    });

    it('should work with unicode characters', async () => {
      const password = 'パスワード123!';
      const hash = await hashPassword(password);
      
      const isValid = await verifyPassword(password, hash);
      
      expect(isValid).toBe(true);
    });
  });

  describe('Integration tests', () => {
    it('should work for complete hash and verify cycle', async () => {
      const password = 'MySecurePassword123!';
      
      // Hash the password
      const hash = await hashPassword(password);
      
      // Verify with correct password
      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);
      
      // Verify with wrong password
      const isInvalid = await verifyPassword('WrongPassword', hash);
      expect(isInvalid).toBe(false);
    });
  });
});

