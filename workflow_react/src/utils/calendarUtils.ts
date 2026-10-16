/**
 * AntiGravity Unified Calendar Calculation Utilities
 * - 월별/주별 달력 매트릭스 그리드 연산 (일요일/월요일 시작 옵션 완벽 지원)
 * - 대한민국 법정 공휴일 및 대체공휴일 자동 계산
 * - 캘린더 다일 일정(Multi-day) 트랙 슬롯 충돌 회피 그리디 배치 알고리즘
 */

import {
  formatDateOnly,
  getEffectiveEventRange,
  parseLocalDate,
  diffDays,
  hasTimeComponent,
} from './dateUtils';

export interface CalendarDayCell {
  date: number;
  monthOffset: -1 | 0 | 1;
  dateStr: string;
  isToday: boolean;
  isWeekend: boolean;
  dayOfWeek: number; // 0 (일) ~ 6 (토)
  isHoliday?: boolean; // 일요일 또는 법정/대체공휴일 여부
  holidayName?: string; // 공휴일 명칭 (예: '삼일절', '대체공휴일(어린이날)')
}

export interface EventTrackSegment<T = any> {
  event: T;
  startCol: number; // 1 ~ 7
  endCol: number; // 1 ~ 7
  isStart: boolean;
  isEnd: boolean;
  isMultiDay: boolean;
  trackIndex: number;
}

export const KOREAN_WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'] as const;

import { getKoreanHolidays } from './koreanHolidays';
export { getKoreanHolidays };

/**
 * 특정 날짜(YYYY-MM-DD)가 대한민국 공휴일인지 확인합니다.
 */
export const isKoreanHoliday = (
  dateStr?: string | null
): { isHoliday: boolean; name?: string } => {
  if (!dateStr) return { isHoliday: false };
  const clean = formatDateOnly(dateStr);
  if (!clean) return { isHoliday: false };

  const year = parseInt(clean.split('-')[0], 10);
  if (isNaN(year)) return { isHoliday: false };

  const holidays = getKoreanHolidays(year);
  const name = holidays[clean];

  return {
    isHoliday: Boolean(name),
    name,
  };
};

/**
 * 시작 요일 옵션에 따른 요일명 배열을 반환합니다.
 */
export const getWeekdayNames = (isSundayStart: boolean = true): string[] => {
  if (isSundayStart) {
    return [...KOREAN_WEEKDAYS];
  }
  return ['월', '화', '수', '목', '금', '토', '일'];
};

/**
 * 특정 연월의 전체 달력 일자(35개 또는 42개) 1차원 플랫 배열을 생성합니다. (공휴일 자동 판별)
 */
export const generateMonthFlatDays = (
  year: number,
  month: number, // 0-indexed (0: 1월, 11: 12월)
  isSundayStart: boolean = true
): CalendarDayCell[] => {
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const prevDaysCount = isSundayStart ? firstDayOfWeek : (firstDayOfWeek + 6) % 7;
  const lastDateOfMonth = new Date(year, month + 1, 0).getDate();
  const lastDateOfPrevMonth = new Date(year, month, 0).getDate();

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
  const todayDate = today.getDate();

  const allDays: CalendarDayCell[] = [];

  // 1. 이전 달 날짜 패딩
  for (let i = prevDaysCount - 1; i >= 0; i--) {
    const d = lastDateOfPrevMonth - i;
    const prevDate = new Date(year, month - 1, d);
    const dayOfWeek = prevDate.getDay();
    const dateStr = formatDateOnly(prevDate);
    const holidayInfo = isKoreanHoliday(dateStr);

    allDays.push({
      date: d,
      monthOffset: -1,
      dateStr,
      isToday: false,
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      dayOfWeek,
      isHoliday: dayOfWeek === 0 || holidayInfo.isHoliday,
      holidayName: holidayInfo.name,
    });
  }

  // 2. 이번 달 날짜
  for (let i = 1; i <= lastDateOfMonth; i++) {
    const curDate = new Date(year, month, i);
    const dayOfWeek = curDate.getDay();
    const dateStr = formatDateOnly(curDate);
    const holidayInfo = isKoreanHoliday(dateStr);

    allDays.push({
      date: i,
      monthOffset: 0,
      dateStr,
      isToday: isCurrentMonth && i === todayDate,
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      dayOfWeek,
      isHoliday: dayOfWeek === 0 || holidayInfo.isHoliday,
      holidayName: holidayInfo.name,
    });
  }

  // 3. 다음 달 날짜 패딩 (35 또는 42칸 채우기)
  const totalSlots = allDays.length <= 35 ? 35 : 42;
  const remainingCells = totalSlots - allDays.length;
  for (let i = 1; i <= remainingCells; i++) {
    const nextDate = new Date(year, month + 1, i);
    const dayOfWeek = nextDate.getDay();
    const dateStr = formatDateOnly(nextDate);
    const holidayInfo = isKoreanHoliday(dateStr);

    allDays.push({
      date: i,
      monthOffset: 1,
      dateStr,
      isToday: false,
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      dayOfWeek,
      isHoliday: dayOfWeek === 0 || holidayInfo.isHoliday,
      holidayName: holidayInfo.name,
    });
  }

  return allDays;
};

/**
 * 특정 연월의 달력을 7일씩 묶은 주 단위 2차원 매트릭스로 생성합니다.
 */
export const generateMonthMatrix = (
  year: number,
  month: number,
  isSundayStart: boolean = true
): CalendarDayCell[][] => {
  const flatDays = generateMonthFlatDays(year, month, isSundayStart);
  const weeks: CalendarDayCell[][] = [];

  for (let i = 0; i < flatDays.length; i += 7) {
    weeks.push(flatDays.slice(i, i + 7));
  }

  return weeks;
};

/**
 * 기준 날짜가 속한 주의 7일 배열을 생성합니다. (공휴일 자동 판별)
 */
export const generateWeekDays = (
  currentDate: Date,
  isSundayStart: boolean = true
): CalendarDayCell[] => {
  const dateObj = new Date(currentDate);
  const dayOfWeek = dateObj.getDay();
  const diffToStart = isSundayStart ? -dayOfWeek : -(dayOfWeek === 0 ? 6 : dayOfWeek - 1);

  const startOfWeek = new Date(dateObj);
  startOfWeek.setDate(startOfWeek.getDate() + diffToStart);

  const todayStr = formatDateOnly(new Date());
  const weekDays: CalendarDayCell[] = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    const dow = d.getDay();
    const dateStr = formatDateOnly(d);
    const holidayInfo = isKoreanHoliday(dateStr);

    weekDays.push({
      date: d.getDate(),
      monthOffset: 0,
      dateStr,
      isToday: dateStr === todayStr,
      isWeekend: dow === 0 || dow === 6,
      dayOfWeek: dow,
      isHoliday: dow === 0 || holidayInfo.isHoliday,
      holidayName: holidayInfo.name,
    });
  }

  return weekDays;
};

/**
 * 사용자 정의 캘린더 일정 정렬 함수:
 * 1) 이슈(type === 'issue' 또는 issueId 존재)는 항상 최상단 (0순위)
 * 2) 종일 일정 (isAllDay === true 이거나 시간 정보가 없는 경우)은 시간제 일정보다 상단 (1순위)
 *    - 종일 일정 간에는 기간이 긴 일정(다일정/장기 일정)이 먼저 출력
 * 3) 시간제 일정은 시작 시간(시작 타임스탬프) 빠른 순으로 출력
 * 4) 동률 시 제목 및 ID 순
 */
export const sortCalendarEvents = <
  T extends {
    id: string;
    startDate: string;
    endDate?: string | null;
    type?: string;
    issueId?: number;
    title?: string;
  }
>(
  events: T[]
): T[] => {
  return [...events].sort((a, b) => {
    // 1. 이슈 최우선 순위
    const aIsIssue = a.type === 'issue' || Boolean(a.issueId);
    const bIsIssue = b.type === 'issue' || Boolean(b.issueId);
    if (aIsIssue !== bIsIssue) {
      return aIsIssue ? -1 : 1;
    }

    // 2. 종일 일정 vs 시간 일정 구분
    const aIsAllDay = (a as any).isAllDay === true || !hasTimeComponent(a.startDate);
    const bIsAllDay = (b as any).isAllDay === true || !hasTimeComponent(b.startDate);

    if (aIsAllDay !== bIsAllDay) {
      return aIsAllDay ? -1 : 1;
    }

    // 2-1. 둘 다 종일 일정인 경우: 기간이 더 긴 일정이 우선 (시작일~종료일 차이)
    if (aIsAllDay && bIsAllDay) {
      const aRange = getEffectiveEventRange(a.startDate, a.endDate);
      const bRange = getEffectiveEventRange(b.startDate, b.endDate);
      const aDuration = diffDays(
        parseLocalDate(aRange.endDateOnly) || new Date(),
        parseLocalDate(aRange.startDateOnly) || new Date()
      );
      const bDuration = diffDays(
        parseLocalDate(bRange.endDateOnly) || new Date(),
        parseLocalDate(bRange.startDateOnly) || new Date()
      );

      if (aDuration !== bDuration) {
        return bDuration - aDuration; // 기간이 긴 것 먼저
      }

      // 시작일 빠른 순
      if (aRange.startDateOnly !== bRange.startDateOnly) {
        return aRange.startDateOnly.localeCompare(bRange.startDateOnly);
      }
    } else {
      // 2-2. 둘 다 시간제 일정인 경우: 시작 시간(타임스탬프) 빠른 순
      const aTime = new Date(a.startDate).getTime();
      const bTime = new Date(b.startDate).getTime();
      if (!isNaN(aTime) && !isNaN(bTime) && aTime !== bTime) {
        return aTime - bTime;
      }
    }

    // 3. 제목 및 고유 ID 순
    const aTitle = a.title || '';
    const bTitle = b.title || '';
    if (aTitle !== bTitle) {
      return aTitle.localeCompare(bTitle);
    }
    return a.id.localeCompare(b.id);
  });
};

/**
 * 특정 주(Week)에 속하는 일정들의 다일/단일 트랙 슬롯 충돌 회피 그리디 배치 알고리즘
 */
export const calculateWeekEventSegments = <
  T extends {
    id: string;
    startDate: string;
    endDate?: string | null;
    type?: string;
    issueId?: number;
    title?: string;
  }
>(
  events: T[],
  week: CalendarDayCell[]
): EventTrackSegment<T>[] => {
  if (!week || week.length < 7) return [];

  const weekStart = week[0].dateStr;
  const weekEnd = week[6].dateStr;
  const rawSegments: Omit<EventTrackSegment<T>, 'trackIndex'>[] = [];

  events.forEach((evt) => {
    const { startDateOnly: evtStart, endDateOnly: evtEnd, isMultiDay } = getEffectiveEventRange(
      evt.startDate,
      evt.endDate
    );

    if (evtStart <= weekEnd && evtEnd >= weekStart) {
      const effectiveStart = evtStart < weekStart ? weekStart : evtStart;
      const effectiveEnd = evtEnd > weekEnd ? weekEnd : evtEnd;
      const startIdx = week.findIndex((d) => d.dateStr === effectiveStart);
      const endIdx = week.findIndex((d) => d.dateStr === effectiveEnd);

      if (startIdx !== -1 && endIdx !== -1) {
        rawSegments.push({
          event: evt,
          startCol: startIdx + 1,
          endCol: endIdx + 1,
          isStart: evtStart >= weekStart,
          isEnd: evtEnd <= weekEnd,
          isMultiDay,
        });
      }
    }
  });

  // 정렬 순서:
  // 1) 이슈 최상단
  // 2) 종일 일정 (기간 긴 순서)
  // 3) 시간제 일정 (시작 시간 빠른 순서)
  rawSegments.sort((a, b) => {
    const aEvt = a.event;
    const bEvt = b.event;

    // 1. 이슈 최우선 배치
    const aIsIssue = aEvt.type === 'issue' || Boolean(aEvt.issueId);
    const bIsIssue = bEvt.type === 'issue' || Boolean(bEvt.issueId);
    if (aIsIssue !== bIsIssue) return aIsIssue ? -1 : 1;

    // 2. 종일 일정 vs 시간제 일정
    const aIsAllDay = (aEvt as any).isAllDay === true || !hasTimeComponent(aEvt.startDate);
    const bIsAllDay = (bEvt as any).isAllDay === true || !hasTimeComponent(bEvt.startDate);
    if (aIsAllDay !== bIsAllDay) return aIsAllDay ? -1 : 1;

    // 3. 종일 일정 간: 컬럼 span(기간)이 긴 것 우선
    if (aIsAllDay && bIsAllDay) {
      const aSpan = a.endCol - a.startCol;
      const bSpan = b.endCol - b.startCol;
      if (aSpan !== bSpan) return bSpan - aSpan;
    } else {
      // 시간제 일정 간: 시작 시간 빠른 순
      const aTime = new Date(aEvt.startDate).getTime();
      const bTime = new Date(bEvt.startDate).getTime();
      if (!isNaN(aTime) && !isNaN(bTime) && aTime !== bTime) {
        return aTime - bTime;
      }
    }

    if (a.startCol !== b.startCol) return a.startCol - b.startCol;
    return a.event.id.localeCompare(b.event.id);
  });

  // 충돌 없는 레벨(trackIndex) 할당
  const slots: Omit<EventTrackSegment<T>, 'trackIndex'>[][] = [];
  const segments: EventTrackSegment<T>[] = [];

  rawSegments.forEach((seg) => {
    let assignedTrack = -1;
    for (let i = 0; i < slots.length; i++) {
      // 해당 트랙의 기존 모든 일정들과 전혀 겹치지 않는지 확인
      const hasOverlap = slots[i].some(
        (existing) => !(existing.endCol < seg.startCol || existing.startCol > seg.endCol)
      );
      if (!hasOverlap) {
        slots[i].push(seg);
        assignedTrack = i;
        break;
      }
    }
    if (assignedTrack === -1) {
      assignedTrack = slots.length;
      slots.push([seg]);
    }
    segments.push({ ...seg, trackIndex: assignedTrack });
  });

  return segments;
};
