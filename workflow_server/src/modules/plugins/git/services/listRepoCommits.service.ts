import { prisma } from '#lib/prisma.js';
import { decryptGitToken } from '../providers/gitCrypto.js';
import { gitProviderFactory } from '../providers/gitProviderFactory.js';

interface ListRepoCommitsParams {
  workspaceId: number;
  repoMappingId: number;
  branch?: string;
  page?: number;
  perPage?: number;
}

export async function listRepoCommitsService(params: ListRepoCommitsParams) {
  const { workspaceId, repoMappingId, branch, page = 1, perPage = 30 } = params;

  const mapping = await prisma.gitRepositoryMapping.findFirst({
    where: { id: repoMappingId },
    include: {
      pluginConfig: true,
      project: { select: { id: true, name: true, key: true } },
    },
  });

  if (!mapping) {
    throw new Error('저장소 매핑 정보를 찾을 수 없습니다.');
  }

  const { pluginConfig } = mapping;
  if (!pluginConfig.isEnabled) {
    throw new Error('Git 플러그인이 비활성화되어 있습니다.');
  }

  if (!pluginConfig.encryptedToken) {
    throw new Error('Git 플러그인 Access Token이 설정되지 않았습니다.');
  }

  const token = decryptGitToken(pluginConfig.encryptedToken);
  const provider = gitProviderFactory.getProvider(pluginConfig.provider as any);

  const targetBranch = branch || mapping.defaultBranch || 'main';
  const commits = await provider.listCommits(
    token,
    mapping.repoIdentifier,
    { branch: targetBranch, page, perPage },
    pluginConfig.serverUrl || undefined
  );

  return {
    repoMappingId: mapping.id,
    repoIdentifier: mapping.repoIdentifier,
    branch: targetBranch,
    project: mapping.project,
    commits,
  };
}
