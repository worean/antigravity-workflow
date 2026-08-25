// -*- coding: utf-8 -*-
import { prisma } from '#lib/prisma.js';

export const updateSprintService = async (id: number, data: any) => {
  if (!id) throw new Error('Sprint ID is required');
  const { name, goal, status, startDate, endDate, autoCalculateDates } = data;

  let sDate = startDate !== undefined ? (startDate ? new Date(startDate) : null) : undefined;
  let eDate = endDate !== undefined ? (endDate ? new Date(endDate) : null) : undefined;

  if (autoCalculateDates) {
    const assignedIssues = await prisma.issue.findMany({
      where: { sprintId: Number(id) },
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
    sDate = minStart;
    eDate = maxDue;
  }

  const updateData: any = {};
  if (name !== undefined) updateData.name = name;
  if (goal !== undefined) updateData.goal = goal;
  if (status !== undefined) updateData.status = status;
  if (sDate !== undefined) updateData.startDate = sDate;
  if (eDate !== undefined) updateData.endDate = eDate;

  return await prisma.sprint.update({
    where: { id: Number(id) },
    data: updateData,
    include: {
      project: { select: { id: true, name: true, key: true } },
      issues: {
        include: {
          status: true,
          priority: true,
          type: true,
          assignee: { select: { id: true, name: true, email: true, avatar: true, avatarColor: true } }
        }
      },
      _count: { select: { issues: true } }
    }
  });
};