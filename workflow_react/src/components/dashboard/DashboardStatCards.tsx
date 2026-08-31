// -*- coding: utf-8 -*-
import React from 'react';
import { FolderKanban, CheckSquare, Clock, CheckCircle2 } from 'lucide-react';
import type { Project, Issue } from '@/types';

interface DashboardStatCardsProps {
  projects: Project[];
  statsIssues: Issue[];
  inProgressCount: number;
  inReviewCount: number;
  doneCount: number;
}

export const DashboardStatCards: React.FC<DashboardStatCardsProps> = ({
  projects,
  statsIssues,
  inProgressCount,
  inReviewCount,
  doneCount,
}) => {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px' }}>
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-xs)',
          padding: '8px 12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 600 }}>총 프로젝트</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-bright)', marginTop: '2px' }}>
            {projects.length}
          </div>
        </div>
        <FolderKanban size={18} color="#9cdcfe" />
      </div>

      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-xs)',
          padding: '8px 12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 600 }}>전체 이슈</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-bright)', marginTop: '2px' }}>
            {statsIssues.length}
          </div>
        </div>
        <CheckSquare size={18} color="var(--primary)" />
      </div>

      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-xs)',
          padding: '8px 12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 600 }}>진행 / 검토 중</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#cca700', marginTop: '2px' }}>
            {inProgressCount + inReviewCount}
          </div>
        </div>
        <Clock size={18} color="#cca700" />
      </div>

      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-xs)',
          padding: '8px 12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 600 }}>완료된 작업</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#4ec9b0', marginTop: '2px' }}>
            {doneCount}
          </div>
        </div>
        <CheckCircle2 size={18} color="#4ec9b0" />
      </div>
    </div>
  );
};