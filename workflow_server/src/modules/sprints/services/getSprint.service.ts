import { prisma } from '#lib/prisma.js';

export const getSprintService = async (id: number, currentUserId?: number) => {
  if (!id) throw new Error('Sprint ID is required');
  const sprint = await prisma.sprint.findUnique({
    where: { id: Number(id) },
    include: {
      project: { select: { id: true, name: true, key: true } },
      issues: {
        include: {
          status: true,
          priority: true,
          type: true,
          assignee: { select: { id: true, name: true, email: true, avatar: true, avatarColor: true } }
        },
        orderBy: { id: 'asc' }
      },
      _count: { select: { issues: true } }
    }
  });
  if (!sprint) throw new Error('Sprint not found');

  let isFavorite = false;
  if (currentUserId) {
    const fav = await prisma.favorite.findUnique({
      where: {
        userId_targetType_targetId: {
          userId: currentUserId,
          targetType: 'SPRINT',
          targetId: sprint.id
        }
      }
    });
    isFavorite = !!fav;
  }

  return { ...sprint, isFavorite };
};