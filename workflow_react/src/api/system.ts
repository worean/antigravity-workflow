import { apiClient } from '@/lib/apiClient';

export interface SystemHealthResponse {
  status: 'HEALTHY' | 'DEGRADED' | 'DOWN';
  uptimeSeconds: number;
  memoryUsageMb: number;
  database: {
    globalDb: { status: 'CONNECTED' | 'ERROR'; userCount?: number };
    workspaceDb: { status: 'CONNECTED' | 'ERROR'; projectCount?: number };
  };
  timestamp: string;
}

export interface SystemVersionResponse {
  name: string;
  version: string;
  nodeVersion: string;
  environment: string;
  timestamp: string;
}

export const systemKeys = {
  all: ['system'] as const,
  health: () => [...systemKeys.all, 'health'] as const,
  version: () => [...systemKeys.all, 'version'] as const,
};

export const getSystemHealth = async (): Promise<SystemHealthResponse> => {
  const { data } = await apiClient.get<SystemHealthResponse>('/system/health');
  return data;
};

export const getSystemVersion = async (): Promise<SystemVersionResponse> => {
  const { data } = await apiClient.get<SystemVersionResponse>('/system/version');
  return data;
};
