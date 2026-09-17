import { globalPrisma } from '#lib/globalPrisma.js';
import { broadcastToChannel } from '#lib/socket.js';

export const toggleReactionService = async (messageId: number, userId: number, emoji: string, customDb?: any) => {
  const gdb = (customDb ?? globalPrisma) as any;

  if (!messageId || !userId || !emoji) {
    throw new Error('Message ID, User ID, and Emoji are required');
  }

  const existing = await gdb.chatMessageReaction.findUnique({
    where: {
      messageId_userId_emoji: { messageId, userId, emoji },
    },
  });

  let action = 'ADDED';
  if (existing) {
    await gdb.chatMessageReaction.delete({
      where: { id: existing.id },
    });
    action = 'REMOVED';
  } else {
    await gdb.chatMessageReaction.create({
      data: { messageId, userId, emoji },
    });
  }

  const allReactions = await gdb.chatMessageReaction.findMany({
    where: { messageId },
    include: { user: { select: { id: true, name: true } } },
  });

  // 이모지별 그룹핑
  const reactionMap = new Map<string, { emoji: string; count: number; users: any[] }>();
  for (const r of allReactions) {
    if (!reactionMap.has(r.emoji)) {
      reactionMap.set(r.emoji, { emoji: r.emoji, count: 0, users: [] });
    }
    const item = reactionMap.get(r.emoji)!;
    item.count += 1;
    item.users.push(r.user);
  }

  const formattedReactions = Array.from(reactionMap.values());

  const message = await gdb.chatMessage.findUnique({ where: { id: messageId } });
  if (message) {
    broadcastToChannel(message.channelId, 'reaction_updated', {
      messageId,
      reactions: formattedReactions,
    });
  }

  return {
    action,
    emoji,
    messageId,
    reactions: formattedReactions,
  };
};
