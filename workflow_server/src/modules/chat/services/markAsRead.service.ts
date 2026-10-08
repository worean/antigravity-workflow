import { globalPrisma } from '#lib/globalPrisma.js';
import { prisma as workspacePrisma } from '#lib/prisma.js';

export const markAsReadService = async (channelId: number, userId: number, customDb?: any) => {
  const gdb = (customDb ?? globalPrisma) as any;
  const now = new Date();

  await gdb.chatMember.upsert({
    where: {
      channelId_userId: { channelId, userId },
    },
    update: { lastReadAt: now },
    create: { channelId, userId, lastReadAt: now },
  });

  // workspace db 호환성 동기화
  try {
    await workspacePrisma.chatMember.upsert({
      where: {
        channelId_userId: { channelId, userId },
      },
      update: { lastReadAt: now },
      create: { channelId, userId, lastReadAt: now },
    });
  } catch {}

  try {
    const { sendToUser } = await import('#lib/socket.js');
    sendToUser(userId, 'channel_read', { channelId, lastReadAt: now });
  } catch {}

  return { success: true, channelId, userId, lastReadAt: now };
};
