﻿import React from 'react';
import { Layers, KeyRound, Plus } from 'lucide-react';
import type { Workspace } from '@/types';
import { WorkspaceSymbol } from './WorkspaceSymbol';

interface WorkspaceSwitcherSectionProps {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  switchWorkspace: (workspaceId: number) => void;
  onOpenInviteModal: () => void;
  onOpenCreateModal: () => void;
}

export const WorkspaceSwitcherSection: React.FC<WorkspaceSwitcherSectionProps> = ({
  workspaces,
  currentWorkspace,
  switchWorkspace,
  onOpenInviteModal,
  onOpenCreateModal,
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
            onClick={onOpenInviteModal}
            className="btn btn-secondary"
            style={{ fontSize: '0.72rem', padding: '3px 8px' }}
          >
            <KeyRound size={12} />
            <span>초대 코드로 참가</span>
          </button>
          <button
            type="button"
            onClick={onOpenCreateModal}
            className="btn btn-primary"
            style={{ fontSize: '0.72rem', padding: '3px 8px' }}
          >
            <Plus size={12} />
            <span>새 워크스페이스</span>
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '8px' }}>
        {workspaces.map((ws) => {
          const isSelected = ws.id === currentWorkspace?.id;
          return (
            <div
              key={ws.id}
              onClick={() => switchWorkspace(ws.id)}
              style={{
                padding: '10px 12px',
                background: isSelected ? 'var(--nav-item-active, rgba(0, 122, 204, 0.15))' : 'var(--bg-dark)',
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
                <WorkspaceSymbol iconVal={ws.icon} size={28} />
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
  );
};
