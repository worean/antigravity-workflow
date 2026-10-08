import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import type {
  MemoDto,
  MemoFilterType,
  CreateMemoPayload,
  UpdateMemoPayload,
  UploadMemoAttachmentPayload,
  MemoAttachmentDto,
} from '@/types/memo';

export interface MemoQueryParams {
  search?: string;
  filter?: MemoFilterType;
  workspaceId?: number;
}

export const getMemos = async (params?: MemoQueryParams): Promise<MemoDto[]> => {
  const res = await apiClient.get('/memos', { params });
  return Array.isArray(res.data) ? res.data : [];
};

export const getMemo = async (id: number, workspaceId?: number): Promise<MemoDto> => {
  const res = await apiClient.get(`/memos/${id}`, { params: { workspaceId } });
  return res.data;
};

export const getMemoByTitle = async (title: string, workspaceId?: number): Promise<MemoDto> => {
  const res = await apiClient.get(`/memos/by-title/${encodeURIComponent(title)}`, { params: { workspaceId } });
  return res.data;
};

export const createMemo = async (data: CreateMemoPayload): Promise<MemoDto> => {
  const res = await apiClient.post('/memos', data);
  return res.data;
};

export const updateMemo = async ({ id, data }: { id: number; data: UpdateMemoPayload }): Promise<MemoDto> => {
  const res = await apiClient.put(`/memos/${id}`, data);
  return res.data;
};

export const deleteMemo = async (id: number): Promise<{ success: boolean; deletedId: number }> => {
  const res = await apiClient.delete(`/memos/${id}`);
  return res.data;
};

export const uploadMemoAttachment = async ({
  memoId,
  data,
}: {
  memoId: number;
  data: UploadMemoAttachmentPayload;
}): Promise<MemoAttachmentDto> => {
  const res = await apiClient.post(`/memos/${memoId}/attachments`, data);
  return res.data;
};

export const deleteMemoAttachment = async ({
  memoId,
  attachmentId,
}: {
  memoId: number;
  attachmentId: number;
}): Promise<{ success: boolean; deletedAttachmentId: number }> => {
  const res = await apiClient.delete(`/memos/${memoId}/attachments/${attachmentId}`);
  return res.data;
};

export const memoKeys = {
  all: ['memos'] as const,
  lists: () => [...memoKeys.all, 'list'] as const,
  list: (params?: MemoQueryParams) => [...memoKeys.lists(), params ?? {}] as const,
  details: () => [...memoKeys.all, 'detail'] as const,
  detail: (id: number) => [...memoKeys.details(), id] as const,
  byTitle: (title: string) => [...memoKeys.all, 'byTitle', title] as const,
};

export const useMemos = (params?: MemoQueryParams, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: memoKeys.list(params),
    queryFn: () => getMemos(params),
    enabled: options?.enabled ?? true,
    staleTime: 1000 * 30, // 30초 캐싱
  });
};

export const useMemo = (id: number | null, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: memoKeys.detail(id ?? 0),
    queryFn: () => getMemo(id!),
    enabled: Boolean(id) && (options?.enabled ?? true),
  });
};

export const useMemoByTitle = (title: string | null, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: memoKeys.byTitle(title ?? ''),
    queryFn: () => getMemoByTitle(title!),
    enabled: Boolean(title && title.trim()) && (options?.enabled ?? true),
    retry: 1,
  });
};

export const useCreateMemo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createMemo,
    onSuccess: (newMemo) => {
      queryClient.setQueriesData<MemoDto[]>({ queryKey: memoKeys.lists() }, (oldData) => {
        if (!Array.isArray(oldData)) return [newMemo];
        return [newMemo, ...oldData.filter((m) => m.id !== newMemo.id)];
      });
      queryClient.invalidateQueries({ queryKey: memoKeys.all });
    },
  });
};

export const useUpdateMemo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateMemo,
    onSuccess: (updatedMemo) => {
      queryClient.setQueriesData<MemoDto[]>({ queryKey: memoKeys.lists() }, (oldData) => {
        if (!Array.isArray(oldData)) return [updatedMemo];
        return oldData.map((m) => (m.id === updatedMemo.id ? updatedMemo : m));
      });
      queryClient.setQueryData(memoKeys.detail(updatedMemo.id), updatedMemo);
      queryClient.invalidateQueries({ queryKey: memoKeys.all });
    },
  });
};

export const useDeleteMemo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteMemo,
    onSuccess: (_, deletedId) => {
      queryClient.setQueriesData<MemoDto[]>({ queryKey: memoKeys.lists() }, (oldData) => {
        if (!Array.isArray(oldData)) return [];
        return oldData.filter((m) => m.id !== deletedId);
      });
      queryClient.removeQueries({ queryKey: memoKeys.detail(deletedId) });
      queryClient.invalidateQueries({ queryKey: memoKeys.all });
    },
  });
};

export const useUploadMemoAttachment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: uploadMemoAttachment,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: memoKeys.detail(variables.memoId) });
      queryClient.invalidateQueries({ queryKey: memoKeys.lists() });
    },
  });
};

export const useDeleteMemoAttachment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteMemoAttachment,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: memoKeys.detail(variables.memoId) });
      queryClient.invalidateQueries({ queryKey: memoKeys.lists() });
    },
  });
};
