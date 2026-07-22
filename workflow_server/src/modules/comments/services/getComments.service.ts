import { prisma } from '#lib/prisma.js';

export const getCommentsService = async (issueId: number) => {
  if (!issueId) throw new Error('issueId is required');
  return await prisma.comment.findMany({
    where: { issueId },
    include: {
      author: { select: { id: true, name: true, email: true } },
      children: { include: { author: { select: { id: true, name: true } }, reactions: true } },
      mentions: { include: { user: { select: { id: true, name: true } } } },
      reactions: true,
      attachments: true
    },
    orderBy: { createdAt: 'asc' }
  });
};
