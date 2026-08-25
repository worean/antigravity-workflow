// -*- coding: utf-8 -*-
import { prisma } from '#lib/prisma.js';

export const updateMemberRoleService = async (projectId: number, userId: number, role: string, actorUserId?: number) => {
  if (!projectId || !userId || !role) throw new Error('projectId, userId, and role are required');

  const updated = await prisma.projectMember.update({
    where: {
      projectId_userId: { projectId: Number(projectId), userId: Number(userId) },
    },
    data: { role },
    include: {
      user: { select: { id: true, name: true, email: true, avatar: true, avatarColor: true } },
      project: { select: { name: true, key: true } },
    },
  });

  try {
    const { createActivityLogService } = await import('../../activityLogs/services/createActivityLog.service.js');
    await createActivityLogService({
      action: 'UPDATE_MEMBER_ROLE',
      entityType: 'PROJECT_MEMBER',
      entityId: projectId,
      userId: actorUserId || userId,
      summary: `프로젝트 '${updated.project.name}' 멤버 (${updated.user.name || updated.user.email}) 역할 변경 -> ${role}`,
      details: { projectId, userId, role },
    });
  } catch {}

  return updated;
};