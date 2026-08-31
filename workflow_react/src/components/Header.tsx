// -*- coding: utf-8 -*-
import React, { useState, useEffect } from 'react';
import { checkHealth } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { User as UserIcon, Minus, Square, Copy, X } from 'lucide-react';
import { DotIndicator, Avatar } from './common';

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
  const [isServerHealthy, setIsServerHealthy] = useState<boolean | null>(null);
  const [lastCheckTime, setLastCheckTime] = useState<string>('');
  const [isMaximized, setIsMaximized] = useState<boolean>(false);
  const isElectron = typeof window !== 'undefined' && !!window.electronAPI?.isElectron;

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
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 0 0 12px',
        height: '32px',
        borderBottom: '1px solid var(--border-light)',
        background: 'var(--bg-header)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        userSelect: 'none',
        // Electron Drag Region
        WebkitAppRegion: 'drag',
      } as React.CSSProperties}
    >
      {/* Left workspace status / Breadcrumb */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '0.72rem',
          color: 'var(--text-sub)',
          WebkitAppRegion: 'no-drag',
        } as React.CSSProperties}
      >
        <span style={{ color: 'var(--text-muted)' }}>Workspace</span>
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
            <span style={{ color: 'var(--text-bright)', fontWeight: 500 }}>AntiGravity Workflow Systems</span>
          </>
        )}
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
  );
};