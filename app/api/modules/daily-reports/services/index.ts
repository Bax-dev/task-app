import { Role, Weekday } from '@prisma/client';
import { requireNonGuest, requireOrgAdmin, requireOrgMembership } from '@/lib/guards/org-guard';
import { notifyDailyReportReminder, notifyDailyReportSubmitted } from '@/app/api/modules/notifications/services';
import { buildDailyReportReminderEmail, sendEmail } from '@/lib/email';
import * as dailyReportModel from '../models';
import type { CreateDailyReportDTO, UpdateDailyReportScheduleDTO } from '../types';

function normalizeReportDate(reportDate?: string) {
  const date = reportDate ? new Date(`${reportDate}T00:00:00.000Z`) : new Date();
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function getDateParts(now: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'long',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(now);
  const part = (type: string) => parts.find((item) => item.type === type)?.value || '';

  const weekdayMap: Record<string, Weekday> = {
    Monday: 'MONDAY',
    Tuesday: 'TUESDAY',
    Wednesday: 'WEDNESDAY',
    Thursday: 'THURSDAY',
    Friday: 'FRIDAY',
    Saturday: 'SATURDAY',
    Sunday: 'SUNDAY',
  };

  return {
    weekday: weekdayMap[part('weekday')],
    time: `${part('hour')}:${part('minute')}`,
    isoDate: `${part('year')}-${part('month')}-${part('day')}`,
  };
}

export async function getDailyReportSchedule(organizationId: string, userId: string) {
  await requireOrgMembership(userId, organizationId);
  return (
    (await dailyReportModel.findScheduleByOrganization(organizationId)) || {
      organizationId,
      time: '17:00',
      timezone: 'UTC',
      weekdays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'] as Weekday[],
      enabled: false,
    }
  );
}

export async function updateDailyReportSchedule(
  organizationId: string,
  userId: string,
  dto: UpdateDailyReportScheduleDTO
) {
  await requireOrgAdmin(userId, organizationId);
  return dailyReportModel.upsertSchedule({
    organizationId,
    createdById: userId,
    time: dto.time,
    timezone: dto.timezone,
    weekdays: dto.weekdays as Weekday[],
    enabled: dto.enabled,
  });
}

export async function submitDailyReport(userId: string, dto: CreateDailyReportDTO) {
  const role = await requireNonGuest(userId, dto.organizationId);
  const report = await dailyReportModel.upsertDailyReport({
    organizationId: dto.organizationId,
    createdById: userId,
    reportDate: normalizeReportDate(dto.reportDate),
    whatDid: dto.whatDid,
    blockers: dto.blockers,
    goalTomorrow: dto.goalTomorrow,
  });

  if (role !== Role.GUEST) {
    const members = await dailyReportModel.findNonGuestMembers(dto.organizationId);
    const adminIds = members
      .filter((member) => member.role === Role.ADMIN && member.user.id !== userId)
      .map((member) => member.user.id);
    if (adminIds.length > 0) {
      notifyDailyReportSubmitted({
        adminIds,
        memberName: report.createdBy.name || report.createdBy.email,
        reportDate: report.reportDate.toISOString(),
        organizationId: dto.organizationId,
      }).catch(() => {});
    }
  }

  return report;
}

export async function getDailyReports(organizationId: string, userId: string, reportDate?: string) {
  const role = await requireOrgMembership(userId, organizationId);
  const normalizedDate = normalizeReportDate(reportDate);

  if (role === Role.ADMIN) {
    const [reports, members] = await Promise.all([
      dailyReportModel.findReportsByOrganizationAndDate(organizationId, normalizedDate),
      dailyReportModel.findNonGuestMembers(organizationId),
    ]);

    return {
      reports,
      memberCount: members.length,
      submittedCount: reports.length,
      isAdmin: true,
    };
  }

  const reports = await dailyReportModel.findReportsByUserAndOrganization(
    userId,
    organizationId,
    normalizedDate
  );

  return {
    reports,
    memberCount: 1,
    submittedCount: reports.length,
    isAdmin: false,
  };
}

export async function sendDailyReportReminders(now = new Date()) {
  const schedules = await dailyReportModel.findEnabledSchedules();
  let remindersSent = 0;
  let schedulesChecked = 0;

  for (const schedule of schedules) {
    schedulesChecked += 1;
    const local = getDateParts(now, schedule.timezone);
    if (!local.weekday) continue;
    if (!schedule.weekdays.includes(local.weekday)) continue;
    if (schedule.time !== local.time) continue;

    const reportDate = normalizeReportDate(local.isoDate);
    const [members, reports] = await Promise.all([
      dailyReportModel.findNonGuestMembers(schedule.organizationId),
      dailyReportModel.findReportsByOrganizationAndDate(schedule.organizationId, reportDate),
    ]);

    const submittedIds = new Set(reports.map((report) => report.createdById));
    const pendingMembers = members.filter((member) => !submittedIds.has(member.user.id));
    if (pendingMembers.length === 0) continue;

    await notifyDailyReportReminder({
      userIds: pendingMembers.map((member) => member.user.id),
      organizationId: schedule.organizationId,
      reportDate: local.isoDate,
    });

    await Promise.all(
      pendingMembers.map(async (member) => {
        const email = buildDailyReportReminderEmail({
          recipientName: member.user.name || member.user.email,
          reportDate: local.isoDate,
          link: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/daily-reports?organizationId=${schedule.organizationId}`,
        });
        await sendEmail({ to: member.user.email, subject: email.subject, html: email.html }).catch(() => {});
      })
    );

    remindersSent += pendingMembers.length;
  }

  return { schedulesChecked, remindersSent };
}
