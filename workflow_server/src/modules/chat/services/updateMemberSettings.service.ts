import { globalPrisma } from '#lib/globalPrisma.js';

export const updateMemberSettingsService = async (
  data: { channelId: number; userId: number; notificationLevel?: string; mutedUntil?: Date | null },
  customDb?: any
) => {
  const { channelId, userId, notificationLevel, mutedUntil } = data;
  const gdb = (customDb ?? globalPrisma) as any;

  const updated = await gdb.chatMember.upsert({
    where: { channelId_userId: { channelId, userId } },
    update: {
      ...(notificationLevel && { notificationLevel }),
      ...(mutedUntil !== undefined && { mutedUntil }),
    },
    create: {
      channelId,
      userId,
      notificationLevel: notificationLevel || 'ALL',
      mutedUntil,
    },
  });

  return updated;
};
