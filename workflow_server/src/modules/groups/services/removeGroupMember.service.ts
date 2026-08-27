// -*- coding: utf-8 -*-
import { prisma } from '#lib/prisma.js';

export const removeGroupMemberService = async (groupId: number, userId: number, currentUser?: any) => {
  if (!groupId || !userId) {
    throw new Error('Group ID and User ID are required');
  }

  const targetMember = await prisma.groupMember.findUnique({
    where: {
      groupId_userId: {
        groupId: Number(groupId),
        userId: Number(userId),
      },
    },
  });

  if (!targetMember) {
    throw new Error('Group member not found');
  }

  const isSuperAdmin = currentUser?.role === 'ADMIN';

  // 전역 관리자가 아닌 경우
  if (!isSuperAdmin && currentUser) {
    // 1. 본인 탈퇴인 경우
    if (userId === currentUser.id) {
      if (targetMember.role === 'OWNER') {
        const otherMembersCount = await prisma.groupMember.count({
          where: {
            groupId: Number(groupId),
            userId: { not: currentUser.id },
          },
        });
        if (otherMembersCount > 0) {
          throw new Error('Forbidden: 그룹 오너는 다른 멤버에게 오너 권한을 위임한 후 탈퇴하거나 그룹을 삭제해야 합니다.');
        }
      }
    } else {
      // 2. 다른 멤버 제외 시도
      const requesterMembership = await prisma.groupMember.findUnique({
        where: {
          groupId_userId: {
            groupId: Number(groupId),
            userId: currentUser.id,
          },
        },
      });

      const isGroupOwner = requesterMembership?.role?.toUpperCase() === 'OWNER';
      const isGroupAdmin = requesterMembership?.role?.toUpperCase() === 'ADMIN' || requesterMembership?.role?.toUpperCase() === 'LEADER';

      if (!isGroupOwner) {
        if (!isGroupAdmin) {
          throw new Error('Forbidden: 그룹 관리자 이상만 멤버를 제외할 수 있습니다.');
        }

        // 일반 그룹 관리자(ADMIN)는 OWNER 또는 다른 ADMIN 제외 불가
        if (targetMember.role === 'OWNER') {
          throw new Error('Forbidden: 그룹 오너는 제외할 수 없습니다.');
        }
        if (targetMember.role === 'ADMIN' || targetMember.role === 'LEADER') {
          throw new Error('Forbidden: 다른 그룹 관리자는 제외할 수 없습니다.');
        }
      }
    }
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
