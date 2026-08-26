import { prisma } from '#lib/prisma.js';

export const deleteIssueService = async (id: number, userId?: number) => {
  if (!id) throw new Error('Issue ID is required');

  const existingIssue = await prisma.issue.findUnique({
    where: { id },
    select: { id: true, title: true, projectId: true, issueNumber: true, parentId: true }
  });

  if (!existingIssue) {
    throw new Error('Issue not found');
  }

  const parentIdOfTarget = existingIssue.parentId ? Number(existingIssue.parentId) : null;

  // 1. 이슈 삭제 전, 하위 이슈가 있다면 하위 이슈들의 상위 이슈 ID를 자신의 상위 이슈 ID(parentId)로 변경
  await prisma.issue.updateMany({
    where: { parentId: id },
    data: { parentId: parentIdOfTarget }
  });

  // 2. 이슈 삭제
  await prisma.issue.delete({ where: { id } });

  // 3. 상위 부모 이슈가 있는 경우, 승계된 하위 이슈들의 날짜를 기반으로 부모 이슈 날짜 롤업 동기화
  if (parentIdOfTarget) {
    const { syncParentDatesService } = await import('./syncParentDates.service.js');
    await syncParentDatesService(parentIdOfTarget);
  }

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

