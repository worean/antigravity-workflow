import { prisma } from '#lib/prisma.js';
import { globalPrisma } from '#lib/globalPrisma.js';
import { broadcastGlobal } from '#lib/socket.js';

export const deleteProjectService = async (id: number, userId?: number) => {
  if (!id) throw new Error('Project ID is required');

  const existingProject = await prisma.project.findUnique({
    where: { id },
    select: { name: true, key: true }
  });

  // 1. Workspace DB에서 프로젝트 삭제
  await prisma.project.delete({ where: { id } });

  // 2. Global DB에서 연관된 PROJECT 채팅방 동시 삭제 (Dual DB Cascade)
  try {
    const deletedChannels = await globalPrisma.chatChannel.findMany({
      where: { type: 'PROJECT', projectId: id },
      select: { id: true },
    });

    if (deletedChannels.length > 0) {
      await globalPrisma.chatChannel.deleteMany({
        where: { type: 'PROJECT', projectId: id },
      });
      for (const ch of deletedChannels) {
        broadcastGlobal('chat:channel_deleted', { channelId: ch.id, projectId: id, type: 'PROJECT' });
      }
    }
  } catch (err) {
    console.error('Failed to cascade delete project chat channels:', err);
  }

  try {
    const { createActivityLogService } = await import('../../activityLogs/services/createActivityLog.service.js');
    await createActivityLogService({
      action: 'DELETE',
      entityType: 'PROJECT',
      entityId: id,
      userId: userId ? Number(userId) : undefined,
      summary: `프로젝트 #${id} ('${existingProject?.name || id}') 삭제`,
      details: { projectId: id, name: existingProject?.name, key: existingProject?.key }
    });
  } catch {
    // 로깅 오류 안전 무시
  }

  return { message: 'Project deleted' };
};

