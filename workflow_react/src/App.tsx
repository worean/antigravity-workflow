import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider } from './context/AuthContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import type { TabType } from './components/Sidebar';
import { AuthModal } from './components/AuthModal';
import { ProjectModal } from './components/ProjectModal';
import { IssueModal } from './components/IssueModal';
import { DashboardPage } from './pages/DashboardPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { IssuesPage } from './pages/IssuesPage';
import { SprintsPage } from './pages/SprintsPage';
import { WorklogsPage } from './pages/WorklogsPage';
import { IssueDetailPage } from './pages/IssueDetailPage';
import type { Project, Issue } from './types';
import { getProjects } from './services/api';

const AppContent: React.FC = () => {
  const getInitialRoute = (): { tab: TabType; projectId: number | null; issueId: number | null } => {
    try {
      const hash = window.location.hash.replace(/^#/, '');
      if (hash) {
        const [rawTab, queryStr] = hash.split('?');
        const validTabs: TabType[] = ['dashboard', 'projects', 'issues', 'sprints', 'worklogs', 'issue-detail'];
        const tab = validTabs.includes(rawTab as TabType) ? (rawTab as TabType) : 'dashboard';

        const params = new URLSearchParams(queryStr || '');
        const projectId = params.get('projectId') ? Number(params.get('projectId')) : null;
        const issueId = params.get('issueId') ? Number(params.get('issueId')) : null;

        return { tab, projectId, issueId };
      }
    } catch (e) {
      console.error(e);
    }

    const savedTab = localStorage.getItem('activeTab') as TabType;
    const savedProjectId = localStorage.getItem('selectedProjectId');
    const validTabs: TabType[] = ['dashboard', 'projects', 'issues', 'sprints', 'worklogs', 'issue-detail'];

    return {
      tab: validTabs.includes(savedTab) ? savedTab : 'dashboard',
      projectId: savedProjectId ? Number(savedProjectId) : null,
      issueId: null,
    };
  };

  const initialRoute = getInitialRoute();
  const [activeTab, setActiveTabState] = useState<TabType>(initialRoute.tab);
  const [selectedProjectId, setSelectedProjectIdState] = useState<number | null>(initialRoute.projectId);
  const [selectedIssueId, setSelectedIssueIdState] = useState<number | null>(initialRoute.issueId);

  // Modals
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState<boolean>(false);
  const [isIssueModalOpen, setIsIssueModalOpen] = useState<boolean>(false);

  const [projects, setProjects] = useState<Project[]>([]);

  const syncRouteToUrl = useCallback((tab: TabType, projId: number | null, issueId: number | null = null) => {
    localStorage.setItem('activeTab', tab);
    if (projId) {
      localStorage.setItem('selectedProjectId', String(projId));
    } else {
      localStorage.removeItem('selectedProjectId');
    }

    let hashStr = `#${tab}`;
    const queryParts: string[] = [];
    if (projId) queryParts.push(`projectId=${projId}`);
    if (issueId) queryParts.push(`issueId=${issueId}`);

    if (queryParts.length > 0) {
      hashStr += `?${queryParts.join('&')}`;
    }

    if (window.location.hash !== hashStr) {
      window.history.replaceState(null, '', hashStr);
    }
  }, []);

  const setActiveTab = (tab: TabType) => {
    setActiveTabState(tab);
    syncRouteToUrl(tab, selectedProjectId, selectedIssueId);
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

  useEffect(() => {
    const handleHashChange = () => {
      const route = getInitialRoute();
      setActiveTabState(route.tab);
      setSelectedProjectIdState(route.projectId);
      setSelectedIssueIdState(route.issueId);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleOpenCreateIssue = () => {
    setIsIssueModalOpen(true);
  };

  // 이슈 클릭 시 팝업이 아닌 전용 이슈 상세/수정 페이지 (IssueDetailPage)로 이동!
  const handleSelectIssue = (issue: Issue) => {
    setSelectedIssueIdState(issue.id);
    setActiveTabState('issue-detail');
    syncRouteToUrl('issue-detail', selectedProjectId, issue.id);
  };

  const handleSelectProject = (projectId: number) => {
    setSelectedProjectIdState(projectId);
    setActiveTabState('issues');
    syncRouteToUrl('issues', projectId, null);
  };

  const handleProjectCreated = (newProject: Project) => {
    setProjects((prev) => [newProject, ...prev]);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenCreateIssue={handleOpenCreateIssue}
      />

      <div style={{ display: 'flex', flex: 1 }}>
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        <main style={{ flex: 1, padding: '28px', maxWidth: '1400px', width: '100%' }}>
          {activeTab === 'dashboard' && (
            <DashboardPage
              onNavigate={setActiveTab}
              onOpenCreateIssue={handleOpenCreateIssue}
              onOpenCreateProject={() => setIsProjectModalOpen(true)}
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
            />
          )}

          {activeTab === 'issue-detail' && (
            <IssueDetailPage
              issueId={selectedIssueId}
              onBack={() => {
                setActiveTabState('issues');
                syncRouteToUrl('issues', selectedProjectId, null);
              }}
              onIssueUpdated={fetchProjects}
            />
          )}

          {activeTab === 'sprints' && <SprintsPage />}

          {activeTab === 'worklogs' && <WorklogsPage />}
        </main>
      </div>

      {/* Modals */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />

      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onSuccess={handleProjectCreated}
      />

      {/* 새 이슈 작성 전용 모달 */}
      <IssueModal
        isOpen={isIssueModalOpen}
        onClose={() => setIsIssueModalOpen(false)}
        projects={projects}
        onSuccess={fetchProjects}
      />
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
