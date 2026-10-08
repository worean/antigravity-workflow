import { prisma } from '#lib/prisma.js';

interface CreateMemoInput {
  title: string;
  content?: string;
  isPublic?: boolean;
  workspaceId?: number;
}

export const createMemoService = async (
  input: CreateMemoInput,
  authorId: number
) => {
  if (!input.title || input.title.trim() === '') {
    const error = new Error('메모 제목은 필수입니다.');
    (error as any).status = 400;
    throw error;
  }

  const workspaceId = input.workspaceId || 1;

  const memo = await prisma.memo.create({
    data: {
      title: input.title.trim(),
      content: input.content || '',
      isPublic: Boolean(input.isPublic),
      workspaceId,
      authorId,
    },
    include: {
      author: {
        select: { id: true, name: true, email: true, avatar: true },
      },
      attachments: true,
    },
  });

  return memo;
};
