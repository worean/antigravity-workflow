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
import { IssueDetailPage } from '@/pages/IssueDetailPage';
import { SprintsPage } from '@/pages/SprintsPage';
import { SprintDetailPage } from '@/pages/SprintDetailPage';
import { WBSPage } from '@/pages/WBSPage';
import { WorklogsPage } from '@/pages/WorklogsPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { ChatPage } from '@/pages/ChatPage';
import { AuthModal } from '@/components/AuthModal';

import { ProjectModal } from '@/components/ProjectModal';
import { IssueModal } from '@/components/IssueModal';
import { SprintModal } from '@/components/SprintModal';
import { IssueDetailDrawer } from '@/components/issueDetail';
import { getProjects } from '@/services/api';
import { issueKeys } from '@/api/issues';
import { getSocket } from '@/lib/socketClient';
import { sendDesktopNotification } from '@/utils/notificationUtils';
import type { Project, Issue, Sprint } from '@/types';
import { parseRouteFromHash, buildHashFromRoute, type ActiveTabType } from '@/utils/routeUtils';

type IssueDetailMode = 'view' | 'edit';

const AppContent: React.FC = () => {
  const { user, isAuthenticated, loginWithTokenAndUser } = useAuth();

  // OAuth / Email Magic Link Redirect Handler (?token=...&user=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const redirectToken = params.get('token');
    const redirectUserStr = params.get('user');

    if (redirectToken && redirectUserStr) {
      try {
        const redirectUser = JSON.parse(decodeURIComponent(redirectUserStr));
        loginWithTokenAndUser(redirectToken, redirectUser);
        window.history.replaceState({}, document.title, window.location.pathname + window.location.hash);
      } catch (err) {
        console.error('Failed to parse redirect user info:', err);
      }
    }
  }, [loginWithTokenAndUser]);

  const initialRoute = useMemo(() => {
    return parseRouteFromHash(window.location.hash);
  }, []);

  const [activeTab, setActiveTabState] = useState<TabType>(initialRoute.tab as TabType);
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
  const [isSprintModalOpen, setIsSprintModalOpen] = useState<boolean>(false);
  const [selectedSprintForEdit, setSelectedSprintForEdit] = useState<Sprint | null>(null);

  const [projects, setProjects] = useState<Project[]>([]);
  const [issueRefreshKey, setIssueRefreshKey] = useState<number>(Date.now());

  const handleIssueRefreshed = useCallback(() => {
    setIssueRefreshKey(Date.now());
    queryClient.invalidateQueries({ queryKey: issueKeys.all });
  }, []);

  const handleSprintRefreshed = useCallback(() => {
    setIssueRefreshKey(Date.now());
    queryClient.invalidateQueries({ queryKey: ['sprints'] });
  }, []);

  const handleOpenCreateSprint = useCallback(() => {
    setSelectedSprintForEdit(null);
    setIsSprintModalOpen(true);
  }, []);

  const handleOpenEditSprint = useCallback((sprint: Sprint) => {
    setSelectedSprintForEdit(sprint);
    setIsSprintModalOpen(true);
  }, []);

  // 로그인 및 로그아웃 시 전체 프로젝트 목록 및 화면 상태 리프레시
  useEffect(() => {
    fetchProjects();
    setIssueRefreshKey(Date.now());
  }, [isAuthenticated, user?.id]);

  // 🌐 실시간 이슈 생성/수정/삭제 이벤트 구독 및 타인 변경 알림 처리
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleRealtimeIssueCreated = (data: { actorId?: number; issue: Issue }) => {
      queryClient.invalidateQueries({ queryKey: issueKeys.all });
      setIssueRefreshKey(Date.now());

      if (data && data.actorId && data.actorId !== user?.id && data.issue) {
        sendDesktopNotification({
          title: '신규 이슈 등록',
          body: `#${data.issue.issueNumber || data.issue.id} ${data.issue.title}`,
          priority: data.issue.priorityId || 2,
        });
      }
    };

    const handleRealtimeIssueUpdated = (data: { actorId?: number; issue: Issue }) => {
      queryClient.invalidateQueries({ queryKey: issueKeys.all });
      if (data?.issue?.id) {
        queryClient.invalidateQueries({ queryKey: issueKeys.detail(data.issue.id) });
      }
      setIssueRefreshKey(Date.now());

      if (data && data.actorId && data.actorId !== user?.id && data.issue) {
        sendDesktopNotification({
          title: '이슈 내용 갱신',
          body: `#${data.issue.issueNumber || data.issue.id} ${data.issue.title}`,
          priority: data.issue.priorityId || 2,
        });
      }
    };

    const handleRealtimeIssueDeleted = (_data: { actorId?: number; issueId: number }) => {
      queryClient.invalidateQueries({ queryKey: issueKeys.all });
      setIssueRefreshKey(Date.now());
    };

    const handleRealtimeBatchUpdated = () => {
      queryClient.invalidateQueries({ queryKey: issueKeys.all });
      setIssueRefreshKey(Date.now());
    };

    socket.on('issue:created', handleRealtimeIssueCreated);
    socket.on('issue:updated', handleRealtimeIssueUpdated);
    socket.on('issue:deleted', handleRealtimeIssueDeleted);
    socket.on('issue:batch_schedules_updated', handleRealtimeBatchUpdated);

    return () => {
      socket.off('issue:created', handleRealtimeIssueCreated);
      socket.off('issue:updated', handleRealtimeIssueUpdated);
      socket.off('issue:deleted', handleRealtimeIssueDeleted);
      socket.off('issue:batch_schedules_updated', handleRealtimeBatchUpdated);
    };
  }, [user?.id]);

  const navigate = useCallback(
    (
      tab: TabType,
      projId: number | null = null,
      issueId: number | null = null,
      mode: IssueDetailMode = 'view',
      replace: boolean = false,
      extra?: { assigneeId?: number | 'ALL' | 'MY'; search?: string; channelId?: number | null; sprintId?: number | null }
    ) => {
      prefRepository.activeTab = tab;

      const targetSprintId = extra?.sprintId ?? (tab === 'sprint-detail' ? issueId : null);

      setActiveTabState(tab);
      setSelectedProjectIdState(projId);
      if (extra?.assigneeId !== undefined) setSelectedAssigneeIdState(extra.assigneeId);
      if (extra?.search !== undefined) setSearchTermState(extra.search);
      if (extra?.channelId !== undefined) setSelectedChannelIdState(extra.channelId);
      setSelectedSprintIdState(targetSprintId);
      setSelectedIssueIdState(tab === 'issue-detail' ? issueId : null);
      setIssueDetailModeState(mode);

      // Build RESTful Hierarchical Hash URL
      const newHash = buildHashFromRoute({
        tab: tab as ActiveTabType,
        projectId: projId,
        issueId: tab === 'issue-detail' ? issueId : null,
        sprintId: targetSprintId,
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
      setActiveTabState(route.tab as TabType);
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

  // 이슈 클릭 시: URL 변경 없이 순수 컴포넌트 State로 우측 슬라이드 드로어 오픈!
  const handleSelectIssue = (issue: Issue) => {
    setSelectedIssueIdState(issue.id);
  };

  // 이슈 드로어 닫기: URL 변경 없이 순수 컴포넌트 State로 닫기
  const handleCloseIssueDrawer = () => {
    setSelectedIssueIdState(null);
  };

  // 프로젝트 클릭 시 프로젝트 상세/설정 페이지로 이동
  const handleSelectProject = (projectId: number) => {
    navigate('project-detail', projectId, null, 'view', false);
  };

  const handleProjectCreated = (newProject: Project) => {
    setProjects((prev) => [newProject, ...prev]);
  };

  const handleIssueModeChange = (newMode: IssueDetailMode) => {
    setIssueDetailModeState(newMode);
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
      case 'issue-detail':
        baseCrumbs.push(
          { label: '이슈 목록', onClick: () => navigate('issues', selectedProjectId) },
          ...(currentProject ? [{ label: `${currentProject.name} (${currentProject.key})`, onClick: () => navigate('issues', currentProject.id) }] : []),
          { label: `이슈 상세 #${selectedIssueId}` }
        );
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
          onOpenSettings={() => navigate('settings')}
          onSelectProjectDetail={(pId) => navigate('project-detail', pId, null, 'view', false)}
          onSelectChatChannel={(cId: number) => navigate('chat', null, null, 'view', false, { channelId: cId })}
        />

        <main className="main-content" data-tab={activeTab}>
          {activeTab === 'dashboard' && (
            <DashboardPage
              key={`tab-dash-${selectedProjectId || 'all'}`}
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
              key="tab-projects"
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
              key={`tab-issues-${selectedProjectId || 'all'}`}
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
              onBack={() => navigate('issues', selectedProjectId)}
              onGoToList={() => navigate('issues', selectedProjectId)}
              onIssueUpdated={handleIssueRefreshed}
              onOpenAuth={() => setIsAuthModalOpen(true)}
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
              key={`tab-sprints-${selectedProjectId || 'all'}`}
              selectedProjectId={selectedProjectId}
              onFilterChange={(pId) => navigate('sprints', pId === 'ALL' ? null : pId, null, 'view', true)}
              onSelectSprint={(sId) => navigate('sprint-detail', selectedProjectId, sId, 'view', false)}
              onOpenCreateSprint={handleOpenCreateSprint}
              onOpenEditSprint={handleOpenEditSprint}
              onOpenIssueDetail={(issueId) => handleSelectIssue({ id: issueId } as any)}
              onOpenAuth={() => setIsAuthModalOpen(true)}
            />
          )}

          {activeTab === 'sprint-detail' && (
            <SprintDetailPage
              key={`tab-sprint-detail-${selectedSprintId}`}
              sprintId={selectedSprintId}
              projectId={selectedProjectId}
              onBack={() => navigate('sprints', selectedProjectId, null, 'view', false)}
              onOpenEditSprint={handleOpenEditSprint}
              onOpenIssueDetail={(issueId) => handleSelectIssue({ id: issueId } as any)}
              onOpenAuth={() => setIsAuthModalOpen(true)}
            />
          )}

          {activeTab === 'wbs' && (
            <WBSPage
              key="tab-wbs"
              selectedProjectId={selectedProjectId}
              onFilterChange={(pId) => navigate('wbs', pId, selectedIssueId, 'view', true)}
              onSelectIssue={handleSelectIssue}
              onOpenAuth={() => setIsAuthModalOpen(true)}
            />
          )}

          {activeTab === 'worklogs' && (
            <WorklogsPage
              key={`tab-worklogs-${isAuthenticated ? user?.id : 'guest'}`}
              onOpenAuth={() => setIsAuthModalOpen(true)}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsPage
              key={`tab-settings-${isAuthenticated ? user?.id : 'guest'}`}
              onOpenAuth={() => setIsAuthModalOpen(true)}
            />
          )}
        </main>
      </div>

      {/* Slide-over Issue Detail Drawer (우측 슬라이드 오버레이: Full page 이슈 상세 및 자체 Drawer를 가진 WBS 제외) */}
      <IssueDetailDrawer
        isOpen={activeTab !== 'issue-detail' && activeTab !== 'wbs' && !!selectedIssueId}
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

      {/* Sprint Create / Edit Modal (App 루트 전역 모달) */}
      <SprintModal
        isOpen={isSprintModalOpen}
        onClose={() => setIsSprintModalOpen(false)}
        sprint={selectedSprintForEdit}
        projects={projects}
        initialProjectId={selectedProjectId || undefined}
        onSuccess={handleSprintRefreshed}
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