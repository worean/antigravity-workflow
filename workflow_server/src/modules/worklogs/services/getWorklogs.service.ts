import { prisma } from '#lib/prisma.js';

export interface GetWorklogsQuery {
  issueId?: number;
  userId?: number;
  limit?: number;
  offset?: number;
}

export const getWorklogsService = async (query: GetWorklogsQuery = {}) => {
  const { issueId, userId, limit = 100, offset = 0 } = query;

  const where: any = {};
  if (issueId) where.issueId = Number(issueId);
  if (userId) where.userId = Number(userId);

  const worklogs = await prisma.worklog.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, email: true, avatar: true, avatarColor: true } },
      issue: { select: { id: true, title: true, projectId: true, project: { select: { id: true, name: true, key: true } } } }
    },
    orderBy: { createdAt: 'desc' },
    take: Number(limit),
    skip: Number(offset)
  });

  return worklogs;
};
