// -*- coding: utf-8 -*-
import { prisma } from '#lib/prisma.js';

export const removeGroupMemberService = async (groupId: number, userId: number) => {
  if (!groupId || !userId) {
    throw new Error('Group ID and User ID are required');
  }

  return await prisma.groupMember.delete({
    where: {
      groupId_userId: {
        groupId: Number(groupId),
        userId: Number(userId),
      },
    },
  });
};
