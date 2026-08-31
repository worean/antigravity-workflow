// -*- coding: utf-8 -*-
import React from 'react';
import type { Sprint } from '@/types';
import { Card, Spinner } from '@/components/common';
import { SprintCard } from './SprintCard';
import type { SprintStatusFilter } from './SprintToolbar';

interface SprintGridProps {
  filteredSprints: Sprint[];
  loading: boolean;
  sprintsCount: number;
  statusFilter: SprintStatusFilter;
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

export const SprintGrid: React.FC<SprintGridProps> = ({
  filteredSprints,
  loading,
  sprintsCount,
  statusFilter,
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
  if (loading && sprintsCount === 0) {
    return <Spinner centered label="스프린트 불러오는 중..." />;
  }

  if (filteredSprints.length === 0) {
    return (
      <Card variant="glass" padding="28px" style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
        {statusFilter === 'ALL' ? '등록된 스프린트가 없습니다. 새로운 스프린트를 생성해 보세요!' : '해당 상태의 스프린트가 없습니다.'}
      </Card>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '10px' }}>
      {filteredSprints.map((s) => (
        <SprintCard
          key={s.id}
          sprint={s}
          isAuthenticated={isAuthenticated}
          getSprintProgress={getSprintProgress}
          getDDayBadge={getDDayBadge}
          handleQuickStatusChange={handleQuickStatusChange}
          handleOpenManageModal={handleOpenManageModal}
          handleOpenDetailModal={handleOpenDetailModal}
          handleOpenEditModal={handleOpenEditModal}
          handleDeleteSprint={handleDeleteSprint}
          fetchData={fetchData}
          onOpenAuth={onOpenAuth}
        />
      ))}
    </div>
  );
};