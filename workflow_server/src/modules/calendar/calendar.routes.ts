import { Router } from 'express';
import * as calendarController from './calendar.controller.js';
import { requireAuth } from '../../common/middlewares/authMiddleware.js';

export const calendarRouter = Router();

// 1. 워크스페이스 캘린더 일정 목록 조회 (이슈 및 스프린트)
calendarRouter.get('/events', requireAuth, calendarController.getCalendarEvents);

// 2. Google Calendar 연동 상태 조회 (현재 로그인 유저의 Google 계정 연동 여부)
calendarRouter.get('/google/status', requireAuth, calendarController.getGoogleCalendarStatus);

// 2-1. Google 캘린더 목록 (직장, 기본 등) 조회
calendarRouter.get('/google/calendars', requireAuth, calendarController.getGoogleCalendars);

// 3. Google Calendar 수동 동기화 (오직 Google 로그인 유저만 허용)
calendarRouter.post('/sync/google', requireAuth, calendarController.syncGoogleCalendar);

// 4. 프로젝트/워크스페이스 일정 iCal (.ics) 파일 다운로드
calendarRouter.get('/ical/export', requireAuth, calendarController.exportIcal);

// 5. 외부 캘린더 실시간 구독 피드 (Google / Apple / Outlook Calendar)
calendarRouter.get('/ical/feed', calendarController.getIcalFeed);
calendarRouter.get('/ical/feed/projects/:projectId', calendarController.getIcalFeed);

// 6. iCalendar (.ics) 파일 텍스트 파싱
calendarRouter.post('/ical/parse', requireAuth, calendarController.parseIcal);

// 7. 외부 CalDAV 연동 (RFC 4791)
calendarRouter.post('/caldav/connect', requireAuth, calendarController.connectCalDav);
calendarRouter.put('/caldav/settings', requireAuth, calendarController.updateCalDavSettings);
calendarRouter.get('/caldav/status', requireAuth, calendarController.getCalDavStatus);
calendarRouter.delete('/caldav/disconnect', requireAuth, calendarController.disconnectCalDav);
calendarRouter.get('/caldav/events', requireAuth, calendarController.getCalDavEvents);
calendarRouter.post('/caldav/sync', requireAuth, calendarController.syncCalDav);

