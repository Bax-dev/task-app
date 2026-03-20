export interface Task {
  id: string;
  taskNumber?: number;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  rejectionReason?: string | null;
  projectId: string;
  createdById: string;
  createdAt: string;
  createdBy?: { id: string; name: string | null; email: string };
  assignments?: { user: { id: string; name: string | null; email: string } }[];
  project?: { id: string; name: string; spaceId: string; space?: { id: string; name: string; organizationId: string; organization?: { slug: string } } };
  attachments?: { id: string; fileName: string; fileUrl: string; fileSize: number; mimeType: string }[];
}

export interface CreateTaskDTO {
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  dueDate?: string | null;
  projectId: string;
}

export interface UpdateTaskDTO {
  title?: string;
  description?: string | null;
  status?: string;
  priority?: string;
  dueDate?: string | null;
  rejectionReason?: string | null;
}
