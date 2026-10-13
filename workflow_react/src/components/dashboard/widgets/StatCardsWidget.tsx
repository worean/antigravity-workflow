import React, { useMemo } from 'react';
import { useIssues } from '@/api';
import { parseStatusCategory } from '@/utils/statusUtils';
import { DashboardStatCards } from '../DashboardStatCards';
import { Spinner } from '@/components/common';
import { BarChart3 } from 'lucide-react';
import type { WidgetProps, Widgetable } from '@/types/widget';
import { useInvolvedProjects } from '@/hooks/useInvolvedProjects';
import { filterUserInvolvedIssues } from '@/utils/issueFilters';

export const StatCardsWidget: React.FC<WidgetProps> = () => {
  const { myProjectIds, allProjects, user, isAuthenticated } = useInvolvedProjects();

  const { data: rawStatsIssues = [], isLoading: isIssuesLoading } = useIssues(
    { limit: 100, onlyInvolved: true, all: true },
    { enabled: isAuthenticated }
  );

  // ⭐️ 자신이 속한 프로젝트들만 필터링
  const projects = useMemo(() => {
    return allProjects.filter((p) => myProjectIds.has(p.id));
  }, [allProjects, myProjectIds]);

  // ⭐️ 자신이 속한 프로젝트이거나 담당/보고한 일감만 필터링
  const statsIssues = useMemo(() => {
    return filterUserInvolvedIssues(rawStatsIssues, user, myProjectIds);
  }, [rawStatsIssues, user, myProjectIds]);

  if (isIssuesLoading) {
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

export const statCardsWidgetDefinition: Widgetable = {
  type: 'stats',
  title: '작업 현황 요약 카드',
  description: '총 프로젝트 수, 전체 이슈, 진행/검토 중, 완료된 작업 수를 4개의 컴팩트 뱃지로 집계합니다.',
  defaultColSpan: 12,
  defaultHeight: 'compact',
  icon: <BarChart3 size={22} color="#9cdcfe" />,
  badge: '전체 통계',
  Component: StatCardsWidget,
};
