// -*- coding: utf-8 -*-
import { prisma, type PrismaTx } from '#lib/prisma.js';

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

export const createChannelService = async (
  data: CreateChannelInput,
  tx?: PrismaTx
) => {
  const db = tx ?? prisma;
  const { name, type, topic, icon, projectId, groupId, targetUserId, memberUserIds, userId } = data;

  if (!userId) throw new Error('User ID is required');

  // 1. 1:1 DM 생성 처리
  if (type === 'DM') {
    if (!targetUserId) throw new Error('Target user ID is required for DM');
    if (targetUserId === userId) throw new Error('Cannot create DM with yourself');

    const targetUser = await db.user.findUnique({ where: { id: targetUserId } });
    if (!targetUser) throw new Error('Target user not found');

    // 이미 존재하는 DM 채널 확인
    const existingDM = await db.chatChannel.findFirst({
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
    const newDM = await db.chatChannel.create({
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
    const project = await db.project.findUnique({
      where: { id: projectId },
      include: { members: true },
    });
    if (!project) throw new Error('Project not found');

    const channelName = name?.trim() || project.name;

    // 동일 프로젝트 내 동일 이름 채널 중복 확인
    const existingChan = await db.chatChannel.findFirst({
      where: { projectId, name: channelName },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, avatar: true, avatarColor: true } },
          },
        },
        project: { select: { id: true, name: true, key: true } },
      },
    });

    if (existingChan) {
      return existingChan;
    }

    const newChannel = await db.chatChannel.create({
      data: {
        name: channelName,
        type: 'PROJECT',
        topic: topic || `${project.name} (${project.key}) 프로젝트 대화방`,
        icon: icon || '📁',
        projectId,
        members: {
          create: [
            { userId: project.ownerId, role: 'OWNER' },
            ...project.members
              .filter((m) => m.userId !== project.ownerId)
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
    const group = await db.group.findUnique({
      where: { id: groupId },
      include: { members: true },
    });
    if (!group) throw new Error('Group not found');

    const channelName = name?.trim() || group.name;

    // 동일 그룹 내 동일 이름 채널 중복 확인
    const existingChan = await db.chatChannel.findFirst({
      where: { groupId, name: channelName },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, avatar: true, avatarColor: true } },
          },
        },
        group: { select: { id: true, name: true, code: true } },
      },
    });

    if (existingChan) {
      return existingChan;
    }

    const newChannel = await db.chatChannel.create({
      data: {
        name: channelName,
        type: 'GROUP',
        topic: topic || `${group.name} (${group.code}) 그룹 채널`,
        icon: icon || '👥',
        groupId,
        members: {
          create: group.members.map((m, idx) => ({
            userId: m.userId,
            role: idx === 0 ? 'OWNER' : 'MEMBER',
          })),
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
  const newChannel = await db.chatChannel.create({
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