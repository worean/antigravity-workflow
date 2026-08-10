import React, { useState, useEffect } from 'react';
import { checkHealth } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Plus, Server, LogIn, LogOut, User as UserIcon, Activity } from 'lucide-react';

interface HeaderProps {
  onOpenAuth: () => void;
  onOpenCreateIssue: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenAuth, onOpenCreateIssue }) => {
  const { user, isAuthenticated, logout } = useAuth();
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
    const interval = setInterval(pingServer, 15000); // 15초마다 헬스체크
    return () => clearInterval(interval);
  }, []);

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 28px',
        borderBottom: '1px solid var(--border-light)',
        background: 'rgba(11, 15, 25, 0.85)',
        backdropFilter: 'blur(16px)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      {/* Left logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #6366f1 0%, #10b981 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 16px rgba(99, 102, 241, 0.4)',
          }}
        >
          <Activity size={22} color="#ffffff" />
        </div>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
            AntiGravity <span style={{ color: 'var(--primary)' }}>Workflow</span>
          </h1>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            백엔드 서버 대시보드
          </span>
        </div>
      </div>

      {/* Center - Server Status Indicator */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 14px',
          borderRadius: 'var(--radius-full)',
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid var(--border-light)',
          fontSize: '0.82rem',
        }}
      >
        <Server size={14} color="var(--text-sub)" />
        <span style={{ color: 'var(--text-sub)' }}>API Server:</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div className={isServerHealthy ? 'pulse-green' : 'pulse-red'} />
          <span
            style={{
              fontWeight: 600,
              color: isServerHealthy ? '#10b981' : isServerHealthy === false ? '#f43f5e' : '#f59e0b',
            }}
          >
            {isServerHealthy ? 'Connected (4000)' : isServerHealthy === false ? 'Disconnected' : 'Checking...'}
          </span>
        </div>
        {lastCheckTime && (
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: '4px' }}>
            ({lastCheckTime})
          </span>
        )}
      </div>

      {/* Right - Actions & Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {isAuthenticated && (
          <button className="btn btn-primary btn-sm" onClick={onOpenCreateIssue}>
            <Plus size={16} />
            새 이슈 생성
          </button>
        )}

        {isAuthenticated ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid var(--border-light)',
              }}
            >
              <UserIcon size={16} color="var(--primary)" />
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{user?.name || user?.email}</span>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={logout} title="로그아웃">
              <LogOut size={16} />
              로그아웃
            </button>
          </div>
        ) : (
          <button className="btn btn-emerald btn-sm" onClick={onOpenAuth}>
            <LogIn size={16} />
            로그인 / 회원가입
          </button>
        )}
      </div>
    </header>
  );
};
