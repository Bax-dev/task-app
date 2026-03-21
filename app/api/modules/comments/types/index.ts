import { z } from 'zod';

export const createCommentSchema = z.object({
  content: z.string().min(1, 'Content is required').max(10000),
  taskId: z.string().uuid('Invalid task ID'),
});

export const updateCommentSchema = z.object({
  content: z.string().min(1, 'Content is required').max(10000),
});

export type CreateCommentDTO = z.infer<typeof createCommentSchema>;
export type UpdateCommentDTO = z.infer<typeof updateCommentSchema>;
