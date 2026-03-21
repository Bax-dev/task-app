export interface CustomField {
  id: string;
  name: string;
  fieldType: string;
  options: any;
  required: boolean;
  issueTypeId: string | null;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
  issueType?: { id: string; name: string };
  _count?: { values: number };
}

export interface CustomFieldValue {
  id: string;
  value: string;
  customFieldId: string;
  taskId: string;
  customField?: CustomField;
}
