import { apiClient } from '@/lib/apiClient';
import type { Workspace, WorkspaceDetail, WorkspaceMember } from '@/types';

export const workspaceKeys = {
  all: ['workspaces'] as const,
  lists: () => [...workspaceKeys.all, 'list'] as const,
  detail: (id?: number) => [...workspaceKeys.all, 'detail', id || 'current'] as const,
  invitations: (id?: number) => [...workspaceKeys.all, 'invitations', id || 'current'] as const,
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

export const getWorkspaceDetail = async (workspaceId?: number): Promise<WorkspaceDetail> => {
  const path = workspaceId ? `/workspaces/${workspaceId}` : '/workspaces/current';
  const res = await apiClient.get<WorkspaceDetail>(path);
  return res.data;
};

export const inviteWorkspaceMember = async (
  workspaceId?: number,
  data?: { email?: string; userId?: number; role?: string }
): Promise<WorkspaceMember> => {
  const path = workspaceId ? `/workspaces/${workspaceId}/invite` : '/workspaces/current/invite';
  const res = await apiClient.post<WorkspaceMember>(path, data);
  return res.data;
};

export const removeWorkspaceMember = async (
  workspaceId: number | undefined,
  userId: number
): Promise<{ success: boolean; message: string }> => {
  const path = workspaceId ? `/workspaces/${workspaceId}/members/${userId}` : `/workspaces/current/members/${userId}`;
  const res = await apiClient.delete<{ success: boolean; message: string }>(path);
  return res.data;
};

export const updateWorkspace = async (
  workspaceId?: number,
  data?: { name?: string; description?: string; icon?: string }
): Promise<Workspace> => {
  const path = workspaceId ? `/workspaces/${workspaceId}` : '/workspaces/current';
  const res = await apiClient.put<Workspace>(path, data);
  return res.data;
};

export const deleteWorkspace = async (
  workspaceId?: number
): Promise<{ success: boolean; message: string }> => {
  const path = workspaceId ? `/workspaces/${workspaceId}` : '/workspaces/current';
  const res = await apiClient.delete<{ success: boolean; message: string }>(path);
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
  workspaceId: number | undefined,
  data: { email: string; role?: string; expiresInDays?: number }
): Promise<{ directJoined: boolean; inviteToken?: string; inviteUrl?: string; message: string }> => {
  const path = workspaceId ? `/workspaces/${workspaceId}/invitations` : '/workspaces/current/invitations';
  const res = await apiClient.post(path, data);
  return res.data;
};

export const getWorkspaceInvitations = async (
  workspaceId?: number
): Promise<WorkspaceInvitationItem[]> => {
  const path = workspaceId ? `/workspaces/${workspaceId}/invitations` : '/workspaces/current/invitations';
  const res = await apiClient.get<WorkspaceInvitationItem[]>(path);
  return res.data;
};

export const deleteWorkspaceInvitation = async (
  workspaceId: number | undefined,
  invitationId: number
): Promise<{ success: boolean; message: string }> => {
  const path = workspaceId ? `/workspaces/${workspaceId}/invitations/${invitationId}` : `/workspaces/current/invitations/${invitationId}`;
  const res = await apiClient.delete<{ success: boolean; message: string }>(path);
  return res.data;
};

export const joinWorkspaceByToken = async (
  inviteToken: string
): Promise<{ success: boolean; workspace: Workspace; message: string }> => {
  const res = await apiClient.post('/workspaces/join', { inviteToken });
  return res.data;
};
