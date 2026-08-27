// -*- coding: utf-8 -*-
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
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
} from '../../services/api';
import type { Issue, Project, User, CustomFieldDefinition, Comment, Worklog } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { formatDateOnly } from '../../utils/dateUtils';
import { organizeComments } from '../../utils/commentTree';
import { hoursToMinutes } from '../../utils/worklogUtils';
import { Spinner, Button } from '../common';
import { IssueModal } from '../IssueModal';
import { ConfirmModal } from '../ConfirmModal';
import { useActionFeedback } from '../../hooks/useActionFeedback';
import { ActionFeedbackModal } from '../ActionFeedbackModal';
import {
  IssueDetailHeader,
  IssueDetailMainCard,
  IssueWorklogs,
  IssueComments,
} from './';

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

  // Delete Confirm Modal State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);

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
    if (isOpen && issueId) {
      loadIssueData();
    }
  }, [isOpen, issueId]);

  const toggleEditing = () => {
    const next = !isEditing;
    setIsEditing(next);
    if (onModeChange) onModeChange(next ? 'edit' : 'view');
  };

  const handleLike = async () => {
    if (!issue) return;
    if (!isAuthenticated) {
      if (onOpenAuth) onOpenAuth();
      return;
    }
    const prevLiked = isLiked;
    const prevCount = likesCount;
    setIsLiked(!prevLiked);
    setLikesCount(prevLiked ? Math.max(0, prevCount - 1) : prevCount + 1);

    try {
      const res = await toggleLikeIssue(issue.id);
      setIsLiked(res.isLiked);
      setLikesCount(res.likesCount);
      if (onIssueUpdated) onIssueUpdated();
    } catch (err) {
      console.error('Failed to toggle like:', err);
      setIsLiked(prevLiked);
      setLikesCount(prevCount);
    }
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
          onClose();
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
      const refreshed = await getComments(issue.id);
      setComments(organizeComments(refreshed));
      if (onIssueUpdated) onIssueUpdated();
    });
  };

  const handleReplySubmit = async (parentCommentId: number) => {
    if (!issue || !replyContent.trim()) return;

    if (!isAuthenticated) {
      if (onOpenAuth) onOpenAuth();
      return;
    }

    await executeAction(async () => {
      await createComment(issue.id, replyContent.trim(), parentCommentId);
      setReplyTargetId(null);
      setReplyContent('');
      const refreshed = await getComments(issue.id);
      setComments(organizeComments(refreshed));
      if (onIssueUpdated) onIssueUpdated();
    });
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!issue) return;
    if (!confirm('댓글을 삭제하시겠습니까?')) return;

    await executeAction(async () => {
      await deleteComment(commentId);
      const refreshed = await getComments(issue.id);
      setComments(organizeComments(refreshed));
      if (onIssueUpdated) onIssueUpdated();
    });
  };

  const handleCreateWorklog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issue) return;

    const hours = parseFloat(worklogHoursInput);
    if (isNaN(hours) || hours <= 0) {
      alert('올바른 투입 시간을 입력하세요 (예: 1.5)');
      return;
    }

    setIsLoggingWork(true);
    try {
      await createWorklog({
        issueId: issue.id,
        timeSpent: hoursToMinutes(hours),
        description: worklogDescInput.trim() || undefined,
        startedAt: new Date().toISOString(),
      });
      setShowWorklogForm(false);
      setWorklogDescInput('');
      setWorklogHoursInput('1.0');
      const updatedLogs = await getWorklogs(issue.id);
      setWorklogs(updatedLogs);
      if (onIssueUpdated) onIssueUpdated();
    } catch (err: any) {
      console.error('Failed to log work:', err);
      alert(err.response?.data?.error || '작업 시간 기록에 실패했습니다.');
    } finally {
      setIsLoggingWork(false);
    }
  };

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
        {/* Drawer Sticky Top Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 18px',
            borderBottom: '1px solid var(--border-light)',
            background: 'var(--bg-header)',
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {issue?.project ? `${issue.project.name} (${issue.project.key})` : '이슈 상세 정보'}
            </span>
            {issue && (
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)' }}>
                #{issue.issueNumber || issue.id}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-xs)',
                color: 'var(--text-main)',
                cursor: 'pointer',
                padding: '4px 8px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.72rem',
              }}
              title="닫기 (Esc)"
            >
              <X size={14} />
              <span>닫기 <kbd style={{ opacity: 0.6 }}>Esc</kbd></span>
            </button>
          </div>
        </div>

        {/* Drawer Scrollable Content Area */}
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