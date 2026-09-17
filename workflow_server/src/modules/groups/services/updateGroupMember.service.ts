import { prisma } from '#lib/prisma.js';

export interface UpdateGroupMemberInput {
  groupId: number;
  userId: number;
  role?: string; // "OWNER", "ADMIN", "MEMBER", "VIEWER", "LEADER"
  title?: string;
}

export const updateGroupMemberService = async (data: UpdateGroupMemberInput, currentUser?: any) => {
  const { groupId, userId, role, title } = data;
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

  const normalizedRole = role ? role.toUpperCase() : undefined;
  const isSuperAdmin = currentUser?.role === 'ADMIN';

  let requesterRole: string | null = null;
  if (currentUser) {
    const requesterMembership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: Number(groupId),
          userId: currentUser.id,
        },
      },
    });
    requesterRole = requesterMembership?.role?.toUpperCase() || null;
  }

  const isGroupOwner = requesterRole === 'OWNER';
  const isGroupAdmin = requesterRole === 'ADMIN' || requesterRole === 'LEADER';

  // 1. 권한 체크: 시스템 전역 관리자나 그룹 오너는 모든 권한 설정 가능
  if (!isSuperAdmin && !isGroupOwner) {
    if (!isGroupAdmin) {
      throw new Error('Forbidden: 그룹 관리자 이상만 권한을 수정할 수 있습니다.');
    }

    // 그룹 ADMIN(일반 관리자)인 경우의 제약조건
    // 1-1. OWNER 지정 불가
    if (normalizedRole === 'OWNER') {
      throw new Error('Forbidden: 그룹 오너 권한 위임은 오너 또는 시스템 관리자만 가능합니다.');
    }

    // 1-2. 대상 멤버가 현재 OWNER인 경우 수정 불가
    if (targetMember.role === 'OWNER') {
      throw new Error('Forbidden: 그룹 오너의 권한은 수정할 수 없습니다.');
    }

    // 1-3. 대상 멤버가 현재 ADMIN인 경우 (타 관리자) 수정 불가
    const isTargetAdmin = targetMember.role === 'ADMIN' || targetMember.role === 'LEADER';
    if (isTargetAdmin && userId !== currentUser.id && normalizedRole !== undefined && normalizedRole !== targetMember.role) {
      throw new Error('Forbidden: 다른 그룹 관리자의 권한은 수정할 수 없습니다.');
    }

    // 1-4. 관리자 본인의 권한 수정 불가
    if (userId === currentUser.id && normalizedRole !== undefined && normalizedRole !== targetMember.role) {
      throw new Error('Forbidden: 관리자 본인의 권한은 직접 수정할 수 없습니다.');
    }
  }

  // 2. 만약 새 역할이 OWNER인 경우 -> 기존 OWNER를 찾아 ADMIN으로 자동 변경 (그룹당 오너 1명 보장)
  if (normalizedRole === 'OWNER' && targetMember.role !== 'OWNER') {
    return await prisma.$transaction(async (tx) => {
      // 기존 OWNER를 찾아 ADMIN으로 변경
      await tx.groupMember.updateMany({
        where: {
          groupId: Number(groupId),
          role: 'OWNER',
        },
        data: {
          role: 'ADMIN',
        },
      });

      // 대상 멤버를 OWNER로 승격
      return await tx.groupMember.update({
        where: {
          groupId_userId: {
            groupId: Number(groupId),
            userId: Number(userId),
          },
        },
        data: {
          role: 'OWNER',
          title: title !== undefined ? title.trim() || null : undefined,
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

  // 일반 업데이트
  return await prisma.groupMember.update({
    where: {
      groupId_userId: {
        groupId: Number(groupId),
        userId: Number(userId),
      },
    },
    data: {
      role: normalizedRole,
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
