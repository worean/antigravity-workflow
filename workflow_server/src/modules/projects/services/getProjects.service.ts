import { prisma } from '#lib/prisma.js';

export const getProjectsService = async (query: any = {}, currentUserId?: number) => {
  const {
    search,
    statusId,
    priorityId,
    ownerId,
    memberId,
    limit,
    take: takeQuery,
    skip: skipQuery,
    offset,
    sortBy,
    order,
    sortOrder
  } = query;

  const where: any = {};

  if (statusId) where.statusId = Number(statusId);
  if (priorityId) where.priorityId = Number(priorityId);

  // Owner 필터링
  if (ownerId !== undefined && ownerId !== '') {
    if (ownerId === 'my' || ownerId === 'me' || ownerId === 'MY') {
      if (currentUserId) where.ownerId = currentUserId;
    } else if (!isNaN(Number(ownerId))) {
      where.ownerId = Number(ownerId);
    }
  }

  // Member 필터링
  if (memberId !== undefined && memberId !== '') {
    if (memberId === 'my' || memberId === 'me' || memberId === 'MY') {
      if (currentUserId) {
        where.OR = [
          { ownerId: currentUserId },
          { members: { some: { userId: currentUserId } } }
        ];
      }
    } else if (!isNaN(Number(memberId))) {
      where.members = { some: { userId: Number(memberId) } };
    }
  }

  if (search) {
    const searchFilter = [
      { name: { contains: String(search) } },
      { key: { contains: String(search) } },
      { description: { contains: String(search) } }
    ];
    if (where.OR) {
      where.AND = [{ OR: where.OR }, { OR: searchFilter }];
      delete where.OR;
    } else {
      where.OR = searchFilter;
    }
  }

  // 정렬 (Sorting) 처리
  const validSortFields = [
    'id',
    'createdAt',
    'updatedAt',
    'name',
    'key',
    'dueDate',
    'plannedStartDate',
    'priorityId',
    'statusId'
  ];
  const sortField = validSortFields.includes(sortBy) ? sortBy : 'id';
  const sortDir = (order || sortOrder || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';
  const orderBy: any = { [sortField]: sortDir };

  // 개수 제한(Pagination) 처리
  const take = (limit !== undefined || takeQuery !== undefined)
    ? Math.max(1, Number(limit ?? takeQuery))
    : undefined;
  const skip = (skipQuery !== undefined || offset !== undefined)
    ? Math.max(0, Number(skipQuery ?? offset))
    : undefined;

  return await prisma.project.findMany({
    where,
    include: {
      owner: { select: { id: true, name: true, email: true, avatar: true, avatarColor: true } },
      members: { include: { user: { select: { id: true, name: true, email: true, avatar: true, avatarColor: true } } } },
      groups: { include: { group: { select: { id: true, name: true, code: true } } } },
      status: true,
      priority: true,
      _count: { select: { issues: true, sprints: true } }
    },
    orderBy,
    take,
    skip
  });
};
