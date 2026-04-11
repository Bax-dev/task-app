import { z } from 'zod';

export const weekdayValues = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
] as const;

export const dailyReportScheduleSchema = z.object({
  time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Use HH:MM format'),
  timezone: z.string().min(1).max(100),
  weekdays: z.array(z.enum(weekdayValues)).min(1).max(7),
  enabled: z.boolean().default(true),
});

export const createDailyReportSchema = z.object({
  organizationId: z.string().uuid('Invalid organization ID'),
  reportDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  whatDid: z.string().min(1, 'What you did is required').max(4000),
  blockers: z.string().max(2000).optional().nullable(),
  goalTomorrow: z.string().min(1, 'Tomorrow goal is required').max(4000),
});

export type UpdateDailyReportScheduleDTO = z.infer<typeof dailyReportScheduleSchema>;
export type CreateDailyReportDTO = z.infer<typeof createDailyReportSchema>;
