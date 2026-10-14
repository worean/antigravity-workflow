import { globalPrisma } from '#lib/globalPrisma.js';

export const getMessagesService = async (
  channelId: number,
  userId: number,
  query: any = {},
  customDb?: any,
  currentWorkspace?: any
) => {
  const gdb = (customDb ?? globalPrisma) as any;
  const limit = Number(query.limit) || 50;
  const cursor = query.cursor ? Number(query.cursor) : undefined;

  const channel = await gdb.chatChannel.findUnique({
    where: { id: channelId },
    include: { members: true },
  });

  if (!channel) throw new Error('Channel not found');

  if (currentWorkspace?.id && channel.workspaceId && channel.workspaceId !== currentWorkspace.id) {
    throw new Error('Forbidden: Channel does not belong to the current workspace');
  }

  const messages = await gdb.chatMessage.findMany({
    where: { channelId },
    take: limit,
    skip: cursor ? 1 : 0,
    cursor: cursor ? { id: cursor } : undefined,
    orderBy: { createdAt: 'desc' },
    include: {
      sender: {
        select: { id: true, name: true, email: true, avatar: true, avatarColor: true },
      },
      reactions: {
        include: {
          user: { select: { id: true, name: true } },
        },
      },
    },
  });

  const formattedMessages = messages.map((msg: any) => {
    const reactionMap = new Map<string, { emoji: string; count: number; users: any[] }>();
    for (const r of msg.reactions || []) {
      if (!reactionMap.has(r.emoji)) {
        reactionMap.set(r.emoji, { emoji: r.emoji, count: 0, users: [] });
      }
      const item = reactionMap.get(r.emoji)!;
      item.count += 1;
      if (r.user) {
        item.users.push(r.user);
      } else if (r.userId) {
        item.users.push({ id: r.userId });
      }
    }
    return {
      ...msg,
      reactions: Array.from(reactionMap.values()),
    };
  });

  return {
    messages: formattedMessages.reverse(),
    nextCursor: messages.length === limit ? messages[0].id : null,
  };
};
