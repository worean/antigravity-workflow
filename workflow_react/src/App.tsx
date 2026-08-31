// -*- coding: utf-8 -*-
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { WorkspaceProvider } from '@/context/WorkspaceContext';
import { prefRepository } from '@/lib/prefRepository';
import { Header, type BreadcrumbItem } from '@/components/Header';

import { Sidebar, type TabType } from '@/components/Sidebar';
import { DashboardPage } from '@/pages/DashboardPage';
import { ProjectsPage } from '@/pages/ProjectsPage';
import { ProjectDetailPage } from '@/pages/ProjectDetailPage';
import { IssuesPage } from '@/pages/IssuesPage';
import { SprintsPage } from '@/pages/SprintsPage';
import { SprintDetailPage } from '@/pages/SprintDetailPage';
import { WBSPage } from '@/pages/WBSPage';
import { WorklogsPage } from '@/pages/WorklogsPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { ChatPage } from '@/pages/ChatPage';
import { AuthModal } from '@/components/AuthModal';

import { ProjectModal } from '@/components/ProjectModal';
import { IssueModal } from '@/components/IssueModal';
import { IssueDetailDrawer } from '@/components/issueDetail';
import { getProjects } from '@/services/api';
import type { Project, Issue } from '@/types';
import { parseRouteFromHash, buildHashFromRoute, type ActiveTabType } from '@/utils/routeUtils';

type IssueDetailMode = 'view' | 'edit';

const AppContent: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

  const initialRoute = useMemo(() => {
    return parseRouteFromHash(window.location.hash);
  }, []);

  const [activeTab, setActiveTabState] = useState<TabType>(initialRoute.tab === 'issue-detail' ? 'issues' : initialRoute.tab);
  const [selectedProjectId, setSelectedProjectIdState] = useState<number | null>(initialRoute.projectId);
  const [selectedAssigneeId, setSelectedAssigneeIdState] = useState<number | 'ALL' | 'MY'>(initialRoute.assigneeId);
  const [searchTerm, setSearchTermState] = useState<string>(initialRoute.search);
  const [selectedIssueId, setSelectedIssueIdState] = useState<number | null>(initialRoute.issueId);
  const [selectedSprintId, setSelectedSprintIdState] = useState<number | null>(initialRoute.sprintId);
  const [selectedChannelId, setSelectedChannelIdState] = useState<number | null>(initialRoute.channelId);
  const [issueDetailMode, setIssueDetailModeState] = useState<IssueDetailMode>(initialRoute.mode);

  // Modals
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState<boolean>(false);
  const [isIssueModalOpen, setIsIssueModalOpen] = useState<boolean>(false);

  const [projects, setProjects] = useState<Project[]>([]);
  const [issueRefreshKey, setIssueRefreshKey] = useState<number>(Date.now());

  const handleIssueRefreshed = useCallback(() => {
    setIssueRefreshKey(Date.now());
  }, []);

  // 로그인 및 로그아웃 시 전체 프로젝트 목록 및 화면 상태 리프레시
  useEffect(() => {
    fetchProjects();
    setIssueRefreshKey(Date.now());
  }, [isAuthenticated, user?.id]);

  const navigate = useCallback(
    (
      tab: TabType,
      projId: number | null = null,
      issueId: number | null = null,
      mode: IssueDetailMode = 'view',
      replace: boolean = false,
      extra?: { assigneeId?: number | 'ALL' | 'MY'; search?: string; channelId?: number | null; sprintId?: number | null }
    ) => {
      const normalizedTab = tab === 'issue-detail' ? 'issues' : tab;
      prefRepository.activeTab = normalizedTab;
      if (projId) {
        prefRepository.selectedProjectId = projId;
      }

      const targetSprintId = extra?.sprintId ?? (normalizedTab === 'sprint-detail' ? issueId : null);

      setActiveTabState(normalizedTab);
      setSelectedProjectIdState(projId);
      if (extra?.assigneeId !== undefined) setSelectedAssigneeIdState(extra.assigneeId);
      if (extra?.search !== undefined) setSearchTermState(extra.search);
      if (extra?.channelId !== undefined) setSelectedChannelIdState(extra.channelId);
      setSelectedSprintIdState(targetSprintId);
      setSelectedIssueIdState(normalizedTab === 'sprint-detail' ? null : issueId);
      setIssueDetailModeState(mode);

      // Build RESTful Hierarchical Hash URL
      const newHash = buildHashFromRoute({
        tab: (issueId ? 'issue-detail' : normalizedTab) as ActiveTabType,
        projectId: projId,
        issueId: normalizedTab === 'sprint-detail' ? null : issueId,
        sprintId: targetSprintId,
        channelId: extra?.channelId ?? (normalizedTab === 'chat' ? selectedChannelId : null),
        mode,
        assigneeId: extra?.assigneeId ?? selectedAssigneeId,
        search: extra?.search ?? searchTerm,
      });

      if (replace) {
        window.history.replaceState(null, '', newHash);
      } else {
        window.history.pushState(null, '', newHash);
      }
    },
    [selectedAssigneeId, searchTerm, selectedChannelId]
  );

  const setActiveTab = (tab: TabType) => {
    navigate(tab, selectedProjectId, null, 'view', false);
  };

  const fetchProjects = async () => {
    try {
      const data = await getProjects();
      setProjects(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // 브라우저 뒤로가기 / 앞으로가기 및 URL 변경 감지 (popstate & hashchange)
  useEffect(() => {
    const handleUrlChange = () => {
      const route = parseRouteFromHash(window.location.hash);
      const normalizedTab = route.tab === 'issue-detail' ? 'issues' : route.tab;
      setActiveTabState(normalizedTab);
      setSelectedProjectIdState(route.projectId);
      setSelectedAssigneeIdState(route.assigneeId);
      setSearchTermState(route.search);
      setSelectedIssueIdState(route.issueId);
      setSelectedSprintIdState(route.sprintId);
      setSelectedChannelIdState(route.channelId);
      setIssueDetailModeState(route.mode);
    };

    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  const handleOpenCreateIssue = () => {
    setIsIssueModalOpen(true);
  };

  // 이슈 클릭 시: 기존 페이지 상태를 유지한 채 우측 슬라이드 드로어 오픈!
  const handleSelectIssue = (issue: Issue) => {
    const projId = selectedProjectId || issue.projectId || null;
    setSelectedIssueIdState(issue.id);
    navigate(activeTab, projId, issue.id, 'view', false);
  };

  // 이슈 드로어 닫기
  const handleCloseIssueDrawer = () => {
    setSelectedIssueIdState(null);
    navigate(activeTab, selectedProjectId, null, 'view', false);
  };

  // 프로젝트 클릭 시 프로젝트 상세/설정 페이지로 이동
  const handleSelectProject = (projectId: number) => {
    navigate('project-detail', projectId, null, 'view', false);
  };

  const handleProjectCreated = (newProject: Project) => {
    setProjects((prev) => [newProject, ...prev]);
  };

  const handleIssueModeChange = (newMode: IssueDetailMode) => {
    if (selectedIssueId) {
      navigate(activeTab, selectedProjectId, selectedIssueId, newMode, false);
    }
  };

  // 필터 변경 시 URL 해시 업데이트
  const handleFilterChange = (filters: { projectId: number | 'ALL'; assigneeId: number | 'ALL' | 'MY'; search: string }) => {
    const projId = filters.projectId === 'ALL' ? null : filters.projectId;
    navigate('issues', projId, null, 'view', true, {
      assigneeId: filters.assigneeId,
      search: filters.search,
    });
  };

  // 현재 선택된 프로젝트 객체
  const currentProject = useMemo(() => {
    if (!selectedProjectId) return null;
    return projects.find((p) => p.id === selectedProjectId) || null;
  }, [projects, selectedProjectId]);

  // 상단 계층형 Breadcrumbs 계산
  const breadcrumbs = useMemo<BreadcrumbItem[]>(() => {
    const baseCrumbs: BreadcrumbItem[] = [];

    switch (activeTab) {
      case 'dashboard':
        baseCrumbs.push({ label: '대시보드' });
        break;
      case 'projects':
        baseCrumbs.push({ label: '프로젝트 목록' });
        break;
      case 'project-detail':
        baseCrumbs.push(
          { label: '프로젝트 목록', onClick: () => navigate('projects', null) },
          { label: currentProject ? `${currentProject.name} (${currentProject.key})` : `프로젝트 #${selectedProjectId}` }
        );
        break;
      case 'issues':
        if (currentProject) {
          baseCrumbs.push(
            { label: '이슈 칸반 보드', onClick: () => navigate('issues', null) },
            { label: `${currentProject.name} (${currentProject.key})` }
          );
        } else {
          baseCrumbs.push({ label: '이슈 칸반 보드' });
        }
        break;
      case 'sprints':
        if (currentProject) {
          baseCrumbs.push(
            { label: '스프린트 관리', onClick: () => navigate('sprints', null) },
            { label: `${currentProject.name} (${currentProject.key})` }
          );
        } else {
          baseCrumbs.push({ label: '스프린트 관리' });
        }
        break;
      case 'sprint-detail':
        baseCrumbs.push(
          { label: '스프린트 관리', onClick: () => navigate('sprints', selectedProjectId) },
          ...(currentProject ? [{ label: `${currentProject.name} (${currentProject.key})`, onClick: () => navigate('sprints', currentProject.id) }] : []),
          { label: `스프린트 #${selectedSprintId}` }
        );
        break;
      case 'wbs':
        if (currentProject) {
          baseCrumbs.push(
            { label: 'WBS 간트 차트', onClick: () => navigate('wbs', null) },
            { label: `${currentProject.name} (${currentProject.key})` }
          );
        } else {
          baseCrumbs.push({ label: 'WBS 간트 차트' });
        }
        break;
      case 'chat':
        baseCrumbs.push({ label: '실시간 채팅' });
        break;
      case 'worklogs':
        baseCrumbs.push({ label: '작업 로그' });
        break;
      case 'settings':
        baseCrumbs.push({ label: '환경 설정' });
        break;
      default:
        baseCrumbs.push({ label: '대시보드' });
        break;
    }

    if (selectedIssueId) {
      baseCrumbs.push({ label: `이슈 #${selectedIssueId}` });
    }

    return baseCrumbs;
  }, [activeTab, currentProject, selectedProjectId, selectedIssueId, selectedSprintId, navigate]);

  return (
    <div style={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Header breadcrumbs={breadcrumbs} />

      <div style={{ display: 'flex', flex: 1, height: 'calc(100vh - 32px)', overflow: 'hidden' }}>
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          selectedProjectId={selectedProjectId}
          selectedChannelId={selectedChannelId}
          onOpenAuth={() => setIsAuthModalOpen(true)}
          onSelectProjectDetail={(pId) => navigate('project-detail', pId, null, 'view', false)}
          onSelectChatChannel={(cId: number) => navigate('chat', null, null, 'view', false, { channelId: cId })}
        />

        <main style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-dark)', padding: '16px 20px', position: 'relative' }}>
          {activeTab === 'dashboard' && (
            <DashboardPage
              key={`tab-dash-${selectedProjectId || 'all'}-${issueRefreshKey}`}
              onNavigate={(tab, pId) => navigate(tab, pId ?? null)}
              onOpenCreateIssue={handleOpenCreateIssue}
              onOpenCreateProject={() => setIsProjectModalOpen(true)}
              onSelectIssue={handleSelectIssue}
              onOpenAuth={() => setIsAuthModalOpen(true)}
              refreshKey={issueRefreshKey}
            />
          )}

          {activeTab === 'projects' && (
            <ProjectsPage
              key={`tab-projects-${issueRefreshKey}`}
              projects={projects}
              onSelectProject={handleSelectProject}
              onOpenCreateProject={() => setIsProjectModalOpen(true)}
              onOpenAuth={() => setIsAuthModalOpen(true)}
            />
          )}

          {activeTab === 'project-detail' && (
            <ProjectDetailPage
              key={`tab-project-detail-${selectedProjectId || 1}`}
              projectId={selectedProjectId || 1}
              onBack={() => navigate('projects')}
              onProjectUpdated={(upProj) => {
                setProjects((prev) => prev.map((p) => (p.id === upProj.id ? upProj : p)));
              }}
              onProjectDeleted={(delId) => {
                setProjects((prev) => prev.filter((p) => p.id !== delId));
                navigate('projects');
              }}
              onOpenAuth={() => setIsAuthModalOpen(true)}
            />
          )}

          {activeTab === 'issues' && (
            <IssuesPage
              key={`tab-issues-${selectedProjectId || 'all'}-${issueRefreshKey}`}
              onOpenCreateIssue={handleOpenCreateIssue}
              onSelectIssue={handleSelectIssue}
              selectedProjectId={selectedProjectId}
              selectedAssigneeId={selectedAssigneeId}
              searchTermProp={searchTerm}
              onFilterChange={handleFilterChange}
              onOpenAuth={() => setIsAuthModalOpen(true)}
              refreshKey={issueRefreshKey}
            />
          )}

          {activeTab === 'chat' && (
            <ChatPage
              key={`tab-chat-${isAuthenticated ? user?.id : 'guest'}`}
              selectedChannelId={selectedChannelId}
              onSelectChannel={(cId) => navigate('chat', null, null, 'view', true, { channelId: cId })}
              onOpenAuth={() => setIsAuthModalOpen(true)}
            />
          )}

          {activeTab === 'sprints' && (
            <SprintsPage
              key={`tab-sprints-${selectedProjectId || 'all'}-${issueRefreshKey}`}
              selectedProjectId={selectedProjectId}
              onFilterChange={(pId) => navigate('sprints', pId === 'ALL' ? null : pId, null, 'view', true)}
              onSelectSprint={(sId) => navigate('sprint-detail', selectedProjectId, sId, 'view', false)}
              onOpenIssueDetail={(issueId) => handleSelectIssue({ id: issueId } as any)}
              onOpenAuth={() => setIsAuthModalOpen(true)}
            />
          )}

          {activeTab === 'sprint-detail' && (
            <SprintDetailPage
              key={`tab-sprint-detail-${selectedSprintId}-${issueRefreshKey}`}
              sprintId={selectedSprintId}
              projectId={selectedProjectId}
              onBack={() => navigate('sprints', selectedProjectId, null, 'view', false)}
              onOpenIssueDetail={(issueId) => handleSelectIssue({ id: issueId } as any)}
              onOpenAuth={() => setIsAuthModalOpen(true)}
            />
          )}

          {activeTab === 'wbs' && (
            <WBSPage
              key={`tab-wbs-${selectedProjectId || 'all'}-${issueRefreshKey}`}
              selectedProjectId={selectedProjectId}
              onFilterChange={(pId) => navigate('wbs', pId, null, 'view', true)}
              onSelectIssue={handleSelectIssue}
              onOpenAuth={() => setIsAuthModalOpen(true)}
            />
          )}

          {activeTab === 'worklogs' && (
            <WorklogsPage
              key={`tab-worklogs-${isAuthenticated ? user?.id : 'guest'}-${issueRefreshKey}`}
              onOpenAuth={() => setIsAuthModalOpen(true)}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsPage
              key={`tab-settings-${isAuthenticated ? user?.id : 'guest'}-${issueRefreshKey}`}
              onOpenAuth={() => setIsAuthModalOpen(true)}
            />
          )}
        </main>
      </div>

      {/* Slide-over Issue Detail Drawer (우측 슬라이드 오버레이) */}
      <IssueDetailDrawer
        isOpen={!!selectedIssueId}
        issueId={selectedIssueId}
        projectId={selectedProjectId}
        mode={issueDetailMode}
        onModeChange={handleIssueModeChange}
        onClose={handleCloseIssueDrawer}
        onIssueUpdated={handleIssueRefreshed}
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />

      {/* Auth Modal */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />

      {/* Project Create Modal */}
      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onSuccess={handleProjectCreated}
      />

      {/* Issue Create / Quick Modal */}
      <IssueModal
        isOpen={isIssueModalOpen}
        onClose={() => setIsIssueModalOpen(false)}
        projects={projects}
        initialProjectId={selectedProjectId || undefined}
        onIssueCreated={handleIssueRefreshed}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <WorkspaceProvider>
          <AppContent />
        </WorkspaceProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;