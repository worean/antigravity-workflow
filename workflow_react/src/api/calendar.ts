import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import type {
  CalendarEvent,
  GoogleCalendarStatus,
  SyncGoogleCalendarResponse,
  CalendarFilter,
  GetGoogleCalendarsResponse,
  CaldavStatusResponse,
  CaldavConnectInput,
  CaldavConnectResponse,
  UpdateCalDavSettingsInput,
} from '@/types';

// ----------------------------------------------------
// 1. Raw API Functions
// ----------------------------------------------------

/**
 * 캘린더 일정(이슈 및 스프린트, Google 일정) 목록 조회
 */
export const getCalendarEvents = async (filter?: CalendarFilter): Promise<CalendarEvent[]> => {
  const params: any = {};
  if (filter?.projectId && filter.projectId !== 'ALL') {
    params.projectId = filter.projectId;
  }
  if (filter?.startDate) params.startDate = filter.startDate;
  if (filter?.endDate) params.endDate = filter.endDate;
  if (filter?.onlyMyEvents) params.onlyMyEvents = true;
  if (filter?.googleCalendarId) params.googleCalendarId = filter.googleCalendarId;

  try {
    const res = await apiClient.get<{ events: CalendarEvent[] }>('/calendar/events', { params });
    const events = res.data.events || [];
    const googleEvents = events.filter((e) => e.type === 'google' || e.source === 'google');
    const caldavEvents = events.filter((e) => e.type === 'caldav' || e.source === 'caldav');

    console.group('📅 [Calendar Events Debug] 일정 조회 결과');
    console.log('📌 전체 일정 건수:', events.length);
    console.log('🌐 Google Calendar 일정 건수:', googleEvents.length);
    console.log('🟣 CalDAV 일정 건수:', caldavEvents.length);
    if (caldavEvents.length > 0) {
      console.log('✅ 수신된 CalDAV 일정 목록:', caldavEvents);
      caldavEvents.slice(0, 5).forEach((ev, idx) => {
        console.log(`   [CalDAV #${idx + 1}] "${ev.title}" (${ev.startDate} ~ ${ev.endDate}) [달력: ${ev.project?.name}]`);
      });
    }
    console.groupEnd();

    return events;
  } catch (err: any) {
    console.error('❌ [Google Calendar Debug] 일정 조회 실패:', err);
    throw err;
  }
};

/**
 * Google Calendar 연동 자격 상태 조회
 */
export const getGoogleCalendarStatus = async (): Promise<GoogleCalendarStatus> => {
  try {
    const res = await apiClient.get<GoogleCalendarStatus>('/calendar/google/status');
    const data = res.data;

    console.group('🔗 [Google Calendar Debug] 계정 연동 상태 확인');
    console.log('Google 계정 연동 여부:', data.isGoogleLinked ? '✅ 연동됨' : '❌ 미연동');
    console.log('Google 이메일:', data.googleEmail || '(없음)');
    console.log('마지막 동기화 시각:', data.lastSyncedAt || '(기록 없음)');
    console.log('상태 메시지:', data.message);
    console.groupEnd();

    return data;
  } catch (err: any) {
    console.error('❌ [Google Calendar Debug] 연동 상태 조회 실패:', err);
    throw err;
  }
};

/**
 * Google Calendar 수동 동기화 요청
 */
export const syncGoogleCalendar = async (): Promise<SyncGoogleCalendarResponse> => {
  console.log('🔄 [Google Calendar Debug] 수동 동기화 요청 시작...');
  try {
    const res = await apiClient.post<SyncGoogleCalendarResponse>('/calendar/sync/google');
    console.log('🔄 [Google Calendar Debug] 수동 동기화 응답:', res.data);
    return res.data;
  } catch (err: any) {
    console.error('❌ [Google Calendar Debug] 수동 동기화 실패:', err);
    throw err;
  }
};

/**
 * 프로젝트 / 워크스페이스 일정 iCal (.ics) 파일 다운로드
 */
export const downloadIcalFile = async (
  projectId?: number | 'ALL',
  onlyMyEvents?: boolean
): Promise<void> => {
  const params: any = {};
  if (projectId && projectId !== 'ALL') params.projectId = projectId;
  if (onlyMyEvents) params.onlyMyEvents = true;

  const res = await apiClient.get('/calendar/ical/export', {
    params,
    responseType: 'blob',
  });

  const blob = new Blob([res.data], { type: 'text/calendar;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `calendar-${projectId && projectId !== 'ALL' ? `proj-${projectId}` : 'workspace'}-${Date.now()}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};

/**
 * 외부 캘린더 (Google Calendar, Apple, Outlook) 실시간 구독용 webcal/http URL 생성
 */
export const getIcalFeedUrl = (projectId?: number | 'ALL'): string => {
  const base = window.location.origin;
  if (projectId && projectId !== 'ALL') {
    return `${base}/api/calendar/ical/feed/projects/${projectId}`;
  }
  return `${base}/api/calendar/ical/feed`;
};

/**
 * 사용자의 Google 계정에 등록된 캘린더 목록 (직장, 기본 등) 조회
 */
export const getGoogleCalendars = async (): Promise<GetGoogleCalendarsResponse> => {
  try {
    const res = await apiClient.get<GetGoogleCalendarsResponse>('/calendar/google/calendars');
    return res.data;
  } catch (err: any) {
    console.error('❌ [Google Calendar Debug] Google 캘린더 목록 조회 실패:', err);
    return {
      success: false,
      calendars: [],
      message: err.message || '캘린더 목록을 가져오지 못했습니다.',
    };
  }
};

/**
 * CalDAV 연동 상태 조회
 */
export const getCalDavStatus = async (): Promise<CaldavStatusResponse> => {
  try {
    const res = await apiClient.get<CaldavStatusResponse>('/calendar/caldav/status');
    return res.data;
  } catch (err: any) {
    return { isConnected: false };
  }
};

/**
 * CalDAV 연결 테스트 및 계정 등록
 */
export const connectCalDav = async (input: CaldavConnectInput): Promise<CaldavConnectResponse> => {
  const res = await apiClient.post<CaldavConnectResponse>('/calendar/caldav/connect', input);
  return res.data;
};

/**
 * CalDAV 연동 해제
 */
export const disconnectCalDav = async (): Promise<{ success: boolean; message: string }> => {
  const res = await apiClient.delete<{ success: boolean; message: string }>('/calendar/caldav/disconnect');
  return res.data;
};

/**
 * CalDAV 캘린더별 색상 및 On/Off 설정 업데이트
 */
export const updateCalDavSettings = async (
  input: UpdateCalDavSettingsInput
): Promise<{ success: boolean; calendarColors?: Record<string, string>; calendarEnabled?: Record<string, boolean> }> => {
  const res = await apiClient.put<{ success: boolean; calendarColors?: Record<string, string>; calendarEnabled?: Record<string, boolean> }>(
    '/calendar/caldav/settings',
    input
  );
  return res.data;
};

/**
 * CalDAV 일정 수동 강제 동기화 (백그라운드 즉시 수집 트리거)
 */
export const syncCalDav = async (): Promise<{ success: boolean; message: string; count: number }> => {
  const res = await apiClient.post<{ success: boolean; message: string; count: number }>('/calendar/caldav/sync');
  return res.data;
};

// ----------------------------------------------------
// 2. TanStack Query Hooks
// ----------------------------------------------------

export const calendarKeys = {
  all: ['calendar'] as const,
  events: (filter?: CalendarFilter) => [...calendarKeys.all, 'events', filter] as const,
  googleStatus: () => [...calendarKeys.all, 'googleStatus'] as const,
  googleCalendars: () => [...calendarKeys.all, 'googleCalendars'] as const,
  caldavStatus: () => [...calendarKeys.all, 'caldavStatus'] as const,
};

export const useCalendarEvents = (filter?: CalendarFilter) => {
  return useQuery({
    queryKey: calendarKeys.events(filter),
    queryFn: () => getCalendarEvents(filter),
    staleTime: 1000 * 60 * 5, // 5분
    placeholderData: (previousData) => previousData, // 새 데이터 수집 전까지 이전 캘린더 항목 화면 유지!
    refetchInterval: 1000 * 60 * 5, // ⏰ 5분마다 백그라운드 자동 갱신
    refetchIntervalInBackground: false, // 탭 비활성 시 리소스 절약
    refetchOnWindowFocus: true, // 탭 복귀 시 최신 일정 즉시 자동 갱신
  });
};

export const useGoogleCalendarStatus = () => {
  return useQuery({
    queryKey: calendarKeys.googleStatus(),
    queryFn: getGoogleCalendarStatus,
    staleTime: 1000 * 60 * 2, // 2분
  });
};

export const useGoogleCalendars = () => {
  return useQuery({
    queryKey: calendarKeys.googleCalendars(),
    queryFn: getGoogleCalendars,
    staleTime: 1000 * 60 * 5, // 5분
  });
};

export const useSyncGoogleCalendar = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: syncGoogleCalendar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calendarKeys.googleStatus() });
      queryClient.invalidateQueries({ queryKey: calendarKeys.googleCalendars() });
      queryClient.invalidateQueries({ queryKey: calendarKeys.all });
    },
  });
};

export const useCalDavStatus = () => {
  return useQuery({
    queryKey: calendarKeys.caldavStatus(),
    queryFn: getCalDavStatus,
    staleTime: 1000 * 60 * 3, // 3분
  });
};

export const useConnectCalDav = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: connectCalDav,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calendarKeys.caldavStatus() });
      queryClient.invalidateQueries({ queryKey: calendarKeys.all });
    },
  });
};

export const useUpdateCalDavSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateCalDavSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calendarKeys.caldavStatus() });
      queryClient.invalidateQueries({ queryKey: calendarKeys.all });
    },
  });
};

export const useDisconnectCalDav = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: disconnectCalDav,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calendarKeys.caldavStatus() });
      queryClient.invalidateQueries({ queryKey: calendarKeys.all });
    },
  });
};

export const useSyncCalDav = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: syncCalDav,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calendarKeys.all });
      queryClient.invalidateQueries({ queryKey: calendarKeys.caldavStatus() });
    },
  });
};
