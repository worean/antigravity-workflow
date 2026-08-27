// -*- coding: utf-8 -*-
import React from 'react';
import { Zap } from 'lucide-react';
import type { Sprint } from '../../types';
import type { SprintStatusFilter } from './SprintToolbar';

interface SprintStarredHudProps {
  sprints: Sprint[];
  statusFilter: SprintStatusFilter;
  setStatusFilter: (filter: SprintStatusFilter) => void;
  getSprintProgress: (sprint: Sprint) => { total: number; done: number; inProgress: number; todo: number; rate: number };
  handleOpenManageModal: (sprint: Sprint) => void;
}

export const SprintStarredHud: React.FC<SprintStarredHudProps> = ({
  sprints,
  statusFilter,
  setStatusFilter,
  getSprintProgress,
  handleOpenManageModal,
}) => {
  const starredSprints = sprints.filter((s) => s.isFavorite);
  if (statusFilter === 'STARRED' || starredSprints.length === 0) return null;

  return (
    <div
      style={{
        background: 'linear-gradient(90deg, rgba(234, 179, 8, 0.12) 0%, rgba(202, 138, 4, 0.05) 100%)',
        border: '1px solid rgba(234, 179, 8, 0.35)',
        borderRadius: 'var(--radius-xs)',
        padding: '8px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '10px',
        flexWrap: 'wrap',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#eab308', fontWeight: 600, fontSize: '0.8rem' }}>
          <Zap size={14} />
          <span>집중 모니터링 중인 스프린트 ({starredSprints.length}개):</span>
        </div>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {starredSprints.map((fav) => {
            const p = getSprintProgress(fav);
            return (
              <button
                key={fav.id}
                onClick={() => handleOpenManageModal(fav)}
                style={{
                  background: 'rgba(0, 0, 0, 0.35)',
                  border: '1px solid rgba(234, 179, 8, 0.3)',
                  borderRadius: '3px',
                  padding: '3px 8px',
                  fontSize: '0.73rem',
                  color: 'var(--text-bright)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(234, 179, 8, 0.2)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(0, 0, 0, 0.35)')}
                title="클릭하여 상세 및 이슈 목록 보기"
              >
                <span style={{ fontWeight: 600 }}>{fav.name}</span>
                <span style={{ color: p.rate === 100 ? '#4ec9b0' : '#38bdf8', fontSize: '0.68rem', fontWeight: 700 }}>
                  {p.rate}%
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        onClick={() => setStatusFilter('STARRED')}
        style={{
          background: 'none',
          border: 'none',
          color: '#eab308',
          fontSize: '0.72rem',
          fontWeight: 600,
          cursor: 'pointer',
          textDecoration: 'underline',
          padding: 0,
        }}
      >
        즐겨찾기만 필터링 보기 →
      </button>
    </div>
  );
};