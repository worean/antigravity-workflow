// -*- coding: utf-8 -*-
import type { Comment } from '@/types';

/**
 * 특정 Issue에 대한 댓글 목록을 트리 구조로 색인 및 구성합니다.
 * 
 * [알고리즘 규칙]
 * 1. 상위 댓글(parentId가 없거나 0)은 최상위 댓글로 배치됩니다.
 * 2. 상위 댓글(parentId)이 존재하는 대댓글은 부모 댓글의 children 배열에 추가됩니다.
 * 3. 상위 Comment ID가 null도 아니면서 목록에서 부모 댓글을 찾을 수 없는 경우 (상위 댓글이 삭제된 대댓글):
 *    - 사라진 부모 댓글(isDeletedParent: true) 가상 플레이스홀더를 생성하여 최상위에 배치하고,
 *    - 해당 상위 ID를 가리키는 모든 대댓글들을 이 사라진 댓글 아래의 children으로 묶어서 표현합니다.
 * 4. 생성일자(createdAt) 오름차순으로 정렬합니다.
 */
export const organizeComments = (rawComments: Comment[]): Comment[] => {
  if (!Array.isArray(rawComments)) return [];

  // 1. 트리 또는 평탄화 배열로부터 모든 개별 댓글 추출 (중복 제거)
  const allCommentsMap = new Map<number, Comment>();

  const collectComments = (list: Comment[]) => {
    for (const item of list) {
      if (!item || !item.id) continue;
      if (!item.isDeletedParent) {
        allCommentsMap.set(item.id, {
          ...item,
          children: []
        });
      }
      if (Array.isArray(item.children) && item.children.length > 0) {
        collectComments(item.children);
      }
    }
  };

  collectComments(rawComments);

  const commentMap = new Map<number, Comment>();
  for (const [id, c] of allCommentsMap.entries()) {
    commentMap.set(id, { ...c, children: [] });
  }

  const rootComments: Comment[] = [];
  const deletedParentsMap = new Map<number, Comment>();

  for (const c of commentMap.values()) {
    if (!c.parentId) {
      // 일반 최상위 댓글
      rootComments.push(c);
    } else {
      const parent = commentMap.get(c.parentId);
      if (parent) {
        // 부모 댓글이 정상 존재하는 대댓글
        if (!parent.children) parent.children = [];
        parent.children.push(c);
      } else {
        // 상위 Comment ID가 null도 아니면서 찾을 수 없을 때 (상위 댓글이 삭제된 대댓글)
        let virtualParent = deletedParentsMap.get(c.parentId);
        if (!virtualParent) {
          virtualParent = {
            id: c.parentId,
            content: '삭제된 댓글입니다.',
            isDeletedParent: true,
            issueId: c.issueId,
            authorId: 0,
            author: null,
            createdAt: c.createdAt,
            parentId: null,
            children: [],
            reactions: []
          };
          deletedParentsMap.set(c.parentId, virtualParent);
          rootComments.push(virtualParent);
        }
        if (!virtualParent.children) virtualParent.children = [];
        virtualParent.children.push(c);
      }
    }
  }

  // 각 댓글의 children도 createdAt 순 정렬
  for (const c of rootComments) {
    if (c.children && c.children.length > 0) {
      c.children.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }
  }

  // 최상위 댓글 정렬
  rootComments.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  return rootComments;
};

/**
 * 삭제된 가상 부모 플레이스홀더를 제외한 실제 유효 댓글 총 개수를 계산합니다.
 */
export const countComments = (comments: Comment[]): number => {
  if (!Array.isArray(comments)) return 0;
  return comments.reduce((total, c) => {
    const parentCount = c.isDeletedParent ? 0 : 1;
    const childrenCount = (c.children || []).filter(sub => !sub.isDeletedParent).length;
    return total + parentCount + childrenCount;
  }, 0);
};