import { prisma } from '#lib/prisma.js';

export const likeIssueService = async (issueId: number, userId: number) => {
  if (!issueId || !userId) {
    throw new Error('issueId and userId are required');
  }

  const like = await prisma.issueLike.upsert({
    where: { issueId_userId: { issueId, userId } },
    update: {},
    create: { issueId, userId }
  });

  return { message: 'Issue liked', like };
};

export const unlikeIssueService = async (issueId: number, userId: number) => {
  if (!issueId || !userId) {
    throw new Error('issueId and userId are required');
  }

  await prisma.issueLike.deleteMany({
    where: { issueId, userId }
  });

  return { message: 'Issue unliked' };
};
