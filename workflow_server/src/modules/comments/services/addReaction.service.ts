import { prisma } from '#lib/prisma.js';

export const addReactionService = async (commentId: number, userId: number, emoji: string) => {
  if (!commentId || !userId || !emoji) throw new Error('commentId, userId, and emoji are required');

  const existing = await prisma.commentReaction.findUnique({
    where: {
      commentId_userId_emoji: { commentId, userId, emoji },
    },
  });

  let action = 'ADDED';
  let reactionRecord: any = null;

  if (existing) {
    await prisma.commentReaction.delete({
      where: { id: existing.id },
    });
    action = 'REMOVED';
    reactionRecord = existing;
  } else {
    reactionRecord = await prisma.commentReaction.create({
      data: {
        commentId,
        userId,
        emoji,
      },
    });
    action = 'ADDED';
  }

  const allReactions = await prisma.commentReaction.findMany({
    where: { commentId },
    include: { user: { select: { id: true, name: true } } },
  });

  const reactionMap = new Map<string, { emoji: string; count: number; users: any[] }>();
  for (const r of allReactions) {
    if (!reactionMap.has(r.emoji)) {
      reactionMap.set(r.emoji, { emoji: r.emoji, count: 0, users: [] });
    }
    const item = reactionMap.get(r.emoji)!;
    item.count += 1;
    if (r.user) {
      item.users.push(r.user);
    } else {
      item.users.push({ id: r.userId });
    }
  }

  const formattedReactions = Array.from(reactionMap.values());

  return {
    id: reactionRecord?.id,
    action,
    emoji,
    commentId,
    userId,
    reactions: formattedReactions,
  };
};
