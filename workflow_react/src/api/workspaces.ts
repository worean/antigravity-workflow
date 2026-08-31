// -*- coding: utf-8 -*-
import { apiClient } from '@/lib/apiClient';
import type { Workspace, WorkspaceDetail, WorkspaceMember } from '@/types';

export const workspaceKeys = {
  all: ['workspaces'] as const,
  lists: () => [...workspaceKeys.all, 'list'] as const,
  detail: (id: number) => [...workspaceKeys.all, 'detail', id] as const,
};

export const getWorkspaces = async (): Promise<Workspace[]> => {
  const res = await apiClient.get<Workspace[]>('/workspaces');
  return res.data;
};

export const createWorkspace = async (data: {
  name: string;
  slug?: string;
  description?: string;
  icon?: string;
}): Promise<Workspace> => {
  const res = await apiClient.post<Workspace>('/workspaces', data);
  return res.data;
};

export const getWorkspaceDetail = async (workspaceId: number): Promise<WorkspaceDetail> => {
  const res = await apiClient.get<WorkspaceDetail>(`/workspaces/${workspaceId}`);
  return res.data;
};

export const inviteWorkspaceMember = async (
  workspaceId: number,
  data: { email?: string; userId?: number; role?: string }
): Promise<WorkspaceMember> => {
  const res = await apiClient.post<WorkspaceMember>(`/workspaces/${workspaceId}/invite`, data);
  return res.data;
};

export const removeWorkspaceMember = async (
  workspaceId: number,
  userId: number
): Promise<{ success: boolean; message: string }> => {
  const res = await apiClient.delete<{ success: boolean; message: string }>(
    `/workspaces/${workspaceId}/members/${userId}`
  );
  return res.data;
};

export const updateWorkspace = async (
  workspaceId: number,
  data: { name?: string; description?: string; icon?: string }
): Promise<Workspace> => {
  const res = await apiClient.put<Workspace>(`/workspaces/${workspaceId}`, data);
  return res.data;
};

export const deleteWorkspace = async (
  workspaceId: number
): Promise<{ success: boolean; message: string }> => {
  const res = await apiClient.delete<{ success: boolean; message: string }>(
    `/workspaces/${workspaceId}`
  );
  return res.data;
};
