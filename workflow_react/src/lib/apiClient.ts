import axios from 'axios';
import type { HealthStatus } from '../types';

/**
 * 백엔드 Base URL 정규화 헬퍼 (프로토콜 보정 및 끝 슬래시/api 정리)
 */
export const normalizeBackendUrl = (rawUrl: string): string => {
  let url = rawUrl.trim();
  if (!url) return '';
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }
  url = url.replace(/\/api\/?$/i, '').replace(/\/+$/, '');
  return url;
};

/**
 * 현재 설정된 순수 백엔드 호스트 URL (UI 입력/표시용)
 */
export const getCurrentBackendHostUrl = (): string => {
  if (typeof window !== 'undefined') {
    const customUrl = localStorage.getItem('pref_backend_api_url');
    if (customUrl) return normalizeBackendUrl(customUrl);

    if (window.electronAPI?.isElectron || window.location.protocol === 'file:') {
      return normalizeBackendUrl(import.meta.env.VITE_API_URL || 'https://localhost:4000');
    }
  }
  return normalizeBackendUrl(import.meta.env.VITE_API_URL || window.location.origin);
};

/**
 * Axios 통신용 최종 API Base URL 반환 (항상 /api 접미사 포함)
 */
export const getApiBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    const customUrl = localStorage.getItem('pref_backend_api_url');
    if (customUrl) return normalizeBackendUrl(customUrl) + '/api';

    if (window.electronAPI?.isElectron || window.location.protocol === 'file:') {
      return normalizeBackendUrl(import.meta.env.VITE_API_URL || 'https://localhost:4000') + '/api';
    }
  }
  return import.meta.env.VITE_API_URL ? `${normalizeBackendUrl(import.meta.env.VITE_API_URL)}/api` : '/api';
};

/**
 * 커스텀 백엔드 API URL 저장
 */
export const saveCustomBackendUrl = async (rawUrl: string): Promise<string> => {
  const cleanedUrl = normalizeBackendUrl(rawUrl);
  if (!cleanedUrl) throw new Error('유효한 서버 URL을 입력해 주세요.');

  if (typeof window !== 'undefined') {
    localStorage.setItem('pref_backend_api_url', cleanedUrl);
    if (window.electronAPI?.setBackendConfig) {
      await window.electronAPI.setBackendConfig({ backendApiUrl: cleanedUrl });
    }
  }
  apiClient.defaults.baseURL = getApiBaseUrl();
  return cleanedUrl;
};

/**
 * 기본 백엔드 API URL로 초기화
 */
export const resetCustomBackendUrl = async (): Promise<void> => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('pref_backend_api_url');
    if (window.electronAPI?.setBackendConfig) {
      await window.electronAPI.setBackendConfig({ backendApiUrl: '' });
    }
  }
  apiClient.defaults.baseURL = getApiBaseUrl();
};

/**
 * 특정 서버 URL 대상 실시간 연결 테스트 (Health Check & 핑 측정)
 */
export const testApiConnection = async (
  targetHostUrl?: string
): Promise<{ success: boolean; status?: string; latencyMs: number; error?: string; timestamp?: string }> => {
  const host = targetHostUrl ? normalizeBackendUrl(targetHostUrl) : getCurrentBackendHostUrl();
  const testBaseUrl = `${host}/api`;
  const startTime = Date.now();

  try {
    const testAxios = axios.create({
      baseURL: testBaseUrl,
      timeout: 5000,
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await testAxios.get<HealthStatus>('/health');
    const latencyMs = Date.now() - startTime;
    return {
      success: true,
      status: res.data?.status || 'OK',
      latencyMs,
      timestamp: (res.data as any)?.timestamp || new Date().toISOString(),
    };
  } catch (err: any) {
    const latencyMs = Date.now() - startTime;
    let errorMessage = '서버에 연결할 수 없습니다.';
    if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
      errorMessage = '연결 시간 초과 (Timeout, 5초)';
    } else if (err.response) {
      errorMessage = `서버 오류 응답 (HTTP ${err.response.status})`;
    } else if (err.message) {
      errorMessage = err.message;
    }
    return {
      success: false,
      latencyMs,
      error: errorMessage,
    };
  }
};

/**
 * 앱 시작 시 Electron 영속 설정 로드 및 동기화
 */
if (typeof window !== 'undefined' && window.electronAPI?.getBackendConfig) {
  window.electronAPI.getBackendConfig().then((config) => {
    if (config?.backendApiUrl && !localStorage.getItem('pref_backend_api_url')) {
      localStorage.setItem('pref_backend_api_url', config.backendApiUrl);
      apiClient.defaults.baseURL = getApiBaseUrl();
    }
  }).catch(() => {});
}

export const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  config.baseURL = getApiBaseUrl();
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const checkHealth = async (): Promise<HealthStatus> => {
  const res = await apiClient.get<HealthStatus>('/health');
  return res.data;
};

export default apiClient;
