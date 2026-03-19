'use client';

import TaskColumn from './TaskColumn';

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
  assignments?: { user: { id: string; name: string | null; email: string } }[];
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

export default function TaskBoard({ projectId, tasksByStatus }: TaskBoardProps) {
  return (
    <div className="grid grid-cols-4 gap-4">
      {columns.map((col) => (
        <TaskColumn
          key={col.key}
          title={col.label}
          color={col.color}
          tasks={tasksByStatus[col.key] || []}
          projectId={projectId}
        />
      ))}
    </div>
  );
}
