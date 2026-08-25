// -*- coding: utf-8 -*-
import { prisma } from '#lib/prisma.js';

export const getSprintsService = async (projectId?: number) => {
  return await prisma.sprint.findMany({
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
};