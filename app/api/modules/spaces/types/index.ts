import { z } from 'zod';

export const createSpaceSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Invalid color').optional().default('#7c3aed'),
  icon: z.string().max(50).optional().default('folder'),
  organizationId: z.string().uuid('Invalid organization ID'),
});

export const updateSpaceSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  icon: z.string().max(50).optional(),
});

export type CreateSpaceDTO = z.infer<typeof createSpaceSchema>;
export type UpdateSpaceDTO = z.infer<typeof updateSpaceSchema>;
