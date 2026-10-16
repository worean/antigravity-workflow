import { describe, it, expect } from 'vitest';
import {
  hasTimeComponent,
  formatEventStartTime,
} from '../utils/dateUtils';

describe('dateUtils time formatting', () => {
  describe('hasTimeComponent', () => {
    it('순수 날짜 문자열(YYYY-MM-DD)은 종일 일정으로 판별하여 false를 반환해야 한다', () => {
      expect(hasTimeComponent('2026-10-16')).toBe(false);
      expect(hasTimeComponent(' 2026-10-16 ')).toBe(false);
      expect(hasTimeComponent(null)).toBe(false);
      expect(hasTimeComponent(undefined)).toBe(false);
    });

    it('T 또는 공백과 함께 시각이 포함된 문자열은 true를 반환해야 한다 (단, 자정 00:00:00은 종일일정으로 false)', () => {
      expect(hasTimeComponent('2026-10-16T09:30:00')).toBe(true);
      expect(hasTimeComponent('2026-10-16T14:00:00.000Z')).toBe(true);
      expect(hasTimeComponent('2026-10-16 18:45')).toBe(true);

      // 종일 일정으로 저장된 자정(00:00:00) 문자열은 시간 출력 대상이 아니어야 함
      expect(hasTimeComponent('2026-10-16T00:00:00.000Z')).toBe(false);
      expect(hasTimeComponent('2026-10-16T00:00:00')).toBe(false);
      expect(hasTimeComponent('2026-10-16 00:00:00')).toBe(false);
    });
  });

  describe('formatEventStartTime', () => {
    it('종일 일정이거나 빈 값인 경우 null을 반환해야 한다', () => {
      expect(formatEventStartTime('2026-10-16', '24h')).toBe(null);
      expect(formatEventStartTime(null, '24h')).toBe(null);
      expect(formatEventStartTime('', '12h')).toBe(null);
    });

    it('24시간제(24h) 포맷팅이 정상 동작해야 한다', () => {
      // 로컬 시간 기준으로 시/분을 정확히 파싱하는지 확인
      const d1 = new Date(2026, 9, 16, 9, 5); // 09:05
      const d2 = new Date(2026, 9, 16, 14, 30); // 14:30
      expect(formatEventStartTime(d1.toISOString(), '24h')).toBe(
        `${String(d1.getHours()).padStart(2, '0')}:${String(d1.getMinutes()).padStart(2, '0')}`
      );
      expect(formatEventStartTime(d2.toISOString(), '24h')).toBe(
        `${String(d2.getHours()).padStart(2, '0')}:${String(d2.getMinutes()).padStart(2, '0')}`
      );
    });

    it('12시간제(12h) 포맷팅이 정상 동작해야 한다 (오전/오후)', () => {
      const morning = new Date(2026, 9, 16, 9, 30);
      const afternoon = new Date(2026, 9, 16, 15, 0);
      const midnight = new Date(2026, 9, 16, 0, 15);
      const noon = new Date(2026, 9, 16, 12, 45);

      const morningExpected = `오전 ${morning.getHours() % 12 || 12}:${String(morning.getMinutes()).padStart(2, '0')}`;
      const afternoonExpected = `오후 ${afternoon.getHours() % 12 || 12}:${String(afternoon.getMinutes()).padStart(2, '0')}`;
      const midnightExpected = `오전 12:${String(midnight.getMinutes()).padStart(2, '0')}`;
      const noonExpected = `오후 12:${String(noon.getMinutes()).padStart(2, '0')}`;

      expect(formatEventStartTime(morning.toISOString(), '12h')).toBe(morningExpected);
      expect(formatEventStartTime(afternoon.toISOString(), '12h')).toBe(afternoonExpected);
      expect(formatEventStartTime(midnight.toISOString(), '12h')).toBe(midnightExpected);
      expect(formatEventStartTime(noon.toISOString(), '12h')).toBe(noonExpected);
    });
  });
});
