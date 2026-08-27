import React from 'react';
import type { Project, Sprint } from '../../types';
import {
  Layers,
  Maximize2,
  Minimize2,
  Clock,
  ZoomIn,
  ZoomOut,
  Loader2,
} from 'lucide-react';
import { Button } from '../common';

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
  isBackgroundSyncing: boolean;
  totalIssuesCount?: number;
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
  isBackgroundSyncing,
  totalIssuesCount = 0,
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
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.06)', padding: '1px 6px', borderRadius: '3px' }}>
            총 {totalIssuesCount}개
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

        {/* Expand / Collapse All */}
        <div style={{ display: 'flex', gap: '4px' }}>
          <Button variant="secondary" size="sm" onClick={onExpandAll} title="모든 하위 이슈 펼치기" style={{ height: '26px', padding: '0 6px', fontSize: '0.72rem' }}>
            <Maximize2 size={12} style={{ marginRight: '3px' }} /> 모두 펼치기
          </Button>
          <Button variant="secondary" size="sm" onClick={onCollapseAll} title="모든 하위 이슈 접기" style={{ height: '26px', padding: '0 6px', fontSize: '0.72rem' }}>
            <Minimize2 size={12} style={{ marginRight: '3px' }} /> 모두 접기
          </Button>
        </div>

        {/* Today Navigation */}
        <Button variant="primary" size="sm" onClick={onScrollToToday} style={{ height: '26px', padding: '0 8px', fontSize: '0.72rem' }}>
          <Clock size={12} style={{ marginRight: '4px' }} /> 오늘로 이동
        </Button>

        {/* Background Syncing Indicator */}
        {isBackgroundSyncing && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-cyan)', fontSize: '0.7rem' }} title="서버와 최신 일정 동기화 중...">
            <Loader2 size={13} className="spin" />
            <span>동기화 중</span>
          </div>
        )}
      </div>
    </div>
  );
};