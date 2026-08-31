import { useQuery, useSuspenseQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import type { Project } from '@/types';

export interface ProjectQueryParams {
  search?: string;
  statusId?: number;
  priorityId?: number;
  ownerId?: number | 'my' | 'me' | 'MY';
  memberId?: number | 'my' | 'me' | 'MY';
  limit?: number;
  take?: number;
  skip?: number;
  offset?: number;
  sortBy?: 'id' | 'createdAt' | 'updatedAt' | 'name' | 'key' | 'dueDate' | 'plannedStartDate' | 'priorityId' | 'statusId' | string;
  order?: 'asc' | 'desc';
  sortOrder?: 'asc' | 'desc';
}

// ----------------------------------------------------
// 1. Raw API Functions
// ----------------------------------------------------
export const getProjects = async (filters?: ProjectQueryParams): Promise<Project[]> => {
  const params: any = {};
  if (filters) {
    if (filters.search) params.search = filters.search;
    if (filters.statusId !== undefined) params.statusId = filters.statusId;
    if (filters.priorityId !== undefined) params.priorityId = filters.priorityId;
    if (filters.ownerId !== undefined) params.ownerId = filters.ownerId;
    if (filters.memberId !== undefined) params.memberId = filters.memberId;
    if (filters.limit !== undefined) params.limit = filters.limit;
    if (filters.take !== undefined) params.take = filters.take;
    if (filters.skip !== undefined) params.skip = filters.skip;
    if (filters.offset !== undefined) params.offset = filters.offset;
    if (filters.sortBy) params.sortBy = filters.sortBy;
    if (filters.order) params.order = filters.order;
    if (filters.sortOrder) params.sortOrder = filters.sortOrder;
  }

  const res = await apiClient.get('/projects', { params });
  return Array.isArray(res.data) ? res.data : (res.data.projects || []);
};

export const getProject = async (id: number): Promise<Project> => {
  const res = await apiClient.get(`/projects/${id}`);
  return res.data;
};

export const createProject = async (data: { name: string; key: string; description?: string }): Promise<Project> => {
  const res = await apiClient.post('/projects', data);
  return res.data;
};

export const updateProject = async (
  id: number,
  data: {
    name?: string;
    description?: string | null;
    key?: string;
    statusId?: number;
    priorityId?: number;
    plannedStartDate?: string | null;
    dueDate?: string | null;
    actualStartDate?: string | null;
    actualEndDate?: string | null;
  }
): Promise<Project> => {
  const res = await apiClient.put(`/projects/${id}`, data);
  return res.data;
};

export const deleteProject = async (id: number): Promise<void> => {
  await apiClient.delete(`/projects/${id}`);
};

export const addProjectMember = async (projectId: number, userId: number, role: string = 'MEMBER') => {
  const res = await apiClient.post(`/projects/${projectId}/members`, { userId, role });
  return res.data;
};

export const removeProjectMember = async (projectId: number, userId: number) => {
  const res = await apiClient.delete(`/projects/${projectId}/members/${userId}`);
  return res.data;
};

export const updateProjectMemberRole = async (projectId: number, userId: number, role: string) => {
  const res = await apiClient.put(`/projects/${projectId}/members/${userId}`, { role });
  return res.data;
};

export const addProjectGroup = async (projectId: number, groupId: number, role: string = 'MEMBER') => {
  const res = await apiClient.post(`/projects/${projectId}/groups`, { groupId, role });
  return res.data;
};

export const removeProjectGroup = async (projectId: number, groupId: number) => {
  const res = await apiClient.delete(`/projects/${projectId}/groups/${groupId}`);
  return res.data;
};

export const updateProjectGroupRole = async (projectId: number, groupId: number, role: string) => {
  const res = await apiClient.put(`/projects/${projectId}/groups/${groupId}`, { role });
  return res.data;
};

// ----------------------------------------------------
// 2. Query Keys
// ----------------------------------------------------
export const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  list: (filters?: ProjectQueryParams) => [...projectKeys.lists(), filters ?? {}] as const,
  details: () => [...projectKeys.all, 'detail'] as const,
  detail: (id: number) => [...projectKeys.details(), id] as const,
};

// ----------------------------------------------------
// 3. TanStack Query & Mutation Hooks
// ----------------------------------------------------
export const useProjects = (filters?: ProjectQueryParams, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: projectKeys.list(filters),
    queryFn: () => getProjects(filters),
    placeholderData: keepPreviousData,
    enabled: options?.enabled ?? true,
  });
};

export const useProject = (projectId?: number | null) => {
  return useQuery({
    queryKey: projectId ? projectKeys.detail(projectId) : ['projects', 'detail', null],
    queryFn: () => getProject(projectId!),
    enabled: !!projectId && !isNaN(projectId),
  });
};

/**
 * React Suspense 지원 프로젝트 목록 쿼리 Hook
 */
export const useSuspenseProjects = (filters?: ProjectQueryParams) => {
  return useSuspenseQuery({
    queryKey: projectKeys.list(filters),
    queryFn: () => getProjects(filters),
  });
};

/**
 * React Suspense 지원 단일 프로젝트 상세 쿼리 Hook
 */
export const useSuspenseProject = (projectId: number) => {
  return useSuspenseQuery({
    queryKey: projectKeys.detail(projectId),
    queryFn: () => getProject(projectId),
  });
};

export const useCreateProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
};

export const useUpdateProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof updateProject>[1] }) =>
      updateProject(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(variables.id) });
    },
  });
};

export const useDeleteProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
};
