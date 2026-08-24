import { prisma } from '#lib/prisma.js';

export const getProjectsService = async () => {
  return await prisma.project.findMany({
    include: {
      owner: { select: { id: true, name: true, email: true, avatar: true, avatarColor: true } },
      members: { include: { user: { select: { id: true, name: true, email: true, avatar: true, avatarColor: true } } } },
      status: true,
      priority: true,
      _count: { select: { issues: true, sprints: true } }
    }
  });
};
