import { useQuery, useSuspenseQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/apiClient';
import type { User } from '../types';

// ----------------------------------------------------
// 1. Raw API Functions
// ----------------------------------------------------
export const loginEmail = async (email: string, password?: string) => {
  const res = await apiClient.post('/auth/login', { email, password });
  return res.data;
};

export const registerUser = async (email: string, name: string, password?: string) => {
  const res = await apiClient.post('/users', { email, name, password });
  return res.data;
};

export const getMe = async (): Promise<{ user: User }> => {
  const res = await apiClient.get('/auth/me');
  return res.data;
};

export const getUsers = async (): Promise<User[]> => {
  const res = await apiClient.get('/users');
  return Array.isArray(res.data) ? res.data : (res.data.users || []);
};

export const updateUser = async (id: number, data: Partial<User>): Promise<User> => {
  const res = await apiClient.put(`/users/${id}`, data);
  return res.data;
};

export const deleteUser = async (id: number): Promise<void> => {
  await apiClient.delete(`/users/${id}`);
};

// ----------------------------------------------------
// 2. Query Keys
// ----------------------------------------------------
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  me: () => [...userKeys.all, 'me'] as const,
};

// ----------------------------------------------------
// 3. TanStack Query & Mutation Hooks
// ----------------------------------------------------
export const useUsers = () => {
  return useQuery({
    queryKey: userKeys.lists(),
    queryFn: () => getUsers(),
    staleTime: 1000 * 60 * 5,
  });
};

export const useSuspenseUsers = () => {
  return useSuspenseQuery({
    queryKey: userKeys.lists(),
    queryFn: () => getUsers(),
    staleTime: 1000 * 60 * 5,
  });
};

export const useMe = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: userKeys.me(),
    queryFn: () => getMe(),
    enabled: options?.enabled ?? true,
  });
};

export const useSuspenseMe = () => {
  return useSuspenseQuery({
    queryKey: userKeys.me(),
    queryFn: () => getMe(),
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<User> }) => updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });
};
