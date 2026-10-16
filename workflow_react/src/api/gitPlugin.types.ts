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
  id?: number;
  repoMappingId?: number;
  repoIdentifier?: string;
  commitHash: string;
  shortHash?: string;
  message: string;
  authorName: string;
  authorEmail?: string | null;
  committedAt: string;
  createdAt?: string;
  url?: string;
}

export interface GitCommitFileDiff {
  filename: string;
  oldPath?: string;
  status: 'added' | 'modified' | 'deleted' | 'renamed';
  additions: number;
  deletions: number;
  patch?: string;
}

export interface GitCommitDetail {
  repoMappingId: number;
  repoIdentifier: string;
  commitHash: string;
  shortHash: string;
  message: string;
  authorName: string;
  authorEmail?: string;
  committedAt: string;
  url?: string;
  stats?: {
    total: number;
    additions: number;
    deletions: number;
  };
  files: GitCommitFileDiff[];
  project?: { id: number; name: string; key: string };
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

export interface GitRemoteRepoItem {
  id: string | number;
  name: string;
  fullName: string;
  description?: string;
  isPrivate: boolean;
  defaultBranch: string;
  webUrl: string;
  updatedAt: string;
  isMapped: boolean;
  isMappedToCurrentProject: boolean;
  mappingId?: number;
  mappedProjectId?: number;
  mappedProjectKey?: string;
  mappedProjectName?: string;
}
