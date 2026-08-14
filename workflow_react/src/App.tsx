import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider } from './context/AuthContext';
import { Header } from './components/Header';

import { Sidebar, type TabType } from './components/Sidebar';
import { DashboardPage } from './pages/DashboardPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { IssuesPage } from './pages/IssuesPage';
import { IssueDetailPage } from './pages/IssueDetailPage';
import { SprintsPage } from './pages/SprintsPage';
import { WorklogsPage } from './pages/WorklogsPage';
import { SettingsPage } from './pages/SettingsPage';
import { AuthModal } from './components/AuthModal';

import { ProjectModal } from './components/ProjectModal';
import { IssueModal } from './components/IssueModal';
import { getProjects } from './services/api';
import type { Project, Issue } from './types';

type IssueDetailMode = 'view' | 'edit';

interface RouteState {
  tab: TabType;
  projectId: number | null;
  assigneeId: number | 'ALL' | 'MY';
  search: string;
  issueId: number | null;
  mode: IssueDetailMode;
}

const AppContent: React.FC = () => {
  const parseRouteFromUrl = (): RouteState => {
    try {
      const hash = window.location.hash.replace(/^#/, '');
      if (hash) {
        const [rawTab, queryStr] = hash.split('?');
        const validTabs: TabType[] = ['dashboard', 'projects', 'issues', 'sprints', 'worklogs', 'issue-detail', 'settings'];
        const tab = validTabs.includes(rawTab as TabType) ? (rawTab as TabType) : 'dashboard';

        const params = new URLSearchParams(queryStr || '');
        const projectId = params.get('projectId') ? Number(params.get('projectId')) : null;
        const rawAssignee = params.get('assigneeId');
        const assigneeId = rawAssignee === 'MY' ? 'MY' : rawAssignee && !isNaN(Number(rawAssignee)) ? Number(rawAssignee) : 'ALL';
        const search = params.get('search') || '';
        const issueId = params.get('issueId') ? Number(params.get('issueId')) : null;
        const mode = params.get('mode') === 'edit' ? 'edit' : 'view';

        return { tab, projectId, assigneeId, search, issueId, mode };
      }
    } catch (e) {
      console.error(e);
    }

    const savedTab = localStorage.getItem('activeTab') as TabType;
    const savedProjectId = localStorage.getItem('selectedProjectId');
    const validTabs: TabType[] = ['dashboard', 'projects', 'issues', 'sprints', 'worklogs', 'issue-detail', 'settings'];


    return {
      tab: validTabs.includes(savedTab) ? savedTab : 'dashboard',
      projectId: savedProjectId ? Number(savedProjectId) : null,
      assigneeId: 'ALL',
      search: '',
      issueId: null,
      mode: 'view',
    };
  };

  const initialRoute = parseRouteFromUrl();
  const [activeTab, setActiveTabState] = useState<TabType>(initialRoute.tab);
  const [selectedProjectId, setSelectedProjectIdState] = useState<number | null>(initialRoute.projectId);
  const [selectedAssigneeId, setSelectedAssigneeIdState] = useState<number | 'ALL' | 'MY'>(initialRoute.assigneeId);
  const [searchTerm, setSearchTermState] = useState<string>(initialRoute.search);
  const [selectedIssueId, setSelectedIssueIdState] = useState<number | null>(initialRoute.issueId);
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

  const navigate = useCallback(
    (
      tab: TabType,
      projId: number | null = null,
      issueId: number | null = null,
      mode: IssueDetailMode = 'view',
      replace: boolean = false,
      extra?: { assigneeId?: number | 'ALL' | 'MY'; search?: string }
    ) => {
      localStorage.setItem('activeTab', tab);
      if (projId) {
        localStorage.setItem('selectedProjectId', String(projId));
      } else {
        localStorage.removeItem('selectedProjectId');
      }

      const curAssignee = extra?.assigneeId !== undefined ? extra.assigneeId : selectedAssigneeId;
      const curSearch = extra?.search !== undefined ? extra.search : searchTerm;

      let hashStr = `#${tab}`;
      const queryParts: string[] = [];
      if (projId) queryParts.push(`projectId=${projId}`);
      if (curAssignee && curAssignee !== 'ALL') queryParts.push(`assigneeId=${curAssignee}`);
      if (curSearch && curSearch.trim()) queryParts.push(`search=${encodeURIComponent(curSearch.trim())}`);
      if (issueId) queryParts.push(`issueId=${issueId}`);
      if (tab === 'issue-detail' && mode === 'edit') queryParts.push(`mode=edit`);

      if (queryParts.length > 0) {
        hashStr += `?${queryParts.join('&')}`;
      }

      if (window.location.hash !== hashStr) {
        const stateObj = { tab, projectId: projId, assigneeId: curAssignee, search: curSearch, issueId, mode };
        if (replace) {
          window.history.replaceState(stateObj, '', hashStr);
        } else {
          window.history.pushState(stateObj, '', hashStr);
        }
      }

      setActiveTabState(tab);
      setSelectedProjectIdState(projId);
      if (extra?.assigneeId !== undefined) setSelectedAssigneeIdState(extra.assigneeId);
      if (extra?.search !== undefined) setSearchTermState(extra.search);
      setSelectedIssueIdState(issueId);
      setIssueDetailModeState(mode);
    },
    [selectedAssigneeId, searchTerm]
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
      const route = parseRouteFromUrl();
      setActiveTabState(route.tab);
      setSelectedProjectIdState(route.projectId);
      setSelectedAssigneeIdState(route.assigneeId);
      setSearchTermState(route.search);
      setSelectedIssueIdState(route.issueId);
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

  const handleSelectProject = (projectId: number) => {
    navigate('issues', projectId, null, 'view', false);
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

  // 1. 뒤로가기 : 실제로 직전 화면으로 돌아가는 동작 (React/브라우저 히스토리 활용)
  const handleBackFromIssueDetail = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      navigate('issues', selectedProjectId, null, 'view', false);
    }
  };

  // 2. 목록으로 돌아가기 : 이슈가 있던 목록(이슈 칸반 보드)으로 명시적 이동
  const handleGoToListFromIssueDetail = () => {
    navigate('issues', selectedProjectId, null, 'view', false);
  };

  return (
    <div style={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Header />

      <div style={{ display: 'flex', flex: 1, height: 'calc(100vh - 32px)', overflow: 'hidden' }}>
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenAuth={() => setIsAuthModalOpen(true)}
        />

        <main style={{ flex: 1, height: '100%', padding: '12px 16px', overflowY: 'auto', overflowX: 'hidden', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
          {activeTab === 'dashboard' && (
            <DashboardPage
              onNavigate={(tab) => navigate(tab, selectedProjectId, null, 'view', false)}
              onOpenCreateIssue={handleOpenCreateIssue}
              onOpenCreateProject={() => setIsProjectModalOpen(true)}
              onSelectIssue={handleSelectIssue}
              refreshKey={issueRefreshKey}
            />
          )}

          {activeTab === 'projects' && (
            <ProjectsPage
              onOpenCreateProject={() => setIsProjectModalOpen(true)}
              onSelectProject={handleSelectProject}
              projects={projects}
              onProjectsChange={setProjects}
            />
          )}

          {activeTab === 'issues' && (
            <IssuesPage
              onOpenCreateIssue={handleOpenCreateIssue}
              onSelectIssue={handleSelectIssue}
              selectedProjectId={selectedProjectId}
              selectedAssigneeId={selectedAssigneeId}
              searchTermProp={searchTerm}
              onFilterChange={handleFilterChange}
              refreshKey={issueRefreshKey}
            />
          )}

          {activeTab === 'issue-detail' && (
            <IssueDetailPage
              issueId={selectedIssueId}
              projectId={selectedProjectId}
              mode={issueDetailMode}
              onModeChange={handleIssueModeChange}
              onBack={handleBackFromIssueDetail}
              onGoToList={handleGoToListFromIssueDetail}
              onIssueUpdated={handleIssueRefreshed}
            />
          )}


          {activeTab === 'sprints' && <SprintsPage />}

          {activeTab === 'worklogs' && <WorklogsPage />}

          {activeTab === 'settings' && <SettingsPage onOpenAuth={() => setIsAuthModalOpen(true)} />}
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
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;

