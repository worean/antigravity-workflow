// -*- coding: utf-8 -*-
import React from 'react';
import type { Issue, User } from '../../types';
import { STATUS_LIST, parseStatusCategory } from '../../utils/statusUtils';
import { KanbanColumn } from './KanbanColumn';

interface KanbanBoardProps {
  issues: Issue[];
  loading: boolean;
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
  onOpenAuth?: () => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  issues,
  loading,
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
  onOpenAuth,
}) => {
  const getIssuesByColumn = (columnKey: string) => {
    return issues.filter((issue) => {
      const cat = parseStatusCategory(issue.statusId || issue.status);
      return cat === columnKey;
    });
  };

  if (loading && issues.length === 0) {
    return (
      <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
        이슈 불러오는 중...
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, minmax(240px, 1fr))',
        gap: '8px',
        flex: 1,
        height: '100%',
        minHeight: 0,
        overflowX: 'auto',
        overflowY: 'hidden',
        alignItems: 'stretch',
      }}
    >
      {STATUS_LIST.map((col) => (
        <KanbanColumn
          key={col.key}
          col={col}
          columnIssues={getIssuesByColumn(col.key)}
          dragOverColumn={dragOverColumn}
          draggedIssueId={draggedIssueId}
          currentUser={currentUser}
          isAuthenticated={isAuthenticated}
          handleDragOverColumn={handleDragOverColumn}
          handleDragLeaveColumn={handleDragLeaveColumn}
          handleDropOnColumn={handleDropOnColumn}
          handleDragStart={handleDragStart}
          handleDragEnd={handleDragEnd}
          handleStatusChange={handleStatusChange}
          handleOpenDeleteConfirm={handleOpenDeleteConfirm}
          handleToggleLike={handleToggleLike}
          onSelectIssue={onSelectIssue}
          onOpenAuth={onOpenAuth}
        />
      ))}
    </div>
  );
};