/**
 * 날짜 관련 유틸리티 (시간/분/초 없이 YYYY-MM-DD 단위 처리)
 */

export const formatDateOnly = (dateInput?: string | Date | null): string => {
  if (!dateInput) return '';

  if (typeof dateInput === 'string') {
    const clean = dateInput.trim();
    // 1. 순수 YYYY-MM-DD 날짜 문자열인 경우 타임존 왜곡 없이 즉시 반환
    if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
      return clean;
    }
    // 2. 타임존 표시(Z 또는 +09:00 등)가 없는 순수 로컬 datetime 문자열인 경우 (예: 2026-10-15T00:00:00)
    if (
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(clean) ||
      /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(:\d{2})?$/.test(clean)
    ) {
      return clean.split(/[T ]/)[0];
    }
  }

  // 3. Date 객체이거나 UTC 오프셋(Z, +09:00 등)이 포함된 ISO 문자열인 경우
  // 사용자 브라우저 로컬 타임존(KST 등) 기준으로 날짜를 정확히 계산하여 하루 일찍 찍히는 현상 방지
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getDDayStatus = (dueDateStr?: string | null) => {
  if (!dueDateStr) return null;
  const formatted = formatDateOnly(dueDateStr);
  if (!formatted) return null;

  const todayStr = formatDateOnly(new Date());
  const dueTime = new Date(`${formatted}T00:00:00`).getTime();
  const todayTime = new Date(`${todayStr}T00:00:00`).getTime();

  const diffDays = Math.round((dueTime - todayTime) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { label: `D+${Math.abs(diffDays)} 지연`, isOverdue: true, color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.15)' };
  } else if (diffDays === 0) {
    return { label: 'D-Day 오늘 마감', isToday: true, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' };
  } else if (diffDays <= 3) {
    return { label: `D-${diffDays}`, isUrgent: true, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)' };
  } else {
    return { label: `D-${diffDays}`, isNormal: true, color: 'var(--text-sub)', bg: 'rgba(255, 255, 255, 0.06)' };
  }
};

export const parseLocalDate = (dateInput?: string | Date | null): Date | null => {
  if (!dateInput) return null;
  const str = formatDateOnly(dateInput);
  if (!str) return null;
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0);
};

export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const diffDays = (d1: Date, d2: Date): number => {
  return Math.round((d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24));
};

/**
 * 주차(Week Number) 계산 (1 ~ 53)
 * - isSundayStart = true : 일요일 시작 기준 (1월 1일이 속한 주의 일요일부터 계산)
 * - isSundayStart = false : 월요일 시작 기준 (1월 1일이 속한 주의 월요일부터 계산)
 */
export const getWeekNumber = (dateInput?: string | Date | null, isSundayStart: boolean = true): number => {
  const d = parseLocalDate(dateInput);
  if (!d) return 1;

  const year = d.getFullYear();
  const jan1 = new Date(year, 0, 1, 0, 0, 0, 0);
  const jan1Day = jan1.getDay(); // 0: 일요일, 1: 월요일, ...

  let startOffset = 0;
  if (isSundayStart) {
    startOffset = jan1Day; // 일요일 기준: 일=0, 월=1, 화=2...
  } else {
    startOffset = (jan1Day + 6) % 7; // 월요일 기준: 월=0, 화=1, ... 일=6
  }

  // 1월 1일이 속한 주의 시작일 (로컬 자정 기준)
  const firstWeekStart = new Date(year, 0, 1 - startOffset, 0, 0, 0, 0);

  const diffMs = d.getTime() - firstWeekStart.getTime();
  const diffDaysCount = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  return Math.max(1, Math.floor(diffDaysCount / 7) + 1);
};

export const getSundayWeekNumber = (dateInput?: string | Date | null): number => {
  return getWeekNumber(dateInput, true);
};

export const formatDateTime = (dateInput?: string | Date | null): string => {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatTimeAgo = (dateInput?: string | Date | null): string => {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  const now = Date.now();
  const diffSec = Math.floor((now - d.getTime()) / 1000);
  if (diffSec < 60) return '방금 전';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}시간 전`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 30) return `${diffDay}일 전`;
  return formatDateOnly(dateInput);
};

/**
 * 캘린더 이벤트의 유효 시작일 및 종료일(YYYY-MM-DD) 계산
 * - iCalendar/CalDAV RFC 5545 표준에 따라 종료 시각이 자정(00:00:00) 또는 24:00:00인 경우,
 *   종료일은 exclusive 끝 경계이므로 실제 날짜는 전날로 보정하여 당일(1칸) 일정으로 처리합니다.
 */
export const getEffectiveEventRange = (
  startDateStr: string,
  endDateStr?: string | null
): { startDateOnly: string; endDateOnly: string; isMultiDay: boolean } => {
  const startOnly = formatDateOnly(startDateStr);
  if (!endDateStr) {
    return { startDateOnly: startOnly, endDateOnly: startOnly, isMultiDay: false };
  }

  let endOnly = formatDateOnly(endDateStr);

  // 문자열 기반 자정/24시 판별 및 Date 객체 기반 판별
  const rawEnd = String(endDateStr).trim();
  const hasMidnightStr =
    /T00:00(:00)?(\.000)?(Z|[+-]\d{2}:\d{2})?$/i.test(rawEnd) ||
    / 00:00(:00)?$/i.test(rawEnd) ||
    /24:00(:00)?/i.test(rawEnd);

  let isMidnightDate = false;
  const endObj = new Date(endDateStr);
  if (!isNaN(endObj.getTime())) {
    const isMidnightUtc = endObj.getUTCHours() === 0 && endObj.getUTCMinutes() === 0 && endObj.getUTCSeconds() === 0;
    const isMidnightLocal = endObj.getHours() === 0 && endObj.getMinutes() === 0 && endObj.getSeconds() === 0;
    isMidnightDate = isMidnightUtc || isMidnightLocal;
  }

  // 종료 시각이 자정이면서 종료일이 시작일보다 뒤인 경우, exclusive 종료 경계이므로 1일 차감
  if ((hasMidnightStr || isMidnightDate) && endOnly > startOnly) {
    const endLocalDate = parseLocalDate(endOnly);
    if (endLocalDate) {
      endLocalDate.setDate(endLocalDate.getDate() - 1);
      endOnly = formatDateOnly(endLocalDate);
    }
  }

  return {
    startDateOnly: startOnly,
    endDateOnly: endOnly,
    isMultiDay: startOnly !== endOnly,
  };
};
