import React from 'react';
import { GripVertical, Trash2, Calendar, Heart, StickyNote } from 'lucide-react';
import type { Issue, User } from '@/types';
import { PriorityBadge, IssueTypeBadge, UserBadge, FavoriteButton, TagBadge } from '@/components/common';
import { MemoIndicator } from '@/components/memos';
import { useMemoStore } from '@/stores/useMemoStore';
import { formatDateOnly, getDDayStatus } from '@/utils/dateUtils';
import { STATUS_LIST, parsePriorityLevel } from '@/utils/statusUtils';

interface KanbanCardProps {
  issue: Issue;
  columnKey: string;
  isThisCardDragged: boolean;
  currentUser: User | null;
  isAuthenticated: boolean;
  handleDragStart: (e: React.DragEvent, issue: Issue) => void;
  handleDragEnd: () => void;
  handleStatusChange: (issueId: number, newStatusCategory: string) => Promise<void>;
  handleOpenDeleteConfirm: (e: React.MouseEvent, issue: Issue) => void;
  handleToggleLike: (e: React.MouseEvent, issue: Issue) => Promise<void>;
  onSelectIssue: (issue: Issue) => void;
  onTagClick?: (tagName: string) => void;
  onOpenAuth?: () => void;
}

export const KanbanCard: React.FC<KanbanCardProps> = ({
  issue,
  columnKey,
  isThisCardDragged,
  currentUser,
  isAuthenticated,
  handleDragStart,
  handleDragEnd,
  handleStatusChange,
  handleOpenDeleteConfirm,
  handleToggleLike,
  onSelectIssue,
  onTagClick,
  onOpenAuth,
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

  const memos = useMemoStore((s) => s.memos);
  const currentMemo = React.useMemo(() => memos.find((m) => m.issueId === issue.id), [memos, issue.id]);
  const createMemo = useMemoStore((s) => s.createMemo);
  const setActiveMemoId = useMemoStore((s) => s.setActiveMemoId);

  const handleMemoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      if (onOpenAuth) onOpenAuth();
      return;
    }
    if (currentMemo) {
      setActiveMemoId(currentMemo.id);
    } else {
      const created = createMemo(currentUser?.id || 1, { issueId: issue.id, color: 'yellow', content: '' });
      setActiveMemoId(created.id);
    }
  };

  return (
    <div
      key={issue.id}
      draggable={true}
      onDragStart={(e) => handleDragStart(e, issue)}
      onDragEnd={handleDragEnd}
      className={`glass-panel glass-panel-hover ${priorityClass}`}
      style={{
        position: 'relative',
        overflow: 'hidden',
        padding: '6px 8px',
        display: 'flex',
        flexDirection: 'column',
        gap: '5px',
        cursor: 'grab',
        background: 'var(--bg-card)',
        border: isThisCardDragged ? '1px dashed var(--primary)' : undefined,
        borderRadius: 'var(--radius-xs)',
        opacity: isThisCardDragged ? 0.4 : 1,
        userSelect: 'none',
        flexShrink: 0,
        transition: 'opacity 0.15s ease, transform 0.1s ease',
      }}
      onClick={() => onSelectIssue(issue)}
    >
      {/* 개인 메모 인디케이터 (좌측 상단 붉은색 삼각형) */}
      <MemoIndicator issueId={issue.id} />

      {/* Header: ID, Type, Priority, Drag Handle & Delete */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <GripVertical size={11} color="var(--text-muted)" style={{ cursor: 'grab' }} />
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--primary)' }}>
            #{issue.id}
          </span>
          <IssueTypeBadge type={issue.typeId || issue.type} size="sm" />
          <PriorityBadge priority={issue.priorityId || issue.priority} size="sm" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
          {isAuthenticated && (
            <button
              type="button"
              onClick={handleMemoClick}
              style={{
                background: 'none',
                border: 'none',
                color: currentMemo ? '#eab308' : 'var(--text-muted)',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
                alignItems: 'center',
                opacity: currentMemo ? 1 : 0.6,
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = currentMemo ? '1' : '0.6')}
              title={currentMemo ? '내 개인 메모 열기/편집' : '이 이슈에 개인 메모(포스트잇) 남기기'}
            >
              <StickyNote size={12} fill={currentMemo ? '#eab308' : 'none'} />
            </button>
          )}

          {isAuthenticated && (
            <button
              onClick={(e) => handleOpenDeleteConfirm(e, issue)}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
              title="삭제"
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Issue Title */}
      <div
        style={{
          fontSize: '0.82rem',
          fontWeight: 600,
          color: 'var(--text-bright)',
          lineHeight: 1.3,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        }}
      >
        {issue.title}
      </div>

      {/* 🏷️ Tags List */}
      {Array.isArray(issue.tags) && issue.tags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '1px' }}>
          {issue.tags.map((tag) => (
            <TagBadge
              key={tag.id || tag.name}
              tag={tag}
              size="xs"
              onClick={onTagClick}
              clickable={!!onTagClick}
            />
          ))}
        </div>
      )}

      {/* Project & Assignee info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '110px' }}>
          📁 {issue.project?.name || `Prj #${issue.projectId}`}
        </span>
        <UserBadge user={issue.assignee} currentUserId={currentUser?.id} size="sm" />
      </div>

      {/* Due Date Indicator */}
      {issue.dueDate && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-subtle)',
            padding: '2px 5px',
            borderRadius: '2px',
            fontSize: '0.7rem',
            border: '1px solid var(--border-light)',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: 'var(--accent-cyan)' }}>
            <Calendar size={11} /> {formatDateOnly(issue.dueDate)}
          </span>
          {(() => {
            const dday = getDDayStatus(issue.dueDate);
            if (!dday) return null;
            return (
              <span
                style={{
                  fontWeight: 700,
                  fontSize: '0.65rem',
                  padding: '0 4px',
                  borderRadius: '2px',
                  color: dday.color,
                  background: dday.bg,
                }}
              >
                {dday.label}
              </span>
            );
          })()}
        </div>
      )}

      {/* Footer: Quick Status Switch & Likes */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTop: '1px solid var(--border-light)',
          paddingTop: '4px',
          marginTop: '2px',
        }}
      >
        <select
          value={columnKey}
          onChange={(e) => {
            e.stopPropagation();
            handleStatusChange(issue.id, e.target.value);
          }}
          onClick={(e) => e.stopPropagation()}
          style={{
            background: 'var(--bg-input)',
            border: '1px solid var(--border-light)',
            color: 'var(--text-sub)',
            fontSize: '0.7rem',
            borderRadius: '2px',
            padding: '1px 4px',
            outline: 'none',
            height: '20px',
          }}
        >
          {STATUS_LIST.map((s) => (
            <option key={s.key} value={s.key}>
              {s.key}
            </option>
          ))}
        </select>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <FavoriteButton
            targetType="ISSUE"
            targetId={issue.id}
            isFavorite={issue.isFavorite}
            size="xs"
            onOpenAuth={onOpenAuth}
          />

          <button
            onClick={(e) => handleToggleLike(e, issue)}
            style={{
              background: 'none',
              border: 'none',
              color: issue.isLiked ? '#f14c4c' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
              fontSize: '0.7rem',
              cursor: 'pointer',
            }}
          >
            <Heart size={11} fill={issue.isLiked ? '#f14c4c' : 'none'} />
            {issue.likesCount || 0}
          </button>
        </div>
      </div>
    </div>
  );
};