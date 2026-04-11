'use client';

import Link from 'next/link';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

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

const priorityColors: Record<string, string> = {
  URGENT: 'bg-red-500/10 text-red-600 border-red-200',
  HIGH: 'bg-orange-500/10 text-orange-600 border-orange-200',
  MEDIUM: 'bg-blue-500/10 text-blue-600 border-blue-200',
  LOW: 'bg-gray-500/10 text-gray-600 border-gray-200',
};

export default function TaskCard({
  task,
  projectId,
  dragging = false,
}: {
  task: Task;
  projectId: string;
  dragging?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { taskId: task.id, status: task.status },
    disabled: dragging,
  });

  const style = transform ? { transform: CSS.Transform.toString(transform) } : undefined;
  const visualDragging = dragging || isDragging;

  return (
    <div
      ref={dragging ? undefined : setNodeRef}
      style={dragging ? undefined : style}
      className={visualDragging ? 'opacity-70' : undefined}
    >
      <div className={`group rounded-lg border border-border bg-card p-3 transition-colors ${visualDragging ? 'shadow-lg ring-2 ring-primary/20' : 'hover:border-primary/50'}`}>
        <div className="mb-2 flex items-start gap-2">
          {!dragging && (
            <button
              type="button"
              {...attributes}
              {...listeners}
              className="mt-0.5 cursor-grab rounded p-0.5 text-muted-foreground hover:text-foreground active:cursor-grabbing"
              aria-label={`Drag task ${task.title}`}
            >
              <GripVertical className="h-3.5 w-3.5" />
            </button>
          )}

          <div className="min-w-0 flex-1">
            {task.taskNumber && (
              <span className="mb-1 block text-[11px] font-mono text-muted-foreground">
                TSK-{task.project?.space?.organization?.slug?.toUpperCase() || 'ORG'}-{task.taskNumber}
              </span>
            )}
            <Link href={`/projects/${projectId}/tasks/${task.id}`}>
              <h4 className="mb-2 line-clamp-2 text-sm font-medium text-foreground hover:text-primary">
                {task.title}
              </h4>
            </Link>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className={`inline-block rounded border px-2 py-0.5 text-xs font-medium ${priorityColors[task.priority] || ''}`}>
            {task.priority}
          </span>
          {task.assignments && task.assignments.length > 0 && (
            <div className="flex -space-x-1">
              {task.assignments.slice(0, 3).map((assignment) => (
                <div
                  key={assignment.user.id}
                  className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-card bg-primary/20"
                  title={assignment.user.name || assignment.user.email}
                >
                  <span className="text-[10px] font-bold text-primary">
                    {(assignment.user.name?.[0] || assignment.user.email[0]).toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {task.dueDate && (
          <p className="mt-2 text-xs text-muted-foreground">
            Due: {new Date(task.dueDate).toLocaleDateString()}
          </p>
        )}
      </div>
    </div>
  );
}
