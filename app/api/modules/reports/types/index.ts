import { z } from 'zod';

export const burndownQuerySchema = z.object({
  sprintId: z.string().uuid('Invalid sprint ID'),
});

export const velocityQuerySchema = z.object({
  organizationId: z.string().uuid('Invalid organization ID'),
  sprintCount: z.coerce.number().int().min(1).max(20).optional().default(5),
});

export const cumulativeFlowQuerySchema = z.object({
  organizationId: z.string().uuid('Invalid organization ID'),
  days: z.coerce.number().int().min(7).max(90).optional().default(30),
});

export type BurndownQuery = z.infer<typeof burndownQuerySchema>;
export type VelocityQuery = z.infer<typeof velocityQuerySchema>;
export type CumulativeFlowQuery = z.infer<typeof cumulativeFlowQuerySchema>;
