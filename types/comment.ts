export interface Comment {
  id: string;
  content: string;
  taskId: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: { id: string; name: string | null; email: string };
}
