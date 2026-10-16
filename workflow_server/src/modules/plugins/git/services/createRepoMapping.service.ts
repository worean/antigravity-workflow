import { prisma } from '#lib/prisma.js';
import { decryptGitToken } from '../providers/gitCrypto.js';
import { gitProviderFactory } from '../providers/gitProviderFactory.js';

interface CreateRepoMappingParams {
  workspaceId: number;
  projectId: number;
  repoIdentifier: string;
  defaultBranch?: string;
}

export interface CommitVerificationResult {
  ok: boolean;
  commitCount: number;
  branch: string;
  latestCommit?: { shortHash: string; message: string; authorName: string; committedAt: string };
  error?: string;
}

/** 매핑 직후 실제로 커밋 로그를 가져올 수 있는지 Provider API 로 검증합니다. (실패해도 매핑은 유지) */
async function verifyCommitLog(
  config: { provider: string; serverUrl: string | null; encryptedToken: string | null; isEnabled: boolean },
  repoIdentifier: string,
  branch: string
): Promise<CommitVerificationResult> {
  const base = { ok: false, commitCount: 0, branch };
  if (!config.isEnabled) return { ...base, error: 'Git 플러그인이 비활성화되어 있습니다.' };
  if (!config.encryptedToken) return { ...base, error: 'Git 플러그인 Access Token이 설정되지 않았습니다.' };

  try {
    const token = decryptGitToken(config.encryptedToken);
    const provider = gitProviderFactory.getProvider(config.provider as any);
    const commits = await provider.listCommits(
      token,
      repoIdentifier,
      { branch, page: 1, perPage: 5 },
      config.serverUrl || undefined
    );
    const latest = commits[0];
    return {
      ...base,
      ok: true,
      commitCount: commits.length,
      latestCommit: latest
        ? {
            shortHash: latest.shortHash,
            message: latest.message.split('\n')[0],
            authorName: latest.authorName,
            committedAt: latest.committedAt,
          }
        : undefined,
      error: commits.length === 0 ? `브랜치 '${branch}'에 커밋이 없습니다.` : undefined,
    };
  } catch (err: any) {
    return { ...base, error: err?.message || String(err) };
  }
}
export async function createRepoMappingService(params: CreateRepoMappingParams) {
  const { workspaceId, projectId, repoIdentifier, defaultBranch = 'main' } = params;

  if (!repoIdentifier || !repoIdentifier.trim()) {
    throw new Error('저장소 식별자(repoIdentifier)가 필요합니다.');
  }

  let config = await prisma.gitPluginConfig.findUnique({
    where: { workspaceId },
  });

  if (!config) {
    config = await prisma.gitPluginConfig.create({
      data: { workspaceId, isEnabled: true },
    });
  }

  // 중복 확인
  const existing = await prisma.gitRepositoryMapping.findUnique({
    where: {
      projectId_repoIdentifier: {
        projectId,
        repoIdentifier: repoIdentifier.trim(),
      },
    },
  });

  if (existing) {
    throw new Error('해당 프로젝트에 이미 매핑된 Git 저장소입니다.');
  }

  const mapping = await prisma.gitRepositoryMapping.create({
    data: {
      pluginConfigId: config.id,
      projectId,
      repoIdentifier: repoIdentifier.trim(),
      defaultBranch: defaultBranch.trim() || 'main',
    },
    include: {
      project: {
        select: { id: true, name: true, key: true },
      },
    },
  });

  const commitVerification = await verifyCommitLog(config, mapping.repoIdentifier, mapping.defaultBranch);
  console.log(`[GitMapping] #${mapping.id} ${mapping.repoIdentifier}@${mapping.defaultBranch} 커밋 로그 검증: ${commitVerification.ok ? '성공' : '실패'} (${commitVerification.commitCount}건)${commitVerification.error ? ' - ' + commitVerification.error : ''}`);

  return {
    id: mapping.id,
    projectId: mapping.projectId,
    projectName: mapping.project.name,
    projectKey: mapping.project.key,
    repoIdentifier: mapping.repoIdentifier,
    defaultBranch: mapping.defaultBranch,
    isActive: mapping.isActive,
    createdAt: mapping.createdAt,
    updatedAt: mapping.updatedAt,
    commitVerification,
  };
}
