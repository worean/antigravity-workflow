import { prisma } from '#lib/prisma.js';

export const deleteIssueService = async (id: number, userId?: number) => {
  if (!id) throw new Error('Issue ID is required');

  const existingIssue = await prisma.issue.findUnique({
    where: { id },
    select: { title: true, projectId: true, issueNumber: true }
  });

  await prisma.issue.delete({ where: { id } });

  try {
    const { createActivityLogService } = await import('../../activityLogs/services/createActivityLog.service.js');
    await createActivityLogService({
      action: 'DELETE',
      entityType: 'ISSUE',
      entityId: id,
      userId: userId ? Number(userId) : undefined,
      summary: `이슈 #${id} ('${existingIssue?.title || id}') 삭제`,
      details: { issueId: id, title: existingIssue?.title, projectId: existingIssue?.projectId, issueNumber: existingIssue?.issueNumber }
    });
  } catch {
    // 로깅 오류 안전 무시
  }

  return { message: 'Issue/Task deleted successfully' };
};

