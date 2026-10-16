import { Request, Response } from 'express';
import { getGitConfigService } from './services/getGitConfig.service.js';
import { updateGitConfigService } from './services/updateGitConfig.service.js';
import { testGitConnectionService } from './services/testGitConnection.service.js';
import { getRepoMappingsService } from './services/getRepoMappings.service.js';
import { createRepoMappingService } from './services/createRepoMapping.service.js';
import { deleteRepoMappingService } from './services/deleteRepoMapping.service.js';
import { getIssueGitDataService } from './services/getIssueGitData.service.js';
import { createBranchService } from './services/createBranch.service.js';
import { createPullRequestService } from './services/createPullRequest.service.js';
import { getPipelinesService } from './services/getPipelines.service.js';
import { handleGitWebhookService } from './services/handleGitWebhook.service.js';
import { listRemoteRepositoriesService } from './services/listRemoteRepositories.service.js';
import { listRepoCommitsService } from './services/listRepoCommits.service.js';
import { getCommitDetailService } from './services/getCommitDetail.service.js';
import { linkCommitToIssueService } from './services/linkCommitToIssue.service.js';
import { unlinkCommitFromIssueService } from './services/unlinkCommitFromIssue.service.js';
import { linkCommitToWorklogService } from './services/linkCommitToWorklog.service.js';
import { unlinkCommitFromWorklogService } from './services/unlinkCommitFromWorklog.service.js';
import { batchLinkCommitsToIssueService } from './services/batchLinkCommitsToIssue.service.js';
import { syncPullRequestCommitsService } from './services/syncPullRequestCommits.service.js';


export async function getGitConfig(req: Request, res: Response) {
  try {
    const workspaceId = (req as any).workspace?.id || 1;
    const config = await getGitConfigService(workspaceId);
    res.json({ success: true, config });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function updateGitConfig(req: Request, res: Response) {
  try {
    const workspaceId = (req as any).workspace?.id || 1;
    const { isEnabled, provider, serverUrl, token, webhookSecret, autoCloseIssueOnMerge } = req.body;
    const config = await updateGitConfigService({
      workspaceId,
      isEnabled,
      provider,
      serverUrl,
      token,
      webhookSecret,
      autoCloseIssueOnMerge,
    });
    res.json({ success: true, config });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function testGitConnection(req: Request, res: Response) {
  try {
    const workspaceId = (req as any).workspace?.id || 1;
    const { provider, token, serverUrl } = req.body;
    const result = await testGitConnectionService({ workspaceId, provider, token, serverUrl });
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function getRepoMappings(req: Request, res: Response) {
  try {
    const workspaceId = (req as any).workspace?.id || 1;
    const projectId = req.query.projectId ? parseInt(req.query.projectId as string, 10) : undefined;
    const mappings = await getRepoMappingsService(workspaceId, projectId);
    res.json({ success: true, mappings });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function createRepoMapping(req: Request, res: Response) {
  try {
    const workspaceId = (req as any).workspace?.id || 1;
    const { projectId, repoIdentifier, defaultBranch } = req.body;
    const mapping = await createRepoMappingService({
      workspaceId,
      projectId: Number(projectId),
      repoIdentifier,
      defaultBranch,
    });
    res.status(201).json({ success: true, mapping });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
}

export async function deleteRepoMapping(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id, 10);
    const result = await deleteRepoMappingService(id);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
}

export async function getIssueGitData(req: Request, res: Response) {
  try {
    const issueId = parseInt(req.params.issueId, 10);
    const data = await getIssueGitDataService(issueId);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(404).json({ success: false, error: err.message });
  }
}

export async function createBranch(req: Request, res: Response) {
  try {
    const { repoMappingId, branchName, refBranch } = req.body;
    const result = await createBranchService({
      repoMappingId: Number(repoMappingId),
      branchName,
      refBranch,
    });
    res.status(201).json({ success: true, result });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
}

export async function createPullRequest(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const { repoMappingId, issueId, title, body, head, base } = req.body;
    const pr = await createPullRequestService({
      repoMappingId: Number(repoMappingId),
      issueId: issueId ? Number(issueId) : undefined,
      title,
      body: body || '',
      head,
      base,
      authorName: user?.name || user?.email || 'AntiGravity User',
    });
    res.status(201).json({ success: true, pr });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
}

export async function getPipelines(req: Request, res: Response) {
  try {
    const repoMappingId = parseInt(req.params.repoMappingId, 10);
    const pipelines = await getPipelinesService(repoMappingId);
    res.json({ success: true, pipelines });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function handleWebhook(req: Request, res: Response) {
  try {
    const workspaceId = req.query.ws ? parseInt(req.query.ws as string, 10) : 1;
    const result = await handleGitWebhookService({
      workspaceId,
      headers: req.headers,
      payload: req.body,
    });
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
}

export async function listRemoteRepositories(req: Request, res: Response) {
  try {
    const workspaceId = (req as any).workspace?.id || 1;
    const projectId = req.query.projectId ? parseInt(req.query.projectId as string, 10) : undefined;
    const repositories = await listRemoteRepositoriesService({ workspaceId, projectId });
    res.json({ success: true, repositories });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function listRepoCommits(req: Request, res: Response) {
  try {
    const workspaceId = (req as any).workspace?.id || 1;
    const repoMappingId = parseInt(req.params.repoMappingId, 10);
    const branch = req.query.branch as string | undefined;
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const perPage = req.query.perPage ? parseInt(req.query.perPage as string, 10) : 30;

    const result = await listRepoCommitsService({
      workspaceId,
      repoMappingId,
      branch,
      page,
      perPage,
    });
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
}

export async function getCommitDetail(req: Request, res: Response) {
  try {
    const workspaceId = (req as any).workspace?.id || 1;
    const repoMappingId = parseInt(req.params.repoMappingId, 10);
    const sha = req.params.sha;

    const detail = await getCommitDetailService({
      workspaceId,
      repoMappingId,
      sha,
    });
    res.json({ success: true, commit: detail });
  } catch (err: any) {
    res.status(404).json({ success: false, error: err.message });
  }
}

export async function linkCommitToIssue(req: Request, res: Response) {
  try {
    const workspaceId = (req as any).workspace?.id || 1;
    const issueId = parseInt(req.params.issueId, 10);
    const { repoMappingId, commitHash, message, authorName, authorEmail, committedAt, url } = req.body;

    const commitLink = await linkCommitToIssueService({
      workspaceId,
      issueId,
      repoMappingId: Number(repoMappingId),
      commitHash,
      message,
      authorName: authorName || 'unknown',
      authorEmail,
      committedAt,
      url,
    });
    res.status(201).json({ success: true, commitLink });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
}

export async function unlinkCommitFromIssue(req: Request, res: Response) {
  try {
    const workspaceId = (req as any).workspace?.id || 1;
    const issueId = parseInt(req.params.issueId, 10);
    const commitLinkId = parseInt(req.params.commitLinkId, 10);

    const result = await unlinkCommitFromIssueService({
      workspaceId,
      issueId,
      commitLinkId,
    });
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
}

export async function linkCommitToWorklog(req: Request, res: Response) {
  try {
    const workspaceId = (req as any).workspace?.id || 1;
    const worklogId = parseInt(req.params.worklogId, 10);
    const { repoMappingId, commitHash, message, authorName, authorEmail, committedAt, url } = req.body;

    const worklogCommit = await linkCommitToWorklogService({
      workspaceId,
      worklogId,
      repoMappingId: Number(repoMappingId),
      commitHash,
      message,
      authorName: authorName || 'unknown',
      authorEmail,
      committedAt,
      url,
    });
    res.status(201).json({ success: true, worklogCommit });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
}

export async function unlinkCommitFromWorklog(req: Request, res: Response) {
  try {
    const workspaceId = (req as any).workspace?.id || 1;
    const worklogId = parseInt(req.params.worklogId, 10);

    const result = await unlinkCommitFromWorklogService({
      workspaceId,
      worklogId,
    });
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
}

export async function batchLinkCommitsToIssue(req: Request, res: Response) {
  try {
    const workspaceId = (req as any).workspace?.id || 1;
    const issueId = parseInt(req.params.issueId, 10);
    const { repoMappingId, commits } = req.body;

    const formattedCommits = (Array.isArray(commits) ? commits : []).map((c: any) => ({
      repoMappingId: Number(c.repoMappingId || repoMappingId),
      commitHash: c.commitHash,
      message: c.message || c.commitMessage || '',
      authorName: c.authorName || 'unknown',
      authorEmail: c.authorEmail,
      committedAt: c.committedAt,
      url: c.url,
    }));

    const result = await batchLinkCommitsToIssueService({
      workspaceId,
      issueId,
      commits: formattedCommits,
    });
    res.status(201).json({ success: true, ...result });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
}

export async function syncPullRequestCommits(req: Request, res: Response) {
  try {
    const prId = req.params.prId ? parseInt(req.params.prId, 10) : undefined;
    const { repoMappingId, prNumber, issueId } = req.body || {};

    const result = await syncPullRequestCommitsService({
      prId,
      repoMappingId: repoMappingId ? Number(repoMappingId) : undefined,
      prNumber: prNumber ? Number(prNumber) : undefined,
      issueId: issueId ? Number(issueId) : undefined,
    });
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
}

