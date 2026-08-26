// -*- coding: utf-8 -*-
import { prisma } from '#lib/prisma.js';

export interface CreateChannelInput {
  name?: string;
  type: 'GLOBAL' | 'PROJECT' | 'GROUP' | 'DM';
  topic?: string;
  icon?: string;
  projectId?: number;
  groupId?: number;
  targetUserId?: number; // DM 상대방 ID
  memberUserIds?: number[]; // 초대할 멤버 ID 목록
  userId: number; // 생성 요청자 ID
}

export const createChannelService = async (data: CreateChannelInput) => {
  const { name, type, topic, icon, projectId, groupId, targetUserId, memberUserIds, userId } = data;

  if (!userId) throw new Error('User ID is required');

  // 1. 1:1 DM 생성 처리
  if (type === 'DM') {
    if (!targetUserId) throw new Error('Target user ID is required for DM');
    if (targetUserId === userId) throw new Error('Cannot create DM with yourself');

    const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!targetUser) throw new Error('Target user not found');

    // 이미 존재하는 DM 채널 확인
    const existingDM = await prisma.chatChannel.findFirst({
      where: {
        type: 'DM',
        AND: [
          { members: { some: { userId } } },
          { members: { some: { userId: targetUserId } } },
        ],
      },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, avatar: true, avatarColor: true } },
          },
        },
      },
    });

    if (existingDM) {
      return existingDM;
    }

    // 신규 DM 생성
    const newDM = await prisma.chatChannel.create({
      data: {
        name: `DM_${Math.min(userId, targetUserId)}_${Math.max(userId, targetUserId)}`,
        type: 'DM',
        icon: '💬',
        members: {
          create: [
            { userId, role: 'MEMBER' },
            { userId: targetUserId, role: 'MEMBER' },
          ],
        },
      },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, avatar: true, avatarColor: true } },
          },
        },
      },
    });

    return newDM;
  }

  // 2. 프로젝트 채널 생성 처리
  if (type === 'PROJECT') {
    if (!projectId) throw new Error('Project ID is required for project channel');
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { members: true },
    });
    if (!project) throw new Error('Project not found');

    const channelName = name?.trim() || '일반';
    const newChannel = await prisma.chatChannel.create({
      data: {
        name: channelName,
        type: 'PROJECT',
        topic: topic || `${project.name} 프로젝트 대화방`,
        icon: icon || '📁',
        projectId,
        members: {
          create: [
            { userId, role: 'OWNER' },
            ...project.members
              .filter((m) => m.userId !== userId)
              .map((m) => ({ userId: m.userId, role: 'MEMBER' })),
          ],
        },
      },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, avatar: true, avatarColor: true } },
          },
        },
        project: { select: { id: true, name: true, key: true } },
      },
    });

    return newChannel;
  }

  // 3. 그룹 채널 생성 처리
  if (type === 'GROUP') {
    if (!groupId) throw new Error('Group ID is required for group channel');
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: { members: true },
    });
    if (!group) throw new Error('Group not found');

    const channelName = name?.trim() || group.name;
    const newChannel = await prisma.chatChannel.create({
      data: {
        name: channelName,
        type: 'GROUP',
        topic: topic || `${group.name} 그룹 채널`,
        icon: icon || '👥',
        groupId,
        members: {
          create: [
            { userId, role: 'OWNER' },
            ...group.members
              .filter((m) => m.userId !== userId)
              .map((m) => ({ userId: m.userId, role: 'MEMBER' })),
          ],
        },
      },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, avatar: true, avatarColor: true } },
          },
        },
        group: { select: { id: true, name: true, code: true } },
      },
    });

    return newChannel;
  }

  // 4. 일반 GLOBAL 채널 생성
  const channelName = name?.trim() || '새 채널';
  const newChannel = await prisma.chatChannel.create({
    data: {
      name: channelName,
      type: 'GLOBAL',
      topic: topic || '전체 공개 채널',
      icon: icon || '🌐',
      members: {
        create: [{ userId, role: 'OWNER' }],
      },
    },
    include: {
      members: {
        include: {
          user: { select: { id: true, name: true, email: true, avatar: true, avatarColor: true } },
        },
      },
    },
  });

  return newChannel;
};