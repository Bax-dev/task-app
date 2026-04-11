'use client';

import { useDroppable } from '@dnd-kit/core';
import TaskCard from '@/components/tasks/board/TaskCard';

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

interface TaskColumnProps {
  columnKey: string;
  title: string;
  color: string;
  tasks: Task[];
  projectId: string;
}

export default function TaskColumn({ columnKey, title, color, tasks, projectId }: TaskColumnProps) {
  const { isOver, setNodeRef } = useDroppable({ id: columnKey });

  return (
    <div
      ref={setNodeRef}
      className={`rounded-xl border p-4 transition-colors ${
        isOver ? 'border-primary bg-primary/5' : 'border-border bg-secondary/30'
      }`}
    >
      <div className="mb-4 flex items-center gap-2">
        <div className={`h-3 w-3 rounded-full ${color}`} />
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          {tasks.length}
        </span>
      </div>

      <div className="space-y-2 min-h-24">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} projectId={projectId} />
        ))}
        {tasks.length === 0 && (
          <p className="py-6 text-center text-xs text-muted-foreground">
            Drop tasks here
          </p>
        )}
      </div>
    </div>
  );
}
