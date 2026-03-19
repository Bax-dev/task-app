import { z } from 'zod';

export const createActivityLogSchema = z.object({
  description: z.string().min(1, 'Description is required').max(2000),
  status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED']).default('IN_PROGRESS'),
  note: z.string().max(2000).optional().nullable(),
  taskId: z.string().uuid('Invalid task ID').optional().nullable(),
  organizationId: z.string().uuid('Invalid organization ID'),
});

export const updateActivityLogSchema = z.object({
  description: z.string().min(1).max(2000).optional(),
  status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED']).optional(),
  note: z.string().max(2000).optional().nullable(),
  taskId: z.string().uuid('Invalid task ID').optional().nullable(),
});

export type CreateActivityLogDTO = z.infer<typeof createActivityLogSchema>;
export type UpdateActivityLogDTO = z.infer<typeof updateActivityLogSchema>;
