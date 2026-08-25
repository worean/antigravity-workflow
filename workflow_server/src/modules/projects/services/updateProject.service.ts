// -*- coding: utf-8 -*-
import { prisma } from '#lib/prisma.js';

export const updateProjectService = async (id: number, data: any, modifierUserId?: number) => {
  if (!id) throw new Error('Project ID is required');
  const {
    name,
    description,
    key,
    statusId,
    priorityId,
    plannedStartDate,
    dueDate,
    actualStartDate,
    actualEndDate,
    userId,
  } = data;
  const targetUserId = modifierUserId || (userId ? Number(userId) : undefined);

  const updateData: any = {};
  if (name !== undefined) updateData.name = name;
  if (description !== undefined) updateData.description = description;
  if (key !== undefined) updateData.key = key;
  if (statusId !== undefined) updateData.statusId = statusId ? Number(statusId) : undefined;
  if (priorityId !== undefined) updateData.priorityId = priorityId ? Number(priorityId) : undefined;

  if (plannedStartDate !== undefined) {
    updateData.plannedStartDate = plannedStartDate ? new Date(plannedStartDate) : null;
  }
  if (dueDate !== undefined) {
    updateData.dueDate = dueDate ? new Date(dueDate) : null;
  }
  if (actualStartDate !== undefined) {
    updateData.actualStartDate = actualStartDate ? new Date(actualStartDate) : null;
  }
  if (actualEndDate !== undefined) {
    updateData.actualEndDate = actualEndDate ? new Date(actualEndDate) : null;
  }

  const updated = await prisma.project.update({
    where: { id: Number(id) },
    data: updateData,
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
    },
  });

  try {
    const { createActivityLogService } = await import('../../activityLogs/services/createActivityLog.service.js');
    await createActivityLogService({
      action: 'UPDATE',
      entityType: 'PROJECT',
      entityId: Number(id),
      userId: targetUserId,
      summary: `프로젝트 #${id} ('${updated.name}') 정보 수정`,
      details: data,
    });
  } catch {}

  return updated;
};

