// -*- coding: utf-8 -*-
import { prisma } from '#lib/prisma.js';

export interface AddGroupMemberInput {
  groupId: number;
  userId: number;
  role?: string; // "LEADER", "MEMBER"
  title?: string;
}

export const addGroupMemberService = async (data: AddGroupMemberInput) => {
  const { groupId, userId, role = 'MEMBER', title } = data;
  if (!groupId || !userId) {
    throw new Error('Group ID and User ID are required');
  }

  // 그룹 및 사용자 존재 여부 확인
  const [group, user] = await Promise.all([
    prisma.group.findUnique({ where: { id: Number(groupId) } }),
    prisma.user.findUnique({ where: { id: Number(userId) } }),
  ]);

  if (!group) throw new Error(`Group with ID ${groupId} not found`);
  if (!user) throw new Error(`User with ID ${userId} not found`);

  return await prisma.groupMember.upsert({
    where: {
      groupId_userId: {
        groupId: Number(groupId),
        userId: Number(userId),
      },
    },
    create: {
      groupId: Number(groupId),
      userId: Number(userId),
      role: role.toUpperCase(),
      title: title?.trim() || null,
    },
    update: {
      role: role.toUpperCase(),
      title: title !== undefined ? title?.trim() || null : undefined,
    },
    include: {
      group: true,
      user: {
        select: { id: true, name: true, email: true, role: true, avatar: true, avatarColor: true },
      },
    },
  });
};
