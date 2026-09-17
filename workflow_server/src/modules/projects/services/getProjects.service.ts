import { prisma } from '#lib/prisma.js';

export const getProjectsService = async (
  query: any = {},
  currentUserId?: number,
  currentUserRole?: string,
  currentUserEmail?: string
) => {
  const {
    search,
    tag,
    tagId,
    statusId,
    priorityId,
    ownerId,
    memberId,
    visibility,
    limit,
    take: takeQuery,
    skip: skipQuery,
    offset,
    sortBy,
    order,
    sortOrder,
  } = query;

  const where: any = {};

  if (statusId) where.statusId = Number(statusId);
  if (priorityId) where.priorityId = Number(priorityId);

  // 🔒 Visibility 필터링
  if (visibility && typeof visibility === 'string') {
    const norm = visibility.toUpperCase();
    if (['PUBLIC', 'PROTECTED', 'PRIVATE'].includes(norm)) {
      where.visibility = norm;
    }
  }

  // 🏷️ 태그 필터링
  if (tagId) {
    where.tags = { some: { id: Number(tagId) } };
  } else if (tag && String(tag).trim()) {
    const cleanTag = String(tag).trim().replace(/^#/, '');
    where.tags = { some: { name: cleanTag } };
  }

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
          { members: { some: { userId: currentUserId } } },
        ];
      }
    } else if (!isNaN(Number(memberId))) {
      where.members = { some: { userId: Number(memberId) } };
    }
  }

  if (search && String(search).trim()) {
    const trimmedSearch = String(search).trim();
    const cleanTag = trimmedSearch.replace(/^#/, '');
    const searchFilter = [
      { name: { contains: cleanTag } },
      { key: { contains: cleanTag } },
      { description: { contains: cleanTag } },
      { tags: { some: { name: cleanTag } } },
    ];
    if (where.OR) {
      where.AND = [{ OR: where.OR }, { OR: searchFilter }];
      delete where.OR;
    } else {
      where.OR = searchFilter;
    }
  }

  // 🛡️ 접근 제어 (Access Control based on Visibility)
  // 관리자(ADMIN)는 모든 프로젝트 열람 가능
  const isAdmin = currentUserRole === 'ADMIN' || currentUserEmail === 'worean@naver.com';

  if (!isAdmin && currentUserId) {
    // 사용자가 소속된 그룹 조회
    const userGroups = await prisma.groupMember.findMany({
      where: { userId: currentUserId },
      select: { groupId: true },
    });
    const groupIds = userGroups.map((g) => g.groupId);

    const accessCondition: any = {
      OR: [
        { visibility: 'PUBLIC' },
        {
          visibility: 'PROTECTED',
          OR: [
            { ownerId: currentUserId },
            { members: { some: { userId: currentUserId } } },
            ...(groupIds.length > 0 ? [{ groups: { some: { groupId: { in: groupIds } } } }] : []),
          ],
        },
        {
          visibility: 'PRIVATE',
          OR: [
            { ownerId: currentUserId },
            { members: { some: { userId: currentUserId } } },
          ],
        },
      ],
    };

    if (where.AND) {
      where.AND.push(accessCondition);
    } else {
      where.AND = [accessCondition];
    }
  } else if (!isAdmin && !currentUserId) {
    // 비로그인 사용자는 PUBLIC 프로젝트만 열람
    where.visibility = 'PUBLIC';
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
    'statusId',
    'visibility',
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

  const projects = await prisma.project.findMany({
    where,
    include: {
      owner: { select: { id: true, name: true, email: true, avatar: true, avatarColor: true } },
      members: { include: { user: { select: { id: true, name: true, email: true, avatar: true, avatarColor: true } } } },
      groups: { include: { group: { select: { id: true, name: true, code: true } } } },
      status: true,
      priority: true,
      tags: true,
      _count: { select: { issues: true, sprints: true } },
    },
    orderBy,
    take,
    skip,
  });

  if (!currentUserId) {
    return projects.map((p) => ({ ...p, isFavorite: false }));
  }

  const favList = await prisma.favorite.findMany({
    where: { userId: currentUserId, targetType: 'PROJECT' },
    select: { targetId: true },
  });
  const favSet = new Set(favList.map((f) => f.targetId));

  const listWithFav = projects.map((p) => ({
    ...p,
    isFavorite: favSet.has(p.id),
  }));

  // ⭐ 즐겨찾기 항목 최우선 상단 정렬
  listWithFav.sort((a, b) => {
    if (a.isFavorite === b.isFavorite) return 0;
    return a.isFavorite ? -1 : 1;
  });

  return listWithFav;
};
