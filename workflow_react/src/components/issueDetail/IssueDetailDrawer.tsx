﻿import React, { useEffect } from 'react';
import { Spinner, Button } from '@/components/common';
import { IssueModal } from '@/components/IssueModal';
import { ConfirmModal } from '@/components/ConfirmModal';
import { ActionFeedbackModal } from '@/components/ActionFeedbackModal';
import {
  IssueDetailHeader,
  IssueDetailMainCard,
  IssueWorklogs,
  IssueComments,
} from './';
import { useIssueDrawerData } from './hooks/useIssueDrawerData';
import { IssueDrawerStickyHeader, IssueDrawerDraftBanner } from './drawer';

interface IssueDetailDrawerProps {
  isOpen: boolean;
  issueId: number | null;
  projectId?: number | null;
  mode?: 'view' | 'edit';
  onModeChange?: (mode: 'view' | 'edit') => void;
  onClose: () => void;
  onIssueUpdated?: () => void;
  onOpenAuth?: () => void;
}

export const IssueDetailDrawer: React.FC<IssueDetailDrawerProps> = ({
  isOpen,
  issueId,
  projectId: propProjectId,
  mode = 'view',
  onModeChange,
  onClose,
  onIssueUpdated,
  onOpenAuth,
}) => {
  const {
    user,
    isAuthenticated,
    issue,
    setIssue,
    loading,
    isEditing,
    hasRestoredDraft,
    handleDiscardDraft,
    toggleEditing,
    projects,
    users,
    candidateParentIssues,
    customDefs,
    comments,
    worklogs,
    title,
    setTitle,
    description,
    setDescription,
    tags,
    setTags,
    projectId,
    setProjectId,
    parentId,
    setParentId,
    assigneeId,
    setAssigneeId,
    priorityId,
    setPriorityId,
    statusId,
    setStatusId,
    typeId,
    setTypeId,
    progress,
    setProgress,
    plannedStartDate,
    setPlannedStartDate,
    dueDate,
    setDueDate,
    actualStartDate,
    setActualStartDate,
    actualEndDate,
    setActualEndDate,
    customFieldsData,
    setCustomFieldsData,
    showCreateSubTaskModal,
    setShowCreateSubTaskModal,
    isLiked,
    likesCount,
    handleLike,
    newComment,
    setNewComment,
    replyTargetId,
    setReplyTargetId,
    replyContent,
    setReplyContent,
    showWorklogForm,
    setShowWorklogForm,
    worklogHoursInput,
    setWorklogHoursInput,
    worklogDescInput,
    setWorklogDescInput,
    isLoggingWork,
    handleCreateWorklog,
    showDeleteConfirm,
    setShowDeleteConfirm,
    isPending,
    errorState,
    closeErrorModal,
    loadIssueData,
    handleUpdateIssue,
    handleDeleteIssue,
    handleAddComment,
    handleReplySubmit,
    handleDeleteComment,
  } = useIssueDrawerData({
    isOpen,
    issueId,
    mode,
    onModeChange,
    onClose,
    onIssueUpdated,
    onOpenAuth,
  });

  // ESC 키 닫기 이벤트 리스너
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (!showDeleteConfirm && !showCreateSubTaskModal && !errorState.isOpen) {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, showDeleteConfirm, showCreateSubTaskModal, errorState.isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="drawer-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
        {/* Sticky Top Header */}
        <IssueDrawerStickyHeader issue={issue} onClose={onClose} />

        {/* Scrollable Content Area */}
        <div style={{ flex: 1, padding: '16px 20px 40px 20px', overflowY: 'auto' }}>
          {loading ? (
            <div style={{ padding: '60px 0' }}>
              <Spinner centered label="이슈 상세 정보를 불러오는 중..." />
            </div>
          ) : !issue ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <div>이슈를 찾을 수 없거나 삭제되었습니다.</div>
              <Button size="sm" variant="secondary" onClick={onClose} style={{ marginTop: '12px' }}>
                닫기
              </Button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Draft Restored Banner */}
              {hasRestoredDraft && isEditing && (
                <IssueDrawerDraftBanner onDiscardDraft={handleDiscardDraft} />
              )}

              {/* 1. Header with Actions */}
              <IssueDetailHeader
                issue={issue}
                projectId={propProjectId}
                onBack={onClose}
                onGoToList={onClose}
                isAuthenticated={isAuthenticated}
                isLiked={isLiked}
                likesCount={likesCount}
                handleLike={handleLike}
                isEditing={isEditing}
                toggleEditing={toggleEditing}
                setShowDeleteConfirm={setShowDeleteConfirm}
                onOpenAuth={onOpenAuth}
              />

              {/* 2. Main Detail & Edit Form */}
              <IssueDetailMainCard
                issue={issue}
                isEditing={isEditing}
                user={user}
                isAuthenticated={isAuthenticated}
                plannedStartDate={plannedStartDate}
                dueDate={dueDate}
                actualStartDate={actualStartDate}
                actualEndDate={actualEndDate}
                customFieldsData={customFieldsData}
                setShowCreateSubTaskModal={setShowCreateSubTaskModal}
                setIssue={setIssue}
                onOpenAuth={onOpenAuth}
                title={title}
                setTitle={setTitle}
                description={description}
                setDescription={setDescription}
                tags={tags}
                setTags={setTags}
                projectId={projectId}
                setProjectId={setProjectId}
                parentId={parentId}
                setParentId={setParentId}
                assigneeId={assigneeId}
                setAssigneeId={setAssigneeId}
                priorityId={priorityId}
                setPriorityId={setPriorityId}
                statusId={statusId}
                setStatusId={setStatusId}
                typeId={typeId}
                setTypeId={setTypeId}
                progress={progress}
                setProgress={setProgress}
                setPlannedStartDate={setPlannedStartDate}
                setDueDate={setDueDate}
                setActualStartDate={setActualStartDate}
                setActualEndDate={setActualEndDate}
                customDefs={customDefs}
                setCustomFieldsData={setCustomFieldsData}
                projects={projects}
                candidateParentIssues={candidateParentIssues}
                users={users}
                isPending={isPending}
                handleUpdateIssue={handleUpdateIssue}
                toggleEditing={toggleEditing}
              />

              {/* 3. Worklogs Section */}
              <IssueWorklogs
                worklogs={worklogs}
                isAuthenticated={isAuthenticated}
                showWorklogForm={showWorklogForm}
                setShowWorklogForm={setShowWorklogForm}
                worklogHoursInput={worklogHoursInput}
                setWorklogHoursInput={setWorklogHoursInput}
                worklogDescInput={worklogDescInput}
                setWorklogDescInput={setWorklogDescInput}
                isLoggingWork={isLoggingWork}
                handleCreateWorklog={handleCreateWorklog}
                currentUserId={user?.id}
              />

              {/* 4. Comments Section */}
              <IssueComments
                comments={comments}
                user={user}
                isAuthenticated={isAuthenticated}
                newComment={newComment}
                setNewComment={setNewComment}
                replyTargetId={replyTargetId}
                setReplyTargetId={setReplyTargetId}
                replyContent={replyContent}
                setReplyContent={setReplyContent}
                isPending={isPending}
                handleAddComment={handleAddComment}
                handleReplySubmit={handleReplySubmit}
                handleDeleteComment={handleDeleteComment}
                onOpenAuth={onOpenAuth}
              />
            </div>
          )}
        </div>

        {/* Sub-Modals */}
        <ConfirmModal
          isOpen={showDeleteConfirm}
          title="이슈 삭제"
          message={issue ? `'#${issue.id} ${issue.title}' 이슈를 영구적으로 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.` : ''}
          confirmText="삭제"
          onConfirm={handleDeleteIssue}
          onClose={() => setShowDeleteConfirm(false)}
          loading={isPending}
        />

        {showCreateSubTaskModal && issue && (
          <IssueModal
            isOpen={showCreateSubTaskModal}
            onClose={() => setShowCreateSubTaskModal(false)}
            onSuccess={async () => {
              setShowCreateSubTaskModal(false);
              await loadIssueData();
              if (onIssueUpdated) onIssueUpdated();
            }}
            initialProjectId={issue.projectId}
            initialParentId={issue.id}
          />
        )}

        <ActionFeedbackModal
          state={errorState}
          onClose={closeErrorModal}
        />
      </div>
    </div>
  );
};
