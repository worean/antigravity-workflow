// -*- coding: utf-8 -*-
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import {
  getWorkspaces,
  createWorkspace as createWorkspaceApi,
  inviteWorkspaceMember as inviteMemberApi,
  workspaceKeys,
} from '@/api/workspaces';
import type { Workspace, WorkspaceMember } from '@/types';

import { prefRepository } from '@/lib/prefRepository';

interface WorkspaceContextType {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  isLoadingWorkspaces: boolean;
  switchWorkspace: (workspaceId: number) => void;
  createWorkspace: (data: { name: string; slug?: string; description?: string; icon?: string }) => Promise<Workspace>;
  inviteMember: (data: { email?: string; userId?: number; role?: string }) => Promise<WorkspaceMember>;
  refetchWorkspaces: () => void;
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

  // 3. 워크스페이스 전환 함수 (전환 시 전역 쿼리 캐시 리셋 및 새 워크스페이스 데이터 로드)
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

  // 4. 워크스페이스 생성 뮤테이션
  const createMutation = useMutation({
    mutationFn: createWorkspaceApi,
    onSuccess: (newWorkspace) => {
      queryClient.setQueryData<Workspace[]>(workspaceKeys.lists(), (old = []) => [newWorkspace, ...old]);
      switchWorkspace(newWorkspace.id);
    },
  });

  const createWorkspace = async (data: { name: string; slug?: string; description?: string; icon?: string }) => {
    return await createMutation.mutateAsync(data);
  };

  // 5. 멤버 초대 함수
  const inviteMember = async (data: { email?: string; userId?: number; role?: string }) => {
    if (!currentWorkspace) throw new Error('활성화된 워크스페이스가 없습니다.');
    return await inviteMemberApi(currentWorkspace.id, data);
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
