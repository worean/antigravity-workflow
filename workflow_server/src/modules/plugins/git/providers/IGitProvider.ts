﻿﻿export interface GitTokenVerifyResult {
  valid: boolean;
  username: string;
  error?: string;
}

export interface GitBranchCreateResult {
  success: boolean;
  branchName: string;
  ref?: string;
  error?: string;
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

export interface GitPullRequestCreateResult {
  success: boolean;
  prNumber: number;
  url: string;
  state: string;
  error?: string;
}

export interface GitPipelineItem {
  id: string | number;
  status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'UNKNOWN';
  branch: string;
  commitHash: string;
  url: string;
  createdAt: string;
}

export interface IGitProvider {
  readonly providerName: 'GITHUB' | 'GITLAB';
  verifyToken(token: string, serverUrl?: string): Promise<GitTokenVerifyResult>;
  listBranches(token: string, repo: string, serverUrl?: string): Promise<string[]>;
  createBranch(token: string, repo: string, branchName: string, refBranch: string, serverUrl?: string): Promise<GitBranchCreateResult>;
  listPullRequests(token: string, repo: string, serverUrl?: string): Promise<GitPullRequestItem[]>;
  createPullRequest(token: string, repo: string, params: { title: string; body: string; head: string; base: string }, serverUrl?: string): Promise<GitPullRequestCreateResult>;
  getPipelines(token: string, repo: string, serverUrl?: string): Promise<GitPipelineItem[]>;
}
