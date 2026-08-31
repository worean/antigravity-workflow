// -*- coding: utf-8 -*-
import { prisma } from '#lib/prisma.js';
import { broadcastToChannel } from '../../../lib/socket.js';

export const toggleReactionService = async (messageId: number, userId: number, emoji: string) => {
  if (!messageId) throw new Error('Message ID is required');
  if (!userId) throw new Error('User ID is required');
  if (!emoji || !emoji.trim()) throw new Error('Emoji is required');

  const cleanEmoji = emoji.trim();

  const message = await prisma.chatMessage.findUnique({
    where: { id: messageId },
  });

  if (!message) throw new Error('Message not found');

  const existingReaction = await prisma.chatMessageReaction.findUnique({
    where: {
      messageId_userId_emoji: {
        messageId,
        userId,
        emoji: cleanEmoji,
      },
    },
  });

  let action: 'ADDED' | 'REMOVED';

  if (existingReaction) {
    await prisma.chatMessageReaction.delete({
      where: { id: existingReaction.id },
    });
    action = 'REMOVED';
  } else {
    await prisma.chatMessageReaction.create({
      data: {
        messageId,
        userId,
        emoji: cleanEmoji,
      },
    });
    action = 'ADDED';
  }

  // 갱신된 전체 리액션 목록 조회
  const allReactions = await prisma.chatMessageReaction.findMany({
    where: { messageId },
    include: {
      user: { select: { id: true, name: true } },
    },
  });

  const reactionMap = new Map<string, { emoji: string; count: number; users: { id: number; name: string }[]; hasReacted: boolean }>();
  for (const r of allReactions) {
    const item = reactionMap.get(r.emoji) || {
      emoji: r.emoji,
      count: 0,
      users: [],
      hasReacted: false,
    };
    item.count++;
    item.users.push({ id: r.user.id, name: r.user.name || '' });
    if (r.userId === userId) {
      item.hasReacted = true;
    }
    reactionMap.set(r.emoji, item);
  }

  const payload = {
    messageId,
    channelId: message.channelId,
    userId,
    emoji: cleanEmoji,
    action,
    reactions: Array.from(reactionMap.values()),
  };

  // 클라이언트 소켓 이벤트 동기화 (두 이벤트 모두 브로드캐스트)
  broadcastToChannel(message.channelId, 'chat:reaction_updated', payload);
  broadcastToChannel(message.channelId, 'chat:message_reaction', payload);

  return payload;
};