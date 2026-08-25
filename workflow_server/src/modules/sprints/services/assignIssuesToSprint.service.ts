// -*- coding: utf-8 -*-
import { prisma } from '#lib/prisma.js';

interface AssignIssuesPayload {
  issueIds?: number[];
  addIssueIds?: number[];
  removeIssueIds?: number[];
  autoCalculateDates?: boolean;
}

export const assignIssuesToSprintService = async (sprintId: number, payload: AssignIssuesPayload) => {
  if (!sprintId) throw new Error('Sprint ID is required');

  const sprint = await prisma.sprint.findUnique({
    where: { id: Number(sprintId) }
  });
  if (!sprint) throw new Error('Sprint not found');

  const { issueIds, addIssueIds, removeIssueIds, autoCalculateDates } = payload;

  // 1. 전체 치환 (issueIds가 제공된 경우)
  if (Array.isArray(issueIds)) {
    const targetIds = issueIds.map(Number);
    // 기존에 할당되어 있었으나 새 목록에 없는 이슈 해제
    await prisma.issue.updateMany({
      where: { sprintId: Number(sprintId), id: { notIn: targetIds } },
      data: { sprintId: null }
    });
    // 새 목록에 있는 이슈 할당 (프로젝트 일치 이슈만)
    if (targetIds.length > 0) {
      await prisma.issue.updateMany({
        where: { id: { in: targetIds }, projectId: sprint.projectId },
        data: { sprintId: Number(sprintId) }
      });
    }
  } else {
    // 2. 추가 할당 (addIssueIds)
    if (Array.isArray(addIssueIds) && addIssueIds.length > 0) {
      const addIds = addIssueIds.map(Number);
      await prisma.issue.updateMany({
        where: { id: { in: addIds }, projectId: sprint.projectId },
        data: { sprintId: Number(sprintId) }
      });
    }
    // 3. 할당 해제 (removeIssueIds)
    if (Array.isArray(removeIssueIds) && removeIssueIds.length > 0) {
      const removeIds = removeIssueIds.map(Number);
      await prisma.issue.updateMany({
        where: { id: { in: removeIds }, sprintId: Number(sprintId) },
        data: { sprintId: null }
      });
    }
  }

  // 4. 이슈 기반 시작일/기한 자동 계산 및 반영
  if (autoCalculateDates) {
    const assignedIssues = await prisma.issue.findMany({
      where: { sprintId: Number(sprintId) },
      select: { plannedStartDate: true, dueDate: true }
    });

    let minStart: Date | null = null;
    let maxDue: Date | null = null;

    for (const issue of assignedIssues) {
      if (issue.plannedStartDate) {
        const s = new Date(issue.plannedStartDate);
        if (!minStart || s < minStart) minStart = s;
      }
      if (issue.dueDate) {
        const d = new Date(issue.dueDate);
        if (!maxDue || d > maxDue) maxDue = d;
      }
    }

    await prisma.sprint.update({
      where: { id: Number(sprintId) },
      data: {
        startDate: minStart || undefined,
        endDate: maxDue || undefined
      }
    });
  }

  // 갱신된 스프린트 정보 반환
  return await prisma.sprint.findUnique({
    where: { id: Number(sprintId) },
    include: {
      project: { select: { id: true, name: true, key: true } },
      issues: {
        include: {
          status: true,
          priority: true,
          type: true,
          assignee: { select: { id: true, name: true, email: true, avatar: true, avatarColor: true } }
        },
        orderBy: { id: 'asc' }
      },
      _count: { select: { issues: true } }
    }
  });
};