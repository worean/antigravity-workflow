import React from 'react';
import type { Issue, User } from '@/types';
import type { StatusMeta } from '@/utils/statusUtils';
import { KanbanCard } from './KanbanCard';

interface KanbanColumnProps {
  col: StatusMeta;
  columnIssues: Issue[];
  dragOverColumn: string | null;
  draggedIssueId: number | null;
  currentUser: User | null;
  isAuthenticated: boolean;
  handleDragOverColumn: (e: React.DragEvent, columnKey: string) => void;
  handleDragLeaveColumn: (e: React.DragEvent) => void;
  handleDropOnColumn: (e: React.DragEvent, targetColumnKey: string) => void;
  handleDragStart: (e: React.DragEvent, issue: Issue) => void;
  handleDragEnd: () => void;
  handleStatusChange: (issueId: number, newStatusCategory: string) => Promise<void>;
  handleOpenDeleteConfirm: (e: React.MouseEvent, issue: Issue) => void;
  handleToggleLike: (e: React.MouseEvent, issue: Issue) => Promise<void>;
  onSelectIssue: (issue: Issue) => void;
  onTagClick?: (tagName: string) => void;
  onOpenAuth?: () => void;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  col,
  columnIssues,
  dragOverColumn,
  draggedIssueId,
  currentUser,
  isAuthenticated,
  handleDragOverColumn,
  handleDragLeaveColumn,
  handleDropOnColumn,
  handleDragStart,
  handleDragEnd,
  handleStatusChange,
  handleOpenDeleteConfirm,
  handleToggleLike,
  onSelectIssue,
  onTagClick,
  onOpenAuth,
}) => {
  const isColumnHovered = dragOverColumn === col.key;

  return (
    <div
      key={col.key}
      onDragOver={(e) => handleDragOverColumn(e, col.key)}
      onDragEnter={(e) => handleDragOverColumn(e, col.key)}
      onDragLeave={handleDragLeaveColumn}
      onDrop={(e) => handleDropOnColumn(e, col.key)}
      style={{
        background: isColumnHovered ? '#2a2d2e' : 'var(--bg-card)',
        borderRadius: 'var(--radius-xs)',
        border: isColumnHovered ? '1px solid var(--primary)' : '1px solid var(--border-light)',
        boxShadow: isColumnHovered ? 'inset 0 0 0 1px var(--primary)' : 'none',
        padding: '8px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        height: '100%',
        minHeight: 0,
        overflow: 'hidden',
        boxSizing: 'border-box',
        transition: 'background-color 0.1s ease, border-color 0.1s ease',
      }}
    >
      {/* Column Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: '6px',
          borderBottom: `2px solid ${col.color}`,
          fontSize: '0.78rem',
          fontWeight: 600,
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ color: 'var(--text-bright)' }}>
            {col.fullLabel}
          </span>
          {isColumnHovered && (
            <span style={{ fontSize: '0.65rem', color: 'var(--accent-cyan)', background: 'rgba(0,122,204,0.2)', padding: '1px 4px', borderRadius: '2px' }}>
              여기에 놓기
            </span>
          )}
        </div>
        <span
          style={{
            fontSize: '0.7rem',
            fontWeight: 700,
            background: '#333333',
            color: 'var(--text-main)',
            padding: '1px 6px',
            borderRadius: '10px',
          }}
        >
          {columnIssues.length}
        </span>
      </div>

      {/* Column Cards Area */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '5px',
          flex: 1,
          overflowY: 'auto',
          minHeight: 0,
          paddingRight: '2px',
        }}
      >
        {columnIssues.length === 0 ? (
          <div
            style={{
              fontSize: '0.75rem',
              color: isColumnHovered ? 'var(--accent-cyan)' : 'var(--text-muted)',
              textAlign: 'center',
              padding: '24px 0',
              border: isColumnHovered ? '1px dashed var(--primary)' : 'none',
              borderRadius: 'var(--radius-xs)',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {isColumnHovered ? '이곳으로 드롭하세요' : '항목 없음'}
          </div>
        ) : (
          columnIssues.map((issue) => (
            <KanbanCard
              key={issue.id}
              issue={issue}
              columnKey={col.key}
              isThisCardDragged={draggedIssueId === issue.id}
              currentUser={currentUser}
              isAuthenticated={isAuthenticated}
              handleDragStart={handleDragStart}
              handleDragEnd={handleDragEnd}
              handleStatusChange={handleStatusChange}
              handleOpenDeleteConfirm={handleOpenDeleteConfirm}
              handleToggleLike={handleToggleLike}
              onSelectIssue={onSelectIssue}
              onTagClick={onTagClick}
              onOpenAuth={onOpenAuth}
            />
          ))
        )}
      </div>
    </div>
  );
};