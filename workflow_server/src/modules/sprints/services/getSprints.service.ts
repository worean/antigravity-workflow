import { prisma } from '#lib/prisma.js';

export const getSprintsService = async (projectId?: number) => {
  return await prisma.sprint.findMany({
    where: projectId ? { projectId } : {},
    include: { _count: { select: { issues: true } } },
    orderBy: { createdAt: 'desc' }
  });
};
