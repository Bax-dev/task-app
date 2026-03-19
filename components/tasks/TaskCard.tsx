'use client';

import Link from 'next/link';
import { useUpdateTaskMutation } from '@/store/api';

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
  assignments?: { user: { id: string; name: string | null; email: string } }[];
}

const priorityColors: Record<string, string> = {
  URGENT: 'bg-red-500/10 text-red-600 border-red-200',
  HIGH: 'bg-orange-500/10 text-orange-600 border-orange-200',
  MEDIUM: 'bg-blue-500/10 text-blue-600 border-blue-200',
  LOW: 'bg-gray-500/10 text-gray-600 border-gray-200',
};

export default function TaskCard({ task, projectId }: { task: Task; projectId: string }) {
  const [updateTask] = useUpdateTaskMutation();

  return (
    <Link href={`/projects/${projectId}/tasks/${task.id}`}>
      <div className="bg-card border border-border rounded-lg p-3 hover:border-primary/50 transition-colors cursor-pointer">
        <h4 className="text-sm font-medium text-foreground mb-2 line-clamp-2">{task.title}</h4>
        <div className="flex items-center justify-between">
          <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${priorityColors[task.priority] || ''}`}>
            {task.priority}
          </span>
          {task.assignments && task.assignments.length > 0 && (
            <div className="flex -space-x-1">
              {task.assignments.slice(0, 3).map((a) => (
                <div
                  key={a.user.id}
                  className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center border-2 border-card"
                  title={a.user.name || a.user.email}
                >
                  <span className="text-[10px] font-bold text-primary">
                    {(a.user.name?.[0] || a.user.email[0]).toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        {task.dueDate && (
          <p className="text-xs text-muted-foreground mt-2">
            Due: {new Date(task.dueDate).toLocaleDateString()}
          </p>
        )}
      </div>
    </Link>
  );
}
