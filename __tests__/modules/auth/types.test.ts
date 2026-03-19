import { describe, it, expect } from 'vitest';
import { registerSchema, loginSchema } from '@/app/api/modules/auth/types';

describe('Auth Schemas', () => {
  describe('registerSchema', () => {
    it('should accept valid registration data', () => {
      const result = registerSchema.safeParse({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Password1',
      });
      expect(result.success).toBe(true);
    });

    it('should reject short name', () => {
      const result = registerSchema.safeParse({
        name: 'J',
        email: 'john@example.com',
        password: 'Password1',
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid email', () => {
      const result = registerSchema.safeParse({
        name: 'John',
        email: 'not-email',
        password: 'Password1',
      });
      expect(result.success).toBe(false);
    });

    it('should reject weak password (no uppercase)', () => {
      const result = registerSchema.safeParse({
        name: 'John',
        email: 'john@example.com',
        password: 'password1',
      });
      expect(result.success).toBe(false);
    });

    it('should reject weak password (no number)', () => {
      const result = registerSchema.safeParse({
        name: 'John',
        email: 'john@example.com',
        password: 'Password',
      });
      expect(result.success).toBe(false);
    });

    it('should reject short password', () => {
      const result = registerSchema.safeParse({
        name: 'John',
        email: 'john@example.com',
        password: 'Pass1',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('loginSchema', () => {
    it('should accept valid login data', () => {
      const result = loginSchema.safeParse({
        email: 'john@example.com',
        password: 'anypassword',
      });
      expect(result.success).toBe(true);
    });

    it('should reject missing password', () => {
      const result = loginSchema.safeParse({
        email: 'john@example.com',
        password: '',
      });
      expect(result.success).toBe(false);
    });
  });
});
