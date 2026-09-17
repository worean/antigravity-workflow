import { prisma, type PrismaTx } from '#lib/prisma.js';

export const getIssueService = async (
  id: number,
  currentUserId?: number,
  tx?: PrismaTx
) => {
  if (!id) throw new Error('Issue ID is required');
  const db = tx ?? prisma;
  const issue = await db.issue.findUnique({
    where: { id },
    include: {
      type: true,
      priority: true,
      status: true,
      assignee: { select: { id: true, name: true, email: true, avatar: true, avatarColor: true } },
      author: { select: { id: true, name: true, email: true, avatar: true, avatarColor: true } },
      project: true,
      sprint: true,
      milestone: true,
      children: { include: { status: true, priority: true, assignee: { select: { id: true, name: true, email: true, avatar: true, avatarColor: true } } } },
      parent: { select: { id: true, title: true, issueNumber: true } },
      attachments: true,
      tags: true,
      watchers: { include: { user: { select: { id: true, name: true, email: true, avatar: true, avatarColor: true } } } },
      likes: { include: { user: { select: { id: true, name: true, email: true, avatar: true, avatarColor: true } } } },
      worklogs: { include: { user: { select: { id: true, name: true, email: true, avatar: true, avatarColor: true } } } },
      revisions: { orderBy: { createdAt: 'desc' } },
      histories: { orderBy: { createdAt: 'desc' } },
      _count: { select: { comments: true, attachments: true, children: true, likes: true } }
    }
  });

  if (!issue) throw new Error('Issue/Task not found');

  const isLiked = currentUserId && Array.isArray(issue.likes)
    ? issue.likes.some((like: any) => like.userId === currentUserId)
    : false;

  const likesCount = issue._count?.likes ?? (Array.isArray(issue.likes) ? issue.likes.length : 0);
  const commentsCount = issue._count?.comments ?? 0;
  const attachmentsCount = issue._count?.attachments ?? (Array.isArray(issue.attachments) ? issue.attachments.length : 0);
  const childrenCount = issue._count?.children ?? (Array.isArray(issue.children) ? issue.children.length : 0);

  return {
    ...issue,
    isLiked,
    likesCount,
    commentsCount,
    attachmentsCount,
    childrenCount,
    customFields: issue.customFields ? JSON.parse(issue.customFields) : null
  };
};
