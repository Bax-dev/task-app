export interface Sprint {
  id: string;
  name: string;
  goal: string | null;
  startDate: string | null;
  endDate: string | null;
  status: string;
  organizationId: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: { id: string; name: string | null; email: string };
  sprintTasks?: SprintTask[];
  _count?: { sprintTasks: number };
}

export interface SprintTask {
  id: string;
  sprintId: string;
  taskId: string;
  storyPoints: number | null;
  createdAt: string;
  task?: { id: string; title: string; taskNumber: number; status: string; priority: string; storyPoints: number | null };
}
