import { z } from 'zod';
import { paginationQuerySchema } from '@/lib/pagination';

export const markReadSchema = z.object({
  notificationIds: z.array(z.string().uuid()).min(1),
});

export type MarkReadDTO = z.infer<typeof markReadSchema>;

export const listNotificationsQuerySchema = paginationQuerySchema;
export type ListNotificationsQuery = z.infer<typeof listNotificationsQuerySchema>;
