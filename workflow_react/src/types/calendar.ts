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
  type: 'issue' | 'sprint' | 'google' | 'caldav';
  source?: 'workflow' | 'google' | 'caldav';
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

export interface GoogleCalendarItem {
  id: string;
  summary: string;
  description?: string | null;
  primary?: boolean;
  backgroundColor?: string | null;
  timeZone?: string | null;
}

export interface GetGoogleCalendarsResponse {
  success: boolean;
  isTokenExpired?: boolean;
  calendars: GoogleCalendarItem[];
  matchedWorkCalendarId?: string | null;
  message?: string;
}

export type CalendarViewMode = 'month' | 'week';

export interface CalendarFilter {
  projectId?: number | 'ALL';
  startDate?: string;
  endDate?: string;
  onlyMyEvents?: boolean;
  googleCalendarId?: string;
}

export interface CaldavStatusResponse {
  isConnected: boolean;
  serverUrl?: string;
  domain?: string;
  useSsl?: boolean;
  username?: string;
  calendarName?: string;
  color?: string;
  calendarColors?: Record<string, string>;
  calendarEnabled?: Record<string, boolean>;
  discoveredCalendars?: string[];
  lastSyncedAt?: string | null;
}

export interface CaldavConnectInput {
  serverUrl?: string;
  domain?: string;
  useSsl?: boolean;
  port?: number;
  username: string;
  password: string;
  calendarName?: string;
  color?: string;
  calendarColors?: Record<string, string>;
  calendarEnabled?: Record<string, boolean>;
}

export interface UpdateCalDavSettingsInput {
  calendarColors?: Record<string, string>;
  calendarEnabled?: Record<string, boolean>;
  color?: string;
  calendarName?: string;
}

export interface CaldavConnectResponse {
  success: boolean;
  message: string;
  discoveredCalendars?: string[];
  account?: {
    serverUrl: string;
    domain?: string;
    useSsl?: boolean;
    username: string;
    calendarName: string;
    color: string;
    calendarColors?: Record<string, string>;
    calendarEnabled?: Record<string, boolean>;
  };
}
