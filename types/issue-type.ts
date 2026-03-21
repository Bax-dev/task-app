import { CustomField } from "./custom-field";

export interface IssueType {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string | null;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
  customFields?: CustomField[];
  _count?: { tasks: number; customFields: number };
}
