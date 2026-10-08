import { prisma } from '#lib/prisma.js';

export const getMemoByTitleService = async (
  title: string,
  userId: number,
  workspaceId: number = 1
) => {
  if (!title || title.trim() === '') {
    const error = new Error('검색할 메모 제목이 필요합니다.');
    (error as any).status = 400;
    throw error;
  }

  const memo = await prisma.memo.findFirst({
    where: {
      workspaceId,
      title: title.trim(),
      OR: [
        { isPublic: true },
        { authorId: userId },
      ],
    },
    include: {
      author: {
        select: { id: true, name: true, email: true, avatar: true },
      },
      attachments: true,
    },
    orderBy: { updatedAt: 'desc' },
  });

  if (!memo) {
    const error = new Error(`'@${title}' 메모를 찾을 수 없거나 접근 권한이 없습니다.`);
    (error as any).status = 404;
    throw error;
  }

  return memo;
};
