import { prisma } from '#lib/prisma.js';

export const updateIssueService = async (issueId: number, data: any) => {
  const currentIssue = await prisma.issue.findUnique({ where: { id: issueId } });
  if (!currentIssue) throw new Error('Issue/Task not found');

  const {
    title,
    description,
    assigneeId,
    priorityId,
    statusId,
    progress,
    estimatedHours,
    loggedHours,
    sprintId,
    customFields,
    userId
  } = data;

  if (description !== undefined && description !== currentIssue.description && userId) {
    await prisma.issueRevision.create({
      data: {
        issueId,
        authorId: Number(userId),
        title: title || currentIssue.title,
        description: currentIssue.description,
        reason: 'Body description updated'
      }
    });
  }

  if (userId) {
    if (statusId !== undefined && statusId !== currentIssue.statusId) {
      await prisma.issueHistory.create({
        data: { issueId, userId: Number(userId), field: 'statusId', oldValue: String(currentIssue.statusId), newValue: String(statusId) }
      });
    }
    if (assigneeId !== undefined && assigneeId !== currentIssue.assigneeId) {
      await prisma.issueHistory.create({
        data: { issueId, userId: Number(userId), field: 'assigneeId', oldValue: String(currentIssue.assigneeId), newValue: String(assigneeId) }
      });
    }
  }

  const updated = await prisma.issue.update({
    where: { id: issueId },
    data: {
      title,
      description,
      assigneeId: assigneeId !== undefined ? (assigneeId ? Number(assigneeId) : null) : undefined,
      priorityId: priorityId ? Number(priorityId) : undefined,
      statusId: statusId ? Number(statusId) : undefined,
      progress: progress !== undefined ? Number(progress) : undefined,
      estimatedHours: estimatedHours !== undefined ? Number(estimatedHours) : undefined,
      loggedHours: loggedHours !== undefined ? Number(loggedHours) : undefined,
      sprintId: sprintId !== undefined ? (sprintId ? Number(sprintId) : null) : undefined,
      customFields: customFields !== undefined ? JSON.stringify(customFields) : undefined
    }
  });

  return {
    ...updated,
    customFields: updated.customFields ? JSON.parse(updated.customFields) : null
  };
};
