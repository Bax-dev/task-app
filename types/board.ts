export interface Board {
  id: string;
  name: string;
  description: string | null;
  projectId: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: { id: string; name: string | null; email: string };
  columns?: BoardColumn[];
  project?: { id: string; name: string; space?: { organizationId: string } };
  _count?: { columns: number };
}

export interface BoardColumn {
  id: string;
  name: string;
  position: number;
  wipLimit: number | null;
  boardId: string;
  tasks?: any[];
}
