import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import type { CalendarEvent, GoogleCalendarStatus, SyncGoogleCalendarResponse, CalendarFilter } from '@/types';

// ----------------------------------------------------
// 1. Raw API Functions
// ----------------------------------------------------

/**
 * 캘린더 일정(이슈 및 스프린트) 목록 조회
 */
export const getCalendarEvents = async (filter?: CalendarFilter): Promise<CalendarEvent[]> => {
  const params: any = {};
  if (filter?.projectId && filter.projectId !== 'ALL') {
    params.projectId = filter.projectId;
  }
  if (filter?.startDate) params.startDate = filter.startDate;
  if (filter?.endDate) params.endDate = filter.endDate;
  if (filter?.onlyMyEvents) params.onlyMyEvents = true;

  const res = await apiClient.get<{ events: CalendarEvent[] }>('/calendar/events', { params });
  return res.data.events || [];
};

/**
 * Google Calendar 연동 자격 상태 조회
 */
export const getGoogleCalendarStatus = async (): Promise<GoogleCalendarStatus> => {
  const res = await apiClient.get<GoogleCalendarStatus>('/calendar/google/status');
  return res.data;
};

/**
 * Google Calendar 수동 동기화 요청
 */
export const syncGoogleCalendar = async (): Promise<SyncGoogleCalendarResponse> => {
  const res = await apiClient.post<SyncGoogleCalendarResponse>('/calendar/sync/google');
  return res.data;
};

// ----------------------------------------------------
// 2. TanStack Query Hooks
// ----------------------------------------------------

export const calendarKeys = {
  all: ['calendar'] as const,
  events: (filter?: CalendarFilter) => [...calendarKeys.all, 'events', filter] as const,
  googleStatus: () => [...calendarKeys.all, 'googleStatus'] as const,
};

export const useCalendarEvents = (filter?: CalendarFilter) => {
  return useQuery({
    queryKey: calendarKeys.events(filter),
    queryFn: () => getCalendarEvents(filter),
    staleTime: 1000 * 30, // 30초
  });
};

export const useGoogleCalendarStatus = () => {
  return useQuery({
    queryKey: calendarKeys.googleStatus(),
    queryFn: getGoogleCalendarStatus,
    staleTime: 1000 * 60 * 2, // 2분
  });
};

export const useSyncGoogleCalendar = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: syncGoogleCalendar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calendarKeys.googleStatus() });
      queryClient.invalidateQueries({ queryKey: calendarKeys.all });
    },
  });
};
