export interface SavedFilter {
  id: string;
  name: string;
  query: any;
  shared: boolean;
  organizationId: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: { id: string; name: string | null; email: string };
}
