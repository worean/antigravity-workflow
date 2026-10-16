import React from 'react';
import { Server, KeyRound, UserPlus } from 'lucide-react';
import type { Workspace } from '@/types';
import { WorkspaceSymbol } from './WorkspaceSymbol';

interface WorkspaceSwitcherSectionProps {
  workspaces?: Workspace[];
  currentWorkspace: Workspace | null;
  switchWorkspace?: (workspaceId: number) => void;
  onOpenInviteModal: () => void;
  onOpenCreateModal?: () => void;
}

export const WorkspaceSwitcherSection: React.FC<WorkspaceSwitcherSectionProps> = ({
  currentWorkspace,
  onOpenInviteModal,
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Server size={16} color="var(--primary)" />
          <div>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-bright)' }}>
              현재 서버 워크스페이스 (1 Server = 1 Workspace)
            </span>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
              단일 서버는 단일 워크스페이스를 전담합니다. 다른 서버의 워크스페이스 접속은 [시스템/연결] 탭의 백엔드 주소 설정을 이용하세요.
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            type="button"
            onClick={onOpenInviteModal}
            className="btn btn-primary"
            style={{ fontSize: '0.72rem', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <UserPlus size={12} />
            <span>동료 초대 / 초대 코드 참가</span>
          </button>
        </div>
      </div>

      {currentWorkspace && (
        <div
          style={{
            padding: '10px 12px',
            background: 'var(--nav-item-active)',
            border: '1px solid var(--primary)',
            borderRadius: 'var(--radius-xs)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <WorkspaceSymbol iconVal={currentWorkspace.icon} size={30} />
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  color: 'var(--text-bright)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {currentWorkspace.name}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                내 권한: {currentWorkspace.myRole || 'MEMBER'} · 활성 멤버 {currentWorkspace.memberCount || 1}명
              </div>
            </div>
          </div>
          <span
            style={{
              fontSize: '0.68rem',
              fontWeight: 600,
              color: 'var(--accent-cyan)',
              background: 'var(--primary-subtle)',
              border: '1px solid var(--primary)',
              padding: '2px 8px',
              borderRadius: 'var(--radius-xs)',
              flexShrink: 0,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <KeyRound size={11} /> 단일 활성 워크스페이스
          </span>
        </div>
      )}
    </div>
  );
};
