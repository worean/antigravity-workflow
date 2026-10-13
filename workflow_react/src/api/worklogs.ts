import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import type { Worklog } from '@/types';

export interface WorklogQueryParams {
  issueId?: number;
  projectId?: number;
  userId?: number;
  limit?: number;
  offset?: number;
}

export const getWorklogs = async (
  paramsOrIssueId?: number | WorklogQueryParams
): Promise<Worklog[]> => {
  let params: any = {};
  if (typeof paramsOrIssueId === 'number') {
    params.issueId = paramsOrIssueId;
  } else if (paramsOrIssueId) {
    params = { ...paramsOrIssueId };
  }

  const res = await apiClient.get('/worklogs', { params });
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
  list: (params?: number | WorklogQueryParams) => [...worklogKeys.all, 'list', params] as const,
};

export const useWorklogs = (params?: number | WorklogQueryParams) => {
  return useQuery({
    queryKey: worklogKeys.list(params),
    queryFn: () => getWorklogs(params),
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
