import { globalPrisma } from '#lib/globalPrisma.js';
import { prisma } from '#lib/prisma.js';

export const disconnectCalDavService = async (userId: number): Promise<{ success: boolean; message: string }> => {
  if (!userId) {
    throw new Error('인증 정보가 필요합니다.');
  }

  const providerId = `caldav_${userId}`;

  try {
    await globalPrisma.socialAccount.deleteMany({
      where: {
        userId: Number(userId),
        provider: 'CALDAV',
      },
    });
  } catch {}

  try {
    await prisma.socialAccount.deleteMany({
      where: {
        userId: Number(userId),
        provider: 'CALDAV',
      },
    });
  } catch {}

  // 인메모리 캐시 정리 및 실시간 소켓 통지
  try {
    const { clearCalDavCache } = await import('./getCalDavEvents.service.js');
    clearCalDavCache(userId);
    const { sendToUser } = await import('#lib/socket.js');
    sendToUser(Number(userId), 'calendar:synced', { timestamp: Date.now(), count: 0, reason: 'disconnected' });
  } catch {}

  return {
    success: true,
    message: 'CalDAV 연동이 성공적으로 해제되었습니다.',
  };
};
