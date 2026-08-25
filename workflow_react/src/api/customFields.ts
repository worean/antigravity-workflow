import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/apiClient';
import type { CustomFieldDefinition } from '../types';

export const getCustomFields = async (): Promise<CustomFieldDefinition[]> => {
  const res = await apiClient.get('/custom-fields');
  return Array.isArray(res.data) ? res.data : [];
};

export const createCustomField = async (data: {
  key: string;
  name: string;
  fieldType: string;
  description?: string;
  defaultValue?: string;
  isRequired?: boolean;
  projectId?: number;
}): Promise<CustomFieldDefinition> => {
  const res = await apiClient.post('/custom-fields', data);
  return res.data;
};

export const deleteCustomField = async (id: number): Promise<void> => {
  await apiClient.delete(`/custom-fields/${id}`);
};

export const customFieldKeys = {
  all: ['customFields'] as const,
};

export const useCustomFields = () => {
  return useQuery({
    queryKey: customFieldKeys.all,
    queryFn: getCustomFields,
  });
};

export const useCreateCustomField = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCustomField,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customFieldKeys.all });
    },
  });
};

export const useDeleteCustomField = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteCustomField,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customFieldKeys.all });
    },
  });
};
