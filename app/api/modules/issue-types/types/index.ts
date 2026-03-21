import { z } from 'zod';

export const createIssueTypeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  icon: z.string().max(50).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Invalid hex color').optional(),
  description: z.string().max(500).optional(),
  organizationId: z.string().uuid('Invalid organization ID'),
});

export const updateIssueTypeSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  icon: z.string().max(50).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Invalid hex color').optional(),
  description: z.string().max(500).optional().nullable(),
});

export type CreateIssueTypeDTO = z.infer<typeof createIssueTypeSchema>;
export type UpdateIssueTypeDTO = z.infer<typeof updateIssueTypeSchema>;
