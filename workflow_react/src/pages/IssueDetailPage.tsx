import React, { useState, useEffect } from 'react';
import type { Project, User, Issue, CustomFieldDefinition, Comment, Worklog } from '../types';
import {
  getIssue,
  updateIssue,
  deleteIssue,
  getUsers,
  getComments,
  createComment,
  deleteComment,
  getCustomFields,
  toggleLikeIssue,
  getProjects,
  getWorklogs,
  createWorklog,
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft,
  MessageSquare,
  Send,
  Heart,
  Trash2,
  Edit3,
  Lock,
  Loader2,
  CheckCircle2,
  User as UserIcon,
  Layers,
  Tag,
  Save,
  Reply,
  Calendar,
  Clock,
  Plus,
  Columns,
} from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';
import { useActionFeedback } from '../hooks/useActionFeedback';
import { ActionFeedbackModal } from '../components/ActionFeedbackModal';
import { getProjectMembers } from '../utils/projectMembers';
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
} from '../components/common';

import { formatDateOnly, getDDayStatus } from '../utils/dateUtils';
import { hoursToMinutes, formatWorklogTime } from '../utils/worklogUtils';
import { sendDesktopNotification } from '../utils/notificationUtils';

interface IssueDetailPageProps {

  issueId: number | null;
  projectId?: number | null;
  mode?: 'view' | 'edit';
  onModeChange?: (mode: 'view' | 'edit') => void;
  onBack: () => void;
  onGoToList?: () => void;
  onIssueUpdated: (updated?: Issue) => void;
}

export const IssueDetailPage: React.FC<IssueDetailPageProps> = ({
  issueId,
  mode = 'view',
  onModeChange,
  onBack,
  onGoToList,
  onIssueUpdated,
}) => {


  const { user, isAuthenticated } = useAuth();
  const { isPending, errorState, closeErrorModal, executeAction } = useActionFeedback();

  const [issue, setIssue] = useState<Issue | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [customDefs, setCustomDefs] = useState<CustomFieldDefinition[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Form Editing States
  const [isEditing, setIsEditing] = useState<boolean>(mode === 'edit');

  useEffect(() => {
    setIsEditing(mode === 'edit');
  }, [mode]);

  const toggleEditing = (targetEditing?: boolean) => {
    const nextVal = typeof targetEditing === 'boolean' ? targetEditing : !isEditing;
    setIsEditing(nextVal);
    if (onModeChange) {
      onModeChange(nextVal ? 'edit' : 'view');
    }
  };

  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [projectId, setProjectId] = useState<number>(1);
  const [assigneeId, setAssigneeId] = useState<number | undefined>(undefined);
  const [priorityId, setPriorityId] = useState<number>(1);
  const [statusId, setStatusId] = useState<number>(1);
  const [typeId, setTypeId] = useState<number>(1);
  const [progress, setProgress] = useState<number>(0);
  const [customFieldsData, setCustomFieldsData] = useState<Record<string, any>>({});

  // Schedule Dates
  const [plannedStartDate, setPlannedStartDate] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [actualStartDate, setActualStartDate] = useState<string>('');
  const [actualEndDate, setActualEndDate] = useState<string>('');

  // Worklogs
  const [worklogs, setWorklogs] = useState<Worklog[]>([]);
  const [worklogHoursInput, setWorklogHoursInput] = useState<string>('');
  const [worklogDescInput, setWorklogDescInput] = useState<string>('');
  const [isLoggingWork, setIsLoggingWork] = useState<boolean>(false);
  const [showWorklogForm, setShowWorklogForm] = useState<boolean>(false);

  const [newComment, setNewComment] = useState<string>('');
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [likesCount, setLikesCount] = useState<number>(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Reply States (Must be declared before early returns)
  const [replyTargetId, setReplyTargetId] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState<string>('');

  // Fetch issue details & metadata safely
  const loadIssueData = async () => {
    if (!issueId) return;
    setLoading(true);
    setFetchError(null);

    try {
      // 1. 이슈 핵심 상세 정보 최우선 조회
      const issueData = await getIssue(issueId);
      if (!issueData) {
        throw new Error('이슈 데이터를 불러올 수 없습니다.');
      }
      setIssue(issueData);

      // 2. 메타 데이터 및 댓글, 작업로그 데이터 안전 병렬 조회
      const [pRes, uRes, cfRes, cRes, wRes] = await Promise.allSettled([
        getProjects(),
        getUsers(),
        getCustomFields(),
        getComments(issueId),
        getWorklogs(issueId),
      ]);

      const pList = pRes.status === 'fulfilled' && Array.isArray(pRes.value) ? pRes.value : [];
      const uList = uRes.status === 'fulfilled' && Array.isArray(uRes.value) ? uRes.value : [];
      const cfList = cfRes.status === 'fulfilled' && Array.isArray(cfRes.value) ? cfRes.value : [];
      const cList = cRes.status === 'fulfilled' && Array.isArray(cRes.value) ? cRes.value : [];
      const wList = wRes.status === 'fulfilled' && Array.isArray(wRes.value) ? wRes.value : [];

      setProjects(pList);
      setUsers(uList);
      setCustomDefs(cfList);
      setComments(cList);
      setWorklogs(wList);

      // Bind form state safely
      setTitle(issueData.title || '');
      setDescription(issueData.description || '');
      setProjectId(issueData.projectId || (pList[0] ? pList[0].id : 1));
      setAssigneeId(issueData.assigneeId || issueData.assignee?.id || undefined);
      setPriorityId(issueData.priorityId || issueData.priority?.id || 1);
      setStatusId(issueData.statusId || issueData.status?.id || 1);
      setTypeId(issueData.typeId || issueData.type?.id || 1);
      setProgress(issueData.progress || 0);

      setPlannedStartDate(formatDateOnly(issueData.plannedStartDate));
      setDueDate(formatDateOnly(issueData.dueDate));
      setActualStartDate(formatDateOnly(issueData.actualStartDate));
      setActualEndDate(formatDateOnly(issueData.actualEndDate));

      // Reset Worklog Form
      setWorklogHoursInput('');
      setWorklogDescInput('');
      setShowWorklogForm(false);

      let parsedCustomFields = {};
      if (issueData.customFields) {
        if (typeof issueData.customFields === 'string') {
          try {
            parsedCustomFields = JSON.parse(issueData.customFields);
          } catch {
            parsedCustomFields = {};
          }
        } else if (typeof issueData.customFields === 'object') {
          parsedCustomFields = issueData.customFields;
        }
      }
      setCustomFieldsData(parsedCustomFields);
      setIsLiked(!!issueData.isLiked);
      setLikesCount(issueData.likesCount || 0);
    } catch (err: any) {
      console.error('Failed to load issue data:', err);
      setFetchError(err.response?.data?.error || err.message || '이슈 정보를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIssueData();
  }, [issueId]);

  if (!issueId) {
    return (
      <div style={{ textAlign: 'center', padding: '60px' }}>
        <p style={{ color: 'var(--text-sub)' }}>선택된 이슈가 없습니다.</p>
        <button className="btn btn-primary" onClick={onBack} style={{ marginTop: '16px' }}>
          <ArrowLeft size={16} /> 목록으로 돌아가기
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-sub)' }}>
        <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 12px' }} />
        이슈 상세 정보 및 관련 데이터를 불러오는 중...
      </div>
    );
  }

  if (!issue) {
    return (
      <div style={{ textAlign: 'center', padding: '60px' }}>
        <p style={{ color: '#f43f5e', fontWeight: 600, fontSize: '1rem', marginBottom: '8px' }}>
          {fetchError || '이슈 정보를 찾을 수 없습니다.'}
        </p>
        <p style={{ color: 'var(--text-sub)', fontSize: '0.85rem', marginBottom: '20px' }}>
          요청하신 이슈가 존재하지 않거나 서버 연결 상태를 확인해 주세요.
        </p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button className="btn btn-secondary" onClick={loadIssueData}>
            다시 시도
          </button>
          <button className="btn btn-primary" onClick={onBack}>
            <ArrowLeft size={16} /> 이슈 목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  const selectedProj = projects.find((p) => p.id === projectId);
  const canEditRestrictedFields = Boolean(
    user &&
      (selectedProj?.ownerId === user.id ||
        issue.authorId === user.id ||
        issue.author?.id === user.id)
  );

  const handleToggleLike = async () => {
    if (!isAuthenticated) return alert('로그인이 필요합니다.');
    try {
      const res = await toggleLikeIssue(issue.id);
      setIsLiked(res.isLiked);
      setLikesCount(res.likesCount);
      onIssueUpdated();
    } catch (err) {
      console.error(err);
    }
  };

  const handleConfirmDeleteIssue = async () => {
    await executeAction(
      async () => {
        return await deleteIssue(issue.id);
      },
      {
        onSuccess: () => {
          setShowDeleteConfirm(false);
          onIssueUpdated();
          onBack();
        },
      }
    );
  };

  const handleSaveIssue = async (e: React.FormEvent) => {
    e.preventDefault();

    await executeAction(
      async () => {
        return await updateIssue(issue.id, {
          title,
          description,
          projectId: Number(projectId),
          assigneeId: assigneeId ? Number(assigneeId) : undefined,
          priorityId: Number(priorityId),
          statusId: Number(statusId),
          typeId: Number(typeId),
          progress: Number(progress),
          customFields: customFieldsData,
          plannedStartDate: plannedStartDate ? plannedStartDate : null,
          dueDate: dueDate ? dueDate : null,
          actualStartDate: actualStartDate ? actualStartDate : null,
          actualEndDate: actualEndDate ? actualEndDate : null,
        });
      },
      {
        onSuccess: (updated) => {
          setIssue(updated);
          toggleEditing(false);
          sendDesktopNotification({
            title: '이슈 업데이트',
            body: `#${updated.id} ${updated.title} 내용이 수정되었습니다.`,
            priority: updated.priorityId || updated.priority,
          });
          onIssueUpdated(updated);
        },
      }
    );
  };

  const handleAddWorklog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issue) return;
    const hoursNum = parseFloat(worklogHoursInput);
    if (isNaN(hoursNum) || hoursNum <= 0) {
      alert('유효한 작업 시간(시간 단위, 예: 1.4 또는 5.5)을 입력해 주세요.');
      return;
    }

    setIsLoggingWork(true);
    try {
      const calculatedMinutes = hoursToMinutes(hoursNum);
      const newLog = await createWorklog({
        issueId: issue.id,
        timeSpent: calculatedMinutes,
        timeSpentHours: hoursNum,
        description: worklogDescInput.trim() || undefined,
      });

      setWorklogs((prev) => [newLog, ...prev]);
      setWorklogHoursInput('');
      setWorklogDescInput('');
      setShowWorklogForm(false);
      onIssueUpdated();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || '작업 시간 기록에 실패했습니다.');
    } finally {
      setIsLoggingWork(false);
    }
  };


  // Reply State Handlers

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const comment = await createComment(issue.id, newComment);
      // Direct State Update: GET 재조회 부하 없이 Response 객체로 로컬 갱신
      setComments((prev) => [...prev, { ...comment, children: comment.children || [] }]);
      setNewComment('');
      sendDesktopNotification({
        title: '새 댓글 등록',
        body: `#${issue.id} 이슈에 새 댓글이 등록되었습니다.`,
      });
      if (onIssueUpdated) onIssueUpdated();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || '댓글 작성 실패');
    }
  };

  const handleAddReply = async (parentId: number, e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    try {
      const childComment = await createComment(issue.id, replyContent, parentId);
      // Direct State Update: 상위 댓글의 children 배열에 즉시 대댓글 추가
      setComments((prev) =>
        prev.map((c) =>
          c.id === parentId
            ? { ...c, children: [...(c.children || []), childComment] }
            : c
        )
      );
      setReplyContent('');
      setReplyTargetId(null);
      if (onIssueUpdated) onIssueUpdated();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || '대댓글 작성 실패');
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!confirm('정말 이 댓글을 삭제하시겠습니까?')) return;
    try {
      await deleteComment(commentId);
      // Direct State Update: 로컬 state에서 부모/대댓글 모두 즉시 제거
      setComments((prev) =>
        prev
          .filter((c) => c.id !== commentId)
          .map((c) => ({
            ...c,
            children: c.children ? c.children.filter((sub) => sub.id !== commentId) : [],
          }))
      );
      if (onIssueUpdated) onIssueUpdated();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || '댓글 삭제 실패');
    }
  };

  const activeCustomDefs = customDefs.filter(
    (def) => !def.projectId || def.projectId === Number(projectId)
  );

  // 하위 댓글(대댓글)까지 모두 포함한 전체 댓글 수 계산
  const totalCommentsCount = comments.reduce(
    (acc, cur) => acc + 1 + (cur.children ? cur.children.length : 0),
    0
  );


  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {/* Navigation Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {isEditing ? (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => toggleEditing()}
              style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
              title="이슈 수정 취소 및 상세 보기 모드로 복귀"
            >
              <ArrowLeft size={13} /> 보기 모드로 돌아가기
            </button>
          ) : (
            <button
              className="btn btn-secondary btn-sm"
              onClick={onBack}
              style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
              title="직전 화면으로 돌아가기"
            >
              <ArrowLeft size={13} /> 뒤로가기
            </button>
          )}

          <button
            className="btn btn-secondary btn-sm"
            onClick={onGoToList || onBack}
            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
            title="이슈 칸반 보드 / 목록 화면으로 이동"
          >
            <Columns size={13} color="var(--primary)" /> 목록으로 돌아가기
          </button>
        </div>


        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={handleToggleLike}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '4px', color: isLiked ? '#f14c4c' : 'var(--text-sub)' }}
          >
            <Heart size={13} fill={isLiked ? '#f14c4c' : 'none'} /> 좋아요 ({likesCount})
          </button>

          {isAuthenticated && (
            <button
              onClick={() => toggleEditing()}
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Edit3 size={13} /> {isEditing ? '보기 모드' : '수정'}
            </button>
          )}


          {isAuthenticated && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="btn btn-secondary btn-sm"
              style={{ color: '#f14c4c', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Trash2 size={13} /> 삭제
            </button>
          )}
        </div>
      </div>

      {/* Main Detail & Edit Panel */}
      <div className="glass-panel" style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)' }}>
            #{issue.id}
          </span>
          <IssueTypeBadge type={issue.typeId || issue.type} size="sm" />
          <StatusBadge status={issue.statusId || issue.status} size="sm" />
          <PriorityBadge priority={issue.priorityId || issue.priority} size="sm" />
        </div>

        {!isEditing ? (
          /* ================= VIEW MODE PAGE ================= */
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '10px', color: 'var(--text-bright)' }}>
              {issue.title}
            </h2>


            {/* Main Metadata Badges */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '6px', marginBottom: '10px' }}>
              <div style={{ background: '#2d2d2d', border: '1px solid #3c3c3c', padding: '6px 10px', borderRadius: 'var(--radius-xs)' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                  <Layers size={11} style={{ display: 'inline', marginRight: '3px' }} /> 프로젝트
                </span>
                <span style={{ fontWeight: 600, color: 'var(--primary)', fontSize: '0.78rem' }}>
                  {issue.project?.name || `#${issue.projectId}`} ({issue.project?.key})
                </span>
              </div>

              <div style={{ background: '#2d2d2d', border: '1px solid #3c3c3c', padding: '6px 10px', borderRadius: 'var(--radius-xs)' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                  <UserIcon size={11} style={{ display: 'inline', marginRight: '3px' }} /> 담당자
                </span>
                <UserBadge user={issue.assignee} currentUserId={user?.id} size="sm" />
              </div>

              <div style={{ background: '#2d2d2d', border: '1px solid #3c3c3c', padding: '6px 10px', borderRadius: 'var(--radius-xs)' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                  <UserIcon size={11} style={{ display: 'inline', marginRight: '3px' }} /> 작성자 (보고자)
                </span>
                <UserBadge user={issue.author} currentUserId={user?.id} size="sm" fallbackText="작성자 정보 없음" />
              </div>

              <div style={{ background: '#2d2d2d', border: '1px solid #3c3c3c', padding: '6px 10px', borderRadius: 'var(--radius-xs)' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                  <Tag size={11} style={{ display: 'inline', marginRight: '3px' }} /> 우선순위
                </span>
                <PriorityBadge priority={issue.priorityId || issue.priority} size="sm" />
              </div>

              <div style={{ background: '#2d2d2d', border: '1px solid #3c3c3c', padding: '6px 10px', borderRadius: 'var(--radius-xs)' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                  <CheckCircle2 size={11} style={{ display: 'inline', marginRight: '3px' }} /> 진척도
                </span>
                <span style={{ fontWeight: 600, color: '#4ec9b0', fontSize: '0.78rem' }}>{issue.progress || 0}%</span>
              </div>
            </div>

            {/* Schedule & Due Date Panel */}
            <div style={{ background: '#2d2d2d', border: '1px solid #3c3c3c', padding: '8px 10px', borderRadius: 'var(--radius-xs)', marginBottom: '10px' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 600, marginBottom: '6px', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={13} /> 일정 및 기한
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '6px', fontSize: '0.75rem' }}>
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

            {/* Detailed Description */}
            <div style={{ marginBottom: '10px' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 600, marginBottom: '4px', color: 'var(--text-sub)' }}>
                상세 내용
              </div>
              <MarkdownViewer content={issue.description} placeholder="등록된 상세 설명이 없습니다." />
            </div>

            {/* Custom Fields Summary */}
            {Object.keys(customFieldsData).length > 0 && (
              <div style={{ background: '#2d2d2d', padding: '8px 10px', borderRadius: 'var(--radius-xs)', marginBottom: '10px', border: '1px solid #3c3c3c' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-sub)', marginBottom: '6px', fontWeight: 600 }}>
                  ⚙️ 커스텀 필드
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '6px' }}>
                  {Object.entries(customFieldsData).map(([k, val]) => (
                    <div key={k} style={{ background: '#252526', border: '1px solid #383838', padding: '4px 6px', borderRadius: '2px', fontSize: '0.75rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>{k}: </span>
                      <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{String(val)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Worklog & Time Tracking Panel */}
            <div style={{ background: '#2d2d2d', border: '1px solid #3c3c3c', padding: '8px 10px', borderRadius: 'var(--radius-xs)', marginTop: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', margin: 0 }}>
                  <Clock size={13} /> 작업 로그 및 소요 시간
                </div>
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
                    padding: '14px',
                    borderRadius: '8px',
                    marginBottom: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '10px' }}>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.78rem', marginBottom: '4px' }}>
                        소요 시간 (시간 단위)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        placeholder="예: 1.4 또는 5.5"
                        className="input-field"
                        value={worklogHoursInput}
                        onChange={(e) => setWorklogHoursInput(e.target.value)}
                        style={{ padding: '7px 10px', fontSize: '0.85rem' }}
                        required
                      />
                    </div>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.78rem', marginBottom: '4px' }}>
                        작업 내용 요약
                      </label>
                      <input
                        type="text"
                        placeholder="예: 작업 내용 및 진행 사항 기록"
                        className="input-field"
                        value={worklogDescInput}
                        onChange={(e) => setWorklogDescInput(e.target.value)}
                        style={{ padding: '7px 10px', fontSize: '0.85rem' }}
                      />
                    </div>
                  </div>

                  {worklogHoursInput && !isNaN(parseFloat(worklogHoursInput)) && parseFloat(worklogHoursInput) > 0 && (
                    <div style={{ fontSize: '0.78rem', color: '#06b6d4' }}>
                      💡 <strong>{worklogHoursInput}시간</strong> 입력 ➔ DB에 <strong>{hoursToMinutes(parseFloat(worklogHoursInput))}분</strong>으로 자동 환산되어 저장됩니다.
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setShowWorklogForm(false)}
                      style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                    >
                      취소
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary btn-sm"
                      disabled={isLoggingWork}
                      style={{ padding: '4px 14px', fontSize: '0.8rem' }}
                    >
                      {isLoggingWork ? '저장 중...' : '작업 시간 저장'}
                    </button>
                  </div>
                </form>
              )}

              {/* Worklogs List */}
              <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {worklogs.length === 0 ? (
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textAlign: 'center', padding: '10px' }}>
                    기록된 작업 시간이 없습니다.
                  </div>
                ) : (
                  worklogs.map((w) => (
                    <div
                      key={w.id}
                      style={{
                        background: 'rgba(0,0,0,0.2)',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.85rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 700, color: 'var(--secondary)' }}>
                          {formatWorklogTime(w.timeSpent)}
                        </span>
                        <span style={{ color: 'var(--text-sub)' }}>
                          {w.description ? `- ${w.description}` : ''}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        <UserBadge user={w.user} currentUserId={user?.id} size="sm" />
                        <span>{new Date(w.createdAt).toLocaleDateString('ko-KR')}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : (
          /* ================= EDIT MODE FORM ================= */
          <form onSubmit={handleSaveIssue}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px', color: 'var(--primary)' }}>
              ✏️ 이슈 정보 수정 (Edit Form)
            </h3>

            <div className="form-group">
              <label className="form-label">이슈 제목 (Title)</label>
              <input
                type="text"
                className="input-field"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            {!canEditRestrictedFields && (
              <div
                style={{
                  fontSize: '0.82rem',
                  color: '#f59e0b',
                  background: 'rgba(245, 158, 11, 0.1)',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  marginBottom: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Lock size={14} /> 소속 프로젝트 이동, 이슈 유형, 우선순위 변경은 프로젝트 Owner 또는 작성자만 가능합니다.
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  소속 프로젝트 {!canEditRestrictedFields && <Lock size={12} color="#f59e0b" />}
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
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
                  ).map((u) => (
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

            <div className="form-group">
              <label className="form-label">상세 설명 (Markdown Description)</label>
              <MarkdownEditor value={description} onChange={setDescription} rows={8} minHeight="180px" />
            </div>

            {/* Schedule Dates Inputs */}
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '8px', marginBottom: '20px', border: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '6px' }}>
                <h4 style={{ fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                  <Calendar size={16} /> 일정 및 기한 설정 (Schedule & Due Date)
                </h4>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  ※ 시, 분, 초는 기록하지 않고 일(YYYY-MM-DD) 단위로 관리됩니다.
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.82rem' }}>시작 계획일 (Planned Start)</label>
                  <input
                    type="date"
                    className="input-field"
                    value={plannedStartDate}
                    onChange={(e) => setPlannedStartDate(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.82rem', color: '#06b6d4', fontWeight: 700 }}>
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
                  <label className="form-label" style={{ fontSize: '0.82rem' }}>실제 시작일 (Actual Start)</label>
                  <input
                    type="date"
                    className="input-field"
                    value={actualStartDate}
                    onChange={(e) => setActualStartDate(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.82rem' }}>실제 종료일 (Actual End)</label>
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
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-light)', padding: '16px', borderRadius: '8px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ fontSize: '0.92rem', color: 'var(--accent-cyan)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                  <Clock size={16} /> 작업 로그 및 투입 시간 (Worklogs)
                </h4>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '3px 10px', borderRadius: '4px' }}>
                  총 누적: {((worklogs.reduce((acc, cur) => acc + (cur.timeSpent || 0), 0)) / 60).toFixed(1).replace(/\.0$/, '')}시간 ({worklogs.reduce((acc, cur) => acc + (cur.timeSpent || 0), 0)}분)
                </span>
              </div>

              <div
                style={{
                  background: 'rgba(6, 182, 212, 0.05)',
                  border: '1px solid rgba(6, 182, 212, 0.25)',
                  padding: '12px',
                  borderRadius: '8px',
                  marginBottom: '10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr auto', gap: '10px', alignItems: 'flex-end' }}>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.78rem', marginBottom: '4px' }}>
                      소요 시간 (시간 단위)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      placeholder="예: 1.4 또는 5.5"
                      className="input-field"
                      value={worklogHoursInput}
                      onChange={(e) => setWorklogHoursInput(e.target.value)}
                      style={{ padding: '7px 10px', fontSize: '0.85rem' }}
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.78rem', marginBottom: '4px' }}>
                      작업 내용 요약
                    </label>
                    <input
                      type="text"
                      placeholder="예: 백엔드 API 연동 및 버그 수정"
                      className="input-field"
                      value={worklogDescInput}
                      onChange={(e) => setWorklogDescInput(e.target.value)}
                      style={{ padding: '7px 10px', fontSize: '0.85rem' }}
                    />
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    disabled={isLoggingWork || !worklogHoursInput}
                    onClick={handleAddWorklog}
                    style={{ height: '38px', padding: '0 14px', fontSize: '0.8rem' }}
                  >
                    {isLoggingWork ? '저장 중...' : '시간 기록'}
                  </button>
                </div>

                {worklogHoursInput && !isNaN(parseFloat(worklogHoursInput)) && parseFloat(worklogHoursInput) > 0 && (
                  <div style={{ fontSize: '0.78rem', color: '#06b6d4' }}>
                    💡 <strong>{worklogHoursInput}시간</strong> 입력 ➔ DB에 <strong>{hoursToMinutes(parseFloat(worklogHoursInput))}분</strong>으로 자동 환산되어 저장됩니다.
                  </div>
                )}
              </div>
            </div>

            {/* Custom Fields Input Section */}
            {activeCustomDefs.length > 0 && (
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '8px', marginBottom: '20px' }}>
                <h4 style={{ fontSize: '0.9rem', color: 'var(--primary)', marginBottom: '12px', fontWeight: 700 }}>
                  ⚙️ 커스텀 필드 내용 입력 (Custom Fields)
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
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

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => toggleEditing(false)}
                disabled={isPending}
                style={{ flex: 1 }}
              >
                취소
              </button>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={isPending}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                {isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                수정 사항 저장하기
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Comments Section (YouTube Style Flat Thread) */}
      <div style={{ background: '#252526', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-xs)', padding: '14px 16px' }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-bright)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <MessageSquare size={14} color="var(--primary)" />
          <span>댓글 {totalCommentsCount}개</span>

        </div>

        {/* Top New Comment Input (YouTube style input with Avatar) */}
        {isAuthenticated ? (
          <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '20px' }}>
            <Avatar user={user} size={28} shape="circle" style={{ marginTop: '2px' }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
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
                style={{
                  resize: 'vertical',
                  minHeight: '36px',
                  background: '#1e1e1e',
                  border: '1px solid #3c3c3c',
                  borderRadius: 'var(--radius-xs)',
                  padding: '6px 10px',
                  fontSize: '0.8rem',
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                {newComment.trim() && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setNewComment('')}
                    style={{ fontSize: '0.72rem' }}
                  >
                    취소
                  </button>
                )}
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={!newComment.trim()}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem' }}
                >
                  <Send size={11} /> 댓글
                </button>
              </div>
            </div>
          </form>
        ) : (
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '16px', padding: '6px 0', borderBottom: '1px solid #383838' }}>
            댓글을 작성하려면 로그인하세요.
          </div>
        )}

        {/* Comment Thread List (Flat Text) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {comments.length === 0 ? (
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>
              등록된 댓글이 없습니다.
            </div>
          ) : (
            comments.map((c) => {
              const isMyComment = Boolean(user && (user.id === c.authorId || user.id === c.author?.id));
              const isReplying = replyTargetId === c.id;
              const authorName = c.author?.name || c.author?.email || (isMyComment ? (user?.name || user?.email) : `유저 #${c.authorId}`);

              return (
                <div key={c.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {/* Main Parent Comment Item (YouTube Style) */}
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    {/* Author Avatar (Circle) */}
                    <Avatar
                      user={c.author || (isMyComment ? user : null)}
                      name={authorName}
                      size={26}
                      shape="circle"
                      style={{ marginTop: '2px' }}
                    />

                    {/* Comment Body & Header */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: isMyComment ? '#9cdcfe' : 'var(--text-bright)' }}>
                            {authorName || '사용자'}

                          </span>
                          {isMyComment && (
                            <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#9cdcfe', background: 'rgba(0,122,204,0.15)', padding: '0 4px', borderRadius: '2px' }}>
                              작성자
                            </span>
                          )}
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                            {new Date(c.createdAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        {/* Action buttons (Delete) */}
                        {isAuthenticated && isMyComment && (
                          <button
                            onClick={() => handleDeleteComment(c.id)}
                            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
                            onMouseEnter={(e) => e.currentTarget.style.color = '#f14c4c'}
                            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                            title="댓글 삭제"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>

                      {/* Plain Text Content */}
                      <div style={{ fontSize: '0.8rem', lineHeight: '1.45', color: 'var(--text-main)', whiteSpace: 'pre-wrap' }}>
                        {c.content}
                      </div>

                      {/* Reply Button Action */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                        {isAuthenticated && (
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
                              gap: '3px',
                              fontSize: '0.72rem',
                              fontWeight: 500,
                              padding: '2px 0',
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-bright)'}
                            onMouseLeave={(e) => e.currentTarget.style.color = isReplying ? 'var(--accent-cyan)' : 'var(--text-sub)'}
                          >
                            <Reply size={11} /> 답글
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Inline Reply Input Form */}
                  {isReplying && (
                    <form
                      onSubmit={(e) => handleAddReply(c.id, e)}
                      style={{
                        marginLeft: '36px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        padding: '6px 8px',
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
                        style={{ resize: 'vertical', minHeight: '32px', fontSize: '0.78rem', background: '#252526' }}
                      />
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '4px' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => setReplyTargetId(null)}
                          style={{ height: '22px', fontSize: '0.7rem' }}
                        >
                          취소
                        </button>
                        <button
                          type="submit"
                          className="btn btn-primary btn-sm"
                          disabled={!replyContent.trim()}
                          style={{ height: '22px', fontSize: '0.7rem' }}
                        >
                          답글
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Child Nested Replies (YouTube Style Flat Indented Thread) */}
                  {c.children && c.children.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginLeft: '36px', marginTop: '4px' }}>
                      {c.children.map((sub) => {
                        const isMySub = Boolean(user && (user.id === sub.authorId || user.id === sub.author?.id));
                        const subAuthorName = sub.author?.name || sub.author?.email || (isMySub ? (user?.name || user?.email) : `유저 #${sub.authorId}`);

                        return (
                          <div key={sub.id} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                            <Avatar
                              user={sub.author || (isMySub ? user : null)}
                              name={subAuthorName}
                              size={22}
                              shape="circle"
                              style={{ marginTop: '2px' }}
                            />

                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: isMySub ? '#9cdcfe' : 'var(--text-bright)' }}>
                                    {subAuthorName || '사용자'}
                                  </span>

                                  {isMySub && (
                                    <span style={{ fontSize: '0.58rem', fontWeight: 700, color: '#9cdcfe', background: 'rgba(0,122,204,0.15)', padding: '0 3px', borderRadius: '2px' }}>
                                      작성자
                                    </span>
                                  )}
                                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
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
                                    <Trash2 size={11} />
                                  </button>
                                )}
                              </div>

                              <div style={{ fontSize: '0.78rem', lineHeight: '1.4', color: 'var(--text-main)', whiteSpace: 'pre-wrap' }}>
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


      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="이슈 삭제 확인"
        message={`이슈 #${issue.id} ('${issue.title}')를 정말 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`}
        confirmText="이슈 삭제"
        onConfirm={handleConfirmDeleteIssue}
        onClose={() => setShowDeleteConfirm(false)}
        loading={isPending}
      />

      <ActionFeedbackModal state={errorState} onClose={closeErrorModal} />
    </div>
  );
};
