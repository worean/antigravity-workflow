// -*- coding: utf-8 -*-
import { prisma } from '#lib/prisma.js';

export interface GetGroupsOptions {
  asTree?: boolean;
}

export const getGroupsService = async (options: GetGroupsOptions = {}) => {
  const groups = await prisma.group.findMany({
    orderBy: [
      { order: 'asc' },
      { name: 'asc' },
    ],
    include: {
      parent: {
        select: { id: true, name: true, code: true },
      },
      children: {
        select: { id: true, name: true, code: true, order: true },
      },
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
      },
    },
  });

  if (options.asTree) {
    // 계층형 트리 구조로 변환 (루트 그룹에 children 재귀 연결)
    const map = new Map<number, any>();
    groups.forEach((g) => {
      map.set(g.id, { ...g, childrenList: [] });
    });

    const rootNodes: any[] = [];
    groups.forEach((g) => {
      const node = map.get(g.id);
      if (g.parentId && map.has(g.parentId)) {
        map.get(g.parentId).childrenList.push(node);
      } else {
        rootNodes.push(node);
      }
    });

    return rootNodes;
  }

  return groups;
};
