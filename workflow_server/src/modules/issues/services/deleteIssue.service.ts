import { prisma } from '#lib/prisma.js';

export const deleteIssueService = async (id: number, userId?: number) => {
  if (!id) throw new Error('Issue ID is required');

  const existingIssue = await prisma.issue.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      projectId: true,
      issueNumber: true,
      parentId: true,
      tags: { select: { id: true } },
    },
  });

  if (!existingIssue) {
    throw new Error('Issue not found');
  }

  const parentIdOfTarget = existingIssue.parentId ? Number(existingIssue.parentId) : null;
  const connectedTagIds = existingIssue.tags?.map((t) => t.id) || [];

  // 1. 이슈 삭제 전, 하위 이슈가 있다면 하위 이슈들의 상위 이슈 ID를 자신의 상위 이슈 ID(parentId)로 변경
  await prisma.issue.updateMany({
    where: { parentId: id },
    data: { parentId: parentIdOfTarget }
  });

  // 2. 이슈 삭제 (DB 외래키 cascade로 Comment, IssueLike, Attachment 등 연계 삭제)
  await prisma.issue.delete({ where: { id } });

  // 2.1 연결된 폴리모픽 즐겨찾기(Favorite) 연쇄 삭제 (Cascade Cleanup)
  await prisma.favorite.deleteMany({
    where: { targetType: 'ISSUE', targetId: id }
  });

  // 2.2 연결되어 있던 태그 중 참조 수가 0이 된 태그 자동 삭제
  if (connectedTagIds.length > 0) {
    const { cleanupUnusedTagsService } = await import('../../tags/services/cleanupUnusedTags.service.js');
    await cleanupUnusedTagsService(connectedTagIds);
  }

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

