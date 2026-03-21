import { z } from 'zod';

export const createBoardColumnSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  position: z.number(),
  wipLimit: z.number().min(1).optional(),
});

export const updateBoardColumnSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  position: z.number().optional(),
  wipLimit: z.number().min(1).optional().nullable(),
});

export const createBoardSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(200),
  description: z.string().max(2000).optional(),
  projectId: z.string().uuid('Invalid project ID'),
  columns: z.array(createBoardColumnSchema).optional(),
});

export const updateBoardSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
});

export type CreateBoardDTO = z.infer<typeof createBoardSchema>;
export type UpdateBoardDTO = z.infer<typeof updateBoardSchema>;
export type CreateBoardColumnDTO = z.infer<typeof createBoardColumnSchema>;
export type UpdateBoardColumnDTO = z.infer<typeof updateBoardColumnSchema>;
