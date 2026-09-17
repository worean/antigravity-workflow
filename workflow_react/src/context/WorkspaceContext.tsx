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
import { useUIStore } from '@/stores/useUIStore';
import { safeStorage } from '@/utils/safeStorage';

export { type IssueDraft } from '@/utils/draftStorage';

interface WorkspaceContextType {
  // 🏢 단일 워크스페이스 관리
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  isLoadingWorkspaces: boolean;
  switchWorkspace: (workspaceId: number) => void;
  createWorkspace: (data: { name: string; slug?: string; description?: string; icon?: string }) => Promise<Workspace>;
  inviteMember: (data: { email?: string; userId?: number; role?: string }) => Promise<WorkspaceMember>;
  refetchWorkspaces: () => void;

  // 🍪 경량 일감 작성/수정 초안(Draft) 관리
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

  // 1. 단일 워크스페이스 정보 조회
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

  const currentWorkspace = workspaces[0] || null;

  useEffect(() => {
    if (currentWorkspace?.id) {
      prefRepository.activeWorkspaceId = currentWorkspace.id;
    } else if (!isAuthenticated) {
      prefRepository.activeWorkspaceId = null;
    }
  }, [currentWorkspace, isAuthenticated]);

  // 2. 🍪 경량 일감 초안 (단일 워크스페이스 공통 접두사)
  const getIssueDraft = useCallback((key: string | number): IssueDraft | null => {
    return draftStorage.getIssueDraft(`ws_${key}`);
  }, []);

  const saveIssueDraft = useCallback((key: string | number, draft: Partial<IssueDraft>) => {
    draftStorage.saveIssueDraft(`ws_${key}`, draft);
  }, []);

  const clearIssueDraft = useCallback((key: string | number) => {
    draftStorage.clearIssueDraft(`ws_${key}`);
  }, []);

  const hasIssueDraft = useCallback((key: string | number): boolean => {
    return draftStorage.hasIssueDraft(`ws_${key}`);
  }, []);

  // 3. 📐 사이드바 서브메뉴 상태 관리 (Zustand useUIStore 연동)
  const sidebarSubmenus = useUIStore((s) => s.sidebarSubmenus);
  const setSidebarSubmenusStore = useUIStore((s) => s.setSidebarSubmenus);
  const setSidebarSubmenus: React.Dispatch<React.SetStateAction<Record<string, boolean>>> = useCallback(
    (action) => {
      setSidebarSubmenusStore(action as any);
    },
    [setSidebarSubmenusStore]
  );

  // 4. 🧭 라우팅, 선택 프로젝트, 선택 채널 이력
  const prevRoute = useUIStore((s) => s.prevRoute);
  const setPrevRoute = useUIStore((s) => s.setPrevRoute);
  const [selectedProjectId, setSelectedProjectIdState] = useState<number | null>(() => {
    return safeStorage.getItem<number | null>('selectedProjectId', null);
  });
  const [selectedChannelId, setSelectedChannelIdState] = useState<number | null>(() => {
    return safeStorage.getItem<number | null>('selectedChannelId', null);
  });

  const setSelectedProjectId = useCallback((projectId: number | null) => {
    setSelectedProjectIdState(projectId);
    if (projectId === null) {
      safeStorage.removeItem('selectedProjectId');
    } else {
      safeStorage.setItem('selectedProjectId', projectId);
    }
  }, []);

  const setSelectedChannelId = useCallback((channelId: number | null) => {
    setSelectedChannelIdState(channelId);
    if (channelId === null) {
      safeStorage.removeItem('selectedChannelId');
    } else {
      safeStorage.setItem('selectedChannelId', channelId);
    }
  }, []);

  // 5. 단일 워크스페이스 전환 (no-op 유지)
  const switchWorkspace = useCallback(
    (_workspaceId: number) => {
      // 단일 워크스페이스 구조이므로 캐시 무효화만 수행
      queryClient.invalidateQueries();
    },
    [queryClient]
  );

  // 6. 워크스페이스 생성/초기화 뮤테이션
  const createMutation = useMutation({
    mutationFn: createWorkspaceApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workspaceKeys.lists() });
    },
  });

  const createWorkspace = useCallback(
    async (data: { name: string; slug?: string; description?: string; icon?: string }) => {
      return createMutation.mutateAsync(data);
    },
    [createMutation]
  );

  // 7. 멤버 초대 뮤테이션
  const inviteMutation = useMutation({
    mutationFn: (data: { email?: string; userId?: number; role?: string }) => {
      return inviteMemberApi(currentWorkspace?.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workspaceKeys.all });
    },
  });

  const inviteMember = useCallback(
    async (data: { email?: string; userId?: number; role?: string }) => {
      return inviteMutation.mutateAsync(data);
    },
    [inviteMutation]
  );

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
