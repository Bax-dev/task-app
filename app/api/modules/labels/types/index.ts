import { z } from 'zod';

export const createLabelSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Invalid hex color').optional(),
  organizationId: z.string().uuid('Invalid organization ID'),
});

export const updateLabelSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Invalid hex color').optional(),
});

export const taskLabelSchema = z.object({
  labelId: z.string().uuid('Invalid label ID'),
});

export type CreateLabelDTO = z.infer<typeof createLabelSchema>;
export type UpdateLabelDTO = z.infer<typeof updateLabelSchema>;
export type TaskLabelDTO = z.infer<typeof taskLabelSchema>;
