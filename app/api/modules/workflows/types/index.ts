import { z } from 'zod';

export const createWorkflowSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().max(2000).optional(),
  issueTypeId: z.string().uuid('Invalid issue type ID').optional().nullable(),
  organizationId: z.string().uuid('Invalid organization ID'),
});

export const updateWorkflowSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
});

export const createWorkflowStepSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  position: z.number().int().min(0),
});

export const updateWorkflowStepSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  position: z.number().int().min(0).optional(),
});

export const createWorkflowTransitionSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  fromStepId: z.string().uuid('Invalid from step ID'),
  toStepId: z.string().uuid('Invalid to step ID'),
  conditions: z.any().optional(),
});

export type CreateWorkflowDTO = z.infer<typeof createWorkflowSchema>;
export type UpdateWorkflowDTO = z.infer<typeof updateWorkflowSchema>;
export type CreateWorkflowStepDTO = z.infer<typeof createWorkflowStepSchema>;
export type UpdateWorkflowStepDTO = z.infer<typeof updateWorkflowStepSchema>;
export type CreateWorkflowTransitionDTO = z.infer<typeof createWorkflowTransitionSchema>;
