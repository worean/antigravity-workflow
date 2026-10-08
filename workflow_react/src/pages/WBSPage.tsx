import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { Issue } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { Spinner } from '@/components/common';
import { AlertCircle } from 'lucide-react';
import { diffDays } from '@/utils/dateUtils';
import {
  buildWBSTree,
  generateTimelineHeaders,
  computeTodayMarker,
  computeSprintDueLines,
} from '@/utils/wbsUtils';
import { useWBSProjectData } from '@/hooks/useWBSProjectData';
import { useWBSGanttDrag } from '@/hooks/useWBSGanttDrag';
import { WBSToolbar, WBSMainSplitView, WBSColorConfigModal } from '@/components/wbs';
import { IssueDetailDrawer } from '@/components/issueDetail/IssueDetailDrawer';
import { usePrefStore } from '@/stores/usePrefStore';
import { useUIStore } from '@/stores/useUIStore';

interface WBSPageProps {
  selectedProjectId?: number | null;
  onFilterChange?: (projectId: number | null) => void;
  onSelectIssue?: (issue: Issue) => void;
  onOpenAuth?: () => void;
  refreshKey?: number;
}

export const WBSPage: React.FC<WBSPageProps> = ({
  selectedProjectId: initialProjectId = null,
  onFilterChange,
  onSelectIssue,
  onOpenAuth,
  refreshKey,
}) => {
  const { isAuthenticated } = useAuth();

  // Scroll Sync Refs
  const tableBodyRef = useRef<HTMLDivElement>(null);
  const ganttBodyRef = useRef<HTMLDivElement>(null);
  const ganttHeaderRef = useRef<HTMLDivElement>(null);

  // WBS Local Issue Detail Drawer State (독립 오버레이 슬라이드)
  const [selectedDrawerIssueId, setSelectedDrawerIssueId] = useState<number | null>(null);

  // Preference: isSundayStart & WBS Color Config (Zustand 실시간 반응형 구독)
  const isSundayStart = usePrefStore((s) => s.isSundayStart);
  const wbsColorMode = usePrefStore((s) => s.wbsColorMode);
  const wbsDefaultTheme = usePrefStore((s) => s.wbsDefaultTheme);
  const wbsRootColorMap = usePrefStore((s) => s.wbsRootColorMap);

  // WBS Color Config Modal State
  const [isColorModalOpen, setIsColorModalOpen] = useState<boolean>(false);

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

  // Global Issue Modal Trigger for Sub-Issue & Root-Issue Creation
  const openIssueModal = useUIStore((s) => s.openIssueModal);
  const closeIssueDetail = useUIStore((s) => s.closeIssueDetail);

  // WBS 페이지를 벗어날 때 열려있던 드로어 상태 확실히 정리
  useEffect(() => {
    return () => {
      setSelectedDrawerIssueId(null);
      closeIssueDetail();
    };
  }, [closeIssueDetail]);

  // External refresh trigger (e.g. issue created/updated globally)
  useEffect(() => {
    if (refreshKey) {
      loadProjectData(false);
    }
  }, [refreshKey, loadProjectData]);

  // 최상위 일감(루트 이슈) 신규 생성 핸들러 (해당 프로젝트 내에서)
  const handleAddNewRootIssue = () => {
    openIssueModal(selectedProjectId || undefined, null, null);
  };

  // 하위 이슈 생성 핸들러 (특정 부모 이슈의 속성 및 4개 기간 자동 세팅)
  const handleAddSubIssue = (parentIssue: Issue) => {
    // 부모 이슈가 접혀 있다면 펼쳐서 나중에 생성된 하위 이슈가 보이도록 함
    if (collapsedIds.has(parentIssue.id)) {
      setCollapsedIds((prev) => {
        const next = new Set(prev);
        next.delete(parentIssue.id);
        return next;
      });
    }
    openIssueModal(parentIssue.projectId, parentIssue, parentIssue.id);
  };

  // 최상위 일감(루트 이슈) 목록 (색상 설정 모달용)
  const rootIssues = useMemo(() => issues.filter((iss) => !iss.parentId), [issues]);

  // 2. Build Tree & Compute Dates
  const { flatWBSItems, timelineRange } = useMemo(() => {
    return buildWBSTree(issues, collapsedIds, null, {
      mode: wbsColorMode,
      defaultTheme: wbsDefaultTheme,
      rootColorMap: wbsRootColorMap,
    });
  }, [issues, collapsedIds, wbsColorMode, wbsDefaultTheme, wbsRootColorMap]);

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

  // Sprint Due Lines & Today Marker Line
  const sprintDueLines = useMemo(() => {
    return computeSprintDueLines(sprints, timelineRange.start, timelineRange.totalDays, dayWidth);
  }, [sprints, timelineRange.start, timelineRange.totalDays, dayWidth]);

  const todayMarker = useMemo(() => {
    return computeTodayMarker(timelineRange.start, timelineRange.totalDays, dayWidth);
  }, [timelineRange.start, timelineRange.totalDays, dayWidth]);

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
        isAuthenticated={isAuthenticated}
        onOpenAuth={onOpenAuth}
        isBackgroundSyncing={isBackgroundSyncing}
        updatingIssueId={updatingIssueId}
        onAddNewRootIssue={handleAddNewRootIssue}
        onOpenColorModal={() => setIsColorModalOpen(true)}
      />

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
      {!isAuthenticated ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '320px', gap: '12px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>간트 차트와 WBS 일정을 확인하려면 로그인이 필요합니다.</div>
          {onOpenAuth && (
            <button type="button" onClick={onOpenAuth} className="btn btn-primary" style={{ padding: '6px 14px' }}>
              로그인하기
            </button>
          )}
        </div>
      ) : (loading && projects.length === 0) || (issuesLoading && issues.length === 0) || (isInitialLoading && issues.length === 0) ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
          <Spinner centered label="간트차트 및 일정 데이터를 불러오는 중..." />
        </div>
      ) : projects.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          등록된 프로젝트가 없습니다. 먼저 상단에서 새 프로젝트를 생성해 주세요.
        </div>
      ) : issues.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          <p style={{ marginBottom: '14px' }}>선택된 프로젝트/스프린트에 등록된 일감(이슈)이 없습니다.</p>
          <button
            type="button"
            onClick={handleAddNewRootIssue}
            className="btn btn-primary"
            style={{ padding: '6px 16px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            ➕ 첫 번째 일감(최상위 이슈) 추가하기
          </button>
        </div>
      ) : (
        <WBSMainSplitView
          items={flatWBSItems}
          issues={issues}
          setIssues={setIssues}
          collapsedIds={collapsedIds}
          onToggleCollapse={toggleCollapse}
          setCollapsedIds={setCollapsedIds}
          onSelectIssue={(iss) => {
            setSelectedDrawerIssueId(iss.id);
            if (onSelectIssue) onSelectIssue(iss);
          }}
          onAddSubIssue={handleAddSubIssue}
          onAddNewRootIssue={handleAddNewRootIssue}
          tableBodyRef={tableBodyRef}
          onTableScroll={handleTableScroll}
          leftWidth={leftWidth}
          updatingIssueId={updatingIssueId}
          getDescendantIssueIds={getDescendantIssueIds}
          setUpdatingIssueId={setUpdatingIssueId}
          setErrorMessage={setErrorMessage}
          loadProjectData={loadProjectData}
          timelineRange={timelineRange}
          topHeaders={topHeaders}
          bottomHeaders={bottomHeaders}
          dayWidth={dayWidth}
          dragState={dragState}
          liveDateMap={liveDateMap}
          todayMarker={todayMarker}
          sprintDueLines={sprintDueLines}
          ganttHeaderRef={ganttHeaderRef}
          ganttBodyRef={ganttBodyRef}
          onGanttScroll={handleGanttScroll}
          onMouseDownOnBar={handleMouseDownOnBar}
        />
      )}

      {/* WBS Slide-over Issue Detail Drawer (독립 우측 슬라이드 오버레이) */}
      <IssueDetailDrawer
        isOpen={!!selectedDrawerIssueId}
        issueId={selectedDrawerIssueId}
        projectId={selectedProjectId}
        onClose={() => {
          setSelectedDrawerIssueId(null);
          closeIssueDetail();
        }}
        onIssueUpdated={() => loadProjectData(false)}
        onOpenAuth={onOpenAuth}
      />

      {/* WBS Color Config Modal (Portal Modal) */}
      <WBSColorConfigModal
        isOpen={isColorModalOpen}
        onClose={() => setIsColorModalOpen(false)}
        rootIssues={rootIssues}
      />
    </div>
  );
};