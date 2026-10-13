import React from 'react';
import {
  Terminal,
  RefreshCw,
  LogIn,
  Plus,
  LayoutGrid,
  Check,
  RotateCcw,
} from 'lucide-react';
import type { User } from '@/types';
import { Button, Avatar } from '@/components/common';
import { useDashboardStore } from '@/stores/useDashboardStore';

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
  const isEditMode = useDashboardStore((s) => s.isEditMode);
  const toggleEditMode = useDashboardStore((s) => s.toggleEditMode);
  const openAddModal = useDashboardStore((s) => s.openAddModal);
  const resetToDefaultLayout = useDashboardStore((s) => s.resetToDefaultLayout);

  const handleResetConfirm = () => {
    if (window.confirm('대시보드 위젯 구성을 기본 초기 레이아웃으로 복원하시겠습니까?')) {
      resetToDefaultLayout();
    }
  };

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
          border: isEditMode ? '1px solid var(--primary)' : '1px solid var(--border-light)',
          borderRadius: 'var(--radius-xs)',
          flexWrap: 'wrap',
          gap: '8px',
          boxShadow: isEditMode ? '0 0 10px rgba(0, 122, 204, 0.2)' : undefined,
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
          {isEditMode && (
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                color: 'var(--text-on-primary)',
                background: 'var(--primary)',
                padding: '1px 6px',
                borderRadius: '3px',
              }}
            >
              대시보드 편집 모드
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Widget Add & Layout Edit Controls */}
          <Button
            variant="secondary"
            size="sm"
            icon={<Plus size={12} />}
            onClick={openAddModal}
            title="새 위젯 컴포넌트 추가"
          >
            위젯 추가
          </Button>

          <Button
            variant={isEditMode ? 'primary' : 'secondary'}
            size="sm"
            icon={isEditMode ? <Check size={12} /> : <LayoutGrid size={12} />}
            onClick={toggleEditMode}
            title="위젯 위치/크기/순서 편집"
          >
            {isEditMode ? '편집 완료' : '레이아웃 편집'}
          </Button>

          {isEditMode && (
            <Button
              variant="secondary"
              size="sm"
              icon={<RotateCcw size={12} />}
              onClick={handleResetConfirm}
              style={{ color: '#f14c4c' }}
              title="기본 위젯 레이아웃으로 초기화"
            >
              기본값 복원
            </Button>
          )}

          <Button
            variant="secondary"
            size="sm"
            icon={<RefreshCw size={12} className={isRefreshing ? 'animate-spin' : ''} />}
            onClick={handleRefresh}
          >
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

      {/* Edit Mode Guide Banner */}
      {isEditMode && (
        <div
          style={{
            background: 'rgba(0, 122, 204, 0.08)',
            border: '1px dashed var(--primary)',
            borderRadius: 'var(--radius-xs)',
            padding: '7px 12px',
            fontSize: '0.75rem',
            color: 'var(--text-bright)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>
              💡 <strong>위젯 편집 가이드:</strong> 각 위젯 카드의 <strong>모서리를 마우스로 자유롭게 드래그</strong>하여 크기(너비/높이)를 조절하고, 좌측 <strong>그립 아이콘(⋮⋮)을 잡고 끌어서 원하는 위치로 Drag & Drop</strong>하거나 <strong>화살표(▲/▼) 버튼</strong>으로 순서를 즉시 이동할 수 있습니다.
            </span>
          </div>
          <Button variant="primary" size="sm" icon={<Check size={12} />} onClick={toggleEditMode}>
            편집 완료
          </Button>
        </div>
      )}
    </>
  );
};