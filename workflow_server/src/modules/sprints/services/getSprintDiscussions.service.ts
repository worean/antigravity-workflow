import { prisma } from '#lib/prisma.js';

export const getSprintDiscussionsService = async (sprintId: number) => {
  if (!sprintId || isNaN(Number(sprintId))) {
    throw new Error('Valid Sprint ID is required');
  }

  const sprintIssues = await prisma.issue.findMany({
    where: { sprintId: Number(sprintId) },
    select: { id: true }
  });

  const issueIds = sprintIssues.map((iss) => iss.id);
  if (issueIds.length === 0) {
    return [];
  }

  const comments = await prisma.comment.findMany({
    where: {
      issueId: { in: issueIds }
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          avatarColor: true,
          role: true
        }
      },
      issue: {
        select: {
          id: true,
          title: true,
          issueNumber: true,
          status: { select: { id: true, name: true, category: true } },
          priority: { select: { id: true, name: true, level: true, color: true } }
        }
      },
      reactions: {
        include: {
          user: { select: { id: true, name: true } }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return comments;
};