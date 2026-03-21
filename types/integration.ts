export interface Integration {
  id: string;
  type: string;
  name: string;
  config: any;
  enabled: boolean;
  organizationId: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: { id: string; name: string | null; email: string };
}
