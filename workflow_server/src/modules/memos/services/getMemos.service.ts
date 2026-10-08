import { prisma } from '#lib/prisma.js';

interface GetMemosOptions {
  workspaceId?: number;
  search?: string;
  filter?: 'all' | 'public' | 'my';
}

export const getMemosService = async (
  userId: number,
  options: GetMemosOptions = {}
) => {
  const workspaceId = options.workspaceId || 1;
  const { search, filter = 'all' } = options;

  // 기본 권한 규칙: 공개 메모이거나, 본인이 작성한 메모만 노출
  const baseCondition: any = {
    workspaceId,
    OR: [
      { isPublic: true },
      { authorId: userId },
    ],
  };

  if (filter === 'public') {
    baseCondition.isPublic = true;
    delete baseCondition.OR;
  } else if (filter === 'my') {
    baseCondition.authorId = userId;
    delete baseCondition.OR;
  }

  if (search && search.trim() !== '') {
    const q = search.trim();
    baseCondition.AND = [
      {
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { content: { contains: q, mode: 'insensitive' } },
        ],
      },
    ];
  }

  const memos = await prisma.memo.findMany({
    where: baseCondition,
    include: {
      author: {
        select: { id: true, name: true, email: true, avatar: true },
      },
      attachments: true,
    },
    orderBy: { updatedAt: 'desc' },
  });

  return memos;
};
