import { z } from 'zod';

export const suggestTaskSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required').max(2000),
  projectId: z.string().uuid('Invalid project ID'),
});

export const generateSubtasksSchema = z.object({
  taskTitle: z.string().min(1).max(500),
  taskDescription: z.string().max(5000).optional(),
});

export const summarizeSchema = z.object({
  organizationId: z.string().uuid('Invalid organization ID'),
  type: z.enum(['sprint', 'project', 'daily']),
  targetId: z.string().uuid().optional(),
});

export const chatSchema = z.object({
  message: z.string().min(1).max(4000),
  organizationId: z.string().uuid('Invalid organization ID'),
  context: z.enum(['general', 'tasks', 'planning']).default('general'),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().min(1).max(8000),
      }),
    )
    .max(40)
    .optional(),
});

export type SuggestTaskDTO = z.infer<typeof suggestTaskSchema>;
export type GenerateSubtasksDTO = z.infer<typeof generateSubtasksSchema>;
export type SummarizeDTO = z.infer<typeof summarizeSchema>;
export type ChatDTO = z.infer<typeof chatSchema>;
