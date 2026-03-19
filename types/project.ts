export interface Project {
  id: string;
  name: string;
  description: string | null;
  spaceId: string;
  createdById: string;
  createdAt: string;
  createdBy?: { id: string; name: string | null; email: string };
  space?: { id: string; name: string; organizationId: string; organization?: { id: string; name: string; slug: string } };
  _count?: { tasks: number };
}

export interface CreateProjectDTO {
  name: string;
  description?: string;
  spaceId: string;
}

export interface UpdateProjectDTO {
  name?: string;
  description?: string | null;
}
