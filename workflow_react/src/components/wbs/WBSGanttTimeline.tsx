// -*- coding: utf-8 -*-
import React, { type RefObject } from 'react';
import type { Issue } from '@/types';
import type { WBSItem, DragState, TimelineRange, TopHeader, BottomHeaders, SprintDueLine } from '@/types/wbs';
import { WBSGanttHeader } from './WBSGanttHeader';
import { WBSGanttBar } from './WBSGanttBar';
import { updateIssue } from '@/services/api';
import { formatDateOnly, addDays } from '@/utils/dateUtils';

interface WBSGanttTimelineProps {
  items: WBSItem[];
  timelineRange: TimelineRange;
  topHeaders: TopHeader[];
  bottomHeaders: BottomHeaders;
  dayWidth: number;
  dragState: DragState | null;
  updatingIssueId: number | null;
  liveDateMap: Map<number, { start: Date | null; end: Date | null; isAffected: boolean }>;
  todayMarker: { date: Date; dayIndex: number; leftPos: number; formattedDate: string } | null;
  sprintDueLines: SprintDueLine[];
  ganttHeaderRef: RefObject<HTMLDivElement | null>;
  ganttBodyRef: RefObject<HTMLDivElement | null>;
  onScroll: (e: React.UIEvent<HTMLDivElement>) => void;
  getDescendantIssueIds: (parentIssueId: number) => Set<number>;
  onMouseDownOnBar: (
    e: React.MouseEvent,
    iss: Issue,
    type: 'move' | 'resize-left' | 'resize-right',
    startDate: Date,
    endDate: Date
  ) => void;
  onSelectIssue?: (issue: Issue) => void;
  setUpdatingIssueId: (id: number | null) => void;
  setErrorMessage: (msg: string | null) => void;
  loadProjectData: () => Promise<void>;
}

export const WBSGanttTimeline: React.FC<WBSGanttTimelineProps> = ({
  items,
  timelineRange,
  topHeaders,
  bottomHeaders,
  dayWidth,
  dragState,
  updatingIssueId,
  liveDateMap,
  todayMarker,
  sprintDueLines,
  ganttHeaderRef,
  ganttBodyRef,
  onScroll,
  getDescendantIssueIds,
  onMouseDownOnBar,
  onSelectIssue,
  setUpdatingIssueId,
  setErrorMessage,
  loadProjectData,
}) => {
  // Quick Schedule on Empty Timeline Click (미등록 이슈 일정 1주일 설정)
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

  // Timeline Marker Line Rendering Helper Function
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
      <WBSGanttHeader
        topHeaders={topHeaders}
        bottomHeaders={bottomHeaders}
        dayWidth={dayWidth}
        ganttHeaderRef={ganttHeaderRef}
      />

      {/* Timeline Body (Gantt Rows & Bars) */}
      <div
        ref={ganttBodyRef}
        onScroll={onScroll}
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
            height: `${items.length * 38}px`,
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

        {/* Gantt Bars Rows */}
        <div style={{ position: 'relative', zIndex: 1, width: `${timelineRange.totalDays * dayWidth}px` }}>
          {items.map((item) => {
            const live = liveDateMap.get(item.issue.id);
            return (
              <WBSGanttBar
                key={item.issue.id}
                item={item}
                timelineStart={timelineRange.start}
                dayWidth={dayWidth}
                dragState={dragState}
                liveStart={live?.start}
                liveEnd={live?.end}
                getDescendantIssueIds={getDescendantIssueIds}
                onMouseDownOnBar={onMouseDownOnBar}
                onSelectIssue={onSelectIssue}
                onTimelineRowClick={handleTimelineRowClick}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};