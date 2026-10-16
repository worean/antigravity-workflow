import { describe, it, expect } from 'vitest';
import {
  generateMonthMatrix,
  generateMonthFlatDays,
  generateWeekDays,
  getWeekdayNames,
  calculateWeekEventSegments,
  sortCalendarEvents,
  getKoreanHolidays,
  isKoreanHoliday,
} from '../utils/calendarUtils';

describe('calendarUtils', () => {
  describe('getWeekdayNames', () => {
    it('일요일 시작과 월요일 시작 요일명을 올바르게 반환해야 한다', () => {
      expect(getWeekdayNames(true)).toEqual(['일', '월', '화', '수', '목', '금', '토']);
      expect(getWeekdayNames(false)).toEqual(['월', '화', '수', '목', '금', '토', '일']);
    });
  });

  describe('generateMonthFlatDays & generateMonthMatrix', () => {
    it('2026년 10월(0-indexed: 9) 달력 그리드는 35칸 또는 42칸이어야 한다', () => {
      const flatDays = generateMonthFlatDays(2026, 9, true);
      expect([35, 42]).toContain(flatDays.length);
      expect(flatDays.length % 7).toBe(0);

      // 이번 달 날짜는 1일부터 31일까지 포함되어야 함
      const currentMonthDays = flatDays.filter((d) => d.monthOffset === 0);
      expect(currentMonthDays.length).toBe(31);
      expect(currentMonthDays[0].date).toBe(1);
      expect(currentMonthDays[30].date).toBe(31);
    });

    it('generateMonthMatrix는 주 단위로 5개 또는 6개 행을 가져야 한다', () => {
      const weeks = generateMonthMatrix(2026, 9, true);
      expect([5, 6]).toContain(weeks.length);
      weeks.forEach((w) => expect(w.length).toBe(7));
    });

    it('월요일 시작 옵션 반영 시 주의 첫 번째 날은 월요일이어야 한다', () => {
      const weeks = generateMonthMatrix(2026, 9, false);
      weeks.forEach((w) => {
        expect(w[0].dayOfWeek).toBe(1); // 월요일
        expect(w[6].dayOfWeek).toBe(0); // 일요일
      });
    });
  });

  describe('generateWeekDays', () => {
    it('지정된 날짜가 속한 주의 7일 배열을 생성해야 한다', () => {
      const date = new Date(2026, 9, 14); // 2026-10-14 수요일
      const weekDays = generateWeekDays(date, true);
      expect(weekDays.length).toBe(7);
      expect(weekDays[0].dayOfWeek).toBe(0); // 일요일
      expect(weekDays[6].dayOfWeek).toBe(6); // 토요일
      expect(weekDays[3].dateStr).toBe('2026-10-14');
    });
  });

  describe('calculateWeekEventSegments', () => {
    it('주간 이벤트의 startCol, endCol, trackIndex 충돌 회피가 정확히 계산되어야 한다', () => {
      const week = generateWeekDays(new Date(2026, 9, 14), true);
      const events = [
        { id: '1', startDate: '2026-10-11', endDate: '2026-10-13', title: 'Task 1' },
        { id: '2', startDate: '2026-10-12', endDate: '2026-10-15', title: 'Task 2' },
        { id: '3', startDate: '2026-10-14', endDate: '2026-10-17', title: 'Task 3' },
      ];

      const segments = calculateWeekEventSegments(events, week);
      expect(segments.length).toBe(3);

      // Task 1과 Task 2는 기간이 겹치므로 서로 다른 trackIndex를 가져야 함
      const seg1 = segments.find((s) => s.event.id === '1');
      const seg2 = segments.find((s) => s.event.id === '2');
      const seg3 = segments.find((s) => s.event.id === '3');

      expect(seg1).toBeDefined();
      expect(seg2).toBeDefined();
      expect(seg3).toBeDefined();

      expect(seg1?.trackIndex).not.toBe(seg2?.trackIndex);
      // Task 1(11~13) 종료 후 Task 3(14~17)은 슬롯 재사용 가능
      expect(seg3?.trackIndex).toBe(seg1?.trackIndex);
    });
  });

  describe('대한민국 공휴일 및 대체공휴일 연산', () => {
    it('2026년 양력 고정 공휴일 및 대체공휴일이 정확히 계산되어야 한다', () => {
      const holidays2026 = getKoreanHolidays(2026);

      // 신정, 삼일절, 어린이날, 현충일, 광복절, 개천절, 한글날, 성탄절
      expect(holidays2026['2026-01-01']).toBe('신정');
      expect(holidays2026['2026-03-01']).toBe('삼일절');
      expect(holidays2026['2026-05-05']).toBe('어린이날');
      expect(holidays2026['2026-06-06']).toBe('현충일');
      expect(holidays2026['2026-08-15']).toBe('광복절');
      expect(holidays2026['2026-10-03']).toBe('개천절');
      expect(holidays2026['2026-10-09']).toBe('한글날');
      expect(holidays2026['2026-12-25']).toBe('기독탄신일(성탄절)');

      // 2026-03-01(일요일) -> 2026-03-02(월요일) 삼일절 대체공휴일
      expect(holidays2026['2026-03-02']).toBe('대체공휴일(삼일절)');

      // 2026-08-15(토요일) -> 2026-08-17(월요일) 광복절 대체공휴일
      expect(holidays2026['2026-08-17']).toBe('대체공휴일(광복절)');

      // 2026-10-03(토요일) -> 2026-10-05(월요일) 개천절 대체공휴일
      expect(holidays2026['2026-10-05']).toBe('대체공휴일(개천절)');
    });

    it('2026년 음력 명절(설날, 부처님오신날, 추석) 및 대체공휴일이 계산되어야 한다', () => {
      const holidays2026 = getKoreanHolidays(2026);

      // 2026년 설날 연휴 (2/16 ~ 2/18)
      expect(holidays2026['2026-02-16']).toBe('설날 연휴');
      expect(holidays2026['2026-02-17']).toBe('설날');
      expect(holidays2026['2026-02-18']).toBe('설날 연휴');

      // 2026년 부처님오신날 (5/24, 일요일) -> 5/25(월) 대체공휴일
      expect(holidays2026['2026-05-24']).toBe('부처님오신날');
      expect(holidays2026['2026-05-25']).toBe('대체공휴일(부처님오신날)');

      // 2026년 추석 연휴 (9/24 ~ 9/26)
      expect(holidays2026['2026-09-24']).toBe('추석 연휴');
      expect(holidays2026['2026-09-25']).toBe('추석');
      expect(holidays2026['2026-09-26']).toBe('추석 연휴');
    });

    it('isKoreanHoliday로 개별 날짜 판별이 정상 동작해야 한다', () => {
      const march1 = isKoreanHoliday('2026-03-01');
      expect(march1.isHoliday).toBe(true);
      expect(march1.name).toBe('삼일절');

      const march2 = isKoreanHoliday('2026-03-02');
      expect(march2.isHoliday).toBe(true);
      expect(march2.name).toBe('대체공휴일(삼일절)');

      const regularDay = isKoreanHoliday('2026-03-03');
      expect(regularDay.isHoliday).toBe(false);
      expect(regularDay.name).toBeUndefined();
    });

    it('generateMonthFlatDays에서 공휴일 플래그 및 이름이 주입되어야 한다', () => {
      // 2026년 3월 (0-indexed: 2)
      const march2026Days = generateMonthFlatDays(2026, 2, true);
      const march2 = march2026Days.find((d) => d.dateStr === '2026-03-02');

      expect(march2).toBeDefined();
      expect(march2?.isHoliday).toBe(true);
      expect(march2?.holidayName).toBe('대체공휴일(삼일절)');
    });
  });

  describe('sortCalendarEvents', () => {
    it('1) 이슈는 항상 최상단에 정렬되어야 한다', () => {
      const events = [
        { id: '1', title: '외부 CalDAV 종일일정', startDate: '2026-10-16', endDate: '2026-10-20', type: 'caldav' },
        { id: '2', title: '중요 이슈', startDate: '2026-10-16', endDate: '2026-10-16', type: 'issue', issueId: 101 },
        { id: '3', title: '시간제 미팅', startDate: '2026-10-16T09:00:00', type: 'caldav' },
      ];

      const sorted = sortCalendarEvents(events);
      expect(sorted[0].id).toBe('2'); // 이슈가 최상단
      expect(sorted[1].id).toBe('1'); // 종일 일정이 두번째
      expect(sorted[2].id).toBe('3'); // 시간제 일정이 마지막
    });

    it('2) 종일 일정 간에는 기간이 긴 일정이 먼저 출력되어야 한다', () => {
      const events = [
        { id: 'short', title: '1일 종일 일정', startDate: '2026-10-16', endDate: '2026-10-16', type: 'caldav' },
        { id: 'long', title: '5일 종일 일정', startDate: '2026-10-16', endDate: '2026-10-20', type: 'caldav' },
        { id: 'medium', title: '3일 종일 일정', startDate: '2026-10-16', endDate: '2026-10-18', type: 'caldav' },
      ];

      const sorted = sortCalendarEvents(events);
      expect(sorted.map((e) => e.id)).toEqual(['long', 'medium', 'short']);
    });

    it('3) 시간제 일정은 시작 시간(오전/오후) 빠른 순으로 정렬되어야 한다', () => {
      const events = [
        { id: 'afternoon', title: '오후 미팅', startDate: '2026-10-16T14:30:00', type: 'caldav' },
        { id: 'morning', title: '오전 미팅', startDate: '2026-10-16T09:15:00', type: 'caldav' },
        { id: 'evening', title: '저녁 약속', startDate: '2026-10-16T19:00:00', type: 'caldav' },
      ];

      const sorted = sortCalendarEvents(events);
      expect(sorted.map((e) => e.id)).toEqual(['morning', 'afternoon', 'evening']);
    });
  });
});
