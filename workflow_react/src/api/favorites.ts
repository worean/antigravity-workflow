import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import type { Favorite } from '@/types';
import { projectKeys } from './projects';
import { issueKeys } from './issues';

export const favoriteKeys = {
  all: ['favorites'] as const,
  lists: () => [...favoriteKeys.all, 'list'] as const,
  list: (targetType?: string) => [...favoriteKeys.lists(), { targetType }] as const,
};

// ----------------------------------------------------
// 1. Raw API Functions
// ----------------------------------------------------
export const getFavorites = async (targetType?: string): Promise<Favorite[]> => {
  const params: any = {};
  if (targetType) params.targetType = targetType;
  const res = await apiClient.get('/favorites', { params });
  return Array.isArray(res.data) ? res.data : [];
};

export const toggleFavorite = async (data: {
  targetType: 'PROJECT' | 'ISSUE' | 'SPRINT' | 'CHAT_CHANNEL';
  targetId: number;
}): Promise<{ isFavorite: boolean; targetType: string; targetId: number }> => {
  const res = await apiClient.post('/favorites/toggle', data);
  return res.data;
};

// ----------------------------------------------------
// 2. Custom Hooks
// ----------------------------------------------------
export const useFavorites = (targetType?: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: favoriteKeys.list(targetType),
    queryFn: () => getFavorites(targetType),
    staleTime: 1000 * 30, // 30초 캐시
    enabled: options?.enabled ?? true,
  });
};

export const useToggleFavorite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: toggleFavorite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: favoriteKeys.all });
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      queryClient.invalidateQueries({ queryKey: issueKeys.all });
      queryClient.invalidateQueries({ queryKey: ['chat', 'channels'] });
      queryClient.invalidateQueries({ queryKey: ['sprints'] });
    },
  });
};