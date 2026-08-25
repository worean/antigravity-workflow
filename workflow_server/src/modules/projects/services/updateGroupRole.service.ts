// -*- coding: utf-8 -*-
import { prisma } from '#lib/prisma.js';

export const updateGroupRoleService = async (projectId: number, groupId: number, role: string, actorUserId?: number) => {
  if (!projectId || !groupId || !role) throw new Error('projectId, groupId, and role are required');

  const updated = await prisma.projectGroup.update({
    where: {
      projectId_groupId: { projectId: Number(projectId), groupId: Number(groupId) },
    },
    data: { role },
    include: {
      group: {
        include: {
          parent: { select: { id: true, name: true, code: true } },
        },
      },
      project: { select: { name: true, key: true } },
    },
  });

  try {
    const { createActivityLogService } = await import('../../activityLogs/services/createActivityLog.service.js');
    await createActivityLogService({
      action: 'UPDATE_GROUP_ROLE',
      entityType: 'PROJECT_GROUP',
      entityId: projectId,
      userId: actorUserId || 0,
      summary: `프로젝트 '${updated.project.name}' 그룹 (${updated.group.name}) 역할 변경 -> ${role}`,
      details: { projectId, groupId, role },
    });
  } catch {}

  return updated;
};