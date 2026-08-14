// -*- coding: utf-8 -*-
import { prisma } from '#lib/prisma.js';

export interface UpdateGroupInput {
  name?: string;
  code?: string;
  description?: string;
  parentId?: number | null;
  order?: number;
}

export const updateGroupService = async (id: number, data: UpdateGroupInput) => {
  if (!id) throw new Error('Group ID is required');

  // 자기 자신을 부모로 지정하는 순환 참조 방지
  if (data.parentId !== undefined && data.parentId === id) {
    throw new Error('A group cannot be its own parent');
  }

  // 상위 그룹 존재 여부 검증
  if (data.parentId) {
    const parent = await prisma.group.findUnique({ where: { id: Number(data.parentId) } });
    if (!parent) {
      throw new Error(`Parent group with ID ${data.parentId} not found`);
    }
  }

  return await prisma.group.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name.trim() }),
      ...(data.code !== undefined && { code: data.code?.trim() || null }),
      ...(data.description !== undefined && { description: data.description?.trim() || null }),
      ...(data.parentId !== undefined && { parentId: data.parentId ? Number(data.parentId) : null }),
      ...(data.order !== undefined && { order: Number(data.order) }),
    },
    include: {
      parent: true,
      children: true,
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
      },
    },
  });
};
