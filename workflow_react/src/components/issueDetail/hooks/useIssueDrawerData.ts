﻿import React, { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  getIssue,
  updateIssue,
  deleteIssue,
  getProjects,
  getUsers,
  getIssues,
  getCustomFields,
  getComments,
  toggleLikeIssue,
  getWorklogs,
} from '@/services/api';
import { issueKeys } from '@/api/issues';
import type { Issue, Project, User, CustomFieldDefinition } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { formatDateOnly } from '@/utils/dateUtils';
import { organizeComments } from '@/utils/commentTree';
import { saveIssueEditDraft, getIssueEditDraft, clearIssueEditDraft } from '@/utils/draftStorage';
import { useActionFeedback } from '@/hooks/useActionFeedback';
import { useIssueComments } from './useIssueComments';
import { useIssueWorklogs } from './useIssueWorklogs';

interface UseIssueDrawerDataProps {
  isOpen: boolean;
  issueId: number | null;
  mode?: 'view' | 'edit';
  onModeChange?: (mode: 'view' | 'edit') => void;
  onClose: () => void;
  onIssueUpdated?: () => void;
  onOpenAuth?: () => void;
}

export const useIssueDrawerData = ({
  isOpen,
  issueId,
  mode = 'view',
  onModeChange,
  onClose,
  onIssueUpdated,
  onOpenAuth,
}: UseIssueDrawerDataProps) => {
  const { user, isAuthenticated } = useAuth();
  const { isPending, errorState, closeErrorModal, executeAction } = useActionFeedback();
  const queryClient = useQueryClient();

  const [issue, setIssue] = useState<Issue | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isEditing, setIsEditing] = useState<boolean>(mode === 'edit');
  const [hasRestoredDraft, setHasRestoredDraft] = useState<boolean>(false);

  // Metadata states
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [candidateParentIssues, setCandidateParentIssues] = useState<Issue[]>([]);
  const [customDefs, setCustomDefs] = useState<CustomFieldDefinition[]>([]);

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

  // Sub-Task Modal & Delete Confirm State
  const [showCreateSubTaskModal, setShowCreateSubTaskModal] = useState<boolean>(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);

  // Social / Likes State
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [likesCount, setLikesCount] = useState<number>(0);

  // Sub-hooks for Comments & Worklogs
  const commentsState = useIssueComments({ issue, isAuthenticated, onOpenAuth, onIssueUpdated, executeAction });
  const worklogsState = useIssueWorklogs({ issue, onIssueUpdated });
  const prevDrawerIssueIdRef = useRef<number | null>(null);

  const populateFromOriginal = (issueData: Issue) => {
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

    const cMap: Record<string, any> = {};
    const cfList = (issueData as any).customFieldValues || (issueData as any).customFields || [];
    if (Array.isArray(cfList)) {
      cfList.forEach((cfv: any) => {
        cMap[String(cfv.fieldDefinitionId || cfv.customFieldId || cfv.id)] = cfv.value;
      });
    }
    setCustomFieldsData(cMap);
  };

  const handleDiscardDraft = () => {
    if (!issueId || !issue) return;
    clearIssueEditDraft(issueId);
    setHasRestoredDraft(false);
    populateFromOriginal(issue);
  };

  const loadIssueData = async (forcePopulate: boolean = false) => {
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
      commentsState.setComments(organizeComments(commentList));
      worklogsState.setWorklogs(worklogList);
      setIsLiked(!!issueData.isLiked);
      setLikesCount(issueData.likesCount || 0);

      // 저장된 임시 수정본(Draft) 확인
      const draft = getIssueEditDraft(issueId);
      if (draft) {
        setTitle(draft.title ?? issueData.title);
        setDescription(draft.description ?? (issueData.description || ''));
        setTags((draft as any).tags || (Array.isArray(issueData.tags) ? issueData.tags.map((t: any) => t.name || t) : []));
        setProjectId(draft.projectId ?? issueData.projectId ?? 1);
        setParentId(draft.parentId !== undefined ? draft.parentId : issueData.parentId || null);
        setAssigneeId(draft.assigneeId !== undefined ? draft.assigneeId : issueData.assigneeId || undefined);
        setPriorityId(draft.priorityId ?? issueData.priorityId ?? 1);
        setStatusId(draft.statusId ?? issueData.statusId ?? 1);
        setTypeId(draft.typeId ?? issueData.typeId ?? 1);
        setProgress(draft.progress !== undefined ? draft.progress : issueData.progress || 0);
        setPlannedStartDate(draft.plannedStartDate ?? (formatDateOnly(issueData.plannedStartDate) || ''));
        setDueDate(draft.dueDate ?? (formatDateOnly(issueData.dueDate) || ''));
        setActualStartDate(draft.actualStartDate ?? (formatDateOnly(issueData.actualStartDate) || ''));
        setActualEndDate(draft.actualEndDate ?? (formatDateOnly(issueData.actualEndDate) || ''));
        setCustomFieldsData(draft.customFieldsData ?? {});
        setHasRestoredDraft(true);
      } else if (forcePopulate || !isEditing || prevDrawerIssueIdRef.current !== issueId) {
        prevDrawerIssueIdRef.current = issueId;
        populateFromOriginal(issueData);
        setHasRestoredDraft(false);
      }

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
    if (isOpen && issueId) loadIssueData(true);
  }, [isOpen, issueId]);

  // 💾 편집 내용 자동 임시 저장 (Debounced Auto Save)
  useEffect(() => {
    if (!issueId || !issue) return;
    const timer = setTimeout(() => {
      saveIssueEditDraft(issueId, {
        title, description, projectId, parentId, assigneeId,
        priorityId, statusId, typeId, progress, plannedStartDate,
        dueDate, actualStartDate, actualEndDate, customFieldsData,
      });
    }, 600);
    return () => clearTimeout(timer);
  }, [
    issueId, issue, title, description, projectId, parentId, assigneeId,
    priorityId, statusId, typeId, progress, plannedStartDate, dueDate,
    actualStartDate, actualEndDate, customFieldsData,
  ]);

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
      queryClient.invalidateQueries({ queryKey: issueKeys.all });
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
          title, description, tags, projectId,
          parentId: parentId || undefined,
          assigneeId: assigneeId || undefined,
          priorityId, statusId, typeId, progress,
          plannedStartDate: plannedStartDate || undefined,
          dueDate: dueDate || undefined,
          actualStartDate: actualStartDate || undefined,
          actualEndDate: actualEndDate || undefined,
          customFields: cfPayload,
        });
      },
      {
        onSuccess: (updated) => {
          clearIssueEditDraft(issue.id);
          setHasRestoredDraft(false);
          setIssue(updated);
          setIsEditing(false);
          queryClient.invalidateQueries({ queryKey: issueKeys.all });
          if (onModeChange) onModeChange('view');
          if (onIssueUpdated) onIssueUpdated();
          loadIssueData(true);
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
          queryClient.invalidateQueries({ queryKey: issueKeys.all });
          if (onIssueUpdated) onIssueUpdated();
          onClose();
        },
      }
    );
  };

  return {
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
    comments: commentsState.comments,
    worklogs: worklogsState.worklogs,
    title, setTitle,
    description, setDescription,
    tags, setTags,
    projectId, setProjectId,
    parentId, setParentId,
    assigneeId, setAssigneeId,
    priorityId, setPriorityId,
    statusId, setStatusId,
    typeId, setTypeId,
    progress, setProgress,
    plannedStartDate, setPlannedStartDate,
    dueDate, setDueDate,
    actualStartDate, setActualStartDate,
    actualEndDate, setActualEndDate,
    customFieldsData, setCustomFieldsData,
    showCreateSubTaskModal, setShowCreateSubTaskModal,
    isLiked, likesCount, handleLike,
    newComment: commentsState.newComment,
    setNewComment: commentsState.setNewComment,
    replyTargetId: commentsState.replyTargetId,
    setReplyTargetId: commentsState.setReplyTargetId,
    replyContent: commentsState.replyContent,
    setReplyContent: commentsState.setReplyContent,
    showWorklogForm: worklogsState.showWorklogForm,
    setShowWorklogForm: worklogsState.setShowWorklogForm,
    worklogHoursInput: worklogsState.worklogHoursInput,
    setWorklogHoursInput: worklogsState.setWorklogHoursInput,
    worklogDescInput: worklogsState.worklogDescInput,
    setWorklogDescInput: worklogsState.setWorklogDescInput,
    isLoggingWork: worklogsState.isLoggingWork,
    handleCreateWorklog: worklogsState.handleCreateWorklog,
    showDeleteConfirm, setShowDeleteConfirm,
    isPending, errorState, closeErrorModal,
    loadIssueData, handleUpdateIssue, handleDeleteIssue,
    handleAddComment: commentsState.handleAddComment,
    handleReplySubmit: commentsState.handleReplySubmit,
    handleDeleteComment: commentsState.handleDeleteComment,
  };
};
