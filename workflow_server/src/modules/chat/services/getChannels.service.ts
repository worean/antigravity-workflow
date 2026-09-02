import { globalPrisma } from '#lib/globalPrisma.js';
import { prisma as workspacePrisma } from '#lib/prisma.js';

export const getChannelsService = async (
  userId: number,
  currentWorkspace?: any,
  customDb?: any
) => {
  if (!userId) throw new Error('User ID is required');
  const gdb = (customDb ?? globalPrisma) as any;

  // 1. 기본 전체 채널 시드 생성
  const noticeChannel = await gdb.chatChannel.findFirst({
    where: { OR: [{ type: 'GLOBAL' }, { type: 'GENERAL' }], name: '전체-공지사항' },
  });
  if (!noticeChannel) {
    await gdb.chatChannel.create({
      data: { name: '전체-공지사항', type: 'GENERAL', topic: '전체 공지 및 중요 안내', icon: '📢', workspaceId: currentWorkspace?.id || null },
    });
  }

  const freeChannel = await gdb.chatChannel.findFirst({
    where: { OR: [{ type: 'GLOBAL' }, { type: 'GENERAL' }], name: '자유-수다방' },
  });
  if (!freeChannel) {
    await gdb.chatChannel.create({
      data: { name: '자유-수다방', type: 'GENERAL', topic: '자유로운 대화 공간', icon: '💬', workspaceId: currentWorkspace?.id || null },
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
        where: { type: 'PROJECT', projectId: proj.id },
      });
      if (!existingChan) {
        await gdb.chatChannel.create({
          data: {
            name: proj.name,
            type: 'PROJECT',
            topic: `${proj.name} (${proj.key}) 프로젝트 전용 대화방`,
            icon: '📁',
            projectId: proj.id,
            workspaceId: currentWorkspace?.id || null,
            members: {
              create: [
                { userId: proj.ownerId, role: 'OWNER' },
                ...proj.members
                  .filter((m: any) => m.userId !== proj.ownerId)
                  .map((m: any) => ({ userId: m.userId, role: 'MEMBER' })),
              ],
            },
          },
        });
      }
    }
  } catch {}

  // 3. 유저가 접근 가능한 그룹 목록 및 채널 동기화
  let groupIds: number[] = [];
  try {
    const accessibleGroups = await workspacePrisma.group.findMany({
      where: { members: { some: { userId } } },
      include: { members: true },
    });
    groupIds = accessibleGroups.map((g) => g.id);

    for (const grp of accessibleGroups) {
      const existingChan = await gdb.chatChannel.findFirst({
        where: { type: 'GROUP', groupId: grp.id },
      });
      if (!existingChan) {
        await gdb.chatChannel.create({
          data: {
            name: grp.name,
            type: 'GROUP',
            topic: `${grp.name} (${grp.code}) 그룹/부서 전용 대화방`,
            icon: '👥',
            groupId: grp.id,
            workspaceId: currentWorkspace?.id || null,
            members: {
              create: grp.members.map((m: any, idx: number) => ({
                userId: m.userId,
                role: idx === 0 ? 'OWNER' : 'MEMBER',
              })),
            },
          },
        });
      }
    }
  } catch {}

  // 4. 접근 가능한 모든 채널 조회
  const channels = await gdb.chatChannel.findMany({
    where: {
      OR: [
        { type: 'GLOBAL' },
        { type: 'GENERAL' },
        {
          type: 'DM',
          members: { some: { userId } },
        },
        ...(projectIds.length > 0 ? [{ type: 'PROJECT', projectId: { in: projectIds } }] : []),
        ...(groupIds.length > 0 ? [{ type: 'GROUP', groupId: { in: groupIds } }] : []),
      ],
    },
    include: {
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true, avatar: true, avatarColor: true },
          },
        },
      },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: {
          sender: {
            select: { id: true, name: true, avatar: true, avatarColor: true },
          },
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  // 5. 채널별 unreadCount 및 사용자 멤버십 메타데이터 가공
  const enrichedChannels = await Promise.all(
    channels.map(async (channel: any) => {
      const myMembership = channel.members.find((m: any) => m.userId === userId);
      const lastReadAt = myMembership?.lastReadAt || new Date(0);

      const unreadCount = await gdb.chatMessage.count({
        where: {
          channelId: channel.id,
          createdAt: { gt: lastReadAt },
          senderId: { not: userId },
        },
      });

      const lastMessage = channel.messages.length > 0 ? channel.messages[0] : null;

      let displayName = channel.name;
      let displayAvatar: string | null = null;
      let displayAvatarColor: string | null = null;
      let otherUser: any = null;

      if (channel.type === 'DM') {
        const otherMember = channel.members.find((m: any) => m.userId !== userId);
        if (otherMember?.user) {
          otherUser = otherMember.user;
          displayName = otherMember.user.name || otherMember.user.email;
          displayAvatar = otherMember.user.avatar;
          displayAvatarColor = otherMember.user.avatarColor;
        }
      }

      return {
        id: channel.id,
        name: displayName,
        rawName: channel.name,
        type: channel.type,
        topic: channel.topic,
        icon: channel.icon,
        isPrivate: channel.isPrivate,
        workspaceId: channel.workspaceId,
        projectId: channel.projectId,
        groupId: channel.groupId,
        memberCount: channel.members.length,
        members: channel.members.map((m: any) => ({
          id: m.id,
          userId: m.userId,
          role: m.role,
          notificationLevel: m.notificationLevel,
          mutedUntil: m.mutedUntil,
          user: m.user,
        })),
        mySettings: myMembership
          ? {
              notificationLevel: myMembership.notificationLevel,
              mutedUntil: myMembership.mutedUntil,
              lastReadAt: myMembership.lastReadAt,
            }
          : {
              notificationLevel: 'ALL',
              mutedUntil: null,
              lastReadAt: new Date(),
            },
        lastMessage: lastMessage
          ? {
              id: lastMessage.id,
              content: lastMessage.content,
              senderId: lastMessage.senderId,
              senderName: lastMessage.sender.name,
              createdAt: lastMessage.createdAt,
            }
          : null,
        unreadCount,
        displayAvatar,
        displayAvatarColor,
        otherUser,
        createdAt: channel.createdAt,
        updatedAt: channel.updatedAt,
      };
    })
  );

  return enrichedChannels;
};
