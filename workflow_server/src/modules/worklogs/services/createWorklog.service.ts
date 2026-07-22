import { prisma } from '#lib/prisma.js';

export const createWorklogService = async (issueId: number, data: any) => {
  const { userId, timeSpent, description, startedAt } = data;
  if (!issueId || !userId || !timeSpent) throw new Error('issueId, userId, and timeSpent are required');

  const worklog = await prisma.worklog.create({
    data: {
      issueId,
      userId: Number(userId),
      timeSpent: Number(timeSpent),
      description,
      startedAt: startedAt ? new Date(startedAt) : undefined
    }
  });

  const timeSpentHours = Number(timeSpent) / 60.0;
  await prisma.issue.update({
    where: { id: issueId },
    data: { loggedHours: { increment: timeSpentHours } }
  });

  return worklog;
};
