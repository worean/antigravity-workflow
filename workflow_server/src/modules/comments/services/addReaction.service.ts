import { prisma } from '#lib/prisma.js';

export const addReactionService = async (commentId: number, userId: number, emoji: string) => {
  if (!commentId || !userId || !emoji) throw new Error('commentId, userId, and emoji are required');
  return await prisma.commentReaction.create({
    data: {
      commentId,
      userId,
      emoji
    }
  });
};
