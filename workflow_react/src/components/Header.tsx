// -*- coding: utf-8 -*-
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

  // 외부 클릭 시 드롭다운 닫기
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
          padding: '0 0 0 8px',
          height: '34px',
          borderBottom: '1px solid var(--border-light)',
          background: 'var(--bg-header)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          userSelect: 'none',
          WebkitAppRegion: 'drag',
        } as React.CSSProperties}
      >
        {/* Left: Workspace Switcher & Breadcrumbs */}
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
          {/* 🏢 Workspace Switcher Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsWsDropdownOpen(!isWsDropdownOpen)}
              className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-slate-800/80 transition-colors border border-transparent hover:border-slate-700/60 text-slate-200 text-xs font-medium cursor-pointer"
            >
              <span className="text-sm">{currentWorkspace?.icon || '🏢'}</span>
              <span className="font-semibold text-slate-100 max-w-[130px] truncate">
                {currentWorkspace?.name || '워크스페이스'}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {/* Dropdown Menu */}
            {isWsDropdownOpen && (
              <div className="absolute left-0 top-full mt-1.5 w-64 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl overflow-hidden z-50 animate-fade-in p-1.5">
                <div className="px-2.5 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  참여 워크스페이스 ({workspaces.length})
                </div>

                {/* Workspace List */}
                <div className="max-h-48 overflow-y-auto space-y-0.5 py-1">
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
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs text-left transition-all ${
                          isSelected
                            ? 'bg-indigo-600/20 text-indigo-300 font-medium border border-indigo-500/30'
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-base">{ws.icon || '🏢'}</span>
                          <div className="truncate">
                            <div className="truncate font-medium">{ws.name}</div>
                            <div className="text-[10px] text-slate-400">{ws.myRole || 'MEMBER'}</div>
                          </div>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                <div className="h-px bg-slate-800 my-1" />

                {/* Actions */}
                <div className="space-y-0.5 pt-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setIsWsDropdownOpen(false);
                      setIsInviteModalOpen(true);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>동료 초대</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsWsDropdownOpen(false);
                      setIsCreateModalOpen(true);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>새 워크스페이스 생성</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Breadcrumbs */}
          <div className="flex items-center gap-1.5 text-slate-400">
            {breadcrumbs && breadcrumbs.length > 0 ? (
              breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={idx}>
                  <span className="text-slate-600">/</span>
                  {crumb.onClick ? (
                    <button
                      type="button"
                      onClick={crumb.onClick}
                      className={`hover:underline cursor-pointer text-xs ${
                        idx === breadcrumbs.length - 1 ? 'text-indigo-400 font-semibold' : 'text-slate-300'
                      }`}
                    >
                      {crumb.label}
                    </button>
                  ) : (
                    <span
                      className={`text-xs ${
                        idx === breadcrumbs.length - 1 ? 'text-indigo-400 font-semibold' : 'text-slate-300'
                      }`}
                    >
                      {crumb.label}
                    </span>
                  )}
                </React.Fragment>
              ))
            ) : (
              <>
                <span className="text-slate-600">/</span>
                <span className="text-slate-300 font-medium text-xs">AntiGravity Workflow</span>
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