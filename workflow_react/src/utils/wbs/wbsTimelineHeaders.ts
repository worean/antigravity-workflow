﻿import type { TimelineRange, TopHeader, BottomHeaders } from '@/types/wbs';
import { getWeekNumber } from '../dateUtils';

export const generateBottomHeaders = (
  timelineRange: TimelineRange,
  currentViewScale: 'day' | 'week' | 'month',
  isSundayStart: boolean,
  today: Date
): BottomHeaders => {
  if (currentViewScale === 'month') {
    const blocks: { label: string; daysCount: number; isCurrent: boolean }[] = [];
    let curMonthKey = '';
    let curCount = 0;
    let isCurrentMonth = false;

    timelineRange.days.forEach((d) => {
      const mKey = `${d.getFullYear()}-${d.getMonth() + 1}`;
      const isCur = d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth();

      if (mKey !== curMonthKey) {
        if (curCount > 0) {
          const monthNum = Number(curMonthKey.split('-')[1]);
          blocks.push({ label: `${monthNum}월`, daysCount: curCount, isCurrent: isCurrentMonth });
        }
        curMonthKey = mKey;
        curCount = 1;
        isCurrentMonth = isCur;
      } else {
        curCount++;
        if (isCur) isCurrentMonth = true;
      }
    });

    if (curCount > 0) {
      const monthNum = Number(curMonthKey.split('-')[1]);
      blocks.push({ label: `${monthNum}월`, daysCount: curCount, isCurrent: isCurrentMonth });
    }
    return { type: 'month', blocks };
  } else if (currentViewScale === 'week') {
    const blocks: { label: string; daysCount: number; isCurrent: boolean }[] = [];
    let curWeekNum = -1;
    let curCount = 0;
    let isCurrentWeek = false;

    timelineRange.days.forEach((d) => {
      const isCur =
        d.getFullYear() === today.getFullYear() &&
        d.getMonth() === today.getMonth() &&
        d.getDate() === today.getDate();
      const isWeekStart = isSundayStart ? d.getDay() === 0 : d.getDay() === 1;
      const weekNum = getWeekNumber(d, isSundayStart);

      if (isWeekStart && curCount > 0) {
        blocks.push({ label: `${curWeekNum}주차`, daysCount: curCount, isCurrent: isCurrentWeek });
        curWeekNum = weekNum;
        curCount = 1;
        isCurrentWeek = isCur;
      } else {
        if (curCount === 0) {
          curWeekNum = weekNum;
        }
        curCount++;
        if (isCur) isCurrentWeek = true;
      }
    });

    if (curCount > 0) {
      blocks.push({ label: `${curWeekNum}주차`, daysCount: curCount, isCurrent: isCurrentWeek });
    }
    return { type: 'week', blocks };
  } else {
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    const blocks = timelineRange.days.map((d) => {
      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
      const isToday =
        d.getFullYear() === today.getFullYear() &&
        d.getMonth() === today.getMonth() &&
        d.getDate() === today.getDate();

      return {
        date: d,
        dayNum: d.getDate(),
        dayName: dayNames[d.getDay()],
        isToday,
        isWeekend,
        daysCount: 1,
      };
    });
    return { type: 'day', blocks };
  }
};

/**
 * 타임라인 상단/하단 헤더 블록 생성
 */
export const generateTimelineHeaders = (
  timelineRange: TimelineRange,
  currentViewScale: 'day' | 'week' | 'month',
  isSundayStart: boolean = true
): { topHeaders: TopHeader[]; bottomHeaders: BottomHeaders } => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Top Headers (Year or Month)
  if (currentViewScale === 'month') {
    const years: { label: string; daysCount: number }[] = [];
    let curLabel = '';
    let curCount = 0;

    timelineRange.days.forEach((d) => {
      const label = `${d.getFullYear()}년`;
      if (label !== curLabel) {
        if (curCount > 0) years.push({ label: curLabel, daysCount: curCount });
        curLabel = label;
        curCount = 1;
      } else {
        curCount++;
      }
    });
    if (curCount > 0) years.push({ label: curLabel, daysCount: curCount });
    return {
      topHeaders: years,
      bottomHeaders: generateBottomHeaders(timelineRange, currentViewScale, isSundayStart, today),
    };
  } else {
    const months: { label: string; daysCount: number }[] = [];
    let curLabel = '';
    let curCount = 0;

    timelineRange.days.forEach((d) => {
      const label = `${d.getFullYear()}년 ${d.getMonth() + 1}월`;
      if (label !== curLabel) {
        if (curCount > 0) months.push({ label: curLabel, daysCount: curCount });
        curLabel = label;
        curCount = 1;
      } else {
        curCount++;
      }
    });
    if (curCount > 0) months.push({ label: curLabel, daysCount: curCount });
    return {
      topHeaders: months,
      bottomHeaders: generateBottomHeaders(timelineRange, currentViewScale, isSundayStart, today),
    };
  }
};
