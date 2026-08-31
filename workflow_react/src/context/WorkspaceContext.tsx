// -*- coding: utf-8 -*-
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './AuthContext';
import {
  getWorkspaces,
  createWorkspace as createWorkspaceApi,
  inviteWorkspaceMember as inviteMemberApi,
  workspaceKeys,
} from '@/api/workspaces';
import type { Workspace, WorkspaceMember } from '@/types';
import { prefRepository } from '@/lib/prefRepository';
import { draftStorage, type IssueDraft } from '@/utils/draftStorage';

export { type IssueDraft } from '@/utils/draftStorage';

// --- 🔒 내부 스토리지 안전 I/O 헬퍼 ---
function readWsStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null || raw === undefined) return fallback;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return raw as unknown as T;
    }
  } catch {
    return fallback;
  }
}

function writeWsStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    if (value === null || value === undefined) {
      window.localStorage.removeItem(key);
    } else {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      window.localStorage.setItem(key, serialized);
    }
  } catch (e) {
    console.warn(`[WorkspaceContext] Failed to write key "${key}":`, e);
  }
}

interface WorkspaceContextType {
  // 🏢 워크스페이스 기본 관리
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  isLoadingWorkspaces: boolean;
  switchWorkspace: (workspaceId: number) => void;
  createWorkspace: (data: { name: string; slug?: string; description?: string; icon?: string }) => Promise<Workspace>;
  inviteMember: (data: { email?: string; userId?: number; role?: string }) => Promise<WorkspaceMember>;
  refetchWorkspaces: () => void;

  // 🍪 경량 일감 작성/수정 초안(Draft) 관리 (리렌더링 무부하)
  getIssueDraft: (key: string | number) => IssueDraft | null;
  saveIssueDraft: (key: string | number, draft: Partial<IssueDraft>) => void;
  clearIssueDraft: (key: string | number) => void;
  hasIssueDraft: (key: string | number) => boolean;

  // 📐 화면 UI 레이아웃 및 메뉴 상태
  sidebarSubmenus: Record<string, boolean>;
  setSidebarSubmenus: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;

  // 🧭 라우팅 및 네비게이션
  prevRoute: string | null;
  setPrevRoute: (route: string | null) => void;
  selectedProjectId: number | null;
  setSelectedProjectId: (projectId: number | null) => void;
  selectedChannelId: number | null;
  setSelectedChannelId: (channelId: number | null) => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<number | null>(() => {
    return prefRepository.activeWorkspaceId;
  });

  // 1. 참여 중인 워크스페이스 목록 조회
  const {
    data: workspaces = [],
    isLoading: isLoadingWorkspaces,
    refetch: refetchWorkspaces,
  } = useQuery({
    queryKey: workspaceKeys.lists(),
    queryFn: getWorkspaces,
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5, // 5분
  });

  // 2. 현재 활성 워크스페이스 계산 및 동기화
  useEffect(() => {
    if (!isAuthenticated || workspaces.length === 0) {
      if (!isAuthenticated) {
        prefRepository.activeWorkspaceId = null;
        setCurrentWorkspaceId(null);
      }
      return;
    }

    const exists = workspaces.find((w) => w.id === currentWorkspaceId);
    if (!exists) {
      const defaultWs = workspaces[0];
      setCurrentWorkspaceId(defaultWs.id);
      prefRepository.activeWorkspaceId = defaultWs.id;
    }
  }, [isAuthenticated, workspaces, currentWorkspaceId]);

  const currentWorkspace = workspaces.find((w) => w.id === currentWorkspaceId) || workspaces[0] || null;

  // 3. 🍪 경량 일감 초안 (React State 리렌더링 없이 조용히 Cookie/WebStorage I/O)
  const getIssueDraft = useCallback((key: string | number): IssueDraft | null => {
    const wsPrefix = currentWorkspaceId ? `ws${currentWorkspaceId}_` : '';
    return draftStorage.getIssueDraft(`${wsPrefix}${key}`);
  }, [currentWorkspaceId]);

  const saveIssueDraft = useCallback((key: string | number, draft: Partial<IssueDraft>) => {
    const wsPrefix = currentWorkspaceId ? `ws${currentWorkspaceId}_` : '';
    draftStorage.saveIssueDraft(`${wsPrefix}${key}`, draft);
  }, [currentWorkspaceId]);

  const clearIssueDraft = useCallback((key: string | number) => {
    const wsPrefix = currentWorkspaceId ? `ws${currentWorkspaceId}_` : '';
    draftStorage.clearIssueDraft(`${wsPrefix}${key}`);
  }, [currentWorkspaceId]);

  const hasIssueDraft = useCallback((key: string | number): boolean => {
    const wsPrefix = currentWorkspaceId ? `ws${currentWorkspaceId}_` : '';
    return draftStorage.hasIssueDraft(`${wsPrefix}${key}`);
  }, [currentWorkspaceId]);

  // 4. 📐 사이드바 서브메뉴 상태 관리
  const [sidebarSubmenus, setSidebarSubmenusState] = useState<Record<string, boolean>>(() => {
    return readWsStorage<Record<string, boolean>>('pref_sidebar_submenus', {
      projects: false,
      issues: false,
      sprints: false,
      wbs: false,
      chat: false,
    });
  });

  const setSidebarSubmenus: React.Dispatch<React.SetStateAction<Record<string, boolean>>> = useCallback(
    (action) => {
      setSidebarSubmenusState((prev) => {
        const next = typeof action === 'function' ? action(prev) : action;
        writeWsStorage('pref_sidebar_submenus', next);
        return next;
      });
    },
    []
  );

  // 5. 🧭 라우팅, 선택 프로젝트, 선택 채널 이력
  const [prevRoute, setPrevRouteState] = useState<string | null>(() => readWsStorage<string | null>('pref_prev_route', null));
  const [selectedProjectId, setSelectedProjectIdState] = useState<number | null>(() => {
    const raw = readWsStorage<any>('selectedProjectId', null);
    if (!raw) return null;
    const num = Number(raw);
    return isNaN(num) ? null : num;
  });
  const [selectedChannelId, setSelectedChannelIdState] = useState<number | null>(() => {
    const raw = readWsStorage<any>('selectedChannelId', null);
    if (!raw) return null;
    const num = Number(raw);
    return isNaN(num) ? null : num;
  });

  const setPrevRoute = useCallback((route: string | null) => {
    setPrevRouteState(route);
    writeWsStorage('pref_prev_route', route);
  }, []);

  const setSelectedProjectId = useCallback((projectId: number | null) => {
    setSelectedProjectIdState(projectId);
    writeWsStorage('selectedProjectId', projectId);
  }, []);

  const setSelectedChannelId = useCallback((channelId: number | null) => {
    setSelectedChannelIdState(channelId);
    writeWsStorage('selectedChannelId', channelId);
  }, []);

  // 6. 워크스페이스 전환 함수 (전환 시 전역 쿼리 캐시 리셋 및 새 워크스페이스 데이터 로드)
  const switchWorkspace = useCallback(
    (workspaceId: number) => {
      if (workspaceId === currentWorkspaceId) return;

      const target = workspaces.find((w) => w.id === workspaceId);
      if (!target) return;

      setCurrentWorkspaceId(workspaceId);
      prefRepository.activeWorkspaceId = workspaceId;

      // ⭐️ 이전 워크스페이스 캐시 무효화 및 새 워크스페이스 데이터 갱신
      queryClient.invalidateQueries();
    },
    [currentWorkspaceId, workspaces, queryClient]
  );

  // 7. 워크스페이스 생성 뮤테이션
  const createMutation = useMutation({
    mutationFn: createWorkspaceApi,
    onSuccess: (newWorkspace) => {
      queryClient.invalidateQueries({ queryKey: workspaceKeys.lists() });
      switchWorkspace(newWorkspace.id);
    },
  });

  const createWorkspace = async (data: { name: string; slug?: string; description?: string; icon?: string }) => {
    return createMutation.mutateAsync(data);
  };

  // 8. 멤버 초대 뮤테이션
  const inviteMutation = useMutation({
    mutationFn: (data: { email?: string; userId?: number; role?: string }) => {
      if (!currentWorkspaceId) throw new Error('활성화된 워크스페이스가 없습니다.');
      return inviteMemberApi(currentWorkspaceId, data);
    },
    onSuccess: () => {
      if (currentWorkspaceId) {
        queryClient.invalidateQueries({ queryKey: workspaceKeys.detail(currentWorkspaceId) });
      }
    },
  });

  const inviteMember = async (data: { email?: string; userId?: number; role?: string }) => {
    return inviteMutation.mutateAsync(data);
  };

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        currentWorkspace,
        isLoadingWorkspaces,
        switchWorkspace,
        createWorkspace,
        inviteMember,
        refetchWorkspaces,
        getIssueDraft,
        saveIssueDraft,
        clearIssueDraft,
        hasIssueDraft,
        sidebarSubmenus,
        setSidebarSubmenus,
        prevRoute,
        setPrevRoute,
        selectedProjectId,
        setSelectedProjectId,
        selectedChannelId,
        setSelectedChannelId,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};
