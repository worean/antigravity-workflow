import { apiClient } from '@/lib/apiClient';
import type { Workspace, WorkspaceDetail, WorkspaceMember } from '@/types';

export const workspaceKeys = {
  all: ['workspaces'] as const,
  lists: () => [...workspaceKeys.all, 'list'] as const,
  detail: (id: number) => [...workspaceKeys.all, 'detail', id] as const,
  invitations: (id: number) => [...workspaceKeys.all, 'invitations', id] as const,
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

// 💌 초대 토큰/링크 관리 API
export interface WorkspaceInvitationItem {
  id: number;
  workspaceId: number;
  email: string;
  role: string;
  inviteToken: string;
  expiresAt: string;
  createdAt: string;
}

export const createWorkspaceInvitation = async (
  workspaceId: number,
  data: { email: string; role?: string; expiresInDays?: number }
): Promise<{ directJoined: boolean; inviteToken?: string; inviteUrl?: string; message: string }> => {
  const res = await apiClient.post(`/workspaces/${workspaceId}/invitations`, data);
  return res.data;
};

export const getWorkspaceInvitations = async (
  workspaceId: number
): Promise<WorkspaceInvitationItem[]> => {
  const res = await apiClient.get<WorkspaceInvitationItem[]>(`/workspaces/${workspaceId}/invitations`);
  return res.data;
};

export const deleteWorkspaceInvitation = async (
  workspaceId: number,
  invitationId: number
): Promise<{ success: boolean; message: string }> => {
  const res = await apiClient.delete<{ success: boolean; message: string }>(
    `/workspaces/${workspaceId}/invitations/${invitationId}`
  );
  return res.data;
};

export const joinWorkspaceByToken = async (
  inviteToken: string
): Promise<{ success: boolean; workspace: Workspace; message: string }> => {
  const res = await apiClient.post('/workspaces/join', { inviteToken });
  return res.data;
};
