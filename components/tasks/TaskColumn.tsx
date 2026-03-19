'use client';

import TaskCard from './TaskCard';

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
  assignments?: { user: { id: string; name: string | null; email: string } }[];
}

interface TaskColumnProps {
  title: string;
  color: string;
  tasks: Task[];
  projectId: string;
}

export default function TaskColumn({ title, color, tasks, projectId }: TaskColumnProps) {
  return (
    <div className="bg-secondary/30 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-3 h-3 rounded-full ${color}`} />
        <h3 className="font-semibold text-foreground text-sm">{title}</h3>
        <span className="text-xs text-muted-foreground ml-auto bg-muted px-2 py-0.5 rounded-full">
          {tasks.length}
        </span>
      </div>
      <div className="space-y-2">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} projectId={projectId} />
        ))}
        {tasks.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4">No tasks</p>
        )}
      </div>
    </div>
  );
}
