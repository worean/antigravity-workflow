import { prisma } from '#lib/prisma.js';

export const updateUserService = async (id: number, data: { name?: string; email?: string }) => {
  if (!id) throw new Error('User ID is required');
  return await prisma.user.update({
    where: { id },
    data
  });
};
