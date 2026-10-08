import { prisma } from '#lib/prisma.js';
import { globalPrisma } from '#lib/globalPrisma.js';
import { broadcastGlobal } from '#lib/socket.js';

export const deleteGroupService = async (id: number, currentUser?: any) => {
  if (!id) throw new Error('Group ID is required');

  const group = await prisma.group.findUnique({
    where: { id },
    include: { members: true },
  });
  if (!group) throw new Error(`Group with ID ${id} not found`);

  // 전역 관리자가 아닌 경우: 해당 그룹의 OWNER 또는 ADMIN 멤버인지 검증
  if (currentUser && currentUser.role !== 'ADMIN') {
    const isGroupOwnerOrAdmin = group.members.some(
      (m) => m.userId === currentUser.id && (m.role === 'OWNER' || m.role === 'ADMIN' || m.role === 'LEADER')
    );
    if (!isGroupOwnerOrAdmin) {
      throw new Error('Forbidden: 그룹 오너 또는 관리자만 그룹을 삭제할 수 있습니다.');
    }
  }

  // 1. Workspace DB에서 그룹 삭제
  const deletedGroup = await prisma.group.delete({
    where: { id },
  });

  // 2. Global DB에서 연관된 GROUP 채팅방 동시 삭제 (Dual DB Cascade)
  try {
    const deletedChannels = await globalPrisma.chatChannel.findMany({
      where: { type: 'GROUP', groupId: id },
      select: { id: true },
    });

    if (deletedChannels.length > 0) {
      await globalPrisma.chatChannel.deleteMany({
        where: { type: 'GROUP', groupId: id },
      });
      for (const ch of deletedChannels) {
        broadcastGlobal('chat:channel_deleted', { channelId: ch.id, groupId: id, type: 'GROUP' });
      }
    }
  } catch (err) {
    console.error('Failed to cascade delete group chat channels:', err);
  }

  return deletedGroup;
};
