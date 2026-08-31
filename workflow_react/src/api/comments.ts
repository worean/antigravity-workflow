import { useQuery, useSuspenseQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import type { Comment } from '@/types';
import { issueKeys } from './issues';

export interface CommentQueryParams {
  page?: number;
  limit?: number;
  pageSize?: number;
  skip?: number;
  offset?: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
  sortOrder?: 'asc' | 'desc';
  all?: boolean;
}

// ----------------------------------------------------
// 1. Raw API Functions
// ----------------------------------------------------
export const getComments = async (issueId: number, filters?: CommentQueryParams): Promise<Comment[]> => {
  const params: any = {};
  if (filters) {
    if (filters.page !== undefined) params.page = filters.page;
    if (filters.limit !== undefined) params.limit = filters.limit;
    if (filters.pageSize !== undefined) params.pageSize = filters.pageSize;
    if (filters.skip !== undefined) params.skip = filters.skip;
    if (filters.offset !== undefined) params.offset = filters.offset;
    if (filters.sortBy) params.sortBy = filters.sortBy;
    if (filters.order) params.order = filters.order;
    if (filters.sortOrder) params.sortOrder = filters.sortOrder;
    if (filters.all) params.all = 'true';
  }

  const res = await apiClient.get(`/comments/issue/${issueId}`, { params });
  return Array.isArray(res.data) ? res.data : (res.data.comments || res.data.items || []);
};

export const createComment = async (issueId: number, content: string, parentId?: number): Promise<Comment> => {
  const res = await apiClient.post('/comments', { issueId, content, parentId });
  return res.data;
};

export const deleteComment = async (id: number): Promise<void> => {
  await apiClient.delete(`/comments/${id}`);
};

export const addCommentReaction = async (commentId: number, emoji: string) => {
  const res = await apiClient.post(`/comments/${commentId}/reactions`, { emoji });
  return res.data;
};

// ----------------------------------------------------
// 2. Query Keys
// ----------------------------------------------------
export const commentKeys = {
  all: ['comments'] as const,
  lists: () => [...commentKeys.all, 'list'] as const,
  list: (issueId: number, filters?: CommentQueryParams) => [...commentKeys.lists(), issueId, filters ?? {}] as const,
};

// ----------------------------------------------------
// 3. TanStack Query & Mutation Hooks
// ----------------------------------------------------
export const useComments = (
  issueId?: number | null,
  filters?: CommentQueryParams,
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: issueId ? commentKeys.list(issueId, filters) : ['comments', 'list', null],
    queryFn: () => getComments(issueId!, filters),
    placeholderData: keepPreviousData,
    enabled: !!issueId && !isNaN(issueId) && (options?.enabled ?? true),
  });
};

/**
 * React Suspense 지원 특정 이슈의 댓글 목록 쿼리 Hook
 */
export const useSuspenseComments = (issueId: number, filters?: CommentQueryParams) => {
  return useSuspenseQuery({
    queryKey: commentKeys.list(issueId, filters),
    queryFn: () => getComments(issueId, filters),
  });
};

export const useCreateComment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ issueId, content, parentId }: { issueId: number; content: string; parentId?: number }) =>
      createComment(issueId, content, parentId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: commentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: issueKeys.detail(variables.issueId) });
      queryClient.invalidateQueries({ queryKey: issueKeys.all });
    },
  });
};

export const useDeleteComment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (commentId: number) => deleteComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: issueKeys.all });
    },
  });
};

export const useAddCommentReaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ commentId, emoji }: { commentId: number; emoji: string }) =>
      addCommentReaction(commentId, emoji),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commentKeys.lists() });
    },
  });
};
