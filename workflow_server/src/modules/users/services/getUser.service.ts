import { prisma } from '#lib/prisma.js';

export const getUserService = async (id: number) => {
  if (!id) throw new Error('User ID is required');
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      avatar: true,
      avatarColor: true,
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
  if (!user) throw new Error('User not found');
  return user;
};

