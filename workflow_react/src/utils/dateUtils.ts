/**
 * 날짜 관련 유틸리티 (시간/분/초 없이 YYYY-MM-DD 단위 처리)
 */

export const formatDateOnly = (dateInput?: string | Date | null): string => {
  if (!dateInput) return '';
  if (typeof dateInput === 'string') {
    const parts = dateInput.split('T')[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(parts)) {
      return parts;
    }
  }
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
