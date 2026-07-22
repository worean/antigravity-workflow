import { prisma } from '#lib/prisma.js';

export const updateSprintService = async (id: number, data: any) => {
  if (!id) throw new Error('Sprint ID is required');
  const { name, goal, status, startDate, endDate } = data;
  return await prisma.sprint.update({
    where: { id },
    data: {
      name,
      goal,
      status,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined
    }
  });
};
