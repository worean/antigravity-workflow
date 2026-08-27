import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/apiClient';
import type { Sprint } from '../types';
import { issueKeys } from './issues';

export const getSprints = async (projectId?: number): Promise<Sprint[]> => {
  const res = await apiClient.get('/sprints', { params: projectId ? { projectId } : {} });
  return Array.isArray(res.data) ? res.data : (res.data.sprints || []);
};

export const getSprint = async (id: number): Promise<Sprint> => {
  const res = await apiClient.get(`/sprints/${id}`);
  return res.data;
};

export const createSprint = async (data: {
  name: string;
  goal?: string;
  projectId: number;
  startDate?: string;
  endDate?: string;
  status?: string;
  issueIds?: number[];
  autoCalculateDates?: boolean;
}): Promise<Sprint> => {
  const res = await apiClient.post('/sprints', data);
  return res.data;
};

export const updateSprint = async (
  id: number,
  data: {
    name?: string;
    goal?: string;
    status?: string;
    startDate?: string | null;
    endDate?: string | null;
    autoCalculateDates?: boolean;
  }
): Promise<Sprint> => {
  const res = await apiClient.put(`/sprints/${id}`, data);
  return res.data;
};

export const deleteSprint = async (id: number): Promise<{ message: string }> => {
  const res = await apiClient.delete(`/sprints/${id}`);
  return res.data;
};

export const assignIssuesToSprint = async (
  sprintId: number,
  data: {
    issueIds?: number[];
    addIssueIds?: number[];
    removeIssueIds?: number[];
    autoCalculateDates?: boolean;
  }
): Promise<Sprint> => {
  const res = await apiClient.post(`/sprints/${sprintId}/issues`, data);
  return res.data;
};

export const sprintKeys = {
  all: ['sprints'] as const,
  list: (projectId?: number) => [...sprintKeys.all, 'list', projectId] as const,
  detail: (id: number) => [...sprintKeys.all, 'detail', id] as const,
};

export const useSprints = (projectId?: number) => {
  return useQuery({
    queryKey: sprintKeys.list(projectId),
    queryFn: () => getSprints(projectId),
  });
};

export const useCreateSprint = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSprint,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sprintKeys.all });
      queryClient.invalidateQueries({ queryKey: issueKeys.all });
    },
  });
};
