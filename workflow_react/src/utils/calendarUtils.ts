/**
 * AntiGravity Unified Calendar Calculation Utilities
 * - 월별/주별 달력 매트릭스 그리드 연산 (일요일/월요일 시작 옵션 완벽 지원)
 * - 대한민국 법정 공휴일 및 대체공휴일 자동 계산
 * - 캘린더 다일 일정(Multi-day) 트랙 슬롯 충돌 회피 그리디 배치 알고리즘
 */

import { formatDateOnly, getEffectiveEventRange, parseLocalDate, addDays } from './dateUtils';

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

/**
 * 음력 기반 주요 명절(설날 연휴 3일, 부처님오신날, 추석 연휴 3일) 양력 변환 테이블 (2023 ~ 2035)
 */
const LUNAR_HOLIDAYS_TABLE: Record<
  number,
  { seollal: [string, string, string]; buddha: string; chuseok: [string, string, string] }
> = {
  2023: {
    seollal: ['2023-01-21', '2023-01-22', '2023-01-23'],
    buddha: '2023-05-27',
    chuseok: ['2023-09-28', '2023-09-29', '2023-09-30'],
  },
  2024: {
    seollal: ['2024-02-09', '2024-02-10', '2024-02-11'],
    buddha: '2024-05-15',
    chuseok: ['2024-09-16', '2024-09-17', '2024-09-18'],
  },
  2025: {
    seollal: ['2025-01-28', '2025-01-29', '2025-01-30'],
    buddha: '2025-05-05',
    chuseok: ['2025-10-05', '2025-10-06', '2025-10-07'],
  },
  2026: {
    seollal: ['2026-02-16', '2026-02-17', '2026-02-18'],
    buddha: '2026-05-24',
    chuseok: ['2026-09-24', '2026-09-25', '2026-09-26'],
  },
  2027: {
    seollal: ['2027-02-06', '2027-02-07', '2027-02-08'],
    buddha: '2027-05-13',
    chuseok: ['2027-09-14', '2027-09-15', '2027-09-16'],
  },
  2028: {
    seollal: ['2028-01-26', '2028-01-27', '2028-01-28'],
    buddha: '2028-05-02',
    chuseok: ['2028-10-02', '2028-10-03', '2028-10-04'],
  },
  2029: {
    seollal: ['2029-02-12', '2029-02-13', '2029-02-14'],
    buddha: '2029-05-20',
    chuseok: ['2029-09-21', '2029-09-22', '2029-09-23'],
  },
  2030: {
    seollal: ['2030-02-02', '2030-02-03', '2030-02-04'],
    buddha: '2030-05-09',
    chuseok: ['2030-09-11', '2030-09-12', '2030-09-13'],
  },
  2031: {
    seollal: ['2031-01-22', '2031-01-23', '2031-01-24'],
    buddha: '2031-05-28',
    chuseok: ['2031-09-30', '2031-10-01', '2031-10-02'],
  },
  2032: {
    seollal: ['2032-02-10', '2032-02-11', '2032-02-12'],
    buddha: '2032-05-16',
    chuseok: ['2032-09-18', '2032-09-19', '2032-09-20'],
  },
  2033: {
    seollal: ['2033-01-30', '2033-01-31', '2033-02-01'],
    buddha: '2033-05-06',
    chuseok: ['2033-09-07', '2033-09-08', '2033-09-09'],
  },
  2034: {
    seollal: ['2034-02-18', '2034-02-19', '2034-02-20'],
    buddha: '2034-05-25',
    chuseok: ['2034-09-26', '2034-09-27', '2034-09-28'],
  },
  2035: {
    seollal: ['2035-02-07', '2035-02-08', '2035-02-09'],
    buddha: '2035-05-15',
    chuseok: ['2035-09-15', '2035-09-16', '2035-09-17'],
  },
};

// 연도별 공휴일 캐시
const holidaysCache: Record<number, Record<string, string>> = {};

/**
 * 특정 연도의 대한민국 법정 공휴일 및 대체공휴일 맵(YYYY-MM-DD -> 공휴일 명칭)을 계산합니다.
 */
export const getKoreanHolidays = (year: number): Record<string, string> => {
  if (holidaysCache[year]) {
    return holidaysCache[year];
  }

  const holidays: Record<string, string> = {};

  // 1. 양력 고정 공휴일 등록
  const fixedHolidays: Array<{ date: string; name: string; hasSubstitute: boolean }> = [
    { date: `${year}-01-01`, name: '신정', hasSubstitute: false },
    { date: `${year}-03-01`, name: '삼일절', hasSubstitute: true },
    { date: `${year}-05-05`, name: '어린이날', hasSubstitute: true },
    { date: `${year}-06-06`, name: '현충일', hasSubstitute: false },
    { date: `${year}-08-15`, name: '광복절', hasSubstitute: true },
    { date: `${year}-10-03`, name: '개천절', hasSubstitute: true },
    { date: `${year}-10-09`, name: '한글날', hasSubstitute: true },
    { date: `${year}-12-25`, name: '기독탄신일(성탄절)', hasSubstitute: true },
  ];

  fixedHolidays.forEach((h) => {
    holidays[h.date] = h.name;
  });

  // 2. 음력 명절 등록 (설날, 부처님오신날, 추석)
  const lunar = LUNAR_HOLIDAYS_TABLE[year];
  if (lunar) {
    holidays[lunar.seollal[0]] = '설날 연휴';
    holidays[lunar.seollal[1]] = '설날';
    holidays[lunar.seollal[2]] = '설날 연휴';

    holidays[lunar.buddha] = '부처님오신날';

    holidays[lunar.chuseok[0]] = '추석 연휴';
    holidays[lunar.chuseok[1]] = '추석';
    holidays[lunar.chuseok[2]] = '추석 연휴';
  }

  // 3. 대체공휴일(Substitute Holiday) 계산
  // A. 설날 연휴 대체공휴일: 연휴 중 일요일 또는 다른 공휴일과 겹치는 경우
  if (lunar) {
    const seollalHasSundayOrConflict = lunar.seollal.some((dStr) => {
      const d = parseLocalDate(dStr);
      return d ? d.getDay() === 0 : false;
    });

    if (seollalHasSundayOrConflict) {
      let candidate = addDays(parseLocalDate(lunar.seollal[2])!, 1);
      while (candidate.getDay() === 0 || holidays[formatDateOnly(candidate)]) {
        candidate = addDays(candidate, 1);
      }
      holidays[formatDateOnly(candidate)] = '대체공휴일(설날)';
    }

    // B. 추석 연휴 대체공휴일: 연휴 중 일요일 또는 다른 공휴일(예: 개천절)과 겹치는 경우
    const chuseokHasSundayOrConflict = lunar.chuseok.some((dStr) => {
      const d = parseLocalDate(dStr);
      const isSun = d ? d.getDay() === 0 : false;
      // 다른 고정 공휴일과 겹쳤는지 확인
      const isConflicted = fixedHolidays.some((fh) => fh.date === dStr);
      return isSun || isConflicted;
    });

    if (chuseokHasSundayOrConflict) {
      let candidate = addDays(parseLocalDate(lunar.chuseok[2])!, 1);
      while (candidate.getDay() === 0 || holidays[formatDateOnly(candidate)]) {
        candidate = addDays(candidate, 1);
      }
      holidays[formatDateOnly(candidate)] = '대체공휴일(추석)';
    }
  }

  // C. 일반 공휴일 대체공휴일 (삼일절, 어린이날, 부처님오신날, 광복절, 개천절, 한글날, 성탄절)
  // 토요일 또는 일요일, 혹은 다른 공휴일과 겹칠 경우 다음 첫 번째 비공휴일
  const substituteCandidates: Array<{ date: string; name: string }> = [
    ...fixedHolidays.filter((h) => h.hasSubstitute),
  ];
  if (lunar) {
    substituteCandidates.push({ date: lunar.buddha, name: '부처님오신날' });
  }

  substituteCandidates.forEach((item) => {
    const d = parseLocalDate(item.date);
    if (!d) return;
    const dow = d.getDay();
    const isWeekend = dow === 0 || dow === 6;

    // 이미 다른 공휴일과 겹쳤거나 주말인 경우 대체공휴일 발생
    if (isWeekend) {
      let candidate = addDays(d, 1);
      while (
        candidate.getDay() === 0 ||
        candidate.getDay() === 6 ||
        holidays[formatDateOnly(candidate)]
      ) {
        candidate = addDays(candidate, 1);
      }
      const candidateStr = formatDateOnly(candidate);
      if (!holidays[candidateStr]) {
        holidays[candidateStr] = `대체공휴일(${item.name})`;
      }
    }
  });

  holidaysCache[year] = holidays;
  return holidays;
};

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
