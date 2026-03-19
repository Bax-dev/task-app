import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { validateBody } from '@/lib/guards/validate';

describe('validateBody', () => {
  const schema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    age: z.number().optional(),
  });

  it('should validate correct data', () => {
    const result = validateBody(schema, {
      name: 'John',
      email: 'john@example.com',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('John');
      expect(result.data.email).toBe('john@example.com');
    }
  });

  it('should reject invalid data', () => {
    const result = validateBody(schema, {
      name: 'J',
      email: 'not-an-email',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('name');
      expect(result.error).toContain('email');
    }
  });

  it('should reject missing required fields', () => {
    const result = validateBody(schema, {});
    expect(result.success).toBe(false);
  });

  it('should allow optional fields', () => {
    const result = validateBody(schema, {
      name: 'John',
      email: 'john@example.com',
      age: 25,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.age).toBe(25);
    }
  });
});
