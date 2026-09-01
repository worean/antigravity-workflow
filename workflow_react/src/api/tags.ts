// -*- coding: utf-8 -*-
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import type { Tag } from '@/types';

export interface TagQueryParams {
  search?: string;
  limit?: number;
  sortBy?: 'count' | 'name' | 'recent';
}

export const getTags = async (params?: TagQueryParams): Promise<Tag[]> => {
  const res = await apiClient.get('/tags', { params });
  return Array.isArray(res.data) ? res.data : [];
};

export const createTag = async (data: { name: string; color?: string }): Promise<Tag> => {
  const res = await apiClient.post('/tags', data);
  return res.data;
};

export const deleteTag = async (id: number): Promise<{ message: string }> => {
  const res = await apiClient.delete(`/tags/${id}`);
  return res.data;
};

export const tagKeys = {
  all: ['tags'] as const,
  lists: () => [...tagKeys.all, 'list'] as const,
  list: (params?: TagQueryParams) => [...tagKeys.lists(), params ?? {}] as const,
};

export const useTags = (params?: TagQueryParams, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: tagKeys.list(params),
    queryFn: () => getTags(params),
    enabled: options?.enabled ?? true,
    staleTime: 1000 * 60 * 3, // 3분 캐싱
  });
};

export const useCreateTag = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTag,
    onSuccess: (newTag) => {
      queryClient.setQueriesData<Tag[]>({ queryKey: tagKeys.lists() }, (oldData) => {
        if (!Array.isArray(oldData)) return [newTag];
        return [newTag, ...oldData.filter((t) => t.id !== newTag.id)];
      });
      queryClient.invalidateQueries({ queryKey: tagKeys.all });
    },
  });
};

export const useDeleteTag = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTag,
    onSuccess: (_, deletedId) => {
      queryClient.setQueriesData<Tag[]>({ queryKey: tagKeys.lists() }, (oldData) => {
        if (!Array.isArray(oldData)) return [];
        return oldData.filter((t) => t.id !== deletedId);
      });
      queryClient.invalidateQueries({ queryKey: tagKeys.all });
    },
  });
};
