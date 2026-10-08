import { prisma } from '#lib/prisma.js';

interface UpdateMemoInput {
  title?: string;
  content?: string;
  isPublic?: boolean;
}

export const updateMemoService = async (
  memoId: number,
  userId: number,
  data: UpdateMemoInput,
  workspaceId: number = 1
) => {
  const existingMemo = await prisma.memo.findUnique({
    where: { id: memoId },
  });

  if (!existingMemo || existingMemo.workspaceId !== workspaceId) {
    const error = new Error('수정할 메모를 찾을 수 없습니다.');
    (error as any).status = 404;
    throw error;
  }

  // 작성자만 수정 가능
  if (existingMemo.authorId !== userId) {
    const error = new Error('메모를 수정할 권한이 없습니다. (작성자 전용)');
    (error as any).status = 403;
    throw error;
  }

  const updateData: any = {};
  if (data.title !== undefined) updateData.title = data.title.trim();
  if (data.content !== undefined) updateData.content = data.content;
  if (data.isPublic !== undefined) updateData.isPublic = Boolean(data.isPublic);

  const updatedMemo = await prisma.memo.update({
    where: { id: memoId },
    data: updateData,
    include: {
      author: {
        select: { id: true, name: true, email: true, avatar: true },
      },
      attachments: true,
    },
  });

  return updatedMemo;
};
