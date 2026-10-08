import type { Issue } from '@/types';
import type { WBSItem, TimelineRange, WBSColorTheme } from '@/types/wbs';
import { parseLocalDate, addDays, diffDays } from '../dateUtils';
import { getWBSColorByRootId, resolveWBSColorTheme } from './wbsPalette';

export interface WBSColorOptions {
  mode?: 'multi' | 'single';
  defaultTheme?: string;
  rootColorMap?: Record<number, string>;
}

/**
 * WBS 계층 트리 구축 및 평탄화, 타임라인 날짜 범위 계산
 */
export const buildWBSTree = (
  issues: Issue[],
  collapsedIds: Set<number>,
  projectDates?: { plannedStartDate?: string | null; dueDate?: string | null } | null,
  colorOptions?: WBSColorOptions | null
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

    // 색상 결정 로직 (사용자 커스텀 매핑 및 모드 반영)
    let itemColor: WBSColorTheme;
    if (colorOptions?.mode === 'single') {
      itemColor = resolveWBSColorTheme(colorOptions.defaultTheme || 'blue', rootId);
    } else if (colorOptions?.rootColorMap && colorOptions.rootColorMap[rootId]) {
      itemColor = resolveWBSColorTheme(colorOptions.rootColorMap[rootId], rootId);
    } else {
      itemColor = getWBSColorByRootId(rootId);
    }

    if (!isHiddenByParent) {
      flatList.push({
        issue: iss,
        depth,
        hasChildren,
        startDate: start,
        endDate: end,
        isParent: hasChildren,
        rootIssueId: rootId,
        color: itemColor,
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
