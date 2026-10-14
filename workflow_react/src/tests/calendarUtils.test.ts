﻿import { describe, it, expect } from 'vitest';
import {
  generateMonthMatrix,
  generateMonthFlatDays,
  generateWeekDays,
  getWeekdayNames,
  calculateWeekEventSegments,
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
});
