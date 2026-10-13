import React, { useMemo } from 'react';
import { useIssues, useFavorites, useProjects } from '@/api';
import { useAuth } from '@/context/AuthContext';
import { DashboardIssueLists } from '../DashboardIssueLists';
import { Spinner } from '@/components/common';
import { ListTodo } from 'lucide-react';
import type { Issue } from '@/types';
import type { WidgetProps, Widgetable } from '@/types/widget';

export const RecentIssuesWidget: React.FC<WidgetProps> = ({
  onSelectIssue,
  onNavigate = () => {},
}) => {
  const { user, isAuthenticated } = useAuth();

  // 1. 내가 참여한 프로젝트 목록 확인 (ownerId 또는 members 포함 여부)
  const { data: allProjects = [] } = useProjects({}, { enabled: isAuthenticated });

  const myProjectIds = useMemo(() => {
    if (!isAuthenticated || !user) return new Set<number>();
    const pIds = new Set<number>();
    allProjects.forEach((p) => {
      const isOwner = p.ownerId === user.id;
      const isMember = Array.isArray(p.members) && p.members.some((m) => m.userId === user.id);
      if (isOwner || isMember) {
        pIds.add(p.id);
      }
    });
    return pIds;
  }, [allProjects, user, isAuthenticated]);

  // 2. 최근 등록된 이슈 목록 조회
  const { data: rawRecentIssues = [], isLoading: isRecentLoading } = useIssues(
    { limit: 50, sortBy: 'id', order: 'desc', onlyInvolved: true },
    { enabled: isAuthenticated }
  );

  // 3. 자기가 관여한 (보고자 or 담당자) 이슈, 내가 참여한 프로젝트에 대한 이슈만 필터링 (그 외에는 보이지 않음)
  const filteredRecentIssues = useMemo(() => {
    if (!isAuthenticated || !user) return [];
    return rawRecentIssues
      .filter((iss) => {
        const isReporter = (iss as any).reporterId === user.id || iss.authorId === user.id;
        const isAssignee = iss.assigneeId === user.id;
        const isMyProject = iss.projectId ? myProjectIds.has(iss.projectId) : false;
        return isReporter || isAssignee || isMyProject;
      })
      .slice(0, 8);
  }, [rawRecentIssues, isAuthenticated, user, myProjectIds]);

  const { data: myAssignedIssues = [], isLoading: isMyLoading } = useIssues(
    { assigneeId: 'my', limit: 8, sortBy: 'updatedAt', order: 'desc' },
    { enabled: isAuthenticated }
  );

  const { data: favIssuesData = [], isLoading: isFavLoading } = useFavorites('ISSUE', {
    enabled: isAuthenticated,
  });
  const favoriteIssues: Issue[] = favIssuesData.map((f) => f.detail).filter(Boolean);

  const handleIssueClick = (issue: Issue) => {
    if (onSelectIssue) {
      onSelectIssue(issue);
    } else {
      onNavigate('issues', issue.projectId);
    }
  };

  if (isAuthenticated && (isRecentLoading || isMyLoading || isFavLoading)) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '140px' }}>
        <Spinner centered label="이슈 목록 로딩 중..." />
      </div>
    );
  }

  return (
    <DashboardIssueLists
      isAuthenticated={isAuthenticated}
      favoriteIssues={favoriteIssues}
      recentIssues={filteredRecentIssues}
      myAssignedIssues={myAssignedIssues}
      handleIssueClick={handleIssueClick}
      onNavigate={onNavigate}
    />
  );
};

export const recentIssuesWidgetDefinition: Widgetable = {
  type: 'recent-issues',
  title: '최근 및 내 할당 이슈',
  description: '즐겨찾기한 이슈, 최근 등록된 이슈, 나에게 할당된 이슈를 3개 컬럼으로 간결하게 조회합니다.',
  defaultColSpan: 6,
  defaultHeight: 'normal',
  icon: <ListTodo size={22} color="#c586c0" />,
  badge: '일감 리스트',
  Component: RecentIssuesWidget,
};
