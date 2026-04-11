export type Weekday =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY';

export interface DailyReportSchedule {
  id: string;
  organizationId: string;
  time: string;
  timezone: string;
  weekdays: Weekday[];
  enabled: boolean;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface DailyReport {
  id: string;
  organizationId: string;
  createdById: string;
  reportDate: string;
  whatDid: string;
  blockers: string | null;
  goalTomorrow: string;
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    name: string | null;
    email: string;
  };
}

export interface DailyReportsOverview {
  reports: DailyReport[];
  memberCount: number;
  submittedCount: number;
  isAdmin: boolean;
}
