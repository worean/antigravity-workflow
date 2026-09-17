import { prisma } from '#lib/prisma.js';

export interface AddGroupMemberInput {
  groupId: number;
  userId: number;
  role?: string; // "OWNER", "ADMIN", "MEMBER", "VIEWER", "LEADER"
  title?: string;
}

export const addGroupMemberService = async (data: AddGroupMemberInput, currentUser?: any) => {
  const { groupId, userId, role = 'MEMBER', title } = data;
  if (!groupId || !userId) {
    throw new Error('Group ID and User ID are required');
  }

  // 그룹 및 사용자 존재 여부 확인
  const [group, user] = await Promise.all([
    prisma.group.findUnique({ where: { id: Number(groupId) }, include: { members: true } }),
    prisma.user.findUnique({ where: { id: Number(userId) } }),
  ]);

  if (!group) throw new Error(`Group with ID ${groupId} not found`);
  if (!user) throw new Error(`User with ID ${userId} not found`);

  const normalizedRole = role.toUpperCase();
  const isSuperAdmin = currentUser?.role === 'ADMIN';

  const requesterMembership = currentUser
    ? group.members.find((m) => m.userId === currentUser.id)
    : null;

  const isGroupOwner = requesterMembership?.role?.toUpperCase() === 'OWNER';
  const isGroupAdmin = requesterMembership?.role?.toUpperCase() === 'ADMIN' || requesterMembership?.role?.toUpperCase() === 'LEADER';

  if (!isSuperAdmin && !isGroupOwner) {
    if (!isGroupAdmin) {
      throw new Error('Forbidden: 그룹 관리자 이상만 새로운 멤버를 추가할 수 있습니다.');
    }
    if (normalizedRole === 'OWNER') {
      throw new Error('Forbidden: 그룹 오너 권한 부여는 오너 또는 시스템 관리자만 가능합니다.');
    }
  }

  if (normalizedRole === 'OWNER') {
    return await prisma.$transaction(async (tx) => {
      // 기존 OWNER를 ADMIN으로 변경
      await tx.groupMember.updateMany({
        where: {
          groupId: Number(groupId),
          role: 'OWNER',
        },
        data: {
          role: 'ADMIN',
        },
      });

      return await tx.groupMember.upsert({
        where: {
          groupId_userId: {
            groupId: Number(groupId),
            userId: Number(userId),
          },
        },
        create: {
          groupId: Number(groupId),
          userId: Number(userId),
          role: 'OWNER',
          title: title?.trim() || null,
        },
        update: {
          role: 'OWNER',
          title: title !== undefined ? title?.trim() || null : undefined,
        },
        include: {
          group: true,
          user: {
            select: { id: true, name: true, email: true, role: true, avatar: true, avatarColor: true },
          },
        },
      });
    });
  }

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
      role: normalizedRole,
      title: title?.trim() || null,
    },
    update: {
      role: normalizedRole,
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
