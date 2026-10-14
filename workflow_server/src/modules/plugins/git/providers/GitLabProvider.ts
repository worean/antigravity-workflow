﻿import { IGitProvider, GitTokenVerifyResult, GitBranchCreateResult, GitPullRequestItem, GitPullRequestCreateResult, GitPipelineItem } from './IGitProvider.js';

export class GitLabProvider implements IGitProvider {
  readonly providerName = 'GITLAB' as const;

  private getBaseUrl(serverUrl?: string): string {
    const raw = serverUrl && serverUrl.trim() !== '' ? serverUrl.replace(/\/$/, '') : 'https://gitlab.com';
    return raw.endsWith('/api/v4') ? raw : `${raw}/api/v4`;
  }

  private getHeaders(token: string) {
    return {
      'PRIVATE-TOKEN': token,
      'Content-Type': 'application/json',
    };
  }

  private encodeRepo(repo: string): string {
    return encodeURIComponent(repo.trim());
  }

  async verifyToken(token: string, serverUrl?: string): Promise<GitTokenVerifyResult> {
    try {
      const baseUrl = this.getBaseUrl(serverUrl);
      const res = await fetch(`${baseUrl}/user`, {
        headers: this.getHeaders(token),
      });

      if (!res.ok) {
        const errorText = await res.text();
        return { valid: false, username: '', error: `GitLab Auth Failed: ${res.status} ${errorText}` };
      }

      const data = (await res.json()) as any;
      return { valid: true, username: data.username || data.name || 'GitLab User' };
    } catch (err: any) {
      return { valid: false, username: '', error: err.message || 'Network error' };
    }
  }

  async listBranches(token: string, repo: string, serverUrl?: string): Promise<string[]> {
    try {
      const baseUrl = this.getBaseUrl(serverUrl);
      const res = await fetch(`${baseUrl}/projects/${this.encodeRepo(repo)}/repository/branches`, {
        headers: this.getHeaders(token),
      });
      if (!res.ok) return [];
      const data = (await res.json()) as any[];
      return data.map((b) => b.name);
    } catch {
      return [];
    }
  }

  async createBranch(token: string, repo: string, branchName: string, refBranch: string, serverUrl?: string): Promise<GitBranchCreateResult> {
    try {
      const baseUrl = this.getBaseUrl(serverUrl);
      const res = await fetch(`${baseUrl}/projects/${this.encodeRepo(repo)}/repository/branches`, {
        method: 'POST',
        headers: this.getHeaders(token),
        body: JSON.stringify({
          branch: branchName,
          ref: refBranch,
        }),
      });

      if (!res.ok) {
        const errJson = (await res.json()) as any;
        return { success: false, branchName, error: errJson.message || 'GitLab branch creation failed' };
      }

      return { success: true, branchName, ref: branchName };
    } catch (err: any) {
      return { success: false, branchName, error: err.message };
    }
  }

  async listPullRequests(token: string, repo: string, serverUrl?: string): Promise<GitPullRequestItem[]> {
    try {
      const baseUrl = this.getBaseUrl(serverUrl);
      const res = await fetch(`${baseUrl}/projects/${this.encodeRepo(repo)}/merge_requests?per_page=30`, {
        headers: this.getHeaders(token),
      });
      if (!res.ok) return [];
      const data = (await res.json()) as any[];

      return data.map((mr) => {
        let state: 'OPEN' | 'MERGED' | 'CLOSED' = 'OPEN';
        if (mr.state === 'merged') state = 'MERGED';
        else if (mr.state === 'closed') state = 'CLOSED';

        return {
          prNumber: mr.iid,
          title: mr.title,
          sourceBranch: mr.source_branch || '',
          targetBranch: mr.target_branch || '',
          state,
          authorName: mr.author?.username || mr.author?.name || 'unknown',
          url: mr.web_url || '',
          createdAt: mr.created_at,
          updatedAt: mr.updated_at,
        };
      });
    } catch {
      return [];
    }
  }

  async createPullRequest(
    token: string,
    repo: string,
    params: { title: string; body: string; head: string; base: string },
    serverUrl?: string
  ): Promise<GitPullRequestCreateResult> {
    try {
      const baseUrl = this.getBaseUrl(serverUrl);
      const res = await fetch(`${baseUrl}/projects/${this.encodeRepo(repo)}/merge_requests`, {
        method: 'POST',
        headers: this.getHeaders(token),
        body: JSON.stringify({
          source_branch: params.head,
          target_branch: params.base,
          title: params.title,
          description: params.body,
        }),
      });

      if (!res.ok) {
        const errJson = (await res.json()) as any;
        return { success: false, prNumber: 0, url: '', state: 'CLOSED', error: errJson.message || 'MR creation failed' };
      }

      const data = (await res.json()) as any;
      return {
        success: true,
        prNumber: data.iid,
        url: data.web_url,
        state: 'OPEN',
      };
    } catch (err: any) {
      return { success: false, prNumber: 0, url: '', state: 'CLOSED', error: err.message };
    }
  }

  async getPipelines(token: string, repo: string, serverUrl?: string): Promise<GitPipelineItem[]> {
    try {
      const baseUrl = this.getBaseUrl(serverUrl);
      const res = await fetch(`${baseUrl}/projects/${this.encodeRepo(repo)}/pipelines?per_page=10`, {
        headers: this.getHeaders(token),
      });
      if (!res.ok) return [];
      const data = (await res.json()) as any[];

      return data.map((p) => {
        let status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'UNKNOWN' = 'UNKNOWN';
        if (p.status === 'created' || p.status === 'waiting_for_resource' || p.status === 'preparing' || p.status === 'pending') status = 'PENDING';
        else if (p.status === 'running') status = 'RUNNING';
        else if (p.status === 'success') status = 'SUCCESS';
        else if (p.status === 'failed' || p.status === 'canceled') status = 'FAILED';

        return {
          id: p.id,
          status,
          branch: p.ref || '',
          commitHash: p.sha || '',
          url: p.web_url || '',
          createdAt: p.created_at,
        };
      });
    } catch {
      return [];
    }
  }
}
