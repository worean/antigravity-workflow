﻿﻿import { prisma } from '#lib/prisma.js';
import { decryptGitToken } from '../providers/gitCrypto.js';
import { getGitProvider } from '../providers/gitProviderFactory.js';

export async function getPipelinesService(repoMappingId: number) {
  const mapping = await prisma.gitRepositoryMapping.findUnique({
    where: { id: repoMappingId },
    include: { pluginConfig: true },
  });

  if (!mapping) {
    throw new Error('해당 저장소 매핑 정보를 찾을 수 없습니다.');
  }

  const { pluginConfig, repoIdentifier } = mapping;
  if (!pluginConfig.isEnabled) {
    return [];
  }

  const token = pluginConfig.encryptedToken ? decryptGitToken(pluginConfig.encryptedToken) : '';
  if (!token) {
    return [];
  }

  const gitProvider = getGitProvider(pluginConfig.provider);
  return gitProvider.getPipelines(token, repoIdentifier, pluginConfig.serverUrl || undefined);
}
