import { useQuery, useSuspenseQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import type { Issue } from '@/types';

export interface IssueQueryParams {
  projectId?: number;
  sprintId?: number;
  assigneeId?: number | 'my' | 'me' | 'ALL' | 'MY' | 'unassigned' | 'null';
  authorId?: number | 'my' | 'me' | 'MY';
  typeId?: number;
  statusId?: number;
  priorityId?: number;
  parentId?: number | null;
  tag?: string;
  tagId?: number;
  search?: string;
  limit?: number | 'all';
  take?: number;
  skip?: number;
  offset?: number;
  sortBy?: 'id' | 'createdAt' | 'updatedAt' | 'dueDate' | 'plannedStartDate' | 'priorityId' | 'statusId' | 'progress' | 'issueNumber' | 'title' | string;
  order?: 'asc' | 'desc';
  sortOrder?: 'asc' | 'desc';
  all?: boolean | string;
}

// ----------------------------------------------------
// 1. Raw API Functions
// ----------------------------------------------------
export const getIssues = async (filters?: IssueQueryParams): Promise<Issue[]> => {
  const params: any = {};
  if (filters) {
    if (filters.projectId !== undefined) params.projectId = filters.projectId;
    if (filters.sprintId !== undefined) params.sprintId = filters.sprintId;
    if (filters.assigneeId !== undefined) params.assigneeId = filters.assigneeId;
    if (filters.authorId !== undefined) params.authorId = filters.authorId;
    if (filters.tag !== undefined) params.tag = filters.tag;
    if (filters.tagId !== undefined) params.tagId = filters.tagId;
    if (filters.search) params.search = filters.search;
    if (filters.statusId !== undefined) params.statusId = filters.statusId;
    if (filters.typeId !== undefined) params.typeId = filters.typeId;
    if (filters.priorityId !== undefined) params.priorityId = filters.priorityId;
    if (filters.parentId !== undefined) params.parentId = filters.parentId;
    if (filters.limit !== undefined) params.limit = filters.limit;
    if (filters.take !== undefined) params.take = filters.take;
    if (filters.skip !== undefined) params.skip = filters.skip;
    if (filters.offset !== undefined) params.offset = filters.offset;
    if (filters.sortBy) params.sortBy = filters.sortBy;
    if (filters.order) params.order = filters.order;
    if (filters.sortOrder) params.sortOrder = filters.sortOrder;
    if (filters.all) params.all = 'true';
  }

  const res = await apiClient.get('/issues', { params });
  return Array.isArray(res.data) ? res.data : (res.data.issues || res.data.items || []);
};

export const getIssue = async (id: number): Promise<Issue> => {
  const res = await apiClient.get(`/issues/${id}`);
  return res.data;
};

export const createIssue = async (data: {
  title: string;
  description?: string;
  projectId: number;
  sprintId?: number;
  parentId?: number | null;
  assigneeId?: number;
  priorityId?: number;
  statusId?: number;
  typeId?: number;
  plannedStartDate?: string | null;
  dueDate?: string | null;
  actualStartDate?: string | null;
  actualEndDate?: string | null;
  tags?: string[] | any;
  customFields?: any;
}): Promise<Issue> => {
  const res = await apiClient.post('/issues', data);
  return res.data;
};

export const updateIssue = async (id: number, data: Partial<Issue> | any): Promise<Issue> => {
  const res = await apiClient.put(`/issues/${id}`, data);
  return res.data;
};

export interface BatchScheduleItem {
  id: number;
  plannedStartDate?: string | null;
  dueDate?: string | null;
}

export const batchUpdateIssueSchedules = async (
  items: BatchScheduleItem[]
): Promise<{ updatedCount: number; issues: Issue[] }> => {
  const res = await apiClient.put('/issues/batch-schedules', { items });
  return res.data;
};

export const deleteIssue = async (id: number): Promise<void> => {
  await apiClient.delete(`/issues/${id}`);
};

export const toggleLikeIssue = async (issueId: number): Promise<{ message: string; isLiked: boolean; likesCount: number }> => {
  const res = await apiClient.post('/issues/toggle-like', { issueId });
  return res.data;
};

// ----------------------------------------------------
// 2. Query Keys
// ----------------------------------------------------
export const issueKeys = {
  all: ['issues'] as const,
  lists: () => [...issueKeys.all, 'list'] as const,
  list: (filters?: IssueQueryParams) => [...issueKeys.lists(), filters ?? {}] as const,
  details: () => [...issueKeys.all, 'detail'] as const,
  detail: (id: number) => [...issueKeys.details(), id] as const,
};

// ----------------------------------------------------
// 3. TanStack Query & Mutation Hooks
// ----------------------------------------------------
export const useIssues = (filters?: IssueQueryParams, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: issueKeys.list(filters),
    queryFn: () => getIssues(filters),
    placeholderData: keepPreviousData,
    enabled: options?.enabled ?? true,
  });
};

export const useIssue = (issueId?: number | null) => {
  return useQuery({
    queryKey: issueId ? issueKeys.detail(issueId) : ['issues', 'detail', null],
    queryFn: () => getIssue(issueId!),
    enabled: !!issueId && !isNaN(issueId),
  });
};

/**
 * React Suspense 지원 이슈 목록 쿼리 Hook
 */
export const useSuspenseIssues = (filters?: IssueQueryParams) => {
  return useSuspenseQuery({
    queryKey: issueKeys.list(filters),
    queryFn: () => getIssues(filters),
  });
};

/**
 * React Suspense 지원 단일 이슈 상세 쿼리 Hook
 */
export const useSuspenseIssue = (issueId: number) => {
  return useSuspenseQuery({
    queryKey: issueKeys.detail(issueId),
    queryFn: () => getIssue(issueId),
  });
};

export const useCreateIssue = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createIssue,
    onSuccess: (newIssue) => {
      queryClient.setQueriesData<Issue[]>({ queryKey: issueKeys.lists() }, (oldData) => {
        if (!Array.isArray(oldData)) return oldData;
        return [newIssue, ...oldData];
      });
      queryClient.invalidateQueries({ queryKey: issueKeys.all });
    },
  });
};

export const useUpdateIssue = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Issue> }) => updateIssue(id, data),
    onSuccess: (updatedIssue, variables) => {
      // 1. 이슈 목록 캐시에서 해당 이슈 즉시 in-place 업데이트
      queryClient.setQueriesData<Issue[]>({ queryKey: issueKeys.lists() }, (oldData) => {
        if (!Array.isArray(oldData)) return oldData;
        return oldData.map((item) => (item.id === updatedIssue.id ? { ...item, ...updatedIssue } : item));
      });
      // 2. 단일 이슈 상세 캐시 즉시 업데이트
      queryClient.setQueryData(issueKeys.detail(variables.id), updatedIssue);
      // 3. 백그라운드 동기화 (화면 깜빡임 없이 부드럽게)
      queryClient.invalidateQueries({ queryKey: issueKeys.all, refetchType: 'none' });
    },
  });
};

export const useDeleteIssue = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteIssue,
    onSuccess: (_, deletedId) => {
      queryClient.setQueriesData<Issue[]>({ queryKey: issueKeys.lists() }, (oldData) => {
        if (!Array.isArray(oldData)) return oldData;
        return oldData.filter((item) => item.id !== deletedId);
      });
      queryClient.invalidateQueries({ queryKey: issueKeys.all, refetchType: 'none' });
    },
  });
};

export const useToggleLikeIssue = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: toggleLikeIssue,
    onSuccess: (result, issueId) => {
      queryClient.setQueriesData<Issue[]>({ queryKey: issueKeys.lists() }, (oldData) => {
        if (!Array.isArray(oldData)) return oldData;
        return oldData.map((item) =>
          item.id === issueId
            ? { ...item, isLiked: result.isLiked, likesCount: result.likesCount }
            : item
        );
      });
      queryClient.invalidateQueries({ queryKey: issueKeys.detail(issueId), refetchType: 'none' });
    },
  });
};
