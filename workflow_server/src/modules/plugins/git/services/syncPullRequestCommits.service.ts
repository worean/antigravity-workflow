import { prisma } from '#lib/prisma.js';
import { decryptGitToken } from '../providers/gitCrypto.js';
import { getGitProvider } from '../providers/gitProviderFactory.js';
import { batchLinkCommitsToIssueService } from './batchLinkCommitsToIssue.service.js';

interface SyncPullRequestCommitsParams {
  prId?: number;
  repoMappingId?: number;
  prNumber?: number;
  issueId?: number;
}

export async function syncPullRequestCommitsService(params: SyncPullRequestCommitsParams) {
  const { prId, repoMappingId, prNumber, issueId } = params;

  let prRecord: any = null;

  if (prId) {
    prRecord = await prisma.gitPullRequest.findUnique({
      where: { id: prId },
      include: {
        repoMapping: {
          include: { pluginConfig: true },
        },
      },
    });
  } else if (repoMappingId && prNumber) {
    prRecord = await prisma.gitPullRequest.findUnique({
      where: {
        repoMappingId_prNumber: {
          repoMappingId,
          prNumber,
        },
      },
      include: {
        repoMapping: {
          include: { pluginConfig: true },
        },
      },
    });
  }

  if (!prRecord) {
    throw new Error('해당 Pull Request 정보를 찾을 수 없습니다.');
  }

  const targetIssueId = issueId || prRecord.issueId;
  if (!targetIssueId) {
    throw new Error('커밋을 연계할 이슈 ID가 존재하지 않습니다.');
  }

  const mapping = prRecord.repoMapping;
  const { pluginConfig, repoIdentifier } = mapping;
  if (!pluginConfig.isEnabled) {
    throw new Error('Git 플러그인이 비활성화 상태입니다.');
  }

  const token = pluginConfig.encryptedToken ? decryptGitToken(pluginConfig.encryptedToken) : '';
  if (!token) {
    throw new Error('저장소 접근을 위한 Access Token이 등록되지 않았습니다.');
  }

  const gitProvider = getGitProvider(pluginConfig.provider);
  if (!gitProvider.listPullRequestCommits) {
    throw new Error(`${pluginConfig.provider} 제공자는 PR 커밋 조회를 지원하지 않습니다.`);
  }

  const commits = await gitProvider.listPullRequestCommits(
    token,
    repoIdentifier,
    prRecord.prNumber,
    pluginConfig.serverUrl || undefined
  );

  if (!commits || commits.length === 0) {
    return {
      success: true,
      count: 0,
      commits: [],
      message: 'PR에 등록된 커밋이 없습니다.',
    };
  }

  const workspaceId = mapping.pluginConfig?.workspaceId || 1;
  const commitInputs = commits.map((c) => ({
    repoMappingId: mapping.id,
    commitHash: c.commitHash,
    message: c.message,
    authorName: c.authorName,
    authorEmail: c.authorEmail,
    committedAt: c.committedAt,
    url: c.url,
  }));

  const linkResult = await batchLinkCommitsToIssueService({
    workspaceId,
    issueId: targetIssueId,
    commits: commitInputs,
  });

  return {
    success: true,
    count: linkResult.totalLinked,
    commits: linkResult.commits,
  };
}
