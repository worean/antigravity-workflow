import { prisma } from '#lib/prisma.js';

export const createSprintService = async (data: any) => {
  const { name, goal, startDate, endDate, projectId, status, issueIds, autoCalculateDates } = data;
  if (!name || !projectId) throw new Error('name and projectId are required');

  let sDate = startDate ? new Date(startDate) : undefined;
  let eDate = endDate ? new Date(endDate) : undefined;

  const sprint = await prisma.sprint.create({
    data: {
      name,
      goal,
      startDate: sDate,
      endDate: eDate,
      projectId: Number(projectId),
      status: status || 'PLANNED'
    }
  });

  if (Array.isArray(issueIds) && issueIds.length > 0) {
    const targetIds = issueIds.map(Number);
    await prisma.issue.updateMany({
      where: { id: { in: targetIds }, projectId: Number(projectId) },
      data: { sprintId: sprint.id }
    });

    if ((!sDate || !eDate || autoCalculateDates)) {
      const assignedIssues = await prisma.issue.findMany({
        where: { sprintId: sprint.id },
        select: { plannedStartDate: true, dueDate: true }
      });

      let minStart: Date | null = sDate || null;
      let maxDue: Date | null = eDate || null;

      for (const issue of assignedIssues) {
        if (issue.plannedStartDate && (!sDate || autoCalculateDates)) {
          const s = new Date(issue.plannedStartDate);
          if (!minStart || s < minStart) minStart = s;
        }
        if (issue.dueDate && (!eDate || autoCalculateDates)) {
          const d = new Date(issue.dueDate);
          if (!maxDue || d > maxDue) maxDue = d;
        }
      }

      if (minStart || maxDue) {
        await prisma.sprint.update({
          where: { id: sprint.id },
          data: {
            startDate: minStart || undefined,
            endDate: maxDue || undefined
          }
        });
      }
    }
  }

  return await prisma.sprint.findUnique({
    where: { id: sprint.id },
    include: {
      project: { select: { id: true, name: true, key: true } },
      issues: true,
      _count: { select: { issues: true } }
    }
  });
};