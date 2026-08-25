import { prisma } from '#lib/prisma.js';

export const getUsersService = async () => {
  return await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true, avatar: true, avatarColor: true, preferences: true, createdAt: true, updatedAt: true },
  });
};
