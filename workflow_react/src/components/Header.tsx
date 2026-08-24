import React, { useState, useEffect } from 'react';
import { checkHealth } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Server, User as UserIcon } from 'lucide-react';
import { DotIndicator, Avatar } from './common';

export const Header: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [isServerHealthy, setIsServerHealthy] = useState<boolean | null>(null);
  const [lastCheckTime, setLastCheckTime] = useState<string>('');

  useEffect(() => {
    const pingServer = async () => {
      try {
        const data = await checkHealth();
        setIsServerHealthy(data.status === 'OK');
        setLastCheckTime(new Date().toLocaleTimeString('ko-KR'));
      } catch (err) {
        setIsServerHealthy(false);
      }
    };

    pingServer();
    const interval = setInterval(pingServer, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 12px',
        height: '32px',
        borderBottom: '1px solid var(--border-light)',
        background: 'var(--bg-header)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        userSelect: 'none',
      }}
    >
      {/* Left workspace status breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.72rem', color: 'var(--text-sub)' }}>
        <span style={{ color: 'var(--text-muted)' }}>Workspace</span>
        <span>/</span>
        <span style={{ color: 'var(--text-bright)', fontWeight: 500 }}>AntiGravity Workflow Systems</span>
      </div>

      {/* Right - User Status & Server Status Indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
      </div>
    </header>
  );
};
