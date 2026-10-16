import { prisma } from '#lib/prisma.js';
import { decryptGitToken } from '../providers/gitCrypto.js';
import { getGitProvider } from '../providers/gitProviderFactory.js';

interface CreatePullRequestParams {
  repoMappingId: number;
  issueId?: number;
  title: string;
  body: string;
  head: string;
  base: string;
  authorName?: string;
}

export async function createPullRequestService(params: CreatePullRequestParams) {
  const { repoMappingId, issueId, title, body, head, base, authorName = 'AntiGravity User' } = params;

  const mapping = await prisma.gitRepositoryMapping.findUnique({
    where: { id: repoMappingId },
    include: { pluginConfig: true },
  });

  if (!mapping) {
    throw new Error('해당 저장소 매핑 정보를 찾을 수 없습니다.');
  }

  const { pluginConfig, repoIdentifier } = mapping;
  if (!pluginConfig.isEnabled) {
    throw new Error('Git 플러그인이 비활성화 상태입니다.');
  }

  const token = pluginConfig.encryptedToken ? decryptGitToken(pluginConfig.encryptedToken) : '';
  if (!token) {
    throw new Error('저장소 접근을 위한 Access Token이 등록되지 않았습니다.');
  }

  const gitProvider = getGitProvider(pluginConfig.provider);
  const result = await gitProvider.createPullRequest(
    token,
    repoIdentifier,
    { title, body, head, base },
    pluginConfig.serverUrl || undefined
  );

  if (!result.success) {
    throw new Error(result.error || 'PR/MR 생성에 실패했습니다.');
  }

  const pr = await prisma.gitPullRequest.upsert({
    where: {
      repoMappingId_prNumber: {
        repoMappingId,
        prNumber: result.prNumber,
      },
    },
    update: {
      title,
      sourceBranch: head,
      targetBranch: base,
      state: 'OPEN',
      url: result.url,
      issueId: issueId || null,
    },
    create: {
      repoMappingId,
      issueId: issueId || null,
      prNumber: result.prNumber,
      title,
      sourceBranch: head,
      targetBranch: base,
      state: 'OPEN',
      authorName,
      url: result.url,
      ciStatus: 'PENDING',
    },
  });

  // PR에 포함된 모든 커밋을 이슈의 커밋으로 자동 등록 (PR 유실 방지 정책)
  if (issueId) {
    try {
      if (gitProvider.listPullRequestCommits) {
        const prCommits = await gitProvider.listPullRequestCommits(
          token,
          repoIdentifier,
          result.prNumber,
          pluginConfig.serverUrl || undefined
        );
        if (prCommits && prCommits.length > 0) {
          const workspaceId = mapping.pluginConfig?.workspaceId || 1;
          const { batchLinkCommitsToIssueService } = await import('./batchLinkCommitsToIssue.service.js');
          await batchLinkCommitsToIssueService({
            workspaceId,
            issueId,
            commits: prCommits.map((c) => ({
              repoMappingId,
              commitHash: c.commitHash,
              message: c.message,
              authorName: c.authorName,
              authorEmail: c.authorEmail,
              committedAt: c.committedAt,
              url: c.url,
            })),
          });
        }
      }
    } catch (syncErr) {
      console.warn(`[GitPlugin] PR 커밋 자동 동기화 경고: ${syncErr instanceof Error ? syncErr.message : syncErr}`);
    }
  }

  return pr;
}
