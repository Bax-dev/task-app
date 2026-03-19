import { ZodSchema, ZodError, z } from 'zod';

export function validateBody<T extends ZodSchema>(schema: T, data: unknown): { success: true; data: z.output<T> } | { success: false; error: string } {
  try {
    const parsed = schema.parse(data);
    return { success: true, data: parsed };
  } catch (err) {
    if (err instanceof ZodError) {
      const messages = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
      return { success: false, error: messages };
    }
    return { success: false, error: 'Validation failed' };
  }
}
