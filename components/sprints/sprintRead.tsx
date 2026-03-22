'use client';

import { useState } from 'react';
import {
  Plus, Loader2, Trash2, Search, Calendar, Target,
  ArrowLeft, ChevronRight, Play, CheckCircle2, X,
  ListChecks, BarChart3, Zap, CircleDot,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import {
  useGetSprintQuery,
  useUpdateSprintMutation,
  useAddSprintTaskMutation,
  useRemoveSprintTaskMutation,
  useGetUserTasksQuery,
} from '@/store/api';

// ---------------------------------------------------------------------------
// Constants & helpers
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; border: string }> = {
  PLANNING: {
    label: 'Planning',
    color: 'text-blue-700 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/40',
    border: 'border-blue-200 dark:border-blue-800',
  },
  ACTIVE: {
    label: 'Active',
    color: 'text-amber-700 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-900/40',
    border: 'border-amber-200 dark:border-amber-800',
  },
  COMPLETED: {
    label: 'Completed',
    color: 'text-green-700 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/40',
    border: 'border-green-200 dark:border-green-800',
  },
};

const TASK_STATUS_STYLE: Record<string, string> = {
  TODO: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  IN_PROGRESS: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  IN_REVIEW: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400',
  DONE: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
};

const PRIORITY_STYLE: Record<string, string> = {
  URGENT: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
  HIGH: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400',
  MEDIUM: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400',
  LOW: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
  NONE: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
};

const STATUS_ORDER = ['PLANNING', 'ACTIVE', 'COMPLETED'];

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatStatusLabel(status: string) {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// ---------------------------------------------------------------------------
// Sprint Detail View (internal)
// ---------------------------------------------------------------------------

function SprintDetailView({
  sprintId,
  onBack,
  isGuest,
}: {
  sprintId: string;
  onBack: () => void;
  isGuest: boolean;
}) {
  const [taskSearch, setTaskSearch] = useState('');
  const [availableSearch, setAvailableSearch] = useState('');
  const [storyPointsInput, setStoryPointsInput] = useState<Record<string, number>>({});

  const { data: sprint, isLoading: sprintLoading } = useGetSprintQuery(sprintId);
  const { data: allTasks = [], isLoading: tasksLoading } = useGetUserTasksQuery();
  const [updateSprint, { isLoading: isUpdating }] = useUpdateSprintMutation();
  const [addTask, { isLoading: isAdding }] = useAddSprintTaskMutation();
  const [removeTask] = useRemoveSprintTaskMutation();

  if (sprintLoading) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!sprint) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Sprint not found.</p>
        <Button variant="ghost" className="mt-4" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to sprints
        </Button>
      </div>
    );
  }

  const sprintTasks: any[] = sprint.sprintTasks ?? [];
  const sprintTaskIds = new Set(sprintTasks.map((st: any) => st.task?.id).filter(Boolean));

  // Progress calculations
  const totalPoints = sprintTasks.reduce((sum: number, st: any) => sum + (st.storyPoints || 0), 0);
  const completedPoints = sprintTasks
    .filter((st: any) => st.task?.status === 'DONE')
    .reduce((sum: number, st: any) => sum + (st.storyPoints || 0), 0);
  const percentage = totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0;

  // Stats
  const totalTaskCount = sprintTasks.length;
  const completedCount = sprintTasks.filter((st: any) => st.task?.status === 'DONE').length;
  const inProgressCount = sprintTasks.filter((st: any) => st.task?.status === 'IN_PROGRESS').length;

  // Available tasks (not already in sprint)
  const availableTasks = allTasks.filter(
    (t: any) => !sprintTaskIds.has(t.id) && t.title?.toLowerCase().includes(availableSearch.toLowerCase()),
  );

  // Filtered sprint tasks
  const filteredSprintTasks = sprintTasks.filter((st: any) =>
    st.task?.title?.toLowerCase().includes(taskSearch.toLowerCase()),
  );

  const statusConfig = STATUS_CONFIG[sprint.status] ?? STATUS_CONFIG.PLANNING;

  const handleStatusTransition = async (newStatus: string) => {
    try {
      await updateSprint({ id: sprintId, status: newStatus }).unwrap();
      toast.success(`Sprint ${newStatus === 'ACTIVE' ? 'started' : 'completed'} successfully`);
    } catch (error: any) {
      toast.error(error?.data?.message || error?.message || 'Failed to update sprint');
    }
  };

  const handleAddTask = async (taskId: string) => {
    const points = storyPointsInput[taskId] ?? 1;
    try {
      await addTask({ sprintId, taskId, storyPoints: points }).unwrap();
      toast.success('Task added to sprint');
    } catch (error: any) {
      toast.error(error?.data?.message || error?.message || 'Failed to add task');
    }
  };

  const handleRemoveTask = async (taskId: string) => {
    try {
      await removeTask({ sprintId, taskId }).unwrap();
      toast.success('Task removed from sprint');
    } catch (error: any) {
      toast.error(error?.data?.message || error?.message || 'Failed to remove task');
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Button variant="ghost" size="sm" className="w-fit gap-2 -ml-2" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" /> Back to sprints
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground truncate">{sprint.name}</h1>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium shrink-0 ${statusConfig.bgColor} ${statusConfig.color}`}>
              {statusConfig.label}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {sprint.status === 'PLANNING' && !isGuest && (
              <Button
                onClick={() => handleStatusTransition('ACTIVE')}
                disabled={isUpdating}
                className="gap-2 bg-amber-600 hover:bg-amber-700 text-white"
              >
                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                Start Sprint
              </Button>
            )}
            {sprint.status === 'ACTIVE' && !isGuest && (
              <Button
                onClick={() => handleStatusTransition('COMPLETED')}
                disabled={isUpdating}
                className="gap-2 bg-green-600 hover:bg-green-700 text-white"
              >
                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Complete Sprint
              </Button>
            )}
          </div>
        </div>

        {(sprint.startDate || sprint.endDate) && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>
              {formatDate(sprint.startDate) && formatDate(sprint.endDate)
                ? `${formatDate(sprint.startDate)} - ${formatDate(sprint.endDate)}`
                : formatDate(sprint.startDate)
                  ? `Starts ${formatDate(sprint.startDate)}`
                  : `Ends ${formatDate(sprint.endDate)}`}
            </span>
          </div>
        )}

        {sprint.goal && (
          <p className="text-sm text-muted-foreground max-w-2xl">{sprint.goal}</p>
        )}
      </div>

      {/* Progress Section */}
      <div className="bg-card border border-border rounded-lg p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-foreground">Sprint Progress</h2>
          <span className="text-sm font-bold text-foreground">{percentage}%</span>
        </div>
        <Progress value={percentage} className="h-3 mb-2" />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{completedPoints} of {totalPoints} story points completed</span>
          <span>{completedCount} of {totalTaskCount} tasks done</span>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <ListChecks className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">Total Tasks</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{totalTaskCount}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span className="text-xs font-medium text-muted-foreground">Completed</span>
          </div>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{completedCount}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <CircleDot className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-medium text-muted-foreground">In Progress</span>
          </div>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{inProgressCount}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium text-muted-foreground">Story Points</span>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {completedPoints}<span className="text-sm font-normal text-muted-foreground">/{totalPoints}</span>
          </p>
        </div>
      </div>

      {/* Two-panel layout: Sprint Backlog + Available Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sprint Backlog (left) */}
        <div className="bg-card border border-border rounded-lg flex flex-col">
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Target className="w-4 h-4" />
                Sprint Backlog
                <span className="text-xs font-normal text-muted-foreground">({sprintTasks.length})</span>
              </h2>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Search sprint tasks..."
                value={taskSearch}
                onChange={(e) => setTaskSearch(e.target.value)}
                className="pl-9 h-8 text-sm"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[420px] divide-y divide-border">
            {filteredSprintTasks.length === 0 ? (
              <div className="p-8 text-center">
                <Target className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  {sprintTasks.length === 0
                    ? 'No tasks in this sprint yet. Add tasks from the right panel.'
                    : 'No tasks match your search.'}
                </p>
              </div>
            ) : (
              filteredSprintTasks.map((st: any) => {
                const task = st.task;
                if (!task) return null;
                const taskStatusStyle = TASK_STATUS_STYLE[task.status] ?? TASK_STATUS_STYLE.TODO;
                const priorityStyle = PRIORITY_STYLE[task.priority] ?? PRIORITY_STYLE.NONE;
                return (
                  <div
                    key={st.id || task.id}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors group"
                  >
                    <div className={`w-2 h-2 rounded-full shrink-0 ${task.status === 'DONE' ? 'bg-green-500' : task.status === 'IN_PROGRESS' ? 'bg-amber-500' : 'bg-slate-400'}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${task.status === 'DONE' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                        {task.title}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${taskStatusStyle}`}>
                          {formatStatusLabel(task.status)}
                        </span>
                        {task.priority && task.priority !== 'NONE' && (
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${priorityStyle}`}>
                            {task.priority}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                        <Zap className="w-3 h-3" />
                        {st.storyPoints ?? 0}
                      </span>
                      {!isGuest && (
                        <button
                          onClick={() => handleRemoveTask(task.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                          title="Remove from sprint"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Available Tasks (right) */}
        <div className="bg-card border border-border rounded-lg flex flex-col">
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Available Tasks
                <span className="text-xs font-normal text-muted-foreground">({availableTasks.length})</span>
              </h2>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Search available tasks..."
                value={availableSearch}
                onChange={(e) => setAvailableSearch(e.target.value)}
                className="pl-9 h-8 text-sm"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[420px] divide-y divide-border">
            {tasksLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              </div>
            ) : availableTasks.length === 0 ? (
              <div className="p-8 text-center">
                <CheckCircle2 className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  {allTasks.length === 0 ? 'No tasks available.' : 'All tasks are already in this sprint.'}
                </p>
              </div>
            ) : (
              availableTasks.map((task: any) => {
                const taskStatusStyle = TASK_STATUS_STYLE[task.status] ?? TASK_STATUS_STYLE.TODO;
                const priorityStyle = PRIORITY_STYLE[task.priority] ?? PRIORITY_STYLE.NONE;
                const points = storyPointsInput[task.id] ?? 1;
                return (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{task.title}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${taskStatusStyle}`}>
                          {formatStatusLabel(task.status)}
                        </span>
                        {task.priority && task.priority !== 'NONE' && (
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${priorityStyle}`}>
                            {task.priority}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Input
                        type="number"
                        min={0}
                        max={99}
                        value={points}
                        onChange={(e) =>
                          setStoryPointsInput((prev) => ({ ...prev, [task.id]: Number(e.target.value) || 0 }))
                        }
                        className="w-14 h-7 text-xs text-center"
                        title="Story points"
                      />
                      {!isGuest && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs gap-1 opacity-0 group-hover:opacity-100 transition-opacity text-primary hover:text-primary"
                          onClick={() => handleAddTask(task.id)}
                          disabled={isAdding}
                        >
                          {isAdding ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                          Add
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sprint List View (exported)
// ---------------------------------------------------------------------------

interface SprintReadProps {
  sprints: any[];
  isLoading: boolean;
  selectedSprintId: string | null;
  onSelectSprint: (id: string | null) => void;
  onEditSprint: (sprint: any) => void;
  onDeleteSprint: (sprint: any) => void;
  isGuest: boolean;
}

export default function SprintRead({
  sprints,
  isLoading,
  selectedSprintId,
  onSelectSprint,
  onEditSprint,
  onDeleteSprint,
  isGuest,
}: SprintReadProps) {
  const [search, setSearch] = useState('');

  // ------- Sprint Detail View -------
  if (selectedSprintId) {
    return (
      <SprintDetailView
        sprintId={selectedSprintId}
        onBack={() => onSelectSprint(null)}
        isGuest={isGuest}
      />
    );
  }

  // ------- Sprint List View -------
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (sprints.length === 0) {
    return (
      <div className="text-center py-12">
        <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-bold text-foreground mb-2">No sprints yet</h3>
        <p className="text-muted-foreground mb-4">Create your first sprint to get started</p>
      </div>
    );
  }

  const filtered = sprints.filter((s: any) =>
    s.name.toLowerCase().includes(search.toLowerCase()),
  );

  const grouped = STATUS_ORDER.reduce<Record<string, any[]>>((acc, status) => {
    acc[status] = filtered.filter((s: any) => s.status === status);
    return acc;
  }, {});

  return (
    <>
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search sprints..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 max-w-sm"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No sprints match &quot;{search}&quot;</p>
        </div>
      ) : (
        <div className="space-y-8">
          {STATUS_ORDER.map((status) => {
            const items = grouped[status];
            if (items.length === 0) return null;
            const config = STATUS_CONFIG[status];
            return (
              <div key={status}>
                <div className="flex items-center gap-2 mb-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.color}`}>
                    {config.label}
                  </span>
                  <span className="text-sm text-muted-foreground">({items.length})</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {items.map((sprint: any) => {
                    const taskCount = sprint._count?.sprintTasks ?? sprint.sprintTasks?.length ?? 0;
                    const startFormatted = formatDate(sprint.startDate);
                    const endFormatted = formatDate(sprint.endDate);
                    return (
                      <div key={sprint.id} className="relative group">
                        <div
                          className="bg-card border border-border rounded-lg p-4 sm:p-6 hover:border-primary/50 transition-colors h-full cursor-pointer"
                          onClick={() => onSelectSprint(sprint.id)}
                        >
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <div className="min-w-0 flex-1">
                              <h3 className="font-bold text-foreground group-hover:text-primary transition-colors truncate">
                                {sprint.name}
                              </h3>
                              {sprint.goal && (
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                  {sprint.goal}
                                </p>
                              )}
                            </div>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${config.bgColor} ${config.color}`}>
                              {config.label}
                            </span>
                          </div>

                          {(startFormatted || endFormatted) && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>
                                {startFormatted && endFormatted
                                  ? `${startFormatted} - ${endFormatted}`
                                  : startFormatted
                                    ? `Starts ${startFormatted}`
                                    : `Ends ${endFormatted}`}
                              </span>
                            </div>
                          )}

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Target className="w-3.5 h-3.5" />
                              <span>{taskCount} {taskCount === 1 ? 'task' : 'tasks'}</span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>

                        {!isGuest && (
                          <button
                            className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground z-10"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteSprint(sprint);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
