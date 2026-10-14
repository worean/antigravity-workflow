﻿﻿import { prisma } from '#lib/prisma.js';

interface CreateRepoMappingParams {
  workspaceId: number;
  projectId: number;
  repoIdentifier: string;
  defaultBranch?: string;
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
  };
}
