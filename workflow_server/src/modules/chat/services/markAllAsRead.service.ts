import { globalPrisma } from '#lib/globalPrisma.js';
import { prisma as workspacePrisma } from '#lib/prisma.js';

export const markAllAsReadService = async (
  userId: number,
  currentWorkspace?: any,
  customDb?: any
) => {
  if (!userId) throw new Error('User ID is required');
  const gdb = (customDb ?? globalPrisma) as any;
  const now = new Date();

  let workspaceId = currentWorkspace?.id || (typeof currentWorkspace === 'number' ? currentWorkspace : undefined);
  if (!workspaceId) {
    const defaultWs = await gdb.workspace.findFirst({
      where: { status: 'ACTIVE' },
      orderBy: { id: 'asc' },
    });
    workspaceId = defaultWs?.id;
  }

  if (!workspaceId) {
    throw new Error('Workspace ID is required');
  }

  // 1. 유저가 접근 가능한 프로젝트 및 그룹 목록 조회
  let projectIds: number[] = [];
  let groupIds: number[] = [];
  try {
    const accessibleProjects = await workspacePrisma.project.findMany({
      where: {
        OR: [{ ownerId: userId }, { members: { some: { userId } } }],
      },
      select: { id: true },
    });
    projectIds = accessibleProjects.map((p) => p.id);

    const accessibleGroups = await workspacePrisma.group.findMany({
      where: {
        members: { some: { userId } },
      },
      select: { id: true },
    });
    groupIds = accessibleGroups.map((g) => g.id);
  } catch {}

  // 2. 접근 가능한 모든 채널 조회
  const channels = await gdb.chatChannel.findMany({
    where: {
      workspaceId,
      OR: [
        { type: { in: ['GLOBAL', 'GENERAL'] } },
        { type: 'PROJECT', projectId: { in: projectIds } },
        { type: 'GROUP', groupId: { in: groupIds } },
        { members: { some: { userId } } },
      ],
    },
    select: { id: true },
  });

  // 3. 모든 채널에 대해 읽음 시간(lastReadAt) 갱신
  await Promise.all(
    channels.map(async (ch: { id: number }) => {
      await gdb.chatMember.upsert({
        where: {
          channelId_userId: { channelId: ch.id, userId },
        },
        update: { lastReadAt: now },
        create: { channelId: ch.id, userId, lastReadAt: now },
      });

      try {
        await workspacePrisma.chatMember.upsert({
          where: {
            channelId_userId: { channelId: ch.id, userId },
          },
          update: { lastReadAt: now },
          create: { channelId: ch.id, userId, lastReadAt: now },
        });
      } catch {}
    })
  );

  try {
    const { sendToUser } = await import('#lib/socket.js');
    sendToUser(userId, 'chat:all_read', { success: true, lastReadAt: now });
  } catch {}

  return { success: true, updatedCount: channels.length, lastReadAt: now };
};
