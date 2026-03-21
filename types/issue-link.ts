export interface IssueLink {
  id: string;
  sourceTaskId: string;
  targetTaskId: string;
  linkType: string;
  createdAt: string;
  sourceTask?: { id: string; title: string; taskNumber: number; status?: string };
  targetTask?: { id: string; title: string; taskNumber: number; status?: string };
}
