import { prisma } from '@/lib/db/client';
import { Role, Weekday } from '@prisma/client';

const dailyReportInclude = {
  createdBy: { select: { id: true, name: true, email: true } },
};

export async function findScheduleByOrganization(organizationId: string) {
  return prisma.dailyReportSchedule.findUnique({
    where: { organizationId },
  });
}

export async function upsertSchedule(data: {
  organizationId: string;
  createdById: string;
  time: string;
  timezone: string;
  weekdays: Weekday[];
  enabled: boolean;
}) {
  return prisma.dailyReportSchedule.upsert({
    where: { organizationId: data.organizationId },
    create: data,
    update: {
      time: data.time,
      timezone: data.timezone,
      weekdays: data.weekdays,
      enabled: data.enabled,
      createdById: data.createdById,
    },
  });
}

export async function upsertDailyReport(data: {
  organizationId: string;
  createdById: string;
  reportDate: Date;
  whatDid: string;
  blockers?: string | null;
  goalTomorrow: string;
}) {
  return prisma.dailyReport.upsert({
    where: {
      organizationId_createdById_reportDate: {
        organizationId: data.organizationId,
        createdById: data.createdById,
        reportDate: data.reportDate,
      },
    },
    create: data,
    update: {
      whatDid: data.whatDid,
      blockers: data.blockers,
      goalTomorrow: data.goalTomorrow,
      submittedAt: new Date(),
    },
    include: dailyReportInclude,
  });
}

export async function findReportsByOrganizationAndDate(organizationId: string, reportDate: Date) {
  return prisma.dailyReport.findMany({
    where: { organizationId, reportDate },
    include: dailyReportInclude,
    orderBy: [{ submittedAt: 'desc' }],
  });
}

export async function findReportsByUserAndOrganization(userId: string, organizationId: string, reportDate?: Date) {
  return prisma.dailyReport.findMany({
    where: {
      createdById: userId,
      organizationId,
      ...(reportDate ? { reportDate } : {}),
    },
    include: dailyReportInclude,
    orderBy: [{ reportDate: 'desc' }],
  });
}

export async function findNonGuestMembers(organizationId: string) {
  return prisma.membership.findMany({
    where: {
      organizationId,
      role: { not: Role.GUEST },
    },
    select: {
      role: true,
      user: {
        select: { id: true, name: true, email: true },
      },
    },
  });
}

export async function findEnabledSchedules() {
  return prisma.dailyReportSchedule.findMany({
    where: { enabled: true },
  });
}

export async function markReminderSent(scheduleId: string, sentAt: Date) {
  return prisma.dailyReportSchedule.update({
    where: { id: scheduleId },
    data: { lastReminderSentAt: sentAt },
  });
}
