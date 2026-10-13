/**
 * 🧪 [Domain: calendar / Service: getCalendarEvents]
 * - 기능: 캘린더 일정(이슈 및 스프린트 마일스톤) 목록 조회 API 테스트
 * - 검증 항목:
 *   1. 워크스페이스 이슈 일정 및 스프린트 일정 정상 반환
 *   2. projectId 및 날짜 필터링 정상 동작
 *   3. 미인증 요청 시 401 Unauthorized 차단
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { prisma } from '#lib/prisma.js';
import { globalPrisma } from '#lib/globalPrisma.js';
import jwt from 'jsonwebtoken';

describe('🧪 [Calendar Events API] GET /api/calendar/events', () => {
  let authToken: string;
  let testUser: any;
  let testProject: any;
  let testIssue1: any;
  let testIssue2: any;
  let testSprint: any;

  beforeAll(async () => {
    // 1. 테스트 유저 생성 (Workspace & Global)
    const uniqueEmail = `cal_user_${Date.now()}@example.com`;
    testUser = await prisma.user.create({
      data: {
        email: uniqueEmail,
        name: 'Calendar Test User',
        password: 'hashedPassword123',
      },
    });
    await globalPrisma.user.create({
      data: {
        id: testUser.id,
        email: uniqueEmail,
        name: 'Calendar Test User',
        password: 'hashedPassword123',
      },
    }).catch(() => {});

    // 2. JWT 토큰 발급
    const jwtSecret = process.env.JWT_SECRET || 'antigravity-jwt-secret-key-2026';
    authToken = jwt.sign(
      { userId: testUser.id, email: testUser.email, name: testUser.name },
      jwtSecret,
      { expiresIn: '1d' }
    );

    // 3. 테스트 프로젝트 생성
    testProject = await prisma.project.create({
      data: {
        name: 'Calendar Test Project',
        key: `CAL_${Date.now()}`.slice(0, 10),
        ownerId: testUser.id,
      },
    });

    // 4. 테스트 이슈 생성 (시작일/마감일 포함)
    const today = new Date();
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const issueRes1 = await request(app)
      .post('/api/issues')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Calendar Task 1',
        projectId: testProject.id,
        plannedStartDate: today.toISOString(),
        dueDate: nextWeek.toISOString(),
      });
    testIssue1 = issueRes1.body;

    const issueRes2 = await request(app)
      .post('/api/issues')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Calendar Task 2 Without Due Date',
        projectId: testProject.id,
      });
    testIssue2 = issueRes2.body;

    // 5. 테스트 스프린트 생성
    testSprint = await prisma.sprint.create({
      data: {
        name: 'Sprint 2026-Q1',
        project: { connect: { id: testProject.id } },
        startDate: today,
        endDate: nextWeek,
        status: 'ACTIVE',
      },
    });
  });

  afterAll(async () => {
    // 데이터 정리
    if (testIssue1) await prisma.issue.delete({ where: { id: testIssue1.id } }).catch(() => {});
    if (testIssue2) await prisma.issue.delete({ where: { id: testIssue2.id } }).catch(() => {});
    if (testSprint) await prisma.sprint.delete({ where: { id: testSprint.id } }).catch(() => {});
    if (testProject) await prisma.project.delete({ where: { id: testProject.id } }).catch(() => {});
    if (testUser) {
      await prisma.user.delete({ where: { id: testUser.id } }).catch(() => {});
      await globalPrisma.user.delete({ where: { id: testUser.id } }).catch(() => {});
    }
  });

  it('1️⃣ 미인증 요청 시 401 Unauthorized 반환', async () => {
    const res = await request(app).get('/api/calendar/events');
    expect(res.status).toBe(401);
  });

  it('2️⃣ 인증된 유저의 워크스페이스 캘린더 이벤트 목록 정상 조회', async () => {
    const res = await request(app)
      .get('/api/calendar/events')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('events');
    expect(Array.isArray(res.body.events)).toBe(true);

    // 우리가 생성한 이슈 및 스프린트가 포함되어 있는지 확인
    const issueEvent = res.body.events.find((e: any) => e.issueId === testIssue1.id);
    expect(issueEvent).toBeDefined();
    expect(issueEvent.title).toBe('Calendar Task 1');
    expect(issueEvent.type).toBe('issue');
    expect(issueEvent.startDate).toBeDefined();
    expect(issueEvent.endDate).toBeDefined();

    const sprintEvent = res.body.events.find((e: any) => e.sprintId === testSprint.id);
    expect(sprintEvent).toBeDefined();
    expect(sprintEvent.type).toBe('sprint');
  });

  it('3️⃣ projectId 필터링 적용 시 해당 프로젝트의 이벤트만 반환', async () => {
    const res = await request(app)
      .get(`/api/calendar/events?projectId=${testProject.id}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    const events = res.body.events;
    expect(events.length).toBeGreaterThanOrEqual(2);
    events.forEach((event: any) => {
      if (event.project) {
        expect(event.project.id).toBe(testProject.id);
      }
    });
  });

  it('4️⃣ onlyMyEvents=true 적용 시 담당자/보고자가 본인인 이슈만 반환 및 스프린트 제외', async () => {
    // testIssue1의 assignee를 testUser로 설정
    await prisma.issue.update({
      where: { id: testIssue1.id },
      data: { assigneeId: testUser.id },
    });

    const res = await request(app)
      .get(`/api/calendar/events?onlyMyEvents=true`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    const events = res.body.events;
    // 스프린트 일정은 제외되어야 함
    expect(events.some((e: any) => e.type === 'sprint')).toBe(false);
    // 본인이 담당자인 testIssue1은 포함되어야 함
    expect(events.some((e: any) => e.issueId === testIssue1.id)).toBe(true);
  });

  it('5️⃣ Google 소셜 계정 연동 유저의 경우 Google 캘린더 일정(type: google) 반환', async () => {
    // testUser에게 Google 소셜 계정 연동 추가
    const socialAccount = await globalPrisma.socialAccount.create({
      data: {
        provider: 'GOOGLE',
        providerId: `google_test_${Date.now()}`,
        email: testUser.email,
        accessToken: 'dummy_google_access_token',
        userId: testUser.id,
      },
    });

    const mockCalendarList = {
      items: [
        { id: 'work_calendar_id', summary: '직장 달력', primary: false },
        { id: 'primary', summary: '개인 달력', primary: true },
      ],
    };

    const mockEventsList = {
      items: [
        {
          id: 'mock_work_event_1',
          summary: '직장 주간 싱크 미팅',
          description: '실제 구글 직장 달력 일정',
          start: { dateTime: '2026-10-15T09:00:00Z' },
          end: { dateTime: '2026-10-15T10:00:00Z' },
          htmlLink: 'https://calendar.google.com/event?eid=mock_work_1',
        },
      ],
    };

    const fetchSpy = vi.spyOn(global, 'fetch').mockImplementation(async (url: any) => {
      const urlStr = String(url);
      if (urlStr.includes('/users/me/calendarList')) {
        return {
          ok: true,
          status: 200,
          statusText: 'OK',
          text: async () => JSON.stringify(mockCalendarList),
          json: async () => mockCalendarList,
        } as any;
      }
      if (urlStr.includes('/events')) {
        return {
          ok: true,
          status: 200,
          statusText: 'OK',
          text: async () => JSON.stringify(mockEventsList),
          json: async () => mockEventsList,
        } as any;
      }
      return { ok: false, status: 404, text: async () => 'Not found' } as any;
    });

    try {
      const res = await request(app)
        .get('/api/calendar/events')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      const events = res.body.events;
      const googleEvents = events.filter((e: any) => e.type === 'google');
      expect(googleEvents.length).toBeGreaterThan(0);
      expect(googleEvents[0].source).toBe('google');
      expect(googleEvents[0].title).toBe('직장 주간 싱크 미팅');
    } finally {
      fetchSpy.mockRestore();
      await globalPrisma.socialAccount.delete({
        where: { id: socialAccount.id },
      }).catch(() => {});
    }
  });

  it('6️⃣ Google 캘린더 목록 조회 시 "직장" 달력 자동 매칭 확인 (GET /api/calendar/google/calendars)', async () => {
    const socialAccount = await globalPrisma.socialAccount.create({
      data: {
        provider: 'GOOGLE',
        providerId: `google_cal_test_${Date.now()}`,
        email: testUser.email,
        accessToken: 'dummy_google_cal_token',
        userId: testUser.id,
      },
    });

    const fetchSpy = vi.spyOn(global, 'fetch').mockImplementation(async (url: any) => {
      if (String(url).includes('/users/me/calendarList')) {
        return {
          ok: true,
          status: 200,
          statusText: 'OK',
          text: async () => '',
          json: async () => ({
            items: [
              { id: 'work_team_cal', summary: '직장 (업무 캘린더)', primary: false },
              { id: 'personal_cal', summary: '개인', primary: true },
            ],
          }),
        } as any;
      }
      return { ok: false, status: 404, text: async () => 'Not found' } as any;
    });

    try {
      const res = await request(app)
        .get('/api/calendar/google/calendars')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.calendars.length).toBe(2);
      expect(res.body.matchedWorkCalendarId).toBe('work_team_cal');
    } finally {
      fetchSpy.mockRestore();
      await globalPrisma.socialAccount.delete({
        where: { id: socialAccount.id },
      }).catch(() => {});
    }
  });
});
