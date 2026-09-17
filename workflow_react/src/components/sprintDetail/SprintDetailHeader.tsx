import React from 'react';
import { ArrowLeft, Play, CheckCircle2, RotateCcw, Edit3, Trash2 } from 'lucide-react';
import type { Sprint } from '@/types';
import { Button, StatusBadge, ProjectBadge, FavoriteButton } from '@/components/common';
import { getDDayStatus } from '@/utils/dateUtils';

interface SprintDetailHeaderProps {
  sprint: Sprint;
  isAuthenticated: boolean;
  onBack: () => void;
  handleQuickStatusChange: (sprintId: number, newStatus: string) => Promise<void>;
  handleOpenEditModal: (sprint: Sprint) => void;
  handleDeleteSprint: (sprintId: number) => Promise<void>;
  fetchData: () => Promise<void>;
  onOpenAuth?: () => void;
}

export const SprintDetailHeader: React.FC<SprintDetailHeaderProps> = ({
  sprint,
  isAuthenticated,
  onBack,
  handleQuickStatusChange,
  handleOpenEditModal,
  handleDeleteSprint,
  fetchData,
  onOpenAuth,
}) => {
  const isPlanned = sprint.status === 'PLANNED';
  const isActive = sprint.status === 'ACTIVE';
  const isCompleted = sprint.status === 'COMPLETED';
  const dday = getDDayStatus(sprint.endDate);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-light)',
        borderRadius: 'var(--radius-xs)',
        padding: '12px 16px',
        marginBottom: '10px',
      }}
    >
      {/* Left: Back button & Sprint Title & Badges */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Button size="sm" variant="ghost" icon={<ArrowLeft size={16} />} onClick={onBack}>
          목록으로
        </Button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-bright)', margin: 0 }}>
            {sprint.name}
          </h2>
          <ProjectBadge project={sprint.project} projectId={sprint.projectId} size="sm" />
          <StatusBadge status={sprint.status} size="sm" />
          <FavoriteButton
            targetType="SPRINT"
            targetId={sprint.id}
            isFavorite={sprint.isFavorite}
            size="sm"
            onOpenAuth={onOpenAuth}
            onToggleSuccess={() => fetchData()}
          />
        </div>
      </div>

      {/* Right: Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {dday && (
          <span
            style={{
              fontSize: '0.74rem',
              fontWeight: 600,
              padding: '3px 8px',
              borderRadius: '4px',
              color: dday.color,
              background: dday.bg,
            }}
          >
            {dday.label}
          </span>
        )}

        {/* Quick Status Toggle */}
        {isPlanned && isAuthenticated && (
          <Button
            size="sm"
            variant="primary"
            icon={<Play size={13} />}
            onClick={() => handleQuickStatusChange(sprint.id, 'ACTIVE')}
          >
            스프린트 시작
          </Button>
        )}
        {isActive && isAuthenticated && (
          <Button
            size="sm"
            variant="secondary"
            icon={<CheckCircle2 size={13} />}
            onClick={() => handleQuickStatusChange(sprint.id, 'COMPLETED')}
          >
            스프린트 완료
          </Button>
        )}
        {isCompleted && isAuthenticated && (
          <Button
            size="sm"
            variant="ghost"
            icon={<RotateCcw size={13} />}
            onClick={() => handleQuickStatusChange(sprint.id, 'ACTIVE')}
          >
            다시 열기
          </Button>
        )}

        {/* Edit & Delete */}
        {isAuthenticated && (
          <div style={{ display: 'flex', gap: '4px' }}>
            <Button
              size="sm"
              variant="ghost"
              icon={<Edit3 size={13} />}
              onClick={() => handleOpenEditModal(sprint)}
              title="스프린트 수정"
            />
            <Button
              size="sm"
              variant="ghost"
              icon={<Trash2 size={13} color="#f43f5e" />}
              onClick={() => handleDeleteSprint(sprint.id)}
              title="스프린트 삭제"
            />
          </div>
        )}
      </div>
    </div>
  );
};