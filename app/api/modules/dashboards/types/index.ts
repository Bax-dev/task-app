import { z } from 'zod';

export const createDashboardSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  layout: z.any().optional(),
  organizationId: z.string().uuid('Invalid organization ID'),
});

export const updateDashboardSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  layout: z.any().optional(),
});

export type CreateDashboardDTO = z.infer<typeof createDashboardSchema>;
export type UpdateDashboardDTO = z.infer<typeof updateDashboardSchema>;
