import { prisma } from '#lib/prisma.js';

export const createWorklogService = async (issueId: number, data: any) => {
  const { userId, timeSpent, timeSpentHours, description, startedAt } = data;

  let finalMinutes: number;
  if (timeSpentHours !== undefined && timeSpentHours !== null) {
    finalMinutes = Math.round(Number(timeSpentHours) * 60);
  } else if (timeSpent !== undefined && timeSpent !== null) {
    finalMinutes = Math.round(Number(timeSpent));
  } else {
    throw new Error('timeSpent or timeSpentHours is required');
  }

  if (!issueId || !userId || isNaN(finalMinutes) || finalMinutes <= 0) {
    throw new Error('Valid issueId, userId, and positive time duration are required');
  }

  const worklog = await prisma.worklog.create({
    data: {
      issueId: Number(issueId),
      userId: Number(userId),
      timeSpent: finalMinutes,
      description: description ? String(description) : undefined,
      startedAt: startedAt ? new Date(startedAt) : undefined
    },
    include: {
      user: { select: { id: true, name: true, email: true, avatar: true, avatarColor: true } }
    }
  });

  const hoursToIncrement = finalMinutes / 60.0;
  await prisma.issue.update({
    where: { id: Number(issueId) },
    data: { loggedHours: { increment: hoursToIncrement } }
  });

  return worklog;
};

