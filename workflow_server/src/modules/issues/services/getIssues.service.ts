import { prisma } from '#lib/prisma.js';

export interface PaginatedIssuesResult {
  items: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const getIssuesService = async (query: any = {}, currentUserId?: number) => {
  const {
    projectId,
    sprintId,
    assigneeId,
    authorId,
    typeId,
    statusId,
    priorityId,
    parentId,
    search,
    page: pageQuery,
    limit,
    pageSize,
    take: takeQuery,
    skip: skipQuery,
    offset,
    sortBy,
    order,
    sortOrder,
    all
  } = query;

  const where: any = {};
  if (projectId) where.projectId = Number(projectId);
  if (sprintId) where.sprintId = Number(sprintId);

  // Assignee 필터링: 'my'/'me' / 'null'/'unassigned' / 숫자 ID 지원
  if (assigneeId !== undefined && assigneeId !== '' && assigneeId !== 'ALL') {
    if (assigneeId === 'my' || assigneeId === 'me' || assigneeId === 'MY') {
      if (currentUserId) where.assigneeId = currentUserId;
    } else if (assigneeId === 'null' || assigneeId === 'unassigned') {
      where.assigneeId = null;
    } else if (!isNaN(Number(assigneeId))) {
      where.assigneeId = Number(assigneeId);
    }
  }

  // Author 필터링
  if (authorId !== undefined && authorId !== '') {
    if (authorId === 'my' || authorId === 'me' || authorId === 'MY') {
      if (currentUserId) where.authorId = currentUserId;
    } else if (!isNaN(Number(authorId))) {
      where.authorId = Number(authorId);
    }
  }

  if (typeId) where.typeId = Number(typeId);
  if (statusId) where.statusId = Number(statusId);
  if (priorityId) where.priorityId = Number(priorityId);
  if (parentId !== undefined && parentId !== '') {
    where.parentId = parentId === 'null' ? null : Number(parentId);
  }

  if (search) {
    where.OR = [
      { title: { contains: String(search) } },
      { description: { contains: String(search) } }
    ];
  }

  // 정렬 (Sorting) 처리
  const validSortFields = [
    'id',
    'createdAt',
    'updatedAt',
    'dueDate',
    'plannedStartDate',
    'priorityId',
    'statusId',
    'progress',
    'issueNumber',
    'title'
  ];
  const sortField = validSortFields.includes(sortBy) ? sortBy : 'id';
  const sortDir = (order || sortOrder || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';
  const orderBy: any = { [sortField]: sortDir };

  // 페이지네이션 (Pagination) 처리 - 기본값: 페이지당 20개
  const isAll = all === 'true' || limit === 'all';
  const page = Math.max(1, Number(pageQuery || 1));
  const defaultPageSize = 20;

  let take: number | undefined;
  if (isAll) {
    take = undefined;
  } else if (limit !== undefined || pageSize !== undefined || takeQuery !== undefined) {
    take = Math.max(1, Number(limit ?? pageSize ?? takeQuery));
  } else {
    take = defaultPageSize;
  }

  let skip: number | undefined;
  if (skipQuery !== undefined || offset !== undefined) {
    skip = Math.max(0, Number(skipQuery ?? offset));
  } else if (take !== undefined) {
    skip = (page - 1) * take;
  }

  const [totalCount, issues] = await Promise.all([
    prisma.issue.count({ where }),
    prisma.issue.findMany({
      where,
      include: {
        type: true,
        priority: true,
        status: true,
        assignee: { select: { id: true, name: true, email: true, avatar: true, avatarColor: true } },
        author: { select: { id: true, name: true, email: true, avatar: true, avatarColor: true } },
        sprint: { select: { id: true, name: true } },
        project: { select: { id: true, name: true, key: true } },
        likes: currentUserId ? { where: { userId: currentUserId } } : false,
        _count: { select: { comments: true, attachments: true, children: true, likes: true } }
      },
      orderBy,
      take,
      skip
    })
  ]);

  let favSet = new Set<number>();
  if (currentUserId) {
    const favList = await prisma.favorite.findMany({
      where: { userId: currentUserId, targetType: 'ISSUE' },
      select: { targetId: true },
    });
    favSet = new Set(favList.map((f) => f.targetId));
  }

  const items = issues.map(item => ({
    ...item,
    isLiked: currentUserId && Array.isArray(item.likes) ? item.likes.length > 0 : false,
    isFavorite: favSet.has(item.id),
    likesCount: item._count?.likes ?? (Array.isArray(item.likes) ? item.likes.length : 0),
    commentsCount: item._count?.comments ?? 0,
    attachmentsCount: item._count?.attachments ?? 0,
    childrenCount: item._count?.children ?? 0,
    customFields: item.customFields ? JSON.parse(item.customFields) : null
  }));

  // ⭐ 즐겨찾기 항목 최우선 상단 정렬
  if (currentUserId) {
    items.sort((a, b) => {
      if (a.isFavorite === b.isFavorite) return 0;
      return a.isFavorite ? -1 : 1;
    });
  }

  const effectiveLimit = take ?? totalCount;
  const totalPages = effectiveLimit > 0 ? Math.ceil(totalCount / effectiveLimit) : 1;

  return {
    items,
    total: totalCount,
    page,
    limit: effectiveLimit,
    totalPages
  };
};
