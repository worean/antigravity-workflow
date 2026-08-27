// -*- coding: utf-8 -*-
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import type { Project, Sprint, Issue } from '../types';
import { getProjects, getSprints, getIssues, updateIssue, batchUpdateIssueSchedules } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Layers,
  ChevronRight,
  ChevronDown,
  Maximize2,
  Minimize2,
  Clock,
  ZoomIn,
  ZoomOut,
  Calendar,
  AlertCircle,
  Loader2,
  GripVertical,
  LogIn,
} from 'lucide-react';
import { Button, Spinner, StatusBadge, Avatar } from '../components/common';
import { formatDateOnly, parseLocalDate, addDays, diffDays, getWeekNumber } from '../utils/dateUtils';

interface WBSPageProps {
  onSelectIssue?: (issue: Issue) => void;
  onOpenAuth?: () => void;
}

export interface WBSColorTheme {
  name: string;
  base: string;
  border: string;
  progress: string;
  bgEmpty: string;
  parentBase: string;
  parentBorder: string;
  dragBase: string;
  dragBorder: string;
}

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

interface WBSItem {
  issue: Issue;
  depth: number;
  hasChildren: boolean;
  startDate: Date | null;
  endDate: Date | null;
  isParent: boolean;
  rootIssueId: number;
  color: WBSColorTheme;
}

interface DragState {
  issueId: number;
  type: 'move' | 'resize-left' | 'resize-right';
  startX: number;
  originalStartDate: Date;
  originalDueDate: Date;
  currentStartDate: Date;
  currentDueDate: Date;
}

interface TreeDropTarget {
  targetId: number | 'root';
  position: 'inside' | 'before' | 'after' | 'root';
}

export const WBSPage: React.FC<WBSPageProps> = ({ onSelectIssue, onOpenAuth }) => {
  const { isAuthenticated } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [selectedSprintId, setSelectedSprintId] = useState<number | 'ALL'>('ALL');
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [issuesLoading, setIssuesLoading] = useState<boolean>(false);
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
  const [isBackgroundSyncing, setIsBackgroundSyncing] = useState<boolean>(false);

  // Preference: isSundayStart (default: true)
  const isSundayStart = useMemo<boolean>(() => {
    const saved = localStorage.getItem('pref_is_sunday_start');
    return saved !== null ? saved === 'true' : true;
  }, []);

  // Collapse / Expand State (Set of collapsed issue IDs)
  const [collapsedIds, setCollapsedIds] = useState<Set<number>>(new Set());

  // Zoom & Scale State (dayWidth: 6px ~ 72px)
  const [dayWidth, setDayWidth] = useState<number>(36);

  // Gantt Bar Drag & Drop / Resize State
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [updatingIssueId, setUpdatingIssueId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Left TreeList Drag & Drop State (계층 구조 변경)
  const [treeDragSourceId, setTreeDragSourceId] = useState<number | null>(null);
  const [treeDropTarget, setTreeDropTarget] = useState<TreeDropTarget | null>(null);

  // Left table width
  const leftWidth = 440;

  // Scroll Sync Refs
  const tableBodyRef = useRef<HTMLDivElement>(null);
  const ganttBodyRef = useRef<HTMLDivElement>(null);
  const ganttHeaderRef = useRef<HTMLDivElement>(null);

  // 1. Initial Load: Projects
  useEffect(() => {
    const fetchInitial = async () => {
      setLoading(true);
      try {
        const pList = await getProjects();
        setProjects(pList);
        if (pList.length > 0) {
          const savedProjId = localStorage.getItem('selectedProjectId');
          const matched = pList.find((p) => p.id === Number(savedProjId));
          setSelectedProjectId(matched ? matched.id : pList[0].id);
        }
      } catch (err) {
        console.error('Failed to load projects:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchInitial();
  }, []);

  // 2. Load Sprints & Issues when Project changes
  const loadProjectData = useCallback(
    async (showLoading: boolean = false) => {
      if (!selectedProjectId) return;
      if (showLoading) setIssuesLoading(true);
      else setIsBackgroundSyncing(true);

      const prevTableScrollTop = tableBodyRef.current?.scrollTop;
      const prevGanttScrollTop = ganttBodyRef.current?.scrollTop;
      const prevGanttScrollLeft = ganttBodyRef.current?.scrollLeft;

      try {
        const [sData, iData] = await Promise.all([
          getSprints(selectedProjectId),
          getIssues({
            projectId: selectedProjectId,
            sprintId: selectedSprintId === 'ALL' ? undefined : selectedSprintId,
          }),
        ]);
        setSprints(sData);
        setIssues(iData);
      } catch (err) {
        console.error('Failed to load WBS data:', err);
      } finally {
        if (showLoading) setIssuesLoading(false);
        setIsBackgroundSyncing(false);
        setIsInitialLoading(false);

        // 스크롤 위치 복원 (인-플레이스 갱신 시 커서/스크롤 위치 완벽 보존)
        requestAnimationFrame(() => {
          if (tableBodyRef.current && prevTableScrollTop !== undefined) {
            tableBodyRef.current.scrollTop = prevTableScrollTop;
          }
          if (ganttBodyRef.current) {
            if (prevGanttScrollTop !== undefined) ganttBodyRef.current.scrollTop = prevGanttScrollTop;
            if (prevGanttScrollLeft !== undefined) ganttBodyRef.current.scrollLeft = prevGanttScrollLeft;
          }
        });
      }
    },
    [selectedProjectId, selectedSprintId]
  );

  useEffect(() => {
    loadProjectData(true);
  }, [loadProjectData]);

  // 3. Build Hierarchical Tree and compute derived dates
  const { flatWBSItems, timelineRange } = useMemo(() => {
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

    // Helper to calculate effective dates (including child dates for parents)
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

    // 시작계획일(plannedStartDate) 기준 오름차순 시간순 정렬 헬퍼
    const compareWBSOrder = (a: Issue, b: Issue): number => {
      const aDates = computeDates(a);
      const bDates = computeDates(b);

      const aStart = aDates.start ? aDates.start.getTime() : null;
      const bStart = bDates.start ? bDates.start.getTime() : null;

      // 1. 시작일 기준 정렬 (시작일이 빠른 이슈가 앞, 없는 이슈는 뒤)
      if (aStart !== null && bStart !== null) {
        if (aStart !== bStart) return aStart - bStart;
      } else if (aStart !== null && bStart === null) {
        return -1;
      } else if (aStart === null && bStart !== null) {
        return 1;
      }

      // 2. 시작일이 같거나 둘 다 없는 경우: 기한(Due Date) 빠른 순
      const aEnd = aDates.end ? aDates.end.getTime() : null;
      const bEnd = bDates.end ? bDates.end.getTime() : null;
      if (aEnd !== null && bEnd !== null) {
        if (aEnd !== bEnd) return aEnd - bEnd;
      } else if (aEnd !== null && bEnd === null) {
        return -1;
      } else if (aEnd === null && bEnd !== null) {
        return 1;
      }

      // 3. 시작일과 기한이 모두 같은 경우: ID 오름차순
      return a.id - b.id;
    };

    // Flatten tree respecting collapsedIds
    const flatList: WBSItem[] = [];
    let minDate: Date | null = null;
    let maxDate: Date | null = null;

    const traverse = (iss: Issue, depth: number, isHiddenByParent: boolean, rootId: number) => {
      const children = childrenMap.get(iss.id) || [];
      const hasChildren = children.length > 0;
      const { start, end } = computeDates(iss);

      if (start) {
        if (!minDate || start < minDate) minDate = new Date(start);
      }
      if (end) {
        if (!maxDate || end > maxDate) maxDate = new Date(end);
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
          color: getWBSColorByRootId(rootId),
        });
      }

      const isCollapsed = collapsedIds.has(iss.id);
      const hideNext = isHiddenByParent || isCollapsed;

      // 하위 자식 이슈들도 시작계획일 순서대로 정렬하여 순회
      const sortedChildren = [...children].sort(compareWBSOrder);
      sortedChildren.forEach((child) => {
        traverse(child, depth + 1, hideNext, rootId);
      });
    };

    // 최상위 루트 이슈들을 시작계획일 순서대로 정렬
    const sortedRootIssues = [...rootIssues].sort(compareWBSOrder);
    sortedRootIssues.forEach((root) => traverse(root, 0, false, root.id));

    // Determine Timeline Range (minDate ~ maxDate with padding)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const rangeStart = minDate ? new Date(minDate) : addDays(today, -7);
    const rangeEnd = maxDate ? new Date(maxDate) : addDays(today, 21);

    // Add extra padding days for smooth scrolling
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
  }, [issues, collapsedIds]);

  // View Mode derived from dayWidth
  const currentViewScale = useMemo<'day' | 'week' | 'month'>(() => {
    if (dayWidth >= 28) return 'day';
    if (dayWidth >= 14) return 'week';
    return 'month';
  }, [dayWidth]);

  // Wheel Zoom Listener on Gantt Body
  useEffect(() => {
    const ganttEl = ganttBodyRef.current;
    if (!ganttEl) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.altKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY < 0 ? 4 : -4;
        setDayWidth((prev) => Math.min(72, Math.max(6, prev + delta)));
      }
    };

    ganttEl.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      ganttEl.removeEventListener('wheel', handleWheel);
    };
  }, []);

  // Quick Zoom Presets
  const setScalePreset = (preset: 'day' | 'week' | 'month') => {
    if (preset === 'day') setDayWidth(36);
    else if (preset === 'week') setDayWidth(18);
    else setDayWidth(8);
  };

  const handleZoomIn = () => setDayWidth((prev) => Math.min(72, prev + 6));
  const handleZoomOut = () => setDayWidth((prev) => Math.max(6, prev - 6));

  // Toggle Collapse
  const toggleCollapse = (id: number) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Expand All
  const handleExpandAll = () => {
    setCollapsedIds(new Set());
  };

  // Collapse All
  const handleCollapseAll = () => {
    const parentIds = new Set<number>();
    issues.forEach((iss) => {
      if (iss.parentId) parentIds.add(iss.parentId);
    });
    setCollapsedIds(parentIds);
  };

  // Scroll Sync between Left Table Body and Right Gantt Body
  const handleTableScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (ganttBodyRef.current && e.currentTarget === tableBodyRef.current) {
      ganttBodyRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  const handleGanttScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (tableBodyRef.current && e.currentTarget === ganttBodyRef.current) {
      tableBodyRef.current.scrollTop = e.currentTarget.scrollTop;
    }
    if (ganttHeaderRef.current && e.currentTarget === ganttBodyRef.current) {
      ganttHeaderRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
  };

  // Scroll to Today
  const handleScrollToToday = () => {
    if (!ganttBodyRef.current) return;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dDiff = diffDays(today, timelineRange.start);
    if (dDiff >= 0) {
      const targetScroll = Math.max(0, dDiff * dayWidth - 180);
      ganttBodyRef.current.scrollTo({ left: targetScroll, behavior: 'smooth' });
    }
  };

  // 4. Quick Schedule on Empty Timeline Click (미등록 이슈 일정 1주일 설정)
  const handleTimelineRowClick = async (e: React.MouseEvent<HTMLDivElement>, iss: Issue, isParent: boolean) => {
    if (isParent || iss.plannedStartDate || iss.dueDate || updatingIssueId || dragState) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickedDayIndex = Math.floor(clickX / dayWidth);
    const clickedDate = addDays(timelineRange.start, Math.max(0, clickedDayIndex));

    const startDateStr = formatDateOnly(clickedDate);
    const dueDateStr = formatDateOnly(addDays(clickedDate, 6)); // 1주일 (7일간)

    setUpdatingIssueId(iss.id);
    try {
      await updateIssue(iss.id, {
        plannedStartDate: startDateStr,
        dueDate: dueDateStr,
      });
      await loadProjectData();
    } catch (err: any) {
      console.error('Failed to quick schedule issue:', err);
      setErrorMessage(err.response?.data?.error || '일정 설정에 실패했습니다.');
    } finally {
      setUpdatingIssueId(null);
    }
  };

  // Helper to find all descendants of an issue (모든 자손 하위 이슈 ID 집합 구하기)
  const getDescendantIssueIds = useCallback(
    (parentIssueId: number): Set<number> => {
      const descSet = new Set<number>();
      const queue = [parentIssueId];
      while (queue.length > 0) {
        const currId = queue.shift()!;
        issues.forEach((iss) => {
          if (iss.parentId === currId && !descSet.has(iss.id)) {
            descSet.add(iss.id);
            queue.push(iss.id);
          }
        });
      }
      return descSet;
    },
    [issues]
  );

  // 5. Drag & Drop and Resize Handlers
  const handleMouseDownOnBar = (
    e: React.MouseEvent,
    iss: Issue,
    type: 'move' | 'resize-left' | 'resize-right',
    startDate: Date,
    endDate: Date
  ) => {
    e.stopPropagation();
    if (updatingIssueId) return;

    setDragState({
      issueId: iss.id,
      type,
      startX: e.clientX,
      originalStartDate: new Date(startDate),
      originalDueDate: new Date(endDate),
      currentStartDate: new Date(startDate),
      currentDueDate: new Date(endDate),
    });
  };

  // Live Date Map (드래그 상태를 실시간 반영한 이슈별 유효 시작일/기한 및 상위 이슈 자동 롤업 계산)
  const liveDateMap = useMemo(() => {
    const map = new Map<number, { start: Date | null; end: Date | null; isAffected: boolean }>();
    const issueMap = new Map<number, Issue>();
    const childrenMap = new Map<number, Issue[]>();

    issues.forEach((iss) => {
      issueMap.set(iss.id, iss);
    });

    issues.forEach((iss) => {
      if (iss.parentId && issueMap.has(iss.parentId)) {
        const list = childrenMap.get(iss.parentId) || [];
        list.push(iss);
        childrenMap.set(iss.parentId, list);
      }
    });

    const isAncestorDragged = (issId: number): boolean => {
      if (!dragState) return false;
      if (dragState.issueId === issId) return false;
      return getDescendantIssueIds(dragState.issueId).has(issId);
    };

    const deltaDays = dragState
      ? diffDays(dragState.currentStartDate, dragState.originalStartDate)
      : 0;

    // 각 이슈의 개별 실시간 기본 날짜
    const getDirectLiveDates = (iss: Issue): { start: Date | null; end: Date | null; isDirectAffected: boolean } => {
      if (dragState && dragState.issueId === iss.id) {
        return {
          start: dragState.currentStartDate,
          end: dragState.currentDueDate,
          isDirectAffected: true,
        };
      }
      if (dragState && isAncestorDragged(iss.id)) {
        const origStart = parseLocalDate(iss.plannedStartDate);
        const origDue = parseLocalDate(iss.dueDate);
        return {
          start: origStart ? addDays(origStart, deltaDays) : null,
          end: origDue ? addDays(origDue, deltaDays) : null,
          isDirectAffected: true,
        };
      }
      return {
        start: parseLocalDate(iss.plannedStartDate),
        end: parseLocalDate(iss.dueDate),
        isDirectAffected: false,
      };
    };

    // 재귀적으로 자식들의 min/max를 실시간으로 반영한 날짜 계산
    const computeLiveDates = (iss: Issue): { start: Date | null; end: Date | null; isAffected: boolean } => {
      if (map.has(iss.id)) {
        return map.get(iss.id)!;
      }

      const direct = getDirectLiveDates(iss);
      const children = childrenMap.get(iss.id) || [];

      // 상위 이슈 자신이 직접 드래그 중인 경우 직접 날짜 사용
      if (dragState && dragState.issueId === iss.id) {
        const res = { start: direct.start, end: direct.end, isAffected: true };
        map.set(iss.id, res);
        return res;
      }

      let start = direct.start;
      let end = direct.end;
      let isAffected = direct.isDirectAffected;

      if (children.length > 0) {
        let minChildStart: Date | null = null;
        let maxChildEnd: Date | null = null;

        for (const child of children) {
          const cLive = computeLiveDates(child);
          if (cLive.isAffected) isAffected = true;

          if (cLive.start) {
            if (!minChildStart || cLive.start < minChildStart) minChildStart = cLive.start;
          }
          if (cLive.end) {
            if (!maxChildEnd || cLive.end > maxChildEnd) maxChildEnd = cLive.end;
          }
        }

        if (minChildStart) start = minChildStart;
        if (maxChildEnd) end = maxChildEnd;
      }

      const res = { start, end, isAffected };
      map.set(iss.id, res);
      return res;
    };

    issues.forEach((iss) => {
      computeLiveDates(iss);
    });

    return map;
  }, [issues, dragState, getDescendantIssueIds]);

  // Global Mouse Move & Mouse Up for Dragging
  useEffect(() => {
    if (!dragState) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragState.startX;
      const snapDays = Math.round(deltaX / dayWidth);

      if (dragState.type === 'move') {
        const nextStart = addDays(dragState.originalStartDate, snapDays);
        const nextDue = addDays(dragState.originalDueDate, snapDays);
        setDragState((prev) => (prev ? { ...prev, currentStartDate: nextStart, currentDueDate: nextDue } : null));
      } else if (dragState.type === 'resize-left') {
        const nextStart = addDays(dragState.originalStartDate, snapDays);
        if (nextStart <= dragState.originalDueDate) {
          setDragState((prev) => (prev ? { ...prev, currentStartDate: nextStart } : null));
        }
      } else if (dragState.type === 'resize-right') {
        const nextDue = addDays(dragState.originalDueDate, snapDays);
        if (nextDue >= dragState.originalStartDate) {
          setDragState((prev) => (prev ? { ...prev, currentDueDate: nextDue } : null));
        }
      }
    };

    const handleMouseUp = async () => {
      const current = dragState;
      if (!current) return;

      const deltaDays = diffDays(current.currentStartDate, current.originalStartDate);
      const newStartStr = formatDateOnly(current.currentStartDate);
      const newDueStr = formatDateOnly(current.currentDueDate);
      const origStartStr = formatDateOnly(current.originalStartDate);
      const origDueStr = formatDateOnly(current.originalDueDate);

      if (newStartStr === origStartStr && newDueStr === origDueStr) {
        setDragState(null);
        return;
      }

      // 이전 이슈 상태 스냅샷 저장 (API 실패 시 원상복구용)
      const previousIssues = [...issues];

      // 1. 낙관적 UI 업데이트 (Optimistic UI Update): liveDateMap에 계산된 실시간 롤업 날짜들을 즉시 반영
      setIssues((prev) =>
        prev.map((iss) => {
          const live = liveDateMap.get(iss.id);
          if (live && live.isAffected) {
            return {
              ...iss,
              plannedStartDate: live.start ? formatDateOnly(live.start) : iss.plannedStartDate,
              dueDate: live.end ? formatDateOnly(live.end) : iss.dueDate,
            };
          }
          return iss;
        })
      );

      // 드래그 상태 해제
      setDragState(null);
      setUpdatingIssueId(current.issueId);

      // 2. 백엔드 API 요청 (성공 시 유지 및 최종 동기화, 실패 시 원위치 롤백)
      try {
        if (current.type === 'move') {
          const descendantIds = getDescendantIssueIds(current.issueId);
          if (descendantIds.size > 0) {
            // 상위 이슈 이동: 모든 하위 자손 이슈들을 단일 트랜잭션으로 초고속 일괄 병렬 업데이트!
            const childIssuesToUpdate = issues.filter((iss) => descendantIds.has(iss.id));
            const batchItems = childIssuesToUpdate.map((child) => {
              const cStart = parseLocalDate(child.plannedStartDate);
              const cDue = parseLocalDate(child.dueDate);
              return {
                id: child.id,
                plannedStartDate: cStart ? formatDateOnly(addDays(cStart, deltaDays)) : null,
                dueDate: cDue ? formatDateOnly(addDays(cDue, deltaDays)) : null,
              };
            });
            await batchUpdateIssueSchedules(batchItems);
          } else {
            // 하위 이슈가 없는 단일 이슈 이동
            await updateIssue(current.issueId, {
              plannedStartDate: newStartStr,
              dueDate: newDueStr,
            });
          }
        } else {
          // resize-left, resize-right (단일 이슈 리사이즈)
          await updateIssue(current.issueId, {
            plannedStartDate: newStartStr,
            dueDate: newDueStr,
          });
        }
        // 최종 롤업 데이터 동기화
        await loadProjectData();
      } catch (err: any) {
        console.error('Failed to update issue schedule:', err);
        // 실패 시 원래 위치로 롤백
        setIssues(previousIssues);
        setErrorMessage(err.response?.data?.error || '일정 수정에 실패하여 원위치로 롤백합니다.');
        await loadProjectData();
      } finally {
        setUpdatingIssueId(null);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState, dayWidth, loadProjectData, getDescendantIssueIds, issues, liveDateMap]);

  // ----------------------------------------------------
  // 6. TreeList Drag & Drop Handlers (좌측 트리 계층 변경 & 재배치)
  // ----------------------------------------------------
  const handleTreeDragStart = (e: React.DragEvent, issueId: number) => {
    e.stopPropagation();
    e.dataTransfer.setData('text/plain', String(issueId));
    e.dataTransfer.effectAllowed = 'move';
    setTreeDragSourceId(issueId);
  };

  const handleTreeDragOver = (e: React.DragEvent, targetIssue: Issue) => {
    e.preventDefault();
    e.stopPropagation();
    if (!treeDragSourceId || treeDragSourceId === targetIssue.id) {
      e.dataTransfer.dropEffect = 'none';
      return;
    }

    // 순환 참조 방지: 드래그 중인 이슈의 자손 이슈들 밑으로는 드롭 불가
    const descendantIds = getDescendantIssueIds(treeDragSourceId);
    if (descendantIds.has(targetIssue.id)) {
      e.dataTransfer.dropEffect = 'none';
      return;
    }

    e.dataTransfer.dropEffect = 'move';
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const height = rect.height;

    if (offsetY < height * 0.25) {
      setTreeDropTarget({ targetId: targetIssue.id, position: 'before' });
    } else if (offsetY > height * 0.75) {
      setTreeDropTarget({ targetId: targetIssue.id, position: 'after' });
    } else {
      setTreeDropTarget({ targetId: targetIssue.id, position: 'inside' });
    }
  };

  const handleTreeDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleTreeDrop = async (e: React.DragEvent, targetIssue: Issue | 'root') => {
    e.preventDefault();
    e.stopPropagation();
    const sourceId = treeDragSourceId;
    const dropTarget = treeDropTarget;
    setTreeDragSourceId(null);
    setTreeDropTarget(null);

    if (!sourceId || !dropTarget) return;

    let newParentId: number | null = null;

    if (targetIssue === 'root' || dropTarget.position === 'root') {
      newParentId = null;
    } else if (typeof targetIssue === 'object') {
      if (sourceId === targetIssue.id) return;
      const descendantIds = getDescendantIssueIds(sourceId);
      if (descendantIds.has(targetIssue.id)) return;

      if (dropTarget.position === 'inside') {
        newParentId = targetIssue.id;
      } else {
        // 'before' or 'after' -> 타겟 이슈와 동일한 계층(타겟의 parentId)으로 이동
        newParentId = targetIssue.parentId ? Number(targetIssue.parentId) : null;
      }
    }

    const draggedIssue = issues.find((i) => i.id === sourceId);
    if (!draggedIssue) return;
    const currentParentId = draggedIssue.parentId ? Number(draggedIssue.parentId) : null;

    if (currentParentId === newParentId) {
      return; // 변경 없음
    }

    // 1. 낙관적 UI 업데이트 (Optimistic UI Update)
    const previousIssues = [...issues];
    setIssues((prev) =>
      prev.map((iss) => (iss.id === sourceId ? { ...iss, parentId: newParentId } : iss))
    );

    // 새 부모가 접혀 있었다면 펼치기
    if (newParentId) {
      setCollapsedIds((prev) => {
        const next = new Set(prev);
        next.delete(newParentId!);
        return next;
      });
    }

    setUpdatingIssueId(sourceId);
    try {
      await updateIssue(sourceId, { parentId: newParentId });
      await loadProjectData();
    } catch (err: any) {
      console.error('Failed to reparent issue in tree:', err);
      setIssues(previousIssues);
      setErrorMessage(err.response?.data?.error || '계층 구조 변경에 실패하여 원위치로 롤백합니다.');
      await loadProjectData();
    } finally {
      setUpdatingIssueId(null);
    }
  };

  const handleTreeDragEnd = () => {
    setTreeDragSourceId(null);
    setTreeDropTarget(null);
  };

  // Sprint Due Date Marker Lines Calculation (스프린트 기한 선 위치 계산)
  const sprintDueLines = useMemo(() => {
    return sprints
      .map((s) => {
        if (!s.endDate) return null;
        const endDate = parseLocalDate(s.endDate);
        if (!endDate) return null;

        const dayDiff = diffDays(endDate, timelineRange.start);
        if (dayDiff < 0 || dayDiff >= timelineRange.totalDays) return null;

        // 해당 일자의 오른쪽 끝 경계선 (마감 시점)
        const leftPos = (dayDiff + 1) * dayWidth;

        return {
          sprint: s,
          endDate,
          dayIndex: dayDiff,
          leftPos,
          formattedDate: formatDateOnly(endDate),
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }, [sprints, timelineRange.start, timelineRange.totalDays, dayWidth]);

  // Today Marker Line Calculation (오늘 날짜 선 및 마커 위치 계산)
  const todayMarker = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dayDiff = diffDays(today, timelineRange.start);
    if (dayDiff < 0 || dayDiff >= timelineRange.totalDays) return null;

    // 오늘 일자의 중앙 위치
    const leftPos = dayDiff * dayWidth + dayWidth / 2;

    return {
      date: today,
      dayIndex: dayDiff,
      leftPos,
      formattedDate: formatDateOnly(today),
    };
  }, [timelineRange.start, timelineRange.totalDays, dayWidth]);

  // Dynamic Timeline Headers based on Scale
  const topHeaders = useMemo(() => {
    if (currentViewScale === 'month') {
      // Year grouping (YYYY년)
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
      return years;
    } else {
      // Month grouping (YYYY년 M월)
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
      return months;
    }
  }, [timelineRange.days, currentViewScale]);

  const bottomHeaders = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (currentViewScale === 'month') {
      // Month blocks: 1월, 2월, 3월...
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
      return { type: 'month' as const, blocks };
    } else if (currentViewScale === 'week') {
      // Week blocks: isSundayStart 기준 올해 N번째 주차 (예: 34주차, 35주차...)
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
      return { type: 'week' as const, blocks };
    } else {
      // Day blocks: 1(일), 2(월), 3(화)...
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
      return { type: 'day' as const, blocks };
    }
  }, [timelineRange.days, currentViewScale]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '8px', overflow: 'hidden' }}>
      {/* Top Filter & Toolbar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 12px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-xs)',
          flexWrap: 'wrap',
          gap: '8px',
          flexShrink: 0,
        }}
      >
        {/* Left: Project & Sprint Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Layers size={16} color="var(--accent-cyan)" />
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-bright)' }}>
              WBS 간트 차트
            </span>
          </div>

          {/* Project Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>프로젝트:</span>
            <select
              className="input-field"
              value={selectedProjectId || ''}
              onChange={(e) => setSelectedProjectId(Number(e.target.value))}
              style={{ width: 'auto', fontSize: '0.75rem', height: '26px', padding: '0 6px' }}
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.key})
                </option>
              ))}
            </select>
          </div>

          {/* Sprint Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>스프린트:</span>
            <select
              className="input-field"
              value={String(selectedSprintId)}
              onChange={(e) => setSelectedSprintId(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
              style={{ width: 'auto', fontSize: '0.75rem', height: '26px', padding: '0 6px' }}
            >
              <option value="ALL">전체 스프린트 및 백로그</option>
              {sprints.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.status})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right: Zoom Scale & View Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Zoom In / Out Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', background: '#2d2d2d', borderRadius: 'var(--radius-xs)', border: '1px solid #3c3c3c' }}>
            <button
              type="button"
              onClick={handleZoomOut}
              style={{ background: 'none', border: 'none', color: 'var(--text-sub)', padding: '3px 6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              title="축소 (Ctrl + 휠 아래로)"
            >
              <ZoomOut size={13} />
            </button>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', padding: '0 4px', minWidth: '32px', textAlign: 'center' }}>
              {Math.round((dayWidth / 36) * 100)}%
            </span>
            <button
              type="button"
              onClick={handleZoomIn}
              style={{ background: 'none', border: 'none', color: 'var(--text-sub)', padding: '3px 6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              title="확대 (Ctrl + 휠 위로)"
            >
              <ZoomIn size={13} />
            </button>
          </div>

          {/* Scale Preset Buttons */}
          <div style={{ display: 'flex', gap: '2px', background: '#2d2d2d', padding: '2px', borderRadius: 'var(--radius-xs)', border: '1px solid #3c3c3c' }}>
            <button
              type="button"
              onClick={() => setScalePreset('day')}
              style={{
                background: currentViewScale === 'day' ? 'var(--primary)' : 'transparent',
                color: currentViewScale === 'day' ? '#fff' : 'var(--text-muted)',
                border: 'none',
                borderRadius: '2px',
                padding: '2px 8px',
                fontSize: '0.7rem',
                cursor: 'pointer',
                fontWeight: currentViewScale === 'day' ? 600 : 400,
              }}
            >
              일단위
            </button>
            <button
              type="button"
              onClick={() => setScalePreset('week')}
              style={{
                background: currentViewScale === 'week' ? 'var(--primary)' : 'transparent',
                color: currentViewScale === 'week' ? '#fff' : 'var(--text-muted)',
                border: 'none',
                borderRadius: '2px',
                padding: '2px 8px',
                fontSize: '0.7rem',
                cursor: 'pointer',
                fontWeight: currentViewScale === 'week' ? 600 : 400,
              }}
            >
              주단위
            </button>
            <button
              type="button"
              onClick={() => setScalePreset('month')}
              style={{
                background: currentViewScale === 'month' ? 'var(--primary)' : 'transparent',
                color: currentViewScale === 'month' ? '#fff' : 'var(--text-muted)',
                border: 'none',
                borderRadius: '2px',
                padding: '2px 8px',
                fontSize: '0.7rem',
                cursor: 'pointer',
                fontWeight: currentViewScale === 'month' ? 600 : 400,
              }}
            >
              월단위
            </button>
          </div>

          <Button variant="secondary" size="sm" onClick={handleScrollToToday} style={{ height: '26px', fontSize: '0.74rem' }}>
            <Clock size={12} style={{ marginRight: '4px' }} /> 오늘
          </Button>

          <Button variant="secondary" size="sm" onClick={handleExpandAll} style={{ height: '26px', fontSize: '0.74rem' }}>
            <Maximize2 size={12} style={{ marginRight: '4px' }} /> 모두 펼치기
          </Button>

          <Button variant="secondary" size="sm" onClick={handleCollapseAll} style={{ height: '26px', fontSize: '0.74rem' }}>
            <Minimize2 size={12} style={{ marginRight: '4px' }} /> 모두 접기
          </Button>

          {!isAuthenticated && onOpenAuth && (
            <Button variant="primary" size="sm" onClick={onOpenAuth} style={{ height: '26px', fontSize: '0.74rem' }}>
              <LogIn size={12} style={{ marginRight: '4px' }} /> 로그인
            </Button>
          )}

          {(isBackgroundSyncing || updatingIssueId) && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.7rem',
                color: 'var(--accent-cyan)',
                background: 'rgba(0, 122, 204, 0.1)',
                padding: '2px 6px',
                borderRadius: '4px',
              }}
            >
              <Loader2 size={12} className="animate-spin" />
              <span>동기화 중</span>
            </div>
          )}
        </div>
      </div>

      {/* Error Message Toast */}
      {errorMessage && (
        <div
          style={{
            background: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid #f43f5e',
            color: '#f43f5e',
            padding: '6px 12px',
            borderRadius: '4px',
            fontSize: '0.78rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertCircle size={14} />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            style={{ background: 'none', border: 'none', color: '#f43f5e', cursor: 'pointer', fontSize: '0.8rem' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Split Layout: Left Table + Right Gantt Timeline */}
      {((loading && projects.length === 0) || (issuesLoading && issues.length === 0) || (isInitialLoading && issues.length === 0)) ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
          <Spinner />
        </div>
      ) : issues.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          선택된 프로젝트/스프린트에 등록된 이슈가 없습니다.
        </div>
      ) : (
        <div
          style={{
            flex: 1,
            display: 'flex',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-xs)',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {/* ========================================================================= */}
          {/* 📋 Left WBS Hierarchical Table */}
          {/* ========================================================================= */}
          <div
            style={{
              width: `${leftWidth}px`,
              minWidth: '320px',
              maxWidth: '600px',
              display: 'flex',
              flexDirection: 'column',
              borderRight: '1px solid var(--border-light)',
              background: '#252526',
              flexShrink: 0,
            }}
          >
            {/* Left Header */}
            <div
              style={{
                height: '52px',
                display: 'flex',
                alignItems: 'center',
                borderBottom: '1px solid var(--border-light)',
                background: '#1e1e1e',
                fontSize: '0.74rem',
                fontWeight: 600,
                color: 'var(--text-sub)',
                padding: '0 8px',
                userSelect: 'none',
              }}
            >
              <div style={{ flex: 1, paddingLeft: '4px' }}>작업명 / 이슈 제목 (WBS)</div>
              <div style={{ width: '70px', textAlign: 'center' }}>상태</div>
              <div style={{ width: '65px', textAlign: 'center' }}>담당자</div>
              <div style={{ width: '55px', textAlign: 'center' }}>진척도</div>
            </div>

            {/* Left Body */}
            <div
              ref={tableBodyRef}
              onScroll={handleTableScroll}
              style={{
                flex: 1,
                overflowY: 'auto',
                overflowX: 'hidden',
                position: 'relative',
              }}
            >
              {flatWBSItems.map((item) => {
                const iss = item.issue;
                const isCollapsed = collapsedIds.has(iss.id);
                const isBeingDragged = treeDragSourceId === iss.id;
                const isTarget = treeDropTarget?.targetId === iss.id;

                let rowBg = item.isParent ? 'rgba(255,255,255,0.03)' : 'transparent';
                let rowBoxShadow: string | undefined = undefined;
                let rowBorderTop: string | undefined = undefined;
                let rowBorderBottom = '1px solid #333333';

                if (isTarget) {
                  if (treeDropTarget?.position === 'inside') {
                    rowBg = 'rgba(0, 122, 204, 0.28)';
                    rowBoxShadow = 'inset 0 0 0 2px #007acc';
                  } else if (treeDropTarget?.position === 'before') {
                    rowBorderTop = '2.5px solid #38bdf8';
                  } else if (treeDropTarget?.position === 'after') {
                    rowBorderBottom = '2.5px solid #38bdf8';
                  }
                }

                return (
                  <div
                    key={iss.id}
                    draggable={!updatingIssueId}
                    onDragStart={(e) => handleTreeDragStart(e, iss.id)}
                    onDragOver={(e) => handleTreeDragOver(e, iss)}
                    onDragLeave={handleTreeDragLeave}
                    onDrop={(e) => handleTreeDrop(e, iss)}
                    onDragEnd={handleTreeDragEnd}
                    onClick={() => onSelectIssue && onSelectIssue(iss)}
                    style={{
                      height: '38px',
                      display: 'flex',
                      alignItems: 'center',
                      borderBottom: rowBorderBottom,
                      borderTop: rowBorderTop,
                      fontSize: '0.74rem',
                      padding: '0 8px',
                      cursor: 'grab',
                      background: rowBg,
                      boxShadow: rowBoxShadow,
                      opacity: isBeingDragged ? 0.35 : 1,
                      transition: 'background 0.1s, opacity 0.15s',
                      boxSizing: 'border-box',
                    }}
                    title={
                      isTarget && treeDropTarget?.position === 'inside'
                        ? `"${iss.title}"의 하위 이슈로 배치`
                        : isTarget && treeDropTarget?.position === 'before'
                        ? `"${iss.title}"의 위쪽(동일 계층)으로 이동`
                        : isTarget && treeDropTarget?.position === 'after'
                        ? `"${iss.title}"의 아래쪽(동일 계층)으로 이동`
                        : undefined
                    }
                    onMouseEnter={(e) => {
                      if (!isTarget) e.currentTarget.style.background = '#2a2d2e';
                    }}
                    onMouseLeave={(e) => {
                      if (!isTarget) e.currentTarget.style.background = rowBg;
                    }}
                  >
                    {/* Drag Grip Handle */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '14px',
                        color: 'var(--text-muted)',
                        cursor: 'grab',
                        flexShrink: 0,
                        opacity: 0.5,
                      }}
                      title="드래그하여 계층 구조를 변경합니다"
                    >
                      <GripVertical size={12} />
                    </div>

                    {/* Title with indent and collapse arrow */}
                    <div
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        paddingLeft: `${item.depth * 14}px`,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {item.hasChildren ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleCollapse(iss.id);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            padding: '2px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {isCollapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
                        </button>
                      ) : (
                        <span style={{ width: '13px', display: 'inline-block' }} />
                      )}

                      <span
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          backgroundColor: item.color.border,
                          display: 'inline-block',
                          flexShrink: 0,
                          marginRight: '3px',
                          boxShadow: `0 0 4px ${item.color.border}88`,
                        }}
                        title={`루트 이슈 #${item.rootIssueId} 색상 그룹`}
                      />

                      <span style={{ color: 'var(--text-muted)', fontSize: '0.68rem', marginRight: '2px' }}>
                        #{iss.id}
                      </span>
                      <span
                        style={{
                          fontWeight: item.isParent ? 600 : 400,
                          color: item.isParent ? 'var(--text-bright)' : 'var(--text-main)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={iss.title}
                      >
                        {iss.title}
                      </span>
                    </div>

                    {/* Status */}
                    <div style={{ width: '70px', display: 'flex', justifyContent: 'center' }}>
                      <StatusBadge status={iss.status} size="sm" />
                    </div>

                    {/* Assignee */}
                    <div style={{ width: '65px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '3px' }}>
                      {iss.assignee ? (
                        <Avatar user={iss.assignee} name={iss.assignee.name || ''} size={16} shape="circle" />
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>미지정</span>
                      )}
                    </div>

                    {/* Progress */}
                    <div style={{ width: '55px', textAlign: 'center', fontSize: '0.68rem', color: iss.progress === 100 ? '#89d185' : 'var(--text-sub)' }}>
                      {iss.progress || 0}%
                    </div>
                  </div>
                );
              })}

              {/* Drop Target Zone: Move to Root (최상위 이슈로 빼기 영역) */}
              {treeDragSourceId && (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.dataTransfer.dropEffect = 'move';
                    setTreeDropTarget({ targetId: 'root', position: 'root' });
                  }}
                  onDragLeave={handleTreeDragLeave}
                  onDrop={(e) => handleTreeDrop(e, 'root')}
                  style={{
                    margin: '8px',
                    padding: '10px 8px',
                    borderRadius: '4px',
                    border: treeDropTarget?.targetId === 'root' ? '2px dashed #007acc' : '1px dashed #3e3e3e',
                    background: treeDropTarget?.targetId === 'root' ? 'rgba(0, 122, 204, 0.2)' : 'rgba(255,255,255,0.02)',
                    textAlign: 'center',
                    fontSize: '0.72rem',
                    color: treeDropTarget?.targetId === 'root' ? '#38bdf8' : 'var(--text-muted)',
                    cursor: 'copy',
                    transition: 'all 0.15s',
                  }}
                >
                  ➕ 여기에 놓으면 <strong>최상위(Root) 이슈</strong>로 변경됩니다
                </div>
              )}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 📊 Right Gantt Chart Timeline */}
          {/* ========================================================================= */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              background: '#1e1e1e',
            }}
          >
            {/* Timeline Header */}
            <div
              ref={ganttHeaderRef}
              style={{
                height: '52px',
                display: 'flex',
                flexDirection: 'column',
                borderBottom: '1px solid var(--border-light)',
                background: '#252526',
                overflowX: 'hidden',
                userSelect: 'none',
                width: '100%',
              }}
            >
              {/* Top Row: Year or Month Headers */}
              <div style={{ display: 'flex', height: '24px', borderBottom: '1px solid #333333' }}>
                {topHeaders.map((h, idx) => (
                  <div
                    key={idx}
                    style={{
                      width: `${h.daysCount * dayWidth}px`,
                      minWidth: `${h.daysCount * dayWidth}px`,
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      color: 'var(--text-bright)',
                      display: 'flex',
                      alignItems: 'center',
                      paddingLeft: '6px',
                      borderRight: '1px solid #383838',
                      boxSizing: 'border-box',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {h.label}
                  </div>
                ))}
              </div>

              {/* Bottom Row: Month / Week / Day Headers */}
              <div style={{ display: 'flex', height: '28px' }}>
                {bottomHeaders.type === 'month' &&
                  bottomHeaders.blocks.map((b, idx) => (
                    <div
                      key={idx}
                      style={{
                        width: `${b.daysCount * dayWidth}px`,
                        minWidth: `${b.daysCount * dayWidth}px`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRight: '1px solid #2e2e2e',
                        background: b.isCurrent ? 'rgba(0,122,204,0.15)' : 'transparent',
                        color: b.isCurrent ? '#9cdcfe' : 'var(--text-sub)',
                        fontSize: '0.68rem',
                        fontWeight: b.isCurrent ? 700 : 500,
                        boxSizing: 'border-box',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {b.label}
                    </div>
                  ))}

                {bottomHeaders.type === 'week' &&
                  bottomHeaders.blocks.map((b, idx) => (
                    <div
                      key={idx}
                      style={{
                        width: `${b.daysCount * dayWidth}px`,
                        minWidth: `${b.daysCount * dayWidth}px`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRight: '1px solid #2e2e2e',
                        background: b.isCurrent ? 'rgba(0,122,204,0.15)' : 'transparent',
                        color: b.isCurrent ? '#9cdcfe' : 'var(--text-sub)',
                        fontSize: '0.65rem',
                        fontWeight: b.isCurrent ? 700 : 400,
                        boxSizing: 'border-box',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {b.label}
                    </div>
                  ))}

                {bottomHeaders.type === 'day' &&
                  bottomHeaders.blocks.map((b, idx) => (
                    <div
                      key={idx}
                      style={{
                        width: `${dayWidth}px`,
                        minWidth: `${dayWidth}px`,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRight: '1px solid #2e2e2e',
                        background: b.isToday ? 'rgba(0,122,204,0.25)' : b.isWeekend ? 'rgba(255,255,255,0.02)' : 'transparent',
                        color: b.isToday ? '#9cdcfe' : b.isWeekend ? '#f14c4c' : 'var(--text-sub)',
                        fontSize: '0.65rem',
                        boxSizing: 'border-box',
                      }}
                    >
                      <span style={{ fontWeight: b.isToday ? 700 : 400 }}>{b.dayNum}</span>
                      <span style={{ fontSize: '0.55rem', opacity: 0.8 }}>{b.dayName}</span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Timeline Body (Gantt Rows & Bars) */}
            <div
              ref={ganttBodyRef}
              onScroll={handleGanttScroll}
              style={{
                flex: 1,
                overflowY: 'auto',
                overflowX: 'auto',
                position: 'relative',
              }}
            >
              {/* Background Grid Lines */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: `${timelineRange.totalDays * dayWidth}px`,
                  height: `${flatWBSItems.length * 38}px`,
                  display: 'flex',
                  pointerEvents: 'none',
                  zIndex: 0,
                }}
              >
                {timelineRange.days.map((d, idx) => {
                  const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                  const isToday =
                    d.getFullYear() === new Date().getFullYear() &&
                    d.getMonth() === new Date().getMonth() &&
                    d.getDate() === new Date().getDate();

                  return (
                    <div
                      key={idx}
                      style={{
                        width: `${dayWidth}px`,
                        minWidth: `${dayWidth}px`,
                        height: '100%',
                        borderRight: '1px solid #282828',
                        background: isToday ? 'rgba(0,122,204,0.08)' : isWeekend ? 'rgba(255,255,255,0.015)' : 'transparent',
                        position: 'relative',
                      }}
                    />
                  );
                })}
              </div>

              {/* Timeline Marker Line Rendering Helper Function */}
              {(() => {
                const renderTimelineMarkerLine = ({
                  key,
                  leftPos,
                  color,
                  lineStyle = 'solid',
                  lineWidth = 2,
                  zIndex = 5,
                  title,
                  badge,
                }: {
                  key?: string | number;
                  leftPos: number;
                  color: string;
                  lineStyle?: 'solid' | 'dashed';
                  lineWidth?: number;
                  zIndex?: number;
                  title?: string;
                  badge?: {
                    show?: boolean;
                    label: string;
                    icon?: React.ReactNode;
                    color?: string;
                    bgColor?: string;
                    borderColor?: string;
                  };
                }) => {
                  return (
                    <div
                      key={key}
                      style={{
                        position: 'absolute',
                        top: 0,
                        bottom: 0,
                        left: `${leftPos}px`,
                        width: 0,
                        borderLeft: `${lineWidth}px ${lineStyle} ${color}`,
                        zIndex,
                        pointerEvents: 'none',
                      }}
                      title={title}
                    >
                      {badge && badge.show && (
                        <div
                          style={{
                            position: 'sticky',
                            top: '2px',
                            transform: 'translateX(-50%)',
                            background: badge.bgColor || 'rgba(24, 24, 27, 0.95)',
                            color: badge.color || color,
                            border: `1px solid ${badge.borderColor || color}`,
                            borderRadius: '3px',
                            padding: '1px 6px',
                            fontSize: '0.62rem',
                            fontWeight: 700,
                            whiteSpace: 'nowrap',
                            pointerEvents: 'auto',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.6)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px',
                            cursor: 'default',
                          }}
                          title={title}
                        >
                          {badge.icon}
                          <span>{badge.label}</span>
                        </div>
                      )}
                    </div>
                  );
                };

                return (
                  <>
                    {/* Today Line (오늘 날짜: 라벨/아이콘/박스 없이 파란색 실선만 표시) */}
                    {todayMarker &&
                      renderTimelineMarkerLine({
                        key: 'today-line',
                        leftPos: todayMarker.leftPos,
                        color: '#007acc',
                        lineStyle: 'solid',
                        lineWidth: 2,
                        zIndex: 5,
                        title: `오늘: ${todayMarker.formattedDate}`,
                        badge: {
                          show: false,
                          label: '오늘',
                        },
                      })}

                    {/* Sprint Due Date Lines (스프린트 기한: 오렌지 점선 및 마감 뱃지 블록 표시) */}
                    {sprintDueLines.map(({ sprint, leftPos, formattedDate }) =>
                      renderTimelineMarkerLine({
                        key: `sprint-line-${sprint.id}`,
                        leftPos,
                        color: '#f59e0b',
                        lineStyle: 'dashed',
                        lineWidth: 2,
                        zIndex: 4,
                        title: `${sprint.name} 기한: ${formattedDate} (${sprint.status})`,
                        badge: {
                          show: true,
                          label: `${sprint.name} 마감`,
                          icon: <span>🚩</span>,
                          color: '#fbbf24',
                          borderColor: '#f59e0b',
                        },
                      })
                    )}
                  </>
                );
              })()}

              {/* Gantt Bars Rows */}
              <div style={{ position: 'relative', zIndex: 1, width: `${timelineRange.totalDays * dayWidth}px` }}>
                {flatWBSItems.map((item) => {
                  const iss = item.issue;
                  const live = liveDateMap.get(iss.id);
                  const isBeingDragged = dragState?.issueId === iss.id;
                  const isDescendantOfDragged =
                    dragState && !isBeingDragged
                      ? getDescendantIssueIds(dragState.issueId).has(iss.id)
                      : false;

                  let curStart = live?.start ?? item.startDate;
                  let curEnd = live?.end ?? item.endDate;

                  // 날짜/범위가 실제로 원래 값과 다르게 변동되었는지 여부
                  const isDatesChanged = Boolean(
                    dragState &&
                      !isBeingDragged &&
                      (curStart?.getTime() !== item.startDate?.getTime() ||
                        curEnd?.getTime() !== item.endDate?.getTime())
                  );

                  // 드래그로 인해 영향을 받아 일정이 변동되는 연관 일감(상위 부모 일감 또는 하위 자손 일감) 점선 피드백
                  const isDashedFeedback = isDescendantOfDragged || isDatesChanged;

                  let barLeft = 0;
                  let barWidth = 0;
                  let hasDates = false;

                  if (curStart && curEnd) {
                    hasDates = true;
                    const diffStartDays = diffDays(curStart, timelineRange.start);
                    const durationDays = Math.max(1, diffDays(curEnd, curStart) + 1);
                    barLeft = diffStartDays * dayWidth;
                    barWidth = durationDays * dayWidth;
                  }

                  const prog = iss.progress || 0;

                  return (
                    <div
                      key={iss.id}
                      onClick={(e) => handleTimelineRowClick(e, iss, item.isParent)}
                      style={{
                        height: '38px',
                        display: 'flex',
                        alignItems: 'center',
                        borderBottom: '1px solid #282828',
                        position: 'relative',
                        cursor: !hasDates && !item.isParent ? 'crosshair' : 'default',
                      }}
                      title={!hasDates && !item.isParent ? '클릭하여 이 시점에 1주일 일정을 생성합니다.' : undefined}
                    >
                      {hasDates && curStart && curEnd ? (
                        <div
                          style={{
                            position: 'absolute',
                            left: `${barLeft}px`,
                            width: `${Math.max(barWidth, 6)}px`,
                            height: '22px',
                            borderRadius: '4px',
                            background: item.color.bgEmpty,
                            border: isBeingDragged
                              ? `2.5px solid ${item.color.dragBorder}`
                              : isDashedFeedback
                              ? `2px dashed ${item.color.dragBorder}`
                              : `2px solid ${item.color.border}`,
                            boxShadow: isBeingDragged
                              ? `0 4px 14px ${item.color.base}88`
                              : isDashedFeedback
                              ? `0 2px 8px ${item.color.base}55`
                              : '0 2px 4px rgba(0,0,0,0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            userSelect: 'none',
                            cursor: 'grab',
                            transition: isBeingDragged ? 'none' : 'left 0.08s ease, width 0.08s ease, box-shadow 0.15s',
                            boxSizing: 'border-box',
                            overflow: 'hidden',
                          }}
                          onMouseDown={(e) => {
                            if (curStart && curEnd) {
                              handleMouseDownOnBar(e, iss, 'move', curStart, curEnd);
                            }
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                        >
                          {/* Left Resize Handle */}
                          {!item.isParent && (
                            <div
                              style={{
                                position: 'absolute',
                                left: 0,
                                top: 0,
                                bottom: 0,
                                width: '8px',
                                cursor: 'ew-resize',
                                zIndex: 10,
                              }}
                              onMouseDown={(e) => {
                                e.stopPropagation();
                                if (curStart && curEnd) {
                                  handleMouseDownOnBar(e, iss, 'resize-left', curStart, curEnd);
                                }
                              }}
                              title="시작일 조정"
                            />
                          )}

                          {/* Progress Fill Bar (0%일 때는 배경 bgEmpty가 노출되고, %가 차오를수록 불투명 채우기 색상 적용) */}
                          <div
                            style={{
                              width: `${prog}%`,
                              height: '100%',
                              background: isBeingDragged ? item.color.dragBase : item.color.base,
                              opacity: 1,
                              borderRadius: prog === 100 ? '2px' : '2px 0 0 2px',
                              pointerEvents: 'none',
                              transition: isBeingDragged ? 'none' : 'width 0.2s ease',
                            }}
                          />

                          {/* Label on Bar (% 진척도 텍스트) */}
                          {barWidth > 28 && (
                            <span
                              style={{
                                position: 'absolute',
                                left: '6px',
                                fontSize: '0.64rem',
                                color: '#ffffff',
                                fontWeight: 700,
                                whiteSpace: 'nowrap',
                                textShadow: '0 1px 3px rgba(0,0,0,0.95)',
                                pointerEvents: 'none',
                                zIndex: 5,
                              }}
                            >
                              {prog}%
                            </span>
                          )}

                          {/* Right Resize Handle */}
                          {!item.isParent && (
                            <div
                              style={{
                                position: 'absolute',
                                right: 0,
                                top: 0,
                                bottom: 0,
                                width: '8px',
                                cursor: 'ew-resize',
                                zIndex: 10,
                              }}
                              onMouseDown={(e) => {
                                e.stopPropagation();
                                if (curStart && curEnd) {
                                  handleMouseDownOnBar(e, iss, 'resize-right', curStart, curEnd);
                                }
                              }}
                              title="기한 조정"
                            />
                          )}

                          {/* Floating Drag Date Tooltip */}
                          {isBeingDragged && (
                            <div
                              style={{
                                position: 'absolute',
                                top: '-24px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                background: '#18181b',
                                color: item.color.progress,
                                border: `1.5px solid ${item.color.dragBorder}`,
                                padding: '2px 6px',
                                borderRadius: '3px',
                                fontSize: '0.65rem',
                                fontWeight: 600,
                                whiteSpace: 'nowrap',
                                zIndex: 30,
                                pointerEvents: 'none',
                                boxShadow: `0 2px 8px rgba(0,0,0,0.5)`,
                              }}
                            >
                              {formatDateOnly(curStart)} ~ {formatDateOnly(curEnd)} ({diffDays(curEnd, curStart) + 1}일)
                            </div>
                          )}
                        </div>
                      ) : (
                        <div
                          style={{
                            position: 'absolute',
                            left: `${Math.max(0, diffDays(new Date(), timelineRange.start)) * dayWidth}px`,
                            padding: '2px 8px',
                            border: '1px dashed #555555',
                            borderRadius: '3px',
                            fontSize: '0.65rem',
                            color: 'var(--text-muted)',
                            background: 'rgba(255,255,255,0.03)',
                            pointerEvents: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <Calendar size={10} /> 클릭하여 1주일 일정 등록
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
