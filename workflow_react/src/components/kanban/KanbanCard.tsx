import React from 'react';
import { GripVertical, Trash2, Calendar, Heart } from 'lucide-react';
import type { Issue, User } from '@/types';
import { PriorityBadge, IssueTypeBadge, UserBadge, FavoriteButton, TagBadge } from '@/components/common';
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

  return (
    <div
      key={issue.id}
      draggable={true}
      onDragStart={(e) => handleDragStart(e, issue)}
      onDragEnd={handleDragEnd}
      className={`glass-panel glass-panel-hover ${priorityClass}`}
      style={{
        padding: '6px 8px',
        display: 'flex',
        flexDirection: 'column',
        gap: '5px',
        cursor: 'grab',
        background: '#2d2d2d',
        border: isThisCardDragged ? '1px dashed var(--primary)' : undefined,
        borderRadius: 'var(--radius-xs)',
        opacity: isThisCardDragged ? 0.4 : 1,
        userSelect: 'none',
        flexShrink: 0,
        transition: 'opacity 0.15s ease, transform 0.1s ease',
      }}
      onClick={() => onSelectIssue(issue)}
    >
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
            background: '#252526',
            padding: '2px 5px',
            borderRadius: '2px',
            fontSize: '0.7rem',
            border: '1px solid #383838',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#9cdcfe' }}>
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
          borderTop: '1px solid #383838',
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
            background: '#252526',
            border: '1px solid #3c3c3c',
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