import { globalPrisma } from '#lib/globalPrisma.js';

export interface CreateChannelDTO {
  userId: number;
  name?: string;
  type?: 'GLOBAL' | 'GENERAL' | 'PROJECT' | 'GROUP' | 'DM';
  topic?: string;
  icon?: string;
  isPrivate?: boolean;
  workspaceId?: number;
  projectId?: number;
  groupId?: number;
  memberUserIds?: number[];
  targetUserId?: number;
}

export const createChannelService = async (data: CreateChannelDTO, customDb?: any) => {
  const { userId, name, type = 'GENERAL', topic, icon, isPrivate = false, workspaceId, projectId, groupId, memberUserIds = [], targetUserId } = data;
  const gdb = (customDb ?? globalPrisma) as any;

  if (!userId) throw new Error('User ID is required');

  // DM 생성인 경우
  if (type === 'DM') {
    const otherId = targetUserId || memberUserIds.find((id) => id !== userId);
    if (!otherId) throw new Error('Target User ID is required for DM');

    const existingDm = await gdb.chatChannel.findFirst({
      where: {
        type: 'DM',
        AND: [
          { members: { some: { userId } } },
          { members: { some: { userId: otherId } } },
        ],
      },
      include: {
        members: { include: { user: true } },
      },
    });

    if (existingDm) return existingDm;

    return await gdb.chatChannel.create({
      data: {
        name: `DM_${userId}_${otherId}`,
        type: 'DM',
        isPrivate: true,
        workspaceId: null,
        members: {
          create: [
            { userId, role: 'OWNER' },
            { userId: otherId, role: 'MEMBER' },
          ],
        },
      },
      include: {
        members: { include: { user: true } },
      },
    });
  }

  if (!name?.trim()) throw new Error('Channel name is required');

  // 일반/프로젝트/그룹 채널 생성
  const channel = await gdb.chatChannel.create({
    data: {
      name: name.trim(),
      type,
      topic,
      icon,
      isPrivate,
      workspaceId: workspaceId || null,
      projectId: projectId || null,
      groupId: groupId || null,
      members: {
        create: [
          { userId, role: 'OWNER' },
          ...memberUserIds.filter((id) => id !== userId).map((id) => ({ userId: id, role: 'MEMBER' })),
        ],
      },
    },
    include: {
      members: { include: { user: true } },
    },
  });

  return channel;
};
