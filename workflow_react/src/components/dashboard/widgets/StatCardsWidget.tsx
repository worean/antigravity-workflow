import React from 'react';
import { useProjects, useIssues } from '@/api';
import { parseStatusCategory } from '@/utils/statusUtils';
import { DashboardStatCards } from '../DashboardStatCards';
import { Spinner } from '@/components/common';

export const StatCardsWidget: React.FC = () => {
  const { data: projects = [], isLoading: isProjLoading } = useProjects({ limit: 50 });
  const { data: statsIssues = [], isLoading: isIssuesLoading } = useIssues({ limit: 100, all: true });

  if (isProjLoading || isIssuesLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '80px' }}>
        <Spinner centered label="통계 집계 중..." />
      </div>
    );
  }

  const inProgressCount = statsIssues.filter((i) => {
    const cat = parseStatusCategory(i.statusId || i.status);
    return cat === 'IN_PROGRESS';
  }).length;

  const inReviewCount = statsIssues.filter((i) => {
    const cat = parseStatusCategory(i.statusId || i.status);
    return cat === 'IN_REVIEW';
  }).length;

  const doneCount = statsIssues.filter((i) => {
    const cat = parseStatusCategory(i.statusId || i.status);
    return cat === 'DONE';
  }).length;

  return (
    <DashboardStatCards
      projects={projects}
      statsIssues={statsIssues}
      inProgressCount={inProgressCount}
      inReviewCount={inReviewCount}
      doneCount={doneCount}
    />
  );
};
