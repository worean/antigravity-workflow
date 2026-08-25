// -*- coding: utf-8 -*-
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import type { Project, Sprint, Issue } from '../types';
import { getProjects, getSprints, getIssues, updateIssue } from '../services/api';
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
} from 'lucide-react';
import { Button, Spinner, StatusBadge, Avatar } from '../components/common';
import { formatDateOnly, parseLocalDate, addDays, diffDays, getWeekNumber } from '../utils/dateUtils';

interface WBSPageProps {
  onSelectIssue?: (issue: Issue) => void;
}

interface WBSItem {
  issue: Issue;
  depth: number;
  hasChildren: boolean;
  startDate: Date | null;
  endDate: Date | null;
  isParent: boolean;
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

export const WBSPage: React.FC<WBSPageProps> = ({ onSelectIssue }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [selectedSprintId, setSelectedSprintId] = useState<number | 'ALL'>('ALL');
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [issuesLoading, setIssuesLoading] = useState<boolean>(false);

  // Preference: isSundayStart (default: true)
  const isSundayStart = useMemo<boolean>(() => {
    const saved = localStorage.getItem('pref_is_sunday_start');
    return saved !== null ? saved === 'true' : true;
  }, []);

  // Collapse / Expand State (Set of collapsed issue IDs)
  const [collapsedIds, setCollapsedIds] = useState<Set<number>>(new Set());

  // Zoom & Scale State (dayWidth: 6px ~ 72px)
  const [dayWidth, setDayWidth] = useState<number>(36);

  // Drag & Drop / Resize State
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [updatingIssueId, setUpdatingIssueId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
  const loadProjectData = useCallback(async () => {
    if (!selectedProjectId) return;
    setIssuesLoading(true);
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
      setIssuesLoading(false);
    }
  }, [selectedProjectId, selectedSprintId]);

  useEffect(() => {
    loadProjectData();
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

    // Flatten tree respecting collapsedIds
    const flatList: WBSItem[] = [];
    let minDate: Date | null = null;
    let maxDate: Date | null = null;

    const traverse = (iss: Issue, depth: number, isHiddenByParent: boolean) => {
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
        });
      }

      const isCollapsed = collapsedIds.has(iss.id);
      const hideNext = isHiddenByParent || isCollapsed;

      children.forEach((child) => {
        traverse(child, depth + 1, hideNext);
      });
    };

    rootIssues.forEach((root) => traverse(root, 0, false));

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
      setIssues((prev) =>
        prev.map((item) =>
          item.id === iss.id
            ? { ...item, plannedStartDate: startDateStr, dueDate: dueDateStr }
            : item
        )
      );
    } catch (err: any) {
      console.error('Failed to quick schedule issue:', err);
      setErrorMessage(err.response?.data?.error || '일정 설정에 실패했습니다.');
    } finally {
      setUpdatingIssueId(null);
    }
  };

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
      setDragState(null);
      if (!current) return;

      const newStartStr = formatDateOnly(current.currentStartDate);
      const newDueStr = formatDateOnly(current.currentDueDate);
      const origStartStr = formatDateOnly(current.originalStartDate);
      const origDueStr = formatDateOnly(current.originalDueDate);

      if (newStartStr === origStartStr && newDueStr === origDueStr) {
        return;
      }

      setUpdatingIssueId(current.issueId);
      try {
        await updateIssue(current.issueId, {
          plannedStartDate: newStartStr,
          dueDate: newDueStr,
        });
        setIssues((prev) =>
          prev.map((item) =>
            item.id === current.issueId
              ? { ...item, plannedStartDate: newStartStr, dueDate: newDueStr }
              : item
          )
        );
      } catch (err: any) {
        console.error('Failed to update issue schedule:', err);
        setErrorMessage(err.response?.data?.error || '일정 수정에 실패하여 원위치로 롤백합니다.');
        loadProjectData();
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
  }, [dragState, dayWidth, loadProjectData]);

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
      {loading || issuesLoading ? (
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
          {/* Global Updating Overlay */}
          {updatingIssueId && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.35)',
                zIndex: 50,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                color: '#fff',
                fontSize: '0.85rem',
                backdropFilter: 'blur(1px)',
              }}
            >
              <Loader2 size={18} className="animate-spin" color="var(--primary)" />
              <span>일정 동기화 중...</span>
            </div>
          )}
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
              }}
            >
              {flatWBSItems.map((item) => {
                const iss = item.issue;
                const isCollapsed = collapsedIds.has(iss.id);

                return (
                  <div
                    key={iss.id}
                    onClick={() => onSelectIssue && onSelectIssue(iss)}
                    style={{
                      height: '38px',
                      display: 'flex',
                      alignItems: 'center',
                      borderBottom: '1px solid #333333',
                      fontSize: '0.74rem',
                      padding: '0 8px',
                      cursor: 'pointer',
                      background: item.isParent ? 'rgba(255,255,255,0.03)' : 'transparent',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#2a2d2e')}
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = item.isParent ? 'rgba(255,255,255,0.03)' : 'transparent')
                    }
                  >
                    {/* Title with indent and collapse arrow */}
                    <div
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        paddingLeft: `${item.depth * 16}px`,
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
                    >
                      {isToday && (
                        <div
                          style={{
                            position: 'absolute',
                            top: 0,
                            bottom: 0,
                            left: '50%',
                            width: '2px',
                            background: '#007acc',
                            zIndex: 1,
                          }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Gantt Bars Rows */}
              <div style={{ position: 'relative', zIndex: 1, width: `${timelineRange.totalDays * dayWidth}px` }}>
                {flatWBSItems.map((item) => {
                  const iss = item.issue;
                  const isBeingDragged = dragState?.issueId === iss.id;

                  let curStart = isBeingDragged ? dragState.currentStartDate : item.startDate;
                  let curEnd = isBeingDragged ? dragState.currentDueDate : item.endDate;

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
                            height: item.isParent ? '12px' : '22px',
                            borderRadius: item.isParent ? '2px' : '4px',
                            background: item.isParent
                              ? '#3a3d41'
                              : isBeingDragged
                              ? '#0284c7'
                              : '#007acc',
                            border: item.isParent
                              ? '1px solid #555'
                              : isBeingDragged
                              ? '1.5px solid #38bdf8'
                              : '1px solid #1f8ad2',
                            boxShadow: isBeingDragged ? '0 4px 12px rgba(0,122,204,0.5)' : '0 2px 4px rgba(0,0,0,0.25)',
                            display: 'flex',
                            alignItems: 'center',
                            userSelect: 'none',
                            cursor: item.isParent ? 'default' : 'grab',
                            transition: isBeingDragged ? 'none' : 'box-shadow 0.15s',
                          }}
                          onMouseDown={(e) => {
                            if (!item.isParent && curStart && curEnd) {
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

                          {/* Progress Fill Bar */}
                          <div
                            style={{
                              width: `${prog}%`,
                              height: '100%',
                              background: item.isParent ? '#89d185' : '#10b981',
                              opacity: 0.85,
                              borderRadius: item.isParent ? '1px' : '3px 0 0 3px',
                              pointerEvents: 'none',
                            }}
                          />

                          {/* Label on Bar */}
                          {barWidth > 32 && (
                            <span
                              style={{
                                position: 'absolute',
                                left: '8px',
                                fontSize: '0.62rem',
                                color: '#ffffff',
                                fontWeight: 600,
                                whiteSpace: 'nowrap',
                                textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                                pointerEvents: 'none',
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
                                color: '#38bdf8',
                                border: '1px solid #0284c7',
                                padding: '2px 6px',
                                borderRadius: '3px',
                                fontSize: '0.65rem',
                                fontWeight: 600,
                                whiteSpace: 'nowrap',
                                zIndex: 30,
                                pointerEvents: 'none',
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
