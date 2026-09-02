import { globalPrisma } from '#lib/globalPrisma.js';

export const getMessagesService = async (
  channelId: number,
  userId: number,
  query: any = {},
  customDb?: any
) => {
  const gdb = (customDb ?? globalPrisma) as any;
  const limit = Number(query.limit) || 50;
  const cursor = query.cursor ? Number(query.cursor) : undefined;

  const channel = await gdb.chatChannel.findUnique({
    where: { id: channelId },
    include: { members: true },
  });

  if (!channel) throw new Error('Channel not found');

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

  return {
    messages: messages.reverse(),
    nextCursor: messages.length === limit ? messages[0].id : null,
  };
};
