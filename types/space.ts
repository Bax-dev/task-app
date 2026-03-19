export interface Space {
  id: string;
  name: string;
  description: string | null;
  color: string;
  icon: string;
  organizationId: string;
  createdAt: string;
  _count?: { projects: number };
  projects?: any[];
}

export interface CreateSpaceDTO {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  organizationId: string;
}
