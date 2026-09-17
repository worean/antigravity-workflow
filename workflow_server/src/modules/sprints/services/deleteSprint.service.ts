import { prisma } from '#lib/prisma.js';

export const deleteSprintService = async (id: number) => {
  if (!id) throw new Error('Sprint ID is required');
  // 이슈들의 sprintId를 null로 해제
  await prisma.issue.updateMany({
    where: { sprintId: Number(id) },
    data: { sprintId: null }
  });
  await prisma.sprint.delete({
    where: { id: Number(id) }
  });
  return { message: 'Sprint deleted successfully' };
};