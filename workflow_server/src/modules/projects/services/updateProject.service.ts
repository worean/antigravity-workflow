import { prisma } from '#lib/prisma.js';

export const updateProjectService = async (id: number, data: any, modifierUserId?: number) => {
  if (!id) throw new Error('Project ID is required');
  const { name, description, statusId, priorityId, userId } = data;
  const targetUserId = modifierUserId || (userId ? Number(userId) : undefined);

  const updated = await prisma.project.update({
    where: { id },
    data: { name, description, statusId: statusId ? Number(statusId) : undefined, priorityId: priorityId ? Number(priorityId) : undefined }
  });

  try {
    const { createActivityLogService } = await import('../../activityLogs/services/createActivityLog.service.js');
    await createActivityLogService({
      action: 'UPDATE',
      entityType: 'PROJECT',
      entityId: id,
      userId: targetUserId,
      summary: `프로젝트 #${id} ('${updated.name}') 정보 수정`,
      details: data
    });
  } catch {
    // 로깅 오류 안전 무시
  }

  return updated;
};

