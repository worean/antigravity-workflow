import { Request, Response } from 'express';
import { getCalendarEventsService } from './services/getCalendarEvents.service.js';
import { getGoogleCalendarStatusService } from './services/getGoogleCalendarStatus.service.js';
import { syncGoogleCalendarService } from './services/syncGoogleCalendar.service.js';

export const getCalendarEvents = async (req: Request, res: Response) => {
  try {
    const { projectId, startDate, endDate, onlyMyEvents } = req.query;
    const userId = (req as any).user?.id;

    const events = await getCalendarEventsService({
      projectId: projectId ? Number(projectId) : undefined,
      startDate: startDate as string | undefined,
      endDate: endDate as string | undefined,
      userId: userId ? Number(userId) : undefined,
      onlyMyEvents: onlyMyEvents === 'true',
    });

    return res.json({ events });
  } catch (error: any) {
    console.error('[CALENDAR_GET_EVENTS_ERROR]', error);
    return res.status(500).json({ error: error.message || '일정 목록을 가져오지 못했습니다.' });
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
