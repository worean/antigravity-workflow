import { prisma } from '#lib/prisma.js';

export interface PaginatedCommentsResult {
  items: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const getCommentsService = async (issueId: number, query: any = {}) => {
  if (!issueId) throw new Error('issueId is required');

  const {
    page: pageQuery,
    limit,
    pageSize,
    take: takeQuery,
    skip: skipQuery,
    offset,
    sortBy = 'createdAt',
    order = 'asc',
    sortOrder,
    all
  } = query;

  const rawComments = await prisma.comment.findMany({
    where: { issueId: Number(issueId) },
    include: {
      author: { select: { id: true, name: true, email: true, avatar: true, avatarColor: true } },
      mentions: { include: { user: { select: { id: true, name: true, avatar: true, avatarColor: true } } } },
      reactions: true,
      attachments: true
    },
    orderBy: { createdAt: 'asc' }
  });

  const commentMap = new Map<number, any>();
  const rootComments: any[] = [];
  const deletedParentsMap = new Map<number, any>();

  for (const c of rawComments) {
    commentMap.set(c.id, { ...c, children: [] });
  }

  for (const c of rawComments) {
    const current = commentMap.get(c.id);
    if (!c.parentId) {
      rootComments.push(current);
    } else {
      const parent = commentMap.get(c.parentId);
      if (parent) {
        parent.children.push(current);
      } else {
        // 상위 댓글 ID가 null도 아니면서 찾을 수 없는 경우 (상위 댓글이 삭제된 대댓글)
        let virtualParent = deletedParentsMap.get(c.parentId);
        if (!virtualParent) {
          virtualParent = {
            id: c.parentId,
            issueId: c.issueId,
            content: '삭제된 댓글입니다.',
            isDeletedParent: true,
            isInternal: false,
            authorId: 0,
            author: null,
            createdAt: c.createdAt,
            updatedAt: c.createdAt,
            parentId: null,
            children: [],
            mentions: [],
            reactions: [],
            attachments: []
          };
          deletedParentsMap.set(c.parentId, virtualParent);
          rootComments.push(virtualParent);
        }
        virtualParent.children.push(current);
      }
    }
  }

  // 정렬 처리
  const isDesc = (order || sortOrder || 'asc').toLowerCase() === 'desc';
  rootComments.sort((a, b) => {
    const timeA = new Date(a[sortBy] || a.createdAt).getTime();
    const timeB = new Date(b[sortBy] || b.createdAt).getTime();
    return isDesc ? timeB - timeA : timeA - timeB;
  });

  // 페이지네이션 처리 - 기본값: 루트 댓글 기준 페이지당 20개
  const totalCount = rootComments.length;
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

  let skip: number;
  if (skipQuery !== undefined || offset !== undefined) {
    skip = Math.max(0, Number(skipQuery ?? offset));
  } else if (take !== undefined) {
    skip = (page - 1) * take;
  } else {
    skip = 0;
  }

  const paginatedItems = take !== undefined
    ? rootComments.slice(skip, skip + take)
    : rootComments;

  const effectiveLimit = take ?? totalCount;
  const totalPages = effectiveLimit > 0 ? Math.ceil(totalCount / effectiveLimit) : 1;

  return {
    items: paginatedItems,
    total: totalCount,
    page,
    limit: effectiveLimit,
    totalPages
  };
};
