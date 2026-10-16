import {
  IGitProvider,
  GitTokenVerifyResult,
  GitBranchCreateResult,
  GitPullRequestItem,
  GitPullRequestCreateResult,
  GitPipelineItem,
  GitRemoteRepoItem,
  GitCommitItem,
  GitCommitDetail,
  GitCommitFileDiff,
} from './IGitProvider.js';
import { summarizeErrorBody } from './gitErrorUtils.js';


export class GitHubProvider implements IGitProvider {
  readonly providerName = 'GITHUB' as const;

  private getBaseUrl(serverUrl?: string): string {
    if (!serverUrl || serverUrl.trim() === '') {
      return 'https://api.github.com';
    }
    const clean = serverUrl.trim().replace(/\/$/, '');
    // github.com 웹사이트 URL이 들어온 경우 GitHub 공식 API URL로 자동 보정
    if (clean === 'https://github.com' || clean === 'http://github.com') {
      return 'https://api.github.com';
    }
    // GitHub Enterprise Server인 경우 /api/v3가 포함되지 않았으면 추가
    if (!clean.endsWith('/api/v3') && !clean.includes('api.github.com')) {
      return `${clean}/api/v3`;
    }
    return clean;
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
      const isFineGrained = token.trim().startsWith('github_pat_');
      const tokenTypeLabel = isFineGrained ? 'Fine-grained PAT' : 'Classic PAT';

      const res = await fetch(`${baseUrl}/user`, {
        headers: this.getHeaders(token),
      });

      if (!res.ok) {
        const errorText = await res.text();
        if (res.status === 401) {
          return { valid: false, username: '', error: `GitHub Auth Failed: 401 Unauthorized (토큰이 만료되었거나 올바르지 않습니다)` };
        }
        if (res.status === 403) {
          return {
            valid: false,
            username: '',
            error: `GitHub Auth Failed: 403 Forbidden (${isFineGrained ? 'Fine-grained PAT의 권한(Contents, Pull requests, Metadata)을 확인해주세요.' : '토큰의 스코프(repo) 권한을 확인해주세요.'})`
          };
        }
        return { valid: false, username: '', error: `GitHub Auth Failed: ${res.status} ${summarizeErrorBody(errorText)}` };
      }

      const data = (await res.json()) as any;
      const username = data.login || data.name || 'GitHub User';
      return { valid: true, username: `${username} (${tokenTypeLabel})` };
    } catch (err: any) {
      return { valid: false, username: '', error: err.message || '네트워크 오류가 발생했습니다.' };
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

  async listRepositories(token: string, serverUrl?: string): Promise<GitRemoteRepoItem[]> {
    try {
      const baseUrl = this.getBaseUrl(serverUrl);
      const headers = this.getHeaders(token);

      // 1차 시도: affiliation 파라미터를 포함하여 전체 참여 저장소 조회
      let res = await fetch(`${baseUrl}/user/repos?per_page=100&sort=updated&affiliation=owner,collaborator,organization_member`, {
        headers,
      });

      // Fine-grained PAT의 경우 affiliation 파라미터가 일부 제한될 수 있으므로 fallback 시도
      if (!res.ok) {
        res = await fetch(`${baseUrl}/user/repos?per_page=100&sort=updated`, {
          headers,
        });
      }

      if (!res.ok) {
        return [];
      }

      const data = (await res.json()) as any[];
      if (!Array.isArray(data)) return [];

      return data.map((repo) => ({
        id: repo.id,
        name: repo.name || '',
        fullName: repo.full_name || repo.name || '',
        description: repo.description || '',
        isPrivate: Boolean(repo.private),
        defaultBranch: repo.default_branch || 'main',
        webUrl: repo.html_url || '',
        updatedAt: repo.updated_at || repo.created_at || new Date().toISOString(),
      }));
    } catch {
      return [];
    }
  }

  async listCommits(
    token: string,
    repo: string,
    options?: { branch?: string; page?: number; perPage?: number },
    serverUrl?: string
  ): Promise<GitCommitItem[]> {
    try {
      const baseUrl = this.getBaseUrl(serverUrl);
      const params = new URLSearchParams();
      if (options?.branch) params.set('sha', options.branch);
      if (options?.page) params.set('page', String(options.page));
      params.set('per_page', String(options?.perPage || 30));

      const res = await fetch(`${baseUrl}/repos/${repo}/commits?${params.toString()}`, {
        headers: this.getHeaders(token),
      });
      if (!res.ok) {
        throw new Error(`GitHub 커밋 조회 실패: HTTP ${res.status} ${summarizeErrorBody(await res.text())}`);
      }
      const data = (await res.json()) as any[];

      return data.map((item) => ({
        commitHash: item.sha,
        shortHash: (item.sha || '').slice(0, 7),
        message: item.commit?.message || '',
        authorName: item.commit?.author?.name || item.author?.login || 'unknown',
        authorEmail: item.commit?.author?.email,
        committedAt: item.commit?.author?.date || item.commit?.committer?.date || new Date().toISOString(),
        url: item.html_url,
      }));
    } catch (err: any) {
      if (err?.message?.startsWith('GitHub 커밋 조회 실패')) throw err;
      throw new Error(`GitHub 서버 연결 실패: ${err?.message || err}`);
    }
  }

  async getCommitDetail(
    token: string,
    repo: string,
    sha: string,
    serverUrl?: string
  ): Promise<GitCommitDetail> {
    const baseUrl = this.getBaseUrl(serverUrl);
    const res = await fetch(`${baseUrl}/repos/${repo}/commits/${sha}`, {
      headers: this.getHeaders(token),
    });
    if (!res.ok) {
      throw new Error(`GitHub Commit not found: ${res.status}`);
    }
    const data = (await res.json()) as any;

    const files: GitCommitFileDiff[] = (data.files || []).map((f: any) => {
      let status: 'added' | 'modified' | 'deleted' | 'renamed' = 'modified';
      if (f.status === 'added') status = 'added';
      else if (f.status === 'removed') status = 'deleted';
      else if (f.status === 'renamed') status = 'renamed';

      return {
        filename: f.filename,
        oldPath: f.previous_filename,
        status,
        additions: f.additions || 0,
        deletions: f.deletions || 0,
        patch: f.patch,
      };
    });

    return {
      commitHash: data.sha,
      shortHash: (data.sha || '').slice(0, 7),
      message: data.commit?.message || '',
      authorName: data.commit?.author?.name || data.author?.login || 'unknown',
      authorEmail: data.commit?.author?.email,
      committedAt: data.commit?.author?.date || data.commit?.committer?.date || new Date().toISOString(),
      url: data.html_url,
      stats: data.stats
        ? {
            total: data.stats.total || 0,
            additions: data.stats.additions || 0,
            deletions: data.stats.deletions || 0,
          }
        : undefined,
      files,
    };
  }

  async listPullRequestCommits(
    token: string,
    repo: string,
    prNumber: number,
    serverUrl?: string
  ): Promise<GitCommitItem[]> {
    try {
      const baseUrl = this.getBaseUrl(serverUrl);
      const res = await fetch(`${baseUrl}/repos/${repo}/pulls/${prNumber}/commits?per_page=100`, {
        headers: this.getHeaders(token),
      });
      if (!res.ok) {
        throw new Error(`GitHub PR 커밋 조회 실패: HTTP ${res.status} ${summarizeErrorBody(await res.text())}`);
      }
      const data = (await res.json()) as any[];

      return data.map((item) => ({
        commitHash: item.sha,
        shortHash: (item.sha || '').slice(0, 7),
        message: item.commit?.message || '',
        authorName: item.commit?.author?.name || item.author?.login || 'unknown',
        authorEmail: item.commit?.author?.email,
        committedAt: item.commit?.author?.date || item.commit?.committer?.date || new Date().toISOString(),
        url: item.html_url,
      }));
    } catch (err: any) {
      if (err?.message?.startsWith('GitHub PR 커밋 조회 실패')) throw err;
      throw new Error(`GitHub PR 커밋 조회 서버 연결 실패: ${err?.message || err}`);
    }
  }
}

