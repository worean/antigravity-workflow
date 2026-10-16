import React from 'react';
import type { Issue } from '@/types';
import { parsePriorityLevel } from '@/utils/statusUtils';

export interface KanbanWidgetCardProps {
  issue: Issue;
  isDragging: boolean;
  onDragStart: (e: React.DragEvent, issue: Issue) => void;
  onDragEnd: () => void;
  onClick: (issue: Issue) => void;
}

/**
 * ⭐️ 대시보드 위젯(KanbanWidget) 전용 초슬림 카드 컴포넌트
 * - 메인 칸반보드와 동일한 우선순위 테두리 액센트 및 호버 글로우 효과 적용
 * - 출력 정보는 핵심 3가지로 압축: 1. 이슈 ID / 2. 제목 / 3. 담당자
 */
export const KanbanWidgetCard: React.FC<KanbanWidgetCardProps> = ({
  issue,
  isDragging,
  onDragStart,
  onDragEnd,
  onClick,
}) => {
  const priorityLevel = parsePriorityLevel(issue.priorityId || issue.priority);
  const isCritical = priorityLevel === 'CRITICAL';
  const isHigh = priorityLevel === 'HIGH';
  const isMedium = priorityLevel === 'MEDIUM';
  const priorityClass = isCritical
    ? 'card-priority-critical'
    : isHigh
    ? 'card-priority-high'
    : isMedium
    ? 'card-priority-medium'
    : 'card-priority-low';

  const assignee = issue.assignee;

  return (
    <div
      draggable={true}
      onDragStart={(e) => onDragStart(e, issue)}
      onDragEnd={onDragEnd}
      onClick={() => onClick(issue)}
      className={`glass-panel glass-panel-hover ${priorityClass}`}
      style={{
        position: 'relative',
        overflow: 'hidden',
        background: 'var(--bg-card)',
        border: isDragging ? '1px dashed var(--primary)' : undefined,
        borderRadius: 'var(--radius-xs)',
        padding: '6px 8px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        cursor: 'grab',
        opacity: isDragging ? 0.4 : 1,
        userSelect: 'none',
        flexShrink: 0,
        transition: 'opacity 0.15s ease, transform 0.12s ease',
      }}
    >
      {/* 1. 상단: 이슈 ID (#ID) & 담당자 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {/* 1) 이슈 ID */}
        <span
          style={{
            fontSize: '0.72rem',
            fontWeight: 700,
            fontFamily: 'monospace',
            color: 'var(--primary)',
          }}
        >
          #{issue.id}
        </span>

        {/* 3) 담당자 */}
        {assignee ? (
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
            title={`담당자: ${assignee.name || assignee.email}`}
          >
            {assignee.avatar ? (
              <img
                src={assignee.avatar}
                alt={assignee.name || '담당자'}
                style={{ width: '15px', height: '15px', borderRadius: '50%' }}
              />
            ) : (
              <div
                style={{
                  width: '15px',
                  height: '15px',
                  borderRadius: '50%',
                  background: assignee.avatarColor || 'var(--primary)',
                  color: 'var(--text-on-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '8px',
                  fontWeight: 700,
                }}
              >
                {assignee.name?.[0] || 'U'}
              </div>
            )}
            <span
              style={{
                fontSize: '0.68rem',
                color: 'var(--text-sub)',
                maxWidth: '70px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {assignee.name || assignee.email}
            </span>
          </div>
        ) : (
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
            미지정
          </span>
        )}
      </div>

      {/* 2) 이슈 제목 */}
      <div
        style={{
          fontSize: '0.78rem',
          fontWeight: 600,
          color: 'var(--text-bright)',
          lineHeight: 1.3,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          wordBreak: 'break-word',
        }}
      >
        {issue.title}
      </div>
    </div>
  );
};
