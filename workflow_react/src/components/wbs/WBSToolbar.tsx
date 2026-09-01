import React from 'react';
import type { Project, Sprint } from '@/types';
import {
  Layers,
  Maximize2,
  Minimize2,
  Clock,
  ZoomIn,
  ZoomOut,
  Loader2,
  LogIn,
} from 'lucide-react';
import { Button } from '@/components/common';

interface WBSToolbarProps {
  projects: Project[];
  selectedProjectId: number | null;
  onSelectProject: (projectId: number) => void;
  sprints: Sprint[];
  selectedSprintId: number | 'ALL';
  onSelectSprint: (sprintId: number | 'ALL') => void;
  dayWidth: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onSetScalePreset: (preset: 'day' | 'week' | 'month') => void;
  currentViewScale: 'day' | 'week' | 'month';
  onExpandAll: () => void;
  onCollapseAll: () => void;
  onScrollToToday: () => void;
  isAuthenticated: boolean;
  onOpenAuth?: () => void;
  isBackgroundSyncing: boolean;
  updatingIssueId: number | null;
}

export const WBSToolbar: React.FC<WBSToolbarProps> = ({
  projects,
  selectedProjectId,
  onSelectProject,
  sprints,
  selectedSprintId,
  onSelectSprint,
  dayWidth,
  onZoomIn,
  onZoomOut,
  onSetScalePreset,
  currentViewScale,
  onExpandAll,
  onCollapseAll,
  onScrollToToday,
  isAuthenticated,
  onOpenAuth,
  isBackgroundSyncing,
  updatingIssueId,
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
        flexShrink: 0,
      }}
    >
      {/* Left: Project & Sprint Filter */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Layers size={16} color="var(--accent-cyan)" />
          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-bright)' }}>
            WBS 간트 차트
          </span>
        </div>

        {/* Project Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>프로젝트:</span>
          <select
            className="input-field"
            value={selectedProjectId || ''}
            onChange={(e) => onSelectProject(Number(e.target.value))}
            style={{ width: 'auto', fontSize: '0.75rem', height: '26px', padding: '0 6px' }}
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.key})
              </option>
            ))}
          </select>
        </div>

        {/* Sprint Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>스프린트:</span>
          <select
            className="input-field"
            value={String(selectedSprintId)}
            onChange={(e) => onSelectSprint(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
            style={{ width: 'auto', fontSize: '0.75rem', height: '26px', padding: '0 6px' }}
          >
            <option value="ALL">전체 스프린트 및 백로그</option>
            {sprints.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.status})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Right: Zoom Scale & View Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Zoom In / Out Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', background: '#2d2d2d', borderRadius: 'var(--radius-xs)', border: '1px solid #3c3c3c' }}>
          <button
            type="button"
            onClick={onZoomOut}
            style={{ background: 'none', border: 'none', color: 'var(--text-sub)', padding: '3px 6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            title="축소 (Ctrl + 휠 아래로)"
          >
            <ZoomOut size={13} />
          </button>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', padding: '0 4px', minWidth: '32px', textAlign: 'center' }}>
            {Math.round((dayWidth / 36) * 100)}%
          </span>
          <button
            type="button"
            onClick={onZoomIn}
            style={{ background: 'none', border: 'none', color: 'var(--text-sub)', padding: '3px 6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            title="확대 (Ctrl + 휠 위로)"
          >
            <ZoomIn size={13} />
          </button>
        </div>

        {/* Scale Preset Buttons */}
        <div style={{ display: 'flex', gap: '2px', background: '#2d2d2d', padding: '2px', borderRadius: 'var(--radius-xs)', border: '1px solid #3c3c3c' }}>
          <button
            type="button"
            onClick={() => onSetScalePreset('day')}
            style={{
              background: currentViewScale === 'day' ? 'var(--primary)' : 'transparent',
              color: currentViewScale === 'day' ? '#fff' : 'var(--text-muted)',
              border: 'none',
              borderRadius: '2px',
              padding: '2px 8px',
              fontSize: '0.7rem',
              cursor: 'pointer',
              fontWeight: currentViewScale === 'day' ? 600 : 400,
            }}
          >
            일단위
          </button>
          <button
            type="button"
            onClick={() => onSetScalePreset('week')}
            style={{
              background: currentViewScale === 'week' ? 'var(--primary)' : 'transparent',
              color: currentViewScale === 'week' ? '#fff' : 'var(--text-muted)',
              border: 'none',
              borderRadius: '2px',
              padding: '2px 8px',
              fontSize: '0.7rem',
              cursor: 'pointer',
              fontWeight: currentViewScale === 'week' ? 600 : 400,
            }}
          >
            주단위
          </button>
          <button
            type="button"
            onClick={() => onSetScalePreset('month')}
            style={{
              background: currentViewScale === 'month' ? 'var(--primary)' : 'transparent',
              color: currentViewScale === 'month' ? '#fff' : 'var(--text-muted)',
              border: 'none',
              borderRadius: '2px',
              padding: '2px 8px',
              fontSize: '0.7rem',
              cursor: 'pointer',
              fontWeight: currentViewScale === 'month' ? 600 : 400,
            }}
          >
            월단위
          </button>
        </div>

        <Button variant="secondary" size="sm" onClick={onScrollToToday} style={{ height: '26px', fontSize: '0.74rem' }}>
          <Clock size={12} style={{ marginRight: '4px' }} /> 오늘
        </Button>

        <Button variant="secondary" size="sm" onClick={onExpandAll} style={{ height: '26px', fontSize: '0.74rem' }}>
          <Maximize2 size={12} style={{ marginRight: '4px' }} /> 모두 펼치기
        </Button>

        <Button variant="secondary" size="sm" onClick={onCollapseAll} style={{ height: '26px', fontSize: '0.74rem' }}>
          <Minimize2 size={12} style={{ marginRight: '4px' }} /> 모두 접기
        </Button>

        {!isAuthenticated && onOpenAuth && (
          <Button variant="primary" size="sm" onClick={onOpenAuth} style={{ height: '26px', fontSize: '0.74rem' }}>
            <LogIn size={12} style={{ marginRight: '4px' }} /> 로그인
          </Button>
        )}

        {(isBackgroundSyncing || updatingIssueId) && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.7rem',
              color: 'var(--accent-cyan)',
              background: 'rgba(0, 122, 204, 0.1)',
              padding: '2px 6px',
              borderRadius: '4px',
            }}
          >
            <Loader2 size={12} className="animate-spin" />
            <span>동기화 중</span>
          </div>
        )}
      </div>
    </div>
  );
};