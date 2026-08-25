import { prisma } from '#lib/prisma.js';

export const getCommentsService = async (issueId: number) => {
  if (!issueId) throw new Error('issueId is required');

  const rawComments = await prisma.comment.findMany({
    where: { issueId: Number(issueId) },
    include: {
      author: { select: { id: true, name: true, email: true, avatar: true, avatarColor: true } },
      mentions: { include: { user: { select: { id: true, name: true, avatar: true, avatarColor: true } } } },
      reactions: true,
      attachments: true
    },
    orderBy: { createdAt: 'asc' }
  });

  const commentMap = new Map<number, any>();
  const rootComments: any[] = [];
  const deletedParentsMap = new Map<number, any>();

  for (const c of rawComments) {
    commentMap.set(c.id, { ...c, children: [] });
  }

  for (const c of rawComments) {
    const current = commentMap.get(c.id);
    if (!c.parentId) {
      rootComments.push(current);
    } else {
      const parent = commentMap.get(c.parentId);
      if (parent) {
        parent.children.push(current);
      } else {
        // 상위 댓글 ID가 null도 아니면서 찾을 수 없는 경우 (상위 댓글이 삭제된 대댓글)
        let virtualParent = deletedParentsMap.get(c.parentId);
        if (!virtualParent) {
          virtualParent = {
            id: c.parentId,
            issueId: c.issueId,
            content: '삭제된 댓글입니다.',
            isDeletedParent: true,
            isInternal: false,
            authorId: 0,
            author: null,
            createdAt: c.createdAt,
            updatedAt: c.createdAt,
            parentId: null,
            children: [],
            mentions: [],
            reactions: [],
            attachments: []
          };
          deletedParentsMap.set(c.parentId, virtualParent);
          rootComments.push(virtualParent);
        }
        virtualParent.children.push(current);
      }
    }
  }

  rootComments.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  return rootComments;
};
