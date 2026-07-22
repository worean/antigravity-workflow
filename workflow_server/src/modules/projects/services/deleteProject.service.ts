import { prisma } from '#lib/prisma.js';

export const deleteProjectService = async (id: number) => {
  if (!id) throw new Error('Project ID is required');
  await prisma.project.delete({ where: { id } });
  return { message: 'Project deleted' };
};
