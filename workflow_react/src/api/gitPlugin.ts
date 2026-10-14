import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';

export interface GitPluginConfig {
  id: number;
  workspaceId: number;
  isEnabled: boolean;
  provider: 'GITHUB' | 'GITLAB';
  serverUrl?: string;
  hasToken: boolean;
  maskedToken: string;
  autoCloseIssueOnMerge: boolean;
  webhookSecret?: string;
  webhookUrl: string;
}

export interface GitRepoMapping {
  id: number;
  projectId: number;
  projectName: string;
  projectKey: string;
  repoIdentifier: string;
  defaultBranch: string;
  isActive: boolean;
  prCount?: number;
  commitCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface GitPullRequestItem {
  id?: number;
  prNumber: number;
  title: string;
  sourceBranch: string;
  targetBranch: string;
  state: 'OPEN' | 'MERGED' | 'CLOSED';
  authorName: string;
  url: string;
  ciStatus?: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED' | null;
  createdAt: string;
  updatedAt: string;
}

export interface GitCommitItem {
  id: number;
  commitHash: string;
  message: string;
  authorName: string;
  authorEmail?: string | null;
  committedAt: string;
  createdAt: string;
}

export interface IssueGitData {
  issueId: number;
  issueNumber: number;
  issueTitle: string;
  projectKey: string;
  availableRepositories: Array<{
    id: number;
    repoIdentifier: string;
    defaultBranch: string;
  }>;
  pullRequests: GitPullRequestItem[];
  commits: GitCommitItem[];
}

export interface GitPipelineItem {
  id: string | number;
  status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'UNKNOWN';
  branch: string;
  commitHash: string;
  url: string;
  createdAt: string;
}

export const gitPluginKeys = {
  all: ['git-plugin'] as const,
  config: () => [...gitPluginKeys.all, 'config'] as const,
  mappings: (projectId?: number) => [...gitPluginKeys.all, 'mappings', projectId ?? 'all'] as const,
  issueData: (issueId: number) => [...gitPluginKeys.all, 'issue', issueId] as const,
  pipelines: (mappingId: number) => [...gitPluginKeys.all, 'pipelines', mappingId] as const,
};

// 1. 설정 조회
export const fetchGitConfig = async (): Promise<GitPluginConfig> => {
  const { data } = await apiClient.get('/plugins/git/config');
  return data.config;
};

export const useGitConfig = () => {
  return useQuery({
    queryKey: gitPluginKeys.config(),
    queryFn: fetchGitConfig,
  });
};

// 2. 설정 저장
export const updateGitConfig = async (payload: Partial<GitPluginConfig> & { token?: string }): Promise<GitPluginConfig> => {
  const { data } = await apiClient.post('/plugins/git/config', payload);
  return data.config;
};

export const useUpdateGitConfig = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateGitConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gitPluginKeys.all });
    },
  });
};

// 3. 연결 테스트
export const testGitConnection = async (payload: { provider: string; token: string; serverUrl?: string }) => {
  const { data } = await apiClient.post('/plugins/git/test-connection', payload);
  return data;
};

export const useTestGitConnection = () => {
  return useMutation({
    mutationFn: testGitConnection,
  });
};

// 4. 저장소 매핑 목록
export const fetchRepoMappings = async (projectId?: number): Promise<GitRepoMapping[]> => {
  const params = projectId ? { projectId } : undefined;
  const { data } = await apiClient.get('/plugins/git/mappings', { params });
  return data.mappings || [];
};

export const useRepoMappings = (projectId?: number) => {
  return useQuery({
    queryKey: gitPluginKeys.mappings(projectId),
    queryFn: () => fetchRepoMappings(projectId),
  });
};

// 5. 저장소 매핑 추가
export const createRepoMapping = async (payload: { projectId: number; repoIdentifier: string; defaultBranch?: string }): Promise<GitRepoMapping> => {
  const { data } = await apiClient.post('/plugins/git/mappings', payload);
  return data.mapping;
};

export const useCreateRepoMapping = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createRepoMapping,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gitPluginKeys.mappings() });
    },
  });
};

// 6. 저장소 매핑 삭제
export const deleteRepoMapping = async (mappingId: number): Promise<{ success: boolean; message: string }> => {
  const { data } = await apiClient.delete(`/plugins/git/mappings/${mappingId}`);
  return data;
};

export const useDeleteRepoMapping = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteRepoMapping,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gitPluginKeys.mappings() });
    },
  });
};

// 7. 일감 상세 연동 Git 데이터 조회
export const fetchIssueGitData = async (issueId: number): Promise<IssueGitData> => {
  const { data } = await apiClient.get(`/plugins/git/issues/${issueId}`);
  return data.data;
};

export const useIssueGitData = (issueId: number, enabled: boolean = true) => {
  return useQuery({
    queryKey: gitPluginKeys.issueData(issueId),
    queryFn: () => fetchIssueGitData(issueId),
    enabled: enabled && issueId > 0,
  });
};

// 8. 브랜치 생성
export const createBranch = async (payload: { repoMappingId: number; branchName: string; refBranch?: string }) => {
  const { data } = await apiClient.post('/plugins/git/branches', payload);
  return data.result;
};

export const useCreateBranch = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createBranch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gitPluginKeys.all });
    },
  });
};

// 9. PR 생성
export const createPullRequest = async (payload: {
  repoMappingId: number;
  issueId?: number;
  title: string;
  body: string;
  head: string;
  base: string;
}): Promise<GitPullRequestItem> => {
  const { data } = await apiClient.post('/plugins/git/pull-requests', payload);
  return data.pr;
};

export const useCreatePullRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPullRequest,
    onSuccess: (_, variables) => {
      if (variables.issueId) {
        queryClient.invalidateQueries({ queryKey: gitPluginKeys.issueData(variables.issueId) });
      }
    },
  });
};

// 10. 파이프라인 목록
export const fetchPipelines = async (repoMappingId: number): Promise<GitPipelineItem[]> => {
  const { data } = await apiClient.get(`/plugins/git/pipelines/${repoMappingId}`);
  return data.pipelines || [];
};

export const usePipelines = (repoMappingId: number, enabled: boolean = true) => {
  return useQuery({
    queryKey: gitPluginKeys.pipelines(repoMappingId),
    queryFn: () => fetchPipelines(repoMappingId),
    enabled: enabled && repoMappingId > 0,
  });
};
