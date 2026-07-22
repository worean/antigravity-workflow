import { prisma } from '#lib/prisma.js';

export const updateProjectService = async (id: number, data: any) => {
  if (!id) throw new Error('Project ID is required');
  const { name, description, statusId, priorityId } = data;
  return await prisma.project.update({
    where: { id },
    data: { name, description, statusId: statusId ? Number(statusId) : undefined, priorityId: priorityId ? Number(priorityId) : undefined }
  });
};
