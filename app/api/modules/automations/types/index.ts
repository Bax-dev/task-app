import { z } from 'zod';

export const createAutomationSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().max(2000).optional(),
  trigger: z.enum(['TASK_CREATED', 'TASK_UPDATED', 'TASK_STATUS_CHANGED', 'TASK_ASSIGNED', 'TASK_COMMENT_ADDED', 'SPRINT_STARTED', 'SPRINT_COMPLETED']),
  conditions: z.any().optional(),
  action: z.enum(['ASSIGN_USER', 'CHANGE_STATUS', 'ADD_LABEL', 'ADD_COMMENT', 'SEND_NOTIFICATION', 'MOVE_TO_SPRINT']),
  actionConfig: z.any().optional(),
  enabled: z.boolean().optional(),
  organizationId: z.string().uuid('Invalid organization ID'),
});

export const updateAutomationSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  trigger: z.enum(['TASK_CREATED', 'TASK_UPDATED', 'TASK_STATUS_CHANGED', 'TASK_ASSIGNED', 'TASK_COMMENT_ADDED', 'SPRINT_STARTED', 'SPRINT_COMPLETED']).optional(),
  conditions: z.any().optional(),
  action: z.enum(['ASSIGN_USER', 'CHANGE_STATUS', 'ADD_LABEL', 'ADD_COMMENT', 'SEND_NOTIFICATION', 'MOVE_TO_SPRINT']).optional(),
  actionConfig: z.any().optional(),
  enabled: z.boolean().optional(),
});

export type CreateAutomationDTO = z.infer<typeof createAutomationSchema>;
export type UpdateAutomationDTO = z.infer<typeof updateAutomationSchema>;
