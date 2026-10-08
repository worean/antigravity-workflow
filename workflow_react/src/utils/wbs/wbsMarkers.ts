﻿import type { Sprint } from '@/types';
import type { SprintDueLine } from '@/types/wbs';
import { parseLocalDate, formatDateOnly, diffDays } from '../dateUtils';

export const computeSprintDueLines = (
  sprints: Sprint[],
  timelineStart: Date,
  totalDays: number,
  dayWidth: number
): SprintDueLine[] => {
  return sprints
    .map((s) => {
      if (!s.endDate) return null;
      const endDate = parseLocalDate(s.endDate);
      if (!endDate) return null;

      const dayDiff = diffDays(endDate, timelineStart);
      if (dayDiff < 0 || dayDiff >= totalDays) return null;

      const leftPos = (dayDiff + 1) * dayWidth;

      return {
        sprint: s,
        leftPos,
        formattedDate: formatDateOnly(endDate),
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);
};

export const computeTodayMarker = (
  timelineStart: Date,
  totalDays: number,
  dayWidth: number
): { date: Date; dayIndex: number; leftPos: number; formattedDate: string } | null => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dayDiff = diffDays(today, timelineStart);
  if (dayDiff < 0 || dayDiff >= totalDays) return null;

  const leftPos = dayDiff * dayWidth + dayWidth / 2;

  return {
    date: today,
    dayIndex: dayDiff,
    leftPos,
    formattedDate: formatDateOnly(today),
  };
};
