﻿import React from 'react';
import { Shield, UserPlus, UserMinus } from 'lucide-react';
import { Avatar } from '@/components/common';
import type { WorkspaceRole } from '@/types';

interface WorkspaceMembersSectionProps {
  members: any[];
  isOwnerOrAdmin: boolean;
  onOpenInviteModal: () => void;
  onRoleChange: (userId: number, role: WorkspaceRole) => void;
  onRemoveMember: (userId: number, memberName: string) => void;
}

export const WorkspaceMembersSection: React.FC<WorkspaceMembersSectionProps> = ({
  members = [],
  isOwnerOrAdmin,
  onOpenInviteModal,
  onRoleChange,
  onRemoveMember,
}) => {
  return (
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
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-light)',
          paddingBottom: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Shield size={16} color="var(--secondary)" />
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-bright)' }}>
            소속 멤버 ({members.length})
          </span>
        </div>
        {isOwnerOrAdmin && (
          <button
            type="button"
            onClick={onOpenInviteModal}
            className="btn btn-primary"
            style={{ fontSize: '0.75rem', padding: '3px 10px' }}
          >
            <UserPlus size={12} />
            <span>동료 초대</span>
          </button>
        )}
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
          <thead>
            <tr
              style={{
                background: 'var(--bg-dark)',
                borderBottom: '1px solid var(--border-light)',
                color: 'var(--text-sub)',
                textAlign: 'left',
              }}
            >
              <th style={{ padding: '6px 8px' }}>사용자</th>
              <th style={{ padding: '6px 8px' }}>이메일</th>
              <th style={{ padding: '6px 8px' }}>역할 권한</th>
              <th style={{ padding: '6px 8px' }}>참여일</th>
              {isOwnerOrAdmin && <th style={{ padding: '6px 8px', textAlign: 'right' }}>관리</th>}
            </tr>
          </thead>
          <tbody>
            {members.map((member) => {
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
                        onChange={(e) => onRoleChange(member.userId, e.target.value as WorkspaceRole)}
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
                          onClick={() => onRemoveMember(member.userId, member.user?.name || member.user?.email)}
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
  );
};
