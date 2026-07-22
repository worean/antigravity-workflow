import { prisma } from '#lib/prisma.js';

export const deleteUserService = async (id: number) => {
  if (!id) throw new Error('User ID is required');
  await prisma.user.delete({ where: { id } });
  return { message: 'User deleted successfully' };
};
