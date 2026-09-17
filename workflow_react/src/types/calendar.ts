export interface CalendarEvent {
  id: string;
  issueId?: number;
  sprintId?: number;
  title: string;
  description?: string | null;
  startDate: string;
  endDate: string;
  status?: string;
  priority?: string;
  type: 'issue' | 'sprint' | 'google';
  source?: 'workflow' | 'google';
  htmlLink?: string | null;
  location?: string | null;
  project?: {
    id: number;
    name: string;
    key?: string;
    color?: string | null;
  };
  assignee?: {
    id: number;
    name: string;
    avatar?: string | null;
  } | null;
  reporter?: {
    id: number;
    name: string;
    avatar?: string | null;
  } | null;
}

export interface GoogleCalendarStatus {
  isGoogleLinked: boolean;
  googleEmail?: string | null;
  lastSyncedAt?: string | null;
  message: string;
}

export interface SyncGoogleCalendarResponse {
  success: boolean;
  message: string;
  syncedCount: number;
  lastSyncedAt: string;
  googleEmail?: string | null;
}

export type CalendarViewMode = 'month' | 'week';

export interface CalendarFilter {
  projectId?: number | 'ALL';
  startDate?: string;
  endDate?: string;
  onlyMyEvents?: boolean;
}
