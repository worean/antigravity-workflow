import React, { useState, useEffect } from 'react';
import type { Project, User, Issue, CustomFieldDefinition, Comment } from '../types';
import {
  createIssue,
  updateIssue,
  deleteIssue,
  getUsers,
  getComments,
  createComment,
  deleteComment,
  getCustomFields,
  toggleLikeIssue,
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import { X, PlusCircle, MessageSquare, Send, Heart, Trash2, Edit3, Lock, Loader2 } from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';
import { useActionFeedback } from '../hooks/useActionFeedback';
import { ActionFeedbackModal } from './ActionFeedbackModal';

interface IssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  selectedIssue?: Issue | null;
  onSuccess: () => void;
}

export const IssueModal: React.FC<IssueModalProps> = ({
  isOpen,
  onClose,
  projects,
  selectedIssue,
  onSuccess,
}) => {
  const { user, isAuthenticated } = useAuth();
  const { isPending, errorState, closeErrorModal, executeAction } = useActionFeedback();

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [projectId, setProjectId] = useState<number>(projects[0]?.id || 1);
  const [assigneeId, setAssigneeId] = useState<number | undefined>(undefined);
  const [priorityId, setPriorityId] = useState<number>(1);
  const [statusId, setStatusId] = useState<number>(1);
  const [typeId, setTypeId] = useState<number>(1);
  const [progress, setProgress] = useState<number>(0);
  const [customFieldsData, setCustomFieldsData] = useState<Record<string, any>>({});

  const [users, setUsers] = useState<User[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState<string>('');
  const [customDefs, setCustomDefs] = useState<CustomFieldDefinition[]>([]);

  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [likesCount, setLikesCount] = useState<number>(0);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);

  const selectedProj = projects.find((p) => p.id === (selectedIssue?.projectId || projectId));
  const canEditRestrictedFields =
    !selectedIssue ||
    Boolean(
      user &&
        (selectedProj?.ownerId === user.id ||
          selectedIssue.authorId === user.id ||
          selectedIssue.author?.id === user.id)
    );

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

  useEffect(() => {
    if (selectedIssue && isOpen) {
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
      setIsLiked(!!selectedIssue.isLiked);
      setLikesCount(selectedIssue.likesCount || 0);

      const fetchCommentsData = async () => {
        try {
          const cList = await getComments(selectedIssue.id);
          setComments(cList);
        } catch (err) {
          console.error(err);
        }
      };
      fetchCommentsData();
    } else if (isOpen) {
      setIsEditing(true);
      setTitle('');
      setDescription('');
      setProjectId(projects[0]?.id || 1);
      setAssigneeId(undefined);
      setPriorityId(1);
      setStatusId(1);
      setTypeId(1);
      setProgress(0);
      setCustomFieldsData({});
      setComments([]);
    }
  }, [selectedIssue, isOpen, projects]);

  if (!isOpen) return null;

  const isViewMode = !!selectedIssue && !isEditing;

  const handleToggleLike = async () => {
    if (!selectedIssue || !isAuthenticated) return alert('로그인이 필요합니다.');
    try {
      const res = await toggleLikeIssue(selectedIssue.id);
      setIsLiked(res.isLiked);
      setLikesCount(res.likesCount);
      onSuccess();
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
          onSuccess();
          onClose();
        },
      }
    );
  };

  const handleSaveIssue = async (e: React.FormEvent) => {
    e.preventDefault();

    await executeAction(
      async () => {
        if (selectedIssue) {
          return await updateIssue(selectedIssue.id, {
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
        } else {
          return await createIssue({
            title,
            description,
            projectId: Number(projectId),
            assigneeId: assigneeId ? Number(assigneeId) : undefined,
            priorityId: Number(priorityId),
            statusId: Number(statusId),
            typeId: Number(typeId),
            customFields: customFieldsData,
          });
        }
      },
      {
        onSuccess: () => {
          setIsEditing(false);
          onSuccess();
          if (!selectedIssue) onClose();
        },
      }
    );
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedIssue) return;

    try {
      const comment = await createComment(selectedIssue.id, newComment);
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
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" style={{ maxWidth: '680px' }} onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              {selectedIssue ? (
                <>
                  <span style={{ color: 'var(--primary)' }}>#{selectedIssue.id}</span>
                  {isEditing ? '이슈 정보 수정 (Edit Issue)' : selectedIssue.title}
                </>
              ) : (
                <>
                  <PlusCircle size={20} color="var(--primary)" /> 새 이슈 작성 (Create Issue)
                </>
              )}
            </h2>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {selectedIssue && !isEditing && (
                <>
                  <button
                    onClick={handleToggleLike}
                    className="btn btn-secondary btn-sm"
                    style={{ display: 'flex', alignItems: 'center', gap: '4px', color: isLiked ? '#f43f5e' : 'var(--text-sub)' }}
                  >
                    <Heart size={16} fill={isLiked ? '#f43f5e' : 'none'} /> {likesCount}
                  </button>
                  {isAuthenticated && (
                    <button onClick={() => setIsEditing(true)} className="btn btn-secondary btn-sm">
                      <Edit3 size={14} /> 수정
                    </button>
                  )}
                  {isAuthenticated && (
                    <button onClick={() => setShowDeleteConfirm(true)} className="btn btn-secondary btn-sm" style={{ color: '#f43f5e' }}>
                      <Trash2 size={14} /> 삭제
                    </button>
                  )}
                </>
              )}
              <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-sub)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
          </div>

          {isViewMode ? (
            <div>
              <div
                style={{
                  padding: '14px',
                  background: 'rgba(15, 23, 42, 0.6)',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: '16px',
                  fontSize: '0.95rem',
                  color: 'var(--text-main)',
                  minHeight: '70px',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {selectedIssue.description || '작성된 상세 설명이 없습니다.'}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px', fontSize: '0.82rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>프로젝트: </span>
                  <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{selectedProj?.name || `#${selectedIssue.projectId}`}</span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px', fontSize: '0.82rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>담당자: </span>
                  <span style={{ fontWeight: 600 }}>{selectedIssue.assignee?.name || selectedIssue.assignee?.email || '미지정'}</span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px', fontSize: '0.82rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>진척도: </span>
                  <span style={{ fontWeight: 600, color: '#10b981' }}>{selectedIssue.progress || 0}%</span>
                </div>
              </div>

              {Object.keys(customFieldsData).length > 0 && (
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
                  <h4 style={{ fontSize: '0.85rem', color: 'var(--text-sub)', marginBottom: '8px', fontWeight: 600 }}>
                    ⚙️ 커스텀 필드 정보 (Custom Fields)
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.82rem' }}>
                    {Object.entries(customFieldsData).map(([k, val]) => (
                      <div key={k} style={{ background: 'rgba(0,0,0,0.2)', padding: '6px 10px', borderRadius: '4px' }}>
                        <span style={{ color: 'var(--text-muted)' }}>{k}: </span>
                        <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{String(val)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '16px' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MessageSquare size={16} color="var(--primary)" /> 댓글 목록 ({comments.length})
                </h3>

                <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
                  {comments.length === 0 ? (
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textAlign: 'center', padding: '12px' }}>
                      등록된 댓글이 없습니다.
                    </div>
                  ) : (
                    comments.map((c) => (
                      <div
                        key={c.id}
                        style={{
                          background: 'rgba(255, 255, 255, 0.04)',
                          padding: '10px 12px',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.85rem',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', color: 'var(--text-sub)' }}>
                          <span style={{ fontWeight: 600, color: 'var(--primary)' }}>
                          {c.author?.name || c.author?.email || (user?.id === c.authorId ? (user.name || user.email) : `유저 #${c.authorId}`)}
                        </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '0.75rem' }}>{new Date(c.createdAt).toLocaleString('ko-KR')}</span>
                            {isAuthenticated && (user?.id === c.authorId || user?.id === c.author?.id) && (
                              <button
                                onClick={() => handleDeleteComment(c.id)}
                                style={{ background: 'none', border: 'none', color: '#f43f5e', cursor: 'pointer' }}
                                title="댓글 삭제"
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>
                        </div>
                        <div>{c.content}</div>
                      </div>
                    ))
                  )}
                </div>

                {isAuthenticated && (
                  <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="댓글을 작성하세요..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                    />
                    <button type="submit" className="btn btn-primary btn-sm">
                      <Send size={16} />
                    </button>
                  </form>
                )}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSaveIssue}>
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '12px' }}>
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
                  rows={3}
                  placeholder="해당 이슈의 작업 세부사항을 기술하세요..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

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
