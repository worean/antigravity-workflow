// -*- coding: utf-8 -*-
import React, { useState } from 'react';
import type { Issue } from '../types';
import { useAuth } from '../context/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { useProjects, useIssues, useFavorites, issueKeys, projectKeys, favoriteKeys } from '../api';
import { parseStatusCategory } from '../utils/statusUtils';
import {
  DashboardSummaryToolbar,
  DashboardStatCards,
  DashboardFocusSprints,
  DashboardIssueLists,
} from '../components/dashboard';

interface DashboardPageProps {
  onNavigate: (tab: any, projectId?: number | null) => void;
  onOpenCreateIssue: () => void;
  onOpenCreateProject: () => void;
  onSelectIssue?: (issue: Issue) => void;
  onOpenAuth?: () => void;
  refreshKey?: number;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigate,
  onOpenCreateIssue,
  onOpenCreateProject,
  onSelectIssue,
  onOpenAuth,
}) => {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const { data: projects = [] } = useProjects(
    { limit: 30, sortBy: 'updatedAt', order: 'desc' },
    { enabled: isAuthenticated }
  );

  const { data: recentIssues = [] } = useIssues(
    { limit: 6, sortBy: 'id', order: 'desc' },
    { enabled: isAuthenticated }
  );

  const { data: statsIssues = [] } = useIssues(
    { limit: 100, sortBy: 'id', order: 'desc' },
    { enabled: isAuthenticated }
  );

  const { data: myAssignedIssues = [] } = useIssues(
    { assigneeId: 'my', limit: 6, sortBy: 'updatedAt', order: 'desc' },
    { enabled: isAuthenticated }
  );

  const { data: favIssuesData = [] } = useFavorites('ISSUE', { enabled: isAuthenticated });
  const favoriteIssues: Issue[] = favIssuesData.map((f) => f.detail).filter(Boolean);

  const { data: favSprintsData = [] } = useFavorites('SPRINT', { enabled: isAuthenticated });
  const favoriteSprints: any[] = favSprintsData.map((f) => f.detail).filter(Boolean);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: issueKeys.all }),
        queryClient.invalidateQueries({ queryKey: projectKeys.all }),
        queryClient.invalidateQueries({ queryKey: favoriteKeys.all }),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  };

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

  const handleIssueClick = (issue: Issue) => {
    if (onSelectIssue) {
      onSelectIssue(issue);
    } else {
      onNavigate('issues', issue.projectId);
    }
  };

  const getSprintProgress = (sprint: any) => {
    const issues = sprint.issues || [];
    if (issues.length === 0) return { total: sprint._count?.issues || 0, done: 0, inProgress: 0, todo: 0, rate: 0 };

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

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
      className={`animate-fade-in ${isRefreshing ? 'transition-pending' : ''}`}
    >
      {/* Top Toolbar & Guest Banner */}
      <DashboardSummaryToolbar
        isAuthenticated={isAuthenticated}
        user={user}
        isRefreshing={isRefreshing}
        handleRefresh={handleRefresh}
        onOpenCreateIssue={onOpenCreateIssue}
        onOpenCreateProject={onOpenCreateProject}
        onOpenAuth={onOpenAuth}
      />

      {/* 4 Compact Stat Badges */}
      <DashboardStatCards
        projects={projects}
        statsIssues={statsIssues}
        inProgressCount={inProgressCount}
        inReviewCount={inReviewCount}
        doneCount={doneCount}
      />

      {/* Starred Sprint Focus Monitor */}
      <DashboardFocusSprints
        favoriteSprints={favoriteSprints}
        onNavigate={onNavigate}
        getSprintProgress={getSprintProgress}
        getDDayBadge={getDDayBadge}
        handleRefresh={handleRefresh}
        onOpenAuth={onOpenAuth}
      />

      {/* Main Grid Content: 3-Column Compact Issue Panels */}
      <DashboardIssueLists
        isAuthenticated={isAuthenticated}
        favoriteIssues={favoriteIssues}
        recentIssues={recentIssues}
        myAssignedIssues={myAssignedIssues}
        handleIssueClick={handleIssueClick}
        onNavigate={onNavigate}
      />
    </div>
  );
};