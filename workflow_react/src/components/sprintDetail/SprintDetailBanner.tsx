// -*- coding: utf-8 -*-
import React from 'react';
import { Target, Calendar, CheckCircle2, Clock, Layers } from 'lucide-react';
import type { Sprint } from '@/types';
import { formatDateOnly } from '@/utils/dateUtils';

interface SprintDetailBannerProps {
  sprint: Sprint;
}

export const SprintDetailBanner: React.FC<SprintDetailBannerProps> = ({ sprint }) => {
  const sprintIssues = sprint.issues || [];
  const total = sprintIssues.length;
  const done = sprintIssues.filter((i) => i.status?.category === 'DONE' || i.statusId === 3).length;
  const inProgress = sprintIssues.filter((i) => i.status?.category === 'IN_PROGRESS' || i.statusId === 2).length;
  const todo = total - done - inProgress;
  const rate = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(30, 31, 34, 0.6) 100%)',
        border: '1px solid var(--border-light)',
        borderRadius: 'var(--radius-xs)',
        padding: '14px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        marginBottom: '10px',
      }}
    >
      {/* Top: Goal & Dates */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', flex: 1, minWidth: '260px' }}>
          <Target size={16} color="#cca700" style={{ marginTop: '2px', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>스프린트 목표 (Goal)</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-bright)' }}>
              {sprint.goal || '설정된 스프린트 목표가 없습니다.'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <Calendar size={14} />
          <span>
            {formatDateOnly(sprint.startDate) || '시작일 미정'} ~ {formatDateOnly(sprint.endDate) || '기한 미정'}
          </span>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '10px',
          background: 'rgba(0, 0, 0, 0.2)',
          padding: '10px 14px',
          borderRadius: 'var(--radius-xs)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Layers size={18} color="var(--primary)" />
          <div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>전체 이슈</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-bright)' }}>{total}개</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={18} color="#10b981" />
          <div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>완료된 이슈</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#10b981' }}>{done}개</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={18} color="#3b82f6" />
          <div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>진행 중</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#60a5fa' }}>{inProgress}개</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1rem' }}>📋</span>
          <div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>할 일 (TODO)</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-muted)' }}>{todo}개</div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '3px' }}>
          <span>스프린트 진척도</span>
          <span style={{ fontWeight: 700, color: 'var(--text-bright)' }}>{rate}%</span>
        </div>
        <div style={{ width: '100%', height: '6px', background: '#27272a', borderRadius: '3px', overflow: 'hidden' }}>
          <div
            style={{
              width: `${rate}%`,
              height: '100%',
              background: rate === 100 ? '#10b981' : 'var(--primary)',
              borderRadius: '3px',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      </div>
    </div>
  );
};