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

  async listRepositories(token: string, serverUrl?: string): Promise<GitRemoteRepoItem[]> {
    try {
      const baseUrl = this.getBaseUrl(serverUrl);
      const res = await fetch(`${baseUrl}/projects?membership=true&per_page=100&order_by=updated`, {
        headers: this.getHeaders(token),
      });
      if (!res.ok) return [];
      const data = (await res.json()) as any[];

      return data.map((proj) => ({
        id: proj.id,
        name: proj.name || '',
        fullName: proj.path_with_namespace || proj.name || '',
        description: proj.description || '',
        isPrivate: proj.visibility !== 'public',
        defaultBranch: proj.default_branch || 'main',
        webUrl: proj.web_url || '',
        updatedAt: proj.last_activity_at || proj.created_at || new Date().toISOString(),
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
      if (options?.branch) params.set('ref_name', options.branch);
      if (options?.page) params.set('page', String(options.page));
      params.set('per_page', String(options?.perPage || 30));

      const res = await fetch(`${baseUrl}/projects/${this.encodeRepo(repo)}/repository/commits?${params.toString()}`, {
        headers: this.getHeaders(token),
      });
      if (!res.ok) {
        throw new Error(`GitLab 커밋 조회 실패: HTTP ${res.status} ${summarizeErrorBody(await res.text())}`);
      }
      const data = (await res.json()) as any[];

      return data.map((item) => ({
        commitHash: item.id,
        shortHash: item.short_id || (item.id || '').slice(0, 7),
        message: item.message || item.title || '',
        authorName: item.author_name || 'unknown',
        authorEmail: item.author_email,
        committedAt: item.committed_date || item.created_at || new Date().toISOString(),
        url: item.web_url,
      }));
    } catch (err: any) {
      if (err?.message?.startsWith('GitLab 커밋 조회 실패')) throw err;
      throw new Error(`GitLab 서버 연결 실패: ${err?.message || err}`);
    }
  }

  async getCommitDetail(
    token: string,
    repo: string,
    sha: string,
    serverUrl?: string
  ): Promise<GitCommitDetail> {
    const baseUrl = this.getBaseUrl(serverUrl);
    const [commitRes, diffRes] = await Promise.all([
      fetch(`${baseUrl}/projects/${this.encodeRepo(repo)}/repository/commits/${sha}`, {
        headers: this.getHeaders(token),
      }),
      fetch(`${baseUrl}/projects/${this.encodeRepo(repo)}/repository/commits/${sha}/diff`, {
        headers: this.getHeaders(token),
      }),
    ]);

    if (!commitRes.ok) {
      throw new Error(`GitLab Commit not found: ${commitRes.status}`);
    }

    const commitData = (await commitRes.json()) as any;
    let diffList: any[] = [];
    if (diffRes.ok) {
      diffList = (await diffRes.json()) as any[];
    }

    let calculatedAdditions = 0;
    let calculatedDeletions = 0;

    const files: GitCommitFileDiff[] = diffList.map((d: any) => {
      let status: 'added' | 'modified' | 'deleted' | 'renamed' = 'modified';
      if (d.new_file) status = 'added';
      else if (d.deleted_file) status = 'deleted';
      else if (d.renamed_file) status = 'renamed';

      const diffText = d.diff || '';
      let fileAdditions = 0;
      let fileDeletions = 0;

      for (const line of diffText.split('\n')) {
        if (line.startsWith('+') && !line.startsWith('+++')) fileAdditions++;
        else if (line.startsWith('-') && !line.startsWith('---')) fileDeletions++;
      }

      calculatedAdditions += fileAdditions;
      calculatedDeletions += fileDeletions;

      return {
        filename: d.new_path || d.old_path,
        oldPath: d.renamed_file ? d.old_path : undefined,
        status,
        additions: fileAdditions,
        deletions: fileDeletions,
        patch: diffText,
      };
    });

    const stats = commitData.stats || {
      additions: calculatedAdditions,
      deletions: calculatedDeletions,
      total: calculatedAdditions + calculatedDeletions,
    };

    return {
      commitHash: commitData.id,
      shortHash: commitData.short_id || (commitData.id || '').slice(0, 7),
      message: commitData.message || commitData.title || '',
      authorName: commitData.author_name || 'unknown',
      authorEmail: commitData.author_email,
      committedAt: commitData.committed_date || commitData.created_at || new Date().toISOString(),
      url: commitData.web_url,
      stats,
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
      const res = await fetch(`${baseUrl}/projects/${this.encodeRepo(repo)}/merge_requests/${prNumber}/commits?per_page=100`, {
        headers: this.getHeaders(token),
      });
      if (!res.ok) {
        throw new Error(`GitLab MR 커밋 조회 실패: HTTP ${res.status} ${summarizeErrorBody(await res.text())}`);
      }
      const data = (await res.json()) as any[];

      return data.map((item) => ({
        commitHash: item.id,
        shortHash: item.short_id || (item.id || '').slice(0, 7),
        message: item.message || item.title || '',
        authorName: item.author_name || 'unknown',
        authorEmail: item.author_email,
        committedAt: item.committed_date || item.created_at || new Date().toISOString(),
        url: item.web_url,
      }));
    } catch (err: any) {
      if (err?.message?.startsWith('GitLab MR 커밋 조회 실패')) throw err;
      throw new Error(`GitLab MR 커밋 조회 서버 연결 실패: ${err?.message || err}`);
    }
  }
}

