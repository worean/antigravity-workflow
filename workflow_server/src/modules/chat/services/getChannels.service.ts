import { globalPrisma } from '#lib/globalPrisma.js';
import { prisma as workspacePrisma } from '#lib/prisma.js';

export const getChannelsService = async (
  userId: number,
  currentWorkspace?: any,
  customDb?: any
) => {
  if (!userId) throw new Error('User ID is required');
  const gdb = (customDb ?? globalPrisma) as any;

  let workspaceId = currentWorkspace?.id || (typeof currentWorkspace === 'number' ? currentWorkspace : undefined);
  if (!workspaceId) {
    const defaultWs = await gdb.workspace.findFirst({
      where: { status: 'ACTIVE' },
      orderBy: { id: 'asc' },
    });
    workspaceId = defaultWs?.id;
  }

  if (!workspaceId) {
    throw new Error('Workspace ID is required to fetch chat channels');
  }

  // 1. 해당 워크스페이스 기본 전체 채널 시드 생성
  const noticeChannel = await gdb.chatChannel.findFirst({
    where: { workspaceId, name: '전체-공지사항' },
  });
  if (!noticeChannel) {
    await gdb.chatChannel.create({
      data: { name: '전체-공지사항', type: 'GENERAL', topic: '전체 공지 및 중요 안내', icon: '📢', workspaceId },
    });
  }

  const freeChannel = await gdb.chatChannel.findFirst({
    where: { workspaceId, name: '자유-수다방' },
  });
  if (!freeChannel) {
    await gdb.chatChannel.create({
      data: { name: '자유-수다방', type: 'GENERAL', topic: '자유로운 대화 공간', icon: '💬', workspaceId },
    });
  }

  // 2. 유저가 접근 가능한 프로젝트 목록 및 채널 동기화
  let projectIds: number[] = [];
  try {
    const accessibleProjects = await workspacePrisma.project.findMany({
      where: {
        OR: [{ ownerId: userId }, { members: { some: { userId } } }],
      },
      include: { members: true },
    });
    projectIds = accessibleProjects.map((p) => p.id);

    for (const proj of accessibleProjects) {
      const existingChan = await gdb.chatChannel.findFirst({
        where: { workspaceId, type: 'PROJECT', projectId: proj.id },
      });
      if (!existingChan) {
        await gdb.chatChannel.create({
          data: {
            name: proj.name,
            type: 'PROJECT',
            topic: `${proj.name} (${proj.key}) 프로젝트 전용 대화방`,
            icon: '📁',
            projectId: proj.id,
            workspaceId,
            members: {
              create: [
                { userId: proj.ownerId, role: 'OWNER' },
                ...proj.members
                  .filter((m) => m.userId !== proj.ownerId)
                  .map((m) => ({ userId: m.userId, role: 'MEMBER' })),
              ],
            },
          },
        });
      }
    }
  } catch (err) {
    // 프로젝트 조회 실패 시 일반 채널만 계속 조회
  }

  // 3. 유저가 접근 가능한 그룹 목록 및 채널 동기화
  let groupIds: number[] = [];
  try {
    const accessibleGroups = await workspacePrisma.group.findMany({
      where: {
        members: { some: { userId } },
      },
      include: { members: true },
    });
    groupIds = accessibleGroups.map((g) => g.id);

    for (const grp of accessibleGroups) {
      const existingChan = await gdb.chatChannel.findFirst({
        where: { workspaceId, type: 'GROUP', groupId: grp.id },
      });
      if (!existingChan) {
        await gdb.chatChannel.create({
          data: {
            name: grp.name,
            type: 'GROUP',
            topic: `${grp.name} 그룹 전용 대화방`,
            icon: '👥',
            groupId: grp.id,
            workspaceId,
            members: {
              create: grp.members.map((m) => ({ userId: m.userId, role: 'MEMBER' })),
            },
          },
        });
      }
    }
  } catch (err) {
    // 그룹 조회 실패 시 무시
  }

  // 4. 해당 워크스페이스에 속한 채널 목록 필터링
  const rawChannels = await gdb.chatChannel.findMany({
    where: {
      workspaceId,
      OR: [
        { type: { in: ['GLOBAL', 'GENERAL'] } },
        { type: 'PROJECT', projectId: { in: projectIds } },
        { type: 'GROUP', groupId: { in: groupIds } },
        { members: { some: { userId } } },
      ],
    },
    include: {
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true, avatar: true, avatarColor: true, department: true, jobTitle: true, bio: true },
          },
        },
      },
      messages: {
        take: 1,
        orderBy: { createdAt: 'desc' },
        include: {
          sender: {
            select: { id: true, name: true, email: true },
          },
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  // 4-1. 고아 프로젝트/그룹 채널 필터링 & 중복 채널 완벽 제거 (Deduplication)
  const validChannels = rawChannels.filter((ch: any) => {
    // 삭제된 프로젝트나 접근 권한 없는 고아 프로젝트 채널 배제
    if (ch.type === 'PROJECT' && ch.projectId && !projectIds.includes(ch.projectId)) {
      return false;
    }
    // 삭제된 그룹이나 접근 권한 없는 고아 그룹 채널 배제
    if (ch.type === 'GROUP' && ch.groupId && !groupIds.includes(ch.groupId)) {
      return false;
    }
    return true;
  });

  const dedupedChannelsMap = new Map<string, any>();
  for (const ch of validChannels) {
    let key = `ID_${ch.id}`;
    if (ch.type === 'PROJECT' && ch.projectId) {
      key = `PROJECT_${ch.workspaceId}_${ch.projectId}`;
    } else if (ch.type === 'GROUP' && ch.groupId) {
      key = `GROUP_${ch.workspaceId}_${ch.groupId}`;
    } else if (ch.type === 'GLOBAL' || ch.type === 'GENERAL') {
      key = `GENERAL_${ch.workspaceId}_${ch.name}`;
    } else if (ch.type === 'DM') {
      const otherMember = ch.members?.find((m: any) => m.userId !== userId);
      const otherId = otherMember?.userId || 0;
      key = `DM_${ch.workspaceId}_${Math.min(userId, otherId)}_${Math.max(userId, otherId)}`;
    }

    if (dedupedChannelsMap.has(key)) {
      const prev = dedupedChannelsMap.get(key);
      if ((ch.messages?.length || 0) > (prev.messages?.length || 0)) {
        dedupedChannelsMap.set(key, ch);
      }
    } else {
      dedupedChannelsMap.set(key, ch);
    }
  }

  const channels = Array.from(dedupedChannelsMap.values());

  // 5. Unread Count & Notification Level 계산
  const result = await Promise.all(
    channels.map(async (channel: any) => {
      const membership = channel.members.find((m: any) => m.userId === userId);
      const lastReadAt = membership?.lastReadAt || new Date(0);

      const unreadCount = await gdb.chatMessage.count({
        where: {
          channelId: channel.id,
          createdAt: { gt: lastReadAt },
          senderId: { not: userId },
        },
      });

      return {
        id: channel.id,
        name: channel.name,
        type: channel.type,
        topic: channel.topic,
        icon: channel.icon,
        isPrivate: channel.isPrivate,
        workspaceId: channel.workspaceId,
        projectId: channel.projectId,
        groupId: channel.groupId,
        unreadCount,
        notificationLevel: membership?.notificationLevel || 'ALL',
        lastMessage: channel.messages[0]
          ? {
              id: channel.messages[0].id,
              content: channel.messages[0].content,
              senderName: channel.messages[0].sender?.name || channel.messages[0].sender?.email,
              createdAt: channel.messages[0].createdAt,
            }
          : null,
        members: channel.members.map((m: any) => ({
          id: m.id,
          userId: m.userId,
          role: m.role,
          notificationLevel: m.notificationLevel,
          user: m.user
            ? {
                id: m.user.id,
                name: m.user.name,
                email: m.user.email,
                avatar: m.user.avatar,
                avatarColor: m.user.avatarColor,
                department: m.user.department,
                jobTitle: m.user.jobTitle,
                bio: m.user.bio,
              }
            : undefined,
          name: m.user?.name,
          email: m.user?.email,
          avatar: m.user?.avatar,
          avatarColor: m.user?.avatarColor,
          department: m.user?.department,
          jobTitle: m.user?.jobTitle,
          bio: m.user?.bio,
        })),
        createdAt: channel.createdAt,
      };
    })
  );

  return result;
};
