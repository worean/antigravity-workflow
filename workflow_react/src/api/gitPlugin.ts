import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';

import type { GitPluginConfig, GitRepoMapping, GitPullRequestItem, GitCommitItem, GitCommitDetail, IssueGitData, GitPipelineItem, GitRemoteRepoItem } from './gitPlugin.types';
export * from './gitPlugin.types';

export const gitPluginKeys = {
  all: ['git-plugin'] as const,
  config: () => [...gitPluginKeys.all, 'config'] as const,
  mappings: (projectId?: number) => [...gitPluginKeys.all, 'mappings', projectId ?? 'all'] as const,
  issueData: (issueId: number) => [...gitPluginKeys.all, 'issue', issueId] as const,
  pipelines: (mappingId: number) => [...gitPluginKeys.all, 'pipelines', mappingId] as const,
  remoteRepos: (projectId?: number) => [...gitPluginKeys.all, 'remote-repos', projectId ?? 'all'] as const,
  repoCommits: (repoMappingId: number, branch?: string) => [...gitPluginKeys.all, 'commits', repoMappingId, branch || 'default'] as const,
  commitDetail: (repoMappingId: number, sha: string) => [...gitPluginKeys.all, 'commit-detail', repoMappingId, sha] as const,
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

// 11. 원격 Git 계정(GitHub/GitLab)의 전체 리포지토리 목록 조회
export const fetchRemoteRepositories = async (projectId?: number): Promise<GitRemoteRepoItem[]> => {
  const url = projectId ? `/plugins/git/remote-repos?projectId=${projectId}` : '/plugins/git/remote-repos';
  const { data } = await apiClient.get(url);
  return data.repositories || [];
};

export const useRemoteRepositories = (projectId?: number, enabled: boolean = true) => {
  return useQuery({
    queryKey: gitPluginKeys.remoteRepos(projectId),
    queryFn: () => fetchRemoteRepositories(projectId),
    enabled,
    staleTime: 1000 * 60 * 2, // 2분 캐시
  });
};

// 12. 저장소 커밋 로그 목록 조회
export const fetchRepoCommits = async (
  repoMappingId: number,
  branch?: string,
  page: number = 1,
  perPage: number = 30
): Promise<{ commits: GitCommitItem[]; branch: string; repoIdentifier: string }> => {
  const params: any = { page, perPage };
  if (branch) params.branch = branch;
  const { data } = await apiClient.get(`/plugins/git/repos/${repoMappingId}/commits`, { params });
  return data;
};

export const useRepoCommits = (
  repoMappingId?: number,
  branch?: string,
  page: number = 1,
  perPage: number = 30,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: [...gitPluginKeys.repoCommits(repoMappingId || 0, branch), page, perPage],
    queryFn: () => fetchRepoCommits(repoMappingId!, branch, page, perPage),
    enabled: enabled && Boolean(repoMappingId && repoMappingId > 0),
    staleTime: 1000 * 30,
  });
};

// 13. 커밋 상세 정보 조회 (파일 diff 및 변경통계)
export const fetchCommitDetail = async (
  repoMappingId: number,
  sha: string
): Promise<GitCommitDetail> => {
  const { data } = await apiClient.get(`/plugins/git/repos/${repoMappingId}/commits/${sha}`);
  return data.commit;
};

export const useCommitDetail = (
  repoMappingId?: number,
  sha?: string,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: gitPluginKeys.commitDetail(repoMappingId || 0, sha || ''),
    queryFn: () => fetchCommitDetail(repoMappingId!, sha!),
    enabled: enabled && Boolean(repoMappingId && sha && sha.trim()),
    staleTime: 1000 * 60 * 5,
  });
};

// 14. 이슈에 커밋 수동 연결
export const linkCommitToIssue = async (payload: {
  issueId: number;
  repoMappingId: number;
  commitHash: string;
  message: string;
  authorName: string;
  authorEmail?: string;
  committedAt?: string;
}): Promise<any> => {
  const { issueId, ...rest } = payload;
  const { data } = await apiClient.post(`/plugins/git/issues/${issueId}/commits`, rest);
  return data.commitLink;
};

export const useLinkCommitToIssue = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: linkCommitToIssue,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: gitPluginKeys.issueData(variables.issueId) });
    },
  });
};

// 15. 이슈 커밋 연결 해제
export const unlinkCommitFromIssue = async (payload: {
  issueId: number;
  commitLinkId: number;
}): Promise<{ success: boolean }> => {
  const { issueId, commitLinkId } = payload;
  const { data } = await apiClient.delete(`/plugins/git/issues/${issueId}/commits/${commitLinkId}`);
  return data;
};

export const useUnlinkCommitFromIssue = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: unlinkCommitFromIssue,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: gitPluginKeys.issueData(variables.issueId) });
    },
  });
};

// 16. 작업로그에 커밋 연결 (1:1)
export const linkCommitToWorklog = async (payload: {
  worklogId: number;
  repoMappingId: number;
  commitHash: string;
  message: string;
  authorName: string;
  authorEmail?: string;
  committedAt?: string;
}): Promise<any> => {
  const { worklogId, ...rest } = payload;
  const { data } = await apiClient.post(`/plugins/git/worklogs/${worklogId}/commit`, rest);
  return data.worklogCommit;
};

export const useLinkCommitToWorklog = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: linkCommitToWorklog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['worklogs'] });
    },
  });
};

// 17. 작업로그 커밋 연결 해제
export const unlinkCommitFromWorklog = async (worklogId: number): Promise<{ success: boolean }> => {
  const { data } = await apiClient.delete(`/plugins/git/worklogs/${worklogId}/commit`);
  return data;
};

export const useUnlinkCommitFromWorklog = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: unlinkCommitFromWorklog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['worklogs'] });
    },
  });
};

