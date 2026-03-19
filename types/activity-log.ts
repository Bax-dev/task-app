export interface Attachment {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
}

export interface ActivityLog {
  id: string;
  description: string;
  status: string;
  note: string | null;
  taskId: string | null;
  organizationId: string;
  createdById: string;
  loggedAt: string;
  createdAt: string;
  createdBy?: { id: string; name: string | null; email: string };
  task?: { id: string; title: string; projectId: string } | null;
  organization?: { id: string; name: string };
  attachments?: Attachment[];
}

export interface CreateActivityLogDTO {
  description: string;
  status?: string;
  note?: string | null;
  taskId?: string | null;
  organizationId: string;
}

export interface UpdateActivityLogDTO {
  description?: string;
  status?: string;
  note?: string | null;
  taskId?: string | null;
}
