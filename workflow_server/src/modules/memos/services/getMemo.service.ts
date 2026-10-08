import { prisma } from '#lib/prisma.js';

export const getMemoService = async (
  memoId: number,
  userId: number,
  workspaceId: number = 1
) => {
  const memo = await prisma.memo.findUnique({
    where: { id: memoId },
    include: {
      author: {
        select: { id: true, name: true, email: true, avatar: true },
      },
      attachments: true,
    },
  });

  if (!memo || memo.workspaceId !== workspaceId) {
    const error = new Error('해당 메모를 찾을 수 없습니다.');
    (error as any).status = 404;
    throw error;
  }

  // 비공개 메모인데 작성자가 아닌 경우 접근 차단
  if (!memo.isPublic && memo.authorId !== userId) {
    const error = new Error('비공개 메모에 접근할 권한이 없습니다.');
    (error as any).status = 403;
    throw error;
  }

  return memo;
};
