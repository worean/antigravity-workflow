import { prisma } from '#lib/prisma.js';

export const deleteProjectService = async (id: number, userId?: number) => {
  if (!id) throw new Error('Project ID is required');

  const existingProject = await prisma.project.findUnique({
    where: { id },
    select: { name: true, key: true }
  });

  await prisma.project.delete({ where: { id } });

  try {
    const { createActivityLogService } = await import('../../activityLogs/services/createActivityLog.service.js');
    await createActivityLogService({
      action: 'DELETE',
      entityType: 'PROJECT',
      entityId: id,
      userId: userId ? Number(userId) : undefined,
      summary: `프로젝트 #${id} ('${existingProject?.name || id}') 삭제`,
      details: { projectId: id, name: existingProject?.name, key: existingProject?.key }
    });
  } catch {
    // 로깅 오류 안전 무시
  }

  return { message: 'Project deleted' };
};

