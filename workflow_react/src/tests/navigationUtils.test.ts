import { describe, it, expect, beforeEach } from 'vitest';
import {
  NavigationStackManager,
  generateBreadcrumb,
} from '../utils/navigationUtils';
import type { RouteInfo } from '../utils/routeUtils';

describe('navigationUtils', () => {
  let stack: NavigationStackManager;

  const mockRoute = (tab: any, projectId: number | null = null, issueId: number | null = null): RouteInfo => ({
    rootTab: 'dashboard',
    tab,
    projectId,
    issueId,
    sprintId: null,
    channelId: null,
    mode: 'view',
    assigneeId: 'ALL',
    search: '',
  });

  beforeEach(() => {
    stack = new NavigationStackManager(10);
  });

  describe('NavigationStackManager', () => {
    it('새 화면 진입 시 backStack에 쌓이고 forwardStack은 비워져야 한다', () => {
      stack.push('#/dashboard', mockRoute('dashboard'));
      expect(stack.canGoBack()).toBe(false);

      stack.push('#/projects', mockRoute('projects'));
      expect(stack.canGoBack()).toBe(true);
      expect(stack.canGoForward()).toBe(false);

      stack.push('#/issues', mockRoute('issues'));
      expect(stack.getBackStack().length).toBe(2);
      expect(stack.getCurrent()?.hash).toBe('#/issues');
    });

    it('goBack() 호출 시 이전 화면으로 복원되고 forwardStack에 등록되어야 한다', () => {
      stack.push('#/dashboard', mockRoute('dashboard'));
      stack.push('#/projects', mockRoute('projects'));
      stack.push('#/issues', mockRoute('issues'));

      const back1 = stack.goBack();
      expect(back1?.hash).toBe('#/projects');
      expect(stack.getCurrent()?.hash).toBe('#/projects');
      expect(stack.canGoForward()).toBe(true);

      const forward1 = stack.goForward();
      expect(forward1?.hash).toBe('#/issues');
      expect(stack.canGoForward()).toBe(false);
    });

    it('동일한 해시 연속 진입 시 중복 적재되지 않아야 한다', () => {
      stack.push('#/dashboard', mockRoute('dashboard'));
      stack.push('#/dashboard', mockRoute('dashboard'));
      expect(stack.canGoBack()).toBe(false);
      expect(stack.getBackStack().length).toBe(0);
    });

    it('최대 스택 크기를 초과하면 오래된 항목부터 제거되어야 한다', () => {
      const smallStack = new NavigationStackManager(3);
      smallStack.push('#/1', mockRoute('dashboard'));
      smallStack.push('#/2', mockRoute('dashboard'));
      smallStack.push('#/3', mockRoute('dashboard'));
      smallStack.push('#/4', mockRoute('dashboard'));
      smallStack.push('#/5', mockRoute('dashboard'));

      const backList = smallStack.getBackStack();
      expect(backList.length).toBe(3);
      expect(backList[0].hash).toBe('#/2');
    });
  });

  describe('generateBreadcrumb', () => {
    it('단순 루트 탭 경로의 브레드크럼을 정확히 생성해야 한다', () => {
      const route: RouteInfo = {
        ...mockRoute('projects'),
        rootTab: 'projects',
      };
      const items = generateBreadcrumb(route);
      expect(items.length).toBe(1);
      expect(items[0].label).toBe('프로젝트');
      expect(items[0].isCurrent).toBe(true);
    });

    it('프로젝트 하위 이슈 상세 탭 경로의 브레드크럼을 계층적으로 생성해야 한다', () => {
      const route: RouteInfo = {
        ...mockRoute('issue-detail', 12, 101),
        rootTab: 'issues',
      };
      const projectNames = { 12: 'Core Backend Engine' };
      const items = generateBreadcrumb(route, projectNames);

      expect(items.length).toBe(3);
      expect(items[0].label).toBe('이슈');
      expect(items[0].isCurrent).toBe(false);

      expect(items[1].label).toBe('Core Backend Engine');
      expect(items[1].isCurrent).toBe(false);

      expect(items[2].label).toBe('이슈 #101');
      expect(items[2].isCurrent).toBe(true);
    });
  });
});
