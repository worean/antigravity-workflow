import { useState, useEffect, useMemo, useRef, useCallback, type RefObject } from 'react';
import type { Issue } from '../types';
import type { DragState } from '../types/wbs';
import { updateIssue, batchUpdateIssueSchedules } from '../services/api';
import { formatDateOnly, parseLocalDate, addDays, diffDays } from '../utils/dateUtils';

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
  const lastMousePosRef = useRef<{ clientX: number; clientY: number } | null>(null);
  const autoScrollFrameRef = useRef<number | null>(null);

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
    lastMousePosRef.current = { clientX: e.clientX, clientY: e.clientY };

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

  // 날짜 계산 헬퍼 함수
  const updateDatesFromMouseAndScroll = useCallback(
    (
      currentDrag: DragState,
      clientX: number,
      scrollLeft: number
    ): { nextStart: Date; nextDue: Date } => {
      const deltaMouse = clientX - currentDrag.startX;
      const deltaScroll = scrollLeft - currentDrag.initialScrollLeft;
      const totalDeltaX = deltaMouse + deltaScroll;
      const snapDays = Math.round(totalDeltaX / dayWidth);

      let nextStart = currentDrag.originalStartDate;
      let nextDue = currentDrag.originalDueDate;

      if (currentDrag.type === 'move') {
        nextStart = addDays(currentDrag.originalStartDate, snapDays);
        nextDue = addDays(currentDrag.originalDueDate, snapDays);
      } else if (currentDrag.type === 'resize-left') {
        const candidateStart = addDays(currentDrag.originalStartDate, snapDays);
        if (candidateStart <= currentDrag.originalDueDate) {
          nextStart = candidateStart;
        } else {
          nextStart = currentDrag.originalDueDate;
        }
        nextDue = currentDrag.originalDueDate;
      } else if (currentDrag.type === 'resize-right') {
        const candidateDue = addDays(currentDrag.originalDueDate, snapDays);
        if (candidateDue >= currentDrag.originalStartDate) {
          nextDue = candidateDue;
        } else {
          nextDue = currentDrag.originalStartDate;
        }
        nextStart = currentDrag.originalStartDate;
      }

      return { nextStart, nextDue };
    },
    [dayWidth]
  );

  // Global Mouse Move & Mouse Up for Dragging with Edge Zone Auto-Scroll
  useEffect(() => {
    if (!dragState) {
      if (autoScrollFrameRef.current) {
        cancelAnimationFrame(autoScrollFrameRef.current);
        autoScrollFrameRef.current = null;
      }
      return;
    }

    const EDGE_ZONE = 70; // 가장자리 감지 영역 (px)
    const MAX_SCROLL_SPEED = 12; // 최대 스크롤 속도 (px / frame)

    const handleMouseMove = (e: MouseEvent) => {
      lastMousePosRef.current = { clientX: e.clientX, clientY: e.clientY };

      const scrollLeft = ganttBodyRef.current?.scrollLeft || 0;
      const { nextStart, nextDue } = updateDatesFromMouseAndScroll(dragState, e.clientX, scrollLeft);

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

    // Auto-scroll loop using requestAnimationFrame
    const autoScrollLoop = () => {
      if (!dragState || !ganttBodyRef.current || !lastMousePosRef.current) {
        autoScrollFrameRef.current = requestAnimationFrame(autoScrollLoop);
        return;
      }

      const rect = ganttBodyRef.current.getBoundingClientRect();
      const clientX = lastMousePosRef.current.clientX;

      let scrollDelta = 0;

      // 좌측 엣지 감지 (rect.left ~ rect.left + EDGE_ZONE)
      if (clientX < rect.left + EDGE_ZONE && clientX >= rect.left - 60) {
        const dist = (rect.left + EDGE_ZONE) - clientX;
        const ratio = Math.min(1, Math.max(0.15, dist / EDGE_ZONE));
        scrollDelta = -Math.round(ratio * MAX_SCROLL_SPEED);
      }
      // 우측 엣지 감지 (rect.right - EDGE_ZONE ~ rect.right + 60)
      else if (clientX > rect.right - EDGE_ZONE && clientX <= rect.right + 60) {
        const dist = clientX - (rect.right - EDGE_ZONE);
        const ratio = Math.min(1, Math.max(0.15, dist / EDGE_ZONE));
        scrollDelta = Math.round(ratio * MAX_SCROLL_SPEED);
      }

      if (scrollDelta !== 0) {
        const currentScroll = ganttBodyRef.current.scrollLeft;
        const maxScroll = ganttBodyRef.current.scrollWidth - ganttBodyRef.current.clientWidth;
        const targetScroll = Math.max(0, Math.min(maxScroll, currentScroll + scrollDelta));

        if (targetScroll !== currentScroll) {
          ganttBodyRef.current.scrollLeft = targetScroll;
          if (ganttHeaderRef.current) {
            ganttHeaderRef.current.scrollLeft = targetScroll;
          }

          // 스크롤이 발생함에 따라 날짜도 즉시 재계산 및 갱신
          const { nextStart, nextDue } = updateDatesFromMouseAndScroll(dragState, clientX, targetScroll);
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
        }
      }

      autoScrollFrameRef.current = requestAnimationFrame(autoScrollLoop);
    };

    autoScrollFrameRef.current = requestAnimationFrame(autoScrollLoop);

    const handleMouseUp = async () => {
      if (autoScrollFrameRef.current) {
        cancelAnimationFrame(autoScrollFrameRef.current);
        autoScrollFrameRef.current = null;
      }
      lastMousePosRef.current = null;

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

      // 드래그 상태 해제
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
      } catch (err: any) {
        console.error('Failed to update issue schedule:', err);
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
      if (autoScrollFrameRef.current) {
        cancelAnimationFrame(autoScrollFrameRef.current);
        autoScrollFrameRef.current = null;
      }
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState, dayWidth, loadProjectData, getDescendantIssueIds, issues, liveDateMap, updateDatesFromMouseAndScroll, setIssues, setUpdatingIssueId, setErrorMessage, ganttBodyRef, ganttHeaderRef]);

  return {
    dragState,
    setDragState,
    liveDateMap,
    handleMouseDownOnBar,
    getDescendantIssueIds,
  };
};