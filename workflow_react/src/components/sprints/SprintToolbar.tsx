import React from 'react';
import { Zap, Plus, LogIn } from 'lucide-react';
import type { Project } from '@/types';
import { Button } from '@/components/common';

export type SprintStatusFilter = 'ALL' | 'STARRED' | 'PLANNED' | 'ACTIVE' | 'COMPLETED';

interface SprintToolbarProps {
  statusFilter: SprintStatusFilter;
  setStatusFilter: (filter: SprintStatusFilter) => void;
  selectedProjectId: number | 'ALL';
  setSelectedProjectId: (id: number | 'ALL') => void;
  filteredSprintsCount: number;
  projects: Project[];
  isAuthenticated: boolean;
  onFilterChange?: (projectId: number | 'ALL') => void;
  onOpenAuth?: () => void;
  handleOpenCreateModal: () => void;
}

export const SprintToolbar: React.FC<SprintToolbarProps> = ({
  statusFilter,
  setStatusFilter,
  selectedProjectId,
  setSelectedProjectId,
  filteredSprintsCount,
  projects,
  isAuthenticated,
  onFilterChange,
  onOpenAuth,
  handleOpenCreateModal,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 12px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-light)',
        borderRadius: 'var(--radius-xs)',
        flexWrap: 'wrap',
        gap: '8px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Zap size={16} color="#cca700" />
          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-bright)' }}>
            스프린트 관리 ({filteredSprintsCount})
          </span>
        </div>

        {/* Status Tabs */}
        <div style={{ display: 'flex', gap: '3px', background: '#1e1e1e', padding: '2px', borderRadius: 'var(--radius-xs)', border: '1px solid #383838' }}>
          {(['ALL', 'STARRED', 'PLANNED', 'ACTIVE', 'COMPLETED'] as SprintStatusFilter[]).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              style={{
                background: statusFilter === st ? 'var(--bg-card)' : 'none',
                color: statusFilter === st ? (st === 'STARRED' ? '#eab308' : 'var(--text-bright)') : 'var(--text-muted)',
                border: 'none',
                fontSize: '0.72rem',
                fontWeight: statusFilter === st ? 600 : 400,
                padding: '3px 8px',
                borderRadius: '2px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
              }}
            >
              {st === 'ALL' ? '전체' : st === 'STARRED' ? '⭐ 즐겨찾기' : st === 'PLANNED' ? '계획 중' : st === 'ACTIVE' ? '진행 중' : '완료됨'}
            </button>
          ))}
        </div>

        {/* Project Filter */}
        <select
          className="input-field"
          value={selectedProjectId}
          onChange={(e) => {
            const val = e.target.value === 'ALL' ? 'ALL' : Number(e.target.value);
            setSelectedProjectId(val);
            if (onFilterChange) onFilterChange(val);
          }}
          style={{ width: 'auto', fontSize: '0.75rem', height: '26px', padding: '0 6px' }}
        >
          <option value="ALL">모든 프로젝트</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.key})
            </option>
          ))}
        </select>
      </div>

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
          onClick={handleOpenCreateModal}
        >
          스프린트 생성
        </Button>
      )}
    </div>
  );
};