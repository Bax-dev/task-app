import { z } from 'zod';

export const createSubtaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500),
});

export const updateSubtaskSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  completed: z.boolean().optional(),
  position: z.number().int().min(0).optional(),
});

export const reorderSubtasksSchema = z.object({
  subtaskIds: z.array(z.string().uuid()),
});

export type CreateSubtaskDTO = z.infer<typeof createSubtaskSchema>;
export type UpdateSubtaskDTO = z.infer<typeof updateSubtaskSchema>;
export type ReorderSubtasksDTO = z.infer<typeof reorderSubtasksSchema>;
