import { z } from 'zod';
import { paginationQuerySchema } from '@/lib/pagination';

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500),
  description: z.string().max(5000).optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE', 'REJECTED', 'CANCELLED']).default('TODO'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  assignToSpace: z.boolean().optional(),
  dueDate: z.string().datetime().optional().nullable(),
  projectId: z.string().uuid('Invalid project ID'),
  assigneeIds: z.array(z.string().uuid()).optional(),
  issueTypeId: z.string().uuid().optional().nullable(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(5000).optional().nullable(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE', 'REJECTED', 'CANCELLED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  assignToSpace: z.boolean().optional(),
  dueDate: z.string().datetime().optional().nullable(),
  rejectionReason: z.string().max(2000).optional().nullable(),
  issueTypeId: z.string().uuid().optional().nullable(),
});

export const assignTaskSchema = z.object({
  userId: z.string().uuid('Invalid user ID').optional(),
  userIds: z.array(z.string().uuid('Invalid user ID')).min(1).optional(),
}).refine(
  (data) => Boolean(data.userId) !== Boolean(data.userIds?.length),
  'Provide either userId or userIds'
);

export const listUserTasksQuerySchema = paginationQuerySchema.extend({
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE', 'REJECTED', 'CANCELLED']).optional(),
  q: z.string().trim().max(200).optional(),
  sort: z.enum(['due-soon', 'urgent-first', 'recently-updated', 'alphabetical']).optional(),
});

export type CreateTaskDTO = z.infer<typeof createTaskSchema>;
export type UpdateTaskDTO = z.infer<typeof updateTaskSchema>;
export type AssignTaskDTO = z.infer<typeof assignTaskSchema>;
export type ListUserTasksQuery = z.infer<typeof listUserTasksQuerySchema>;
