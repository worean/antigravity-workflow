// -*- coding: utf-8 -*-
import React, { useState, useEffect } from 'react';
import type { Issue } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  useIssues,
  useProjects,
  useUsers,
  useUpdateIssue,
  useDeleteIssue,
  useToggleLikeIssue,
} from '../api';
import { ConfirmModal } from '../components/ConfirmModal';
import { STATUS_CONFIG, parseStatusCategory } from '../utils/statusUtils';
import { KanbanFilterBar, KanbanBoard } from '../components/kanban';

interface IssuesPageProps {
  onOpenCreateIssue: () => void;
  onSelectIssue: (issue: Issue) => void;
  selectedProjectId?: number | null;
  selectedAssigneeId?: number | 'ALL' | 'MY';
  searchTermProp?: string;
  onFilterChange?: (filters: { projectId: number | 'ALL'; assigneeId: number | 'ALL' | 'MY'; search: string }) => void;
  refreshKey?: number;
  onIssueUpdatedDirectly?: (updated: Issue) => void;
  onIssueDeletedDirectly?: (issueId: number) => void;
  onOpenAuth?: () => void;
}

export const IssuesPage: React.FC<IssuesPageProps> = ({
  onOpenCreateIssue,
  onSelectIssue,
  selectedProjectId,
  selectedAssigneeId = 'ALL',
  searchTermProp = '',
  onFilterChange,
  onIssueUpdatedDirectly,
  onIssueDeletedDirectly,
  onOpenAuth,
}) => {
  const { isAuthenticated, user } = useAuth();

  // Filters
  const [filterProjectId, setFilterProjectId] = useState<number | 'ALL'>(selectedProjectId || 'ALL');
  const [filterAssigneeId, setFilterAssigneeId] = useState<number | 'ALL' | 'MY'>(selectedAssigneeId || 'ALL');
  const [searchTerm, setSearchTerm] = useState<string>(searchTermProp || '');

  // 1. Projects & Users Query
  const { data: projects = [] } = useProjects({ limit: 50 });
  const { data: users = [] } = useUsers();

  // 2. Issues Query
  const queryProjectId = filterProjectId === 'ALL' ? undefined : filterProjectId;
  const queryAssigneeId = filterAssigneeId === 'MY' ? 'my' : filterAssigneeId === 'ALL' ? undefined : Number(filterAssigneeId);

  const { data: issues = [], isLoading: loading } = useIssues({
    projectId: queryProjectId,
    assigneeId: queryAssigneeId,
    search: searchTerm.trim() || undefined,
    all: true,
  });

  // Mutations
  const updateIssueMutation = useUpdateIssue();
  const deleteIssueMutation = useDeleteIssue();
  const toggleLikeMutation = useToggleLikeIssue();

  // Drag and Drop States
  const [draggedIssueId, setDraggedIssueId] = useState<number | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  // Deletion confirm modal state
  const [deletingIssue, setDeletingIssue] = useState<Issue | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);

  // Sync props to internal state on URL change / history back
  useEffect(() => {
    setFilterProjectId(selectedProjectId ? selectedProjectId : 'ALL');
  }, [selectedProjectId]);

  useEffect(() => {
    setFilterAssigneeId(selectedAssigneeId || 'ALL');
  }, [selectedAssigneeId]);

  useEffect(() => {
    setSearchTerm(searchTermProp || '');
  }, [searchTermProp]);

  // Filter change handlers
  const handleProjectFilterChange = (newProj: number | 'ALL') => {
    setFilterProjectId(newProj);
    if (onFilterChange) {
      onFilterChange({ projectId: newProj, assigneeId: filterAssigneeId, search: searchTerm });
    }
  };

  const handleAssigneeFilterChange = (newAssignee: number | 'ALL' | 'MY') => {
    setFilterAssigneeId(newAssignee);
    if (onFilterChange) {
      onFilterChange({ projectId: filterProjectId, assigneeId: newAssignee, search: searchTerm });
    }
  };

  const handleSearchChange = (newSearch: string) => {
    setSearchTerm(newSearch);
    if (onFilterChange) {
      onFilterChange({ projectId: filterProjectId, assigneeId: filterAssigneeId, search: newSearch });
    }
  };

  const handleStatusChange = async (issueId: number, newStatusCategory: string) => {
    const targetMeta = STATUS_CONFIG[newStatusCategory as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.TODO;
    const targetIssue = issues.find((i) => i.id === issueId);
    if (!targetIssue) return;

    const curCat = parseStatusCategory(targetIssue.statusId || targetIssue.status);
    if (curCat === targetMeta.key) return;

    try {
      const updated = await updateIssueMutation.mutateAsync({
        id: issueId,
        data: { statusId: targetMeta.id },
      });
      if (onIssueUpdatedDirectly) onIssueUpdatedDirectly(updated);
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || '상태 변경 중 오류가 발생했습니다.');
    }
  };

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, issue: Issue) => {
    e.dataTransfer.setData('text/plain', String(issue.id));
    e.dataTransfer.effectAllowed = 'move';
    setDraggedIssueId(issue.id);
  };

  const handleDragEnd = () => {
    setDraggedIssueId(null);
    setDragOverColumn(null);
  };

  const handleDragOverColumn = (e: React.DragEvent, columnKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumn !== columnKey) {
      setDragOverColumn(columnKey);
    }
  };

  const handleDragLeaveColumn = (e: React.DragEvent) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setDragOverColumn(null);
  };

  const handleDropOnColumn = (e: React.DragEvent, targetColumnKey: string) => {
    e.preventDefault();
    const rawId = e.dataTransfer.getData('text/plain') || String(draggedIssueId || '');
    const issueId = Number(rawId);

    setDragOverColumn(null);
    setDraggedIssueId(null);

    if (issueId && !isNaN(issueId)) {
      handleStatusChange(issueId, targetColumnKey);
    }
  };

  const handleToggleLike = async (e: React.MouseEvent, issue: Issue) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      if (onOpenAuth) onOpenAuth();
      else alert('좋아요 기능은 로그인 후 이용 가능합니다.');
      return;
    }

    try {
      await toggleLikeMutation.mutateAsync(issue.id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenDeleteConfirm = (e: React.MouseEvent, issue: Issue) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      if (onOpenAuth) onOpenAuth();
      return;
    }
    setDeletingIssue(issue);
  };

  const handleConfirmDeleteIssue = async () => {
    if (!deletingIssue) return;
    setDeleteLoading(true);

    try {
      await deleteIssueMutation.mutateAsync(deletingIssue.id);
      if (onIssueDeletedDirectly) onIssueDeletedDirectly(deletingIssue.id);
      setDeletingIssue(null);
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || '이슈 삭제 중 오류가 발생했습니다.');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div
      className="animate-fade-in"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        height: '100%',
        minHeight: '100%',
        flex: 1,
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      {/* 1. Top Filter Bar */}
      <KanbanFilterBar
        filterProjectId={filterProjectId}
        handleProjectFilterChange={handleProjectFilterChange}
        filterAssigneeId={filterAssigneeId}
        handleAssigneeFilterChange={handleAssigneeFilterChange}
        searchTerm={searchTerm}
        handleSearchChange={handleSearchChange}
        projects={projects}
        users={users}
        isAuthenticated={isAuthenticated}
        onOpenCreateIssue={onOpenCreateIssue}
        onOpenAuth={onOpenAuth}
      />

      {/* 2. Kanban Board Columns */}
      <KanbanBoard
        issues={issues}
        loading={loading}
        dragOverColumn={dragOverColumn}
        draggedIssueId={draggedIssueId}
        currentUser={user}
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

      {/* 3. Delete Confirm Modal */}
      <ConfirmModal
        isOpen={!!deletingIssue}
        title="이슈 삭제"
        message={`이슈 #${deletingIssue?.id} ('${deletingIssue?.title}')를 삭제하시겠습니까?`}
        confirmText="삭제"
        onConfirm={handleConfirmDeleteIssue}
        onClose={() => setDeletingIssue(null)}
        loading={deleteLoading}
      />
    </div>
  );
};