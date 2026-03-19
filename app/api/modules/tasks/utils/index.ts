export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    TODO: 'To Do',
    IN_PROGRESS: 'In Progress',
    DONE: 'Done',
    CANCELLED: 'Cancelled',
  };
  return labels[status] || status;
}

export function getPriorityLabel(priority: string): string {
  const labels: Record<string, string> = {
    LOW: 'Low',
    MEDIUM: 'Medium',
    HIGH: 'High',
    URGENT: 'Urgent',
  };
  return labels[priority] || priority;
}

export function isOverdue(dueDate: Date | null): boolean {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
}
