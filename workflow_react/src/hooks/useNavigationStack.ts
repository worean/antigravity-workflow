import { useState, useCallback, useEffect } from 'react';
import { navigationStack, type NavigationHistoryEntry } from '@/utils/navigationUtils';
import { parseRouteFromHash } from '@/utils/routeUtils';

export interface UseNavigationStackReturn {
  canGoBack: boolean;
  canGoForward: boolean;
  currentEntry: NavigationHistoryEntry | null;
  goBack: () => void;
  goForward: () => void;
  backStack: NavigationHistoryEntry[];
}

export const useNavigationStack = (): UseNavigationStackReturn => {
  const [canBack, setCanBack] = useState(navigationStack.canGoBack());
  const [canForward, setCanForward] = useState(navigationStack.canGoForward());
  const [current, setCurrent] = useState<NavigationHistoryEntry | null>(navigationStack.getCurrent());
  const [backList, setBackList] = useState<NavigationHistoryEntry[]>(navigationStack.getBackStack());

  const syncState = useCallback(() => {
    setCanBack(navigationStack.canGoBack());
    setCanForward(navigationStack.canGoForward());
    setCurrent(navigationStack.getCurrent());
    setBackList(navigationStack.getBackStack());
  }, []);

  // window.location.hash 변경 시 스택에 자동 등록
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      const route = parseRouteFromHash(hash);
      navigationStack.push(hash, route);
      syncState();
    };

    // 초기 해시 등록
    if (typeof window !== 'undefined') {
      const initialHash = window.location.hash || '#/dashboard';
      navigationStack.push(initialHash, parseRouteFromHash(initialHash));
      syncState();

      window.addEventListener('hashchange', handleHashChange);
      return () => window.removeEventListener('hashchange', handleHashChange);
    }
  }, [syncState]);

  const goBack = useCallback(() => {
    const prev = navigationStack.goBack();
    if (prev && typeof window !== 'undefined') {
      window.location.hash = prev.hash;
      syncState();
    }
  }, [syncState]);

  const goForward = useCallback(() => {
    const next = navigationStack.goForward();
    if (next && typeof window !== 'undefined') {
      window.location.hash = next.hash;
      syncState();
    }
  }, [syncState]);

  return {
    canGoBack: canBack,
    canGoForward: canForward,
    currentEntry: current,
    goBack,
    goForward,
    backStack: backList,
  };
};
