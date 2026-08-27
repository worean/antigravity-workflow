// -*- coding: utf-8 -*-
import { prisma, type PrismaTx } from '#lib/prisma.js';

export const getChannelsService = async (userId: number, tx?: PrismaTx) => {
  if (!userId) throw new Error('User ID is required');
  const db = tx ?? prisma;

  // 1. 유저가 속하거나 소유한 프로젝트 목록 조회
  const accessibleProjects = await db.project.findMany({
    where: {
      OR: [
        { ownerId: userId },
        { members: { some: { userId } } },
      ],
    },
    include: { members: true },
  });
  const projectIds = accessibleProjects.map((p) => p.id);

  // 2. 유저가 속한 그룹 목록 조회
  const accessibleGroups = await db.group.findMany({
    where: {
      members: { some: { userId } },
    },
    include: { members: true },
  });
  const groupIds = accessibleGroups.map((g) => g.id);

  // 3. 기본 GLOBAL 채널들이 없으면 개별 시드 생성
  const noticeChannel = await db.chatChannel.findFirst({ where: { type: 'GLOBAL', name: '전체-공지사항' } });
  if (!noticeChannel) {
    await db.chatChannel.create({
      data: { name: '전체-공지사항', type: 'GLOBAL', topic: '워크스페이스 전체 공지 및 중요 안내', icon: '📢' },
    });
  }

  const freeChannel = await db.chatChannel.findFirst({ where: { type: 'GLOBAL', name: '자유-수다방' } });
  if (!freeChannel) {
    await db.chatChannel.create({
      data: { name: '자유-수다방', type: 'GLOBAL', topic: '모든 구성원들의 자유로운 대화 공간', icon: '💬' },
    });
  }

  // 4. 각 프로젝트별 기본 채팅방 자동 프로비저닝 (없으면 자동 생성)
  for (const proj of accessibleProjects) {
    const existingChan = await db.chatChannel.findFirst({
      where: { type: 'PROJECT', projectId: proj.id },
    });
    if (!existingChan) {
      await db.chatChannel.create({
        data: {
          name: proj.name,
          type: 'PROJECT',
          topic: `${proj.name} (${proj.key}) 프로젝트 전용 대화방`,
          icon: '📁',
          projectId: proj.id,
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

  // 5. 각 그룹별 기본 채팅방 자동 프로비저닝 (없으면 자동 생성)
  for (const grp of accessibleGroups) {
    const existingChan = await db.chatChannel.findFirst({
      where: { type: 'GROUP', groupId: grp.id },
    });
    if (!existingChan) {
      await db.chatChannel.create({
        data: {
          name: grp.name,
          type: 'GROUP',
          topic: `${grp.name} (${grp.code}) 그룹/부서 전용 대화방`,
          icon: '👥',
          groupId: grp.id,
          members: {
            create: grp.members.map((m, idx) => ({
              userId: m.userId,
              role: idx === 0 ? 'OWNER' : 'MEMBER',
            })),
          },
        },
      });
    }
  }

  // 6. 접근 가능한 모든 채널 조회
  const channels = await db.chatChannel.findMany({
    where: {
      OR: [
        { type: 'GLOBAL' },
        { type: 'PROJECT', projectId: { in: projectIds } },
        { type: 'GROUP', groupId: { in: groupIds } },
        {
          type: 'DM',
          members: {
            some: { userId },
          },
        },
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
      project: {
        select: { id: true, name: true, key: true },
      },
      group: {
        select: { id: true, name: true, code: true },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  const favList = await db.favorite.findMany({
    where: { userId, targetType: 'CHAT_CHANNEL' },
    select: { targetId: true },
  });
  const favSet = new Set(favList.map((f) => f.targetId));

  // 5. 각 채널별 unreadCount 및 사용자 멤버십 메타데이터 가공
  const enrichedChannels = await Promise.all(
    channels.map(async (channel) => {
      const myMembership = channel.members.find((m) => m.userId === userId);
      const lastReadAt = myMembership?.lastReadAt || new Date(0);

      // 안 읽은 메시지 수 계산
      const unreadCount = await db.chatMessage.count({
        where: {
          channelId: channel.id,
          createdAt: { gt: lastReadAt },
          senderId: { not: userId },
        },
      });

      const lastMessage = channel.messages.length > 0 ? channel.messages[0] : null;

      // DM인 경우 상대방 정보 표시
      let displayName = channel.name;
      let displayAvatar: string | null = null;
      let displayAvatarColor: string | null = null;
      let otherUser: any = null;

      if (channel.type === 'DM') {
        const otherMember = channel.members.find((m) => m.userId !== userId);
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
        isFavorite: favSet.has(channel.id),
        projectId: channel.projectId,
        project: channel.project,
        groupId: channel.groupId,
        group: channel.group,
        memberCount: channel.members.length,
        members: channel.members.map((m) => ({
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

  // ⭐ 즐겨찾기 항목 최우선 상단 정렬
  enrichedChannels.sort((a, b) => {
    if (a.isFavorite === b.isFavorite) return 0;
    return a.isFavorite ? -1 : 1;
  });

  return enrichedChannels;
};