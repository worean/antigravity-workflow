import React, { useState, useEffect } from 'react';
import type { Project, User, Issue, CustomFieldDefinition, Comment } from '../types';
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
} from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';
import { useActionFeedback } from '../hooks/useActionFeedback';
import { ActionFeedbackModal } from '../components/ActionFeedbackModal';

interface IssueDetailPageProps {
  issueId: number | null;
  onBack: () => void;
  onIssueUpdated: () => void;
}

export const IssueDetailPage: React.FC<IssueDetailPageProps> = ({ issueId, onBack, onIssueUpdated }) => {
  const { user, isAuthenticated } = useAuth();
  const { isPending, errorState, closeErrorModal, executeAction } = useActionFeedback();

  const [issue, setIssue] = useState<Issue | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [customDefs, setCustomDefs] = useState<CustomFieldDefinition[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Form Editing States
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [projectId, setProjectId] = useState<number>(1);
  const [assigneeId, setAssigneeId] = useState<number | undefined>(undefined);
  const [priorityId, setPriorityId] = useState<number>(1);
  const [statusId, setStatusId] = useState<number>(1);
  const [typeId, setTypeId] = useState<number>(1);
  const [progress, setProgress] = useState<number>(0);
  const [customFieldsData, setCustomFieldsData] = useState<Record<string, any>>({});

  const [newComment, setNewComment] = useState<string>('');
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [likesCount, setLikesCount] = useState<number>(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);

  // Fetch issue details & metadata
  const loadIssueData = async () => {
    if (!issueId) return;
    setLoading(true);
    try {
      const [issueData, pList, uList, cfList, cList] = await Promise.all([
        getIssue(issueId),
        getProjects(),
        getUsers(),
        getCustomFields(),
        getComments(issueId),
      ]);

      setIssue(issueData);
      setProjects(pList);
      setUsers(uList);
      setCustomDefs(cfList);
      setComments(cList);

      // Bind form state
      setTitle(issueData.title || '');
      setDescription(issueData.description || '');
      setProjectId(issueData.projectId || pList[0]?.id || 1);
      setAssigneeId(issueData.assigneeId || issueData.assignee?.id || undefined);
      setPriorityId(issueData.priorityId || issueData.priority?.id || 1);
      setStatusId(issueData.statusId || issueData.status?.id || 1);
      setTypeId(issueData.typeId || issueData.type?.id || 1);
      setProgress(issueData.progress || 0);
      setCustomFieldsData(
        typeof issueData.customFields === 'string'
          ? JSON.parse(issueData.customFields)
          : issueData.customFields || {}
      );
      setIsLiked(!!issueData.isLiked);
      setLikesCount(issueData.likesCount || 0);
    } catch (err) {
      console.error(err);
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
        <p style={{ color: '#f43f5e' }}>이슈 정보를 찾을 수 없습니다.</p>
        <button className="btn btn-secondary" onClick={onBack} style={{ marginTop: '16px' }}>
          <ArrowLeft size={16} /> 이슈 목록으로 돌아가기
        </button>
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
        });
      },
      {
        onSuccess: (updated) => {
          setIssue(updated);
          setIsEditing(false);
          onIssueUpdated();
        },
      }
    );
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const comment = await createComment(issue.id, newComment);
      setComments((prev) => [...prev, comment]);
      setNewComment('');
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || '댓글 작성 실패');
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!confirm('이 댓글을 삭제하시겠습니까?')) return;
    try {
      await deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err: any) {
      alert(err.response?.data?.error || '댓글 삭제 실패');
    }
  };

  const activeCustomDefs = customDefs.filter(
    (def) => !def.projectId || def.projectId === Number(projectId)
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Navigation Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <button
          className="btn btn-secondary"
          onClick={onBack}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <ArrowLeft size={16} /> 목록으로 돌아가기
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={handleToggleLike}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', color: isLiked ? '#f43f5e' : 'var(--text-sub)' }}
          >
            <Heart size={18} fill={isLiked ? '#f43f5e' : 'none'} /> 좋아요 ({likesCount})
          </button>

          {isAuthenticated && (
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Edit3 size={16} /> {isEditing ? '보기 모드로 전환' : '이슈 정보 수정'}
            </button>
          )}

          {isAuthenticated && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="btn btn-secondary"
              style={{ color: '#f43f5e', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Trash2 size={16} /> 삭제
            </button>
          )}
        </div>
      </div>

      {/* Main Detail & Edit Panel */}
      <div className="glass-panel" style={{ padding: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--primary)' }}>
            #{issue.id}
          </span>
          <span style={{ fontSize: '0.8rem', background: 'rgba(99, 102, 241, 0.2)', padding: '2px 8px', borderRadius: '4px', color: 'var(--primary)' }}>
            {issue.type?.name || 'Task'}
          </span>
          <span style={{ fontSize: '0.8rem', background: 'rgba(16, 185, 129, 0.2)', padding: '2px 8px', borderRadius: '4px', color: '#10b981' }}>
            {issue.status?.name || 'TODO'}
          </span>
        </div>

        {!isEditing ? (
          /* ================= VIEW MODE PAGE ================= */
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '16px', color: 'var(--text-main)' }}>
              {issue.title}
            </h1>

            {/* Main Metadata Badges */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '24px' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px 16px', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  <Layers size={14} style={{ display: 'inline', marginRight: '4px' }} /> 소속 프로젝트
                </span>
                <span style={{ fontWeight: 700, color: 'var(--primary)' }}>
                  {issue.project?.name || `#${issue.projectId}`} ({issue.project?.key})
                </span>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px 16px', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  <UserIcon size={14} style={{ display: 'inline', marginRight: '4px' }} /> 담당자 (Assignee)
                </span>
                <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                  {issue.assignee?.name || issue.assignee?.email || '미지정'}
                </span>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px 16px', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  <Tag size={14} style={{ display: 'inline', marginRight: '4px' }} /> 우선순위
                </span>
                <span style={{ fontWeight: 700, color: issue.priority?.color || 'var(--text-main)' }}>
                  {issue.priority?.name || 'Medium'}
                </span>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px 16px', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  <CheckCircle2 size={14} style={{ display: 'inline', marginRight: '4px' }} /> 작업 진척도
                </span>
                <span style={{ fontWeight: 700, color: '#10b981' }}>{issue.progress || 0}% 완료</span>
              </div>
            </div>

            {/* Detailed Description */}
            <div style={{ marginBottom: '28px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-sub)' }}>
                📝 상세 내용 (Description)
              </h3>
              <div
                style={{
                  padding: '20px',
                  background: 'rgba(15, 23, 42, 0.6)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-light)',
                  fontSize: '0.98rem',
                  lineHeight: '1.6',
                  color: 'var(--text-main)',
                  minHeight: '120px',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {issue.description || '등록된 세부 설명이 없습니다.'}
              </div>
            </div>

            {/* Custom Fields Summary */}
            {Object.keys(customFieldsData).length > 0 && (
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', marginBottom: '28px', border: '1px solid var(--border-light)' }}>
                <h4 style={{ fontSize: '0.9rem', color: 'var(--primary)', marginBottom: '12px', fontWeight: 700 }}>
                  ⚙️ 커스텀 필드 데이터 (Custom Fields)
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '10px' }}>
                  {Object.entries(customFieldsData).map(([k, val]) => (
                    <div key={k} style={{ background: 'rgba(0,0,0,0.25)', padding: '8px 12px', borderRadius: '6px', fontSize: '0.88rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>{k}: </span>
                      <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{String(val)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
                <select
                  className="input-field"
                  value={typeId}
                  onChange={(e) => setTypeId(Number(e.target.value))}
                  disabled={!canEditRestrictedFields}
                >
                  <option value={1}>작업 (Task)</option>
                  <option value={2}>버그 (Bug)</option>
                  <option value={3}>에픽 (Epic)</option>
                  <option value={4}>스토리 (Story)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  우선순위 {!canEditRestrictedFields && <Lock size={12} color="#f59e0b" />}
                </label>
                <select
                  className="input-field"
                  value={priorityId}
                  onChange={(e) => setPriorityId(Number(e.target.value))}
                  disabled={!canEditRestrictedFields}
                >
                  <option value={1}>낮음 (Low)</option>
                  <option value={2}>보통 (Medium)</option>
                  <option value={3}>높음 (High)</option>
                  <option value={4}>긴급 (Urgent)</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div className="form-group">
                <label className="form-label">상태 (Status)</label>
                <select
                  className="input-field"
                  value={statusId}
                  onChange={(e) => setStatusId(Number(e.target.value))}
                >
                  <option value={1}>할 일 (TODO)</option>
                  <option value={2}>진행 중 (IN_PROGRESS)</option>
                  <option value={3}>검토 중 (IN_REVIEW)</option>
                  <option value={4}>완료 (DONE)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">담당자 (Assignee)</label>
                <select
                  className="input-field"
                  value={assigneeId || ''}
                  onChange={(e) => setAssigneeId(e.target.value ? Number(e.target.value) : undefined)}
                >
                  <option value="">미지정 (Unassigned)</option>
                  {users.map((u) => (
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
              <label className="form-label">상세 설명 (Description)</label>
              <textarea
                className="input-field"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
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
                onClick={() => setIsEditing(false)}
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

      {/* Comments Section */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MessageSquare size={18} color="var(--primary)" /> 댓글 (Comments) ({comments.length})
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
          {comments.length === 0 ? (
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0' }}>
              등록된 댓글이 없습니다. 첫 의견을 남겨보세요!
            </div>
          ) : (
            comments.map((c) => (
              <div
                key={c.id}
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  padding: '14px 16px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.9rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', color: 'var(--text-sub)' }}>
                  <span style={{ fontWeight: 700, color: 'var(--primary)' }}>
                    {c.author?.name || c.author?.email || (user?.id === c.authorId ? (user.name || user.email) : `유저 #${c.authorId}`)}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '0.78rem' }}>{new Date(c.createdAt).toLocaleString('ko-KR')}</span>
                    {isAuthenticated && (user?.id === c.authorId || user?.id === c.author?.id) && (
                      <button
                        onClick={() => handleDeleteComment(c.id)}
                        style={{ background: 'none', border: 'none', color: '#f43f5e', cursor: 'pointer' }}
                        title="댓글 삭제"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
                <div style={{ lineHeight: '1.5' }}>{c.content}</div>
              </div>
            ))
          )}
        </div>

        {isAuthenticated && (
          <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              className="input-field"
              placeholder="댓글을 작성하세요..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            <button type="submit" className="btn btn-primary" style={{ padding: '0 20px' }}>
              <Send size={16} /> 댓글 등록
            </button>
          </form>
        )}
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
