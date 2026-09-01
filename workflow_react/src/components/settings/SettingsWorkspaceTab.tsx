import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Shield,
  UserPlus,
  Trash2,
  Edit2,
  Check,
  UserMinus,
  AlertTriangle,
  Layers,
  Plus,
  Copy,
  Clock,
  KeyRound,
} from 'lucide-react';
import { useWorkspace } from '@/context/WorkspaceContext';
import {
  getWorkspaceDetail,
  updateWorkspace,
  deleteWorkspace,
  removeWorkspaceMember,
  inviteWorkspaceMember,
  getWorkspaceInvitations,
  deleteWorkspaceInvitation,
  workspaceKeys,
} from '@/api/workspaces';
import { Avatar } from '@/components/common';
import { WorkspaceInviteModal, WorkspaceCreateModal } from '@/components/workspace';
import type { WorkspaceRole } from '@/types';

const DEFAULT_ICONS = ['🚀', '🏢', '⚡', '🌟', '💻', '🎯', '🔥', '🛡️', '📦', '🔬'];

export const SettingsWorkspaceTab: React.FC = () => {
  const { currentWorkspace, switchWorkspace, workspaces, refetchWorkspaces } = useWorkspace();
  const queryClient = useQueryClient();

  // 1. 워크스페이스 상세 및 멤버 쿼리
  const {
    data: detail,
    refetch: refetchDetail,
  } = useQuery({
    queryKey: workspaceKeys.detail(currentWorkspace?.id || 0),
    queryFn: () => getWorkspaceDetail(currentWorkspace!.id),
    enabled: !!currentWorkspace?.id,
  });

  // 2. 대기 중인 초대 목록 쿼리
  const {
    data: invitations = [],
    refetch: refetchInvitations,
  } = useQuery({
    queryKey: workspaceKeys.invitations(currentWorkspace?.id || 0),
    queryFn: () => getWorkspaceInvitations(currentWorkspace!.id),
    enabled: !!currentWorkspace?.id,
  });

  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editIcon, setEditIcon] = useState('🏢');

  // Modals & Feedback
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (detail) {
      setEditName(detail.name);
      setEditDescription(detail.description || '');
      setEditIcon(detail.icon || '🏢');
    }
  }, [detail]);

  const isOwnerOrAdmin = currentWorkspace?.myRole === 'OWNER' || currentWorkspace?.myRole === 'ADMIN';
  const isOwner = currentWorkspace?.myRole === 'OWNER';

  // 워크스페이스 정보 수정
  const updateMutation = useMutation({
    mutationFn: (data: { name: string; description?: string; icon?: string }) =>
      updateWorkspace(currentWorkspace!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workspaceKeys.all });
      refetchWorkspaces();
      setIsEditing(false);
      setActionSuccess('워크스페이스 정보가 성공적으로 저장되었습니다.');
      setTimeout(() => setActionSuccess(null), 3000);
    },
    onError: (err: any) => {
      setActionError(err.response?.data?.error || err.message || '수정에 실패했습니다.');
    },
  });

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;
    updateMutation.mutate({
      name: editName.trim(),
      description: editDescription.trim() || undefined,
      icon: editIcon,
    });
  };

  // 멤버 역할 변경
  const handleRoleChange = async (userId: number, newRole: WorkspaceRole) => {
    try {
      setActionError(null);
      await inviteWorkspaceMember(currentWorkspace!.id, { userId, role: newRole });
      refetchDetail();
      setActionSuccess('멤버 역할이 변경되었습니다.');
      setTimeout(() => setActionSuccess(null), 2500);
    } catch (err: any) {
      setActionError(err.response?.data?.error || err.message || '역할 변경에 실패했습니다.');
    }
  };

  // 멤버 제거/추방
  const handleRemoveMember = async (userId: number, memberName: string) => {
    if (!window.confirm(`정말로 '${memberName}' 멤버를 워크스페이스에서 제외하시겠습니까?`)) return;

    try {
      setActionError(null);
      await removeWorkspaceMember(currentWorkspace!.id, userId);
      refetchDetail();
      setActionSuccess('멤버가 워크스페이스에서 제외되었습니다.');
      setTimeout(() => setActionSuccess(null), 2500);
    } catch (err: any) {
      setActionError(err.response?.data?.error || err.message || '멤버 제외에 실패했습니다.');
    }
  };

  // 초대 링크 복사
  const handleCopyInviteLink = (token: string) => {
    const link = `${window.location.origin}/#/invite?token=${token}`;
    navigator.clipboard.writeText(link);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  // 초대 취소/삭제
  const handleDeleteInvitation = async (invitationId: number) => {
    try {
      setActionError(null);
      await deleteWorkspaceInvitation(currentWorkspace!.id, invitationId);
      refetchInvitations();
      setActionSuccess('초대장이 취소되었습니다.');
      setTimeout(() => setActionSuccess(null), 2500);
    } catch (err: any) {
      setActionError(err.response?.data?.error || err.message || '초대 취소에 실패했습니다.');
    }
  };

  // 워크스페이스 삭제
  const handleDeleteWorkspace = async () => {
    if (
      !window.confirm(
        `[위험] '${currentWorkspace?.name}' 워크스페이스와 연계된 모든 프로젝트, 일감, 채팅 및 물리 데이터베이스 파일이 영구 삭제됩니다.\n정말로 삭제하시겠습니까?`
      )
    )
      return;

    try {
      setActionError(null);
      await deleteWorkspace(currentWorkspace!.id);
      queryClient.invalidateQueries();
      const remainings = workspaces.filter((w) => w.id !== currentWorkspace?.id);
      if (remainings.length > 0) {
        switchWorkspace(remainings[0].id);
      } else {
        window.location.reload();
      }
    } catch (err: any) {
      setActionError(err.response?.data?.error || err.message || '워크스페이스 삭제에 실패했습니다.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '850px' }}>
      {/* Notifications */}
      {actionError && (
        <div
          style={{
            padding: '8px 12px',
            fontSize: '0.78rem',
            backgroundColor: 'rgba(241, 76, 76, 0.15)',
            border: '1px solid var(--accent-rose)',
            color: '#ff8080',
            borderRadius: 'var(--radius-xs)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <AlertTriangle size={14} />
          <span>{actionError}</span>
        </div>
      )}
      {actionSuccess && (
        <div
          style={{
            padding: '8px 12px',
            fontSize: '0.78rem',
            backgroundColor: 'rgba(78, 201, 176, 0.15)',
            border: '1px solid var(--secondary)',
            color: 'var(--secondary)',
            borderRadius: 'var(--radius-xs)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Check size={14} />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* 1. 🏢 My Workspaces Switcher Grid */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-xs)',
          padding: '14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={16} color="var(--primary)" />
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-bright)' }}>
              참여 워크스페이스 목록 ({workspaces.length})
            </span>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              type="button"
              onClick={() => setIsInviteModalOpen(true)}
              className="btn btn-secondary"
              style={{ fontSize: '0.72rem', padding: '3px 8px' }}
            >
              <KeyRound size={12} />
              <span>초대 코드로 참가</span>
            </button>
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="btn btn-primary"
              style={{ fontSize: '0.72rem', padding: '3px 8px' }}
            >
              <Plus size={12} />
              <span>새 워크스페이스</span>
            </button>
          </div>
        </div>

        {/* Workspace Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '8px' }}>
          {workspaces.map((ws) => {
            const isSelected = ws.id === currentWorkspace?.id;
            return (
              <div
                key={ws.id}
                onClick={() => switchWorkspace(ws.id)}
                style={{
                  padding: '10px 12px',
                  background: isSelected ? 'rgba(0, 122, 204, 0.15)' : 'var(--bg-dark)',
                  border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-xs)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                  <span style={{ fontSize: '1.4rem' }}>{ws.icon || '🏢'}</span>
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: isSelected ? 'var(--text-bright)' : 'var(--text-main)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {ws.name}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {ws.myRole || 'MEMBER'} · 멤버 {ws.memberCount || 1}명
                    </div>
                  </div>
                </div>
                {isSelected && (
                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 600,
                      color: 'var(--accent-cyan)',
                      background: 'rgba(156, 220, 254, 0.1)',
                      border: '1px solid rgba(156, 220, 254, 0.3)',
                      padding: '1px 6px',
                      borderRadius: 'var(--radius-xs)',
                      flexShrink: 0,
                    }}
                  >
                    활성
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. ⚙️ Active Workspace Profile & Info */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-xs)',
          padding: '14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.8rem', padding: '6px', background: 'var(--bg-dark)', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-light)' }}>
              {detail?.icon || currentWorkspace?.icon || '🏢'}
            </span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-bright)' }}>
                  {detail?.name || currentWorkspace?.name || '워크스페이스'}
                </span>
                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 600,
                    color: 'var(--secondary)',
                    background: 'rgba(78, 201, 176, 0.1)',
                    border: '1px solid var(--secondary)',
                    padding: '1px 6px',
                    borderRadius: 'var(--radius-xs)',
                  }}
                >
                  내 권한: {currentWorkspace?.myRole || 'MEMBER'}
                </span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-sub)', marginTop: '2px' }}>
                식별 슬러그: <span style={{ fontFamily: 'monospace', color: 'var(--accent-cyan)' }}>{detail?.slug || currentWorkspace?.slug || ''}</span>
                {detail?.dbType && <span style={{ marginLeft: '10px', color: 'var(--text-muted)' }}>DB: {detail.dbType} (완전 물리 격리)</span>}
              </div>
            </div>
          </div>

          {isOwnerOrAdmin && !isEditing && (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="btn btn-secondary"
              style={{ fontSize: '0.75rem', padding: '4px 10px' }}
            >
              <Edit2 size={12} />
              <span>정보 수정</span>
            </button>
          )}
        </div>

        {/* Edit Form */}
        {isEditing ? (
          <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-sub)', marginBottom: '4px' }}>
                아이콘 선택
              </label>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {DEFAULT_ICONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setEditIcon(emoji)}
                    style={{
                      width: '32px',
                      height: '32px',
                      fontSize: '1rem',
                      background: editIcon === emoji ? 'var(--primary-subtle)' : 'var(--bg-dark)',
                      border: editIcon === emoji ? '1px solid var(--primary)' : '1px solid var(--border-light)',
                      borderRadius: 'var(--radius-xs)',
                      cursor: 'pointer',
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-sub)', marginBottom: '4px' }}>
                워크스페이스 이름
              </label>
              <input
                type="text"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '5px 8px',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-xs)',
                  color: 'var(--text-bright)',
                  fontSize: '0.8rem',
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-sub)', marginBottom: '4px' }}>
                설명
              </label>
              <textarea
                rows={2}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                style={{
                  width: '100%',
                  padding: '5px 8px',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-xs)',
                  color: 'var(--text-bright)',
                  fontSize: '0.8rem',
                  outline: 'none',
                  resize: 'none',
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="btn btn-secondary"
                style={{ fontSize: '0.75rem' }}
              >
                취소
              </button>
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="btn btn-primary"
                style={{ fontSize: '0.75rem' }}
              >
                {updateMutation.isPending ? '저장 중...' : '저장하기'}
              </button>
            </div>
          </form>
        ) : (
          <div style={{ fontSize: '0.78rem', color: 'var(--text-main)', lineHeight: '1.5' }}>
            {detail?.description || '등록된 워크스페이스 설명이 없습니다.'}
          </div>
        )}
      </div>

      {/* 3. 👥 Workspace Members Table */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-xs)',
          padding: '14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={16} color="var(--secondary)" />
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-bright)' }}>
              소속 멤버 ({detail?.members?.length || 0})
            </span>
          </div>
          {isOwnerOrAdmin && (
            <button
              type="button"
              onClick={() => setIsInviteModalOpen(true)}
              className="btn btn-primary"
              style={{ fontSize: '0.75rem', padding: '3px 10px' }}
            >
              <UserPlus size={12} />
              <span>동료 초대</span>
            </button>
          )}
        </div>

        {/* Member Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-dark)', borderBottom: '1px solid var(--border-light)', color: 'var(--text-sub)', textAlign: 'left' }}>
                <th style={{ padding: '6px 8px' }}>사용자</th>
                <th style={{ padding: '6px 8px' }}>이메일</th>
                <th style={{ padding: '6px 8px' }}>역할 권한</th>
                <th style={{ padding: '6px 8px' }}>참여일</th>
                {isOwnerOrAdmin && <th style={{ padding: '6px 8px', textAlign: 'right' }}>관리</th>}
              </tr>
            </thead>
            <tbody>
              {detail?.members?.map((member) => {
                const isTargetOwner = member.role === 'OWNER';
                return (
                  <tr key={member.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td style={{ padding: '6px 8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Avatar user={member.user as any} size={20} shape="rounded" />
                        <span style={{ fontWeight: 600, color: 'var(--text-bright)' }}>
                          {member.user?.name || member.user?.email}
                        </span>
                        {isTargetOwner && (
                          <span
                            style={{
                              fontSize: '0.65rem',
                              fontWeight: 600,
                              color: 'var(--accent-amber)',
                              background: 'rgba(220, 220, 170, 0.1)',
                              border: '1px solid rgba(220, 220, 170, 0.3)',
                              padding: '0 4px',
                              borderRadius: 'var(--radius-xs)',
                            }}
                          >
                            소유자
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '6px 8px', color: 'var(--text-sub)' }}>{member.user?.email}</td>
                    <td style={{ padding: '6px 8px' }}>
                      {isOwnerOrAdmin && !isTargetOwner ? (
                        <select
                          value={member.role}
                          onChange={(e) => handleRoleChange(member.userId, e.target.value as WorkspaceRole)}
                          style={{
                            background: 'var(--bg-input)',
                            border: '1px solid var(--border-light)',
                            color: 'var(--text-bright)',
                            padding: '2px 6px',
                            fontSize: '0.72rem',
                            borderRadius: 'var(--radius-xs)',
                            outline: 'none',
                          }}
                        >
                          <option value="ADMIN">ADMIN (관리자)</option>
                          <option value="MEMBER">MEMBER (구성원)</option>
                          <option value="GUEST">GUEST (게스트)</option>
                        </select>
                      ) : (
                        <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>{member.role}</span>
                      )}
                    </td>
                    <td style={{ padding: '6px 8px', color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                      {new Date(member.joinedAt).toLocaleDateString('ko-KR')}
                    </td>
                    {isOwnerOrAdmin && (
                      <td style={{ padding: '6px 8px', textAlign: 'right' }}>
                        {!isTargetOwner && (
                          <button
                            type="button"
                            onClick={() => handleRemoveMember(member.userId, member.user?.name || member.user?.email)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--accent-rose)',
                              cursor: 'pointer',
                              padding: '2px 6px',
                            }}
                            title="멤버 제외"
                          >
                            <UserMinus size={13} />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. 💌 Pending Invitations List */}
      {isOwnerOrAdmin && (
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-xs)',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-light)', paddingBottom: '8px' }}>
            <Clock size={16} color="var(--accent-amber)" />
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-bright)' }}>
              대기 중인 초대장 ({invitations.length})
            </span>
          </div>

          {invitations.length === 0 ? (
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', padding: '6px 0' }}>
              현재 대기 중인 초대장이 없습니다.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-dark)', borderBottom: '1px solid var(--border-light)', color: 'var(--text-sub)', textAlign: 'left' }}>
                    <th style={{ padding: '6px 8px' }}>초대 이메일</th>
                    <th style={{ padding: '6px 8px' }}>부여 역할</th>
                    <th style={{ padding: '6px 8px' }}>만료 일시</th>
                    <th style={{ padding: '6px 8px', textAlign: 'right' }}>링크 복사 / 취소</th>
                  </tr>
                </thead>
                <tbody>
                  {invitations.map((inv) => (
                    <tr key={inv.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <td style={{ padding: '6px 8px', fontWeight: 500, color: 'var(--text-bright)' }}>{inv.email}</td>
                      <td style={{ padding: '6px 8px', color: 'var(--accent-cyan)' }}>{inv.role}</td>
                      <td style={{ padding: '6px 8px', color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                        {new Date(inv.expiresAt).toLocaleDateString('ko-KR')}
                      </td>
                      <td style={{ padding: '6px 8px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => handleCopyInviteLink(inv.inviteToken)}
                            className="btn btn-secondary"
                            style={{ fontSize: '0.7rem', padding: '2px 6px' }}
                          >
                            {copiedToken === inv.inviteToken ? <Check size={11} /> : <Copy size={11} />}
                            <span>{copiedToken === inv.inviteToken ? '복사됨' : '링크 복사'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteInvitation(inv.id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--accent-rose)',
                              cursor: 'pointer',
                              padding: '2px 4px',
                            }}
                            title="초대 취소"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 5. ⚠️ Danger Zone (Delete Workspace) */}
      {isOwner && (
        <div
          style={{
            background: 'rgba(241, 76, 76, 0.08)',
            border: '1px solid rgba(241, 76, 76, 0.3)',
            borderRadius: 'var(--radius-xs)',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Trash2 size={16} color="var(--accent-rose)" />
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#ff8080' }}>
              위험 구역 (Danger Zone)
            </span>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-sub)', lineHeight: '1.4' }}>
            워크스페이스를 삭제하면 해당 워크스페이스의 모든 프로젝트, 일감, 채팅 데이터 및 물리 데이터베이스 파일이 영구 삭제됩니다.
          </p>
          <div>
            <button
              type="button"
              onClick={handleDeleteWorkspace}
              style={{
                background: 'var(--accent-rose)',
                border: 'none',
                color: '#ffffff',
                padding: '6px 12px',
                fontSize: '0.75rem',
                fontWeight: 600,
                borderRadius: 'var(--radius-xs)',
                cursor: 'pointer',
              }}
            >
              워크스페이스 영구 삭제
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <WorkspaceInviteModal
        isOpen={isInviteModalOpen}
        onClose={() => {
          setIsInviteModalOpen(false);
          refetchDetail();
          refetchInvitations();
        }}
      />
      <WorkspaceCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          refetchWorkspaces();
        }}
      />
    </div>
  );
};
