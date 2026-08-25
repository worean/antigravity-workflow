// -*- coding: utf-8 -*-
import { prisma } from '#lib/prisma.js';

export const addGroupService = async (projectId: number, groupId: number, role?: string, actorUserId?: number) => {
  if (!projectId || !groupId) throw new Error('projectId and groupId are required');

  const projectGroup = await prisma.projectGroup.create({
    data: {
      projectId: Number(projectId),
      groupId: Number(groupId),
      role: role || 'MEMBER',
    },
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
      project: { select: { name: true, key: true } },
    },
  });

  try {
    const { createActivityLogService } = await import('../../activityLogs/services/createActivityLog.service.js');
    await createActivityLogService({
      action: 'ASSIGN_GROUP',
      entityType: 'PROJECT_GROUP',
      entityId: projectId,
      userId: actorUserId || 0,
      summary: `프로젝트 '${projectGroup.project.name}'에 그룹 (${projectGroup.group.name}, 역할: ${projectGroup.role}) 할당`,
      details: { projectId, groupId, role: projectGroup.role },
    });
  } catch {}

  return projectGroup;
};