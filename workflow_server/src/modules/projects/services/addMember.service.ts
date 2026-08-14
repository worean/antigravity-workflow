import { prisma } from '#lib/prisma.js';

export const addMemberService = async (projectId: number, userId: number, role?: string, actorUserId?: number) => {
  if (!projectId || !userId) throw new Error('projectId and userId are required');
  const member = await prisma.projectMember.create({
    data: {
      projectId,
      userId,
      role: role || 'MEMBER'
    },
    include: {
      user: { select: { name: true, email: true } },
      project: { select: { name: true, key: true } }
    }
  });

  try {
    const { createActivityLogService } = await import('../../activityLogs/services/createActivityLog.service.js');
    await createActivityLogService({
      action: 'ASSIGN_MEMBER',
      entityType: 'PROJECT_MEMBER',
      entityId: projectId,
      userId: actorUserId || userId,
      summary: `프로젝트 '${member.project?.name || projectId}'에 멤버 (${member.user?.name || member.user?.email || userId}, 역할: ${member.role}) 할당`,
      details: { projectId, userId, role: member.role }
    });
  } catch {
    // 로깅 오류 안전 무시
  }

  return member;
};

