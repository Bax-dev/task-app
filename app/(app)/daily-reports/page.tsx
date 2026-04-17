'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  CalendarCheck,
  CheckCircle2,
  ChevronDown,
  Clock,
  Goal,
  Loader2,
  Plus,
  Settings2,
  Shield,
  Target,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
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
import RichTextEditor from '@/components/notes/editor/RichTextEditor';
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

function initialsOf(name?: string | null, email?: string): string {
  const source = name?.trim() || email || '?';
  return source
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || '?';
}

function isHtml(value: string): boolean {
  return /<\/?[a-z][\s\S]*>/i.test(value);
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
}

export default function DailyReportsPage() {
  const { user } = useAuth();
  const [selectedOrg, setSelectedOrg] = useState('');
  const [reportDate, setReportDate] = useState(todayIso());
  const [whatDid, setWhatDid] = useState('');
  const [blockers, setBlockers] = useState('');
  const [goalTomorrow, setGoalTomorrow] = useState('');
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [openSection, setOpenSection] = useState<'whatDid' | 'blockers' | 'goalTomorrow' | null>('whatDid');

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

  const submittedCount = overview?.submittedCount ?? 0;
  const memberCount = overview?.memberCount ?? 0;
  const completionPct = memberCount > 0 ? Math.round((submittedCount / memberCount) * 100) : 0;

  const pendingMembers = useMemo(() => {
    if (!isAdmin || !overview) return [];
    const submittedIds = new Set(overview.reports.map((r) => r.createdBy.id));
    return members.filter((m: any) => !submittedIds.has(m.id) && m.role !== 'GUEST');
  }, [isAdmin, overview, members]);

  const whatDidText = stripHtml(whatDid);
  const goalText = stripHtml(goalTomorrow);
  const canSubmit = whatDidText.length > 0 && goalText.length > 0;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedOrg || !canSubmit) return;
    try {
      await submitReport({
        organizationId: selectedOrg,
        reportDate,
        whatDid: whatDid.trim(),
        blockers: stripHtml(blockers).length > 0 ? blockers.trim() : null,
        goalTomorrow: goalTomorrow.trim(),
      }).unwrap();
      toast.success(myReport ? 'Report updated' : 'Report submitted');
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to submit report');
    }
  }

  if (orgsLoading) {
    return <DailyReportsSkeleton />;
  }

  if (organizations.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <CalendarCheck className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <h2 className="text-sm font-medium text-foreground mb-1">No organizations</h2>
          <p className="text-xs text-muted-foreground">Join or create one to use daily reports.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-5">
      {/* Compact header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-500/10 text-teal-600">
            <CalendarCheck className="h-4 w-4" />
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">Daily Reports</h1>
          {isAdmin && (
            <span className="text-xs text-muted-foreground tabular-nums">
              {submittedCount}/{memberCount} · {completionPct}%
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedOrg} onValueChange={setSelectedOrg}>
            <SelectTrigger className="h-8 w-[180px]">
              <SelectValue placeholder="Organization" />
            </SelectTrigger>
            <SelectContent>
              {organizations.map((org: any) => (
                <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isAdmin && (
            <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1.5">
                  <Settings2 className="w-3.5 h-3.5" />
                  Schedule
                </Button>
              </DialogTrigger>
              <ScheduleDialog organizationId={selectedOrg} onClose={() => setScheduleOpen(false)} />
            </Dialog>
          )}
        </div>
      </div>

      {/* Date selector + status chip */}
      <div className="flex flex-wrap items-center gap-2">
        <Input
          id="report-date"
          type="date"
          value={reportDate}
          onChange={(e) => setReportDate(e.target.value)}
          max={todayIso()}
          className="h-8 w-auto"
        />
        {reportDate !== todayIso() && (
          <Button variant="ghost" size="sm" onClick={() => setReportDate(todayIso())} className="h-8 text-xs">
            Today
          </Button>
        )}
        <span className="text-xs text-muted-foreground">{formatDateLabel(reportDate)}</span>
        <div className="ml-auto">
          {myReport ? (
            <Badge variant="secondary" className="bg-green-500/10 text-green-700 border-green-500/20">
              <CheckCircle2 className="w-3 h-3" />
              Submitted
            </Badge>
          ) : (
            <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-700">
              <Clock className="w-3 h-3" />
              Pending
            </Badge>
          )}
        </div>
      </div>

      {/* Submit card */}
      <form onSubmit={handleSubmit}>
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="p-3 sm:p-4 space-y-2.5">
            <EditorSection
              icon={<Target className="w-3.5 h-3.5 text-primary" />}
              label="What did you do today?"
              required
              preview={stripHtml(whatDid)}
              open={openSection === 'whatDid'}
              onOpenChange={(next) => setOpenSection(next ? 'whatDid' : null)}
            >
              <RichTextEditor content={whatDid} onChange={setWhatDid} placeholder="Summarize your work…" minHeight={120} />
            </EditorSection>

            <EditorSection
              icon={<Shield className="w-3.5 h-3.5 text-amber-600" />}
              label="Blockers"
              preview={stripHtml(blockers)}
              open={openSection === 'blockers'}
              onOpenChange={(next) => setOpenSection(next ? 'blockers' : null)}
            >
              <RichTextEditor content={blockers} onChange={setBlockers} placeholder="Anything blocking you?" minHeight={100} />
            </EditorSection>

            <EditorSection
              icon={<Goal className="w-3.5 h-3.5 text-emerald-600" />}
              label="Goal for tomorrow"
              required
              preview={stripHtml(goalTomorrow)}
              open={openSection === 'goalTomorrow'}
              onOpenChange={(next) => setOpenSection(next ? 'goalTomorrow' : null)}
            >
              <RichTextEditor content={goalTomorrow} onChange={setGoalTomorrow} placeholder="What you'll focus on…" minHeight={100} />
            </EditorSection>
          </div>

          <div className="px-4 py-2.5 border-t border-border bg-muted/20 flex items-center justify-end">
            <Button type="submit" size="sm" disabled={submitting || !canSubmit}>
              {submitting && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
              {myReport ? 'Update' : 'Submit'}
            </Button>
          </div>
        </div>
      </form>

      {/* Team reports */}
      {isAdmin && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">Team reports</h2>
              <span className="text-xs text-muted-foreground tabular-nums">
                {submittedCount}/{memberCount}
              </span>
            </div>
            <div className="text-xs font-semibold text-foreground tabular-nums">{completionPct}%</div>
          </div>
          <Progress value={completionPct} className="h-1 rounded-none" />

          <div className="divide-y divide-border">
            {overviewLoading ? (
              <div className="p-4 space-y-2">
                {[0, 1, 2].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : overview && overview.reports.length > 0 ? (
              overview.reports.map((report) => <ReportCard key={report.id} report={report} />)
            ) : (
              <div className="text-center py-8 px-4">
                <CalendarCheck className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">No reports yet.</p>
              </div>
            )}
          </div>

          {pendingMembers.length > 0 && (
            <div className="px-4 py-3 border-t border-border bg-muted/20">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground">Pending</span>
                {pendingMembers.map((m: any) => (
                  <div key={m.id} className="inline-flex items-center gap-1.5 rounded-md bg-background border border-border px-1.5 py-0.5">
                    <Avatar className="h-4 w-4">
                      <AvatarFallback className="text-[8px] bg-amber-500/10 text-amber-700">
                        {initialsOf(m.name, m.email)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-foreground">{m.name || m.email}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DailyReportsSkeleton() {
  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-5">
      <div className="flex justify-between">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-8 w-40" />
      </div>
      <Skeleton className="h-8 w-80" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}

function EditorSection({
  icon,
  label,
  required,
  preview,
  open,
  onOpenChange,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  required?: boolean;
  preview?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}) {
  const hasContent = !!preview && preview.trim().length > 0;

  return (
    <Collapsible open={open} onOpenChange={onOpenChange} className="rounded-lg border border-border bg-background">
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left hover:bg-muted/40 transition-colors rounded-lg"
        >
          <div className="flex items-center gap-2 min-w-0">
            {icon}
            <Label className="text-xs font-medium cursor-pointer flex-shrink-0">
              {label}
              {required && <span className="text-red-500 ml-0.5">*</span>}
            </Label>
            {hasContent && !open && (
              <span className="text-xs text-muted-foreground truncate">· {preview}</span>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {!hasContent && !open && <Plus className="w-3.5 h-3.5 text-muted-foreground" />}
            <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
          </div>
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="px-2 pb-2">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function ReportContent({ value }: { value: string }) {
  if (!value) return <p className="text-sm text-muted-foreground italic">—</p>;
  if (isHtml(value)) {
    return (
      <div
        className="prose prose-sm dark:prose-invert max-w-none text-foreground"
        dangerouslySetInnerHTML={{ __html: value }}
      />
    );
  }
  return <p className="whitespace-pre-wrap text-sm text-foreground leading-relaxed">{value}</p>;
}

function ReportCard({
  report,
}: {
  report: {
    id: string;
    whatDid: string;
    blockers: string | null;
    goalTomorrow: string;
    submittedAt: string;
    createdBy: { id: string; name: string | null; email: string };
  };
}) {
  const [open, setOpen] = useState(true);
  const displayName = report.createdBy.name || report.createdBy.email;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="w-full px-4 py-2.5 hover:bg-muted/30 transition-colors">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <Avatar className="h-7 w-7 shrink-0">
              <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold">
                {initialsOf(report.createdBy.name, report.createdBy.email)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 text-left">
              <p className="text-sm font-medium text-foreground truncate">{displayName}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(report.submittedAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
          <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-3 gap-2.5">
          <ReportBlock icon={<Target className="w-3 h-3 text-primary" />} label="Did" value={report.whatDid} />
          <ReportBlock icon={<Shield className="w-3 h-3 text-amber-600" />} label="Blockers" value={report.blockers || ''} muted />
          <ReportBlock icon={<Goal className="w-3 h-3 text-emerald-600" />} label="Tomorrow" value={report.goalTomorrow} />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function ReportBlock({
  icon,
  label,
  value,
  muted,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className={`rounded-xl border border-border p-3 ${muted ? 'bg-muted/30' : 'bg-background'}`}>
      <div className="flex items-center gap-1.5 mb-2 text-[11px] uppercase font-semibold tracking-wide text-muted-foreground">
        {icon}
        {label}
      </div>
      <ReportContent value={value} />
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
    setEnabled(true);
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
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Reminder schedule</DialogTitle>
      </DialogHeader>
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
            <Label className="text-sm">Send reminders</Label>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="schedule-time" className="text-sm font-medium">Time</Label>
              <Input
                id="schedule-time"
                type="time"
                value={time}
                onChange={(e) => {
                  setTime(e.target.value);
                  setEnabled(true);
                }}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="schedule-timezone" className="text-sm font-medium">Timezone</Label>
              <Select
                value={timezone}
                onValueChange={(value) => {
                  setTimezone(value);
                  setEnabled(true);
                }}
              >
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
          </div>
          <div>
            <Label className="text-sm font-medium">Active days</Label>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {WEEKDAYS.map((day) => {
                const active = weekdays.includes(day.value);
                return (
                  <button
                    type="button"
                    key={day.value}
                    onClick={() => toggleWeekday(day.value)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                      active
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground'
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
          Save schedule
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
