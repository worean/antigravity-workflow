// -*- coding: utf-8 -*-
import React, { useState, useEffect } from 'react';
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
import type { Sprint } from '@/types';
import { StatusBadge, ProjectBadge, FavoriteButton } from '@/components/common';
import { formatDateOnly } from '@/utils/dateUtils';

interface SprintCardProps {
  sprint: Sprint;
  isAuthenticated: boolean;
  getSprintProgress: (sprint: Sprint) => { total: number; done: number; inProgress: number; todo: number; rate: number };
  getDDayBadge: (sprint: Sprint) => React.ReactNode;
  handleQuickStatusChange: (sprintId: number, newStatus: string) => Promise<void>;
  handleOpenManageModal: (sprint: Sprint) => void;
  handleOpenDetailModal?: (sprint: Sprint) => void;
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
  handleOpenDetailModal,
  handleOpenEditModal,
  handleDeleteSprint,
  fetchData,
  onOpenAuth,
}) => {
  const [localIsFav, setLocalIsFav] = useState<boolean>(!!sprint.isFavorite);

  useEffect(() => {
    setLocalIsFav(!!sprint.isFavorite);
  }, [sprint.isFavorite]);

  const prog = getSprintProgress(sprint);
  const isPlanned = sprint.status === 'PLANNED';
  const isActive = sprint.status === 'ACTIVE';
  const isCompleted = sprint.status === 'COMPLETED';

  return (
    <div
      key={sprint.id}
      style={{
        background: localIsFav ? '#23221e' : '#252526',
        border: localIsFav
          ? '1px solid rgba(234, 179, 8, 0.45)'
          : isActive
          ? '1px solid #007acc'
          : '1px solid var(--border-light)',
        borderRadius: 'var(--radius-xs)',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        boxShadow: localIsFav
          ? '0 0 10px rgba(234, 179, 8, 0.12)'
          : isActive
          ? '0 0 8px rgba(0,122,204,0.15)'
          : 'none',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.15s ease',
      }}
    >
      {/* Gold Top Accent Line for Favorite Sprint */}
      {localIsFav && (
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
          <span
            onClick={() => handleOpenDetailModal && handleOpenDetailModal(sprint)}
            style={{
              fontWeight: 600,
              fontSize: '0.9rem',
              color: 'var(--text-bright)',
              cursor: handleOpenDetailModal ? 'pointer' : 'default',
            }}
            title="스프린트 협업 허브 열기"
          >
            {sprint.name}
          </span>
          <ProjectBadge project={sprint.project} projectId={sprint.projectId} size="sm" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <FavoriteButton
            targetType="SPRINT"
            targetId={sprint.id}
            isFavorite={localIsFav}
            size="sm"
            onOpenAuth={onOpenAuth}
            onToggleSuccess={(nextFav) => {
              setLocalIsFav(nextFav);
              fetchData();
            }}
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
          color: 'var(--text-muted)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Calendar size={12} color="var(--text-muted)" />
          <span>
            {formatDateOnly(sprint.startDate) || '미정'} ~ {formatDateOnly(sprint.endDate) || '미정'}
          </span>
        </div>
        {getDDayBadge(sprint)}
      </div>

      {/* Progress Bar & Rate */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-sub)', marginBottom: '3px' }}>
          <span>진척도 ({prog.done}/{prog.total}개 완료)</span>
          <span style={{ fontWeight: 600, color: 'var(--text-bright)' }}>{prog.rate}%</span>
        </div>
        <div style={{ width: '100%', height: '5px', background: '#333', borderRadius: '3px', overflow: 'hidden' }}>
          <div
            style={{
              width: `${prog.rate}%`,
              height: '100%',
              background: prog.rate === 100 ? 'var(--status-done)' : 'var(--primary)',
              borderRadius: '3px',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      </div>

      {/* Card Action Buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '4px' }}>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {/* Quick Status Toggle */}
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

          {/* Collaboration Hub Button */}
          {handleOpenDetailModal && (
            <button
              onClick={() => handleOpenDetailModal(sprint)}
              className="btn btn-secondary btn-sm"
              style={{
                height: '22px',
                fontSize: '0.68rem',
                padding: '0 6px',
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                background: 'rgba(59, 130, 246, 0.15)',
                color: '#60a5fa',
                border: '1px solid rgba(59, 130, 246, 0.3)',
              }}
              title="스프린트 실시간 논의, 작업 일지 및 회의록 열기"
            >
              💬 협업 허브 & 회의록
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