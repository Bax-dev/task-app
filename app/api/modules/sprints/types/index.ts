import { z } from 'zod';

export const createSprintSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  goal: z.string().max(2000).optional(),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
  organizationId: z.string().uuid('Invalid organization ID'),
});

export const updateSprintSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  goal: z.string().max(2000).optional().nullable(),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
  status: z.enum(['PLANNING', 'ACTIVE', 'COMPLETED']).optional(),
});

export const sprintTaskSchema = z.object({
  taskId: z.string().uuid('Invalid task ID'),
  storyPoints: z.number().int().min(0).max(100).optional(),
});

export type CreateSprintDTO = z.infer<typeof createSprintSchema>;
export type UpdateSprintDTO = z.infer<typeof updateSprintSchema>;
export type SprintTaskDTO = z.infer<typeof sprintTaskSchema>;
