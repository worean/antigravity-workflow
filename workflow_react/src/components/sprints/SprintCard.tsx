// -*- coding: utf-8 -*-
import React from 'react';
import {
  Target,
  Calendar,
  Play,
  CheckCircle2,
  RotateCcw,
  Layers,
  Edit3,
  Trash2,
} from 'lucide-react';
import type { Sprint } from '../../types';
import { StatusBadge, ProjectBadge, FavoriteButton } from '../common';
import { formatDateOnly } from '../../utils/dateUtils';

interface SprintCardProps {
  sprint: Sprint;
  isAuthenticated: boolean;
  getSprintProgress: (sprint: Sprint) => { total: number; done: number; inProgress: number; todo: number; rate: number };
  getDDayBadge: (sprint: Sprint) => React.ReactNode;
  handleQuickStatusChange: (sprintId: number, newStatus: string) => Promise<void>;
  handleOpenManageModal: (sprint: Sprint) => void;
  handleOpenEditModal: (sprint: Sprint) => void;
  handleDeleteSprint: (sprintId: number) => Promise<void>;
  fetchData: () => Promise<void>;
  onOpenAuth?: () => void;
}

export const SprintCard: React.FC<SprintCardProps> = ({
  sprint,
  isAuthenticated,
  getSprintProgress,
  getDDayBadge,
  handleQuickStatusChange,
  handleOpenManageModal,
  handleOpenEditModal,
  handleDeleteSprint,
  fetchData,
  onOpenAuth,
}) => {
  const prog = getSprintProgress(sprint);
  const isPlanned = sprint.status === 'PLANNED';
  const isActive = sprint.status === 'ACTIVE';
  const isCompleted = sprint.status === 'COMPLETED';

  return (
    <div
      key={sprint.id}
      style={{
        background: sprint.isFavorite ? '#23221e' : '#252526',
        border: sprint.isFavorite
          ? '1px solid rgba(234, 179, 8, 0.45)'
          : isActive
          ? '1px solid #007acc'
          : '1px solid var(--border-light)',
        borderRadius: 'var(--radius-xs)',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        boxShadow: sprint.isFavorite
          ? '0 0 10px rgba(234, 179, 8, 0.12)'
          : isActive
          ? '0 0 8px rgba(0,122,204,0.15)'
          : 'none',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Gold Top Accent Line for Favorite Sprint */}
      {sprint.isFavorite && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: 'linear-gradient(90deg, #eab308, #ca8a04)',
          }}
        />
      )}

      {/* Card Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-bright)' }}>
            {sprint.name}
          </span>
          <ProjectBadge project={sprint.project} projectId={sprint.projectId} size="sm" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <FavoriteButton
            targetType="SPRINT"
            targetId={sprint.id}
            isFavorite={sprint.isFavorite}
            size="sm"
            onOpenAuth={onOpenAuth}
            onToggleSuccess={() => fetchData()}
          />
          <StatusBadge status={sprint.status} size="sm" />
        </div>
      </div>

      {/* Goal */}
      <div style={{ fontSize: '0.75rem', color: 'var(--text-sub)', display: 'flex', alignItems: 'flex-start', gap: '5px', minHeight: '18px' }}>
        <Target size={13} color="#cca700" style={{ marginTop: '1px', flexShrink: 0 }} />
        <span style={{ lineHeight: '1.3' }}>{sprint.goal || '설정된 목표가 없습니다.'}</span>
      </div>

      {/* Dates & D-Day */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#1e1e1e',
          padding: '5px 8px',
          borderRadius: 'var(--radius-xs)',
          fontSize: '0.72rem',
          color: 'var(--text-sub)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Calendar size={12} color="var(--text-muted)" />
          <span>
            {formatDateOnly(sprint.startDate) || '시작일 미정'} ~ {formatDateOnly(sprint.endDate) || '기한 미정'}
          </span>
        </div>
        {getDDayBadge(sprint)}
      </div>

      {/* Progress Bar & Issue Counts */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '2px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          <span>진척도 ({prog.rate}%)</span>
          <span>완료 {prog.done} / 전체 {prog.total}개 이슈</span>
        </div>
        <div style={{ width: '100%', height: '5px', background: '#333333', borderRadius: '3px', overflow: 'hidden', display: 'flex' }}>
          <div style={{ width: `${prog.rate}%`, background: '#89d185', transition: 'width 0.3s' }} />
        </div>
      </div>

      {/* Action Toolbar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTop: '1px solid #383838',
          paddingTop: '8px',
          marginTop: '4px',
        }}
      >
        {/* Status Change Buttons */}
        <div style={{ display: 'flex', gap: '4px' }}>
          {isPlanned && isAuthenticated && (
            <button
              onClick={() => handleQuickStatusChange(sprint.id, 'ACTIVE')}
              className="btn btn-sm"
              style={{ background: 'rgba(0,122,204,0.2)', color: '#9cdcfe', border: '1px solid #007acc', height: '22px', fontSize: '0.68rem', padding: '0 6px', display: 'flex', alignItems: 'center', gap: '3px' }}
              title="스프린트 시작"
            >
              <Play size={10} /> 시작
            </button>
          )}
          {isActive && isAuthenticated && (
            <button
              onClick={() => handleQuickStatusChange(sprint.id, 'COMPLETED')}
              className="btn btn-sm"
              style={{ background: 'rgba(137,209,133,0.2)', color: '#89d185', border: '1px solid #89d185', height: '22px', fontSize: '0.68rem', padding: '0 6px', display: 'flex', alignItems: 'center', gap: '3px' }}
              title="스프린트 완료 처리"
            >
              <CheckCircle2 size={10} /> 완료
            </button>
          )}
          {isCompleted && isAuthenticated && (
            <button
              onClick={() => handleQuickStatusChange(sprint.id, 'ACTIVE')}
              className="btn btn-sm"
              style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-sub)', border: '1px solid #444', height: '22px', fontSize: '0.68rem', padding: '0 6px', display: 'flex', alignItems: 'center', gap: '3px' }}
              title="다시 진행 중으로 변경"
            >
              <RotateCcw size={10} /> 다시 열기
            </button>
          )}

          {/* Manage Issues Button */}
          <button
            onClick={() => handleOpenManageModal(sprint)}
            className="btn btn-secondary btn-sm"
            style={{ height: '22px', fontSize: '0.68rem', padding: '0 6px', display: 'flex', alignItems: 'center', gap: '3px' }}
            title="스프린트 이슈 할당 및 백로그 관리"
          >
            <Layers size={10} /> 이슈 관리 ({sprint._count?.issues ?? (sprint.issues?.length || 0)})
          </button>
        </div>

        {/* Edit / Delete */}
        {isAuthenticated && (
          <div style={{ display: 'flex', gap: '2px' }}>
            <button
              onClick={() => handleOpenEditModal(sprint)}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '3px' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-bright)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
              title="스프린트 수정"
            >
              <Edit3 size={12} />
            </button>
            <button
              onClick={() => handleDeleteSprint(sprint.id)}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '3px' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#f14c4c')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
              title="스프린트 삭제"
            >
              <Trash2 size={12} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};