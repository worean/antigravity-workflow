/**
 * 작업로그 시간 계산 및 포맷 유틸리티
 * - 사용자 입력: 소수점 시간 (예: 1.4시간, 5.5시간)
 * - DB 저장 단위: 분 (Integer, 예: 84분, 330분)
 */

export const hoursToMinutes = (hours: number | string): number => {
  const num = Number(hours);
  if (isNaN(num) || num <= 0) return 0;
  return Math.round(num * 60);
};

export const minutesToHours = (minutes: number | string): number => {
  const num = Number(minutes);
  if (isNaN(num) || num <= 0) return 0;
  return Math.round((num / 60) * 10) / 10;
};

export const formatWorklogTime = (minutes: number | string): string => {
  const totalMinutes = Number(minutes) || 0;
  if (totalMinutes <= 0) return '0시간 (0분)';

  const hoursDecimal = (totalMinutes / 60).toFixed(1).replace(/\.0$/, '');
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;

  if (h > 0 && m > 0) {
    return `${hoursDecimal}시간 (${h}시간 ${m}분 / ${totalMinutes}분)`;
  } else if (h > 0) {
    return `${hoursDecimal}시간 (${totalMinutes}분)`;
  } else {
    return `${hoursDecimal}시간 (${totalMinutes}분)`;
  }
};
