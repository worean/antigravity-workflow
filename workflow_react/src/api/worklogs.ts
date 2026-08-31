import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import type { Worklog } from '@/types';

export const getWorklogs = async (issueId?: number): Promise<Worklog[]> => {
  const url = issueId ? `/worklogs?issueId=${issueId}` : '/worklogs';
  const res = await apiClient.get(url);
  return Array.isArray(res.data) ? res.data : (res.data.worklogs || []);
};

export const createWorklog = async (data: {
  issueId: number;
  timeSpent?: number;
  timeSpentHours?: number;
  description?: string;
  startedAt?: string;
}): Promise<Worklog> => {
  const res = await apiClient.post('/worklogs', data);
  return res.data;
};

export const worklogKeys = {
  all: ['worklogs'] as const,
  list: (issueId?: number) => [...worklogKeys.all, 'list', issueId] as const,
};

export const useWorklogs = (issueId?: number) => {
  return useQuery({
    queryKey: worklogKeys.list(issueId),
    queryFn: () => getWorklogs(issueId),
  });
};

export const useCreateWorklog = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createWorklog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: worklogKeys.all });
    },
  });
};
