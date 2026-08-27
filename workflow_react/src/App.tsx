// -*- coding: utf-8 -*-
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header, type BreadcrumbItem } from './components/Header';

import { Sidebar, type TabType } from './components/Sidebar';
import { DashboardPage } from './pages/DashboardPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { ProjectDetailPage } from './pages/ProjectDetailPage';
import { IssuesPage } from './pages/IssuesPage';
import { IssueDetailPage } from './pages/IssueDetailPage';
import { SprintsPage } from './pages/SprintsPage';
import { WBSPage } from './pages/WBSPage';
import { WorklogsPage } from './pages/WorklogsPage';
import { SettingsPage } from './pages/SettingsPage';
import { ChatPage } from './pages/ChatPage';
import { AuthModal } from './components/AuthModal';

import { ProjectModal } from './components/ProjectModal';
import { IssueModal } from './components/IssueModal';
import { getProjects } from './services/api';
import type { Project, Issue } from './types';
import { parseRouteFromHash, buildHashFromRoute, type ActiveTabType } from './utils/routeUtils';

type IssueDetailMode = 'view' | 'edit';

const AppContent: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

  const initialRoute = useMemo(() => {
    return parseRouteFromHash(window.location.hash);
  }, []);

  const [activeTab, setActiveTabState] = useState<TabType>(initialRoute.tab);
  const [selectedProjectId, setSelectedProjectIdState] = useState<number | null>(initialRoute.projectId);
  const [selectedAssigneeId, setSelectedAssigneeIdState] = useState<number | 'ALL' | 'MY'>(initialRoute.assigneeId);
  const [searchTerm, setSearchTermState] = useState<string>(initialRoute.search);
  const [selectedIssueId, setSelectedIssueIdState] = useState<number | null>(initialRoute.issueId);
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
      extra?: { assigneeId?: number | 'ALL' | 'MY'; search?: string; channelId?: number | null }
    ) => {
      localStorage.setItem('activeTab', tab);
      if (projId) {
        localStorage.setItem('selectedProjectId', String(projId));
      }

      setActiveTabState(tab);
      setSelectedProjectIdState(projId);
      if (extra?.assigneeId !== undefined) setSelectedAssigneeIdState(extra.assigneeId);
      if (extra?.search !== undefined) setSearchTermState(extra.search);
      if (extra?.channelId !== undefined) setSelectedChannelIdState(extra.channelId);
      setSelectedIssueIdState(issueId);
      setIssueDetailModeState(mode);

      // Build RESTful Hierarchical Hash URL
      const newHash = buildHashFromRoute({
        tab: tab as ActiveTabType,
        projectId: projId,
        issueId,
        channelId: extra?.channelId ?? (tab === 'chat' ? selectedChannelId : null),
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
      setActiveTabState(route.tab);
      setSelectedProjectIdState(route.projectId);
      setSelectedAssigneeIdState(route.assigneeId);
      setSearchTermState(route.search);
      setSelectedIssueIdState(route.issueId);
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

  // 이슈 클릭 시 상세 페이지로 이동 (현재 필터 상태 유지한 채 히스토리에 push)
  const handleSelectIssue = (issue: Issue) => {
    const projId = selectedProjectId || issue.projectId || null;
    navigate('issue-detail', projId, issue.id, 'view', false);
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
      navigate('issue-detail', selectedProjectId, selectedIssueId, newMode, false);
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

  // 뒤로가기
  const handleBackFromIssueDetail = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      navigate('issues', selectedProjectId, null, 'view', false);
    }
  };

  // 목록으로 돌아가기
  const handleGoToListFromIssueDetail = () => {
    navigate('issues', selectedProjectId, null, 'view', false);
  };

  // 현재 선택된 프로젝트 객체
  const currentProject = useMemo(() => {
    if (!selectedProjectId) return null;
    return projects.find((p) => p.id === selectedProjectId) || null;
  }, [projects, selectedProjectId]);

  // 상단 계층형 Breadcrumbs 계산
  const breadcrumbs = useMemo<BreadcrumbItem[]>(() => {
    switch (activeTab) {
      case 'dashboard':
        return [{ label: '대시보드' }];
      case 'projects':
        return [{ label: '프로젝트 목록' }];
      case 'project-detail':
        return [
          { label: '프로젝트 목록', onClick: () => navigate('projects', null) },
          { label: currentProject ? `${currentProject.name} (${currentProject.key})` : `프로젝트 #${selectedProjectId}` },
        ];
      case 'issues':
        if (currentProject) {
          return [
            { label: '이슈 칸반 보드', onClick: () => navigate('issues', null) },
            { label: `${currentProject.name} (${currentProject.key})` },
          ];
        }
        return [{ label: '이슈 칸반 보드' }];
      case 'issue-detail':
        return [
          { label: '이슈 칸반 보드', onClick: () => navigate('issues', selectedProjectId) },
          ...(currentProject ? [{ label: `${currentProject.name} (${currentProject.key})`, onClick: () => navigate('issues', currentProject.id) }] : []),
          { label: `이슈 #${selectedIssueId}` },
        ];
      case 'sprints':
        if (currentProject) {
          return [
            { label: '스프린트 관리', onClick: () => navigate('sprints', null) },
            { label: `${currentProject.name} (${currentProject.key})` },
          ];
        }
        return [{ label: '스프린트 관리' }];
      case 'wbs':
        if (currentProject) {
          return [
            { label: 'WBS 간트 차트', onClick: () => navigate('wbs', null) },
            { label: `${currentProject.name} (${currentProject.key})` },
          ];
        }
        return [{ label: 'WBS 간트 차트' }];
      case 'chat':
        return [{ label: '실시간 채팅' }];
      case 'worklogs':
        return [{ label: '작업 로그' }];
      case 'settings':
        return [{ label: '환경 설정' }];
      default:
        return [{ label: '대시보드' }];
    }
  }, [activeTab, currentProject, selectedProjectId, selectedIssueId, navigate]);

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
          onSelectProjectIssues={(pId) => navigate('issues', pId, null, 'view', false, { assigneeId: 'ALL', search: '' })}
          onSelectProjectSprints={(pId) => navigate('sprints', pId, null, 'view', false)}
          onSelectProjectWBS={(pId) => navigate('wbs', pId, null, 'view', false)}
          onSelectChatChannel={(cId) => navigate('chat', null, null, 'view', false, { channelId: cId })}
        />

        <main style={{ flex: 1, height: '100%', padding: '12px 16px', overflowY: 'auto', overflowX: 'hidden', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
          {activeTab === 'dashboard' && (
            <DashboardPage
              key="tab-dashboard"
              onNavigate={(tab) => navigate(tab, selectedProjectId, null, 'view', false)}
              onOpenCreateIssue={handleOpenCreateIssue}
              onOpenCreateProject={() => setIsProjectModalOpen(true)}
              onSelectIssue={handleSelectIssue}
              onOpenAuth={() => setIsAuthModalOpen(true)}
              refreshKey={issueRefreshKey}
            />
          )}

          {activeTab === 'projects' && (
            <ProjectsPage
              key="tab-projects"
              onOpenCreateProject={() => setIsProjectModalOpen(true)}
              onSelectProject={handleSelectProject}
              projects={projects}
              onProjectsChange={setProjects}
              onOpenAuth={() => setIsAuthModalOpen(true)}
            />
          )}

          {activeTab === 'project-detail' && selectedProjectId && (
            <ProjectDetailPage
              key={`tab-project-detail-${selectedProjectId}`}
              projectId={selectedProjectId}
              onBack={() => navigate('projects')}
              onGoToBoard={(pId) => {
                setSelectedProjectIdState(pId);
                navigate('issues', pId);
              }}
              onGoToWBS={(pId) => {
                setSelectedProjectIdState(pId);
                navigate('wbs', pId);
              }}
              onGoToSprints={(pId) => {
                setSelectedProjectIdState(pId);
                navigate('sprints', pId);
              }}
              onProjectUpdated={(up) => {
                setProjects((prev) => prev.map((p) => (p.id === up.id ? up : p)));
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

          {activeTab === 'issue-detail' && (
            <IssueDetailPage
              key={`tab-issue-detail-${selectedIssueId}`}
              issueId={selectedIssueId}
              projectId={selectedProjectId}
              mode={issueDetailMode}
              onModeChange={handleIssueModeChange}
              onBack={handleBackFromIssueDetail}
              onGoToList={handleGoToListFromIssueDetail}
              onIssueUpdated={handleIssueRefreshed}
              onOpenAuth={() => setIsAuthModalOpen(true)}
            />
          )}

          {activeTab === 'chat' && (
            <ChatPage
              key={`tab-chat-${isAuthenticated ? user?.id : 'guest'}-${selectedChannelId || 'none'}-${issueRefreshKey}`}
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
        <AppContent />
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;