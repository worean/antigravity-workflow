import { prisma } from '#lib/prisma.js';
import { decryptGitToken } from '../providers/gitCrypto.js';
import { getGitProvider } from '../providers/gitProviderFactory.js';

interface CreateBranchParams {
  repoMappingId: number;
  branchName: string;
  refBranch?: string;
}

export async function createBranchService(params: CreateBranchParams) {
  const { repoMappingId, branchName, refBranch } = params;

  if (!branchName || !branchName.trim()) {
    throw new Error('브랜치명이 필요합니다.');
  }

  const mapping = await prisma.gitRepositoryMapping.findUnique({
    where: { id: repoMappingId },
    include: { pluginConfig: true },
  });

  if (!mapping) {
    throw new Error('해당 저장소 매핑 정보를 찾을 수 없습니다.');
  }

  const { pluginConfig, repoIdentifier, defaultBranch } = mapping;
  if (!pluginConfig.isEnabled) {
    throw new Error('Git 플러그인이 비활성화 상태입니다.');
  }

  const token = pluginConfig.encryptedToken ? decryptGitToken(pluginConfig.encryptedToken) : '';
  if (!token) {
    throw new Error('저장소 접근을 위한 Access Token이 등록되지 않았습니다.');
  }

  const baseRef = refBranch?.trim() || defaultBranch;
  const gitProvider = getGitProvider(pluginConfig.provider);

  const result = await gitProvider.createBranch(
    token,
    repoIdentifier,
    branchName.trim(),
    baseRef,
    pluginConfig.serverUrl || undefined
  );

  if (!result.success) {
    throw new Error(result.error || '브랜치 생성에 실패했습니다.');
  }

  return {
    success: true,
    branchName: result.branchName,
    ref: result.ref,
    repoIdentifier,
  };
}
