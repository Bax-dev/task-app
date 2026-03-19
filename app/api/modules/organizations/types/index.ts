import { z } from 'zod';

export const createOrgSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  slug: z
    .string()
    .min(2, 'Slug must be at least 2 characters')
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
});

export const updateOrgSchema = z.object({
  name: z.string().min(2).max(100).optional(),
});

export type CreateOrgDTO = z.infer<typeof createOrgSchema>;
export type UpdateOrgDTO = z.infer<typeof updateOrgSchema>;
