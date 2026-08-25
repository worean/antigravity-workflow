// -*- coding: utf-8 -*-
import React, { useState, useEffect } from 'react';
import { checkHealth } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Server, User as UserIcon, Minus, Square, Copy, X } from 'lucide-react';
import { DotIndicator, Avatar } from './common';

export const Header: React.FC = () => {
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
      {/* Left workspace status breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.72rem', color: 'var(--text-sub)' }}>
        <span style={{ color: 'var(--text-muted)' }}>Workspace</span>
        <span>/</span>
        <span style={{ color: 'var(--text-bright)', fontWeight: 500 }}>AntiGravity Workflow Systems</span>
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
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '1px 8px',
            borderRadius: 'var(--radius-xs)',
            background: 'rgba(0, 0, 0, 0.2)',
            border: '1px solid var(--border-light)',
            fontSize: '0.72rem',
          }}
        >
          <Server size={11} color="var(--text-sub)" />
          <span style={{ color: 'var(--text-muted)' }}>API:</span>
          <DotIndicator
            color={isServerHealthy ? 'green' : isServerHealthy === false ? 'red' : 'amber'}
            pulsing={isServerHealthy === true}
            label={isServerHealthy ? 'Online' : isServerHealthy === false ? 'Disconnected' : 'Checking...'}
          />
          {lastCheckTime && (
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
              ({lastCheckTime})
            </span>
          )}
        </div>

        {/* Electron Window Control Buttons */}
        {isElectron && (
          <div style={{ display: 'flex', alignItems: 'center', height: '100%', marginLeft: '6px' }}>
            <button
              onClick={handleMinimize}
              title="최소화"
              style={{
                width: '42px',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-sub)',
                cursor: 'pointer',
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <Minus size={13} />
            </button>

            <button
              onClick={handleMaximize}
              title={isMaximized ? '이전 크기로 복원' : '최대화'}
              style={{
                width: '42px',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-sub)',
                cursor: 'pointer',
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              {isMaximized ? <Copy size={11} /> : <Square size={11} />}
            </button>

            <button
              onClick={handleClose}
              title="닫기"
              style={{
                width: '42px',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-sub)',
                cursor: 'pointer',
                transition: 'background 0.15s ease, color 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#e81123';
                e.currentTarget.style.color = '#ffffff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--text-sub)';
              }}
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
