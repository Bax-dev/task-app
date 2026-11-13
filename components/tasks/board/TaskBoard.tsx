'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { toast } from 'sonner';
import { useUpdateTaskMutation } from '@/store/api';
import TaskCard from '@/components/tasks/board/TaskCard';
import TaskColumn from '@/components/tasks/board/TaskColumn';

interface Task {
  id: string;
  taskNumber?: number;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
  assignments?: { user: { id: string; name: string | null; email: string } }[];
  project?: { space?: { organization?: { slug: string } } };
}

interface TaskBoardProps {
  projectId: string;
  tasksByStatus: Record<string, Task[]>;
}

const columns = [
  { key: 'TODO', label: 'To Do', color: 'bg-blue-500' },
  { key: 'IN_PROGRESS', label: 'In Progress', color: 'bg-yellow-500' },
  { key: 'DONE', label: 'Done', color: 'bg-green-500' },
  { key: 'CANCELLED', label: 'Cancelled', color: 'bg-gray-500' },
];

function buildBoardState(tasksByStatus: Record<string, Task[]>) {
  return columns.reduce<Record<string, Task[]>>((acc, column) => {
    acc[column.key] = tasksByStatus[column.key] || [];
    return acc;
  }, {});
}

export default function TaskBoard({ projectId, tasksByStatus }: TaskBoardProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  );
  const [boardState, setBoardState] = useState<Record<string, Task[]>>(buildBoardState(tasksByStatus));
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [updateTask] = useUpdateTaskMutation();

  useEffect(() => {
    setBoardState(buildBoardState(tasksByStatus));
  }, [tasksByStatus]);

  const taskLookup = useMemo(() => {
    const map = new Map<string, { task: Task; columnKey: string }>();
    Object.entries(boardState).forEach(([columnKey, tasks]) => {
      tasks.forEach((task) => map.set(task.id, { task, columnKey }));
    });
    return map;
  }, [boardState]);

  function moveTask(taskId: string, fromColumn: string, toColumn: string) {
    if (fromColumn === toColumn) return;

    setBoardState((prev) => {
      const sourceTasks = prev[fromColumn] || [];
      const targetTasks = prev[toColumn] || [];
      const task = sourceTasks.find((item) => item.id === taskId);
      if (!task) return prev;

      return {
        ...prev,
        [fromColumn]: sourceTasks.filter((item) => item.id !== taskId),
        [toColumn]: [{ ...task, status: toColumn }, ...targetTasks],
      };
    });
  }

  function handleDragStart(event: DragStartEvent) {
    const taskId = String(event.active.id);
    setActiveTask(taskLookup.get(taskId)?.task || null);
  }

  async function handleDragEnd(event: DragEndEvent) {
    const taskId = String(event.active.id);
    const overId = event.over?.id ? String(event.over.id) : null;
    setActiveTask(null);

    if (!overId) return;

    const current = taskLookup.get(taskId);
    if (!current) return;

    const targetColumn = columns.some((column) => column.key === overId) ? overId : current.columnKey;
    if (targetColumn === current.columnKey) return;

    moveTask(taskId, current.columnKey, targetColumn);

    try {
      await updateTask({ id: taskId, status: targetColumn }).unwrap();
    } catch (error: any) {
      moveTask(taskId, targetColumn, current.columnKey);
      toast.error(error?.data?.message || error?.message || 'Failed to move task');
    }
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="grid gap-4 xl:grid-cols-4 md:grid-cols-2">
        {columns.map((column) => (
          <TaskColumn
            key={column.key}
            columnKey={column.key}
            title={column.label}
            color={column.color}
            tasks={boardState[column.key] || []}
            projectId={projectId}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask ? (
          <div className="w-[280px] rotate-1 opacity-95">
            <TaskCard task={activeTask} projectId={projectId} dragging />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
