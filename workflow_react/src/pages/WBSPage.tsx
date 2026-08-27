// -*- coding: utf-8 -*-
import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { Issue } from '../types';
import { useAuth } from '../context/AuthContext';
import { Button, Spinner } from '../components/common';
import { AlertCircle, LogIn } from 'lucide-react';
import { diffDays } from '../utils/dateUtils';
import { buildWBSTree, generateTimelineHeaders } from '../utils/wbsUtils';
import { useWBSProjectData } from '../hooks/useWBSProjectData';
import { useWBSGanttDrag } from '../hooks/useWBSGanttDrag';
import { WBSToolbar, WBSTreeTable, WBSGanttTimeline } from '../components/wbs';

interface WBSPageProps {
  selectedProjectId?: number | null;
  onFilterChange?: (projectId: number | null) => void;
  onSelectIssue?: (issue: Issue) => void;
  onOpenAuth?: () => void;
}

export const WBSPage: React.FC<WBSPageProps> = ({
  selectedProjectId: initialProjectId = null,
  onFilterChange,
  onSelectIssue,
  onOpenAuth,
}) => {
  const { isAuthenticated } = useAuth();

  // Scroll Sync Refs
  const tableBodyRef = useRef<HTMLDivElement>(null);
  const ganttBodyRef = useRef<HTMLDivElement>(null);
  const ganttHeaderRef = useRef<HTMLDivElement>(null);

  // Preference: isSundayStart (default: true)
  const isSundayStart = useMemo<boolean>(() => {
    const saved = localStorage.getItem('pref_is_sunday_start');
    return saved !== null ? saved === 'true' : true;
  }, []);

  // Collapse / Expand State (Set of collapsed parent issue IDs)
  const [collapsedIds, setCollapsedIds] = useState<Set<number>>(new Set());

  // Zoom & Scale State (dayWidth: 6px ~ 72px)
  const [dayWidth, setDayWidth] = useState<number>(36);

  // Left table width
  const leftWidth = 440;

  // 1. Data Fetching & Project State Hook
  const {
    projects,
    selectedProjectId,
    setSelectedProjectId,
    sprints,
    selectedSprintId,
    setSelectedSprintId,
    issues,
    setIssues,
    loading,
    issuesLoading,
    isInitialLoading,
    isBackgroundSyncing,
    updatingIssueId,
    setUpdatingIssueId,
    errorMessage,
    setErrorMessage,
    loadProjectData,
  } = useWBSProjectData({
    initialProjectId,
    tableBodyRef,
    ganttBodyRef,
    onFilterChange,
  });

  // 2. Build Tree & Compute Dates
  const { flatWBSItems, timelineRange } = useMemo(() => {
    return buildWBSTree(issues, collapsedIds);
  }, [issues, collapsedIds]);

  // 3. Gantt Drag & Drop, Resize & Edge Zone Auto-Scroll Hook
  const {
    dragState,
    liveDateMap,
    handleMouseDownOnBar,
    getDescendantIssueIds,
  } = useWBSGanttDrag({
    issues,
    setIssues,
    dayWidth,
    updatingIssueId,
    setUpdatingIssueId,
    setErrorMessage,
    loadProjectData,
    ganttBodyRef,
    ganttHeaderRef,
  });

  // 4. View Scale Mode & Headers
  const currentViewScale = useMemo<'day' | 'week' | 'month'>(() => {
    if (dayWidth >= 28) return 'day';
    if (dayWidth >= 14) return 'week';
    return 'month';
  }, [dayWidth]);

  const { topHeaders, bottomHeaders } = useMemo(() => {
    return generateTimelineHeaders(timelineRange, currentViewScale, isSundayStart);
  }, [timelineRange, currentViewScale, isSundayStart]);

  // 5. Wheel Zoom Listener on Gantt Body
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

  // Quick Zoom Controls
  const setScalePreset = (preset: 'day' | 'week' | 'month') => {
    if (preset === 'day') setDayWidth(36);
    else if (preset === 'week') setDayWidth(18);
    else setDayWidth(8);
  };

  const handleZoomIn = () => setDayWidth((prev) => Math.min(72, prev + 6));
  const handleZoomOut = () => setDayWidth((prev) => Math.max(6, prev - 6));

  // Collapse / Expand Controls
  const toggleCollapse = (id: number) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleExpandAll = () => setCollapsedIds(new Set());

  const handleCollapseAll = () => {
    const parentIds = new Set<number>();
    issues.forEach((iss) => {
      if (iss.parentId) parentIds.add(iss.parentId);
    });
    setCollapsedIds(parentIds);
  };

  // Scroll Synchronization
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '8px', overflow: 'hidden' }}>
      {/* Top Filter & Toolbar */}
      <WBSToolbar
        projects={projects}
        selectedProjectId={selectedProjectId}
        onSelectProject={(pId) => {
          setSelectedProjectId(pId);
          if (onFilterChange) onFilterChange(pId);
        }}
        sprints={sprints}
        selectedSprintId={selectedSprintId}
        onSelectSprint={setSelectedSprintId}
        dayWidth={dayWidth}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onSetScalePreset={setScalePreset}
        currentViewScale={currentViewScale}
        onExpandAll={handleExpandAll}
        onCollapseAll={handleCollapseAll}
        onScrollToToday={handleScrollToToday}
        isBackgroundSyncing={isBackgroundSyncing}
        totalIssuesCount={issues.length}
      />

      {/* Guest Mode Notice */}
      {!isAuthenticated && (
        <div
          style={{
            background: 'rgba(0, 122, 204, 0.12)',
            border: '1px solid rgba(0, 122, 204, 0.3)',
            borderRadius: 'var(--radius-xs)',
            padding: '6px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.72rem',
            color: '#9cdcfe',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <LogIn size={13} />
            <span>현재 게스트(읽기 전용) 모드입니다. WBS 일정을 드래그하여 수정하거나 관리하려면 로그인하세요.</span>
          </div>
          {onOpenAuth && (
            <Button variant="primary" size="sm" onClick={onOpenAuth} style={{ height: '22px', fontSize: '0.68rem', padding: '0 8px' }}>
              로그인
            </Button>
          )}
        </div>
      )}

      {/* Error Message Toast */}
      {errorMessage && (
        <div
          style={{
            background: 'rgba(241, 76, 76, 0.15)',
            border: '1px solid #f14c4c',
            borderRadius: 'var(--radius-xs)',
            padding: '6px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.72rem',
            color: '#f14c4c',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertCircle size={13} />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            style={{ background: 'none', border: 'none', color: '#f14c4c', cursor: 'pointer', fontSize: '0.8rem' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Split Layout: Left Tree + Right Timeline */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-xs)',
          background: 'var(--bg-panel)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {loading || (issuesLoading && isInitialLoading) ? (
          <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Spinner size={32} label="WBS 일정 데이터 불러오는 중..." />
          </div>
        ) : flatWBSItems.length === 0 ? (
          <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '8px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <span>등록된 작업(이슈)이 없습니다.</span>
            <span style={{ fontSize: '0.75rem' }}>이슈 관리 페이지에서 새 이슈를 생성해 보세요.</span>
          </div>
        ) : (
          <>
            {/* Left Tree Hierarchy Table */}
            <WBSTreeTable
              items={flatWBSItems}
              issues={issues}
              setIssues={setIssues}
              collapsedIds={collapsedIds}
              onToggleCollapse={toggleCollapse}
              setCollapsedIds={setCollapsedIds}
              onSelectIssue={onSelectIssue}
              tableBodyRef={tableBodyRef}
              onScroll={handleTableScroll}
              leftWidth={leftWidth}
              getDescendantIssueIds={getDescendantIssueIds}
              setUpdatingIssueId={setUpdatingIssueId}
              setErrorMessage={setErrorMessage}
              loadProjectData={loadProjectData}
            />

            {/* Right Gantt Timeline Grid & Bars */}
            <WBSGanttTimeline
              items={flatWBSItems}
              timelineRange={timelineRange}
              topHeaders={topHeaders}
              bottomHeaders={bottomHeaders}
              dayWidth={dayWidth}
              dragState={dragState}
              updatingIssueId={updatingIssueId}
              liveDateMap={liveDateMap}
              ganttHeaderRef={ganttHeaderRef}
              ganttBodyRef={ganttBodyRef}
              onScroll={handleGanttScroll}
              getDescendantIssueIds={getDescendantIssueIds}
              onMouseDownOnBar={handleMouseDownOnBar}
              onSelectIssue={onSelectIssue}
              setUpdatingIssueId={setUpdatingIssueId}
              setErrorMessage={setErrorMessage}
              loadProjectData={loadProjectData}
            />
          </>
        )}
      </div>
    </div>
  );
};