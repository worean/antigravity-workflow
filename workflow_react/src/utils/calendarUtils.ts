/**
 * AntiGravity Unified Calendar Calculation Utilities
 * - 월별/주별 달력 매트릭스 그리드 연산 (일요일/월요일 시작 옵션 완벽 지원)
 * - 캘린더 다일 일정(Multi-day) 트랙 슬롯 충돌 회피 그리디 배치 알고리즘
 */

import { formatDateOnly, getEffectiveEventRange } from './dateUtils';

export interface CalendarDayCell {
  date: number;
  monthOffset: -1 | 0 | 1;
  dateStr: string;
  isToday: boolean;
  isWeekend: boolean;
  dayOfWeek: number; // 0 (일) ~ 6 (토)
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
 * 특정 연월의 전체 달력 일자(35개 또는 42개) 1차원 플랫 배열을 생성합니다.
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
    allDays.push({
      date: d,
      monthOffset: -1,
      dateStr: formatDateOnly(prevDate),
      isToday: false,
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      dayOfWeek,
    });
  }

  // 2. 이번 달 날짜
  for (let i = 1; i <= lastDateOfMonth; i++) {
    const curDate = new Date(year, month, i);
    const dayOfWeek = curDate.getDay();
    allDays.push({
      date: i,
      monthOffset: 0,
      dateStr: formatDateOnly(curDate),
      isToday: isCurrentMonth && i === todayDate,
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      dayOfWeek,
    });
  }

  // 3. 다음 달 날짜 패딩 (35 또는 42칸 채우기)
  const totalSlots = allDays.length <= 35 ? 35 : 42;
  const remainingCells = totalSlots - allDays.length;
  for (let i = 1; i <= remainingCells; i++) {
    const nextDate = new Date(year, month + 1, i);
    const dayOfWeek = nextDate.getDay();
    allDays.push({
      date: i,
      monthOffset: 1,
      dateStr: formatDateOnly(nextDate),
      isToday: false,
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      dayOfWeek,
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
 * 기준 날짜가 속한 주의 7일 배열을 생성합니다.
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

    weekDays.push({
      date: d.getDate(),
      monthOffset: 0,
      dateStr,
      isToday: dateStr === todayStr,
      isWeekend: dow === 0 || dow === 6,
      dayOfWeek: dow,
    });
  }

  return weekDays;
};

/**
 * 특정 주(Week)에 속하는 일정들의 다일/단일 트랙 슬롯 충돌 회피 그리디 배치 알고리즘
 */
export const calculateWeekEventSegments = <
  T extends { id: string; startDate: string; endDate?: string | null }
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

  // 정렬: 다일정(Multi-day) 우선 -> 긴 기간 우선 -> 시작일 빠른 순
  rawSegments.sort((a, b) => {
    if (a.isMultiDay !== b.isMultiDay) return a.isMultiDay ? -1 : 1;
    const aSpan = a.endCol - a.startCol;
    const bSpan = b.endCol - b.startCol;
    if (aSpan !== bSpan) return bSpan - aSpan;
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
