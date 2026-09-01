// -*- coding: utf-8 -*-
import React, { useState, useEffect } from 'react';
import {
  getIssue,
  updateIssue,
  deleteIssue,
  getProjects,
  getUsers,
  getIssues,
  getCustomFields,
  getComments,
  createComment,
  deleteComment,
  toggleLikeIssue,
  getWorklogs,
  createWorklog,
} from '@/services/api';
import type { Issue, Project, User, CustomFieldDefinition, Comment, Worklog } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { formatDateOnly } from '@/utils/dateUtils';
import { organizeComments } from '@/utils/commentTree';
import { hoursToMinutes } from '@/utils/worklogUtils';
import { Spinner } from '@/components/common';
import { IssueModal } from '@/components/IssueModal';
import { ConfirmModal } from '@/components/ConfirmModal';
import { useActionFeedback } from '@/hooks/useActionFeedback';
import { ActionFeedbackModal } from '@/components/ActionFeedbackModal';
import {
  IssueDetailHeader,
  IssueDetailMainCard,
  IssueWorklogs,
  IssueComments,
} from '@/components/issueDetail';

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
  const { user, isAuthenticated } = useAuth();
  const { isPending, errorState, closeErrorModal, executeAction } = useActionFeedback();

  const [issue, setIssue] = useState<Issue | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isEditing, setIsEditing] = useState<boolean>(mode === 'edit');

  // Metadata states
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [candidateParentIssues, setCandidateParentIssues] = useState<Issue[]>([]);
  const [customDefs, setCustomDefs] = useState<CustomFieldDefinition[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [worklogs, setWorklogs] = useState<Worklog[]>([]);

  // Form Fields
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [tags, setTags] = useState<string[]>([]);
  const [projectId, setProjectId] = useState<number>(0);
  const [parentId, setParentId] = useState<number | null>(null);
  const [assigneeId, setAssigneeId] = useState<number | undefined>(undefined);
  const [priorityId, setPriorityId] = useState<number>(1);
  const [statusId, setStatusId] = useState<number>(1);
  const [typeId, setTypeId] = useState<number>(1);
  const [progress, setProgress] = useState<number>(0);
  const [plannedStartDate, setPlannedStartDate] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [actualStartDate, setActualStartDate] = useState<string>('');
  const [actualEndDate, setActualEndDate] = useState<string>('');
  const [customFieldsData, setCustomFieldsData] = useState<Record<string, any>>({});

  // Sub-Task Modal State
  const [showCreateSubTaskModal, setShowCreateSubTaskModal] = useState<boolean>(false);

  // Social / Likes State
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [likesCount, setLikesCount] = useState<number>(0);

  // Comment Input State
  const [newComment, setNewComment] = useState<string>('');
  const [replyTargetId, setReplyTargetId] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState<string>('');

  // Worklog State
  const [showWorklogForm, setShowWorklogForm] = useState<boolean>(false);
  const [worklogHoursInput, setWorklogHoursInput] = useState<string>('1.0');
  const [worklogDescInput, setWorklogDescInput] = useState<string>('');
  const [isLoggingWork, setIsLoggingWork] = useState<boolean>(false);

  // Deletion Modal State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);

  useEffect(() => {
    setIsEditing(mode === 'edit');
  }, [mode]);

  const loadIssueData = async () => {
    if (!issueId) return;
    setLoading(true);
    try {
      const [issueData, projList, userList, customDefList, commentList, worklogList] =
        await Promise.all([
          getIssue(issueId),
          getProjects(),
          getUsers(),
          getCustomFields(),
          getComments(issueId),
          getWorklogs(issueId),
        ]);

      setIssue(issueData);
      setProjects(projList);
      setUsers(userList);
      setCustomDefs(customDefList);
      setComments(organizeComments(commentList));
      setWorklogs(worklogList);

      setIsLiked(!!issueData.isLiked);
      setLikesCount(issueData.likesCount || 0);

      // Populate Form Fields
      setTitle(issueData.title);
      setDescription(issueData.description || '');
      setTags(Array.isArray(issueData.tags) ? issueData.tags.map((t: any) => t.name || t) : []);
      setProjectId(issueData.projectId || 1);
      setParentId(issueData.parentId || null);
      setAssigneeId(issueData.assigneeId || undefined);
      setPriorityId(issueData.priorityId || 1);
      setStatusId(issueData.statusId || 1);
      setTypeId(issueData.typeId || 1);
      setProgress(issueData.progress || 0);
      setPlannedStartDate(formatDateOnly(issueData.plannedStartDate) || '');
      setDueDate(formatDateOnly(issueData.dueDate) || '');
      setActualStartDate(formatDateOnly(issueData.actualStartDate) || '');
      setActualEndDate(formatDateOnly(issueData.actualEndDate) || '');

      // Parse Custom Fields
      const cMap: Record<string, any> = {};
      const cfList = (issueData as any).customFieldValues || (issueData as any).customFields || [];
      if (Array.isArray(cfList)) {
        cfList.forEach((cfv: any) => {
          cMap[String(cfv.fieldDefinitionId || cfv.customFieldId || cfv.id)] = cfv.value;
        });
      }
      setCustomFieldsData(cMap);

      // Load Parent Issue Candidates
      if (issueData.projectId) {
        const pIssues = await getIssues({ projectId: issueData.projectId, all: true });
        setCandidateParentIssues(pIssues.filter((i) => i.id !== issueData.id));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIssueData();
  }, [issueId]);

  const toggleEditing = () => {
    const next = !isEditing;
    setIsEditing(next);
    if (onModeChange) onModeChange(next ? 'edit' : 'view');
  };

  const handleUpdateIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issue) return;

    await executeAction(
      async () => {
        const cfPayload = Object.entries(customFieldsData).map(([fieldDefId, value]) => ({
          fieldDefinitionId: Number(fieldDefId),
          value: String(value),
        }));

        return await updateIssue(issue.id, {
          title,
          description,
          tags,
          projectId,
          parentId: parentId || undefined,
          assigneeId: assigneeId || undefined,
          priorityId,
          statusId,
          typeId,
          progress,
          plannedStartDate: plannedStartDate || undefined,
          dueDate: dueDate || undefined,
          actualStartDate: actualStartDate || undefined,
          actualEndDate: actualEndDate || undefined,
          customFields: cfPayload,
        });
      },
      {
        onSuccess: (updated) => {
          setIssue(updated);
          setIsEditing(false);
          if (onModeChange) onModeChange('view');
          if (onIssueUpdated) onIssueUpdated();
          loadIssueData();
        },
      }
    );
  };

  const handleDeleteIssue = async () => {
    if (!issue) return;
    await executeAction(
      async () => {
        await deleteIssue(issue.id);
      },
      {
        onSuccess: () => {
          setShowDeleteConfirm(false);
          if (onIssueUpdated) onIssueUpdated();
          onBack();
        },
      }
    );
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issue || !newComment.trim()) return;

    if (!isAuthenticated) {
      if (onOpenAuth) onOpenAuth();
      return;
    }

    await executeAction(async () => {
      await createComment(issue.id, newComment.trim());
      setNewComment('');
      const cData = await getComments(issue.id);
      setComments(organizeComments(cData));
    });
  };

  const handleReplySubmit = async (parentId: number) => {
    if (!issue || !replyContent.trim()) return;

    if (!isAuthenticated) {
      if (onOpenAuth) onOpenAuth();
      return;
    }

    await executeAction(async () => {
      await createComment(issue.id, replyContent.trim(), parentId);
      setReplyContent('');
      setReplyTargetId(null);
      const cData = await getComments(issue.id);
      setComments(organizeComments(cData));
    });
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!issue) return;
    if (!confirm('댓글을 삭제하시겠습니까?')) return;

    await executeAction(async () => {
      await deleteComment(commentId);
      const cData = await getComments(issue.id);
      setComments(organizeComments(cData));
    });
  };

  const handleLike = async () => {
    if (!isAuthenticated) {
      if (onOpenAuth) onOpenAuth();
      return;
    }

    try {
      const res = await toggleLikeIssue(issue!.id);
      setIsLiked(res.isLiked);
      setLikesCount(res.likesCount);
    } catch (err) {
      console.error('Like toggle failed:', err);
    }
  };

  const handleCreateWorklog = async (e: React.FormEvent) => {
    e.preventDefault();
    const hours = parseFloat(worklogHoursInput);
    if (isNaN(hours) || hours <= 0) return;

    setIsLoggingWork(true);
    try {
      const calculatedMinutes = hoursToMinutes(hours);
      await createWorklog({
        issueId: issue!.id,
        timeSpent: calculatedMinutes,
        timeSpentHours: hours,
        description: worklogDescInput,
      });
      setWorklogDescInput('');
      setWorklogHoursInput('1.0');
      setShowWorklogForm(false);
      const wList = await getWorklogs(issue!.id);
      setWorklogs(wList);
    } catch (err) {
      console.error('Failed to log work:', err);
    } finally {
      setIsLoggingWork(false);
    }
  };

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
      {/* 1. Top Header */}
      <IssueDetailHeader
        issue={issue}
        projectId={propProjectId}
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

      {/* 5. Delete Confirm Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="이슈 삭제"
        message={`'#${issue.id} ${issue.title}' 이슈를 영구적으로 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
        confirmText="삭제"
        onConfirm={handleDeleteIssue}
        onClose={() => setShowDeleteConfirm(false)}
        loading={isPending}
      />

      {/* 6. Sub-Task Create Modal */}
      {showCreateSubTaskModal && (
        <IssueModal
          isOpen={showCreateSubTaskModal}
          onClose={() => setShowCreateSubTaskModal(false)}
          onSuccess={async () => {
            setShowCreateSubTaskModal(false);
            await loadIssueData();
          }}
          initialProjectId={issue.projectId}
          initialParentId={issue.id}
        />
      )}

      {/* 7. Feedback Modal */}
      <ActionFeedbackModal
        state={errorState}
        onClose={closeErrorModal}
      />
    </div>
  );
};