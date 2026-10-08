import { prisma } from '#lib/prisma.js';

export const deleteMemoService = async (
  memoId: number,
  userId: number,
  workspaceId: number = 1
) => {
  const existingMemo = await prisma.memo.findUnique({
    where: { id: memoId },
  });

  if (!existingMemo || existingMemo.workspaceId !== workspaceId) {
    const error = new Error('삭제할 메모를 찾을 수 없습니다.');
    (error as any).status = 404;
    throw error;
  }

  // 작성자만 삭제 가능
  if (existingMemo.authorId !== userId) {
    const error = new Error('메모를 삭제할 권한이 없습니다. (작성자 전용)');
    (error as any).status = 403;
    throw error;
  }

  await prisma.memo.delete({
    where: { id: memoId },
  });

  return { success: true, deletedId: memoId };
};
