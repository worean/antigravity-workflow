import React, { useState, useEffect, useRef } from 'react';
import { checkHealth } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useWorkspace } from '@/context/WorkspaceContext';
import {
  User as UserIcon,
  Minus,
  Square,
  Copy,
  X,
  ChevronDown,
  Plus,
  UserPlus,
  Check,
} from 'lucide-react';
import { DotIndicator, Avatar } from './common';
import { WorkspaceCreateModal, WorkspaceInviteModal } from './workspace';

export interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
  icon?: React.ReactNode;
}

interface HeaderProps {
  breadcrumbs?: BreadcrumbItem[];
}

export const Header: React.FC<HeaderProps> = ({ breadcrumbs }) => {
  const { user, isAuthenticated } = useAuth();
  const { workspaces, currentWorkspace, switchWorkspace } = useWorkspace();

  const [isServerHealthy, setIsServerHealthy] = useState<boolean | null>(null);
  const [lastCheckTime, setLastCheckTime] = useState<string>('');
  const [isMaximized, setIsMaximized] = useState<boolean>(false);
  const [isWsDropdownOpen, setIsWsDropdownOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const isElectron = typeof window !== 'undefined' && !!window.electronAPI?.isElectron;

  // 드롭다운 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsWsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const pingServer = async () => {
      try {
        const data = await checkHealth();
        setIsServerHealthy(data.status === 'OK');
        setLastCheckTime(new Date().toLocaleTimeString('ko-KR'));
      } catch {
        setIsServerHealthy(false);
      }
    };

    pingServer();
    const interval = setInterval(pingServer, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isElectron && window.electronAPI?.isWindowMaximized) {
      window.electronAPI.isWindowMaximized().then(setIsMaximized);
    }
    if (isElectron && window.electronAPI?.onWindowMaximizedChange) {
      const unsub = window.electronAPI.onWindowMaximizedChange((max) => {
        setIsMaximized(max);
      });
      return () => {
        if (unsub) unsub();
      };
    }
  }, [isElectron]);

  const handleMinimize = () => {
    window.electronAPI?.minimizeWindow?.();
  };

  const handleMaximize = () => {
    window.electronAPI?.maximizeWindow?.();
  };

  const handleClose = () => {
    window.electronAPI?.closeWindow?.();
  };

  return (
    <>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 0 0 10px',
          height: '32px',
          borderBottom: '1px solid var(--border-light)',
          background: 'var(--bg-header)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          userSelect: 'none',
          WebkitAppRegion: 'drag',
        } as React.CSSProperties}
      >
        {/* Left: Compact Workspace Combobox & Breadcrumbs */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.72rem',
            color: 'var(--text-sub)',
            WebkitAppRegion: 'no-drag',
          } as React.CSSProperties}
        >
          {/* 🏢 Compact Workspace Combobox */}
          <div style={{ position: 'relative' }} ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsWsDropdownOpen(!isWsDropdownOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                background: isWsDropdownOpen ? '#37373d' : 'var(--bg-input)',
                border: isWsDropdownOpen ? '1px solid var(--border-focus)' : '1px solid var(--border-light)',
                borderRadius: 'var(--radius-xs)',
                padding: '2px 7px',
                fontSize: '0.72rem',
                fontWeight: 500,
                color: 'var(--text-bright)',
                cursor: 'pointer',
                height: '22px',
                outline: 'none',
                transition: 'background-color 0.1s, border-color 0.1s',
              }}
              onMouseEnter={(e) => {
                if (!isWsDropdownOpen) e.currentTarget.style.borderColor = '#555555';
              }}
              onMouseLeave={(e) => {
                if (!isWsDropdownOpen) e.currentTarget.style.borderColor = 'var(--border-light)';
              }}
              title={`현재 워크스페이스: ${currentWorkspace?.name || ''}`}
            >
              <span style={{ fontSize: '0.85rem' }}>{currentWorkspace?.icon || '🏢'}</span>
              <span
                style={{
                  maxWidth: '120px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontWeight: 600,
                }}
              >
                {currentWorkspace?.name || '워크스페이스'}
              </span>
              <ChevronDown size={11} color="var(--text-muted)" style={{ flexShrink: 0, marginLeft: '2px' }} />
            </button>

            {/* Combobox Popup Menu (VS Code Compact Dark Style) */}
            {isWsDropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 4px)',
                  left: 0,
                  width: '230px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-xs)',
                  boxShadow: 'var(--shadow-md)',
                  zIndex: 1000,
                  padding: '4px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                }}
              >
                <div
                  style={{
                    padding: '3px 6px',
                    fontSize: '0.66rem',
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    borderBottom: '1px solid var(--border-light)',
                    marginBottom: '2px',
                  }}
                >
                  Workspaces ({workspaces.length})
                </div>

                {/* Workspace List */}
                <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1px' }}>
                  {workspaces.map((ws) => {
                    const isSelected = ws.id === currentWorkspace?.id;
                    return (
                      <button
                        key={ws.id}
                        type="button"
                        onClick={() => {
                          switchWorkspace(ws.id);
                          setIsWsDropdownOpen(false);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '5px 6px',
                          borderRadius: 'var(--radius-xs)',
                          border: 'none',
                          background: isSelected ? '#37373d' : 'transparent',
                          color: isSelected ? 'var(--text-bright)' : 'var(--text-main)',
                          cursor: 'pointer',
                          textAlign: 'left',
                          fontSize: '0.72rem',
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) e.currentTarget.style.background = 'var(--bg-card-hover)';
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                          <span style={{ fontSize: '0.9rem' }}>{ws.icon || '🏢'}</span>
                          <div style={{ minWidth: 0 }}>
                            <div
                              style={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                fontWeight: isSelected ? 600 : 400,
                              }}
                            >
                              {ws.name}
                            </div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                              {ws.myRole || 'MEMBER'}
                            </div>
                          </div>
                        </div>
                        {isSelected && <Check size={12} color="var(--accent-cyan)" style={{ flexShrink: 0 }} />}
                      </button>
                    );
                  })}
                </div>

                <div style={{ height: '1px', background: 'var(--border-light)', margin: '3px 0' }} />

                {/* Action Buttons */}
                <button
                  type="button"
                  onClick={() => {
                    setIsWsDropdownOpen(false);
                    setIsInviteModalOpen(true);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 6px',
                    borderRadius: 'var(--radius-xs)',
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--secondary)',
                    cursor: 'pointer',
                    fontSize: '0.72rem',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <UserPlus size={12} />
                  <span>동료 초대 / 코드 참가...</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsWsDropdownOpen(false);
                    setIsCreateModalOpen(true);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 6px',
                    borderRadius: 'var(--radius-xs)',
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--accent-cyan)',
                    cursor: 'pointer',
                    fontSize: '0.72rem',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <Plus size={12} />
                  <span>새 워크스페이스 생성...</span>
                </button>
              </div>
            )}
          </div>

          {/* Breadcrumbs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {breadcrumbs && breadcrumbs.length > 0 ? (
              breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={idx}>
                  <span style={{ color: 'var(--text-muted)' }}>/</span>
                  {crumb.onClick ? (
                    <button
                      type="button"
                      onClick={crumb.onClick}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        margin: 0,
                        color: idx === breadcrumbs.length - 1 ? 'var(--accent-cyan)' : 'var(--text-bright)',
                        fontWeight: idx === breadcrumbs.length - 1 ? 600 : 400,
                        cursor: 'pointer',
                        fontSize: '0.72rem',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                      onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                    >
                      {crumb.label}
                    </button>
                  ) : (
                    <span
                      style={{
                        color: idx === breadcrumbs.length - 1 ? 'var(--accent-cyan)' : 'var(--text-bright)',
                        fontWeight: idx === breadcrumbs.length - 1 ? 600 : 400,
                      }}
                    >
                      {crumb.label}
                    </span>
                  )}
                </React.Fragment>
              ))
            ) : (
              <>
                <span style={{ color: 'var(--text-muted)' }}>/</span>
                <span style={{ color: 'var(--text-bright)', fontWeight: 500 }}>AntiGravity Workflow</span>
              </>
            )}
          </div>
        </div>

        {/* Right - User Status, Server Status & Window Controls */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            height: '100%',
            WebkitAppRegion: 'no-drag',
          } as React.CSSProperties}
        >
          {/* User Mini Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: 'var(--text-sub)' }}>
            {isAuthenticated && user ? (
              <>
                <Avatar user={user} size={18} shape="rounded" showBorder={false} />
                <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>
                  {user.name || user.email}
                </span>
              </>
            ) : (
              <>
                <UserIcon size={12} color="var(--text-muted)" />
                <span style={{ color: 'var(--text-muted)' }}>게스트 모드</span>
              </>
            )}
          </div>

          {/* Server Status Indicator */}
          <div
            title={isServerHealthy === null ? '연결 확인 중...' : isServerHealthy ? `정상 (${lastCheckTime})` : '오프라인'}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', cursor: 'help' }}
          >
            <DotIndicator color={isServerHealthy === null ? 'amber' : isServerHealthy ? 'green' : 'red'} />
            <span style={{ color: 'var(--text-sub)' }}>API</span>
          </div>

          {/* Electron Window Controls */}
          {isElectron && (
            <div style={{ display: 'flex', height: '100%' }}>
              <button
                onClick={handleMinimize}
                style={{
                  width: '36px',
                  height: '100%',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color 0.1s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#2a2d2e';
                  e.currentTarget.style.color = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text-muted)';
                }}
                title="최소화"
              >
                <Minus size={13} />
              </button>

              <button
                onClick={handleMaximize}
                style={{
                  width: '36px',
                  height: '100%',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color 0.1s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#2a2d2e';
                  e.currentTarget.style.color = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text-muted)';
                }}
                title={isMaximized ? '이전 크기로 복원' : '최대화'}
              >
                {isMaximized ? <Copy size={11} /> : <Square size={11} />}
              </button>

              <button
                onClick={handleClose}
                style={{
                  width: '36px',
                  height: '100%',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color 0.1s, color 0.1s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#e81123';
                  e.currentTarget.style.color = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text-muted)';
                }}
                title="닫기"
              >
                <X size={13} />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Modals */}
      <WorkspaceCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
      <WorkspaceInviteModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
      />
    </>
  );
};