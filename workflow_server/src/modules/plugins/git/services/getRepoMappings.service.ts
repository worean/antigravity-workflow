﻿﻿import { prisma } from '#lib/prisma.js';

export async function getRepoMappingsService(workspaceId: number, projectId?: number) {
  const config = await prisma.gitPluginConfig.findUnique({
    where: { workspaceId },
  });

  if (!config) {
    return [];
  }

  const whereClause: any = {
    pluginConfigId: config.id,
  };

  if (projectId) {
    whereClause.projectId = projectId;
  }

  const mappings = await prisma.gitRepositoryMapping.findMany({
    where: whereClause,
    include: {
      project: {
        select: {
          id: true,
          name: true,
          key: true,
        },
      },
      _count: {
        select: {
          pullRequests: true,
          commitLinks: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return mappings.map((m) => ({
    id: m.id,
    projectId: m.projectId,
    projectName: m.project.name,
    projectKey: m.project.key,
    repoIdentifier: m.repoIdentifier,
    defaultBranch: m.defaultBranch,
    isActive: m.isActive,
    prCount: m._count.pullRequests,
    commitCount: m._count.commitLinks,
    createdAt: m.createdAt,
    updatedAt: m.updatedAt,
  }));
}
