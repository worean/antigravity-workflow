// -*- coding: utf-8 -*-
import React, { type RefObject } from 'react';
import type { Issue } from '../../types';
import type { WBSItem, DragState, TimelineRange, TopHeader, BottomHeaders, SprintDueLine } from '../../types/wbs';
import { WBSTreeTable } from './WBSTreeTable';
import { WBSGanttTimeline } from './WBSGanttTimeline';

interface WBSMainSplitViewProps {
  items: WBSItem[];
  issues: Issue[];
  setIssues: React.Dispatch<React.SetStateAction<Issue[]>>;
  collapsedIds: Set<number>;
  onToggleCollapse: (issueId: number) => void;
  setCollapsedIds: React.Dispatch<React.SetStateAction<Set<number>>>;
  onSelectIssue?: (issue: Issue) => void;
  tableBodyRef: RefObject<HTMLDivElement | null>;
  onTableScroll: (e: React.UIEvent<HTMLDivElement>) => void;
  leftWidth?: number;
  updatingIssueId: number | null;
  getDescendantIssueIds: (parentIssueId: number) => Set<number>;
  setUpdatingIssueId: (id: number | null) => void;
  setErrorMessage: (msg: string | null) => void;
  loadProjectData: () => Promise<void>;

  timelineRange: TimelineRange;
  topHeaders: TopHeader[];
  bottomHeaders: BottomHeaders;
  dayWidth: number;
  dragState: DragState | null;
  liveDateMap: Map<number, { start: Date | null; end: Date | null; isAffected: boolean }>;
  todayMarker: { date: Date; dayIndex: number; leftPos: number; formattedDate: string } | null;
  sprintDueLines: SprintDueLine[];
  ganttHeaderRef: RefObject<HTMLDivElement | null>;
  ganttBodyRef: RefObject<HTMLDivElement | null>;
  onGanttScroll: (e: React.UIEvent<HTMLDivElement>) => void;
  onMouseDownOnBar: (
    e: React.MouseEvent,
    iss: Issue,
    type: 'move' | 'resize-left' | 'resize-right',
    startDate: Date,
    endDate: Date
  ) => void;
}

export const WBSMainSplitView: React.FC<WBSMainSplitViewProps> = ({
  items,
  issues,
  setIssues,
  collapsedIds,
  onToggleCollapse,
  setCollapsedIds,
  onSelectIssue,
  tableBodyRef,
  onTableScroll,
  leftWidth = 440,
  updatingIssueId,
  getDescendantIssueIds,
  setUpdatingIssueId,
  setErrorMessage,
  loadProjectData,

  timelineRange,
  topHeaders,
  bottomHeaders,
  dayWidth,
  dragState,
  liveDateMap,
  todayMarker,
  sprintDueLines,
  ganttHeaderRef,
  ganttBodyRef,
  onGanttScroll,
  onMouseDownOnBar,
}) => {
  return (
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
      {/* 1. Left Fixed Tree Table View */}
      <WBSTreeTable
        items={items}
        issues={issues}
        setIssues={setIssues}
        collapsedIds={collapsedIds}
        onToggleCollapse={onToggleCollapse}
        setCollapsedIds={setCollapsedIds}
        onSelectIssue={onSelectIssue}
        tableBodyRef={tableBodyRef}
        onScroll={onTableScroll}
        leftWidth={leftWidth}
        updatingIssueId={updatingIssueId}
        getDescendantIssueIds={getDescendantIssueIds}
        setUpdatingIssueId={setUpdatingIssueId}
        setErrorMessage={setErrorMessage}
        loadProjectData={loadProjectData}
      />

      {/* 2. Right Scrollable Gantt Timeline View */}
      <WBSGanttTimeline
        items={items}
        timelineRange={timelineRange}
        topHeaders={topHeaders}
        bottomHeaders={bottomHeaders}
        dayWidth={dayWidth}
        dragState={dragState}
        updatingIssueId={updatingIssueId}
        liveDateMap={liveDateMap}
        todayMarker={todayMarker}
        sprintDueLines={sprintDueLines}
        ganttHeaderRef={ganttHeaderRef}
        ganttBodyRef={ganttBodyRef}
        onScroll={onGanttScroll}
        getDescendantIssueIds={getDescendantIssueIds}
        onMouseDownOnBar={onMouseDownOnBar}
        onSelectIssue={onSelectIssue}
        setUpdatingIssueId={setUpdatingIssueId}
        setErrorMessage={setErrorMessage}
        loadProjectData={loadProjectData}
      />
    </div>
  );
};