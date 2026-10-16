import { prisma } from '#lib/prisma.js';
import { decryptGitToken } from '../providers/gitCrypto.js';
import { gitProviderFactory } from '../providers/gitProviderFactory.js';

interface GetCommitDetailParams {
  workspaceId: number;
  repoMappingId: number;
  sha: string;
}

export async function getCommitDetailService(params: GetCommitDetailParams) {
  const { workspaceId, repoMappingId, sha } = params;

  if (!sha || !sha.trim()) {
    throw new Error('조회할 커밋 해시(SHA)가 필요합니다.');
  }

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

  const detail = await provider.getCommitDetail(
    token,
    mapping.repoIdentifier,
    sha.trim(),
    pluginConfig.serverUrl || undefined
  );

  return {
    repoMappingId: mapping.id,
    repoIdentifier: mapping.repoIdentifier,
    project: mapping.project,
    ...detail,
  };
}
