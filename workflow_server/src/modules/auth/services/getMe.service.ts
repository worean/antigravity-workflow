import { prisma } from '#lib/prisma.js';

export const getMeService = async (userId: number) => {
  if (!userId) {
    throw new Error('User ID is required');
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      avatar: true,
      avatarColor: true,
      pushToken: true,
      preferences: true,
      createdAt: true,
      updatedAt: true,
      groupMemberships: {
        include: {
          group: {
            include: {
              parent: {
                select: { id: true, name: true, code: true }
              }
            }
          }
        },
        orderBy: { joinedAt: 'asc' }
      }
    }
  });

  if (!user) {
    throw new Error('User not found');
  }

  return user;
};
