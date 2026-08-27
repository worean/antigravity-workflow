import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/apiClient';
import type { Group, GroupMember } from '../types';

export const getGroups = async (asTree: boolean = true): Promise<Group[]> => {
  const res = await apiClient.get(`/groups${asTree ? '?asTree=true' : ''}`);
  return Array.isArray(res.data) ? res.data : [];
};

export const getGroup = async (id: number): Promise<Group> => {
  const res = await apiClient.get(`/groups/${id}`);
  return res.data;
};

export const createGroup = async (data: {
  name: string;
  code?: string;
  description?: string;
  parentId?: number | null;
  order?: number;
}): Promise<Group> => {
  const res = await apiClient.post('/groups', data);
  return res.data;
};

export const updateGroup = async (id: number, data: Partial<Group>): Promise<Group> => {
  const res = await apiClient.put(`/groups/${id}`, data);
  return res.data;
};

export const deleteGroup = async (id: number): Promise<{ message: string; id: number }> => {
  const res = await apiClient.delete(`/groups/${id}`);
  return res.data;
};

export const addGroupMember = async (groupId: number, data: {
  userId: number;
  role?: string;
  title?: string;
}): Promise<GroupMember> => {
  const res = await apiClient.post(`/groups/${groupId}/members`, data);
  return res.data;
};

export const updateGroupMember = async (groupId: number, userId: number, data: {
  role?: string;
  title?: string;
}): Promise<GroupMember> => {
  const res = await apiClient.put(`/groups/${groupId}/members/${userId}`, data);
  return res.data;
};

export const removeGroupMember = async (groupId: number, userId: number): Promise<{ message: string }> => {
  const res = await apiClient.delete(`/groups/${groupId}/members/${userId}`);
  return res.data;
};

export const groupKeys = {
  all: ['groups'] as const,
};

export const useGroups = (asTree: boolean = true) => {
  return useQuery({
    queryKey: [...groupKeys.all, asTree],
    queryFn: () => getGroups(asTree),
  });
};
