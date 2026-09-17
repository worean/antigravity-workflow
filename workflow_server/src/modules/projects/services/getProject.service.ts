import { prisma } from '#lib/prisma.js';

export const getProjectService = async (
  id: number,
  currentUserId?: number,
  isAdmin: boolean = false
) => {
  if (!id) throw new Error('Project ID is required');
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, name: true, email: true, avatar: true, avatarColor: true } },
      members: { include: { user: { select: { id: true, name: true, email: true, avatar: true, avatarColor: true } } } },
      groups: {
        include: {
          group: {
            include: {
              parent: { select: { id: true, name: true, code: true } },
              members: {
                include: {
                  user: { select: { id: true, name: true, email: true, avatar: true, avatarColor: true } },
                },
              },
            },
          },
        },
      },
      status: true,
      priority: true,
      sprints: true,
      milestones: true,
      customFieldDefs: true,
      tags: true,
    },
  });

  if (!project) throw new Error('Project not found');

  // 🛡️ 접근 권한 검증 (Visibility Check)
  if (!isAdmin) {
    const visibility = project.visibility || 'PUBLIC';

    if (visibility === 'PUBLIC') {
      // 누구나 접근 가능
    } else if (visibility === 'PROTECTED') {
      const isOwner = currentUserId && project.ownerId === currentUserId;
      const isMember = currentUserId && project.members.some((m) => m.userId === currentUserId);
      const isGroupMember = currentUserId && project.groups.some((pg) =>
        pg.group?.members?.some((gm) => gm.userId === currentUserId)
      );

      if (!isOwner && !isMember && !isGroupMember) {
        throw new Error('Forbidden: You do not have access to this protected project');
      }
    } else if (visibility === 'PRIVATE') {
      const isOwner = currentUserId && project.ownerId === currentUserId;
      const isMember = currentUserId && project.members.some((m) => m.userId === currentUserId);

      if (!isOwner && !isMember) {
        throw new Error('Forbidden: You do not have access to this private project');
      }
    }
  }

  let isFavorite = false;
  if (currentUserId) {
    const fav = await prisma.favorite.findUnique({
      where: {
        userId_targetType_targetId: {
          userId: currentUserId,
          targetType: 'PROJECT',
          targetId: id,
        },
      },
    });
    isFavorite = !!fav;
  }

  return {
    ...project,
    isFavorite,
  };
};
