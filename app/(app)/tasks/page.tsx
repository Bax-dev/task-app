'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { LoadMore } from '@/components/ui/load-more';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  AlertCircle,
  AtSign,
  Bug,
  Bookmark,
  CalendarClock,
  CheckCircle,
  Circle,
  Layers,
  Loader2,
  Plus,
  Search,
  Square,
  Star,
  Target,
  Triangle,
  X,
  XCircle,
  Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ViewToggle } from '@/components/ui/view-toggle';
import { Switch } from '@/components/ui/switch';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setView, selectView } from '@/store/slices/viewSlice';
import { selectDueSoonEnabled } from '@/store/slices/preferencesSlice';
import { toast } from 'sonner';
import {
  useCreateTaskMutation,
  useGetOrgIssueTypesQuery,
  useGetOrgMembersQuery,
  useGetProjectsQuery,
  useGetUserTasksPageInfiniteQuery,
  useUpdateTaskMutation,
} from '@/store/api';
import AiTaskSuggestion from '@/components/ai/AiTaskSuggestion';
import type { Member } from '@/types/organization';

const ICON_MAP: Record<string, LucideIcon> = {
  circle: Circle,
  square: Square,
  triangle: Triangle,
  star: Star,
  zap: Zap,
  bug: Bug,
  bookmark: Bookmark,
  target: Target,
  layers: Layers,
};

const TASK_PREFS_KEY = 'taskflow:task-page-prefs';

type SortMode = 'due-soon' | 'urgent-first' | 'recently-updated' | 'alphabetical';

type TaskPrefs = {
  quickSpaceId?: string;
  quickProjectId?: string;
  createSpaceId?: string;
  createProjectId?: string;
};

function getTaskSpaceOptions(projects: any[]) {
  const spaces = new Map<
    string,
    {
      id: string;
      name: string;
      organizationId: string;
      organizationName?: string;
    }
  >();

  projects.forEach((project: any) => {
    if (!project.space?.id || spaces.has(project.space.id)) return;
    spaces.set(project.space.id, {
      id: project.space.id,
      name: project.space.name,
      organizationId: project.space.organizationId,
      organizationName: project.space.organization?.name,
    });
  });

  return Array.from(spaces.values()).sort((a, b) => a.name.localeCompare(b.name));
}

function loadTaskPrefs(): TaskPrefs {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(window.localStorage.getItem(TASK_PREFS_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveTaskPrefs(nextPrefs: Partial<TaskPrefs>) {
  if (typeof window === 'undefined') return;
  const current = loadTaskPrefs();
  window.localStorage.setItem(TASK_PREFS_KEY, JSON.stringify({ ...current, ...nextPrefs }));
}

export default function TasksPage() {
  const dispatch = useAppDispatch();
  const view = useAppSelector(selectView('tasks'));
  const dueSoonEnabled = useAppSelector(selectDueSoonEnabled);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sortMode, setSortMode] = useState<SortMode>(
    dueSoonEnabled ? 'due-soon' : 'recently-updated'
  );
  const [open, setOpen] = useState(false);
  const [selectedAssignees, setSelectedAssignees] = useState<Set<string>>(new Set());
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());

  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Status, search and sort run server-side so they cover every task, not just loaded pages.
  const {
    data: taskPages,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useGetUserTasksPageInfiniteQuery({
    status: statusFilter === 'ALL' ? undefined : statusFilter,
    q: debouncedSearch || undefined,
    sort: sortMode,
  });
  const tasks = useMemo(() => taskPages?.pages.flatMap((page) => page.items) ?? [], [taskPages]);
  const statusCounts = taskPages?.pages[0]?.statusCounts ?? {};
  const totalCount = Object.values(statusCounts).reduce((sum: number, n) => sum + (n ?? 0), 0);
  const { data: projects = [] } = useGetProjectsQuery();
  const [updateTask] = useUpdateTaskMutation();

  const allAssignees = useMemo(() => {
    const map = new Map<string, { id: string; name: string | null; email: string }>();
    tasks.forEach((task: any) => {
      task.assignments?.forEach((assignment: any) => {
        if (!map.has(assignment.user.id)) map.set(assignment.user.id, assignment.user);
      });
    });
    return Array.from(map.values()).sort((a, b) =>
      (a.name || a.email).localeCompare(b.name || b.email)
    );
  }, [tasks]);

  // The people filter applies to loaded tasks only (assignee options come from loaded tasks too).
  const filteredByAssignee = useMemo(() => {
    if (selectedAssignees.size === 0) return tasks;
    return tasks.filter((task: any) =>
      task.assignments?.some((assignment: any) => selectedAssignees.has(assignment.user.id))
    );
  }, [tasks, selectedAssignees]);

  const groupedTasks = useMemo(() => {
    const groups: Record<string, any[]> = { TODO: [], IN_PROGRESS: [], DONE: [], REJECTED: [], CANCELLED: [] };
    for (const task of filteredByAssignee as any[]) {
      const key = groups[task.status] ? task.status : 'TODO';
      groups[key].push(task);
    }
    return [
      { key: 'TODO', label: 'To Do', tasks: groups.TODO, dot: 'bg-blue-500', icon: Circle },
      { key: 'IN_PROGRESS', label: 'In Progress', tasks: groups.IN_PROGRESS, dot: 'bg-amber-500', icon: AlertCircle },
      { key: 'DONE', label: 'Done', tasks: groups.DONE, dot: 'bg-green-500', icon: CheckCircle },
      { key: 'REJECTED', label: 'Rejected', tasks: groups.REJECTED, dot: 'bg-red-500', icon: XCircle },
      { key: 'CANCELLED', label: 'Cancelled', tasks: groups.CANCELLED, dot: 'bg-slate-400', icon: XCircle },
    ];
  }, [filteredByAssignee]);

  const focusStats = useMemo(() => {
    let dueSoon = 0, urgent = 0;
    for (const task of filteredByAssignee as any[]) {
      if (task.status === 'DONE') continue;
      if (task.dueDate) dueSoon++;
      if (task.priority === 'URGENT') urgent++;
    }
    return { dueSoon, urgent };
  }, [filteredByAssignee]);

  const visibleSections = statusFilter === 'ALL'
    ? groupedTasks
    : groupedTasks.filter((section) => section.key === statusFilter);
  const populatedSections = visibleSections.filter((section) => section.tasks.length > 0);
  const visibleTaskIds = populatedSections.flatMap((section) => section.tasks.map((task: any) => task.id));
  const allVisibleSelected = visibleTaskIds.length > 0 && visibleTaskIds.every((taskId) => selectedTaskIds.has(taskId));

  const activeFilterCount =
    (statusFilter !== 'ALL' ? 1 : 0) +
    (selectedAssignees.size > 0 ? 1 : 0) +
    (search.trim() ? 1 : 0);

  const priorityColors: Record<string, string> = {
    URGENT: 'bg-red-500/10 text-red-700 border-red-200 dark:text-red-300 dark:border-red-900',
    HIGH: 'bg-orange-500/10 text-orange-700 border-orange-200 dark:text-orange-300 dark:border-orange-900',
    MEDIUM: 'bg-blue-500/10 text-blue-700 border-blue-200 dark:text-blue-300 dark:border-blue-900',
    LOW: 'bg-muted text-muted-foreground border-border',
  };

  useEffect(() => {
    if (!dueSoonEnabled && sortMode === 'due-soon') {
      setSortMode('recently-updated');
    }
    if (dueSoonEnabled && sortMode === 'recently-updated' && tasks.length === 0) {
      setSortMode('due-soon');
    }
  }, [dueSoonEnabled, sortMode, tasks.length]);

  async function updateTasksWithUndo(taskIds: string[], newStatus: string) {
    const snapshot = tasks
      .filter((task: any) => taskIds.includes(task.id))
      .map((task: any) => ({ id: task.id, status: task.status }));

    try {
      await Promise.all(
        taskIds.map((taskId) => updateTask({ id: taskId, status: newStatus }).unwrap())
      );

      if (taskIds.length === 1) {
        toast.success('Task updated', {
          action: snapshot[0]
            ? {
                label: 'Undo',
                onClick: async () => {
                  try {
                    await updateTask({ id: snapshot[0].id, status: snapshot[0].status }).unwrap();
                    toast.success('Change undone');
                  } catch (error: any) {
                    toast.error(error?.data?.message || error?.message || 'Failed to undo');
                  }
                },
              }
            : undefined,
        });
      } else {
        toast.success(`${taskIds.length} tasks updated`, {
          action: {
            label: 'Undo',
            onClick: async () => {
              try {
                await Promise.all(
                  snapshot.map((item) =>
                    updateTask({ id: item.id, status: item.status }).unwrap()
                  )
                );
                toast.success('Bulk change undone');
              } catch (error: any) {
                toast.error(error?.data?.message || error?.message || 'Failed to undo');
              }
            },
          },
        });
      }
    } catch (error: any) {
      toast.error(error?.data?.message || error?.message || 'Failed to update');
      throw error;
    }
  }

  async function handleStatusUpdate(taskId: string, newStatus: string) {
    try {
      await updateTasksWithUndo([taskId], newStatus);
    } catch {}
  }

  async function handleBulkStatusUpdate(newStatus: string) {
    if (selectedTaskIds.size === 0) return;
    try {
      await updateTasksWithUndo(Array.from(selectedTaskIds), newStatus);
      setSelectedTaskIds(new Set());
    } catch {}
  }

  function clearFilters() {
    setSearch('');
    setStatusFilter('ALL');
    setSelectedAssignees(new Set());
    setSortMode('due-soon');
  }

  function toggleTaskSelection(taskId: string) {
    setSelectedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  }

  if (isLoading) {
    return <TasksPageSkeleton />;
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col gap-4 mb-5">
        {/* Compact header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
              <CheckCircle className="h-4 w-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">My Tasks</h1>
            <span className="text-xs text-muted-foreground tabular-nums">
              {totalCount}{selectedTaskIds.size > 0 ? ` · ${selectedTaskIds.size} selected` : ''}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ViewToggle
              view={view}
              onViewChange={(mode) => dispatch(setView({ page: 'tasks', mode }))}
            />
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1.5 h-8">
                  <Plus className="w-3.5 h-3.5" />
                  New Task
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto p-5">
                <DialogHeader className="mb-1">
                  <DialogTitle className="text-base">Create a task</DialogTitle>
                </DialogHeader>
                <CreateTaskForm projects={projects} onCreated={() => setOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {projects.length > 0 && <QuickTaskAdd projects={projects} onOpenFullForm={() => setOpen(true)} />}

        {/* Filter bar with inline focus counts */}
        <div className="rounded-xl border border-border bg-card p-3 space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Search tasks, projects, issue types"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="pl-8 h-9"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {focusStats.urgent > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-md bg-red-500/10 px-2 py-1 text-xs font-medium text-red-600">
                  <Zap className="h-3 w-3" />
                  {focusStats.urgent} urgent
                </span>
              )}
              {dueSoonEnabled && focusStats.dueSoon > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-500/10 px-2 py-1 text-xs font-medium text-amber-600">
                  <CalendarClock className="h-3 w-3" />
                  {focusStats.dueSoon} dated
                </span>
              )}
              <Select value={sortMode} onValueChange={(value: SortMode) => setSortMode(value)}>
                <SelectTrigger className="w-[160px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {dueSoonEnabled && <SelectItem value="due-soon">Due Soon</SelectItem>}
                  <SelectItem value="urgent-first">Urgent First</SelectItem>
                  <SelectItem value="recently-updated">Recently Updated</SelectItem>
                  <SelectItem value="alphabetical">Alphabetical</SelectItem>
                </SelectContent>
              </Select>
              {activeFilterCount > 0 && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 gap-1">
                  <X className="h-3.5 w-3.5" />
                  Clear
                </Button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { key: 'ALL', label: 'All' },
              { key: 'TODO', label: 'To Do', dot: 'bg-blue-500' },
              { key: 'IN_PROGRESS', label: 'In Progress', dot: 'bg-amber-500' },
              { key: 'DONE', label: 'Done', dot: 'bg-green-500' },
              { key: 'REJECTED', label: 'Rejected', dot: 'bg-red-500' },
              { key: 'CANCELLED', label: 'Cancelled', dot: 'bg-slate-400' },
            ].map((filter) => (
              <button
                key={filter.key}
                onClick={() => setStatusFilter(filter.key)}
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  statusFilter === filter.key
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
              >
                {filter.dot && <span className={`h-1.5 w-1.5 rounded-full ${filter.dot}`} />}
                {filter.label}
                <span className="tabular-nums opacity-70">
                  {/* Server counts cover all tasks; with a people filter, count the loaded matches instead. */}
                  {selectedAssignees.size === 0
                    ? filter.key === 'ALL' ? totalCount : statusCounts[filter.key] ?? 0
                    : filter.key === 'ALL'
                      ? filteredByAssignee.length
                      : groupedTasks.find((section) => section.key === filter.key)?.tasks.length ?? 0}
                </span>
              </button>
            ))}
          </div>

          {allAssignees.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-border">
              <span className="text-xs text-muted-foreground pr-1">People</span>
              {allAssignees.map((user) => {
                const isSelected = selectedAssignees.has(user.id);
                return (
                  <button
                    key={user.id}
                    onClick={() =>
                      setSelectedAssignees((prev) => {
                        const next = new Set(prev);
                        if (next.has(user.id)) next.delete(user.id);
                        else next.add(user.id);
                        return next;
                      })
                    }
                    className={`inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-xs transition-colors ${
                      isSelected
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                    }`}
                    title={user.name || user.email}
                  >
                    <span
                      className={`flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-semibold ${
                        isSelected ? 'bg-primary text-primary-foreground' : 'bg-primary/15 text-primary'
                      }`}
                    >
                      {(user.name?.[0] || user.email[0]).toUpperCase()}
                    </span>
                    <span className="max-w-[90px] truncate">
                      {user.name || user.email.split('@')[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {visibleTaskIds.length > 0 && selectedTaskIds.size > 0 && (
          <div className="flex flex-col gap-2 rounded-lg border border-border bg-card px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 rounded border-border"
                  checked={allVisibleSelected}
                  onChange={() =>
                    setSelectedTaskIds((prev) => {
                      const next = new Set(prev);
                      if (allVisibleSelected) {
                        visibleTaskIds.forEach((taskId) => next.delete(taskId));
                      } else {
                        visibleTaskIds.forEach((taskId) => next.add(taskId));
                      }
                      return next;
                    })
                  }
                />
                {selectedTaskIds.size} selected
              </label>
            </div>
            <div className="flex flex-wrap items-center gap-1">
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleBulkStatusUpdate('TODO')}>To Do</Button>
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleBulkStatusUpdate('IN_PROGRESS')}>Start</Button>
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleBulkStatusUpdate('DONE')}>Done</Button>
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setSelectedTaskIds(new Set())}>Clear</Button>
            </div>
          </div>
        )}
      </div>

      {tasks.length === 0 && statusFilter === 'ALL' && !debouncedSearch ? (
        <TasksEmptyState onCreate={() => setOpen(true)} />
      ) : filteredByAssignee.length === 0 ? (
        <FilteredEmptyState onClear={clearFilters} onCreate={() => setOpen(true)} />
      ) : populatedSections.length === 0 ? (
        <FilteredEmptyState onClear={clearFilters} onCreate={() => setOpen(true)} />
      ) : view === 'grid' ? (
        <div className="space-y-8">
          {populatedSections.map((section) => (
            <TaskSection
              key={section.key}
              section={section}
              view="grid"
              priorityColors={priorityColors}
              onStatusUpdate={handleStatusUpdate}
              selectedTaskIds={selectedTaskIds}
              onToggleTaskSelection={toggleTaskSelection}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {populatedSections.map((section) => (
            <TaskSection
              key={section.key}
              section={section}
              view="list"
              priorityColors={priorityColors}
              onStatusUpdate={handleStatusUpdate}
              selectedTaskIds={selectedTaskIds}
              onToggleTaskSelection={toggleTaskSelection}
            />
          ))}
        </div>
      )}
      {selectedAssignees.size > 0 && hasNextPage && (
        <p className="pt-4 text-center text-xs text-muted-foreground">People filter applies to loaded tasks. Load more to include older ones.</p>
      )}
      <LoadMore hasMore={hasNextPage} loading={isFetchingNextPage} onLoadMore={() => fetchNextPage()} />
    </div>
  );
}

function TasksPageSkeleton() {
  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6">
      <div className="flex flex-col gap-4">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-5 w-80 max-w-full" />
      </div>
      <Skeleton className="h-20 w-full rounded-2xl" />
      <div className="grid gap-4 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-40 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

function TasksEmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <Empty className="border border-border bg-card rounded-xl">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <CheckCircle className="h-5 w-5" />
        </EmptyMedia>
        <EmptyTitle>No tasks yet</EmptyTitle>
      </EmptyHeader>
      <EmptyContent>
        <Button size="sm" onClick={onCreate} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          Create task
        </Button>
      </EmptyContent>
    </Empty>
  );
}

function FilteredEmptyState({
  onClear,
  onCreate,
}: {
  onClear: () => void;
  onCreate: () => void;
}) {
  return (
    <Empty className="border border-border bg-card rounded-xl">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Search className="h-5 w-5" />
        </EmptyMedia>
        <EmptyTitle>No matches</EmptyTitle>
      </EmptyHeader>
      <EmptyContent className="sm:flex-row sm:justify-center">
        <Button size="sm" variant="outline" onClick={onClear}>Clear filters</Button>
        <Button size="sm" onClick={onCreate} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          New task
        </Button>
      </EmptyContent>
    </Empty>
  );
}

function TaskSection({
  section,
  view,
  priorityColors,
  onStatusUpdate,
  selectedTaskIds,
  onToggleTaskSelection,
}: {
  section: any;
  view: 'grid' | 'list';
  priorityColors: Record<string, string>;
  onStatusUpdate: (taskId: string, newStatus: string) => void;
  selectedTaskIds: Set<string>;
  onToggleTaskSelection: (taskId: string) => void;
}) {
  const Icon = section.icon;

  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <div className={`h-2 w-2 rounded-full ${section.dot}`} />
        <h2 className="text-sm font-semibold text-foreground">{section.label}</h2>
        <span className="text-xs text-muted-foreground tabular-nums">{section.tasks.length}</span>
      </div>

      {section.tasks.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border px-3 py-4 text-xs text-muted-foreground flex items-center gap-2">
          <Icon className="h-3.5 w-3.5" />
          Empty
        </div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {section.tasks.map((task: any) => (
            <TaskGridCard
              key={task.id}
              task={task}
              priorityColors={priorityColors}
              onStatusUpdate={onStatusUpdate}
              selected={selectedTaskIds.has(task.id)}
              onToggleTaskSelection={onToggleTaskSelection}
            />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full min-w-[760px]">
            <thead className="bg-secondary/30 border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Task</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Project</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Priority</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Due</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Assignees</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Next step</th>
              </tr>
            </thead>
            <tbody>
              {section.tasks.map((task: any) => (
                <TaskListRow
                  key={task.id}
                  task={task}
                  priorityColors={priorityColors}
                  onStatusUpdate={onStatusUpdate}
                  selected={selectedTaskIds.has(task.id)}
                  onToggleTaskSelection={onToggleTaskSelection}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function TaskGridCard({
  task,
  priorityColors,
  onStatusUpdate,
  selected,
  onToggleTaskSelection,
}: {
  task: any;
  priorityColors: Record<string, string>;
  onStatusUpdate: (taskId: string, newStatus: string) => void;
  selected: boolean;
  onToggleTaskSelection: (taskId: string) => void;
}) {
  const isOverdue =
    task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE';

  return (
    <div
      className={`rounded-2xl border bg-card p-4 transition-colors hover:border-primary/40 ${
        selected
          ? 'border-primary ring-2 ring-primary/15'
          : isOverdue
            ? 'border-red-300 dark:border-red-900'
            : 'border-border'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 rounded border-border"
            checked={selected}
            onChange={() => onToggleTaskSelection(task.id)}
          />
          <div className="min-w-0">
          <Link
            href={`/projects/${task.projectId}/tasks/${task.id}`}
            className="text-sm font-semibold text-foreground hover:text-primary line-clamp-2"
          >
            {task.title}
          </Link>
          <p className="mt-1 text-xs text-muted-foreground truncate">
            {task.project?.name || 'No project'}
          </p>
          </div>
        </div>
        <Badge className={priorityColors[task.priority] || priorityColors.MEDIUM}>
          {task.priority || 'MEDIUM'}
        </Badge>
      </div>

      {task.description && (
        <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{task.description}</p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {task.issueType?.name && <Badge variant="outline">{task.issueType.name}</Badge>}
        {task.dueDate && (
          <Badge
            variant="outline"
            className={isOverdue ? 'border-red-300 text-red-700 dark:text-red-300' : ''}
          >
            {isOverdue ? 'Overdue' : 'Due'} {new Date(task.dueDate).toLocaleDateString()}
          </Badge>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <TaskAssignees task={task} />
        <TaskActions task={task} onStatusUpdate={onStatusUpdate} />
      </div>
    </div>
  );
}

function TaskListRow({
  task,
  priorityColors,
  onStatusUpdate,
  selected,
  onToggleTaskSelection,
}: {
  task: any;
  priorityColors: Record<string, string>;
  onStatusUpdate: (taskId: string, newStatus: string) => void;
  selected: boolean;
  onToggleTaskSelection: (taskId: string) => void;
}) {
  const isOverdue =
    task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE';

  return (
    <tr className={`border-b border-border last:border-b-0 hover:bg-secondary/20 ${selected ? 'bg-primary/5' : ''}`}>
      <td className="px-4 py-3">
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 rounded border-border"
            checked={selected}
            onChange={() => onToggleTaskSelection(task.id)}
          />
          <div>
            <Link
              href={`/projects/${task.projectId}/tasks/${task.id}`}
              className="text-sm font-medium text-foreground hover:text-primary"
            >
              {task.title}
            </Link>
            {task.description && (
              <p className="mt-1 max-w-md truncate text-xs text-muted-foreground">{task.description}</p>
            )}
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">{task.project?.name || '-'}</td>
      <td className="px-4 py-3">
        <Badge className={priorityColors[task.priority] || priorityColors.MEDIUM}>
          {task.priority || 'MEDIUM'}
        </Badge>
      </td>
      <td className="px-4 py-3 text-sm">
        {task.dueDate ? (
          <span className={isOverdue ? 'font-medium text-red-700 dark:text-red-300' : 'text-muted-foreground'}>
            {new Date(task.dueDate).toLocaleDateString()}
          </span>
        ) : (
          <span className="text-muted-foreground">No date</span>
        )}
      </td>
      <td className="px-4 py-3">
        <TaskAssignees task={task} />
      </td>
      <td className="px-4 py-3">
        <div className="flex justify-end">
          <TaskActions task={task} onStatusUpdate={onStatusUpdate} />
        </div>
      </td>
    </tr>
  );
}

function TaskAssignees({ task }: { task: any }) {
  if (!task.assignments || task.assignments.length === 0) {
    return <span className="text-xs text-muted-foreground">Unassigned</span>;
  }

  return (
    <div className="flex -space-x-2">
      {task.assignments.slice(0, 4).map((assignment: any) => (
        <div
          key={assignment.user.id}
          title={assignment.user.name || assignment.user.email}
          className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-card bg-primary/15 text-[10px] font-semibold text-primary"
        >
          {(assignment.user.name?.[0] || assignment.user.email[0]).toUpperCase()}
        </div>
      ))}
      {task.assignments.length > 4 && (
        <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-card bg-muted text-[10px] font-semibold text-muted-foreground">
          +{task.assignments.length - 4}
        </div>
      )}
    </div>
  );
}

function TaskActions({
  task,
  onStatusUpdate,
}: {
  task: any;
  onStatusUpdate: (taskId: string, newStatus: string) => void;
}) {
  return (
    <div className="flex flex-wrap justify-end gap-1.5">
      {task.status !== 'TODO' && (
        <button
          onClick={() => onStatusUpdate(task.id, 'TODO')}
          className="rounded-md bg-blue-500/10 px-2 py-1 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-500/20 dark:text-blue-300"
        >
          To Do
        </button>
      )}
      {task.status !== 'IN_PROGRESS' && task.status !== 'DONE' && (
        <button
          onClick={() => onStatusUpdate(task.id, 'IN_PROGRESS')}
          className="rounded-md bg-amber-500/10 px-2 py-1 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-500/20 dark:text-amber-300"
        >
          Start
        </button>
      )}
      {task.status !== 'DONE' && (
        <button
          onClick={() => onStatusUpdate(task.id, 'DONE')}
          className="rounded-md bg-green-500/10 px-2 py-1 text-xs font-medium text-green-700 transition-colors hover:bg-green-500/20 dark:text-green-300"
        >
          Done
        </button>
      )}
    </div>
  );
}

function QuickTaskAdd({
  projects,
  onOpenFullForm,
}: {
  projects: any[];
  onOpenFullForm: () => void;
}) {
  const spaceOptions = useMemo(() => getTaskSpaceOptions(projects), [projects]);
  const prefs = useMemo(() => loadTaskPrefs(), []);
  const [quickSpaceId, setQuickSpaceId] = useState(prefs.quickSpaceId || '');
  const [quickTitle, setQuickTitle] = useState('');
  const [quickProjectId, setQuickProjectId] = useState(prefs.quickProjectId || '');
  const [quickPriority, setQuickPriority] = useState('MEDIUM');
  const [isExpanded, setIsExpanded] = useState(false);
  const [createTask, { isLoading: isQuickCreating }] = useCreateTaskMutation();
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredProjects = useMemo(
    () => projects.filter((project: any) => !quickSpaceId || project.spaceId === quickSpaceId),
    [projects, quickSpaceId]
  );

  useEffect(() => {
    if (!filteredProjects.some((project: any) => project.id === quickProjectId)) {
      setQuickProjectId(filteredProjects[0]?.id || '');
    }
  }, [filteredProjects, quickProjectId]);

  useEffect(() => {
    saveTaskPrefs({ quickSpaceId, quickProjectId });
  }, [quickProjectId, quickSpaceId]);

  async function handleQuickCreate(event: React.FormEvent) {
    event.preventDefault();
    if (!quickTitle.trim() || !quickProjectId) return;

    try {
      await createTask({
        title: quickTitle.trim(),
        projectId: quickProjectId,
        priority: quickPriority,
        status: 'TODO',
      }).unwrap();
      toast.success('Task created');
      setQuickTitle('');
      inputRef.current?.focus();
    } catch (error: any) {
      toast.error(error?.data?.message || error?.message || 'Failed to create task');
    }
  }

  return (
    <form onSubmit={handleQuickCreate} className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2">
        <Plus className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <Input
          ref={inputRef}
          value={quickTitle}
          onChange={(event) => {
            setQuickTitle(event.target.value);
            if (!isExpanded && event.target.value) setIsExpanded(true);
          }}
          onFocus={() => setIsExpanded(true)}
          placeholder="Add a task"
          disabled={isQuickCreating}
          className="h-8 border-0 shadow-none focus-visible:ring-0 px-0 text-sm"
        />
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setIsExpanded((value) => !value)}
            className="hidden sm:inline-flex h-7 text-xs"
          >
            {isExpanded ? 'Hide' : 'Options'}
          </Button>
          <Button type="submit" size="sm" className="h-7 text-xs" disabled={isQuickCreating || !quickTitle.trim() || !quickProjectId}>
            {isQuickCreating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Add'}
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div className="grid gap-2 border-t border-border bg-secondary/20 px-3 py-2.5 md:grid-cols-[1fr_1fr_140px_auto]">
          <Select
            value={quickSpaceId || '__all__'}
            onValueChange={(value) => setQuickSpaceId(value === '__all__' ? '' : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All spaces" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All spaces</SelectItem>
              {spaceOptions.map((space) => (
                <SelectItem key={space.id} value={space.id}>
                  {space.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={quickProjectId} onValueChange={setQuickProjectId}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a project" />
            </SelectTrigger>
            <SelectContent>
              {filteredProjects.map((project: any) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={quickPriority} onValueChange={setQuickPriority}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="LOW">Low</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="URGENT">Urgent</SelectItem>
            </SelectContent>
          </Select>

          <Button type="button" variant="outline" onClick={onOpenFullForm}>
            Full form
          </Button>
        </div>
      )}
    </form>
  );
}

function CreateTaskForm({
  projects,
  onCreated,
}: {
  projects: any[];
  onCreated: () => void;
}) {
  const spaceOptions = useMemo(() => getTaskSpaceOptions(projects), [projects]);
  const prefs = useMemo(() => loadTaskPrefs(), []);
  const [spaceId, setSpaceId] = useState(prefs.createSpaceId || spaceOptions[0]?.id || '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState(prefs.createProjectId || '');
  const [priority, setPriority] = useState('MEDIUM');
  const [status, setStatus] = useState('TODO');
  const [dueDate, setDueDate] = useState('');
  const [issueTypeId, setIssueTypeId] = useState('');
  const [assignToSpace, setAssignToSpace] = useState(false);
  const [assignedUsers, setAssignedUsers] = useState<Member[]>([]);
  const [assignSearch, setAssignSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [createTask, { isLoading }] = useCreateTaskMutation();

  const spaceProjects = useMemo(
    () => projects.filter((project: any) => project.spaceId === spaceId),
    [projects, spaceId]
  );

  const selectedSpace = spaceOptions.find((space) => space.id === spaceId);
  const selectedProject = projects.find((project: any) => project.id === projectId);
  const orgId = selectedProject?.space?.organizationId || selectedSpace?.organizationId || '';
  const { data: members = [] } = useGetOrgMembersQuery(orgId, { skip: !orgId });
  const { data: issueTypes = [] } = useGetOrgIssueTypesQuery(orgId, { skip: !orgId });

  // When space changes, auto-pick first project in that space.
  useEffect(() => {
    if (!spaceProjects.some((project: any) => project.id === projectId)) {
      setProjectId(spaceProjects[0]?.id || '');
    }
  }, [spaceProjects, projectId]);

  useEffect(() => {
    saveTaskPrefs({ createSpaceId: spaceId, createProjectId: projectId });
  }, [projectId, spaceId]);

  useEffect(() => {
    setAssignedUsers([]);
    setAssignSearch('');
    setIssueTypeId('');
  }, [projectId]);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filteredMembers = useMemo(() => {
    const assignedIds = new Set(assignedUsers.map((user) => user.id));
    const search = assignSearch.replace(/^@/, '').toLowerCase();
    return members.filter(
      (member: Member) =>
        !assignedIds.has(member.id) &&
        (member.name?.toLowerCase().includes(search) || member.email.toLowerCase().includes(search))
    );
  }, [members, assignedUsers, assignSearch]);

  function handleAssignInput(value: string) {
    setAssignSearch(value);
    if (value.toLowerCase() === '@all') {
      const assignedIds = new Set(assignedUsers.map((user) => user.id));
      const newMembers = members.filter((member: Member) => !assignedIds.has(member.id));
      setAssignedUsers([...assignedUsers, ...newMembers]);
      setAssignSearch('');
      setShowDropdown(false);
      return;
    }
    setShowDropdown(value.length > 0);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    try {
      await createTask({
        title,
        description: description || undefined,
        projectId,
        priority,
        status,
        assignToSpace,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        assigneeIds:
          !assignToSpace && assignedUsers.length > 0
            ? assignedUsers.map((user) => user.id)
            : undefined,
        issueTypeId: issueTypeId || null,
      }).unwrap();
      toast.success('Task created');
      onCreated();
    } catch (error: any) {
      toast.error(error?.data?.message || error?.message || 'Failed to create task');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 mt-1">
      {/* Title */}
      <div className="space-y-1.5">
        <Input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="What should happen?"
          required
          disabled={isLoading}
          autoFocus
          className="text-base font-medium"
        />
      </div>

      {/* Space selector + project chips (if >1 project in space) */}
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2">
        <Label className="text-xs font-medium text-muted-foreground shrink-0">Space</Label>
        <Select value={spaceId} onValueChange={setSpaceId}>
          <SelectTrigger className="h-8 w-auto min-w-[160px] border-0 bg-transparent shadow-none focus:ring-0">
            <SelectValue placeholder="Pick a space" />
          </SelectTrigger>
          <SelectContent>
            {spaceOptions.map((space) => (
              <SelectItem key={space.id} value={space.id}>
                {space.name}{space.organizationName ? ` · ${space.organizationName}` : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {spaceProjects.length > 1 && (
          <>
            <span className="text-xs text-muted-foreground">/</span>
            <div className="flex flex-wrap gap-1">
              {spaceProjects.map((project: any) => {
                const active = project.id === projectId;
                return (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => setProjectId(project.id)}
                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs transition-colors ${
                      active
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-background text-muted-foreground hover:bg-accent'
                    }`}
                  >
                    {project.name}
                  </button>
                );
              })}
            </div>
          </>
        )}
        {spaceProjects.length === 1 && (
          <>
            <span className="text-xs text-muted-foreground">/</span>
            <span className="text-xs font-medium text-foreground">{spaceProjects[0].name}</span>
          </>
        )}
        {spaceId && spaceProjects.length === 0 && (
          <span className="text-xs text-destructive">No projects in this space</span>
        )}
      </div>

      {/* Assign @-search, always visible once project exists */}
      {projectId && !assignToSpace && (
        <div ref={dropdownRef} className="relative space-y-2">
          <div className="flex flex-wrap gap-2">
            {assignedUsers.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() =>
                  setAssignedUsers((prev) => prev.filter((member) => member.id !== user.id))
                }
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/50 px-2.5 py-0.5 text-xs"
              >
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary/15 text-[9px] font-semibold text-primary">
                  {(user.name?.[0] || user.email[0]).toUpperCase()}
                </span>
                {user.name || user.email}
                <X className="h-3 w-3 text-muted-foreground" />
              </button>
            ))}
          </div>
          <div className="relative">
            <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={assignSearch}
              onChange={(event) => handleAssignInput(event.target.value)}
              onFocus={() => setShowDropdown(assignSearch.length > 0)}
              placeholder="Assign… type @ name, or @all for everyone"
              className="pl-8 h-9"
            />
          </div>
          {showDropdown && filteredMembers.length > 0 && (
            <div className="absolute z-20 left-0 right-0 max-h-52 overflow-auto rounded-lg border border-border bg-popover p-1 shadow-lg">
              {filteredMembers.map((member: Member) => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => {
                    setAssignedUsers((prev) => [...prev, member]);
                    setAssignSearch('');
                    setShowDropdown(false);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left hover:bg-accent"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-[10px] font-semibold text-primary">
                    {(member.name?.[0] || member.email[0]).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-foreground">
                      {member.name || member.email}
                    </span>
                    {member.name && (
                      <span className="block truncate text-[11px] text-muted-foreground">
                        {member.email}
                      </span>
                    )}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Inline meta row */}
      {projectId && (
        <div className="flex flex-wrap items-center gap-2">
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger className="h-8 w-auto min-w-[110px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="LOW">Low</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="URGENT">Urgent</SelectItem>
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-8 w-auto min-w-[120px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODO">To Do</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            </SelectContent>
          </Select>
          <Input
            type="date"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
            className="h-8 w-auto text-xs"
            placeholder="Due"
          />
          <label className="inline-flex items-center gap-2 text-xs text-muted-foreground ml-auto cursor-pointer">
            <Switch checked={assignToSpace} onCheckedChange={setAssignToSpace} />
            Whole space
          </label>
        </div>
      )}

      {/* Collapsible Description + Issue Type */}
      {projectId && (
        <Accordion type="multiple">
          <AccordionItem value="more" className="border-b-0">
            <AccordionTrigger className="py-2 text-xs text-muted-foreground hover:no-underline">
              Description, issue type, and more
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pt-1">
              <AiTaskSuggestion
                projectId={projectId}
                onApply={(suggestion) => {
                  setTitle(suggestion.title);
                  setDescription(suggestion.description);
                  if (['LOW', 'MEDIUM', 'HIGH', 'URGENT'].includes(suggestion.priority)) {
                    setPriority(suggestion.priority);
                  }
                }}
              />
              <Textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Add context, acceptance criteria, or links"
                rows={3}
                disabled={isLoading}
              />
              {issueTypes.length > 0 && (
                <Select value={issueTypeId} onValueChange={setIssueTypeId}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Issue type (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {issueTypes.map((issueType: any) => {
                      const Icon = ICON_MAP[issueType.icon] || Circle;
                      return (
                        <SelectItem key={issueType.id} value={issueType.id}>
                          <span className="flex items-center gap-2">
                            <Icon className="h-3.5 w-3.5" style={{ color: issueType.color }} />
                            {issueType.name}
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}

      <div className="flex items-center justify-end gap-2 pt-1">
        <Button type="button" variant="ghost" size="sm" onClick={onCreated} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={isLoading || !title.trim() || !projectId}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating…
            </>
          ) : (
            'Create task'
          )}
        </Button>
      </div>
    </form>
  );
}
