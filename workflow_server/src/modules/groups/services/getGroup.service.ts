// -*- coding: utf-8 -*-
import { prisma } from '#lib/prisma.js';

export const getGroupService = async (id: number, currentUser?: any) => {
  if (!id) throw new Error('Group ID is required');

  const group = await prisma.group.findUnique({
    where: { id },
    include: {
      parent: true,
      children: {
        include: {
          members: {
            include: {
              user: {
                select: { id: true, name: true, email: true, role: true, avatar: true, avatarColor: true },
              },
            },
          },
        },
      },
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true, avatar: true, avatarColor: true },
          },
        },
      },
    },
  });

  if (!group) throw new Error(`Group with ID ${id} not found`);

  // 전역 관리자(ADMIN)가 아닌 경우: 본인이 소속된 그룹이거나 상위 부모 그룹에 소속되어 있는지 검증
  if (currentUser && currentUser.role !== 'ADMIN') {
    const isDirectMember = group.members.some((m) => m.userId === currentUser.id);
    if (!isDirectMember) {
      // 상위 부모 체인 탐색
      let currentParentId = group.parentId;
      let hasParentAccess = false;
      while (currentParentId) {
        const parentMembership = await prisma.groupMember.findUnique({
          where: {
            groupId_userId: {
              groupId: currentParentId,
              userId: currentUser.id,
            },
          },
        });
        if (parentMembership) {
          hasParentAccess = true;
          break;
        }
        const parentGroup = await prisma.group.findUnique({
          where: { id: currentParentId },
          select: { parentId: true },
        });
        currentParentId = parentGroup?.parentId || null;
      }

      if (!hasParentAccess) {
        throw new Error('Forbidden: 본인이 속한 그룹의 정보만 조회할 수 있습니다.');
      }
    }
  }

  return group;
};
