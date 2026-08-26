import { prisma } from '#lib/prisma.js';

/**
 * 상위 이슈의 시작계획일(plannedStartDate)과 기한(dueDate)을
 * 하위 이슈(children)들의 날짜를 기반으로 자동 계산하여 동기화합니다.
 * 조상 이슈(Grandparent 등)가 있는 경우 루트까지 연쇄적으로 갱신합니다.
 * (실제시작일, 실제종료일 등은 제외하고 오직 시작계획일/기한만 반영)
 */
export const syncParentDatesService = async (targetIssueId: number | null | undefined): Promise<void> => {
  if (!targetIssueId) return;

  let currentId: number | null = Number(targetIssueId);
  const visited = new Set<number>();

  while (currentId) {
    if (visited.has(currentId)) break; // 순환 참조 방지
    visited.add(currentId);

    const issue = await prisma.issue.findUnique({
      where: { id: currentId },
      include: { children: true }
    });

    if (!issue) break;

    // 하위 이슈(children)가 존재하는 경우에만 하위 이슈들의 날짜를 기반으로 계산
    if (issue.children && issue.children.length > 0) {
      const startDates: number[] = [];
      const dueDates: number[] = [];

      for (const child of issue.children) {
        if (child.plannedStartDate) {
          startDates.push(new Date(child.plannedStartDate).getTime());
        }
        if (child.dueDate) {
          dueDates.push(new Date(child.dueDate).getTime());
        }
      }

      const minStartDate = startDates.length > 0 ? new Date(Math.min(...startDates)) : null;
      const maxDueDate = dueDates.length > 0 ? new Date(Math.max(...dueDates)) : null;

      await prisma.issue.update({
        where: { id: currentId },
        data: {
          plannedStartDate: minStartDate,
          dueDate: maxDueDate
        }
      });
    }

    // 상위 부모가 있다면 부모로 올라가며 연쇄 갱신
    currentId = issue.parentId ? Number(issue.parentId) : null;
  }
};