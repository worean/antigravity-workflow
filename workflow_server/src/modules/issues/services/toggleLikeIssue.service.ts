import { prisma } from '#lib/prisma.js';

export const toggleLikeIssueService = async (issueId: number, userId: number) => {
  if (!issueId || !userId) {
    throw new Error('issueId and userId are required');
  }

  const existingIssue = await prisma.issue.findUnique({
    where: { id: issueId }
  });

  if (!existingIssue) {
    throw new Error('Issue not found');
  }

  const existingLike = await prisma.issueLike.findUnique({
    where: {
      issueId_userId: { issueId, userId }
    }
  });

  let isLiked = false;

  if (existingLike) {
    await prisma.issueLike.delete({
      where: {
        issueId_userId: { issueId, userId }
      }
    });
    isLiked = false;
  } else {
    await prisma.issueLike.create({
      data: { issueId, userId }
    });
    isLiked = true;
  }

  const likesCount = await prisma.issueLike.count({
    where: { issueId }
  });

  return {
    message: isLiked ? 'Issue liked' : 'Issue unliked',
    isLiked,
    likesCount
  };
};
