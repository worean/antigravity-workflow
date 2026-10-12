import { prisma } from '#lib/prisma.js';

export const downloadMemoAttachmentService = async (
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

  // 비공개 메모는 작성자 본인만 다운로드 가능
  if (!memo.isPublic && memo.authorId !== userId) {
    const error = new Error('해당 메모 및 첨부파일에 접근할 권한이 없습니다.');
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

  return attachment;
};
