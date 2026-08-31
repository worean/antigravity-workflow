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
import { prefRepository, type IssueDraft } from '@/lib/prefRepository';

interface WorkspaceContextType {
  // 🏢 워크스페이스 관리
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  isLoadingWorkspaces: boolean;
  switchWorkspace: (workspaceId: number) => void;
  createWorkspace: (data: { name: string; slug?: string; description?: string; icon?: string }) => Promise<Workspace>;
  inviteMember: (data: { email?: string; userId?: number; role?: string }) => Promise<WorkspaceMember>;
  refetchWorkspaces: () => void;

  // 📝 일감 작성/수정 초안(Draft) 관리 (실수 방어)
  issueDrafts: Record<string, IssueDraft>;
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

    // 현재 선택된 ID가 유효한 목록에 존재하는지 확인
    const exists = workspaces.find((w) => w.id === currentWorkspaceId);
    if (!exists) {
      // 존재하지 않으면 첫 번째 워크스페이스를 기본 활성화
      const defaultWs = workspaces[0];
      setCurrentWorkspaceId(defaultWs.id);
      prefRepository.activeWorkspaceId = defaultWs.id;
    }
  }, [isAuthenticated, workspaces, currentWorkspaceId]);

  const currentWorkspace = workspaces.find((w) => w.id === currentWorkspaceId) || workspaces[0] || null;

  // 3. 📝 워크스페이스별 일감 초안(Draft) 상태 관리
  const [issueDrafts, setIssueDrafts] = useState<Record<string, IssueDraft>>(() => {
    return currentWorkspaceId ? prefRepository.getWorkspaceDrafts(currentWorkspaceId) : {};
  });

  // 워크스페이스 전환 시 해당 워크스페이스 전용 초안 로드
  useEffect(() => {
    if (currentWorkspaceId) {
      setIssueDrafts(prefRepository.getWorkspaceDrafts(currentWorkspaceId));
    } else {
      setIssueDrafts({});
    }
  }, [currentWorkspaceId]);

  const getIssueDraft = useCallback(
    (key: string | number): IssueDraft | null => {
      const k = String(key);
      return issueDrafts[k] || null;
    },
    [issueDrafts]
  );

  const saveIssueDraft = useCallback(
    (key: string | number, draft: Partial<IssueDraft>) => {
      if (!currentWorkspaceId) return;
      const k = String(key);
      setIssueDrafts((prev) => {
        const existing = prev[k] || { title: '', description: '', updatedAt: Date.now() };
        const updated = {
          ...existing,
          ...draft,
          updatedAt: Date.now(),
        };
        const nextState = { ...prev, [k]: updated };
        prefRepository.saveWorkspaceDrafts(currentWorkspaceId, nextState);
        return nextState;
      });
    },
    [currentWorkspaceId]
  );

  const clearIssueDraft = useCallback(
    (key: string | number) => {
      if (!currentWorkspaceId) return;
      const k = String(key);
      setIssueDrafts((prev) => {
        if (!prev[k]) return prev;
        const nextState = { ...prev };
        delete nextState[k];
        prefRepository.saveWorkspaceDrafts(currentWorkspaceId, nextState);
        return nextState;
      });
    },
    [currentWorkspaceId]
  );

  const hasIssueDraft = useCallback(
    (key: string | number): boolean => {
      const draft = getIssueDraft(key);
      return !!draft && (!!draft.title?.trim() || !!draft.description?.trim());
    },
    [getIssueDraft]
  );

  // 4. 📐 사이드바 서브메뉴 상태 관리
  const [sidebarSubmenus, setSidebarSubmenusState] = useState<Record<string, boolean>>(() => {
    return prefRepository.sidebarSubmenus;
  });

  const setSidebarSubmenus: React.Dispatch<React.SetStateAction<Record<string, boolean>>> = useCallback(
    (action) => {
      setSidebarSubmenusState((prev) => {
        const next = typeof action === 'function' ? action(prev) : action;
        prefRepository.sidebarSubmenus = next;
        return next;
      });
    },
    []
  );

  // 5. 🧭 라우팅 및 네비게이션 이력
  const [prevRoute, setPrevRouteState] = useState<string | null>(() => prefRepository.prevRoute);
  const [selectedChannelId, setSelectedChannelIdState] = useState<number | null>(() => prefRepository.selectedChannelId);

  const setPrevRoute = useCallback((route: string | null) => {
    setPrevRouteState(route);
    prefRepository.prevRoute = route;
  }, []);

  const setSelectedChannelId = useCallback((channelId: number | null) => {
    setSelectedChannelIdState(channelId);
    prefRepository.selectedChannelId = channelId;
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
        issueDrafts,
        getIssueDraft,
        saveIssueDraft,
        clearIssueDraft,
        hasIssueDraft,
        sidebarSubmenus,
        setSidebarSubmenus,
        prevRoute,
        setPrevRoute,
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
