﻿﻿import { Request, Response } from 'express';
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
    const { provider, token, serverUrl } = req.body;
    const result = await testGitConnectionService({ provider, token, serverUrl });
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
