import { prisma } from '#lib/prisma.js';

export const deleteMemoAttachmentService = async (
  memoId: number,
  attachmentId: number,
  userId: number,
  workspaceId: number = 1
) => {
  const memo = await prisma.memo.findUnique({
    where: { id: memoId },
  });

  if (!memo || memo.workspaceId !== workspaceId) {
    const error = new Error('해당 메모를 찾을 수 없습니다.');
    (error as any).status = 404;
    throw error;
  }

  // 작성자만 첨부파일 삭제 가능
  if (memo.authorId !== userId) {
    const error = new Error('메모 작성자만 첨부파일을 삭제할 수 있습니다.');
    (error as any).status = 403;
    throw error;
  }

  const attachment = await prisma.memoAttachment.findUnique({
    where: { id: attachmentId },
  });

  if (!attachment || attachment.memoId !== memoId) {
    const error = new Error('해당 첨부파일을 찾을 수 없습니다.');
    (error as any).status = 404;
    throw error;
  }

  await prisma.memoAttachment.delete({
    where: { id: attachmentId },
  });

  return { success: true, deletedAttachmentId: attachmentId };
};
