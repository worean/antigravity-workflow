import React from 'react';
import { useFavorites } from '@/api';
import { useAuth } from '@/context/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { DashboardFocusSprints } from '../DashboardFocusSprints';
import { parseStatusCategory } from '@/utils/statusUtils';
import { Spinner } from '@/components/common';

interface FocusSprintsWidgetProps {
  onNavigate?: (tab: any, projectId?: number | null) => void;
  onOpenAuth?: () => void;
}

export const FocusSprintsWidget: React.FC<FocusSprintsWidgetProps> = ({
  onNavigate = () => {},
  onOpenAuth,
}) => {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const { data: favSprintsData = [], isLoading } = useFavorites('SPRINT', {
    enabled: isAuthenticated,
  });
  const favoriteSprints: any[] = favSprintsData.map((f) => f.detail).filter(Boolean);

  const getSprintProgress = (sprint: any) => {
    const issues = sprint.issues || [];
    if (issues.length === 0) {
      return { total: sprint._count?.issues || 0, done: 0, inProgress: 0, todo: 0, rate: 0 };
    }

    let done = 0;
    let inProgress = 0;
    let todo = 0;

    for (const iss of issues) {
      const cat = iss.status?.category || parseStatusCategory(iss.statusId || iss.status);
      if (cat === 'DONE') done++;
      else if (cat === 'IN_PROGRESS' || cat === 'IN_REVIEW') inProgress++;
      else todo++;
    }

    const total = issues.length;
    const rate = total > 0 ? Math.round((done / total) * 100) : 0;
    return { total, done, inProgress, todo, rate };
  };

  const getDDayBadge = (sprint: any) => {
    if (sprint.status === 'COMPLETED') {
      return <span style={{ fontSize: '0.68rem', color: '#89d185', background: 'rgba(137,209,133,0.15)', padding: '1px 6px', borderRadius: '3px', fontWeight: 600 }}>완료됨</span>;
    }
    if (!sprint.endDate) {
      return <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '1px 6px', borderRadius: '3px' }}>기한 미설정</span>;
    }

    const end = new Date(sprint.endDate);
    end.setHours(23, 59, 59, 999);
    const now = new Date();
    const diffDays = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return <span style={{ fontSize: '0.68rem', color: '#f14c4c', background: 'rgba(241,76,76,0.15)', padding: '1px 6px', borderRadius: '3px', fontWeight: 600 }}>{Math.abs(diffDays)}일 초과</span>;
    }
    if (diffDays === 0) {
      return <span style={{ fontSize: '0.68rem', color: '#cca700', background: 'rgba(204,167,0,0.18)', padding: '1px 6px', borderRadius: '3px', fontWeight: 700 }}>D-Day (오늘 마감)</span>;
    }
    return <span style={{ fontSize: '0.68rem', color: '#9cdcfe', background: 'rgba(0,122,204,0.15)', padding: '1px 6px', borderRadius: '3px', fontWeight: 600 }}>D-{diffDays}일 남음</span>;
  };

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['favorites', 'SPRINT'] });
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '120px' }}>
        <Spinner centered label="관심 스프린트 로딩 중..." />
      </div>
    );
  }

  return (
    <DashboardFocusSprints
      favoriteSprints={favoriteSprints}
      onNavigate={onNavigate}
      getSprintProgress={getSprintProgress}
      getDDayBadge={getDDayBadge}
      handleRefresh={handleRefresh}
      onOpenAuth={onOpenAuth}
    />
  );
};
