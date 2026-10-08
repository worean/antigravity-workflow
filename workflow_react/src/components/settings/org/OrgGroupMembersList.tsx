﻿import React from 'react';
import { Users, Trash2 } from 'lucide-react';
import { Avatar } from '@/components/common';
import type { Group, GroupMember, User as UserType } from '@/types';

interface OrgGroupMembersListProps {
  group: Group;
  currentUser: UserType | null;
  isAuthenticated: boolean;
  onUpdateMemberRole: (member: GroupMember, newRole: string) => void;
  onRemoveMember: (membershipId: number, memberName: string) => void;
}

export const OrgGroupMembersList: React.FC<OrgGroupMembersListProps> = ({
  group,
  currentUser,
  isAuthenticated,
  onUpdateMemberRole,
  onRemoveMember,
}) => {
  const members = group.members || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div
          style={{
            fontSize: '0.82rem',
            fontWeight: 600,
            color: 'var(--text-bright)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Users size={14} color="var(--primary)" />
          <span>소속 멤버 및 권한 목록 ({members.length}명)</span>
        </div>
      </div>

      {members.length === 0 ? (
        <div
          style={{
            padding: '24px',
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: '0.75rem',
            border: '1px dashed var(--border-light)',
            borderRadius: 'var(--radius-xs)',
          }}
        >
          해당 그룹에 배정된 멤버가 없습니다. '멤버 배정' 버튼을 눌러 팀원을 추가하세요.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {members.map((member) => {
            const mUser = member.user;
            const roleUpper = (member.role || 'MEMBER').toUpperCase();

            return (
              <div
                key={member.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-xs)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Avatar user={mUser} size={28} shape="circle" />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-bright)' }}>
                        {mUser?.name || '사용자'}
                      </span>
                      {member.title && (
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                          ({member.title})
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {mUser?.email}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {isAuthenticated ? (
                    <select
                      value={member.role || 'MEMBER'}
                      onChange={(e) => onUpdateMemberRole(member, e.target.value)}
                      className="input-field"
                      style={{
                        fontSize: '0.72rem',
                        height: '24px',
                        padding: '0 6px',
                        width: 'auto',
                        background:
                          roleUpper === 'OWNER' || roleUpper === 'ADMIN' || roleUpper === 'LEADER'
                            ? 'rgba(230, 162, 60, 0.15)'
                            : 'var(--bg-input)',
                        color:
                          roleUpper === 'OWNER' || roleUpper === 'ADMIN' || roleUpper === 'LEADER'
                            ? '#e6a23c'
                            : 'var(--text-main)',
                        border:
                          roleUpper === 'OWNER' || roleUpper === 'ADMIN' || roleUpper === 'LEADER'
                            ? '1px solid rgba(230, 162, 60, 0.4)'
                            : '1px solid var(--border-light)',
                      }}
                    >
                      {(() => {
                        const isCurGroupOwner =
                          currentUser?.role === 'ADMIN' ||
                          group.members?.some(
                            (m) => m.userId === currentUser?.id && m.role?.toUpperCase() === 'OWNER'
                          );
                        return (
                          <>
                            {isCurGroupOwner && (
                              <option value="OWNER">👑 1. 오너 (Owner - 기존 오너 자동 승계)</option>
                            )}
                            <option value="ADMIN">⭐ 2. 관리자 (PM - 여러명 가능)</option>
                            <option value="MEMBER">💻 3. 담당자 (개발자)</option>
                            <option value="VIEWER">👁️ 4. 참석자 (리뷰어)</option>
                          </>
                        );
                      })()}
                    </select>
                  ) : (
                    <span
                      style={{
                        fontSize: '0.7rem',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontWeight: 600,
                        background:
                          roleUpper === 'LEADER'
                            ? 'rgba(230, 162, 60, 0.2)'
                            : 'rgba(0, 122, 204, 0.15)',
                        color: roleUpper === 'LEADER' ? '#e6a23c' : 'var(--accent-cyan)',
                      }}
                    >
                      {member.role}
                    </span>
                  )}

                  {isAuthenticated && (
                    <button
                      type="button"
                      onClick={() => onRemoveMember(member.id, mUser?.name || mUser?.email || '멤버')}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '4px',
                      }}
                      title="그룹에서 제외"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
