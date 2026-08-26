// -*- coding: utf-8 -*-
import { prisma } from '#lib/prisma.js';

export const getChannelsService = async (userId: number) => {
  if (!userId) throw new Error('User ID is required');

  // 1. 유저가 속한 프로젝트 ID 목록 조회
  const userProjects = await prisma.projectMember.findMany({
    where: { userId },
    select: { projectId: true },
  });
  const projectIds = userProjects.map((p) => p.projectId);

  // 2. 유저가 속한 그룹 ID 목록 조회
  const userGroups = await prisma.groupMember.findMany({
    where: { userId },
    select: { groupId: true },
  });
  const groupIds = userGroups.map((g) => g.groupId);

  // 3. 기본 GLOBAL 채널들이 없으면 개별 시드 생성
  const noticeChannel = await prisma.chatChannel.findFirst({ where: { type: 'GLOBAL', name: '전체-공지사항' } });
  if (!noticeChannel) {
    await prisma.chatChannel.create({
      data: { name: '전체-공지사항', type: 'GLOBAL', topic: '워크스페이스 전체 공지 및 중요 안내', icon: '📢' },
    });
  }

  const freeChannel = await prisma.chatChannel.findFirst({ where: { type: 'GLOBAL', name: '자유-수다방' } });
  if (!freeChannel) {
    await prisma.chatChannel.create({
      data: { name: '자유-수다방', type: 'GLOBAL', topic: '모든 구성원들의 자유로운 대화 공간', icon: '💬' },
    });
  }

  // 4. 접근 가능한 모든 채널 조회
  const channels = await prisma.chatChannel.findMany({
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

  // 5. 각 채널별 unreadCount 및 사용자 멤버십 메타데이터 가공
  const enrichedChannels = await Promise.all(
    channels.map(async (channel) => {
      const myMembership = channel.members.find((m) => m.userId === userId);
      const lastReadAt = myMembership?.lastReadAt || new Date(0);

      // 안 읽은 메시지 수 계산
      const unreadCount = await prisma.chatMessage.count({
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

  return enrichedChannels;
};