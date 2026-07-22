import { prisma } from '#lib/prisma.js';

export const createProjectService = async (data: any, ownerId?: number) => {
  const { name, description, key, statusId, priorityId } = data;
  const targetOwnerId = Number(ownerId || data.ownerId);

  if (!name || !key || isNaN(targetOwnerId) || targetOwnerId <= 0) {
    throw new Error('name, key, and valid ownerId are required');
  }

  // 1. Owner User 존재 여부 확인
  const owner = await prisma.user.findUnique({ where: { id: targetOwnerId } });
  if (!owner) {
    throw new Error(`Owner user with ID ${targetOwnerId} does not exist in DB.`);
  }

  // 2. ProjectStatus (id: 1) 존재 확인 및 자동 생성
  let status = await prisma.projectStatus.findFirst();
  if (!status) {
    status = await prisma.projectStatus.create({
      data: { name: 'Active', category: 'IN_PROGRESS', isSystem: true }
    });
  }

  // 3. ProjectPriority (id: 1) 존재 확인 및 자동 생성
  let priority = await prisma.projectPriority.findFirst();
  if (!priority) {
    priority = await prisma.projectPriority.create({
      data: { name: 'Medium', level: 2, isSystem: true }
    });
  }

  const finalStatusId = statusId ? Number(statusId) : status.id;
  const finalPriorityId = priorityId ? Number(priorityId) : priority.id;

  // 4. Project 생성
  const project = await prisma.project.create({
    data: {
      name,
      description,
      key: key.toUpperCase(),
      ownerId: targetOwnerId,
      statusId: finalStatusId,
      priorityId: finalPriorityId
    }
  });

  // 5. 프로젝트 생성자를 ADMIN 멤버로 등록
  await prisma.projectMember.upsert({
    where: {
      projectId_userId: {
        projectId: project.id,
        userId: targetOwnerId
      }
    },
    update: { role: 'ADMIN' },
    create: {
      projectId: project.id,
      userId: targetOwnerId,
      role: 'ADMIN'
    }
  });

  return project;
};
