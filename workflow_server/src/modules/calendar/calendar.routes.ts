import { Router } from 'express';
import * as calendarController from './calendar.controller.js';
import { requireAuth } from '../../common/middlewares/authMiddleware.js';

export const calendarRouter = Router();

// 1. 워크스페이스 캘린더 일정 목록 조회 (이슈 및 스프린트)
calendarRouter.get('/events', requireAuth, calendarController.getCalendarEvents);

// 2. Google Calendar 연동 상태 조회 (현재 로그인 유저의 Google 계정 연동 여부)
calendarRouter.get('/google/status', requireAuth, calendarController.getGoogleCalendarStatus);

// 3. Google Calendar 수동 동기화 (오직 Google 로그인 유저만 허용)
calendarRouter.post('/sync/google', requireAuth, calendarController.syncGoogleCalendar);
