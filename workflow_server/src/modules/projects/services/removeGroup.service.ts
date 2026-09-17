import { prisma } from '#lib/prisma.js';

export const removeGroupService = async (projectId: number, groupId: number, actorUserId?: number) => {
  if (!projectId || !groupId) throw new Error('projectId and groupId are required');

  const existing = await prisma.projectGroup.findUnique({
    where: {
      projectId_groupId: { projectId: Number(projectId), groupId: Number(groupId) },
    },
    include: {
      group: { select: { name: true, code: true } },
      project: { select: { name: true, key: true } },
    },
  });

  if (!existing) {
    throw new Error('Project group not found');
  }

  await prisma.projectGroup.delete({
    where: {
      projectId_groupId: { projectId: Number(projectId), groupId: Number(groupId) },
    },
  });

  try {
    const { createActivityLogService } = await import('../../activityLogs/services/createActivityLog.service.js');
    await createActivityLogService({
      action: 'REMOVE_GROUP',
      entityType: 'PROJECT_GROUP',
      entityId: projectId,
      userId: actorUserId || 0,
      summary: `프로젝트 '${existing.project.name}'에서 그룹 (${existing.group.name}) 제거`,
      details: { projectId, groupId },
    });
  } catch {}

  return { success: true, message: 'Group removed successfully' };
};