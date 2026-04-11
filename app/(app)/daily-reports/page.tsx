'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { CalendarCheck, CheckCircle2, Clock, Loader2, Settings2, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useGetDailyReportScheduleQuery,
  useGetDailyReportsQuery,
  useGetOrganizationsQuery,
  useGetOrgMembersQuery,
  useSubmitDailyReportMutation,
  useUpdateDailyReportScheduleMutation,
} from '@/store/api';
import { useAuth } from '@/hooks/use-auth';
import type { Weekday } from '@/types/daily-report';

const WEEKDAYS: { value: Weekday; label: string }[] = [
  { value: 'MONDAY', label: 'Mon' },
  { value: 'TUESDAY', label: 'Tue' },
  { value: 'WEDNESDAY', label: 'Wed' },
  { value: 'THURSDAY', label: 'Thu' },
  { value: 'FRIDAY', label: 'Fri' },
  { value: 'SATURDAY', label: 'Sat' },
  { value: 'SUNDAY', label: 'Sun' },
];

function todayIso() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function formatDateLabel(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function DailyReportsPage() {
  const { user } = useAuth();
  const [selectedOrg, setSelectedOrg] = useState('');
  const [reportDate, setReportDate] = useState(todayIso());
  const [whatDid, setWhatDid] = useState('');
  const [blockers, setBlockers] = useState('');
  const [goalTomorrow, setGoalTomorrow] = useState('');
  const [scheduleOpen, setScheduleOpen] = useState(false);

  const { data: organizations = [], isLoading: orgsLoading } = useGetOrganizationsQuery();

  useEffect(() => {
    if (organizations.length > 0 && !selectedOrg) {
      setSelectedOrg(organizations[0].id);
    }
  }, [organizations, selectedOrg]);

  const { data: members = [] } = useGetOrgMembersQuery(selectedOrg, { skip: !selectedOrg });
  const isAdmin = members.some((m: any) => m.id === user?.id && m.role === 'ADMIN');

  const { data: overview, isLoading: overviewLoading } = useGetDailyReportsQuery(
    { organizationId: selectedOrg, date: reportDate },
    { skip: !selectedOrg }
  );

  const { data: schedule } = useGetDailyReportScheduleQuery(selectedOrg, { skip: !selectedOrg });

  const [submitReport, { isLoading: submitting }] = useSubmitDailyReportMutation();

  const myReport = useMemo(() => {
    if (!overview) return null;
    return overview.reports.find((r) => r.createdBy.id === user?.id) || null;
  }, [overview, user?.id]);

  useEffect(() => {
    if (myReport) {
      setWhatDid(myReport.whatDid);
      setBlockers(myReport.blockers || '');
      setGoalTomorrow(myReport.goalTomorrow);
    } else {
      setWhatDid('');
      setBlockers('');
      setGoalTomorrow('');
    }
  }, [myReport]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedOrg) return;
    try {
      await submitReport({
        organizationId: selectedOrg,
        reportDate,
        whatDid: whatDid.trim(),
        blockers: blockers.trim() || null,
        goalTomorrow: goalTomorrow.trim(),
      }).unwrap();
      toast.success(myReport ? 'Report updated' : 'Report submitted');
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to submit report');
    }
  }

  if (orgsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (organizations.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <CalendarCheck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">No organizations</h2>
          <p className="text-muted-foreground text-sm">Join or create an organization to use daily reports.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Daily Reports</h1>
          <p className="text-muted-foreground mt-1 text-sm">Share what you did, blockers, and goals for tomorrow.</p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings2 className="w-4 h-4 mr-1.5" />
                  Schedule
                </Button>
              </DialogTrigger>
              <ScheduleDialog
                organizationId={selectedOrg}
                onClose={() => setScheduleOpen(false)}
              />
            </Dialog>
          )}
          <Select value={selectedOrg} onValueChange={setSelectedOrg}>
            <SelectTrigger className="w-full sm:w-[220px]">
              <SelectValue placeholder="Select organization" />
            </SelectTrigger>
            <SelectContent>
              {organizations.map((org: any) => (
                <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <Label htmlFor="report-date" className="text-sm font-medium">
          Date
        </Label>
        <Input
          id="report-date"
          type="date"
          value={reportDate}
          onChange={(e) => setReportDate(e.target.value)}
          max={todayIso()}
          className="w-auto"
        />
        {schedule?.enabled && (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            Reminders at {schedule.time} {schedule.timezone}
          </span>
        )}
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            {myReport ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : <CalendarCheck className="w-5 h-5" />}
            Your report for {formatDateLabel(reportDate)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="what-did" className="text-sm font-medium">
                What did you do today? <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="what-did"
                value={whatDid}
                onChange={(e) => setWhatDid(e.target.value)}
                placeholder="Summarize your work..."
                rows={4}
                required
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="blockers" className="text-sm font-medium">
                Blockers
              </Label>
              <Textarea
                id="blockers"
                value={blockers}
                onChange={(e) => setBlockers(e.target.value)}
                placeholder="Anything slowing you down?"
                rows={3}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="goal-tomorrow" className="text-sm font-medium">
                Goal for tomorrow <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="goal-tomorrow"
                value={goalTomorrow}
                onChange={(e) => setGoalTomorrow(e.target.value)}
                placeholder="What will you focus on tomorrow?"
                rows={3}
                required
                className="mt-1.5"
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={submitting || !whatDid.trim() || !goalTomorrow.trim()}>
                {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {myReport ? 'Update report' : 'Submit report'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {isAdmin ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Team reports
              </CardTitle>
              {overview && (
                <span className="text-sm text-muted-foreground">
                  {overview.submittedCount} / {overview.memberCount} submitted
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {overviewLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : overview && overview.reports.length > 0 ? (
              <div className="space-y-4">
                {overview.reports.map((report) => (
                  <div key={report.id} className="border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-xs font-bold text-primary">
                            {(report.createdBy.name?.[0] || report.createdBy.email[0]).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium">{report.createdBy.name || report.createdBy.email}</p>
                          <p className="text-xs text-muted-foreground">
                            Submitted {new Date(report.submittedAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                      <ReportField label="What they did" value={report.whatDid} />
                      <ReportField label="Blockers" value={report.blockers || '—'} />
                      <ReportField label="Tomorrow" value={report.goalTomorrow} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CalendarCheck className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No reports submitted for this date yet.</p>
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function ReportField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
      <p className="whitespace-pre-wrap text-foreground">{value}</p>
    </div>
  );
}

function ScheduleDialog({ organizationId, onClose }: { organizationId: string; onClose: () => void }) {
  const { data: schedule, isLoading } = useGetDailyReportScheduleQuery(organizationId, {
    skip: !organizationId,
  });
  const [updateSchedule, { isLoading: saving }] = useUpdateDailyReportScheduleMutation();

  const [time, setTime] = useState('17:00');
  const [timezone, setTimezone] = useState('UTC');
  const [weekdays, setWeekdays] = useState<Weekday[]>(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (schedule) {
      setTime(schedule.time);
      setTimezone(schedule.timezone);
      setWeekdays(schedule.weekdays);
      setEnabled(schedule.enabled);
    }
  }, [schedule]);

  function toggleWeekday(day: Weekday) {
    setWeekdays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  }

  async function handleSave() {
    if (weekdays.length === 0) {
      toast.error('Pick at least one weekday');
      return;
    }
    try {
      await updateSchedule({ organizationId, time, timezone, weekdays, enabled }).unwrap();
      toast.success('Schedule saved');
      onClose();
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to save schedule');
    }
  }

  const commonTimezones = [
    'UTC',
    'America/New_York',
    'America/Los_Angeles',
    'America/Chicago',
    'Europe/London',
    'Europe/Berlin',
    'Africa/Lagos',
    'Asia/Kolkata',
    'Asia/Singapore',
    'Asia/Tokyo',
    'Australia/Sydney',
  ];

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Daily report schedule</DialogTitle>
      </DialogHeader>
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Send reminders</Label>
              <p className="text-xs text-muted-foreground">Email and in-app notifications to pending members</p>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>
          <div>
            <Label htmlFor="schedule-time" className="text-sm font-medium">Time</Label>
            <Input
              id="schedule-time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="mt-1.5 w-auto"
            />
          </div>
          <div>
            <Label htmlFor="schedule-timezone" className="text-sm font-medium">Timezone</Label>
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger id="schedule-timezone" className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {commonTimezones.map((tz) => (
                  <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-sm font-medium">Days of the week</Label>
            <div className="flex flex-wrap gap-2 mt-1.5">
              {WEEKDAYS.map((day) => {
                const active = weekdays.includes(day.value);
                return (
                  <button
                    type="button"
                    key={day.value}
                    onClick={() => toggleWeekday(day.value)}
                    className={`px-3 py-1.5 rounded-md border text-sm transition-colors ${
                      active
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background text-foreground border-border hover:bg-secondary'
                    }`}
                  >
                    {day.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} disabled={saving || isLoading}>
          {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Save
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
