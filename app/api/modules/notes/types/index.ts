import { z } from 'zod';

export const createNoteSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  content: z.string().optional().default(''),
  organizationId: z.string().uuid('Invalid organization ID'),
});

export const updateNoteSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().optional(),
});

export type CreateNoteDTO = z.infer<typeof createNoteSchema>;
export type UpdateNoteDTO = z.infer<typeof updateNoteSchema>;
