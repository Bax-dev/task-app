import { z } from 'zod';

export const createSavedFilterSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  query: z.any(),
  shared: z.boolean().optional(),
  organizationId: z.string().uuid('Invalid organization ID'),
});

export const updateSavedFilterSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  query: z.any().optional(),
  shared: z.boolean().optional(),
});

export type CreateSavedFilterDTO = z.infer<typeof createSavedFilterSchema>;
export type UpdateSavedFilterDTO = z.infer<typeof updateSavedFilterSchema>;
