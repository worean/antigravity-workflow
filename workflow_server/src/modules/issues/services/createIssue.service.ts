import { prisma } from '#lib/prisma.js';

export const createIssueService = async (data: any) => {
  const {
    title,
    description,
    projectId,
    authorId,
    assigneeId,
    typeId,
    priorityId,
    statusId,
    sprintId,
    parentId,
    estimatedHours,
    customFields
  } = data;

  const targetProjectId = Number(projectId);
  const targetAuthorId = Number(authorId);

  if (!targetProjectId || !title || !targetAuthorId) {
    throw new Error('projectId, title, and authorId are required');
  }

  // 1. IssueType 자동 존재 확인
  let type = await prisma.issueType.findFirst();
  if (!type) {
    type = await prisma.issueType.create({
      data: { name: 'Task', description: 'General Task', isSystem: true }
    });
  }

  // 2. IssuePriority 자동 존재 확인
  let priority = await prisma.issuePriority.findFirst();
  if (!priority) {
    priority = await prisma.issuePriority.create({
      data: { name: 'Medium', level: 2, isSystem: true }
    });
  }

  // 3. IssueStatus 자동 존재 확인
  let status = await prisma.issueStatus.findFirst();
  if (!status) {
    status = await prisma.issueStatus.create({
      data: { name: 'To Do', category: 'TODO', isSystem: true }
    });
  }

  const maxIssue = await prisma.issue.findFirst({
    where: { projectId: targetProjectId },
    orderBy: { issueNumber: 'desc' }
  });
  const nextIssueNumber = (maxIssue?.issueNumber || 0) + 1;

  const issue = await prisma.issue.create({
    data: {
      title,
      description,
      issueNumber: nextIssueNumber,
      projectId: targetProjectId,
      authorId: targetAuthorId,
      assigneeId: assigneeId ? Number(assigneeId) : undefined,
      typeId: typeId ? Number(typeId) : type.id,
      priorityId: priorityId ? Number(priorityId) : priority.id,
      statusId: statusId ? Number(statusId) : status.id,
      sprintId: sprintId ? Number(sprintId) : undefined,
      parentId: parentId ? Number(parentId) : undefined,
      estimatedHours: estimatedHours ? Number(estimatedHours) : undefined,
      customFields: customFields ? JSON.stringify(customFields) : null
    }
  });

  return {
    ...issue,
    customFields: issue.customFields ? JSON.parse(issue.customFields) : null
  };
};
