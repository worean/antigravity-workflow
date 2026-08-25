// -*- coding: utf-8 -*-
import { prisma } from '#lib/prisma.js';

export interface CreateGroupInput {
  name: string;
  code?: string;
  description?: string;
  parentId?: number | null;
  order?: number;
}

export const createGroupService = async (data: CreateGroupInput, currentUser?: any) => {
  if (!data.name || !data.name.trim()) {
    throw new Error('Group name is required');
  }

  // 상위 그룹이 지정된 경우 상위 그룹 존재 및 권한 확인
  if (data.parentId) {
    const parent = await prisma.group.findUnique({
      where: { id: Number(data.parentId) },
      include: { members: true },
    });
    if (!parent) {
      throw new Error(`Parent group with ID ${data.parentId} not found`);
    }

    if (currentUser && currentUser.role !== 'ADMIN') {
      const isParentAdmin = parent.members.some(
        (m) => m.userId === currentUser.id && (m.role === 'OWNER' || m.role === 'ADMIN' || m.role === 'LEADER')
      );
      if (!isParentAdmin) {
        throw new Error('Forbidden: 상위 그룹의 관리자만 하위 그룹을 생성할 수 있습니다.');
      }
    }
  }

  return await prisma.group.create({
    data: {
      name: data.name.trim(),
      code: data.code?.trim() || null,
      description: data.description?.trim() || null,
      parentId: data.parentId ? Number(data.parentId) : null,
      order: data.order !== undefined ? Number(data.order) : 0,
      ...(currentUser && {
        members: {
          create: {
            userId: currentUser.id,
            role: 'OWNER',
            title: '그룹 오너',
          },
        },
      }),
    },
    include: {
      parent: true,
      children: true,
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true, avatar: true, avatarColor: true },
          },
        },
      },
    },
  });
};
