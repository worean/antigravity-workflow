import { globalPrisma } from '#lib/globalPrisma.js';

export const getMyWorkspacesService = async (userId: number) => {
  if (!userId) {
    throw new Error('User ID is required');
  }

  const memberships = await globalPrisma.userWorkspace.findMany({
    where: {
      userId,
      status: 'ACTIVE',
    },
    include: {
      workspace: {
        include: {
          _count: {
            select: { members: true },
          },
        },
      },
    },
    orderBy: { joinedAt: 'desc' },
  });

  return memberships.map((m) => ({
    id: m.workspace.id,
    slug: m.workspace.slug,
    name: m.workspace.name,
    description: m.workspace.description,
    icon: m.workspace.icon,
    ownerId: m.workspace.ownerId,
    dbType: m.workspace.dbType,
    status: m.workspace.status,
    myRole: m.role,
    memberCount: m.workspace._count.members,
    joinedAt: m.joinedAt,
    createdAt: m.workspace.createdAt,
    updatedAt: m.workspace.updatedAt,
  }));
};
