import { globalPrisma } from '#lib/globalPrisma.js';

export const getWorkspaceDetailService = async (workspaceId: number) => {
  if (!workspaceId) {
    throw new Error('Workspace ID is required');
  }

  const workspace = await globalPrisma.workspace.findUnique({
    where: { id: workspaceId },
    include: {
      owner: {
        select: {
          id: true,
          email: true,
          name: true,
          avatar: true,
        },
      },
      members: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              avatar: true,
              role: true,
            },
          },
        },
        orderBy: { joinedAt: 'asc' },
      },
    },
  });

  if (!workspace) {
    throw new Error('Workspace not found');
  }

  return {
    id: workspace.id,
    slug: workspace.slug,
    name: workspace.name,
    description: workspace.description,
    icon: workspace.icon,
    owner: workspace.owner,
    dbType: workspace.dbType,
    status: workspace.status,
    members: workspace.members.map((m) => ({
      id: m.id,
      userId: m.userId,
      role: m.role,
      status: m.status,
      joinedAt: m.joinedAt,
      user: m.user,
    })),
    createdAt: workspace.createdAt,
    updatedAt: workspace.updatedAt,
  };
};
