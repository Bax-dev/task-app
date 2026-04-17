'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Plus,
  FolderOpen,
  Users,
  Zap,
  CheckSquare,
  CalendarDays,
  FileText,
  ArrowRight,
  BarChart3,
  Star,
  Activity,
  Pencil,
  Check,
  X,
  Layers,
  GripVertical,
  Loader2,
} from 'lucide-react';
import {
  useGetOrganizationsQuery,
  useGetUserTasksQuery,
  useGetProjectsQuery,
  useGetMeQuery,
  useCreateSpaceMutation,
} from '@/store/api';
import AiSummary from '@/components/ai/AiSummary';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  selectVisibleModuleCards,
  renameModuleCard,
  reorderModuleCards,
  type ModuleCard,
} from '@/store/slices/preferencesSlice';
import type { LucideIcon } from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  CheckSquare,
  CalendarDays,
  FileText,
  BarChart3,
  Star,
  Users,
  // Activity,
  FolderOpen,
};

const SPACE_COLORS = [
  '#7c3aed', '#2563eb', '#059669', '#d97706', '#dc2626',
  '#db2777', '#9333ea', '#0891b2', '#65a30d', '#ea580c',
];

interface DraggableCardProps {
  card: { id: string; name: string; href: string; icon: string };
  index: number;
  dragIndex: number | null;
  overIndex: number | null;
  onDragStart: (index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDragEnd: () => void;
  onDrop: (e: React.DragEvent) => void;
}

function DraggableModuleCard({
  card,
  index,
  dragIndex,
  overIndex,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop,
}: DraggableCardProps) {
  const dispatch = useAppDispatch();
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(card.name);
  const inputRef = useRef<HTMLInputElement>(null);
  const Icon = ICON_MAP[card.icon] || CheckSquare;
  const isDragging = dragIndex === index;
  const isOver = overIndex === index;

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const save = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== card.name) {
      dispatch(renameModuleCard({ id: card.id, name: trimmed }));
    } else {
      setEditValue(card.name);
    }
    setEditing(false);
  };

  const cancel = () => {
    setEditValue(card.name);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="bg-card border border-primary/40 rounded-lg p-2.5 flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Icon className="w-3.5 h-3.5 text-primary" />
        </div>
        <input
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') save();
            if (e.key === 'Escape') cancel();
          }}
          onBlur={save}
          className="flex-1 text-sm font-medium bg-transparent border-none outline-none text-foreground min-w-0"
          maxLength={20}
        />
        <button onClick={save} className="text-green-600 hover:text-green-700 flex-shrink-0">
          <Check className="w-3.5 h-3.5" />
        </button>
        <button onClick={cancel} className="text-muted-foreground hover:text-foreground flex-shrink-0">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div
      className={`group relative transition-all duration-150 ${isDragging ? 'opacity-40 scale-95' : ''} ${isOver ? 'ring-2 ring-primary ring-offset-1 ring-offset-background rounded-lg' : ''}`}
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDragEnd={onDragEnd}
      onDrop={onDrop}
    >
      <Link href={card.href}>
        <div className="bg-card border border-border rounded-lg p-2.5 flex items-center gap-2.5 hover:border-primary/40 hover:bg-secondary/30 transition-colors">
          <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Icon className="w-3.5 h-3.5 text-primary" />
          </div>
          <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate flex-1">
            {card.name}
          </span>
          <GripVertical className="w-3.5 h-3.5 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 cursor-grab" />
        </div>
      </Link>
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditing(true); }}
        className="absolute top-1 right-7 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground"
        title="Rename"
      >
        <Pencil className="w-3 h-3" />
      </button>
    </div>
  );
}

export default function DashboardPage() {
  const { data: user } = useGetMeQuery();
  const { data: organizations = [], isLoading: orgsLoading } = useGetOrganizationsQuery();
  const { data: tasks = [], isLoading: tasksLoading } = useGetUserTasksQuery();
  const { data: projects = [], error: projectsError } = useGetProjectsQuery();
  const allModuleCards = useAppSelector(selectVisibleModuleCards);
  const dispatch = useAppDispatch();

  const [localCards, setLocalCards] = useState<ModuleCard[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  useEffect(() => {
    setLocalCards(allModuleCards);
  }, [allModuleCards]);

  const handleDragStart = useCallback((index: number) => setDragIndex(index), []);
  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    setOverIndex(index);
  }, []);
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (dragIndex === null || overIndex === null || dragIndex === overIndex) {
      setDragIndex(null);
      setOverIndex(null);
      return;
    }
    const updated = [...localCards];
    const [moved] = updated.splice(dragIndex, 1);
    updated.splice(overIndex, 0, moved);
    setLocalCards(updated);
    dispatch(reorderModuleCards(updated));
    setDragIndex(null);
    setOverIndex(null);
  }, [dragIndex, overIndex, localCards, dispatch]);
  const handleDragEnd = useCallback(() => {
    setDragIndex(null);
    setOverIndex(null);
  }, []);

  const [spaceDialogOpen, setSpaceDialogOpen] = useState(false);
  const [spaceName, setSpaceName] = useState('');
  const [spaceColor, setSpaceColor] = useState('#7c3aed');
  const [spaceOrgId, setSpaceOrgId] = useState('');
  const [createSpace, { isLoading: isCreatingSpace }] = useCreateSpaceMutation();

  const handleCreateSpace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!spaceName.trim() || !spaceOrgId) return;
    try {
      await createSpace({ name: spaceName.trim(), color: spaceColor, organizationId: spaceOrgId }).unwrap();
      toast.success('Space created');
      setSpaceDialogOpen(false);
      setSpaceName('');
      setSpaceColor('#7c3aed');
      setSpaceOrgId('');
    } catch (error: any) {
      toast.error(error?.data?.error || error?.message || 'Failed to create space');
    }
  };

  const stats = useMemo(() => {
    const now = Date.now();
    const threeDays = now + 3 * 24 * 60 * 60 * 1000;
    let done = 0, inProgress = 0, todo = 0, cancelled = 0, dueSoon = 0, overdue = 0;
    for (const t of tasks as any[]) {
      if (t.status === 'DONE') done++;
      else if (t.status === 'IN_PROGRESS') inProgress++;
      else if (t.status === 'CANCELLED') cancelled++;
      else todo++;
      if (t.dueDate && t.status !== 'DONE' && t.status !== 'CANCELLED') {
        const due = new Date(t.dueDate).getTime();
        if (due < now) overdue++;
        else if (due <= threeDays) dueSoon++;
      }
    }
    const totalMembers = (organizations as any[]).reduce((s, o) => s + (o._count?.memberships || 0), 0);
    const totalSpaces = (organizations as any[]).reduce((s, o) => s + (o._count?.spaces || 0), 0);
    const completion = tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0;
    return { done, inProgress, todo, cancelled, dueSoon, overdue, totalMembers, totalSpaces, completion };
  }, [tasks, organizations]);

  const isLoading = orgsLoading || tasksLoading;

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const recentTasks = (tasks as any[]).slice(0, 5);
  const recentProjects = (projects as any[]).slice(0, 4);
  const firstName = user?.name?.split(' ')[0] || '';
  const nowTs = Date.now();

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <div className="space-y-5">
        {/* Compact header */}
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
              {getGreeting()}{firstName ? `, ${firstName}` : ''}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {organizations.length > 0 && projects.length > 0 && (
              <Link href={`/projects/${projects[0]?.id}/tasks/new`}>
                <Button size="sm" className="gap-1.5 h-8">
                  <Plus className="w-3.5 h-3.5" />
                  New Task
                </Button>
              </Link>
            )}
            {organizations.length > 0 && (
              <Dialog open={spaceDialogOpen} onOpenChange={setSpaceDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5 h-8">
                    <Layers className="w-3.5 h-3.5" />
                    New Space
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[520px] p-0 gap-0 overflow-hidden">
                  <form onSubmit={handleCreateSpace}>
                    <input
                      value={spaceName}
                      onChange={(e) => setSpaceName(e.target.value)}
                      placeholder="Space name"
                      className="w-full border-0 bg-transparent text-lg font-semibold h-auto py-4 px-5 placeholder:text-muted-foreground/50 focus:outline-none"
                      required
                      autoFocus
                    />
                    <div className="border-t border-border" />
                    <div className="px-5 py-3 space-y-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-muted-foreground">Organization</Label>
                        <Select value={spaceOrgId} onValueChange={setSpaceOrgId}>
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Select organization" />
                          </SelectTrigger>
                          <SelectContent>
                            {(organizations as any[]).map((org) => (
                              <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-muted-foreground">Color</Label>
                        <div className="flex gap-2 flex-wrap">
                          {SPACE_COLORS.map((c) => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => setSpaceColor(c)}
                              className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${spaceColor === c ? 'border-foreground scale-110' : 'border-transparent'}`}
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="border-t border-border px-5 py-3 flex justify-end">
                      <Button type="submit" disabled={isCreatingSpace || !spaceName.trim() || !spaceOrgId} size="sm" className="gap-1.5">
                        {isCreatingSpace ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                        {isCreatingSpace ? 'Creating' : 'Create'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}
            <Link href="/organizations/new">
              <Button variant="outline" size="sm" className="gap-1.5 h-8">
                <Plus className="w-3.5 h-3.5" />
                New Org
              </Button>
            </Link>
          </div>
        </header>

        {/* KPI strip */}
        <section className="grid gap-3 grid-cols-2 md:grid-cols-4">
          <StatCard
            label="Organizations"
            value={organizations.length}
            meta={`${stats.totalSpaces} spaces`}
            icon={<Users className="w-4 h-4" />}
            href="/organizations"
            tone="sky"
          />
          <StatCard
            label="Projects"
            value={projectsError ? '—' : projects.length}
            meta={projectsError ? 'Unavailable' : `${tasks.length} tasks`}
            icon={<FolderOpen className="w-4 h-4" />}
            href="/projects"
            tone="blue"
          />
          <StatCard
            label="In Progress"
            value={stats.inProgress}
            meta={stats.dueSoon > 0 ? `${stats.dueSoon} due soon` : '—'}
            icon={<Zap className="w-4 h-4" />}
            href="/tasks"
            tone="amber"
          />
          <StatCard
            label="Completed"
            value={stats.done}
            meta={tasks.length > 0 ? `${stats.completion}% rate` : '—'}
            icon={<CheckSquare className="w-4 h-4" />}
            href="/tasks"
            tone="emerald"
          />
        </section>

        {/* Progress + deadlines */}
        {tasks.length > 0 && (
          <section className="grid gap-3 lg:grid-cols-[1.6fr_1fr]">
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-foreground">Progress</span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {stats.done}/{tasks.length} · {stats.completion}%
                </span>
              </div>
              <div className="flex h-2 overflow-hidden rounded-full bg-muted">
                {stats.done > 0 && <div className="bg-green-500" style={{ width: `${(stats.done / tasks.length) * 100}%` }} />}
                {stats.inProgress > 0 && <div className="bg-amber-500" style={{ width: `${(stats.inProgress / tasks.length) * 100}%` }} />}
                {stats.todo > 0 && <div className="bg-slate-400" style={{ width: `${(stats.todo / tasks.length) * 100}%` }} />}
                {stats.cancelled > 0 && <div className="bg-zinc-300" style={{ width: `${(stats.cancelled / tasks.length) * 100}%` }} />}
              </div>
              <div className="mt-3 grid grid-cols-4 gap-2 text-xs">
                <LegendItem dotClass="bg-green-500" label="Done" value={stats.done} />
                <LegendItem dotClass="bg-amber-500" label="In progress" value={stats.inProgress} />
                <LegendItem dotClass="bg-slate-400" label="To do" value={stats.todo} />
                <LegendItem dotClass="bg-zinc-300" label="Cancelled" value={stats.cancelled} />
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-foreground">Deadlines</span>
              </div>
              <div className="space-y-2">
                <DeadlineRow href="/calendar" tone={stats.dueSoon > 0 ? 'amber' : 'slate'} label="Due in 3 days" value={stats.dueSoon} />
                <DeadlineRow href="/tasks" tone={stats.overdue > 0 ? 'red' : 'slate'} label="Overdue" value={stats.overdue} />
                <DeadlineRow href="/team" tone="slate" label="Members" value={stats.totalMembers} />
              </div>
            </div>
          </section>
        )}

        {/* Module quick actions */}
        {organizations.length > 0 && localCards.length > 0 && (
          <section className="rounded-xl border border-border bg-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Quick actions</span>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
              {localCards.map((card, i) => (
                <DraggableModuleCard
                  key={card.id}
                  card={card}
                  index={i}
                  dragIndex={dragIndex}
                  overIndex={overIndex}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDragEnd={handleDragEnd}
                  onDrop={handleDrop}
                />
              ))}
            </div>
          </section>
        )}

        {organizations.length > 0 && (
          <section>
            <AiSummary organizationId={organizations[0].id} type="daily" />
          </section>
        )}

        {/* Lists */}
        {organizations.length === 0 ? (
          <EmptyWorkspaceState />
        ) : (
          <section className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-xl border border-border bg-card p-4 lg:col-span-1">
              <SectionHeader title="Recent tasks" href="/tasks" />
              {recentTasks.length > 0 ? (
                <div className="mt-3 space-y-1">
                  {recentTasks.map((task: any) => (
                    <Link key={task.id} href={`/projects/${task.projectId}/tasks/${task.id}`}>
                      <div className="group flex items-start gap-2.5 rounded-lg px-2.5 py-2 hover:bg-secondary/40 transition-colors">
                        <span className={`mt-1.5 h-2 w-2 rounded-full flex-shrink-0 ${statusDot(task.status)}`} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <p className="truncate text-sm font-medium text-foreground group-hover:text-primary">
                              {task.title}
                            </p>
                            {task.priority && task.priority !== 'MEDIUM' && (
                              <span className={`rounded px-1.5 py-0 text-[10px] font-semibold uppercase tracking-wider flex-shrink-0 ${priorityClass(task.priority)}`}>
                                {task.priority}
                              </span>
                            )}
                          </div>
                          <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground truncate">
                            <span className="truncate">{task.project?.name || 'Untitled'}</span>
                            {task.dueDate && (
                              <span className={new Date(task.dueDate).getTime() < nowTs && task.status !== 'DONE' ? 'font-medium text-red-500' : ''}>
                                · {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <EmptyInline icon={<CheckSquare className="w-8 h-8" />} title="No tasks yet">
                  {projects.length > 0 ? (
                    <Link href={`/projects/${projects[0]?.id}/tasks/new`}>
                      <Button size="sm" variant="outline" className="gap-1.5">
                        <Plus className="w-3.5 h-3.5" />
                        Create task
                      </Button>
                    </Link>
                  ) : (
                    <Link href="/projects">
                      <Button size="sm" variant="outline" className="gap-1.5">
                        <FolderOpen className="w-3.5 h-3.5" />
                        Open projects
                      </Button>
                    </Link>
                  )}
                </EmptyInline>
              )}
            </div>

            <div className="rounded-xl border border-border bg-card p-4">
              <SectionHeader title="Projects" href="/projects" />
              {recentProjects.length > 0 ? (
                <div className="mt-3 space-y-1">
                  {recentProjects.map((project: any) => (
                    <Link key={project.id} href={`/projects/${project.id}`}>
                      <div className="group flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 hover:bg-secondary/40 transition-colors">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground group-hover:text-primary">
                            {project.name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {project.space?.name || 'Space'} · {project._count?.tasks || 0} tasks
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="mt-3 px-2 py-4 text-xs text-muted-foreground">No projects yet.</p>
              )}
            </div>

            <div className="rounded-xl border border-border bg-card p-4">
              <SectionHeader title="Organizations" href="/organizations" />
              <div className="mt-3 space-y-1">
                {(organizations as any[]).slice(0, 5).map((org) => (
                  <Link key={org.id} href={`/organizations/${org.id}`}>
                    <div className="group flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 hover:bg-secondary/40 transition-colors">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground group-hover:text-primary">
                          {org.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {org._count?.spaces || 0} spaces · {org._count?.memberships || 0} members
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  meta,
  icon,
  href,
  tone = 'sky',
}: {
  label: string;
  value: string | number;
  meta: string;
  icon: React.ReactNode;
  href: string;
  tone?: 'sky' | 'blue' | 'amber' | 'emerald';
}) {
  const tones = {
    sky: 'bg-sky-500/10 text-sky-600 group-hover:border-sky-500/40',
    blue: 'bg-blue-500/10 text-blue-600 group-hover:border-blue-500/40',
    amber: 'bg-amber-500/10 text-amber-600 group-hover:border-amber-500/40',
    emerald: 'bg-emerald-500/10 text-emerald-600 group-hover:border-emerald-500/40',
  };
  const borderTones = {
    sky: 'hover:border-sky-500/40',
    blue: 'hover:border-blue-500/40',
    amber: 'hover:border-amber-500/40',
    emerald: 'hover:border-emerald-500/40',
  };
  return (
    <Link href={href} className="group">
      <div className={`rounded-xl border border-border bg-card p-3.5 transition-colors h-full ${borderTones[tone]}`}>
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">{label}</span>
          <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${tones[tone]}`}>
            {icon}
          </div>
        </div>
        <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">{value}</p>
        <p className="mt-0.5 text-xs text-muted-foreground truncate">{meta}</p>
      </div>
    </Link>
  );
}

function LegendItem({ dotClass, label, value }: { dotClass: string; label: string; value: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-full ${dotClass}`} />
      <span className="text-muted-foreground truncate">{label}</span>
      <span className="ml-auto font-medium tabular-nums text-foreground">{value}</span>
    </div>
  );
}

function DeadlineRow({ href, tone, label, value }: { href: string; tone: 'amber' | 'red' | 'slate'; label: string; value: number }) {
  const tones = {
    amber: 'text-amber-600',
    red: 'text-red-600',
    slate: 'text-foreground',
  };
  return (
    <Link href={href}>
      <div className="flex items-center justify-between rounded-lg px-2.5 py-2 hover:bg-secondary/40 transition-colors">
        <span className="text-sm text-foreground">{label}</span>
        <span className={`text-base font-semibold tabular-nums ${tones[tone]}`}>{value}</span>
      </div>
    </Link>
  );
}

function SectionHeader({ title, href }: { title: string; href: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium text-foreground">{title}</span>
      <Link href={href} className="text-xs text-muted-foreground hover:text-primary flex items-center gap-0.5">
        View all
        <ArrowRight className="w-3 h-3" />
      </Link>
    </div>
  );
}

function EmptyInline({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="mt-3 rounded-lg border border-dashed border-border px-4 py-6 text-center">
      <div className="mx-auto mb-2 text-muted-foreground">{icon}</div>
      <p className="text-sm font-medium text-foreground">{title}</p>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function EmptyWorkspaceState() {
  return (
    <div className="rounded-xl border border-border bg-card p-8 text-center">
      <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-primary/10">
        <FolderOpen className="h-5 w-5 text-primary" />
      </div>
      <h3 className="text-lg font-semibold tracking-tight text-foreground">Build your workspace</h3>
      <p className="mt-1 text-sm text-muted-foreground">Start with an organization to unlock spaces and projects.</p>
      <div className="mt-4">
        <Link href="/organizations/new">
          <Button size="sm" className="gap-1.5">
            <Plus className="w-3.5 h-3.5" />
            Create organization
          </Button>
        </Link>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <Skeleton className="h-7 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
        <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <div className="grid gap-3 lg:grid-cols-[1.6fr_1fr]">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
        <Skeleton className="h-32 rounded-xl" />
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

function statusDot(status: string) {
  if (status === 'DONE') return 'bg-green-500';
  if (status === 'IN_PROGRESS') return 'bg-amber-500';
  if (status === 'CANCELLED') return 'bg-zinc-400';
  return 'bg-slate-400';
}

function priorityClass(priority: string) {
  if (priority === 'URGENT') return 'bg-red-500/10 text-red-600';
  if (priority === 'HIGH') return 'bg-orange-500/10 text-orange-600';
  if (priority === 'LOW') return 'bg-blue-500/10 text-blue-600';
  return 'bg-muted text-muted-foreground';
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}
