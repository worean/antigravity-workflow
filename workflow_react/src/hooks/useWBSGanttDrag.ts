﻿import { useState, useEffect, useMemo, useCallback, type RefObject } from 'react';
import type { Issue } from '@/types';
import type { DragState } from '@/types/wbs';
import { updateIssue, batchUpdateIssueSchedules } from '@/services/api';
import { formatDateOnly, parseLocalDate, addDays, diffDays } from '@/utils/dateUtils';
import { calculateSnapDates } from '@/utils/wbs';
import { useUIStore } from '@/stores/useUIStore';
import { useWBSAutoScroll } from './useWBSAutoScroll';

interface UseWBSGanttDragProps {
  issues: Issue[];
  setIssues: React.Dispatch<React.SetStateAction<Issue[]>>;
  dayWidth: number;
  updatingIssueId: number | null;
  setUpdatingIssueId: (id: number | null) => void;
  setErrorMessage: (msg: string | null) => void;
  loadProjectData: () => Promise<void>;
  ganttBodyRef: RefObject<HTMLDivElement | null>;
  ganttHeaderRef: RefObject<HTMLDivElement | null>;
}

export const useWBSGanttDrag = ({
  issues,
  setIssues,
  dayWidth,
  updatingIssueId,
  setUpdatingIssueId,
  setErrorMessage,
  loadProjectData,
  ganttBodyRef,
  ganttHeaderRef,
}: UseWBSGanttDragProps) => {
  const [dragState, setDragState] = useState<DragState | null>(null);

  // Helper: 모든 자손 하위 이슈 ID 집합 구하기
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

  // 스크롤 발생 시 드래그 상태 날짜 재계산 콜백
  const handleScrollTick = useCallback(
    (clientX: number, targetScroll: number) => {
      if (!dragState) return;
      const { nextStart, nextDue } = calculateSnapDates(dragState, clientX, targetScroll, dayWidth);
      setDragState((prev) => {
        if (!prev) return null;
        if (
          prev.currentStartDate.getTime() === nextStart.getTime() &&
          prev.currentDueDate.getTime() === nextDue.getTime()
        ) {
          return prev;
        }
        return {
          ...prev,
          currentStartDate: nextStart,
          currentDueDate: nextDue,
        };
      });
    },
    [dragState, dayWidth]
  );

  // 엣지 오토스크롤 전담 훅
  const { updateMousePos, clearMousePos } = useWBSAutoScroll({
    isDragging: !!dragState,
    scrollContainerRef: ganttBodyRef,
    headerContainerRef: ganttHeaderRef,
    onScrollTick: handleScrollTick,
  });

  // 드래그 시작 핸들러
  const handleMouseDownOnBar = (
    e: React.MouseEvent,
    iss: Issue,
    type: 'move' | 'resize-left' | 'resize-right',
    startDate: Date,
    endDate: Date
  ) => {
    e.stopPropagation();
    if (updatingIssueId) return;

    const initialScrollLeft = ganttBodyRef.current?.scrollLeft || 0;
    updateMousePos(e.clientX, e.clientY);

    setDragState({
      issueId: iss.id,
      type,
      startX: e.clientX,
      initialScrollLeft,
      originalStartDate: new Date(startDate),
      originalDueDate: new Date(endDate),
      currentStartDate: new Date(startDate),
      currentDueDate: new Date(endDate),
    });
  };

  // Live Date Map (실시간 계산 롤업)
  const liveDateMap = useMemo(() => {
    const map = new Map<number, { start: Date | null; end: Date | null; isAffected: boolean }>();
    const issueMap = new Map<number, Issue>();
    const childrenMap = new Map<number, Issue[]>();

    issues.forEach((iss) => {
      issueMap.set(iss.id, iss);
    });

    issues.forEach((iss) => {
      if (iss.parentId && issueMap.has(iss.parentId)) {
        const pList = childrenMap.get(iss.parentId) || [];
        pList.push(iss);
        childrenMap.set(iss.parentId, pList);
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

    const getDirectDates = (iss: Issue) => {
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

    const computeLiveDates = (iss: Issue): { start: Date | null; end: Date | null; isAffected: boolean } => {
      if (map.has(iss.id)) return map.get(iss.id)!;

      const direct = getDirectDates(iss);
      const children = childrenMap.get(iss.id) || [];

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

  // 마우스 이동 및 종료 이벤트 리스너
  useEffect(() => {
    if (!dragState) return;

    const handleMouseMove = (e: MouseEvent) => {
      updateMousePos(e.clientX, e.clientY);
      const scrollLeft = ganttBodyRef.current?.scrollLeft || 0;
      const { nextStart, nextDue } = calculateSnapDates(dragState, e.clientX, scrollLeft, dayWidth);

      setDragState((prev) => {
        if (!prev) return null;
        if (
          prev.currentStartDate.getTime() === nextStart.getTime() &&
          prev.currentDueDate.getTime() === nextDue.getTime()
        ) {
          return prev;
        }
        return {
          ...prev,
          currentStartDate: nextStart,
          currentDueDate: nextDue,
        };
      });
    };

    const handleMouseUp = async () => {
      clearMousePos();
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

      const previousIssues = [...issues];

      // 1. 낙관적 UI 업데이트
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

      setDragState(null);
      setUpdatingIssueId(current.issueId);

      // 2. 백엔드 API 요청
      try {
        if (current.type === 'move') {
          const descendantIds = getDescendantIssueIds(current.issueId);
          if (descendantIds.size > 0) {
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
            await updateIssue(current.issueId, {
              plannedStartDate: newStartStr,
              dueDate: newDueStr,
            });
          }
        } else {
          await updateIssue(current.issueId, {
            plannedStartDate: newStartStr,
            dueDate: newDueStr,
          });
        }
        await loadProjectData();
        useUIStore.getState().showToast('일정이 성공적으로 저장되었습니다.', 'success');
      } catch (err: any) {
        console.error('Failed to update issue schedule:', err);
        setIssues(previousIssues);
        const errMsg = err.response?.data?.error || '일정 수정에 실패하여 원위치로 되돌렸습니다.';
        setErrorMessage(errMsg);
        useUIStore.getState().showToast(errMsg, 'error');
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
  }, [
    dragState,
    dayWidth,
    loadProjectData,
    getDescendantIssueIds,
    issues,
    liveDateMap,
    setIssues,
    setUpdatingIssueId,
    setErrorMessage,
    ganttBodyRef,
    updateMousePos,
    clearMousePos,
  ]);

  return {
    dragState,
    setDragState,
    liveDateMap,
    handleMouseDownOnBar,
    getDescendantIssueIds,
  };
};
