import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthService } from '../lib/auth';

// Mock Supabase
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn()
        }))
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn()
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn()
      }))
    })),
    rpc: vi.fn()
  }
}));

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validatePasswordStrength', () => {
    it('should validate strong password', () => {
      const result = AuthService.validatePasswordStrength('StrongPass123!');
      expect(result.isValid).toBe(true);
      expect(result.score).toBe(5);
      expect(result.feedback).toHaveLength(0);
    });

    it('should reject weak password', () => {
      const result = AuthService.validatePasswordStrength('weak');
      expect(result.isValid).toBe(false);
      expect(result.score).toBeLessThan(4);
      expect(result.feedback.length).toBeGreaterThan(0);
    });

    it('should require minimum length', () => {
      const result = AuthService.validatePasswordStrength('Ab1!');
      expect(result.feedback).toContain('הסיסמה חייבת להכיל לפחות 8 תווים');
    });

    it('should require uppercase letter', () => {
      const result = AuthService.validatePasswordStrength('lowercase123!');
      expect(result.feedback).toContain('הסיסמה חייבת להכיל לפחות אות גדולה אחת');
    });

    it('should require lowercase letter', () => {
      const result = AuthService.validatePasswordStrength('UPPERCASE123!');
      expect(result.feedback).toContain('הסיסמה חייבת להכיל לפחות אות קטנה אחת');
    });

    it('should require digit', () => {
      const result = AuthService.validatePasswordStrength('NoNumbers!');
      expect(result.feedback).toContain('הסיסמה חייבת להכיל לפחות ספרה אחת');
    });

    it('should require special character', () => {
      const result = AuthService.validatePasswordStrength('NoSpecial123');
      expect(result.feedback).toContain('הסיסמה חייבת להכיל לפחות תו מיוחד אחד');
    });
  });

  describe('generateSessionToken', () => {
    it('should generate unique tokens', () => {
      const token1 = AuthService.generateSessionToken();
      const token2 = AuthService.generateSessionToken();
      
      expect(token1).not.toBe(token2);
      expect(token1).toHaveLength(64); // 32 bytes * 2 hex chars
      expect(token2).toHaveLength(64);
    });

    it('should generate hex string', () => {
      const token = AuthService.generateSessionToken();
      expect(token).toMatch(/^[0-9a-f]+$/);
    });
  });
});