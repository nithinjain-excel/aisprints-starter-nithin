/**
 * Integration tests for POST /api/auth/logout endpoint
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from './route';
import * as cookieUtils from '@/lib/utils/cookies';

// Mock dependencies
vi.mock('@/lib/utils/cookies');

describe('POST /api/auth/logout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Successful Logout', () => {
    it('should clear session cookie and return 200', async () => {
      vi.mocked(cookieUtils.clearSessionCookie).mockResolvedValue(undefined);

      const response = await POST();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Logout successful');

      // Verify cookie was cleared
      expect(cookieUtils.clearSessionCookie).toHaveBeenCalledTimes(1);
    });

    it('should work without any request body', async () => {
      vi.mocked(cookieUtils.clearSessionCookie).mockResolvedValue(undefined);

      const response = await POST();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Should still clear cookie
      expect(cookieUtils.clearSessionCookie).toHaveBeenCalled();
    });
  });

  describe('Server Errors', () => {
    it('should return 500 if cookie clearing fails', async () => {
      vi.mocked(cookieUtils.clearSessionCookie).mockRejectedValue(
        new Error('Cookie clearing failed')
      );

      const response = await POST();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Logout failed');
      expect(data.message).toContain('unexpected error');
    });

    it('should handle unknown errors gracefully', async () => {
      vi.mocked(cookieUtils.clearSessionCookie).mockRejectedValue(
        'Unknown error string'
      );

      const response = await POST();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });
  });

  describe('Idempotency', () => {
    it('should succeed even if already logged out', async () => {
      // Logout should work even if there's no session to clear
      vi.mocked(cookieUtils.clearSessionCookie).mockResolvedValue(undefined);

      const response = await POST();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should be callable multiple times', async () => {
      vi.mocked(cookieUtils.clearSessionCookie).mockResolvedValue(undefined);

      // Call logout multiple times
      const response1 = await POST();
      const data1 = await response1.json();

      const response2 = await POST();
      const data2 = await response2.json();

      expect(response1.status).toBe(200);
      expect(data1.success).toBe(true);

      expect(response2.status).toBe(200);
      expect(data2.success).toBe(true);

      expect(cookieUtils.clearSessionCookie).toHaveBeenCalledTimes(2);
    });
  });

  describe('Response Format', () => {
    it('should return consistent JSON structure', async () => {
      vi.mocked(cookieUtils.clearSessionCookie).mockResolvedValue(undefined);

      const response = await POST();
      const data = await response.json();

      expect(data).toHaveProperty('success');
      expect(data).toHaveProperty('message');
      expect(typeof data.success).toBe('boolean');
      expect(typeof data.message).toBe('string');
    });
  });
});

