import { prisma } from '#lib/prisma.js';

export const deleteCommentService = async (id: number) => {
  if (!id) throw new Error('Comment ID is required');
  await prisma.comment.delete({ where: { id } });
  return { message: 'Comment deleted' };
};
