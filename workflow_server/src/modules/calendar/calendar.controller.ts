import { Request, Response } from 'express';
import { getCalendarEventsService } from './services/getCalendarEvents.service.js';
import { getGoogleCalendarStatusService } from './services/getGoogleCalendarStatus.service.js';
import { syncGoogleCalendarService } from './services/syncGoogleCalendar.service.js';

export const getCalendarEvents = async (req: Request, res: Response) => {
  try {
    const { projectId, startDate, endDate, onlyMyEvents, googleCalendarId } = req.query;
    const userId = (req as any).user?.id;

    const events = await getCalendarEventsService({
      projectId: projectId ? Number(projectId) : undefined,
      startDate: startDate as string | undefined,
      endDate: endDate as string | undefined,
      userId: userId ? Number(userId) : undefined,
      onlyMyEvents: onlyMyEvents === 'true',
      googleCalendarId: googleCalendarId as string | undefined,
    });

    return res.json({ events });
  } catch (error: any) {
    console.error('[CALENDAR_GET_EVENTS_ERROR]', error);
    return res.status(500).json({ error: error.message || '일정 목록을 가져오지 못했습니다.' });
  }
};

/**
 * 사용자의 Google 계정에 등록된 캘린더 목록 (직장, 기본 등) 조회
 */
export const getGoogleCalendars = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { getGoogleCalendarsService } = await import('./services/getGoogleCalendars.service.js');
    const result = await getGoogleCalendarsService(userId);
    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Google 캘린더 목록을 가져오지 못했습니다.' });
  }
};

export const getGoogleCalendarStatus = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const status = await getGoogleCalendarStatusService(userId);
    return res.json(status);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Google 캘린더 연동 상태를 확인하지 못했습니다.' });
  }
};

export const syncGoogleCalendar = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const result = await syncGoogleCalendarService(userId);
    return res.json(result);
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      error: error.message || 'Google 캘린더 동기화에 실패했습니다.',
    });
  }
};

/**
 * 프로젝트 또는 워크스페이스 일정 iCal (.ics) 파일 다운로드
 */
export const exportIcal = async (req: Request, res: Response) => {
  try {
    const { projectId, onlyMyEvents } = req.query;
    const userId = (req as any).user?.id;

    const { exportIcalService } = await import('./services/exportIcal.service.js');
    const result = await exportIcalService({
      projectId: projectId ? Number(projectId) : undefined,
      userId: userId ? Number(userId) : undefined,
      onlyMyEvents: onlyMyEvents === 'true',
    });

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    return res.send(result.icsContent);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'iCalendar 파일을 생성하지 못했습니다.' });
  }
};

/**
 * Google/Apple 캘린더 등 외부 캘린더 실시간 구독용 iCal Feed 엔드포인트
 */
export const getIcalFeed = async (req: Request, res: Response) => {
  try {
    const projectId = req.params.projectId || req.query.projectId;
    const userId = (req as any).user?.id;

    const { exportIcalService } = await import('./services/exportIcal.service.js');
    const result = await exportIcalService({
      projectId: projectId ? Number(projectId) : undefined,
      userId: userId ? Number(userId) : undefined,
    });

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    return res.send(result.icsContent);
  } catch (error: any) {
    return res.status(500).send('BEGIN:VCALENDAR\r\nVERSION:2.0\r\nEND:VCALENDAR');
  }
};

/**
 * iCalendar (.ics) 파일 텍스트 파싱 API
 */
export const parseIcal = async (req: Request, res: Response) => {
  try {
    const { icsContent } = req.body;
    const { parseIcalService } = await import('./services/parseAndSaveIcal.service.js');
    const result = parseIcalService(icsContent);
    return res.json(result);
  } catch (error: any) {
    return res.status(400).json({ error: error.message || 'iCalendar 파싱에 실패했습니다.' });
  }
};

/**
 * ----------------------------------------------------
 * CalDAV 외부 캘린더 연동 컨트롤러 (RFC 4791)
 * ----------------------------------------------------
 */

export const connectCalDav = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { serverUrl, domain, useSsl, port, username, password, calendarName, color, calendarColors } = req.body;
    const { caldavConnectService } = await import('./services/caldavConnect.service.js');
    const result = await caldavConnectService(userId, {
      serverUrl,
      domain,
      useSsl,
      port,
      username,
      password,
      calendarName,
      color,
      calendarColors,
    });
    return res.json(result);
  } catch (error: any) {
    return res.status(400).json({ error: error.message || 'CalDAV 연동에 실패했습니다.' });
  }
};

export const updateCalDavSettings = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { calendarColors, calendarEnabled, color, calendarName } = req.body;
    const { updateCalDavSettingsService } = await import('./services/caldavConnect.service.js');
    const result = await updateCalDavSettingsService(userId, {
      calendarColors,
      calendarEnabled,
      color,
      calendarName,
    });
    return res.json(result);
  } catch (error: any) {
    return res.status(400).json({ error: error.message || 'CalDAV 설정 저장 실패' });
  }
};

export const getCalDavStatus = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { getCalDavStatusService } = await import('./services/getCalDavStatus.service.js');
    const result = await getCalDavStatusService(userId);
    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'CalDAV 연동 상태 조회 실패' });
  }
};

export const disconnectCalDav = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { disconnectCalDavService } = await import('./services/disconnectCalDav.service.js');
    const result = await disconnectCalDavService(userId);
    return res.json(result);
  } catch (error: any) {
    return res.status(400).json({ error: error.message || 'CalDAV 연동 해제 실패' });
  }
};

export const getCalDavEvents = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { startDate, endDate, refresh } = req.query;
    const { getCalDavEventsService } = await import('./services/getCalDavEvents.service.js');
    const events = await getCalDavEventsService(userId, {
      startDate: startDate as string | undefined,
      endDate: endDate as string | undefined,
      forceRefresh: refresh === 'true' || refresh === '1',
    });
    return res.json({ events });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'CalDAV 일정 조회 실패' });
  }
};

export const syncCalDav = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { forceSyncCalDavService } = await import('./services/getCalDavEvents.service.js');
    const events = await forceSyncCalDavService(userId);
    return res.json({
      success: true,
      message: 'CalDAV 일정 동기화가 완료되었습니다.',
      count: events.length,
      events,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'CalDAV 동기화 실패' });
  }
};

