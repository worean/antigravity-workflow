import { prisma } from '#lib/prisma.js';

export const getProjectService = async (id: number) => {
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
      customFieldDefs: true
    }
  });

  if (!project) throw new Error('Project not found');
  return project;
};
