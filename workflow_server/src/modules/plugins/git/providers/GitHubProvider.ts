import { IGitProvider, GitTokenVerifyResult, GitBranchCreateResult, GitPullRequestItem, GitPullRequestCreateResult, GitPipelineItem } from './IGitProvider.js';

export class GitHubProvider implements IGitProvider {
  readonly providerName = 'GITHUB' as const;

  private getBaseUrl(serverUrl?: string): string {
    return serverUrl && serverUrl.trim() !== '' ? serverUrl.replace(/\/$/, '') : 'https://api.github.com';
  }

  private getHeaders(token: string) {
    return {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'AntiGravity-Workflow',
      'Content-Type': 'application/json',
    };
  }

  async verifyToken(token: string, serverUrl?: string): Promise<GitTokenVerifyResult> {
    try {
      const baseUrl = this.getBaseUrl(serverUrl);
      const res = await fetch(`${baseUrl}/user`, {
        headers: this.getHeaders(token),
      });

      if (!res.ok) {
        const errorText = await res.text();
        return { valid: false, username: '', error: `GitHub Auth Failed: ${res.status} ${errorText}` };
      }

      const data = (await res.json()) as any;
      return { valid: true, username: data.login || data.name || 'GitHub User' };
    } catch (err: any) {
      return { valid: false, username: '', error: err.message || 'Network error' };
    }
  }

  async listBranches(token: string, repo: string, serverUrl?: string): Promise<string[]> {
    try {
      const baseUrl = this.getBaseUrl(serverUrl);
      const res = await fetch(`${baseUrl}/repos/${repo}/branches`, {
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
      const refRes = await fetch(`${baseUrl}/repos/${repo}/git/ref/heads/${refBranch}`, {
        headers: this.getHeaders(token),
      });
      if (!refRes.ok) {
        return { success: false, branchName, error: `Base branch '${refBranch}' not found` };
      }
      const refData = (await refRes.json()) as any;
      const sha = refData.object?.sha;
      if (!sha) {
        return { success: false, branchName, error: 'Could not resolve SHA for base branch' };
      }

      const createRes = await fetch(`${baseUrl}/repos/${repo}/git/refs`, {
        method: 'POST',
        headers: this.getHeaders(token),
        body: JSON.stringify({
          ref: `refs/heads/${branchName}`,
          sha,
        }),
      });

      if (!createRes.ok) {
        const errJson = (await createRes.json()) as any;
        return { success: false, branchName, error: errJson.message || 'Branch creation failed' };
      }

      return { success: true, branchName, ref: `refs/heads/${branchName}` };
    } catch (err: any) {
      return { success: false, branchName, error: err.message };
    }
  }

  async listPullRequests(token: string, repo: string, serverUrl?: string): Promise<GitPullRequestItem[]> {
    try {
      const baseUrl = this.getBaseUrl(serverUrl);
      const res = await fetch(`${baseUrl}/repos/${repo}/pulls?state=all&per_page=30`, {
        headers: this.getHeaders(token),
      });
      if (!res.ok) return [];
      const data = (await res.json()) as any[];

      return data.map((pr) => {
        let state: 'OPEN' | 'MERGED' | 'CLOSED' = 'OPEN';
        if (pr.merged_at) state = 'MERGED';
        else if (pr.state === 'closed') state = 'CLOSED';

        return {
          prNumber: pr.number,
          title: pr.title,
          sourceBranch: pr.head?.ref || '',
          targetBranch: pr.base?.ref || '',
          state,
          authorName: pr.user?.login || 'unknown',
          url: pr.html_url || '',
          createdAt: pr.created_at,
          updatedAt: pr.updated_at,
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
      const res = await fetch(`${baseUrl}/repos/${repo}/pulls`, {
        method: 'POST',
        headers: this.getHeaders(token),
        body: JSON.stringify({
          title: params.title,
          body: params.body,
          head: params.head,
          base: params.base,
        }),
      });

      if (!res.ok) {
        const errJson = (await res.json()) as any;
        return { success: false, prNumber: 0, url: '', state: 'CLOSED', error: errJson.message || 'PR creation failed' };
      }

      const data = (await res.json()) as any;
      return {
        success: true,
        prNumber: data.number,
        url: data.html_url,
        state: 'OPEN',
      };
    } catch (err: any) {
      return { success: false, prNumber: 0, url: '', state: 'CLOSED', error: err.message };
    }
  }

  async getPipelines(token: string, repo: string, serverUrl?: string): Promise<GitPipelineItem[]> {
    try {
      const baseUrl = this.getBaseUrl(serverUrl);
      const res = await fetch(`${baseUrl}/repos/${repo}/actions/runs?per_page=10`, {
        headers: this.getHeaders(token),
      });
      if (!res.ok) return [];
      const data = (await res.json()) as any;
      const runs = (data.workflow_runs || []) as any[];

      return runs.map((run) => {
        let status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'UNKNOWN' = 'UNKNOWN';
        if (run.status === 'queued') status = 'PENDING';
        else if (run.status === 'in_progress') status = 'RUNNING';
        else if (run.conclusion === 'success') status = 'SUCCESS';
        else if (run.conclusion === 'failure') status = 'FAILED';

        return {
          id: run.id,
          status,
          branch: run.head_branch || '',
          commitHash: run.head_sha || '',
          url: run.html_url || '',
          createdAt: run.created_at,
        };
      });
    } catch {
      return [];
    }
  }
}
