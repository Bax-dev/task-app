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
import { useMoveTaskMutation } from '@/store/api';
import { computeBoardPosition, sortByBoardPosition } from '@/lib/board-position';
import TaskCard from '@/components/tasks/board/TaskCard';
import TaskColumn from '@/components/tasks/board/TaskColumn';

interface Task {
  id: string;
  taskNumber?: number;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
  boardPosition?: number | null;
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
    acc[column.key] = sortByBoardPosition(tasksByStatus[column.key] || []);
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
  const [moveTask] = useMoveTaskMutation();

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

  function handleDragStart(event: DragStartEvent) {
    const taskId = String(event.active.id);
    setActiveTask(taskLookup.get(taskId)?.task || null);
  }

  async function handleDragEnd(event: DragEndEvent) {
    const taskId = String(event.active.id);
    const overId = event.over?.id ? String(event.over.id) : null;
    setActiveTask(null);

    if (!overId || overId === taskId) return;

    const current = taskLookup.get(taskId);
    if (!current) return;

    // Dropped on a column -> append; dropped on a card -> take that card's slot.
    const overTask = taskLookup.get(overId);
    const targetColumn = overTask ? overTask.columnKey : overId;
    if (!columns.some((column) => column.key === targetColumn)) return;

    const sourceList = boardState[current.columnKey] || [];
    const targetList = (boardState[targetColumn] || []).filter((item) => item.id !== taskId);
    let index = targetList.length;
    if (overTask) {
      index = targetList.findIndex((item) => item.id === overId);
      // Moving down within a column lands after the card it was dropped on.
      const sameColumn = targetColumn === current.columnKey;
      if (sameColumn && sourceList.findIndex((item) => item.id === taskId) < sourceList.findIndex((item) => item.id === overId)) index += 1;
    }

    const position = computeBoardPosition(targetList.map((item) => item.boardPosition), index);
    const statusChanged = targetColumn !== current.columnKey;
    const previous = boardState;
    const nextTarget = [...targetList];
    nextTarget.splice(index, 0, { ...current.task, status: targetColumn, boardPosition: position });
    setBoardState({
      ...boardState,
      ...(statusChanged && { [current.columnKey]: sourceList.filter((item) => item.id !== taskId) }),
      [targetColumn]: nextTarget,
    });

    try {
      await moveTask({ id: taskId, position, ...(statusChanged && { status: targetColumn }) }).unwrap();
    } catch (error: any) {
      setBoardState(previous);
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
