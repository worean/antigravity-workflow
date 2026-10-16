import { useMemo } from 'react';
import type { BreadcrumbItem } from '@/components/Header';
import type { TabType } from '@/components/Sidebar';
import type { Project } from '@/types';

interface UseAppBreadcrumbsParams {
  activeTab: TabType;
  currentProject: Project | null;
  selectedProjectId: number | null;
  selectedIssueId: number | null;
  selectedSprintId: number | null;
  navigate: (tab: TabType, projId?: number | null) => void;
}

/** 현재 탭/선택 상태에 따른 상단 계층형 Breadcrumbs 를 계산합니다. (App.tsx 에서 분리) */
export function useAppBreadcrumbs({
  activeTab,
  currentProject,
  selectedProjectId,
  selectedIssueId,
  selectedSprintId,
  navigate,
}: UseAppBreadcrumbsParams): BreadcrumbItem[] {
  return useMemo<BreadcrumbItem[]>(() => {
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
      case 'calendar':
        baseCrumbs.push({ label: '캘린더 일정' });
        break;
      case 'chat':
        baseCrumbs.push({ label: '실시간 채팅' });
        break;
      case 'worklogs':
        baseCrumbs.push({ label: '작업 로그' });
        break;
      case 'memo':
        baseCrumbs.push({ label: '개인 메모' });
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
}
