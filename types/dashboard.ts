export interface Dashboard {
  id: string;
  name: string;
  layout: any;
  organizationId: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: { id: string; name: string | null; email: string };
}
