import { prisma } from '#lib/prisma.js';

export const createCommentService = async (data: any) => {
  const { issueId, authorId, content, parentId, isInternal, mentionedUserIds } = data;
  if (!issueId || !authorId || !content) throw new Error('issueId, authorId, and content are required');

  const comment = await prisma.comment.create({
    data: {
      issueId: Number(issueId),
      authorId: Number(authorId),
      content,
      parentId: parentId ? Number(parentId) : undefined,
      isInternal: Boolean(isInternal)
    }
  });

  if (Array.isArray(mentionedUserIds) && mentionedUserIds.length > 0) {
    await prisma.commentMention.createMany({
      data: mentionedUserIds.map((uId: number) => ({
        commentId: comment.id,
        userId: Number(uId)
      }))
    });
  }

  return comment;
};
