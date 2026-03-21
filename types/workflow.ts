export interface Workflow {
  id: string;
  name: string;
  description: string | null;
  issueTypeId: string | null;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
  issueType?: { id: string; name: string };
  steps?: WorkflowStep[];
  transitions?: WorkflowTransition[];
}

export interface WorkflowStep {
  id: string;
  name: string;
  position: number;
  workflowId: string;
}

export interface WorkflowTransition {
  id: string;
  name: string;
  fromStepId: string;
  toStepId: string;
  conditions: any;
  workflowId: string;
  fromStep?: { id: string; name: string };
  toStep?: { id: string; name: string };
}
