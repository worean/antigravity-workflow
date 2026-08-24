// -*- coding: utf-8 -*-
import { prisma } from '#lib/prisma.js';

export interface UpdateGroupMemberInput {
  groupId: number;
  userId: number;
  role?: string; // "ADMIN", "MEMBER", "VIEWER", "LEADER"
  title?: string;
}

export const updateGroupMemberService = async (data: UpdateGroupMemberInput) => {
  const { groupId, userId, role, title } = data;
  if (!groupId || !userId) {
    throw new Error('Group ID and User ID are required');
  }

  const member = await prisma.groupMember.findUnique({
    where: {
      groupId_userId: {
        groupId: Number(groupId),
        userId: Number(userId),
      },
    },
  });

  if (!member) {
    throw new Error('Group member not found');
  }

  return await prisma.groupMember.update({
    where: {
      groupId_userId: {
        groupId: Number(groupId),
        userId: Number(userId),
      },
    },
    data: {
      role: role !== undefined ? role.toUpperCase() : undefined,
      title: title !== undefined ? title.trim() || null : undefined,
    },
    include: {
      group: true,
      user: {
        select: { id: true, name: true, email: true, role: true, avatar: true, avatarColor: true },
      },
    },
  });
};
