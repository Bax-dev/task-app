import { prisma } from '@/lib/db/client';
import { ActivityStatus } from '@prisma/client';

/**
 * Log an audit event. Fire-and-forget — never throws.
 */
export function logAudit(params: {
  userId: string;
  organizationId: string;
  description: string;
  taskId?: string | null;
  note?: string | null;
}) {
  prisma.activityLog
    .create({
      data: {
        description: params.description,
        status: ActivityStatus.COMPLETED,
        note: params.note || null,
        taskId: params.taskId || null,
        organizationId: params.organizationId,
        createdById: params.userId,
      },
    })
    .catch((err) => {
      console.error('[AUDIT] Failed to log:', err.message);
    });
}
