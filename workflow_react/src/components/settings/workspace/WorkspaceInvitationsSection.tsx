﻿import React from 'react';
import { Clock, Check, Copy, Trash2 } from 'lucide-react';

interface WorkspaceInvitationsSectionProps {
  invitations: any[];
  copiedToken: string | null;
  onCopyInviteLink: (token: string) => void;
  onDeleteInvitation: (id: number) => void;
}

export const WorkspaceInvitationsSection: React.FC<WorkspaceInvitationsSectionProps> = ({
  invitations = [],
  copiedToken,
  onCopyInviteLink,
  onDeleteInvitation,
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
          gap: '8px',
          borderBottom: '1px solid var(--border-light)',
          paddingBottom: '8px',
        }}
      >
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
              <tr
                style={{
                  background: 'var(--bg-dark)',
                  borderBottom: '1px solid var(--border-light)',
                  color: 'var(--text-sub)',
                  textAlign: 'left',
                }}
              >
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
                        onClick={() => onCopyInviteLink(inv.inviteToken)}
                        className="btn btn-secondary"
                        style={{ fontSize: '0.7rem', padding: '2px 6px' }}
                      >
                        {copiedToken === inv.inviteToken ? <Check size={11} /> : <Copy size={11} />}
                        <span>{copiedToken === inv.inviteToken ? '복사됨' : '링크 복사'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteInvitation(inv.id)}
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
  );
};
