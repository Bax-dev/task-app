'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Plus, LayoutGrid, Loader2, Trash2, Search, Columns,
  ArrowLeft, Calendar, AlertTriangle, ChevronRight, Users, Pencil, GripVertical,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  useGetBoardQuery, useGetProjectTasksQuery, useUpdateTaskMutation, useCreateTaskMutation,
} from '@/store/api';
import type { Task } from '@/types/task';
import type { BoardColumn } from '@/types/board';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import { useDroppable, useDraggable } from '@dnd-kit/core';

// ── Constants ──────────────────────────────────────────────────────────────────

const COLUMN_STATUS_MAP: Record<string, string> = {
  'To Do': 'TODO',
  'Todo': 'TODO',
  'TODO': 'TODO',
  'Backlog': 'TODO',
  'In Progress': 'IN_PROGRESS',
  'IN_PROGRESS': 'IN_PROGRESS',
  'Doing': 'IN_PROGRESS',
  'In Review': 'IN_REVIEW',
  'IN_REVIEW': 'IN_REVIEW',
  'Review': 'IN_REVIEW',
  'Done': 'DONE',
  'DONE': 'DONE',
  'Complete': 'DONE',
  'Completed': 'DONE',
  'Cancelled': 'CANCELLED',
  'CANCELLED': 'CANCELLED',
};

const PRIORITY_COLORS: Record<string, string> = {
  URGENT: 'border-l-red-500',
  HIGH: 'border-l-orange-500',
  MEDIUM: 'border-l-yellow-500',
  LOW: 'border-l-blue-500',
  NONE: 'border-l-muted',
};

const PRIORITY_BADGE_STYLES: Record<string, string> = {
  URGENT: 'bg-red-500/15 text-red-600 border-red-500/30',
  HIGH: 'bg-orange-500/15 text-orange-600 border-orange-500/30',
  MEDIUM: 'bg-yellow-500/15 text-yellow-700 border-yellow-500/30',
  LOW: 'bg-blue-500/15 text-blue-600 border-blue-500/30',
  NONE: 'bg-muted text-muted-foreground border-border',
};

function resolveColumnStatus(columnName: string): string {
  return COLUMN_STATUS_MAP[columnName] ?? COLUMN_STATUS_MAP[columnName.trim()] ?? columnName.toUpperCase().replace(/\s+/g, '_');
}

function getInitials(name: string | null | undefined, email?: string): string {
  if (name) {
    return name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
  return (email ?? '??').slice(0, 2).toUpperCase();
}

function isOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date(new Date().toDateString());
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ── Task Card (static, used for DragOverlay) ─────────────────────────────────

function TaskCardContent({
  task,
  isDragging,
}: {
  task: Task;
  isDragging?: boolean;
}) {
  const overdue = isOverdue(task.dueDate);
  const priorityBorder = PRIORITY_COLORS[task.priority] ?? PRIORITY_COLORS.NONE;
  const priorityBadge = PRIORITY_BADGE_STYLES[task.priority] ?? PRIORITY_BADGE_STYLES.NONE;

  return (
    <div
      className={`bg-card border border-border border-l-[3px] ${priorityBorder} rounded-lg p-3 shadow-sm relative group ${
        isDragging ? 'shadow-lg ring-2 ring-primary/30 opacity-95' : 'hover:border-primary/30'
      } transition-colors`}
    >
      {/* Header row: drag handle + title + task number */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-start gap-1.5 flex-1 min-w-0">
          <GripVertical className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0 mt-0.5 cursor-grab" />
          <h4 className="text-sm font-medium text-foreground leading-snug line-clamp-2 flex-1">
            {task.title}
          </h4>
        </div>
        {task.taskNumber && (
          <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">
            #{task.taskNumber}
          </span>
        )}
      </div>

      {/* Priority badge */}
      <div className="flex flex-wrap items-center gap-1.5 mb-2">
        <span className={`inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded border ${priorityBadge}`}>
          {task.priority}
        </span>
      </div>

      {/* Bottom row: assignees, due date */}
      <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-border/50">
        {/* Assignees */}
        <div className="flex items-center -space-x-1.5">
          {task.assignments && task.assignments.length > 0 ? (
            <>
              {task.assignments.slice(0, 3).map((a) => (
                <div
                  key={a.user.id}
                  title={a.user.name ?? a.user.email}
                  className="w-6 h-6 rounded-full bg-primary/15 text-primary border-2 border-card flex items-center justify-center text-[9px] font-bold"
                >
                  {getInitials(a.user.name, a.user.email)}
                </div>
              ))}
              {task.assignments.length > 3 && (
                <div className="w-6 h-6 rounded-full bg-muted text-muted-foreground border-2 border-card flex items-center justify-center text-[9px] font-bold">
                  +{task.assignments.length - 3}
                </div>
              )}
            </>
          ) : (
            <div className="w-6 h-6 rounded-full bg-muted text-muted-foreground/50 border-2 border-card flex items-center justify-center">
              <Users className="w-3 h-3" />
            </div>
          )}
        </div>

        {/* Due date */}
        {task.dueDate && (
          <div
            className={`flex items-center gap-1 text-[11px] ${overdue ? 'text-red-500 font-semibold' : 'text-muted-foreground'}`}
          >
            <Calendar className="w-3 h-3" />
            {formatDate(task.dueDate)}
            {overdue && <AlertTriangle className="w-3 h-3" />}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Draggable Task Card ───────────────────────────────────────────────────────

function DraggableTaskCard({
  task,
  columnId,
}: {
  task: Task;
  columnId: string;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: task.id,
    data: { type: 'task', task, columnId },
  });

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)`, opacity: isDragging ? 0.4 : 1 }
    : undefined;

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCardContent task={task} />
    </div>
  );
}

// ── Kanban Column (droppable) ─────────────────────────────────────────────────

function KanbanColumn({
  column,
  tasks,
  onAddTask,
  isCreating,
  isDropTarget,
}: {
  column: BoardColumn;
  tasks: Task[];
  onAddTask: (status: string, title: string) => void;
  isCreating: boolean;
  isDropTarget: boolean;
}) {
  const { setNodeRef } = useDroppable({
    id: column.id,
    data: { type: 'column', columnId: column.id },
  });

  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const count = tasks.length;
  const limit = column.wipLimit;
  const isAtLimit = limit !== null && count >= limit;
  const isOverLimit = limit !== null && count > limit;

  let headerColor = 'text-foreground';
  let countBadge = 'bg-muted text-muted-foreground';
  if (isOverLimit) {
    headerColor = 'text-red-600';
    countBadge = 'bg-red-500/15 text-red-600';
  } else if (isAtLimit) {
    headerColor = 'text-amber-600';
    countBadge = 'bg-amber-500/15 text-amber-600';
  }

  const handleCreate = () => {
    if (!newTitle.trim()) return;
    onAddTask(resolveColumnStatus(column.name), newTitle.trim());
    setNewTitle('');
    setAdding(false);
  };

  return (
    <div
      ref={setNodeRef}
      className={`bg-muted/30 rounded-lg p-3 min-w-[280px] max-w-[320px] flex flex-col gap-2 shrink-0 transition-colors ${
        isDropTarget ? 'bg-primary/5 ring-2 ring-primary/20 ring-inset' : ''
      }`}
    >
      {/* Column header */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <h3 className={`text-sm font-semibold ${headerColor}`}>{column.name}</h3>
          <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${countBadge}`}>
            {limit !== null ? `${count}/${limit}` : count}
          </span>
        </div>
        {isOverLimit && <AlertTriangle className="w-4 h-4 text-red-500" />}
      </div>

      {/* Task list */}
      <div className="flex flex-col gap-2 flex-1 overflow-y-auto max-h-[calc(100vh-280px)] pr-1">
        {tasks.length === 0 && !adding && (
          <div className={`text-center py-6 text-xs ${isDropTarget ? 'text-primary/60' : 'text-muted-foreground/60'}`}>
            {isDropTarget ? 'Drop here' : 'No tasks'}
          </div>
        )}
        {tasks.map((task) => (
          <DraggableTaskCard
            key={task.id}
            task={task}
            columnId={column.id}
          />
        ))}
      </div>

      {/* Inline add task form */}
      {adding ? (
        <div className="space-y-2 mt-1">
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Task title..."
            className="h-8 text-sm"
            autoFocus
            disabled={isCreating}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreate();
              if (e.key === 'Escape') { setAdding(false); setNewTitle(''); }
            }}
          />
          <div className="flex items-center gap-2">
            <Button size="sm" className="h-7 text-xs" onClick={handleCreate} disabled={isCreating || !newTitle.trim()}>
              {isCreating ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
              Save
            </Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setAdding(false); setNewTitle(''); }} disabled={isCreating}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground py-2 px-2 rounded-md hover:bg-muted/60 transition-colors mt-1"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Task
        </button>
      )}
    </div>
  );
}

// ── Board Detail View ──────────────────────────────────────────────────────────

function BoardDetailView({
  boardId,
  onBack,
}: {
  boardId: string;
  onBack: () => void;
}) {
  const { data: board, isLoading: boardLoading } = useGetBoardQuery(boardId);
  const { data: tasks = [], isLoading: tasksLoading } = useGetProjectTasksQuery(
    board?.projectId ?? '',
    { skip: !board?.projectId },
  );
  const [updateTask] = useUpdateTaskMutation();
  const [createTask, { isLoading: isCreating }] = useCreateTaskMutation();

  // Drag state
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [overColumnId, setOverColumnId] = useState<string | null>(null);
  const [optimisticTasks, setOptimisticTasks] = useState<Task[]>([]);

  useEffect(() => {
    setOptimisticTasks(tasks);
  }, [tasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  // Derive columns sorted by position
  const columns = useMemo(() => {
    if (!board?.columns) return [];
    return [...board.columns].sort((a, b) => a.position - b.position);
  }, [board?.columns]);

  // Build a columnId→status lookup
  const columnStatusMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const col of columns) {
      map[col.id] = resolveColumnStatus(col.name);
    }
    return map;
  }, [columns]);

  // Group tasks by column
  const tasksByColumn = useMemo(() => {
    const map: Record<string, Task[]> = {};
    for (const col of columns) {
      const status = resolveColumnStatus(col.name);
      map[col.id] = optimisticTasks.filter((t) => t.status === status);
    }
    const matchedStatuses = new Set(columns.map((c) => resolveColumnStatus(c.name)));
    const unmatched = optimisticTasks.filter((t) => !matchedStatuses.has(t.status));
    if (unmatched.length > 0 && columns.length > 0) {
      map[columns[0].id] = [...(map[columns[0].id] ?? []), ...unmatched];
    }
    return map;
  }, [columns, optimisticTasks]);

  // ── Drag handlers ─────────────────────────────────────────────��─────────────

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = active.data.current?.task as Task | undefined;
    if (task) setActiveTask(task);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    if (!over) {
      setOverColumnId(null);
      return;
    }
    // Determine which column we're over
    const overData = over.data.current;
    if (overData?.type === 'column') {
      setOverColumnId(over.id as string);
    } else if (overData?.type === 'task') {
      // Hovering over a task card → use its parent column
      setOverColumnId(overData.columnId as string);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    setOverColumnId(null);

    if (!over) return;

    const task = active.data.current?.task as Task | undefined;
    if (!task) return;

    // Determine target column id
    const overData = over.data.current;
    let targetColumnId: string;
    if (overData?.type === 'column') {
      targetColumnId = over.id as string;
    } else if (overData?.type === 'task') {
      targetColumnId = overData.columnId as string;
    } else {
      return;
    }

    const newStatus = columnStatusMap[targetColumnId];
    if (!newStatus || task.status === newStatus) return;

    const previousTasks = optimisticTasks;
    setOptimisticTasks((current) =>
      current.map((item) =>
        item.id === task.id ? { ...item, status: newStatus } : item
      )
    );

    try {
      await updateTask({ id: task.id, status: newStatus }).unwrap();
      toast.success('Task moved');
    } catch (err: any) {
      setOptimisticTasks(previousTasks);
      toast.error(err?.data?.message || 'Failed to move task');
    }
  };

  const handleDragCancel = () => {
    setActiveTask(null);
    setOverColumnId(null);
  };

  const handleAddTask = async (status: string, title: string) => {
    if (!board) return;
    try {
      await createTask({ title, status, projectId: board.projectId }).unwrap();
      toast.success('Task created');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to create task');
    }
  };

  if (boardLoading || tasksLoading) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!board) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Board not found</p>
        <Button variant="ghost" onClick={onBack} className="mt-4 gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to boards
        </Button>
      </div>
    );
  }

  const totalTasks = optimisticTasks.length;

  return (
    <div className="flex flex-col h-full">
      {/* Board header */}
      <div className="flex items-center gap-4 mb-6 px-1">
        <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-foreground truncate">{board.name}</h1>
          {board.description && (
            <p className="text-sm text-muted-foreground truncate mt-0.5">{board.description}</p>
          )}
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground shrink-0">
          <div className="flex items-center gap-1.5">
            <Columns className="w-4 h-4" />
            <span>{columns.length} columns</span>
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-1.5">
            <LayoutGrid className="w-4 h-4" />
            <span>{totalTasks} tasks</span>
          </div>
        </div>
      </div>

      {/* Kanban lanes with DnD */}
      {columns.length === 0 ? (
        <div className="text-center py-16">
          <Columns className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No columns configured</h3>
          <p className="text-sm text-muted-foreground">
            This board has no columns yet. Add columns to start organizing tasks.
          </p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div className="flex gap-4 overflow-x-auto pb-4 flex-1">
            {columns.map((col) => (
              <KanbanColumn
                key={col.id}
                column={col}
                tasks={tasksByColumn[col.id] ?? []}
                onAddTask={handleAddTask}
                isCreating={isCreating}
                isDropTarget={overColumnId === col.id}
              />
            ))}
          </div>

          <DragOverlay dropAnimation={null}>
            {activeTask ? (
              <div className="w-[280px]">
                <TaskCardContent task={activeTask} isDragging />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
}

// ── Main BoardRead Component ─────────────────────────────────────────────────

interface BoardReadProps {
  boards: any[];
  isLoading: boolean;
  selectedBoardId: string | null;
  onSelectBoard: (id: string | null) => void;
  onEditBoard: (board: any) => void;
  onDeleteBoard: (board: any) => void;
  isGuest: boolean;
}

export default function BoardRead({
  boards,
  isLoading,
  selectedBoardId,
  onSelectBoard,
  onEditBoard,
  onDeleteBoard,
  isGuest,
}: BoardReadProps) {
  const [search, setSearch] = useState('');

  // ── Board Detail View ──────────────────────────────────────────────────────
  if (selectedBoardId) {
    return (
      <div className="h-full flex flex-col">
        <BoardDetailView
          boardId={selectedBoardId}
          onBack={() => onSelectBoard(null)}
        />
      </div>
    );
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // ── Empty State ────────────────────────────────────────────────────────────
  if (boards.length === 0) {
    return (
      <div className="text-center py-16">
        <LayoutGrid className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-bold text-foreground mb-2">No boards yet</h3>
        <p className="text-muted-foreground mb-4">Create your first board to get started</p>
      </div>
    );
  }

  // ── Board List ─────────────────────────────────────────────────────────────
  const filtered = boards.filter(
    (b: any) =>
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.description?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <>
      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search boards..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 max-w-sm"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No boards match &quot;{search}&quot;</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((board: any) => {
            const colCount = board._count?.columns ?? board.columns?.length ?? 0;
            return (
              <div key={board.id} className="relative group">
                <button
                  onClick={() => onSelectBoard(board.id)}
                  className="w-full text-left bg-card border border-border rounded-lg p-5 hover:border-primary/50 hover:shadow-md transition-all h-full flex flex-col"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <LayoutGrid className="w-4.5 h-4.5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-foreground group-hover:text-primary transition-colors truncate">
                        {board.name}
                      </h3>
                      {board.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {board.description}
                        </p>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0 mt-1" />
                  </div>

                  <div className="mt-auto pt-3 border-t border-border/50 flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Columns className="w-3.5 h-3.5" />
                      <span>{colCount} {colCount === 1 ? 'column' : 'columns'}</span>
                    </div>
                    {board.createdBy && (
                      <>
                        <div className="h-3 w-px bg-border" />
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <div className="w-4 h-4 rounded-full bg-muted flex items-center justify-center text-[8px] font-bold">
                            {getInitials(board.createdBy.name, board.createdBy.email)}
                          </div>
                          <span className="truncate max-w-[100px]">{board.createdBy.name || board.createdBy.email}</span>
                        </div>
                      </>
                    )}
                  </div>
                </button>

                {/* Edit & Delete buttons */}
                {!isGuest && (
                  <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <button
                      className="p-1.5 rounded-md hover:bg-primary/10 text-muted-foreground hover:text-primary"
                      onClick={(e) => { e.stopPropagation(); onEditBoard(board); }}
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
                      onClick={(e) => { e.stopPropagation(); onDeleteBoard(board); }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
