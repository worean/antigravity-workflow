import React from 'react';
import { Clock, LogIn, Plus } from 'lucide-react';
import { Button } from '@/components/common';

interface WorklogsHeaderToolbarProps {
  worklogsCount: number;
  isAuthenticated: boolean;
  showForm: boolean;
  setShowForm: (show: boolean) => void;
  onOpenAuth?: () => void;
}

export const WorklogsHeaderToolbar: React.FC<WorklogsHeaderToolbarProps> = ({
  worklogsCount,
  isAuthenticated,
  showForm,
  setShowForm,
  onOpenAuth,
}) => {
  return (
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
        <Clock size={14} color="var(--accent-cyan)" />
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-bright)' }}>
          작업 로그 (Worklogs - {worklogsCount}건)
        </span>
      </div>

      <div style={{ display: 'flex', gap: '6px' }}>
        {!isAuthenticated && onOpenAuth && (
          <Button variant="primary" size="sm" icon={<LogIn size={12} />} onClick={onOpenAuth}>
            로그인
          </Button>
        )}

        {isAuthenticated && (
          <Button
            variant="primary"
            size="sm"
            icon={<Plus size={12} />}
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? '닫기' : '작업 시간 기록'}
          </Button>
        )}
      </div>
    </div>
  );
};