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
