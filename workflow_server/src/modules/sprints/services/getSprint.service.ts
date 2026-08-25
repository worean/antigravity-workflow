// -*- coding: utf-8 -*-
import { prisma } from '#lib/prisma.js';

export const getSprintService = async (id: number) => {
  if (!id) throw new Error('Sprint ID is required');
  const sprint = await prisma.sprint.findUnique({
    where: { id: Number(id) },
    include: {
      project: { select: { id: true, name: true, key: true } },
      issues: {
        include: {
          status: true,
          priority: true,
          type: true,
          assignee: { select: { id: true, name: true, email: true, avatar: true, avatarColor: true } }
        },
        orderBy: { id: 'asc' }
      },
      _count: { select: { issues: true } }
    }
  });
  if (!sprint) throw new Error('Sprint not found');
  return sprint;
};