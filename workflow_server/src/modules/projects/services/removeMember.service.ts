import { prisma } from '#lib/prisma.js';

export const removeMemberService = async (projectId: number, userId: number, actorUserId?: number) => {
  if (!projectId || !userId) throw new Error('projectId and userId are required');

  const existing = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: { projectId: Number(projectId), userId: Number(userId) },
    },
    include: {
      user: { select: { name: true, email: true } },
      project: { select: { name: true, key: true, ownerId: true } },
    },
  });

  if (!existing) {
    throw new Error('Project member not found');
  }

  // Owner cannot be removed from members
  if (existing.project.ownerId === Number(userId)) {
    throw new Error('Project owner cannot be removed from project members');
  }

  await prisma.projectMember.delete({
    where: {
      projectId_userId: { projectId: Number(projectId), userId: Number(userId) },
    },
  });

  try {
    const { createActivityLogService } = await import('../../activityLogs/services/createActivityLog.service.js');
    await createActivityLogService({
      action: 'REMOVE_MEMBER',
      entityType: 'PROJECT_MEMBER',
      entityId: projectId,
      userId: actorUserId || userId,
      summary: `프로젝트 '${existing.project.name}'에서 멤버 (${existing.user.name || existing.user.email}) 제거`,
      details: { projectId, userId },
    });
  } catch {}

  return { success: true, message: 'Member removed successfully' };
};