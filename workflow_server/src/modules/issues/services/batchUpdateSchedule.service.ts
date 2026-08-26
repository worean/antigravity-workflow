import { prisma } from '#lib/prisma.js';
import { syncParentDatesService } from './syncParentDates.service.js';

export interface BatchScheduleItem {
  id: number;
  plannedStartDate?: string | Date | null;
  dueDate?: string | Date | null;
}

const parseDateOnly = (val: any): Date | null | undefined => {
  if (val === undefined) return undefined;
  if (!val || val === null || val === '') return null;
  const str = String(val).trim();
  const datePart = str.split('T')[0];
  if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
    return new Date(`${datePart}T00:00:00.000Z`);
  }
  const d = new Date(val);
  if (isNaN(d.getTime())) return null;
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return new Date(`${year}-${month}-${day}T00:00:00.000Z`);
};

/**
 * 여러 이슈의 시작계획일(plannedStartDate)과 기한(dueDate)을 단일 Prisma 트랜잭션으로 일괄 병렬 업데이트하고,
 * 연관된 부모 이슈들의 날짜를 롤업 동기화합니다.
 */
export const batchUpdateScheduleService = async (items: BatchScheduleItem[]) => {
  if (!items || !Array.isArray(items) || items.length === 0) {
    return { updatedCount: 0, issues: [] };
  }

  // 1. Prisma $transaction을 통한 일괄 병렬 수정 쿼리 빌드
  const updateOps = items.map((item) => {
    const issueId = Number(item.id);
    if (!issueId || isNaN(issueId)) {
      throw new Error(`Invalid issue ID: ${item.id}`);
    }

    const data: any = {};
    if (item.plannedStartDate !== undefined) {
      data.plannedStartDate = parseDateOnly(item.plannedStartDate);
    }
    if (item.dueDate !== undefined) {
      data.dueDate = parseDateOnly(item.dueDate);
    }

    return prisma.issue.update({
      where: { id: issueId },
      data,
      select: {
        id: true,
        parentId: true,
        plannedStartDate: true,
        dueDate: true,
      },
    });
  });

  // 2. 단일 트랜잭션으로 일괄 실행
  const updatedIssues = await prisma.$transaction(updateOps);

  // 3. 수정된 이슈들의 부모 이슈 및 본인 이슈(자식이 있는 경우) 날짜 롤업 동기화
  const parentIdsToSync = new Set<number>();
  for (const iss of updatedIssues) {
    if (iss.parentId) {
      parentIdsToSync.add(Number(iss.parentId));
    }
    parentIdsToSync.add(Number(iss.id));
  }

  for (const pId of parentIdsToSync) {
    await syncParentDatesService(pId);
  }

  return {
    updatedCount: updatedIssues.length,
    issues: updatedIssues,
  };
};