/**
 * AntiGravity Navigation & Screen Stack Management Utilities
 * - 화면 스택(Navigation History Stack) 관리 (뒤로가기, 앞으로가기, 스택 제어)
 * - 브레드크럼(Breadcrumb) 경로 자동 산출
 */

import type { RouteInfo, ActiveTabType } from './routeUtils';
import { buildHashFromRoute } from './routeUtils';

export interface BreadcrumbItem {
  label: string;
  tab: ActiveTabType;
  hash: string;
  isCurrent: boolean;
}

export interface NavigationHistoryEntry {
  hash: string;
  route: RouteInfo;
  timestamp: number;
}

/**
 * 인메모리 내비게이션 스택 매니저 (뒤로가기 / 앞으로가기 스택 제어)
 */
export class NavigationStackManager {
  private backStack: NavigationHistoryEntry[] = [];
  private forwardStack: NavigationHistoryEntry[] = [];
  private currentEntry: NavigationHistoryEntry | null = null;
  private maxStackSize: number = 50;

  constructor(maxStackSize: number = 50) {
    this.maxStackSize = maxStackSize;
  }

  /**
   * 새 화면으로 이동 시 스택에 등록합니다. (앞으로 가기 스택 초기화)
   */
  public push(hash: string, route: RouteInfo): void {
    if (this.currentEntry && this.currentEntry.hash === hash) {
      return; // 동일한 해시 연속 진입 무시
    }

    if (this.currentEntry) {
      this.backStack.push(this.currentEntry);
      if (this.backStack.length > this.maxStackSize) {
        this.backStack.shift();
      }
    }

    this.currentEntry = {
      hash,
      route,
      timestamp: Date.now(),
    };

    // 새 화면 진입 시 forwardStack 초기화
    this.forwardStack = [];
  }

  /**
   * 현재 화면을 스택 추가 없이 대체(replace)합니다.
   */
  public replace(hash: string, route: RouteInfo): void {
    this.currentEntry = {
      hash,
      route,
      timestamp: Date.now(),
    };
  }

  /**
   * 뒤로가기 가능 여부를 반환합니다.
   */
  public canGoBack(): boolean {
    return this.backStack.length > 0;
  }

  /**
   * 앞으로가기 가능 여부를 반환합니다.
   */
  public canGoForward(): boolean {
    return this.forwardStack.length > 0;
  }

  /**
   * 뒤로가기 동작을 수행하고 이전 엔트리를 반환합니다.
   */
  public goBack(): NavigationHistoryEntry | null {
    if (!this.canGoBack()) return null;

    const prev = this.backStack.pop()!;
    if (this.currentEntry) {
      this.forwardStack.push(this.currentEntry);
    }
    this.currentEntry = prev;
    return prev;
  }

  /**
   * 앞으로가기 동작을 수행하고 다음 엔트리를 반환합니다.
   */
  public goForward(): NavigationHistoryEntry | null {
    if (!this.canGoForward()) return null;

    const next = this.forwardStack.pop()!;
    if (this.currentEntry) {
      this.backStack.push(this.currentEntry);
    }
    this.currentEntry = next;
    return next;
  }

  /**
   * 현재 활성 엔트리를 반환합니다.
   */
  public getCurrent(): NavigationHistoryEntry | null {
    return this.currentEntry;
  }

  /**
   * 전체 뒤로가기 스택 목록을 반환합니다.
   */
  public getBackStack(): NavigationHistoryEntry[] {
    return [...this.backStack];
  }

  /**
   * 전체 앞으로가기 스택 목록을 반환합니다.
   */
  public getForwardStack(): NavigationHistoryEntry[] {
    return [...this.forwardStack];
  }

  /**
   * 스택을 모두 초기화합니다.
   */
  public clear(): void {
    this.backStack = [];
    this.forwardStack = [];
    this.currentEntry = null;
  }
}

/**
 * 전역 싱글톤 내비게이션 스택 인스턴스
 */
export const navigationStack = new NavigationStackManager();

const ROOT_TAB_LABELS: Record<string, string> = {
  dashboard: '대시보드',
  projects: '프로젝트',
  issues: '이슈',
  sprints: '스프린트',
  wbs: 'WBS 일정',
  calendar: '캘린더',
  worklogs: '업무 일지',
  chat: '채팅',
  memo: '메모',
  settings: '환경 설정',
};

/**
 * 현재 RouteInfo를 기반으로 브레드크럼(Breadcrumb) 경로 목록을 생성합니다.
 */
export const generateBreadcrumb = (
  route: RouteInfo,
  projectNameMap: Record<number, string> = {}
): BreadcrumbItem[] => {
  const items: BreadcrumbItem[] = [];

  // 1. 루트 탭
  const rootLabel = ROOT_TAB_LABELS[route.rootTab] || route.rootTab;
  const rootHash = `#/${route.rootTab}`;
  const isRootCurrent = route.tab === route.rootTab && !route.projectId && !route.issueId && !route.sprintId;

  items.push({
    label: rootLabel,
    tab: route.rootTab,
    hash: rootHash,
    isCurrent: isRootCurrent,
  });

  if (isRootCurrent) return items;

  // 2. 프로젝트 컨텍스트가 있는 경우
  if (route.projectId) {
    const projName = projectNameMap[route.projectId] || `프로젝트 #${route.projectId}`;
    const projHash = buildHashFromRoute({ tab: 'project-detail', projectId: route.projectId });
    const isProjCurrent = route.tab === 'project-detail';

    items.push({
      label: projName,
      tab: 'project-detail',
      hash: projHash,
      isCurrent: isProjCurrent,
    });

    if (isProjCurrent) return items;
  }

  // 3. 서브 상세 탭
  if (route.tab === 'issue-detail' && route.issueId) {
    items.push({
      label: `이슈 #${route.issueId}`,
      tab: 'issue-detail',
      hash: buildHashFromRoute({
        tab: 'issue-detail',
        projectId: route.projectId,
        issueId: route.issueId,
      }),
      isCurrent: true,
    });
  } else if (route.tab === 'sprint-detail' && route.sprintId) {
    items.push({
      label: `스프린트 #${route.sprintId}`,
      tab: 'sprint-detail',
      hash: buildHashFromRoute({
        tab: 'sprint-detail',
        projectId: route.projectId,
        sprintId: route.sprintId,
      }),
      isCurrent: true,
    });
  } else if (route.tab !== route.rootTab) {
    items.push({
      label: ROOT_TAB_LABELS[route.tab] || route.tab,
      tab: route.tab,
      hash: buildHashFromRoute({ tab: route.tab, projectId: route.projectId }),
      isCurrent: true,
    });
  }

  return items;
};
