import React from 'react';
import { Terminal, RefreshCw, LogIn, Plus } from 'lucide-react';
import type { User } from '@/types';
import { Button, Avatar } from '@/components/common';

interface DashboardSummaryToolbarProps {
  isAuthenticated: boolean;
  user: User | null;
  isRefreshing: boolean;
  handleRefresh: () => Promise<void>;
  onOpenCreateIssue: () => void;
  onOpenCreateProject: () => void;
  onOpenAuth?: () => void;
}

export const DashboardSummaryToolbar: React.FC<DashboardSummaryToolbarProps> = ({
  isAuthenticated,
  user,
  isRefreshing,
  handleRefresh,
  onOpenCreateIssue,
  onOpenCreateProject,
  onOpenAuth,
}) => {
  return (
    <>
      {/* Guest Mode Banner */}
      {!isAuthenticated && (
        <div
          style={{
            background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.12), rgba(139, 92, 246, 0.12))',
            border: '1px solid rgba(59, 130, 246, 0.25)',
            borderRadius: 'var(--radius-xs)',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-bright)' }}>
              👋 게스트 모드로 접속 중입니다
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              로그인하시면 프로젝트 생성, 일감 관리, 실시간 통계 및 실시간 채팅을 자유롭게 이용하실 수 있습니다.
            </div>
          </div>
          {onOpenAuth && (
            <Button variant="primary" size="sm" icon={<LogIn size={13} />} onClick={onOpenAuth}>
              로그인 / 회원가입
            </Button>
          )}
        </div>
      )}

      {/* Top Compact Summary Toolbar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '6px 10px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-xs)',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Terminal size={14} color="var(--primary)" />
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-bright)' }}>
            워크스페이스 요약 대시보드
          </span>
          {user && <Avatar user={user} size={18} shape="rounded" showBorder={false} />}
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            ({user ? `${user.name || user.email} 로그인 중` : '게스트 모드'})
          </span>
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          <Button variant="secondary" size="sm" icon={<RefreshCw size={12} className={isRefreshing ? 'animate-spin' : ''} />} onClick={handleRefresh}>
            새로고침
          </Button>
          {!isAuthenticated && onOpenAuth && (
            <Button variant="primary" size="sm" icon={<LogIn size={12} />} onClick={onOpenAuth}>
              로그인
            </Button>
          )}
          {isAuthenticated && (
            <>
              <Button variant="secondary" size="sm" icon={<Plus size={12} />} onClick={onOpenCreateProject}>
                프로젝트 추가
              </Button>
              <Button variant="primary" size="sm" icon={<Plus size={12} />} onClick={onOpenCreateIssue}>
                이슈 생성
              </Button>
            </>
          )}
        </div>
      </div>
    </>
  );
};