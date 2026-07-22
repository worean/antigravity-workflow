import { prisma } from '#lib/prisma.js';

export const getIssueService = async (id: number) => {
  if (!id) throw new Error('Issue ID is required');
  const issue = await prisma.issue.findUnique({
    where: { id },
    include: {
      type: true,
      priority: true,
      status: true,
      assignee: { select: { id: true, name: true, email: true } },
      author: { select: { id: true, name: true, email: true } },
      project: true,
      sprint: true,
      milestone: true,
      children: { include: { status: true, priority: true, assignee: true } },
      parent: { select: { id: true, title: true, issueNumber: true } },
      attachments: true,
      watchers: { include: { user: { select: { id: true, name: true } } } },
      likes: { include: { user: { select: { id: true, name: true } } } },
      worklogs: { include: { user: { select: { id: true, name: true } } } },
      revisions: { orderBy: { createdAt: 'desc' } },
      histories: { orderBy: { createdAt: 'desc' } }
    }
  });

  if (!issue) throw new Error('Issue/Task not found');

  return {
    ...issue,
    customFields: issue.customFields ? JSON.parse(issue.customFields) : null
  };
};
