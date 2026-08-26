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

export const updateIssueService = async (issueId: number, data: any) => {
  const currentIssue = await prisma.issue.findUnique({
    where: { id: issueId },
    include: { project: true }
  });
  if (!currentIssue) throw new Error('Issue/Task not found');

  const {
    title,
    description,
    projectId,
    typeId,
    assigneeId,
    priorityId,
    statusId,
    progress,
    estimatedHours,
    loggedHours,
    sprintId,
    parentId,
    customFields,
    plannedStartDate,
    dueDate,
    actualStartDate,
    actualEndDate,
    userId
  } = data;

  if (parentId !== undefined && parentId !== null && Number(parentId) === issueId) {
    throw new Error('Cannot set self as parent issue');
  }

  // 권한 제어: projectId(프로젝트 이동), typeId(이슈 유형 변경), priorityId(우선순위 변경) 수정 권한 체크
  const isChangingProjectId = projectId !== undefined && Number(projectId) !== currentIssue.projectId;
  const isChangingTypeId = typeId !== undefined && Number(typeId) !== currentIssue.typeId;
  const isChangingPriorityId = priorityId !== undefined && Number(priorityId) !== currentIssue.priorityId;

  if (isChangingProjectId || isChangingTypeId || isChangingPriorityId) {
    if (!userId) {
      throw new Error('Unauthorized: Permission required to modify restricted fields (projectId, typeId, priorityId)');
    }
    const numericUserId = Number(userId);

    // 프로젝트 Owner, 이슈 작성자, 또는 ProjectMember Admin 여부 확인
    const isOwner = currentIssue.project?.ownerId === numericUserId;
    const isAuthor = currentIssue.authorId === numericUserId;
    
    const memberRecord = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: currentIssue.projectId,
          userId: numericUserId
        }
      }
    });
    const isAdminMember = memberRecord?.role === 'ADMIN';

    if (!isOwner && !isAuthor && !isAdminMember) {
      throw new Error('Restricted field modification (projectId, typeId, priorityId) requires Admin or Project Owner permission');
    }
  }

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

  await prisma.issue.update({
    where: { id: issueId },
    data: {
      title,
      description,
      projectId: projectId ? Number(projectId) : undefined,
      typeId: typeId ? Number(typeId) : undefined,
      assigneeId: assigneeId !== undefined ? (assigneeId ? Number(assigneeId) : null) : undefined,
      priorityId: priorityId ? Number(priorityId) : undefined,
      statusId: statusId ? Number(statusId) : undefined,
      progress: progress !== undefined ? Number(progress) : undefined,
      estimatedHours: estimatedHours !== undefined ? Number(estimatedHours) : undefined,
      loggedHours: loggedHours !== undefined ? Number(loggedHours) : undefined,
      sprintId: sprintId !== undefined ? (sprintId ? Number(sprintId) : null) : undefined,
      parentId: parentId !== undefined ? (parentId ? Number(parentId) : null) : undefined,
      customFields: customFields !== undefined ? (typeof customFields === 'string' ? customFields : JSON.stringify(customFields)) : undefined,
      plannedStartDate: parseDateOnly(plannedStartDate),
      dueDate: parseDateOnly(dueDate),
      actualStartDate: parseDateOnly(actualStartDate),
      actualEndDate: parseDateOnly(actualEndDate)
    }
  });

  // 상위 이슈 일정 동기화 (Rollup)
  const { syncParentDatesService } = await import('./syncParentDates.service.js');
  // 1) 자기 자신에게 하위 이슈가 있다면 자기 자신의 시작계획일/기한을 하위 이슈 기준으로 강제 보정
  await syncParentDatesService(issueId);

  // 2) 신규/현재 부모 이슈 일정 동기화
  const oldParentId = currentIssue.parentId;
  const newParentId = parentId !== undefined ? (parentId ? Number(parentId) : null) : oldParentId;
  if (newParentId) {
    await syncParentDatesService(newParentId);
  }

  // 3) 부모 이슈가 변경된 경우, 이전 부모 이슈 일정 동기화
  if (oldParentId && oldParentId !== newParentId) {
    await syncParentDatesService(oldParentId);
  }

  // 비관계형 활동 로그 기록
  try {
    const { createActivityLogService } = await import('../../activityLogs/services/createActivityLog.service.js');
    await createActivityLogService({
      action: 'UPDATE',
      entityType: 'ISSUE',
      entityId: issueId,
      userId: userId ? Number(userId) : undefined,
      summary: `이슈 #${issueId} ('${title || currentIssue.title}') 정보 수정`,
      details: data
    });
  } catch {
    // 로깅 오류 안전 무시
  }

  // GET 조회 시의 호환 가능한 완전한 포함(Include) 객체 양식으로 리턴
  return await getIssueService(issueId, userId ? Number(userId) : undefined);
};

