// -*- coding: utf-8 -*-
import { prisma } from '#lib/prisma.js';

export interface GetGroupsOptions {
  asTree?: boolean;
}

export const getGroupsService = async (options: GetGroupsOptions = {}, currentUser?: any) => {
  let whereClause = {};

  // 전역 시스템 관리자(ADMIN)가 아닌 경우: 본인이 소속된 그룹 및 하위 서브그룹만 접근 허용
  if (currentUser && currentUser.role !== 'ADMIN') {
    const userMemberships = await prisma.groupMember.findMany({
      where: { userId: currentUser.id },
      select: { groupId: true },
    });

    const memberGroupIds = userMemberships.map((m) => m.groupId);

    if (memberGroupIds.length === 0) {
      return [];
    }

    // 소속 그룹 및 하위 서브그룹 재귀 수집
    const allGroups = await prisma.group.findMany({
      select: { id: true, parentId: true },
    });

    const accessibleGroupIds = new Set<number>(memberGroupIds);
    let added = true;
    while (added) {
      added = false;
      for (const g of allGroups) {
        if (g.parentId && accessibleGroupIds.has(g.parentId) && !accessibleGroupIds.has(g.id)) {
          accessibleGroupIds.add(g.id);
          added = true;
        }
      }
    }

    whereClause = { id: { in: Array.from(accessibleGroupIds) } };
  }

  const groups = await prisma.group.findMany({
    where: whereClause,
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
            select: { id: true, name: true, email: true, role: true, avatar: true, avatarColor: true },
          },
        },
      },
    },
  });

  if (options.asTree) {
    // 계층형 트리 구조로 변환 (접근 가능한 그룹 집합 내에서 루트 연결)
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
