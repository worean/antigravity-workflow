import { describe, it, expect } from 'vitest';
import { generateIcsCalendar, parseIcsCalendar, formatDateToIcal } from '../lib/icalHelper.js';
import { parseIcalService } from '../modules/calendar/services/parseAndSaveIcal.service.js';

describe('iCalendar RFC 5545 Helper & Parsing Test Suite', () => {
  it('1. 날짜를 iCal 표준 포맷으로 올바르게 변환해야 한다', () => {
    const testDate = new Date('2026-10-15T09:30:00Z');
    const dateTimeStr = formatDateToIcal(testDate, false);
    expect(dateTimeStr).toBe('20261015T093000Z');

    const dateOnlyStr = formatDateToIcal(testDate, true);
    expect(dateOnlyStr).toBe('20261015');
  });

  it('2. VCALENDAR 및 VEVENT 문자열을 RFC 5545 표준에 맞게 생성해야 한다', () => {
    const events = [
      {
        uid: 'issue-101@antigravity',
        summary: '[PROJ-101] 로그인 버그 수정',
        description: 'Google OAuth 만료 토큰 자동 갱신 구현',
        startDate: new Date('2026-10-20T10:00:00Z'),
        endDate: new Date('2026-10-20T18:00:00Z'),
        status: 'CONFIRMED',
        priority: 1,
        categories: ['Bug'],
        progressPercent: 80,
      },
    ];

    const icsContent = generateIcsCalendar({
      calendarName: '프로젝트 핵심 일정',
      events,
    });

    expect(icsContent).toContain('BEGIN:VCALENDAR');
    expect(icsContent).toContain('VERSION:2.0');
    expect(icsContent).toContain('X-WR-CALNAME:프로젝트 핵심 일정');
    expect(icsContent).toContain('BEGIN:VEVENT');
    expect(icsContent).toContain('UID:issue-101@antigravity');
    expect(icsContent).toContain('SUMMARY:[PROJ-101] 로그인 버그 수정');
    expect(icsContent).toContain('X-ANTIGRAVITY-PROGRESS:80');
    expect(icsContent).toContain('PRIORITY:1');
    expect(icsContent).toContain('END:VEVENT');
    expect(icsContent).toContain('END:VCALENDAR');
  });

  it('3. 생성된 .ics 문자열을 다시 VEVENT 목록으로 정확히 파싱 및 복원할 수 있어야 한다', () => {
    const sampleIcs = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Test//EN',
      'BEGIN:VEVENT',
      'UID:wbs-task-500',
      'SUMMARY:WBS 1단계 아키텍처 설계',
      'DESCRIPTION:시스템 설계 및 인터페이스 정의',
      'DTSTART:20261010T090000Z',
      'DTEND:20261012T180000Z',
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const result = parseIcalService(sampleIcs);
    expect(result.totalCount).toBe(1);
    expect(result.events[0].uid).toBe('wbs-task-500');
    expect(result.events[0].summary).toBe('WBS 1단계 아키텍처 설계');
    expect(result.events[0].description).toBe('시스템 설계 및 인터페이스 정의');
    expect(result.events[0].status).toBe('CONFIRMED');
  });
});
