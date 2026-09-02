import React from 'react';
import type { Issue } from '@/types';
import type { WBSItem, DragState } from '@/types/wbs';
import { formatDateOnly, diffDays } from '@/utils/dateUtils';
import { Calendar } from 'lucide-react';

interface WBSGanttBarProps {
  item: WBSItem;
  timelineStart: Date;
  dayWidth: number;
  dragState: DragState | null;
  liveStart?: Date | null;
  liveEnd?: Date | null;
  getDescendantIssueIds: (parentIssueId: number) => Set<number>;
  onMouseDownOnBar: (
    e: React.MouseEvent,
    iss: Issue,
    type: 'move' | 'resize-left' | 'resize-right',
    startDate: Date,
    endDate: Date
  ) => void;
  onSelectIssue?: (issue: Issue) => void;
  onTimelineRowClick: (e: React.MouseEvent<HTMLDivElement>, iss: Issue, isParent: boolean) => void;
}

export const WBSGanttBar: React.FC<WBSGanttBarProps> = ({
  item,
  timelineStart,
  dayWidth,
  dragState,
  liveStart,
  liveEnd,
  getDescendantIssueIds,
  onMouseDownOnBar,
  onSelectIssue,
  onTimelineRowClick,
}) => {
  const iss = item.issue;
  const isBeingDragged = dragState?.issueId === iss.id;
  const isDescendantOfDragged =
    dragState && !isBeingDragged
      ? getDescendantIssueIds(dragState.issueId).has(iss.id)
      : false;

  const curStart = liveStart ?? item.startDate;
  const curEnd = liveEnd ?? item.endDate;

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
    const diffStartDays = diffDays(curStart, timelineStart);
    const durationDays = Math.max(1, diffDays(curEnd, curStart) + 1);
    barLeft = diffStartDays * dayWidth;
    barWidth = durationDays * dayWidth;
  }

  const mouseDownPosRef = React.useRef<{ x: number; y: number } | null>(null);

  const prog = iss.progress || 0;

  return (
    <div
      onClick={(e) => onTimelineRowClick(e, iss, item.isParent)}
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
            cursor: 'pointer',
            transition: isBeingDragged ? 'none' : 'left 0.08s ease, width 0.08s ease, box-shadow 0.15s',
            boxSizing: 'border-box',
            overflow: 'hidden',
          }}
          title={`#${iss.issueNumber || iss.id} ${iss.title} (${prog}%) - 클릭 시 상세 및 편집`}
          onMouseDown={(e) => {
            mouseDownPosRef.current = { x: e.clientX, y: e.clientY };
            if (curStart && curEnd) {
              onMouseDownOnBar(e, iss, 'move', curStart, curEnd);
            }
          }}
          onClick={(e) => {
            e.stopPropagation();
            if (mouseDownPosRef.current) {
              const dist = Math.hypot(e.clientX - mouseDownPosRef.current.x, e.clientY - mouseDownPosRef.current.y);
              mouseDownPosRef.current = null;
              if (dist > 4) {
                return;
              }
            }
            if (onSelectIssue) {
              onSelectIssue(iss);
            }
          }}
          onDoubleClick={(e) => {
            e.stopPropagation();
            if (onSelectIssue) {
              onSelectIssue(iss);
            }
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
                  onMouseDownOnBar(e, iss, 'resize-left', curStart, curEnd);
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
                  onMouseDownOnBar(e, iss, 'resize-right', curStart, curEnd);
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
            left: `${Math.max(0, diffDays(new Date(), timelineStart)) * dayWidth}px`,
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
};