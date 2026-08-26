// -*- coding: utf-8 -*-
import { prisma } from '#lib/prisma.js';

export const getMessagesService = async (
  channelId: number,
  userId: number,
  query: { cursor?: number; limit?: number; before?: number }
) => {
  if (!channelId) throw new Error('Channel ID is required');
  if (!userId) throw new Error('User ID is required');

  // 채널 존재 여부 및 접근 권한 확인
  const channel = await prisma.chatChannel.findUnique({
    where: { id: channelId },
    include: { members: true },
  });

  if (!channel) throw new Error('Channel not found');

  // GLOBAL이 아니고 DM/PROJECT/GROUP인 경우 멤버십 체크
  if (channel.type === 'DM' && !channel.members.some((m) => m.userId === userId)) {
    throw new Error('Unauthorized: You are not a member of this DM channel');
  }

  const limit = Math.min(Number(query.limit) || 50, 100);

  const whereCondition: any = { channelId };
  if (query.cursor) {
    whereCondition.id = { lt: Number(query.cursor) };
  } else if (query.before) {
    whereCondition.id = { lt: Number(query.before) };
  }

  const messages = await prisma.chatMessage.findMany({
    where: whereCondition,
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      sender: {
        select: { id: true, name: true, email: true, avatar: true, avatarColor: true, role: true },
      },
      reactions: {
        include: {
          user: { select: { id: true, name: true } },
        },
      },
    },
  });

  // 클라이언트 렌더링을 위해 시간 오름차순(과거->최신)으로 뒤집어 반환
  const orderedMessages = messages.reverse();

  // 각 메시지의 이모지 반응 그룹화 가공
  const formattedMessages = orderedMessages.map((msg) => {
    const reactionMap = new Map<string, { emoji: string; count: number; users: { id: number; name: string }[]; hasReacted: boolean }>();

    for (const r of msg.reactions) {
      const existing = reactionMap.get(r.emoji) || {
        emoji: r.emoji,
        count: 0,
        users: [],
        hasReacted: false,
      };
      existing.count++;
      existing.users.push({ id: r.user.id, name: r.user.name || '' });
      if (r.userId === userId) {
        existing.hasReacted = true;
      }
      reactionMap.set(r.emoji, existing);
    }

    let parsedMentions: any = [];
    if (msg.mentions) {
      try {
        parsedMentions = JSON.parse(msg.mentions);
      } catch {
        parsedMentions = [];
      }
    }

    let parsedAttachments: any = [];
    if (msg.attachments) {
      try {
        parsedAttachments = JSON.parse(msg.attachments);
      } catch {
        parsedAttachments = [];
      }
    }

    return {
      id: msg.id,
      channelId: msg.channelId,
      senderId: msg.senderId,
      sender: msg.sender,
      content: msg.content,
      attachments: parsedAttachments,
      mentions: parsedMentions,
      hasMention: msg.hasMention,
      isPinned: msg.isPinned,
      isSystem: msg.isSystem,
      reactions: Array.from(reactionMap.values()),
      createdAt: msg.createdAt,
      updatedAt: msg.updatedAt,
    };
  });

  return {
    channelId,
    messages: formattedMessages,
    hasMore: messages.length === limit,
    nextCursor: messages.length > 0 ? messages[0].id : null,
  };
};