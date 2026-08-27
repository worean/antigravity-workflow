// -*- coding: utf-8 -*-
export type RootTabType =
  | 'dashboard'
  | 'projects'
  | 'issues'
  | 'sprints'
  | 'wbs'
  | 'worklogs'
  | 'chat'
  | 'settings';

export type ActiveTabType =
  | RootTabType
  | 'project-detail'
  | 'issue-detail'
  | 'sprint-detail';

export interface RouteInfo {
  rootTab: RootTabType;
  tab: ActiveTabType;
  projectId: number | null;
  issueId: number | null;
  sprintId: number | null;
  channelId: number | null;
  mode: 'view' | 'edit';
  assigneeId: number | 'ALL' | 'MY';
  search: string;
}

/**
 * URL Hash로부터 계층형 RouteInfo 파싱
 */
export function parseRouteFromHash(rawHash: string): RouteInfo {
  const defaultRoute: RouteInfo = {
    rootTab: 'dashboard',
    tab: 'dashboard',
    projectId: null,
    issueId: null,
    sprintId: null,
    channelId: null,
    mode: 'view',
    assigneeId: 'ALL',
    search: '',
  };

  try {
    const cleanHash = rawHash.replace(/^#\/?/, '');
    if (!cleanHash) return defaultRoute;

    const [pathPart, queryPart] = cleanHash.split('?');
    const queryParams = new URLSearchParams(queryPart || '');

    const queryProjectId = queryParams.get('projectId') ? Number(queryParams.get('projectId')) : null;
    const queryIssueId = queryParams.get('issueId') ? Number(queryParams.get('issueId')) : null;
    const querySprintId = queryParams.get('sprintId') ? Number(queryParams.get('sprintId')) : null;
    const queryChannelId = queryParams.get('channelId') ? Number(queryParams.get('channelId')) : null;
    const rawAssignee = queryParams.get('assigneeId');
    const assigneeId = rawAssignee === 'MY' ? 'MY' : rawAssignee && !isNaN(Number(rawAssignee)) ? Number(rawAssignee) : 'ALL';
    const search = queryParams.get('search') || '';
    const mode = queryParams.get('mode') === 'edit' ? 'edit' : 'view';

    const segments = pathPart.split('/').filter(Boolean);

    // 1. 레거시 단일 탭 매칭 (#project-detail, #issue-detail, #sprint-detail 등)
    if (segments.length === 1 && segments[0] === 'project-detail') {
      return {
        rootTab: 'projects',
        tab: 'project-detail',
        projectId: queryProjectId,
        issueId: null,
        sprintId: null,
        channelId: null,
        mode,
        assigneeId,
        search,
      };
    }
    if (segments.length === 1 && segments[0] === 'issue-detail') {
      return {
        rootTab: 'issues',
        tab: 'issue-detail',
        projectId: queryProjectId,
        issueId: queryIssueId,
        sprintId: null,
        channelId: null,
        mode,
        assigneeId,
        search,
      };
    }
    if (segments.length === 1 && segments[0] === 'sprint-detail') {
      return {
        rootTab: 'sprints',
        tab: 'sprint-detail',
        projectId: queryProjectId,
        issueId: null,
        sprintId: querySprintId,
        channelId: null,
        mode,
        assigneeId,
        search,
      };
    }

    // 2. 계층형 경로 매칭
    const root = segments[0] as RootTabType;

    // #/projects/...
    if (root === 'projects') {
      if (segments.length === 1) {
        return {
          rootTab: 'projects',
          tab: 'projects',
          projectId: queryProjectId,
          issueId: null,
          sprintId: null,
          channelId: null,
          mode,
          assigneeId,
          search,
        };
      }
      const pId = Number(segments[1]);
      if (!isNaN(pId)) {
        const sub = segments[2];
        if (sub === 'issues') {
          const subIssueId = segments[3] ? Number(segments[3]) : null;
          if (subIssueId && !isNaN(subIssueId)) {
            return {
              rootTab: 'issues',
              tab: 'issue-detail',
              projectId: pId,
              issueId: subIssueId,
              sprintId: null,
              channelId: null,
              mode,
              assigneeId,
              search,
            };
          }
          return {
            rootTab: 'issues',
            tab: 'issues',
            projectId: pId,
            issueId: null,
            sprintId: null,
            channelId: null,
            mode,
            assigneeId,
            search,
          };
        }
        if (sub === 'sprints') {
          const subSprintId = segments[3] ? Number(segments[3]) : null;
          if (subSprintId && !isNaN(subSprintId)) {
            return {
              rootTab: 'sprints',
              tab: 'sprint-detail',
              projectId: pId,
              issueId: null,
              sprintId: subSprintId,
              channelId: null,
              mode,
              assigneeId,
              search,
            };
          }
          return {
            rootTab: 'sprints',
            tab: 'sprints',
            projectId: pId,
            issueId: null,
            sprintId: null,
            channelId: null,
            mode,
            assigneeId,
            search,
          };
        }
        if (sub === 'wbs') {
          return {
            rootTab: 'wbs',
            tab: 'wbs',
            projectId: pId,
            issueId: null,
            sprintId: null,
            channelId: null,
            mode,
            assigneeId,
            search,
          };
        }
        // 기본은 프로젝트 상세 (/projects/:id 또는 /projects/:id/detail)
        return {
          rootTab: 'projects',
          tab: 'project-detail',
          projectId: pId,
          issueId: null,
          sprintId: null,
          channelId: null,
          mode,
          assigneeId,
          search,
        };
      }
    }

    // #/issues/...
    if (root === 'issues') {
      if (segments.length > 1) {
        const iId = Number(segments[1]);
        if (!isNaN(iId)) {
          return {
            rootTab: 'issues',
            tab: 'issue-detail',
            projectId: queryProjectId,
            issueId: iId,
            sprintId: null,
            channelId: null,
            mode,
            assigneeId,
            search,
          };
        }
      }
      return {
        rootTab: 'issues',
        tab: 'issues',
        projectId: queryProjectId,
        issueId: null,
        sprintId: null,
        channelId: null,
        mode,
        assigneeId,
        search,
      };
    }

    // #/sprints/...
    if (root === 'sprints') {
      if (segments.length > 1) {
        const sId = Number(segments[1]);
        if (!isNaN(sId)) {
          return {
            rootTab: 'sprints',
            tab: 'sprint-detail',
            projectId: queryProjectId,
            issueId: null,
            sprintId: sId,
            channelId: null,
            mode,
            assigneeId,
            search,
          };
        }
      }
      return {
        rootTab: 'sprints',
        tab: 'sprints',
        projectId: queryProjectId,
        issueId: null,
        sprintId: null,
        channelId: null,
        mode,
        assigneeId,
        search,
      };
    }

    // #/chat/...
    if (root === 'chat') {
      const cId = segments[1] ? Number(segments[1]) : queryChannelId;
      return {
        rootTab: 'chat',
        tab: 'chat',
        projectId: null,
        issueId: null,
        sprintId: null,
        channelId: cId && !isNaN(cId) ? cId : null,
        mode,
        assigneeId,
        search,
      };
    }

    // #/wbs, #/worklogs, #/dashboard, #/settings
    const validRoots: RootTabType[] = ['dashboard', 'projects', 'issues', 'sprints', 'wbs', 'worklogs', 'chat', 'settings'];
    const matchedRoot = validRoots.includes(root) ? root : 'dashboard';

    return {
      rootTab: matchedRoot,
      tab: matchedRoot,
      projectId: queryProjectId,
      issueId: queryIssueId,
      sprintId: querySprintId,
      channelId: queryChannelId,
      mode,
      assigneeId,
      search,
    };
  } catch {
    return defaultRoute;
  }
}

/**
 * RouteInfo로부터 표준 RESTful 계층 Hash URL 빌드
 */
export function buildHashFromRoute(route: {
  tab: ActiveTabType;
  projectId?: number | null;
  issueId?: number | null;
  sprintId?: number | null;
  channelId?: number | null;
  mode?: 'view' | 'edit';
  assigneeId?: number | 'ALL' | 'MY';
  search?: string;
}): string {
  const { tab, projectId, issueId, sprintId, channelId, mode = 'view', assigneeId = 'ALL', search = '' } = route;

  let path = '';
  const params = new URLSearchParams();

  if (tab === 'project-detail' && projectId) {
    path = `/projects/${projectId}`;
  } else if (tab === 'issue-detail' && issueId) {
    if (projectId) {
      path = `/projects/${projectId}/issues/${issueId}`;
    } else {
      path = `/issues/${issueId}`;
    }
  } else if (tab === 'sprint-detail' && sprintId) {
    if (projectId) {
      path = `/projects/${projectId}/sprints/${sprintId}`;
    } else {
      path = `/sprints/${sprintId}`;
    }
  } else if (tab === 'issues' && projectId) {
    path = `/projects/${projectId}/issues`;
  } else if (tab === 'sprints' && projectId) {
    path = `/projects/${projectId}/sprints`;
  } else if (tab === 'wbs' && projectId) {
    path = `/projects/${projectId}/wbs`;
  } else if (tab === 'chat' && channelId) {
    path = `/chat/${channelId}`;
  } else {
    path = `/${tab}`;
  }

  // 쿼리 파라미터 부착
  if (mode === 'edit') params.set('mode', 'edit');
  if (assigneeId && assigneeId !== 'ALL') params.set('assigneeId', String(assigneeId));
  if (search && search.trim()) params.set('search', search.trim());

  const queryString = params.toString();
  return `#${path}${queryString ? `?${queryString}` : ''}`;
}