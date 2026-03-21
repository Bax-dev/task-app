export interface Label {
  id: string;
  name: string;
  color: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
  _count?: { taskLabels: number };
}

export interface TaskLabel {
  id: string;
  taskId: string;
  labelId: string;
  createdAt: string;
  label?: Label;
}
