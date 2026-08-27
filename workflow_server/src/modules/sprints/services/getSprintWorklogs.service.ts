// -*- coding: utf-8 -*-
import { prisma } from '#lib/prisma.js';

export const getSprintWorklogsService = async (sprintId: number) => {
  if (!sprintId || isNaN(Number(sprintId))) {
    throw new Error('Valid Sprint ID is required');
  }

  const sprintIssues = await prisma.issue.findMany({
    where: { sprintId: Number(sprintId) },
    select: { id: true }
  });

  const issueIds = sprintIssues.map((iss) => iss.id);
  if (issueIds.length === 0) {
    return [];
  }

  const worklogs = await prisma.worklog.findMany({
    where: {
      issueId: { in: issueIds }
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          avatarColor: true
        }
      },
      issue: {
        select: {
          id: true,
          title: true,
          issueNumber: true,
          status: { select: { id: true, name: true, category: true } }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return worklogs;
};