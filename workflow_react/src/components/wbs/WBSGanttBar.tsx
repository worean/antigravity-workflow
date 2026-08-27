// -*- coding: utf-8 -*-
import React from 'react';
import type { Issue } from '../../types';
import type { WBSItem, DragState } from '../../types/wbs';
import { formatDateOnly, diffDays } from '../../utils/dateUtils';

interface WBSGanttBarProps {
  item: WBSItem;
  startDate: Date;
  endDate: Date;
  timelineStart: Date;
  dayWidth: number;
  dragState: DragState | null;
  updatingIssueId: number | null;
  getDescendantIssueIds: (parentIssueId: number) => Set<number>;
  onMouseDownOnBar: (
    e: React.MouseEvent,
    iss: Issue,
    type: 'move' | 'resize-left' | 'resize-right',
    startDate: Date,
    endDate: Date
  ) => void;
  onSelectIssue?: (issue: Issue) => void;
}

export const WBSGanttBar: React.FC<WBSGanttBarProps> = ({
  item,
  startDate,
  endDate,
  timelineStart,
  dayWidth,
  dragState,
  updatingIssueId,
  getDescendantIssueIds,
  onMouseDownOnBar,
  onSelectIssue,
}) => {
  const iss = item.issue;
  const isUpdating = updatingIssueId === iss.id;

  const startOffsetDays = diffDays(startDate, timelineStart);
  const durationDays = Math.max(1, diffDays(endDate, startDate) + 1);

  const barLeft = startOffsetDays * dayWidth;
  const barWidth = durationDays * dayWidth;

  const isBeingDragged = dragState?.issueId === iss.id;
  const isAncestorBeingDragged =
    dragState && !isBeingDragged
      ? getDescendantIssueIds(dragState.issueId).has(iss.id)
      : false;

  const colorTheme = item.color;

  // 상위 이슈 (Parent Summary Bracket Bar)
  if (item.isParent) {
    const isParentDragged = isBeingDragged || isAncestorBeingDragged;
    return (
      <div
        onMouseDown={(e) => onMouseDownOnBar(e, iss, 'move', startDate, endDate)}
        onClick={(e) => {
          e.stopPropagation();
          if (onSelectIssue) onSelectIssue(iss);
        }}
        style={{
          position: 'absolute',
          left: `${barLeft}px`,
          width: `${barWidth}px`,
          top: '9px',
          height: '20px',
          cursor: isParentDragged ? 'grabbing' : 'grab',
          zIndex: isParentDragged ? 10 : 2,
          opacity: isUpdating ? 0.6 : 1,
          transition: isParentDragged ? 'none' : 'left 0.15s, width 0.15s',
          userSelect: 'none',
        }}
        title={`[상위 그룹] ${iss.title} (${formatDateOnly(startDate)} ~ ${formatDateOnly(endDate)})`}
      >
        {/* Top Summary Bar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '7px',
            background: isParentDragged ? colorTheme.dragBase : colorTheme.parentBase,
            border: `1px solid ${isParentDragged ? colorTheme.dragBorder : colorTheme.parentBorder}`,
            borderRadius: '3px 3px 0 0',
            boxShadow: isParentDragged ? `0 0 8px ${colorTheme.border}` : '0 1px 3px rgba(0,0,0,0.3)',
          }}
        />

        {/* Left End Bracket Triangle */}
        <div
          style={{
            position: 'absolute',
            top: '7px',
            left: 0,
            width: 0,
            height: 0,
            borderLeft: '5px solid transparent',
            borderRight: '5px solid transparent',
            borderTop: `6px solid ${isParentDragged ? colorTheme.dragBase : colorTheme.parentBase}`,
          }}
        />

        {/* Right End Bracket Triangle */}
        <div
          style={{
            position: 'absolute',
            top: '7px',
            right: 0,
            width: 0,
            height: 0,
            borderLeft: '5px solid transparent',
            borderRight: '5px solid transparent',
            borderTop: `6px solid ${isParentDragged ? colorTheme.dragBase : colorTheme.parentBase}`,
          }}
        />

        {/* Text Label next to Summary Bar */}
        <span
          style={{
            position: 'absolute',
            left: `${barWidth + 6}px`,
            top: '2px',
            fontSize: '0.68rem',
            fontWeight: 600,
            color: colorTheme.progress,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            textShadow: '0 1px 2px rgba(0,0,0,0.8)',
          }}
        >
          {iss.title}
        </span>
      </div>
    );
  }

  // 하위 리프 이슈 (Leaf Task Bar)
  const isLeafDragged = isBeingDragged || isAncestorBeingDragged;
  const progressPct = iss.progress !== undefined && iss.progress !== null ? iss.progress : 0;

  return (
    <div
      onMouseDown={(e) => onMouseDownOnBar(e, iss, 'move', startDate, endDate)}
      onClick={(e) => {
        e.stopPropagation();
        if (onSelectIssue) onSelectIssue(iss);
      }}
      style={{
        position: 'absolute',
        left: `${barLeft}px`,
        width: `${barWidth}px`,
        top: '6px',
        height: '24px',
        background: isLeafDragged ? colorTheme.dragBase : colorTheme.bgEmpty,
        border: `1px solid ${isLeafDragged ? colorTheme.dragBorder : colorTheme.border}`,
        borderRadius: 'var(--radius-xs)',
        cursor: isLeafDragged ? 'grabbing' : 'grab',
        zIndex: isLeafDragged ? 10 : 2,
        opacity: isUpdating ? 0.6 : 1,
        transition: isLeafDragged ? 'none' : 'left 0.15s, width 0.15s',
        display: 'flex',
        alignItems: 'center',
        boxShadow: isLeafDragged ? `0 0 10px ${colorTheme.border}` : '0 1px 3px rgba(0,0,0,0.2)',
        overflow: 'visible',
        userSelect: 'none',
      }}
      className="gantt-task-bar"
    >
      {/* Left Resize Handle */}
      <div
        onMouseDown={(e) => onMouseDownOnBar(e, iss, 'resize-left', startDate, endDate)}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: '6px',
          cursor: 'ew-resize',
          zIndex: 3,
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: 'var(--radius-xs) 0 0 var(--radius-xs)',
        }}
        title="시작일 조절"
      />

      {/* Progress Fill Bar */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: `${progressPct}%`,
          background: isLeafDragged ? colorTheme.dragBorder : colorTheme.progress,
          borderRadius: progressPct === 100 ? 'var(--radius-xs)' : 'var(--radius-xs) 0 0 var(--radius-xs)',
          opacity: 0.85,
          pointerEvents: 'none',
        }}
      />

      {/* Label on Bar */}
      <div
        style={{
          position: 'absolute',
          left: '8px',
          right: '8px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: '#ffffff',
          fontSize: '0.68rem',
          fontWeight: 500,
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          textShadow: '0 1px 2px rgba(0,0,0,0.8)',
          zIndex: 1,
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{iss.title}</span>
        {barWidth >= 50 && <span>{progressPct}%</span>}
      </div>

      {/* Right Resize Handle */}
      <div
        onMouseDown={(e) => onMouseDownOnBar(e, iss, 'resize-right', startDate, endDate)}
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: '6px',
          cursor: 'ew-resize',
          zIndex: 3,
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '0 var(--radius-xs) var(--radius-xs) 0',
        }}
        title="기한(종료일) 조절"
      />
    </div>
  );
};