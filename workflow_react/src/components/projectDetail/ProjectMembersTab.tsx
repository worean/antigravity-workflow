import React from 'react';
import { Crown, Trash2, X } from 'lucide-react';
import type { Project, User } from '../../types';
import { Button, Avatar } from '../common';

interface ProjectMembersTabProps {
  project: Project;
  allUsers: User[];
  isPM: boolean;
  handleUpdateMemberRole: (userId: number, role: string) => Promise<void>;
  handleRemoveMember: (userId: number) => Promise<void>;
  showAddMemberModal: boolean;
  setShowAddMemberModal: (show: boolean) => void;
  selectedUserIdToAdd: number | '';
  setSelectedUserIdToAdd: (id: number | '') => void;
  selectedMemberRole: string;
  setSelectedMemberRole: (role: string) => void;
  handleAddMember: (e: React.FormEvent) => Promise<void>;
}

export const ProjectMembersTab: React.FC<ProjectMembersTabProps> = ({
  project,
  allUsers,
  isPM,
  handleUpdateMemberRole,
  handleRemoveMember,
  showAddMemberModal,
  setShowAddMemberModal,
  selectedUserIdToAdd,
  setSelectedUserIdToAdd,
  selectedMemberRole,
  setSelectedMemberRole,
  handleAddMember,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {(!project.members || project.members.length === 0) ? (
        <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
          등록된 프로젝트 멤버가 없습니다.
        </div>
      ) : (
        project.members.map((m) => {
          const isOwner = project.ownerId === m.userId;
          return (
            <div
              key={m.id || m.userId}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                background: '#252526',
                border: '1px solid #333333',
                borderRadius: 'var(--radius-xs)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Avatar user={m.user} name={m.user?.name || ''} size={28} shape="circle" />
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-bright)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>{m.user?.name || '익명 사용자'}</span>
                    {isOwner && (
                      <span style={{ fontSize: '0.65rem', background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', padding: '1px 5px', borderRadius: '3px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Crown size={10} /> 프로젝트 소유자
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {m.user?.email}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {isPM && !isOwner ? (
                  <select
                    className="input-field"
                    value={m.role}
                    onChange={(e) => handleUpdateMemberRole(m.userId, e.target.value)}
                    style={{ width: '95px', height: '24px', fontSize: '0.72rem', padding: '0 4px' }}
                  >
                    <option value="ADMIN">관리자 (ADMIN)</option>
                    <option value="MEMBER">멤버 (MEMBER)</option>
                    <option value="VIEWER">뷰어 (VIEWER)</option>
                  </select>
                ) : (
                  <span
                    style={{
                      fontSize: '0.7rem',
                      padding: '2px 8px',
                      borderRadius: '3px',
                      background: m.role === 'ADMIN' ? 'rgba(0,122,204,0.2)' : 'rgba(255,255,255,0.06)',
                      color: m.role === 'ADMIN' ? '#9cdcfe' : 'var(--text-sub)',
                      fontWeight: 600,
                    }}
                  >
                    {m.role}
                  </span>
                )}

                {isPM && !isOwner && (
                  <button
                    type="button"
                    onClick={() => handleRemoveMember(m.userId)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#f43f5e',
                      cursor: 'pointer',
                      padding: '3px',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                    title="멤버 제외"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>
          );
        })
      )}

      {/* Modal: Add Member */}
      {showAddMemberModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: '380px',
              background: '#252526',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-xs)',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '8px' }}>
              <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-bright)' }}>
                개인 멤버 추가
              </div>
              <button onClick={() => setShowAddMemberModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddMember} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-sub)', marginBottom: '4px', display: 'block' }}>
                  추가할 사용자 선택 *
                </label>
                <select
                  className="input-field"
                  value={selectedUserIdToAdd}
                  onChange={(e) => setSelectedUserIdToAdd(Number(e.target.value))}
                  required
                  style={{ width: '100%', fontSize: '0.8rem' }}
                >
                  <option value="">사용자를 선택하세요...</option>
                  {allUsers
                    .filter((u) => !project.members?.some((m) => m.userId === u.id))
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name || '익명'} ({u.email})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-sub)', marginBottom: '4px', display: 'block' }}>
                  역할 (Role)
                </label>
                <select
                  className="input-field"
                  value={selectedMemberRole}
                  onChange={(e) => setSelectedMemberRole(e.target.value)}
                  style={{ width: '100%', fontSize: '0.8rem' }}
                >
                  <option value="MEMBER">멤버 (MEMBER) - 기본</option>
                  <option value="ADMIN">관리자 (ADMIN)</option>
                  <option value="VIEWER">뷰어 (VIEWER)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
                <Button variant="secondary" size="sm" type="button" onClick={() => setShowAddMemberModal(false)}>
                  취소
                </Button>
                <Button variant="primary" size="sm" type="submit" disabled={!selectedUserIdToAdd}>
                  추가하기
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};