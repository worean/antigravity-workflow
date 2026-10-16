import React, { useState } from 'react';
import { Spinner } from '@/components/common';
import { IssueModal } from '@/components/IssueModal';
import { ConfirmModal } from '@/components/ConfirmModal';
import { ActionFeedbackModal } from '@/components/ActionFeedbackModal';
import {
  IssueDetailHeader,
  IssueDetailMainCard,
  IssueWorklogs,
  IssueComments,
} from '@/components/issueDetail';
import { useIssueDrawerData } from '@/components/issueDetail/hooks/useIssueDrawerData';
import { IssueDrawerDraftBanner } from '@/components/issueDetail/drawer';
import { ExtensionSlot } from '@/extensions';

interface IssueDetailPageProps {
  issueId: number | null;
  projectId?: number | null;
  mode?: 'view' | 'edit';
  onModeChange?: (mode: 'view' | 'edit') => void;
  onBack: () => void;
  onGoToList: () => void;
  onIssueUpdated?: () => void;
  onOpenAuth?: () => void;
}

export const IssueDetailPage: React.FC<IssueDetailPageProps> = ({
  issueId,
  projectId: propProjectId,
  mode = 'view',
  onModeChange,
  onBack,
  onGoToList,
  onIssueUpdated,
  onOpenAuth,
}) => {
  const [showCreateSubTaskModal, setShowCreateSubTaskModal] = useState<boolean>(false);

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
    handleToggleCommentReaction,
  } = useIssueDrawerData({
    isOpen: true,
    issueId,
    mode,
    onModeChange,
    onClose: onGoToList,
    onIssueUpdated,
    onOpenAuth,
  });

  if (loading) {
    return <Spinner centered label="이슈 정보를 불러오는 중입니다..." />;
  }

  if (!issue) {
    return (
      <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <div>이슈를 찾을 수 없습니다.</div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '30px' }}>
      {/* Draft Restored Banner */}
      <IssueDrawerDraftBanner
        hasRestoredDraft={hasRestoredDraft}
        onDiscardDraft={handleDiscardDraft}
      />

      {/* 1. Top Header */}
      <IssueDetailHeader
        issue={issue}
        projectId={propProjectId || issue.projectId}
        onBack={onBack}
        onGoToList={onGoToList}
        isAuthenticated={isAuthenticated}
        isLiked={isLiked}
        likesCount={likesCount}
        handleLike={handleLike}
        isEditing={isEditing}
        toggleEditing={toggleEditing}
        setShowDeleteConfirm={setShowDeleteConfirm}
        onOpenAuth={onOpenAuth}
      />

      {/* 2. Main Detail & Edit Panel */}
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
        projectId={issue.projectId}
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
        handleToggleReaction={handleToggleCommentReaction}
        onOpenAuth={onOpenAuth}
      />

      {/* 5. Plugin Extensions Slot (Git 연동 등) */}
      <div style={{ marginTop: '14px' }}>
        <ExtensionSlot point="issue.detail.section" context={{ issue }} />
      </div>

      {/* 6. Delete Confirm Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="이슈 삭제"
        message={`'#${issue.id} ${issue.title}' 이슈를 영구적으로 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
        confirmText="삭제"
        onConfirm={handleDeleteIssue}
        onClose={() => setShowDeleteConfirm(false)}
        loading={isPending}
      />

      {/* 7. Sub-Task Create Modal */}
      {showCreateSubTaskModal && (
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

      {/* 8. Feedback Modal */}
      <ActionFeedbackModal
        state={errorState}
        onClose={closeErrorModal}
      />
    </div>
  );
};