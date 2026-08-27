import React, { type RefObject } from 'react';
import type { Issue } from '../../types';
import type { WBSItem, DragState, TimelineRange, TopHeader, BottomHeaders } from '../../types/wbs';
import { WBSGanttHeader } from './WBSGanttHeader';
import { WBSGanttBar } from './WBSGanttBar';
import { updateIssue } from '../../services/api';
import { formatDateOnly, addDays } from '../../utils/dateUtils';

interface WBSGanttTimelineProps {
  items: WBSItem[];
  timelineRange: TimelineRange;
  topHeaders: TopHeader[];
  bottomHeaders: BottomHeaders;
  dayWidth: number;
  dragState: DragState | null;
  updatingIssueId: number | null;
  liveDateMap: Map<number, { start: Date | null; end: Date | null; isAffected: boolean }>;
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
  // Quick Schedule on Empty Timeline Click (미등록 이슈 일정 1주일 자동 설정)
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
                  background: isToday ? 'rgba(0,122,204,0.06)' : isWeekend ? 'rgba(255,255,255,0.015)' : 'transparent',
                  boxSizing: 'border-box',
                }}
              />
            );
          })}
        </div>

        {/* Rows */}
        {items.map((item) => {
          const iss = item.issue;
          const live = liveDateMap.get(iss.id);
          const effectiveStart = live ? live.start : item.startDate;
          const effectiveEnd = live ? live.end : item.endDate;

          return (
            <div
              key={iss.id}
              onClick={(e) => handleTimelineRowClick(e, iss, item.isParent)}
              style={{
                height: '38px',
                borderBottom: '1px solid #2d2d2d',
                position: 'relative',
                width: `${timelineRange.totalDays * dayWidth}px`,
                boxSizing: 'border-box',
                cursor: !item.isParent && !effectiveStart ? 'pointer' : 'default',
              }}
              title={!item.isParent && !effectiveStart ? '클릭하여 1주일 일정을 바로 생성합니다' : undefined}
            >
              {/* Render Gantt Bar if Start & End dates exist */}
              {effectiveStart && effectiveEnd ? (
                <WBSGanttBar
                  item={item}
                  startDate={effectiveStart}
                  endDate={effectiveEnd}
                  timelineStart={timelineRange.start}
                  dayWidth={dayWidth}
                  dragState={dragState}
                  updatingIssueId={updatingIssueId}
                  getDescendantIssueIds={getDescendantIssueIds}
                  onMouseDownOnBar={onMouseDownOnBar}
                  onSelectIssue={onSelectIssue}
                />
              ) : (
                !item.isParent && (
                  <div
                    style={{
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      paddingLeft: '12px',
                      color: 'var(--text-muted)',
                      fontSize: '0.68rem',
                      fontStyle: 'italic',
                      opacity: 0.5,
                      pointerEvents: 'none',
                    }}
                  >
                    + 일정 미등록 (클릭하여 1주일 자동 설정)
                  </div>
                )
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};