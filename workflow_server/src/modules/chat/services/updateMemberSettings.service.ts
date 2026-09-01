import { prisma } from '#lib/prisma.js';

export interface UpdateMemberSettingsInput {
  channelId: number;
  userId: number;
  notificationLevel?: 'ALL' | 'MENTIONS_ONLY' | 'MUTED';
  mutedUntil?: string | Date | null;
}

export const updateMemberSettingsService = async (data: UpdateMemberSettingsInput) => {
  const { channelId, userId, notificationLevel, mutedUntil } = data;

  if (!channelId) throw new Error('Channel ID is required');
  if (!userId) throw new Error('User ID is required');

  const updateData: any = {};
  if (notificationLevel) {
    if (!['ALL', 'MENTIONS_ONLY', 'MUTED'].includes(notificationLevel)) {
      throw new Error('Invalid notification level. Must be ALL, MENTIONS_ONLY, or MUTED');
    }
    updateData.notificationLevel = notificationLevel;
  }

  if (mutedUntil !== undefined) {
    updateData.mutedUntil = mutedUntil ? new Date(mutedUntil) : null;
  }

  const member = await prisma.chatMember.upsert({
    where: {
      channelId_userId: { channelId, userId },
    },
    update: updateData,
    create: {
      channelId,
      userId,
      notificationLevel: notificationLevel || 'ALL',
      mutedUntil: mutedUntil ? new Date(mutedUntil) : null,
    },
  });

  return {
    channelId: member.channelId,
    userId: member.userId,
    notificationLevel: member.notificationLevel,
    mutedUntil: member.mutedUntil,
  };
};