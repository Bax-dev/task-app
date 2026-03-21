export interface Automation {
  id: string;
  name: string;
  description: string | null;
  trigger: string;
  conditions: any;
  action: string;
  actionConfig: any;
  enabled: boolean;
  organizationId: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: { id: string; name: string | null; email: string };
}
