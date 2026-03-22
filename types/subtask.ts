export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  position: number;
  taskId: string;
  createdById: string;
  createdAt: string;
  createdBy?: { id: string; name: string | null; email: string };
}
