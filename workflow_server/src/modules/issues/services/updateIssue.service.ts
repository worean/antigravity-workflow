import { prisma } from '#lib/prisma.js';

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
    customFields,
    userId
  } = data;

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

  const updated = await prisma.issue.update({
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
      customFields: customFields !== undefined ? (typeof customFields === 'string' ? customFields : JSON.stringify(customFields)) : undefined
    }
  });

  return {
    ...updated,
    customFields: updated.customFields ? JSON.parse(updated.customFields) : null
  };
};
