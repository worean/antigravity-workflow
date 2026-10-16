/**
 * 🧪 [Domain: calendar / Service: CalDAV Client & Events Integration]
 * - 기능: RFC 4791 CalDAV 외부 캘린더 연동 및 일정 수신 API 테스트
 * - 검증 항목:
 *   1. CalDAV XML 쿼리 빌더 및 Multi-Status 파서 검증
 *   2. POST /api/calendar/caldav/connect - 계정 연결 테스트 및 저장
 *   3. GET /api/calendar/caldav/status - 연동 상태 확인
 *   4. GET /api/calendar/caldav/events - 외부 CalDAV 일정 조회 및 DTO 변환
 *   5. GET /api/calendar/events - 메인 캘린더 조회 시 CalDAV 일정 자동 병합
 *   6. DELETE /api/calendar/caldav/disconnect - 연동 해제
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { prisma } from '#lib/prisma.js';
import { globalPrisma } from '#lib/globalPrisma.js';
import jwt from 'jsonwebtoken';
import {
  buildCalDavReportQuery,
  extractCalendarDataFromXml,
  normalizeCaldavUrl,
} from '#lib/caldavClient.js';
import { clearCalDavCache } from '../modules/calendar/services/getCalDavEvents.service.js';
import { syncAllRegisteredCalDavAccounts } from '../modules/calendar/services/caldavScheduler.service.js';

describe('🧪 [CalDAV Integration API] CalDAV 클라이언트 및 일정 연동 테스트', () => {
  let authToken: string;
  let testUser: any;
  let testWorkspace: any;

  beforeAll(async () => {
    const uniqueEmail = `caldav_user_${Date.now()}@example.com`;
    // 1. 테스트 유저 생성
    testUser = await prisma.user.create({
      data: {
        email: uniqueEmail,
        name: 'CalDAV Test User',
        password: 'hashed_password',
        role: 'MEMBER',
      },
    });

    await globalPrisma.user.create({
      data: {
        id: testUser.id,
        email: uniqueEmail,
        name: 'CalDAV Test User',
        password: 'hashed_password',
        role: 'MEMBER',
      },
    }).catch(() => {});
    await globalPrisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('"User"', 'id'), GREATEST(COALESCE((SELECT MAX(id) FROM "User"), 1), 1));`).catch(() => {});

    const jwtSecret = process.env.JWT_SECRET || 'antigravity-jwt-secret-key-2026';
    authToken = jwt.sign(
      { userId: testUser.id, email: testUser.email },
      jwtSecret,
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    try {
      await globalPrisma.socialAccount.deleteMany({
        where: { userId: testUser.id },
      });
      await prisma.socialAccount.deleteMany({
        where: { userId: testUser.id },
      });
      await globalPrisma.user.delete({ where: { id: testUser.id } }).catch(() => {});
      await prisma.user.delete({ where: { id: testUser.id } }).catch(() => {});
    } catch {}
  });

  // 1. 유틸리티 단위 테스트
  it('1️⃣ CalDAV XML 쿼리 빌더 및 Multi-Status 파서 단위 검증', () => {
    const reportXml = buildCalDavReportQuery('2026-10-01', '2026-10-31');
    expect(reportXml).toContain('<c:calendar-query');
    expect(reportXml).toContain('<c:time-range');
    expect(reportXml).toContain('20261001T');

    const sampleMultiStatusXml = `<?xml version="1.0" encoding="utf-8" ?>
<d:multistatus xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav">
  <d:response>
    <d:href>/caldav/events/1.ics</d:href>
    <d:propstat>
      <d:prop>
        <c:calendar-data><![CDATA[BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:sample-caldav-uid-001
SUMMARY:디자인 팀 CalDAV 주간 스프린트
DTSTART:20261015T100000Z
DTEND:20261015T110000Z
DESCRIPTION:Nextcloud CalDAV 서버 연동 일정
END:VEVENT
END:VCALENDAR]]></c:calendar-data>
      </d:prop>
      <d:status>HTTP/1.1 200 OK</d:status>
    </d:propstat>
  </d:response>
</d:multistatus>`;

    const extracted = extractCalendarDataFromXml(sampleMultiStatusXml);
    expect(extracted.length).toBe(1);
    expect(extracted[0]).toContain('BEGIN:VEVENT');
    expect(extracted[0]).toContain('디자인 팀 CalDAV 주간 스프린트');

    const normalized = normalizeCaldavUrl('caldav.example.com/dav');
    expect(normalized).toBe('https://caldav.example.com/dav');
  });

  // 2. CalDAV 연결 테스트 및 계정 등록
  it('2️⃣ POST /api/calendar/caldav/connect - 계정 연결 테스트 및 저장', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockImplementation(async (url: any, opts: any) => {
      return {
        ok: true,
        status: 207,
        statusText: 'Multi-Status',
        headers: {
          get: (header: string) => (header.toLowerCase() === 'dav' ? '1, calendar-access' : null),
        },
        text: async () => '<?xml version="1.0"?><d:multistatus xmlns:d="DAV:"/>',
      } as any;
    });

    try {
      const res = await request(app)
        .post('/api/calendar/caldav/connect')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          serverUrl: 'https://caldav.nextcloud.test/remote.php/dav/calendars/work',
          username: 'nextcloud_user',
          password: 'app-password-1234',
          calendarName: '직장 Nextcloud 달력',
          color: '#8a2be2',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.account.calendarName).toBe('직장 Nextcloud 달력');
      expect(res.body.account.username).toBe('nextcloud_user');
    } finally {
      fetchSpy.mockRestore();
    }
  });

  // 3. CalDAV 연동 상태 조회
  it('3️⃣ GET /api/calendar/caldav/status - 연동 상태 확인 (비밀번호 미노출)', async () => {
    const res = await request(app)
      .get('/api/calendar/caldav/status')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.isConnected).toBe(true);
    expect(res.body.serverUrl).toBe('https://caldav.nextcloud.test/remote.php/dav/calendars/work');
    expect(res.body.username).toBe('nextcloud_user');
    expect(res.body.calendarName).toBe('직장 Nextcloud 달력');
    expect(res.body.password).toBeUndefined(); // 비밀번호 절대 미노출
  });

  // 3-1. CalDAV 캘린더별 색상 설정 업데이트
  it('3️⃣-1 PUT /api/calendar/caldav/settings - 각 캘린더별 색상 설정 저장', async () => {
    const res = await request(app)
      .put('/api/calendar/caldav/settings')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        calendarColors: {
          '회의일정': '#3b82f6',
          '휴가일정': '#10b981',
        },
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.calendarColors['회의일정']).toBe('#3b82f6');
    expect(res.body.calendarColors['휴가일정']).toBe('#10b981');
  });

  // 3-2. CalDAV 캘린더별 On/Off(활성화/비활성화) 설정 업데이트
  it('3️⃣-2 PUT /api/calendar/caldav/settings - 각 캘린더별 On/Off(활성화/비활성화) 설정 저장', async () => {
    const res = await request(app)
      .put('/api/calendar/caldav/settings')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        calendarEnabled: {
          '회의일정': true,
          '휴가일정': false,
        },
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.calendarEnabled['회의일정']).toBe(true);
    expect(res.body.calendarEnabled['휴가일정']).toBe(false);

    // GET /api/calendar/caldav/status 에서도 calendarEnabled 정상 반환 검증
    const statusRes = await request(app)
      .get('/api/calendar/caldav/status')
      .set('Authorization', `Bearer ${authToken}`);

    expect(statusRes.status).toBe(200);
    expect(statusRes.body.calendarEnabled['휴가일정']).toBe(false);
  });

  // 4. CalDAV 일정 조회 및 DTO 변환
  it('4️⃣ GET /api/calendar/caldav/events - 외부 CalDAV 일정 조회', async () => {
    const mockCalDavXml = `<?xml version="1.0" encoding="utf-8" ?>
<d:multistatus xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav">
  <d:response>
    <d:propstat>
      <d:prop>
        <c:calendar-data>BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:caldav-event-uuid-999
SUMMARY:글로벌 파트너스 온라인 싱크
DTSTART:20261020T140000Z
DTEND:20261020T150000Z
LOCATION:Zoom Conference Room
DESCRIPTION:CalDAV를 통해 가져온 외부 일정
END:VEVENT
END:VCALENDAR</c:calendar-data>
      </d:prop>
    </d:propstat>
  </d:response>
</d:multistatus>`;

    const fetchSpy = vi.spyOn(global, 'fetch').mockImplementation(async () => {
      return {
        ok: true,
        status: 207,
        statusText: 'Multi-Status',
        text: async () => mockCalDavXml,
      } as any;
    });

    try {
      const res = await request(app)
        .get('/api/calendar/caldav/events')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.events)).toBe(true);
      expect(res.body.events.length).toBe(1);

      const ev = res.body.events[0];
      expect(ev.id).toBe('caldav_caldav-event-uuid-999');
      expect(ev.title).toBe('글로벌 파트너스 온라인 싱크');
      expect(ev.type).toBe('caldav');
      expect(ev.source).toBe('caldav');
      expect(ev.location).toBe('Zoom Conference Room');
      expect(ev.project.name).toBe('직장 Nextcloud 달력');
    } finally {
      fetchSpy.mockRestore();
    }
  });

  // 5. 메인 캘린더 전체 일정 조회 시 이전에 캐시된 CalDAV 일정 즉각 병합 (0ms 반환)
  it('5️⃣ GET /api/calendar/events - 메인 캘린더 조회 시 이전 캐시 일정 즉각 병합', async () => {
    const res = await request(app)
      .get('/api/calendar/events')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    const events = res.body.events;
    const caldavEvents = events.filter((e: any) => e.type === 'caldav' || e.source === 'caldav');
    expect(caldavEvents.length).toBe(1);
    expect(caldavEvents[0].title).toBe('글로벌 파트너스 온라인 싱크');
  });

  // 5-1. 캐시 존재 시 외부 통신 없이 즉각 이전 항목 반환 검증 (0ms Instant Cache)
  it('5️⃣-1 캐시 존재 시 외부 통신 없이 즉각 이전 캐시 일정 반환 검증', async () => {
    // fetch가 호출되지 않는지 스파이로 감시
    const fetchSpy = vi.spyOn(global, 'fetch');

    try {
      const res = await request(app)
        .get('/api/calendar/caldav/events')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.events.length).toBe(1);
      expect(res.body.events[0].title).toBe('글로벌 파트너스 온라인 싱크');
      // 캐시 유효 시간 내이므로 외부 fetch 통신이 호출되지 않음!
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally {
      fetchSpy.mockRestore();
    }
  });

  // 5-2. POST /api/calendar/caldav/sync - 수동 동기화 요청 시 백그라운드 강제 갱신
  it('5️⃣-2 POST /api/calendar/caldav/sync - 수동 동기화 요청 시 최신 일정 즉시 갱신', async () => {
    const updatedMockXml = `<?xml version="1.0" encoding="utf-8" ?>
<d:multistatus xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav">
  <d:response>
    <d:propstat>
      <d:prop>
        <c:calendar-data>BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:manual-sync-event-1
SUMMARY:수동 새로고침으로 갱신된 최신 일정
DTSTART:20261025T090000Z
DTEND:20261025T100000Z
END:VEVENT
END:VCALENDAR</c:calendar-data>
      </d:prop>
    </d:propstat>
  </d:response>
</d:multistatus>`;

    const fetchSpy = vi.spyOn(global, 'fetch').mockImplementation(async () => {
      return {
        ok: true,
        status: 207,
        statusText: 'Multi-Status',
        text: async () => updatedMockXml,
      } as any;
    });

    try {
      const res = await request(app)
        .post('/api/calendar/caldav/sync')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(1);
      expect(res.body.events[0].title).toBe('수동 새로고침으로 갱신된 최신 일정');
    } finally {
      fetchSpy.mockRestore();
    }
  });

  // 5-3. CalDAV 주기적 백그라운드 스케줄러 전체 계정 동기화 검증
  it('5️⃣-3 syncAllRegisteredCalDavAccounts - 주기적 스케줄러를 통한 전체 CalDAV 계정 자동 갱신', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockImplementation(async () => {
      return {
        ok: true,
        status: 207,
        statusText: 'Multi-Status',
        text: async () => `<?xml version="1.0" encoding="utf-8" ?>
<d:multistatus xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav">
  <d:response>
    <d:propstat>
      <d:prop>
        <c:calendar-data>BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:periodic-sync-event-auto
SUMMARY:스케줄러 정기 자동 갱신 일정
DTSTART:20261028T100000Z
DTEND:20261028T110000Z
END:VEVENT
END:VCALENDAR</c:calendar-data>
      </d:prop>
    </d:propstat>
  </d:response>
</d:multistatus>`,
      } as any;
    });

    try {
      const result = await syncAllRegisteredCalDavAccounts();
      expect(result.total).toBeGreaterThanOrEqual(1);
      expect(result.success).toBeGreaterThanOrEqual(1);
    } finally {
      fetchSpy.mockRestore();
    }
  });

  // 6. CalDAV 연동 해제
  it('6️⃣ DELETE /api/calendar/caldav/disconnect - 연동 해제', async () => {
    const res = await request(app)
      .delete('/api/calendar/caldav/disconnect')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const statusRes = await request(app)
      .get('/api/calendar/caldav/status')
      .set('Authorization', `Bearer ${authToken}`);

    expect(statusRes.body.isConnected).toBe(false);
  });
});
