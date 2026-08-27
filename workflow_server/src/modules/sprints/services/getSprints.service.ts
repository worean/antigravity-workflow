// -*- coding: utf-8 -*-
import { prisma } from '#lib/prisma.js';

export const getSprintsService = async (projectId?: number, currentUserId?: number) => {
  const sprints = await prisma.sprint.findMany({
    where: projectId ? { projectId } : {},
    include: {
      project: { select: { id: true, name: true, key: true } },
      issues: {
        select: {
          id: true,
          title: true,
          statusId: true,
          status: { select: { id: true, name: true, category: true } },
          plannedStartDate: true,
          dueDate: true,
          progress: true
        }
      },
      _count: { select: { issues: true } }
    },
    orderBy: { createdAt: 'desc' }
  });

  if (!currentUserId) {
    return sprints.map((s) => ({ ...s, isFavorite: false }));
  }

  const favList = await prisma.favorite.findMany({
    where: { userId: currentUserId, targetType: 'SPRINT' },
    select: { targetId: true },
  });
  const favSet = new Set(favList.map((f) => f.targetId));

  const listWithFav = sprints.map((s) => ({
    ...s,
    isFavorite: favSet.has(s.id),
  }));

  listWithFav.sort((a, b) => {
    if (a.isFavorite === b.isFavorite) return 0;
    return a.isFavorite ? -1 : 1;
  });

  return listWithFav;
};