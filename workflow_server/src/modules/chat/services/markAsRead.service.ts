// -*- coding: utf-8 -*-
import { prisma } from '#lib/prisma.js';
import { sendToUser } from '../../../lib/socket.js';

export const markAsReadService = async (channelId: number, userId: number) => {
  if (!channelId) throw new Error('Channel ID is required');
  if (!userId) throw new Error('User ID is required');

  const now = new Date();

  // 기존 멤버십 확인
  const member = await prisma.chatMember.findUnique({
    where: {
      channelId_userId: { channelId, userId },
    },
  });

  if (member) {
    await prisma.chatMember.update({
      where: { id: member.id },
      data: { lastReadAt: now },
    });
  } else {
    // GLOBAL 채널 등의 경우 멤버십 신규 생성
    await prisma.chatMember.create({
      data: {
        channelId,
        userId,
        lastReadAt: now,
      },
    });
  }

  // 개인 소켓에 읽음 처리 완료 알림 (Unread 배지 클리어용)
  sendToUser(userId, 'chat:unread_cleared', { channelId });

  return { success: true, channelId, lastReadAt: now };
};