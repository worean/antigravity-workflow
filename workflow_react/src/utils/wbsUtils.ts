// -*- coding: utf-8 -*-
import type { Issue, Sprint } from '@/types';
import type { WBSColorTheme, WBSItem, TimelineRange, TopHeader, BottomHeaders, SprintDueLine } from '@/types/wbs';
import { parseLocalDate, formatDateOnly, addDays, diffDays, getWeekNumber } from './dateUtils';

// 12가지 다채로운 WBS/간트차트 전용 색상 팔레트
export const WBS_PALETTE: WBSColorTheme[] = [
  {
    name: 'blue',
    base: '#007acc',
    border: '#1f8ad2',
    progress: '#38bdf8',
    bgEmpty: 'rgba(0, 122, 204, 0.18)',
    parentBase: '#007acc',
    parentBorder: '#38bdf8',
    dragBase: '#0284c7',
    dragBorder: '#7dd3fc',
  },
  {
    name: 'emerald',
    base: '#059669',
    border: '#10b981',
    progress: '#34d399',
    bgEmpty: 'rgba(5, 150, 105, 0.18)',
    parentBase: '#059669',
    parentBorder: '#34d399',
    dragBase: '#047857',
    dragBorder: '#6ee7b7',
  },
  {
    name: 'indigo',
    base: '#4f46e5',
    border: '#6366f1',
    progress: '#818cf8',
    bgEmpty: 'rgba(79, 70, 229, 0.18)',
    parentBase: '#4f46e5',
    parentBorder: '#818cf8',
    dragBase: '#4338ca',
    dragBorder: '#a5b4fc',
  },
  {
    name: 'purple',
    base: '#7c3aed',
    border: '#8b5cf6',
    progress: '#a78bfa',
    bgEmpty: 'rgba(124, 58, 237, 0.18)',
    parentBase: '#7c3aed',
    parentBorder: '#a78bfa',
    dragBase: '#6d28d9',
    dragBorder: '#c4b5fd',
  },
  {
    name: 'amber',
    base: '#d97706',
    border: '#f59e0b',
    progress: '#fbbf24',
    bgEmpty: 'rgba(217, 119, 6, 0.18)',
    parentBase: '#d97706',
    parentBorder: '#fbbf24',
    dragBase: '#b45309',
    dragBorder: '#fde68a',
  },
  {
    name: 'cyan',
    base: '#0891b2',
    border: '#06b6d4',
    progress: '#22d3ee',
    bgEmpty: 'rgba(8, 145, 178, 0.18)',
    parentBase: '#0891b2',
    parentBorder: '#22d3ee',
    dragBase: '#0e7490',
    dragBorder: '#67e8f9',
  },
  {
    name: 'rose',
    base: '#e11d48',
    border: '#f43f5e',
    progress: '#fb7185',
    bgEmpty: 'rgba(225, 29, 72, 0.18)',
    parentBase: '#e11d48',
    parentBorder: '#fb7185',
    dragBase: '#be123c',
    dragBorder: '#fda4af',
  },
  {
    name: 'green',
    base: '#16a34a',
    border: '#22c55e',
    progress: '#4ade80',
    bgEmpty: 'rgba(22, 163, 74, 0.18)',
    parentBase: '#16a34a',
    parentBorder: '#4ade80',
    dragBase: '#15803d',
    dragBorder: '#86efac',
  },
  {
    name: 'orange',
    base: '#ea580c',
    border: '#f97316',
    progress: '#fb923c',
    bgEmpty: 'rgba(234, 88, 12, 0.18)',
    parentBase: '#ea580c',
    parentBorder: '#fb923c',
    dragBase: '#c2410c',
    dragBorder: '#fdba74',
  },
  {
    name: 'fuchsia',
    base: '#c026d3',
    border: '#d946ef',
    progress: '#e879f9',
    bgEmpty: 'rgba(192, 38, 211, 0.18)',
    parentBase: '#c026d3',
    parentBorder: '#e879f9',
    dragBase: '#a21caf',
    dragBorder: '#f0abfc',
  },
  {
    name: 'teal',
    base: '#0d9488',
    border: '#14b8a6',
    progress: '#2dd4bf',
    bgEmpty: 'rgba(13, 148, 136, 0.18)',
    parentBase: '#0d9488',
    parentBorder: '#2dd4bf',
    dragBase: '#0f766e',
    dragBorder: '#5eead4',
  },
  {
    name: 'violet',
    base: '#6d28d9',
    border: '#7c3aed',
    progress: '#8b5cf6',
    bgEmpty: 'rgba(109, 40, 217, 0.18)',
    parentBase: '#6d28d9',
    parentBorder: '#8b5cf6',
    dragBase: '#5b21b6',
    dragBorder: '#a78bfa',
  },
];

/**
 * 고정된 Seed 기반 의사 난수 해시 함수
 * 최상위 이슈 ID(rootId)에 따라 항상 일관되고 고정된 색상 테마를 반환합니다.
 */
export const getWBSColorByRootId = (rootId: number): WBSColorTheme => {
  const hash = Math.abs((rootId * 2654435761) ^ (rootId >> 16));
  const index = hash % WBS_PALETTE.length;
  return WBS_PALETTE[index];
};

/**
 * WBS 계층 트리 구축 및 평탄화, 타임라인 날짜 범위 계산
 */
export const buildWBSTree = (
  issues: Issue[],
  collapsedIds: Set<number>,
  projectDates?: { plannedStartDate?: string | null; dueDate?: string | null } | null
): { flatWBSItems: WBSItem[]; timelineRange: TimelineRange } => {
  const issueMap = new Map<number, Issue>();
  const childrenMap = new Map<number, Issue[]>();
  const rootIssues: Issue[] = [];

  issues.forEach((iss) => {
    issueMap.set(iss.id, iss);
  });

  issues.forEach((iss) => {
    if (iss.parentId && issueMap.has(iss.parentId)) {
      const pList = childrenMap.get(iss.parentId) || [];
      pList.push(iss);
      childrenMap.set(iss.parentId, pList);
    } else {
      rootIssues.push(iss);
    }
  });

  // 유효 일정 계산 (하위 자식 날짜 롤업 포함)
  const computeDates = (iss: Issue): { start: Date | null; end: Date | null } => {
    let start = parseLocalDate(iss.plannedStartDate);
    let end = parseLocalDate(iss.dueDate);

    const children = childrenMap.get(iss.id) || [];
    for (const child of children) {
      const cDates = computeDates(child);
      if (cDates.start) {
        if (!start || cDates.start < start) start = cDates.start;
      }
      if (cDates.end) {
        if (!end || cDates.end > end) end = cDates.end;
      }
    }
    return { start, end };
  };

  // 시작계획일 기준 오름차순 시간순 정렬
  const compareWBSOrder = (a: Issue, b: Issue): number => {
    const aDates = computeDates(a);
    const bDates = computeDates(b);

    const aStart = aDates.start ? aDates.start.getTime() : null;
    const bStart = bDates.start ? bDates.start.getTime() : null;

    if (aStart !== null && bStart !== null) {
      if (aStart !== bStart) return aStart - bStart;
    } else if (aStart !== null && bStart === null) {
      return -1;
    } else if (aStart === null && bStart !== null) {
      return 1;
    }

    const aEnd = aDates.end ? aDates.end.getTime() : null;
    const bEnd = bDates.end ? bDates.end.getTime() : null;
    if (aEnd !== null && bEnd !== null) {
      if (aEnd !== bEnd) return aEnd - bEnd;
    } else if (aEnd !== null && bEnd === null) {
      return -1;
    } else if (aEnd === null && bEnd !== null) {
      return 1;
    }

    return a.id - b.id;
  };

  const flatList: WBSItem[] = [];

  const traverse = (iss: Issue, depth: number, isHiddenByParent: boolean, rootId: number) => {
    const children = childrenMap.get(iss.id) || [];
    const hasChildren = children.length > 0;
    const { start, end } = computeDates(iss);

    if (!isHiddenByParent) {
      flatList.push({
        issue: iss,
        depth,
        hasChildren,
        startDate: start,
        endDate: end,
        isParent: hasChildren,
        rootIssueId: rootId,
        color: getWBSColorByRootId(rootId),
      });
    }

    const isCollapsed = collapsedIds.has(iss.id);
    const hideNext = isHiddenByParent || isCollapsed;

    const sortedChildren = [...children].sort(compareWBSOrder);
    sortedChildren.forEach((child) => {
      traverse(child, depth + 1, hideNext, rootId);
    });
  };

  const sortedRootIssues = [...rootIssues].sort(compareWBSOrder);
  sortedRootIssues.forEach((root) => traverse(root, 0, false, root.id));

  // 이슈들의 최소 시작일 및 최대 마감일 추출
  let issueMinDate: Date | null = null;
  let issueMaxDate: Date | null = null;

  for (const item of flatList) {
    if (item.startDate) {
      if (!issueMinDate || item.startDate.getTime() < issueMinDate.getTime()) {
        issueMinDate = item.startDate;
      }
    }
    if (item.endDate) {
      if (!issueMaxDate || item.endDate.getTime() > issueMaxDate.getTime()) {
        issueMaxDate = item.endDate;
      }
    }
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const projStart = parseLocalDate(projectDates?.plannedStartDate);
  const projEnd = parseLocalDate(projectDates?.dueDate);

  // 기본 범위: 프로젝트 시작계획일 ~ 기한 기준
  // 프로젝트 범위 밖으로 이슈 일정이 설정된 경우, 더 이른 시작일/더 늦은 마감일을 포함하도록 확장
  let rangeStart: Date;
  if (projStart && issueMinDate) {
    rangeStart = projStart.getTime() < issueMinDate.getTime() ? new Date(projStart) : new Date(issueMinDate);
  } else if (projStart) {
    rangeStart = new Date(projStart);
  } else if (issueMinDate) {
    rangeStart = new Date(issueMinDate);
  } else {
    rangeStart = addDays(today, -7);
  }

  let rangeEnd: Date;
  if (projEnd && issueMaxDate) {
    rangeEnd = projEnd.getTime() > issueMaxDate.getTime() ? new Date(projEnd) : new Date(issueMaxDate);
  } else if (projEnd) {
    rangeEnd = new Date(projEnd);
  } else if (issueMaxDate) {
    rangeEnd = new Date(issueMaxDate);
  } else {
    rangeEnd = addDays(today, 21);
  }

  if (rangeStart > rangeEnd) {
    rangeEnd = addDays(rangeStart, 14);
  }

  const paddedStart = addDays(rangeStart, -7);
  const paddedEnd = addDays(rangeEnd, 14);

  paddedStart.setHours(0, 0, 0, 0);
  paddedEnd.setHours(0, 0, 0, 0);

  const totalDays = Math.max(21, diffDays(paddedEnd, paddedStart) + 1);
  const daysArray: Date[] = [];
  for (let i = 0; i < totalDays; i++) {
    daysArray.push(addDays(paddedStart, i));
  }

  return {
    flatWBSItems: flatList,
    timelineRange: {
      start: paddedStart,
      end: paddedEnd,
      totalDays,
      days: daysArray,
    },
  };
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

const generateBottomHeaders = (
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