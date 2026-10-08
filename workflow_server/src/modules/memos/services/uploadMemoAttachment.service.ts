import { prisma } from '#lib/prisma.js';

interface MemoAttachmentInput {
  fileName: string;
  fileSize: number;
  fileUrl: string;
  fileType?: string;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB (5,242,880 bytes)

export const uploadMemoAttachmentService = async (
  memoId: number,
  userId: number,
  fileData: MemoAttachmentInput,
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

  // 작성자만 첨부파일 업로드 가능
  if (memo.authorId !== userId) {
    const error = new Error('메모 작성자만 첨부파일을 추가할 수 있습니다.');
    (error as any).status = 403;
    throw error;
  }

  // 5MB 용량 초과 검사
  if (fileData.fileSize > MAX_FILE_SIZE) {
    const error = new Error('첨부파일 크기는 최대 5MB(5,242,880 bytes)를 초과할 수 없습니다.');
    (error as any).status = 400;
    (error as any).code = 'FILE_TOO_LARGE';
    throw error;
  }

  const attachment = await prisma.memoAttachment.create({
    data: {
      memoId,
      fileName: fileData.fileName,
      fileSize: fileData.fileSize,
      fileUrl: fileData.fileUrl,
      fileType: fileData.fileType || null,
    },
  });

  return attachment;
};
