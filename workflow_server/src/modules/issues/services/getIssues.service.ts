import { prisma } from '#lib/prisma.js';

export const getIssuesService = async (query: any, currentUserId?: number) => {
  const { projectId, sprintId, assigneeId, typeId, statusId, parentId, search } = query;

  const where: any = {};
  if (projectId) where.projectId = Number(projectId);
  if (sprintId) where.sprintId = Number(sprintId);
  if (assigneeId) where.assigneeId = Number(assigneeId);
  if (typeId) where.typeId = Number(typeId);
  if (statusId) where.statusId = Number(statusId);
  if (parentId !== undefined) where.parentId = parentId === 'null' ? null : Number(parentId);
  if (search) {
    where.OR = [
      { title: { contains: String(search) } },
      { description: { contains: String(search) } }
    ];
  }

  const issues = await prisma.issue.findMany({
    where,
    include: {
      type: true,
      priority: true,
      status: true,
      assignee: { select: { id: true, name: true, email: true } },
      author: { select: { id: true, name: true } },
      sprint: { select: { id: true, name: true } },
      project: { select: { id: true, name: true, key: true } },
      likes: currentUserId ? { where: { userId: currentUserId } } : false,
      _count: { select: { comments: true, attachments: true, children: true, likes: true } }
    },
    orderBy: { id: 'desc' }
  });

  return issues.map(item => ({
    ...item,
    isLiked: currentUserId && Array.isArray(item.likes) ? item.likes.length > 0 : false,
    customFields: item.customFields ? JSON.parse(item.customFields) : null
  }));
};
