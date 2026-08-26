import { prisma } from '#lib/prisma.js';
import { getIssueService } from './getIssue.service.js';

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

export const createIssueService = async (data: any, authorIdInput?: number) => {
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
    customFields,
    plannedStartDate,
    dueDate,
    actualStartDate,
    actualEndDate
  } = data;

  const targetProjectId = Number(projectId);
  const targetAuthorId = Number(authorIdInput || authorId);

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
      customFields: customFields ? JSON.stringify(customFields) : null,
      plannedStartDate: parseDateOnly(plannedStartDate),
      dueDate: parseDateOnly(dueDate),
      actualStartDate: parseDateOnly(actualStartDate),
      actualEndDate: parseDateOnly(actualEndDate)
    }
  });

  // 상위 이슈가 지정된 경우, 상위 이슈의 시작계획일/기한을 자동 롤업 동기화
  if (issue.parentId) {
    const { syncParentDatesService } = await import('./syncParentDates.service.js');
    await syncParentDatesService(issue.parentId);
  }

  // 비관계형 활동 로그 기록
  try {
    const { createActivityLogService } = await import('../../activityLogs/services/createActivityLog.service.js');
    await createActivityLogService({
      action: 'CREATE',
      entityType: 'ISSUE',
      entityId: issue.id,
      userId: targetAuthorId,
      summary: `이슈 #${issue.id} ('${issue.title}') 생성`,
      details: { title: issue.title, projectId: targetProjectId, typeId: issue.typeId, priorityId: issue.priorityId }
    });
  } catch {
    // 로깅 오류 안전 무시
  }

  // GET / PUT 조회 시의 호환 가능한 완전한 포함(Include) 객체 양식으로 리턴
  return await getIssueService(issue.id, targetAuthorId);
};


