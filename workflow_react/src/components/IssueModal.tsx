import React, { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Project, User, Issue, CustomFieldDefinition, Comment } from '@/types';
import {
  createIssue,
  updateIssue,
  deleteIssue,
  getIssue,
  getIssues,
  getUsers,
  getComments,
  createComment,
  deleteComment,
  getCustomFields,
  toggleLikeIssue,
  getWorklogs,
  createWorklog,
} from '@/services/api';
import { issueKeys } from '@/api/issues';
import type { Worklog } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useWorkspace } from '@/context/WorkspaceContext';
import { prefRepository } from '@/lib/prefRepository';
import {
  X,
  PlusCircle,
  MessageSquare,
  Send,
  Heart,
  Trash2,
  Edit3,
  Lock,
  Loader2,
  Reply,
  Calendar,
  Clock,
  Plus,
  GitBranch,
} from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';
import { useActionFeedback } from '@/hooks/useActionFeedback';
import { ActionFeedbackModal } from './ActionFeedbackModal';
import { useOverlayClickClose } from '@/hooks/useOverlayClickClose';
import { getProjectMembers } from '@/utils/projectMembers';
import { formatDateOnly, getDDayStatus } from '@/utils/dateUtils';
import { organizeComments, countComments } from '@/utils/commentTree';
import {
  StatusBadge,
  PriorityBadge,
  IssueTypeBadge,
  UserBadge,
  Avatar,
  MarkdownViewer,
  MarkdownEditor,
  StatusSelect,
  PrioritySelect,
  IssueTypeSelect,
} from './common';

import { hoursToMinutes, formatWorklogTime } from '@/utils/worklogUtils';

interface IssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedIssue?: Issue | null;
  projects?: Project[];
  initialProjectId?: number;
  initialParentId?: number | null;
  onSuccess?: (savedIssue?: Issue) => void;
  onIssueCreated?: () => void;
}

const getDefaultPriority = (): number => {
  return prefRepository.defaultPriority || 2;
};

export const IssueModal: React.FC<IssueModalProps> = ({
  isOpen,
  onClose,
  selectedIssue,
  projects = [],
  initialProjectId,
  initialParentId,
  onSuccess,
  onIssueCreated,
}) => {
  const { user, isAuthenticated } = useAuth();
  const { getIssueDraft, saveIssueDraft, clearIssueDraft } = useWorkspace();
  const { isPending, errorState, closeErrorModal, executeAction } = useActionFeedback();
  const queryClient = useQueryClient();
  const overlayProps = useOverlayClickClose(onClose);

  const draftKey = selectedIssue ? `edit_${selectedIssue.id}` : 'new';
  const [draftBanner, setDraftBanner] = useState<any | null>(null);

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [projectId, setProjectId] = useState<number>(initialProjectId || projects[0]?.id || 1);
  const [parentId, setParentId] = useState<number | null>(initialParentId ?? selectedIssue?.parentId ?? null);
  const [candidateParentIssues, setCandidateParentIssues] = useState<Issue[]>([]);

  const [assigneeId, setAssigneeId] = useState<number | undefined>(undefined);
  const [priorityId, setPriorityId] = useState<number>(() => getDefaultPriority());
  const [statusId, setStatusId] = useState<number>(1);
  const [typeId, setTypeId] = useState<number>(1);
  const [progress, setProgress] = useState<number>(0);
  const [customFieldsData, setCustomFieldsData] = useState<Record<string, any>>({});

  // 일정/기한 (Schedule Dates)
  const [plannedStartDate, setPlannedStartDate] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [actualStartDate, setActualStartDate] = useState<string>('');
  const [actualEndDate, setActualEndDate] = useState<string>('');

  // 작업로그 (Worklog & Time Tracking)
  const [worklogs, setWorklogs] = useState<Worklog[]>([]);
  const [worklogHoursInput, setWorklogHoursInput] = useState<string>('');
  const [worklogDescInput, setWorklogDescInput] = useState<string>('');
  const [isLoggingWork, setIsLoggingWork] = useState<boolean>(false);
  const [showWorklogForm, setShowWorklogForm] = useState<boolean>(false);

  const [users, setUsers] = useState<User[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState<string>('');
  const [customDefs, setCustomDefs] = useState<CustomFieldDefinition[]>([]);

  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [likesCount, setLikesCount] = useState<number>(0);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [replyTargetId, setReplyTargetId] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState<string>('');

  const selectedProj = projects.find((p) => p.id === (selectedIssue?.projectId || projectId));
  const canEditRestrictedFields =
    !selectedIssue ||
    Boolean(
      user &&
        (selectedProj?.ownerId === user.id ||
          selectedIssue.authorId === user.id ||
          selectedIssue.author?.id === user.id)
    );

  // 하위 댓글(대댓글)까지 모두 포함한 유효 댓글 수 계산 (삭제된 가상 부모 제외)
  const totalCommentsCount = countComments(comments);


  useEffect(() => {
    if (projects.length > 0 && !projectId) {
      setProjectId(projects[0].id);
    }
  }, [projects]);

  useEffect(() => {
    const initData = async () => {
      try {
        const [uList, cfList] = await Promise.all([getUsers(), getCustomFields()]);
        setUsers(uList);
        setCustomDefs(cfList);
      } catch (err) {
        console.error('Data initialization failed:', err);
      }
    };
    if (isOpen) {
      initData();
    }
  }, [isOpen]);

  // 🔒 이전 열림 상태 및 이슈 ID 추적용 Ref (타이핑 중 원복 방어)
  const prevIsOpenRef = useRef<boolean>(false);
  const prevIssueIdRef = useRef<number | null>(null);

  useEffect(() => {
    // 모달이 새로 열리거나, 선택된 대상 이슈의 ID가 달라진 경우에만 초기화 실행
    const isNewlyOpened = isOpen && !prevIsOpenRef.current;
    const isIssueChanged = selectedIssue ? selectedIssue.id !== prevIssueIdRef.current : prevIssueIdRef.current !== null;

    prevIsOpenRef.current = isOpen;
    prevIssueIdRef.current = selectedIssue ? selectedIssue.id : null;

    if (!isOpen) return;

    if (isNewlyOpened || isIssueChanged) {
      if (selectedIssue) {
        setIsEditing(false);
        setTitle(selectedIssue.title || '');
        setDescription(selectedIssue.description || '');
        setProjectId(selectedIssue.projectId || projects[0]?.id || 1);
        setAssigneeId(selectedIssue.assigneeId || selectedIssue.assignee?.id || undefined);
        setPriorityId(selectedIssue.priorityId || selectedIssue.priority?.id || 1);
        setStatusId(selectedIssue.statusId || selectedIssue.status?.id || 1);
        setTypeId(selectedIssue.typeId || selectedIssue.type?.id || 1);
        setProgress(selectedIssue.progress || 0);
        setCustomFieldsData(
          typeof selectedIssue.customFields === 'string'
            ? JSON.parse(selectedIssue.customFields)
            : selectedIssue.customFields || {}
        );
        setPlannedStartDate(formatDateOnly(selectedIssue.plannedStartDate));
        setDueDate(formatDateOnly(selectedIssue.dueDate));
        setActualStartDate(formatDateOnly(selectedIssue.actualStartDate));
        setActualEndDate(formatDateOnly(selectedIssue.actualEndDate));

        setIsLiked(!!selectedIssue.isLiked);
        setLikesCount(selectedIssue.likesCount || 0);

        // 작업로그 폼 초기화
        setWorklogHoursInput('');
        setWorklogDescInput('');
        setShowWorklogForm(false);

        const fetchExtraData = async () => {
          try {
            const [cList, wList] = await Promise.all([
              getComments(selectedIssue.id),
              getWorklogs(selectedIssue.id),
            ]);
            setComments(organizeComments(cList));
            setWorklogs(wList);
          } catch (err) {
            console.error(err);
          }
        };
        fetchExtraData();
      } else {
        // 새 이슈 생성 모드
        setIsEditing(true);
        setTitle('');
        setDescription('');
        setProjectId(projects[0]?.id || 1);
        setAssigneeId(undefined);
        setPriorityId(getDefaultPriority());
        setStatusId(1);
        setTypeId(1);
        setProgress(0);
        setCustomFieldsData({});
        setPlannedStartDate('');
        setDueDate('');
        setActualStartDate('');
        setActualEndDate('');
        setWorklogs([]);
        setWorklogHoursInput('');
        setWorklogDescInput('');
        setComments([]);
        setParentId(initialParentId ?? null);

        // 하위 이슈로 새로 생성 시 상위 이슈의 시작계획일/기한 정보를 그대로 복사 (UI에서만)
        if (initialParentId) {
          getIssue(initialParentId)
            .then((parentIssue) => {
              if (parentIssue) {
                if (parentIssue.plannedStartDate) {
                  setPlannedStartDate(formatDateOnly(parentIssue.plannedStartDate));
                }
                if (parentIssue.dueDate) {
                  setDueDate(formatDateOnly(parentIssue.dueDate));
                }
              }
            })
            .catch((err) => console.error('Parent issue fetch failed:', err));
        }

        // 초안 확인 (임시 저장된 내용이 있으면 복원 배너 노출)
        const existingDraft = getIssueDraft(draftKey);
        if (existingDraft && (existingDraft.title?.trim() || existingDraft.description?.trim())) {
          setDraftBanner(existingDraft);
        } else {
          setDraftBanner(null);
        }
      }
    }
  }, [selectedIssue, isOpen, initialParentId, projects, draftKey, getIssueDraft]);

  // 사용자가 폼을 편집할 때 실시간 드래프트 자동 보존 (쿠키/스토리지)
  useEffect(() => {
    if (isOpen && isEditing) {
      if (title.trim() || description.trim()) {
        saveIssueDraft(draftKey, {
          title,
          description,
          projectId,
          priorityId,
          statusId,
          assigneeId,
          dueDate,
          plannedStartDate,
        });
      }
    }
  }, [
    isOpen,
    isEditing,
    title,
    description,
    projectId,
    priorityId,
    statusId,
    assigneeId,
    dueDate,
    plannedStartDate,
    draftKey,
    saveIssueDraft,
  ]);

  // Load candidate parent issues in the current project
  useEffect(() => {
    if (!isOpen || !projectId) return;
    const fetchCandidateParents = async () => {
      try {
        const pIssues = await getIssues({ projectId });
        // Exclude current issue if editing
        const filtered = pIssues.filter((i) => !selectedIssue || i.id !== selectedIssue.id);
        setCandidateParentIssues(filtered);
      } catch (err) {
        console.error('Failed to load candidate parent issues:', err);
      }
    };
    fetchCandidateParents();
  }, [projectId, isOpen, selectedIssue]);

  if (!isOpen) return null;

  const isViewMode = !!selectedIssue && !isEditing;

  const handleToggleLike = async () => {
    if (!selectedIssue || !isAuthenticated) return alert('로그인이 필요합니다.');
    try {
      const res = await toggleLikeIssue(selectedIssue.id);
      setIsLiked(res.isLiked);
      setLikesCount(res.likesCount);
      if (onSuccess) onSuccess();
      if (onIssueCreated) onIssueCreated();
    } catch (err) {
      console.error(err);
    }
  };

  const handleConfirmDeleteIssue = async () => {
    if (!selectedIssue) return;

    await executeAction(
      async () => {
        return await deleteIssue(selectedIssue.id);
      },
      {
        onSuccess: () => {
          setShowDeleteConfirm(false);
          if (onSuccess) onSuccess();
          if (onIssueCreated) onIssueCreated();
          onClose();
        },
      }
    );
  };


  const handleSaveIssue = async (e: React.FormEvent) => {
    e.preventDefault();

    const scheduleData = {
      plannedStartDate: plannedStartDate ? plannedStartDate : null,
      dueDate: dueDate ? dueDate : null,
      actualStartDate: actualStartDate ? actualStartDate : null,
      actualEndDate: actualEndDate ? actualEndDate : null,
    };

    await executeAction(
      async () => {
        if (selectedIssue) {
          return await updateIssue(selectedIssue.id, {
            title,
            description,
            projectId: Number(projectId),
            parentId: parentId ? Number(parentId) : null,
            assigneeId: assigneeId ? Number(assigneeId) : undefined,
            priorityId: Number(priorityId),
            statusId: Number(statusId),
            typeId: Number(typeId),
            progress: Number(progress),
            customFields: customFieldsData,
            ...scheduleData,
          });
        } else {
          return await createIssue({
            title,
            description,
            projectId: Number(projectId),
            parentId: parentId ? Number(parentId) : null,
            assigneeId: assigneeId ? Number(assigneeId) : undefined,
            priorityId: Number(priorityId),
            statusId: Number(statusId),
            typeId: Number(typeId),
            customFields: customFieldsData,
            ...scheduleData,
          });
        }
      },
      {
        onSuccess: (res) => {
          setIsEditing(false);
          clearIssueDraft(draftKey);
          setDraftBanner(null);
          queryClient.invalidateQueries({ queryKey: issueKeys.all });
          if (onSuccess) onSuccess(res);
          if (onIssueCreated) onIssueCreated();
          if (!selectedIssue) onClose();
        },
      }

    );
  };

  const handleAddWorklog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIssue) return;
    const hoursNum = parseFloat(worklogHoursInput);
    if (isNaN(hoursNum) || hoursNum <= 0) {
      alert('유효한 작업 시간(시간 단위, 예: 1.4 또는 5.5)을 입력해 주세요.');
      return;
    }

    setIsLoggingWork(true);
    try {
      const calculatedMinutes = hoursToMinutes(hoursNum);
      const newLog = await createWorklog({
        issueId: selectedIssue.id,
        timeSpent: calculatedMinutes,
        timeSpentHours: hoursNum,
        description: worklogDescInput.trim() || undefined,
      });

      setWorklogs((prev) => [newLog, ...prev]);
      setWorklogHoursInput('');
      setWorklogDescInput('');
      setShowWorklogForm(false);
      if (onSuccess) onSuccess();
      if (onIssueCreated) onIssueCreated();
    } catch (err: any) {

      console.error(err);
      alert(err.response?.data?.error || '작업 시간 기록에 실패했습니다.');
    } finally {
      setIsLoggingWork(false);
    }
  };


  // Reply Handlers

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedIssue) return;

    try {
      const comment = await createComment(selectedIssue.id, newComment);
      setComments((prev) => organizeComments([...prev, comment]));
      setNewComment('');
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || '댓글 작성 실패');
    }
  };

  const handleAddReply = async (parentId: number, e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim() || !selectedIssue) return;

    try {
      const childComment = await createComment(selectedIssue.id, replyContent, parentId);
      setComments((prev) => organizeComments([...prev, childComment]));
      setReplyContent('');
      setReplyTargetId(null);
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || '대댓글 작성 실패');
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!confirm('이 댓글을 삭제하시겠습니까?')) return;
    try {
      await deleteComment(commentId);
      if (selectedIssue) {
        const cList = await getComments(selectedIssue.id);
        setComments(organizeComments(cList));
      }
    } catch (err: any) {
      alert(err.response?.data?.error || '댓글 삭제 실패');
    }
  };

  const activeCustomDefs = customDefs.filter(
    (def) => !def.projectId || def.projectId === Number(projectId)
  );

  return (
    <>
      <div className="modal-overlay" {...overlayProps}>
        <div className="modal-content" style={{ maxWidth: '640px', padding: '14px 18px', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', borderBottom: '1px solid var(--border-light)', paddingBottom: '8px' }}>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-bright)' }}>
              {selectedIssue ? (
                <>
                  <span style={{ color: 'var(--primary)' }}>#{selectedIssue.id}</span>
                  {isEditing ? '이슈 정보 수정' : selectedIssue.title}
                </>
              ) : (
                <>
                  <PlusCircle size={15} color="var(--primary)" /> 새 이슈 작성
                </>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {selectedIssue && !isEditing && (
                <>
                  <button
                    onClick={handleToggleLike}
                    className="btn btn-secondary btn-sm"
                    style={{ display: 'flex', alignItems: 'center', gap: '3px', color: isLiked ? '#f14c4c' : 'var(--text-sub)' }}
                  >
                    <Heart size={13} fill={isLiked ? '#f14c4c' : 'none'} /> {likesCount}
                  </button>
                  {isAuthenticated && (
                    <button onClick={() => setIsEditing(true)} className="btn btn-secondary btn-sm">
                      <Edit3 size={12} /> 수정
                    </button>
                  )}
                  {isAuthenticated && (
                    <button onClick={() => setShowDeleteConfirm(true)} className="btn btn-secondary btn-sm" style={{ color: '#f14c4c' }}>
                      <Trash2 size={12} /> 삭제
                    </button>
                  )}
                </>
              )}
              <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}>
                <X size={16} />
              </button>
            </div>
          </div>

          {isViewMode && selectedIssue ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
                <IssueTypeBadge type={selectedIssue.typeId || selectedIssue.type} size="sm" />
                <StatusBadge status={selectedIssue.statusId || selectedIssue.status} size="sm" />
                <PriorityBadge priority={selectedIssue.priorityId || selectedIssue.priority} size="sm" />
              </div>


              <MarkdownViewer content={selectedIssue.description} placeholder="작성된 상세 설명이 없습니다." style={{ marginBottom: '10px' }} />

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '6px', marginBottom: '10px' }}>
                <div style={{ background: '#2d2d2d', border: '1px solid #3c3c3c', padding: '6px 8px', borderRadius: 'var(--radius-xs)', fontSize: '0.78rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>프로젝트: </span>
                  <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{selectedProj?.name || `#${selectedIssue.projectId}`}</span>
                </div>
                <div style={{ background: '#2d2d2d', border: '1px solid #3c3c3c', padding: '6px 8px', borderRadius: 'var(--radius-xs)', fontSize: '0.78rem' }}>
                  <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>담당자: </span>
                  <UserBadge user={selectedIssue.assignee} currentUserId={user?.id} size="sm" />
                </div>
                <div style={{ background: '#2d2d2d', border: '1px solid #3c3c3c', padding: '6px 8px', borderRadius: 'var(--radius-xs)', fontSize: '0.78rem' }}>
                  <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>작성자: </span>
                  <UserBadge user={selectedIssue.author} currentUserId={user?.id} size="sm" fallbackText="작성자 정보 없음" />
                </div>
                <div style={{ background: '#2d2d2d', border: '1px solid #3c3c3c', padding: '6px 8px', borderRadius: 'var(--radius-xs)', fontSize: '0.78rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>진척도: </span>
                  <span style={{ fontWeight: 600, color: '#4ec9b0' }}>{selectedIssue.progress || 0}%</span>
                </div>
              </div>

              {/* Schedule & Due Date Panel */}
              <div style={{ background: '#2d2d2d', border: '1px solid #3c3c3c', padding: '8px 10px', borderRadius: 'var(--radius-xs)', marginBottom: '10px' }}>
                <h4 style={{ fontSize: '0.78rem', color: 'var(--accent-cyan)', marginBottom: '6px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={13} /> 일정 및 기한
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '0.75rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>시작 계획일: </span>
                    <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{plannedStartDate || '미설정'}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>기한 (만료일): </span>
                    <span style={{ fontWeight: 700, color: dueDate ? '#9cdcfe' : 'var(--text-sub)' }}>
                      {dueDate || '미설정'}
                    </span>
                    {(() => {
                      const dday = getDDayStatus(dueDate);
                      if (!dday) return null;
                      return (
                        <span
                          style={{
                            marginLeft: '6px',
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            padding: '1px 5px',
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
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>실제 시작일: </span>
                    <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{actualStartDate || '미설정'}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>실제 종료일: </span>
                    <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{actualEndDate || '미설정'}</span>
                  </div>
                </div>
              </div>

              {Object.keys(customFieldsData).length > 0 && (
                <div style={{ background: '#2d2d2d', border: '1px solid #3c3c3c', padding: '8px 10px', borderRadius: 'var(--radius-xs)', marginBottom: '10px' }}>
                  <h4 style={{ fontSize: '0.78rem', color: 'var(--text-sub)', marginBottom: '6px', fontWeight: 600 }}>
                    ⚙️ 커스텀 필드
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '0.75rem' }}>
                    {Object.entries(customFieldsData).map(([k, val]) => (
                      <div key={k} style={{ background: '#252526', border: '1px solid #383838', padding: '4px 6px', borderRadius: '2px' }}>
                        <span style={{ color: 'var(--text-muted)' }}>{k}: </span>
                        <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{String(val)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Worklog & Time Tracking Panel */}
              <div style={{ background: '#2d2d2d', border: '1px solid #3c3c3c', padding: '8px 10px', borderRadius: 'var(--radius-xs)', marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h4 style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', margin: 0 }}>
                    <Clock size={13} /> 작업 로그 및 소요 시간
                  </h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#4ec9b0', background: 'rgba(78, 201, 176, 0.15)', padding: '1px 6px', borderRadius: '2px' }}>
                      총: {((worklogs.reduce((acc, cur) => acc + (cur.timeSpent || 0), 0)) / 60).toFixed(1).replace(/\.0$/, '')}시간 ({worklogs.reduce((acc, cur) => acc + (cur.timeSpent || 0), 0)}분)
                    </span>
                    {isAuthenticated && (
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => setShowWorklogForm(!showWorklogForm)}
                        style={{ padding: '1px 6px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '3px' }}
                      >
                        <Plus size={11} /> {showWorklogForm ? '접기' : '작업 기록'}
                      </button>
                    )}
                  </div>
                </div>


                {/* Inline Worklog Form */}
                {showWorklogForm && isAuthenticated && (
                  <form
                    onSubmit={handleAddWorklog}
                    style={{
                      background: 'rgba(6, 182, 212, 0.05)',
                      border: '1px solid rgba(6, 182, 212, 0.25)',
                      padding: '12px',
                      borderRadius: '6px',
                      marginBottom: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '8px' }}>
                      <div>
                        <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '2px' }}>
                          소요 시간 (시간)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0.1"
                          placeholder="예: 1.4 또는 5.5"
                          className="input-field"
                          value={worklogHoursInput}
                          onChange={(e) => setWorklogHoursInput(e.target.value)}
                          style={{ padding: '6px 8px', fontSize: '0.82rem' }}
                          required
                        />
                      </div>
                      <div>
                        <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '2px' }}>
                          작업 내용 요약
                        </label>
                        <input
                          type="text"
                          placeholder="예: API 엔드포인트 구현 및 테스트 진행"
                          className="input-field"
                          value={worklogDescInput}
                          onChange={(e) => setWorklogDescInput(e.target.value)}
                          style={{ padding: '6px 8px', fontSize: '0.82rem' }}
                        />
                      </div>
                    </div>

                    {worklogHoursInput && !isNaN(parseFloat(worklogHoursInput)) && parseFloat(worklogHoursInput) > 0 && (
                      <div style={{ fontSize: '0.75rem', color: '#06b6d4' }}>
                        💡 <strong>{worklogHoursInput}시간</strong> 입력 ➔ DB에 <strong>{hoursToMinutes(parseFloat(worklogHoursInput))}분</strong>으로 환산 저장됩니다.
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', marginTop: '2px' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => setShowWorklogForm(false)}
                        style={{ padding: '3px 8px', fontSize: '0.75rem' }}
                      >
                        취소
                      </button>
                      <button
                        type="submit"
                        className="btn btn-primary btn-sm"
                        disabled={isLoggingWork}
                        style={{ padding: '3px 12px', fontSize: '0.75rem' }}
                      >
                        {isLoggingWork ? '저장 중...' : '작업 시간 저장'}
                      </button>
                    </div>
                  </form>
                )}

                {/* Worklogs List */}
                <div style={{ maxHeight: '150px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {worklogs.length === 0 ? (
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center', padding: '8px' }}>
                      기록된 작업 시간이 없습니다.
                    </div>
                  ) : (
                    worklogs.map((w) => (
                      <div
                        key={w.id}
                        style={{
                          background: 'rgba(0,0,0,0.2)',
                          padding: '6px 10px',
                          borderRadius: '4px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: '0.8rem',
                        }}
                      >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: 700, color: 'var(--secondary)' }}>
                            {formatWorklogTime(w.timeSpent)}
                          </span>
                          <span style={{ color: 'var(--text-sub)' }}>
                            {w.description ? `- ${w.description}` : ''}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          <UserBadge user={w.user} currentUserId={user?.id} size="sm" />
                          <span>{new Date(w.createdAt).toLocaleDateString('ko-KR')}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Comments Section (YouTube Style Flat Thread) */}
              <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '14px', marginTop: '12px' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-bright)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MessageSquare size={14} color="var(--primary)" />
                  <span>댓글 {totalCommentsCount}개</span>
                </div>


                {/* Top New Comment Input (YouTube style input with Avatar) */}
                {isAuthenticated ? (
                  <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <Avatar user={user} size={26} shape="circle" style={{ marginTop: '2px' }} />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <textarea
                        className="input-field"
                        rows={2}
                        placeholder="댓글 추가... (Enter: 등록, Shift+Enter: 줄바꿈)"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            if (e.nativeEvent.isComposing) return;
                            if (e.shiftKey) {
                              e.stopPropagation();
                            } else {
                              e.preventDefault();
                              e.stopPropagation();
                              handleAddComment(e);
                            }
                          }
                        }}
                        style={{ resize: 'vertical', minHeight: '32px', fontSize: '0.78rem', background: '#1e1e1e' }}
                      />
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '4px' }}>
                        {newComment.trim() && (
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => setNewComment('')}
                            style={{ height: '22px', fontSize: '0.7rem' }}
                          >
                            취소
                          </button>
                        )}
                        <button
                          type="submit"
                          className="btn btn-primary btn-sm"
                          disabled={!newComment.trim()}
                          style={{ display: 'flex', alignItems: 'center', gap: '3px', height: '22px', fontSize: '0.7rem' }}
                        >
                          <Send size={10} /> 댓글
                        </button>
                      </div>
                    </div>
                  </form>
                ) : (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '12px', padding: '4px 0', borderBottom: '1px solid #383838' }}>
                    댓글을 작성하려면 로그인하세요.
                  </div>
                )}

                {/* Comment Thread List (Flat Text) */}
                <div style={{ maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px', paddingRight: '2px' }}>
                  {comments.length === 0 ? (
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0' }}>
                      등록된 댓글이 없습니다.
                    </div>
                  ) : (
                    comments.map((c) => {
                      const isMyComment = !c.isDeletedParent && Boolean(user && (user.id === c.authorId || user.id === c.author?.id));
                      const isReplying = replyTargetId === c.id;
                      const authorName = c.isDeletedParent
                        ? '사라진 댓글'
                        : c.author?.name || c.author?.email || (isMyComment ? (user?.name || user?.email) : `유저 #${c.authorId}`);

                      return (
                        <div key={`comment-${c.id}-${c.isDeletedParent ? 'deleted' : 'active'}`} style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                          {/* Main Parent Comment Item (YouTube Style) */}
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', opacity: c.isDeletedParent ? 0.8 : 1 }}>
                            {c.isDeletedParent ? (
                              <div
                                style={{
                                  width: 24,
                                  height: 24,
                                  borderRadius: '50%',
                                  backgroundColor: '#383838',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: 'var(--text-muted)',
                                  fontSize: '0.65rem',
                                  marginTop: '2px',
                                  flexShrink: 0
                                }}
                              >
                                ✕
                              </div>
                            ) : (
                              <Avatar
                                user={c.author || (isMyComment ? user : null)}
                                name={authorName}
                                size={24}
                                shape="circle"
                                style={{ marginTop: '2px' }}
                              />
                            )}

                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <span style={{
                                    fontSize: '0.75rem',
                                    fontWeight: c.isDeletedParent ? 400 : 600,
                                    color: c.isDeletedParent ? 'var(--text-muted)' : isMyComment ? '#9cdcfe' : 'var(--text-bright)',
                                    fontStyle: c.isDeletedParent ? 'italic' : 'normal'
                                  }}>
                                    {authorName}
                                  </span>
                                  {isMyComment && !c.isDeletedParent && (
                                    <span style={{ fontSize: '0.58rem', fontWeight: 700, color: '#9cdcfe', background: 'rgba(0,122,204,0.15)', padding: '0 3px', borderRadius: '2px' }}>
                                      작성자
                                    </span>
                                  )}
                                  {!c.isDeletedParent && c.createdAt && (
                                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                                      {new Date(c.createdAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  )}
                                </div>

                                {isAuthenticated && isMyComment && !c.isDeletedParent && (
                                  <button
                                    onClick={() => handleDeleteComment(c.id)}
                                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
                                    onMouseEnter={(e) => e.currentTarget.style.color = '#f14c4c'}
                                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                                    title="댓글 삭제"
                                  >
                                    <Trash2 size={11} />
                                  </button>
                                )}
                              </div>

                              <div style={{
                                fontSize: '0.78rem',
                                lineHeight: '1.4',
                                color: c.isDeletedParent ? 'var(--text-muted)' : 'var(--text-main)',
                                fontStyle: c.isDeletedParent ? 'italic' : 'normal',
                                whiteSpace: 'pre-wrap'
                              }}>
                                {c.isDeletedParent ? '삭제된 댓글입니다.' : c.content}
                              </div>

                              {/* Reply Button Action (삭제된 댓글에는 대댓글 작성 불가) */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                                {isAuthenticated && !c.isDeletedParent && (
                                  <button
                                    onClick={() => {
                                      if (isReplying) {
                                        setReplyTargetId(null);
                                      } else {
                                        setReplyTargetId(c.id);
                                        setReplyContent('');
                                      }
                                    }}
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      color: isReplying ? 'var(--accent-cyan)' : 'var(--text-sub)',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '2px',
                                      fontSize: '0.7rem',
                                      padding: '1px 0',
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-bright)'}
                                    onMouseLeave={(e) => e.currentTarget.style.color = isReplying ? 'var(--accent-cyan)' : 'var(--text-sub)'}
                                  >
                                    <Reply size={10} /> 답글
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Inline Reply Form */}
                          {isReplying && (
                            <form
                              onSubmit={(e) => handleAddReply(c.id, e)}
                              style={{
                                marginLeft: '32px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '3px',
                                padding: '5px 6px',
                                background: '#1e1e1e',
                                borderRadius: 'var(--radius-xs)',
                                border: '1px solid #3c3c3c',
                              }}
                            >
                              <textarea
                                className="input-field"
                                rows={2}
                                placeholder="답글 작성... (Enter: 등록, Shift+Enter: 줄바꿈)"
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    if (e.nativeEvent.isComposing) return;
                                    if (e.shiftKey) {
                                      e.stopPropagation();
                                    } else {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleAddReply(c.id, e);
                                    }
                                  }
                                }}
                                style={{ resize: 'vertical', minHeight: '30px', fontSize: '0.75rem', background: '#252526' }}
                              />
                              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '3px' }}>
                                <button
                                  type="button"
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => setReplyTargetId(null)}
                                  style={{ height: '20px', fontSize: '0.68rem', padding: '0 6px' }}
                                >
                                  취소
                                </button>
                                <button
                                  type="submit"
                                  className="btn btn-primary btn-sm"
                                  disabled={!replyContent.trim()}
                                  style={{ height: '20px', fontSize: '0.68rem', padding: '0 6px' }}
                                >
                                  답글
                                </button>
                              </div>
                            </form>
                          )}

                          {/* Nested Sub-Comments (YouTube Style Indented) */}
                          {c.children && c.children.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginLeft: '32px', marginTop: '3px' }}>
                              {c.children.map((sub) => {
                                const isMySub = Boolean(user && (user.id === sub.authorId || user.id === sub.author?.id));
                                const subAuthorName = sub.author?.name || sub.author?.email || (isMySub ? (user?.name || user?.email) : `유저 #${sub.authorId}`);

                                return (
                                  <div key={sub.id} style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                                    <Avatar
                                      user={sub.author || (isMySub ? user : null)}
                                      name={subAuthorName}
                                      size={20}
                                      shape="circle"
                                      style={{ marginTop: '2px' }}
                                    />

                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1px' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                          <span style={{ fontSize: '0.72rem', fontWeight: 600, color: isMySub ? '#9cdcfe' : 'var(--text-bright)' }}>
                                            {subAuthorName || '사용자'}
                                          </span>

                                          {isMySub && (
                                            <span style={{ fontSize: '0.55rem', fontWeight: 700, color: '#9cdcfe', background: 'rgba(0,122,204,0.15)', padding: '0 2px', borderRadius: '2px' }}>
                                              작성자
                                            </span>
                                          )}
                                          <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>
                                            {new Date(sub.createdAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                          </span>
                                        </div>

                                        {isAuthenticated && isMySub && (
                                          <button
                                            onClick={() => handleDeleteComment(sub.id)}
                                            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '1px' }}
                                            onMouseEnter={(e) => e.currentTarget.style.color = '#f14c4c'}
                                            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                                            title="대댓글 삭제"
                                          >
                                            <Trash2 size={10} />
                                          </button>
                                        )}
                                      </div>

                                      <div style={{ fontSize: '0.75rem', lineHeight: '1.35', color: 'var(--text-main)', whiteSpace: 'pre-wrap' }}>
                                        {sub.content}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

          ) : (
            <form onSubmit={handleSaveIssue}>
              {/* 💾 Draft Restore Banner */}
              {draftBanner && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    marginBottom: '12px',
                    background: 'rgba(0, 122, 204, 0.12)',
                    border: '1px solid var(--border-focus)',
                    borderRadius: 'var(--radius-xs)',
                    fontSize: '0.75rem',
                    color: 'var(--text-bright)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1rem' }}>💾</span>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--accent-cyan)' }}>
                        작성 중이던 임시 저장본이 있습니다
                      </div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-sub)' }}>
                        {new Date(draftBanner.updatedAt).toLocaleTimeString('ko-KR')}에 저장된 내용입니다.
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setTitle(draftBanner.title || '');
                        setDescription(draftBanner.description || '');
                        if (draftBanner.projectId) setProjectId(draftBanner.projectId);
                        if (draftBanner.priorityId) setPriorityId(draftBanner.priorityId);
                        if (draftBanner.statusId) setStatusId(draftBanner.statusId);
                        if (draftBanner.assigneeId !== undefined) setAssigneeId(draftBanner.assigneeId);
                        if (draftBanner.dueDate) setDueDate(draftBanner.dueDate);
                        if (draftBanner.plannedStartDate) setPlannedStartDate(draftBanner.plannedStartDate);
                        setDraftBanner(null);
                      }}
                      className="btn btn-primary"
                      style={{ padding: '3px 8px', fontSize: '0.72rem' }}
                    >
                      초안 불러오기
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        clearIssueDraft(draftKey);
                        setDraftBanner(null);
                      }}
                      className="btn btn-secondary"
                      style={{ padding: '3px 8px', fontSize: '0.72rem' }}
                    >
                      초안 삭제
                    </button>
                  </div>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">이슈 제목 (Title)</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="예: 로그인 API 개선 및 CustomField 지원"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              {!canEditRestrictedFields && (
                <div
                  style={{
                    fontSize: '0.78rem',
                    color: '#f59e0b',
                    background: 'rgba(245, 158, 11, 0.1)',
                    padding: '6px 10px',
                    borderRadius: '4px',
                    marginBottom: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Lock size={14} /> 프로젝트 이동/이슈 유형/우선순위 수정은 프로젝트 Owner 또는 작성자만 가능합니다.
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    프로젝트 {!canEditRestrictedFields && <Lock size={12} color="#f59e0b" />}
                  </label>
                  <select
                    className="input-field"
                    value={projectId}
                    onChange={(e) => setProjectId(Number(e.target.value))}
                    disabled={!canEditRestrictedFields}
                    required
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.key})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    이슈 유형 {!canEditRestrictedFields && <Lock size={12} color="#f59e0b" />}
                  </label>
                  <IssueTypeSelect
                    value={typeId}
                    onChange={setTypeId}
                    disabled={!canEditRestrictedFields}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    우선순위 {!canEditRestrictedFields && <Lock size={12} color="#f59e0b" />}
                  </label>
                  <PrioritySelect
                    value={priorityId}
                    onChange={setPriorityId}
                    disabled={!canEditRestrictedFields}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div className="form-group">
                  <label className="form-label">상태 (Status)</label>
                  <StatusSelect
                    value={statusId}
                    onChange={setStatusId}
                  />
                </div>


                <div className="form-group">
                  <label className="form-label">담당자 (Assignee)</label>
                  <select
                    className="input-field"
                    value={assigneeId || ''}
                    onChange={(e) => setAssigneeId(e.target.value ? Number(e.target.value) : undefined)}
                  >
                    <option value="">미지정 (Unassigned)</option>
                    {getProjectMembers(
                      projects.find((p) => p.id === Number(projectId)),
                      users
                    ).map((u: User) => (
                      <option key={u.id} value={u.id}>
                        {u.name ? `${u.name} (${u.email})` : u.email}
                      </option>
                    ))}

                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">진척도 ({progress}%)</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={progress}
                    onChange={(e) => setProgress(Number(e.target.value))}
                    style={{ width: '100%', marginTop: '6px' }}
                  />
                </div>
              </div>

              {/* Parent Issue Selector (상위 이슈 지정) */}
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <GitBranch size={12} color="var(--accent-cyan)" /> 상위 이슈 (Parent Issue / 계층 구조)
                </label>
                <select
                  className="input-field"
                  value={parentId ? String(parentId) : ''}
                  onChange={(e) => {
                    const newParentId = e.target.value ? Number(e.target.value) : null;
                    setParentId(newParentId);

                    // UI에서 이슈 생성 시 상위 이슈를 등록하면 날짜정보들이 상위 이슈의 정보들로 조정된다.
                    // 만약 이미 사용자가 UI에서 설정한 값이 있다면 사용자 값을 우선시하여 변경되지 않는다.
                    if (newParentId && !selectedIssue) {
                      const parentItem = candidateParentIssues.find((p) => p.id === newParentId);
                      if (parentItem) {
                        if (!plannedStartDate && parentItem.plannedStartDate) {
                          setPlannedStartDate(formatDateOnly(parentItem.plannedStartDate));
                        }
                        if (!dueDate && parentItem.dueDate) {
                          setDueDate(formatDateOnly(parentItem.dueDate));
                        }
                      }
                    }
                  }}
                >
                  <option value="">[상위 이슈 없음 (최상위 일감)]</option>
                  {candidateParentIssues.map((pIss) => (
                    <option key={pIss.id} value={pIss.id}>
                      #{pIss.id} {pIss.title} ({pIss.status?.name || 'TODO'})
                    </option>
                  ))}
                </select>
                {parentId && (
                  <div style={{ fontSize: '0.68rem', color: 'var(--accent-cyan)', marginTop: '3px' }}>
                    💡 이 이슈는 #{parentId}의 하위 이슈(Sub-task)로 등록/배속됩니다.
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">상세 설명 (Markdown Description)</label>
                <MarkdownEditor value={description} onChange={setDescription} rows={5} minHeight="140px" />
              </div>

              {/* Schedule Dates Inputs */}
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '8px', marginBottom: '16px', border: '1px solid var(--border-light)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '6px' }}>
                  <h4 style={{ fontSize: '0.88rem', color: 'var(--primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                    <Calendar size={16} /> 일정 및 기한 설정 (Schedule & Due Date)
                  </h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    ※ 시, 분, 초는 기록하지 않고 일(YYYY-MM-DD) 단위로 관리됩니다.
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>시작 계획일 (Planned Start)</label>
                    <input
                      type="date"
                      className="input-field"
                      value={plannedStartDate}
                      onChange={(e) => setPlannedStartDate(e.target.value)}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.8rem', color: '#06b6d4', fontWeight: 700 }}>
                      기한 / 계획 만료일 (Due Date)
                    </label>
                    <input
                      type="date"
                      className="input-field"
                      style={{ border: '1px solid rgba(6, 182, 212, 0.5)', background: 'rgba(6, 182, 212, 0.05)' }}
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>실제 시작일 (Actual Start)</label>
                    <input
                      type="date"
                      className="input-field"
                      value={actualStartDate}
                      onChange={(e) => setActualStartDate(e.target.value)}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>실제 종료일 (Actual End)</label>
                    <input
                      type="date"
                      className="input-field"
                      value={actualEndDate}
                      onChange={(e) => setActualEndDate(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Worklog Tracking in Edit Mode */}
              {selectedIssue && (
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-light)', padding: '14px', borderRadius: '8px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h4 style={{ fontSize: '0.88rem', color: 'var(--accent-cyan)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                      <Clock size={15} /> 작업 로그 및 투입 시간 (Worklogs)
                    </h4>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                      총 투입: {((worklogs.reduce((acc, cur) => acc + (cur.timeSpent || 0), 0)) / 60).toFixed(1).replace(/\.0$/, '')}시간 ({worklogs.reduce((acc, cur) => acc + (cur.timeSpent || 0), 0)}분)
                    </span>
                  </div>

                  <div
                    style={{
                      background: 'rgba(6, 182, 212, 0.05)',
                      border: '1px solid rgba(6, 182, 212, 0.25)',
                      padding: '12px',
                      borderRadius: '6px',
                      marginBottom: '10px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr auto', gap: '8px', alignItems: 'flex-end' }}>
                      <div>
                        <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '2px' }}>
                          소요 시간 (시간)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0.1"
                          placeholder="예: 1.4 또는 5.5"
                          className="input-field"
                          value={worklogHoursInput}
                          onChange={(e) => setWorklogHoursInput(e.target.value)}
                          style={{ padding: '6px 8px', fontSize: '0.82rem' }}
                        />
                      </div>
                      <div>
                        <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '2px' }}>
                          작업 내용 요약
                        </label>
                        <input
                          type="text"
                          placeholder="예: 디버깅 및 프론트엔드 연동 작업"
                          className="input-field"
                          value={worklogDescInput}
                          onChange={(e) => setWorklogDescInput(e.target.value)}
                          style={{ padding: '6px 8px', fontSize: '0.82rem' }}
                        />
                      </div>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        disabled={isLoggingWork || !worklogHoursInput}
                        onClick={handleAddWorklog}
                        style={{ height: '36px', padding: '0 12px', fontSize: '0.78rem' }}
                      >
                        {isLoggingWork ? '저장 중...' : '시간 기록'}
                      </button>
                    </div>

                    {worklogHoursInput && !isNaN(parseFloat(worklogHoursInput)) && parseFloat(worklogHoursInput) > 0 && (
                      <div style={{ fontSize: '0.75rem', color: '#06b6d4' }}>
                        💡 <strong>{worklogHoursInput}시간</strong> 입력 ➔ DB에 <strong>{hoursToMinutes(parseFloat(worklogHoursInput))}분</strong>으로 환산 저장됩니다.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeCustomDefs.length > 0 && (
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
                  <h4 style={{ fontSize: '0.88rem', color: 'var(--primary)', marginBottom: '10px', fontWeight: 600 }}>
                    ⚙️ 커스텀 필드 내용 입력 (Custom Fields)
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    {activeCustomDefs.map((def) => (
                      <div key={def.id}>
                        <label className="form-label" style={{ fontSize: '0.8rem' }}>
                          {def.name} ({def.key}) {def.isRequired && <span style={{ color: '#f43f5e' }}>*</span>}
                        </label>
                        <input
                          type={def.fieldType === 'NUMBER' ? 'number' : def.fieldType === 'DATE' ? 'date' : 'text'}
                          className="input-field"
                          placeholder={def.defaultValue || `${def.name} 입력...`}
                          value={customFieldsData[def.key] ?? ''}
                          onChange={(e) =>
                            setCustomFieldsData((prev) => ({
                              ...prev,
                              [def.key]: e.target.value,
                            }))
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                {selectedIssue && (
                  <button type="button" className="btn btn-secondary" onClick={() => setIsEditing(false)} disabled={isPending} style={{ flex: 1 }}>
                    취소
                  </button>
                )}
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isPending}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  {isPending ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> 저장 중...
                    </>
                  ) : selectedIssue ? (
                    '이슈 수정 저장'
                  ) : (
                    '새 이슈 생성'
                  )}
                </button>
              </div>
            </form>
          )}

          <ConfirmModal
            isOpen={showDeleteConfirm}
            title="이슈 삭제 확인"
            message={`이슈 #${selectedIssue?.id} ('${selectedIssue?.title}')를 정말 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`}
            confirmText="이슈 삭제"
            onConfirm={handleConfirmDeleteIssue}
            onClose={() => setShowDeleteConfirm(false)}
            loading={isPending}
          />
        </div>
      </div>

      {/* Action Error Modal (Only triggers on 400~5XX Fail or 3s Timeout) */}
      <ActionFeedbackModal state={errorState} onClose={closeErrorModal} />
    </>
  );
};
