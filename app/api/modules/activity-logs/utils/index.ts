export function getActivityStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    NOT_STARTED: 'Not Started',
    IN_PROGRESS: 'In Progress',
    COMPLETED: 'Completed',
    BLOCKED: 'Blocked',
  };
  return labels[status] || status;
}
