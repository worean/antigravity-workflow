import { prisma } from '#lib/prisma.js';

export const createSprintService = async (data: any) => {
  const { name, goal, startDate, endDate, projectId, status } = data;
  if (!name || !projectId) throw new Error('name and projectId are required');
  return await prisma.sprint.create({
    data: {
      name,
      goal,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      projectId: Number(projectId),
      status: status || 'PLANNED'
    }
  });
};
