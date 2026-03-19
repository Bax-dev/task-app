export interface Organization {
  id: string;
  name: string;
  slug: string;
  createdById: string;
  createdAt: string;
  _count?: { projects: number; memberships: number };
}

export interface Member {
  id: string;
  name: string | null;
  email: string;
  role: string;
}

export interface CreateOrganizationDTO {
  name: string;
  slug: string;
}
